/* ============================================================
   fx.js — "DOPAMİN KATMANI" (window.FX)
   ============================================================
   Amaç: öğrenci her doğru hamlesinde ANINDA, görülebilir ve
   duyulabilir bir ödül alsın — tıklama dalgası, kıvılcım,
   konfeti, uçan +XP yazısı, seri (streak) rozeti, seviye
   atlama kutlaması ve Web Audio ile sentezlenen kısa sesler.

   Neden ayrı ve ortak bir dosya?
   - index.html (Ders 1.1), lesson-1-2.html (Ders 1.2) ve
     portal.html üçü de aynı efekt setini kullanıyor. Efektler
     her sayfaya kopyalansaydı mevcut kod tekrarı borcu daha da
     büyürdü; tek modül üç sayfada da paylaşılıyor.
   - Ses dosyası YOK: bütün sesler Web Audio API ile anlık
     sentezleniyor (0 KB indirme, gecikme yok, telifsiz).

   Tasarım kuralları:
   - Hiçbir mevcut elemanın layout'una dokunmaz. Parçacıklar
     body'ye eklenen tek bir `fixed` katmanda (.fx-layer) doğar.
   - Tarayıcılar ses çalmayı ilk kullanıcı hareketine kadar
     engeller; AudioContext ilk tıklamada uyandırılır.
   - `prefers-reduced-motion` açıksa parçacık/konfeti üretilmez
     (sesler ve XP çalışmaya devam eder).
   - Ses varsayılan olarak AÇIK, ama header'daki hoparlör
     düğmesiyle kapatılabilir ve tercih localStorage'da kalır
     (sınıf ortamında öğretmen tek tıkla susturabilsin).
   ============================================================ */

(function () {
  'use strict';

  // ---------- Ayarlar / kalıcı durum ----------
  var PREF_KEY   = 'fx_prefs_v1';     // { sound: true|false }
  var XP_KEY     = 'fx_xp_v1';        // toplam XP
  var CLAIM_KEY  = 'fx_claims_v1';    // bir kez verilen ödüllerin anahtarları
  var XP_PER_LEVEL = 100;

  var LEVEL_NAMES = [
    'Çırak Mucit',
    'Kıvılcım Avcısı',
    'Devre Kaşifi',
    'Kod Ustası',
    'Işık Mimarı',
    'Deneyap Kaptanı',
    // 7–10: kupa yolunun ilerisi (2026-09-30) — Modül 1 sonu ~Sv.6.
    'Sinyal Büyücüsü',
    'Atölye Şefi',
    'Mucitler Mucidi',
    'Deneyap Efsanesi'
  ];

  var PALETTE = ['#D6273A', '#1D4ED8', '#FFB627', '#2BB673', '#17B3A3', '#F5A524', '#FF8A3D'];

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function readJSON(key, fallback) {
    return window.Store ? Store.getJSON(key, fallback) : fallback;
  }
  function writeJSON(key, value) {
    if (window.Store) Store.setJSON(key, value);
  }

  var prefs  = readJSON(PREF_KEY, { sound: true });
  var xp     = parseInt(readJSON(XP_KEY, 0), 10) || 0;
  var claims = readJSON(CLAIM_KEY, {}) || {};

  // ============================================================
  // 1. SES MOTORU (Web Audio — dosyasız, sentezlenmiş)
  // ============================================================
  var ctx = null;
  var MASTER = 0.9;

  function audio() {
    if (!prefs.sound) return null;
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  /* ---- Sentez motoru ------------------------------------------------
     Arda: "ses efektleri ... çok AI slop gibi, daha farklı, dikkat çekici
     yapabilir misin." Eski palet 14 sesin hepsini TEK osilatörle, aynı
     majör arpej kalıbıyla çalıyordu: telefon zil sesi jeneriği. Yenisi
     tek bir CİHAZ gibi duyulsun diye her ses üç katmandan kuruluyor:
       gövde — alçak, hızla düşen bir ton (nesnenin ağırlığı)
       tını  — hafif detune edilmiş ikinci osilatör (tek osilatör
               "sentetik", iki osilatör "gerçek cisim" duyuluyor)
       doku  — süzgeçten geçmiş gürültü (tahta, toz, klik, hava)
     Zarf da değişti: 2 ms'lik sert atak + üstel sönüm = vurmalı ses.
     Eski 12 ms'lik atak her sesi "biiip"e çeviriyordu. */

  /* Gürültü kaynağı bir kez üretilip tekrar tekrar kullanılıyor —
     her ses için 0.5 sn'lik tampon doldurmak boşa iş. */
  var noiseBuf = null;
  function noiseBuffer(c) {
    if (noiseBuf) return noiseBuf;
    var n = Math.floor(c.sampleRate * 0.5);
    noiseBuf = c.createBuffer(1, n, c.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  function envelope(c, g, t0, dur, peak, attack) {
    var a = attack == null ? 0.002 : attack;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }

  /* Tek ton: f = frekans, to = kayacağı frekans, d = süre (sn),
     g = seviye, t = gecikme, type = dalga, detune = ikinci osilatörün
     sapması (sent), lp/lpTo = alçak geçiren süzgecin süpürmesi. */
  function tone(o) {
    var c = audio();
    if (!c) return;
    var t0 = c.currentTime + (o.t || 0);
    var dur = o.d || 0.12;
    var peak = (o.g == null ? 0.10 : o.g) * MASTER;
    var gain, osc, osc2, filt;
    try {
      gain = c.createGain();
      osc = c.createOscillator();
    } catch (e) { return; }

    function kur(od) {
      od.type = o.type || 'triangle';
      od.frequency.setValueAtTime(o.f, t0);
      if (o.to) {
        try {
          if (o.glide === 'lin') od.frequency.linearRampToValueAtTime(o.to, t0 + (o.gd || dur));
          else od.frequency.exponentialRampToValueAtTime(o.to, t0 + (o.gd || dur));
        } catch (e) {}
      }
      od.connect(gain);
      od.start(t0);
      od.stop(t0 + dur + 0.04);
    }

    if (o.lp) {
      try {
        filt = c.createBiquadFilter();
        filt.type = 'lowpass';
        filt.Q.value = o.q == null ? 0.7 : o.q;
        filt.frequency.setValueAtTime(o.lp, t0);
        if (o.lpTo) { try { filt.frequency.exponentialRampToValueAtTime(o.lpTo, t0 + dur); } catch (e) {} }
        gain.connect(filt);
        filt.connect(c.destination);
      } catch (e) { gain.connect(c.destination); }
    } else {
      gain.connect(c.destination);
    }

    envelope(c, gain, t0, dur, peak, o.a);
    kur(osc);
    if (o.detune) {
      try {
        osc2 = c.createOscillator();
        osc2.detune.setValueAtTime(o.detune, t0);
        kur(osc2);
      } catch (e) {}
    }
  }

  /* Doku katmanı: gürültü + süzgeç süpürmesi. filter = lowpass /
     bandpass / highpass, f→to = süzgecin gezdiği aralık, q = darlık. */
  function noise(o) {
    var c = audio();
    if (!c) return;
    var t0 = c.currentTime + (o.t || 0);
    var dur = o.d || 0.08;
    var peak = (o.g == null ? 0.05 : o.g) * MASTER;
    var src, filt, gain;
    try {
      src = c.createBufferSource();
      filt = c.createBiquadFilter();
      gain = c.createGain();
    } catch (e) { return; }
    src.buffer = noiseBuffer(c);
    src.loop = true;
    filt.type = o.filter || 'lowpass';
    filt.Q.value = o.q == null ? 1 : o.q;
    filt.frequency.setValueAtTime(o.f || 1200, t0);
    if (o.to) { try { filt.frequency.exponentialRampToValueAtTime(o.to, t0 + dur); } catch (e) {} }
    envelope(c, gain, t0, dur, peak, o.a);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(c.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.04);
  }

  /* ---- Palet ---------------------------------------------------------
     Aynı atölyede geçiyor: tahta tezgah (tok, alçak), küçük metal parça
     (kısa tın) ve hava/toz (gürültü). Ödül sesleri diğerlerinden YÜKSEK
     ve UZUN; gezinme sesleri kısa ve kısık — ses ödül anına saklanır
     (bkz. Kurallar.md). */
  var SOUNDS = {
    /* Gezinme sesleri: parmak ucuyla tahtaya dokunmak gibi. */
    tap:     [{ kind: 'noise', filter: 'lowpass', f: 1600, to: 700, d: 0.035, g: 0.020, q: 0.8 },
              { f: 330, to: 250, type: 'sine', d: 0.05, g: 0.020 }],
    tick:    [{ kind: 'noise', filter: 'bandpass', f: 2600, d: 0.016, g: 0.028, q: 3 }],
    copy:    [{ kind: 'noise', filter: 'highpass', f: 2400, d: 0.02, g: 0.018 },
              { f: 1046, type: 'triangle', detune: 7, d: 0.05, g: 0.045, lp: 3200 },
              { f: 1568, t: 0.055, type: 'triangle', detune: 7, d: 0.12, g: 0.045, lp: 4200 }],
    /* Adım geçişi: çekmecenin açılması (hava + yükselen gövde). */
    step:    [{ kind: 'noise', filter: 'bandpass', f: 500, to: 2000, d: 0.13, g: 0.020, q: 1.2 },
              { f: 392, to: 587, type: 'triangle', detune: 6, d: 0.14, g: 0.055, lp: 1800, lpTo: 3400 }],
    back:    [{ kind: 'noise', filter: 'bandpass', f: 1800, to: 500, d: 0.12, g: 0.018, q: 1.2 },
              { f: 523, to: 392, type: 'triangle', detune: 6, d: 0.13, g: 0.045, lp: 3000, lpTo: 1400 }],
    xp:      [{ kind: 'noise', filter: 'highpass', f: 3200, d: 0.015, g: 0.016 },
              { f: 880, to: 1318, type: 'triangle', detune: 9, d: 0.09, g: 0.048, lp: 5000 }],
    correct: [{ f: 659, type: 'triangle', detune: 7, d: 0.14, g: 0.070, lp: 2600, lpTo: 4200 },
              { f: 988, t: 0.075, type: 'triangle', detune: 7, d: 0.22, g: 0.072, lp: 3000, lpTo: 5200 },
              { kind: 'noise', filter: 'highpass', f: 3600, d: 0.03, g: 0.013 }],
    /* Yanlış cevap CEZALANDIRMAZ: eski testere dalgası tiz ve sertti,
       çocuk yanıldığında ceza zili duymamalı. Artık tok bir "tuk" —
       kapalı kapıya hafifçe çarpmak. */
    wrong:   [{ f: 196, to: 98, type: 'sine', d: 0.20, g: 0.075, glide: 'lin' },
              { kind: 'noise', filter: 'lowpass', f: 700, to: 200, d: 0.07, g: 0.028 }],
    /* Uyarı: tahtaya iki kere vurmak. "Dur, buraya bak" demek için
       melodi gerekmiyor; ritim daha hızlı anlaşılıyor. */
    warn:    [{ kind: 'noise', filter: 'bandpass', f: 1000, d: 0.035, g: 0.048, q: 5 },
              { f: 210, to: 150, type: 'sine', d: 0.08, g: 0.055 },
              { kind: 'noise', filter: 'bandpass', f: 900, t: 0.14, d: 0.035, g: 0.048, q: 5 },
              { f: 190, to: 130, t: 0.14, type: 'sine', d: 0.09, g: 0.050 }],
    /* Kilit: mandalın klik'i, sonra tek bir tını. Eski hâli dört notalı
       bir arpejdi — kapı açılmıyor, şarkı çalıyordu. */
    unlock:  [{ kind: 'noise', filter: 'bandpass', f: 2200, d: 0.03, g: 0.048, q: 6 },
              { f: 240, to: 120, type: 'sine', d: 0.10, g: 0.065 },
              { f: 1318, t: 0.085, type: 'triangle', detune: 5, d: 0.32, g: 0.048, lp: 4000 }],
    discover:[{ f: 1568, type: 'triangle', detune: 5, d: 0.26, g: 0.042, lp: 4600 },
              { kind: 'noise', filter: 'highpass', f: 4000, d: 0.02, g: 0.011 }],
    levelup: [{ f: 784, type: 'triangle', detune: 6, d: 0.12, g: 0.058, lp: 2400, lpTo: 4000 },
              { f: 1046, t: 0.10, type: 'triangle', detune: 6, d: 0.12, g: 0.058, lp: 3000, lpTo: 4800 },
              { f: 1568, t: 0.20, type: 'triangle', detune: 6, d: 0.42, g: 0.062, lp: 3600, lpTo: 6000 },
              { kind: 'noise', filter: 'bandpass', f: 800, to: 4000, d: 0.30, g: 0.018, q: 1 }],
    /* DAMGA (Arda'nın seçimi): rozet ekrana mühür gibi iniyor. Tok bir
       "TAK" — ağır gövde + toz — ve arkasından kısa bir metal tını.
       Fanfar YOK: ağırlık, melodiden daha çok "bu önemliydi" diyor. */
    badge:   [{ f: 220, to: 60, type: 'sine', d: 0.45, g: 0.16, glide: 'lin' },
              { f: 130, to: 52, type: 'triangle', d: 0.30, g: 0.09, glide: 'lin' },
              { kind: 'noise', filter: 'lowpass', f: 1400, to: 180, d: 0.28, g: 0.070 },
              { kind: 'noise', filter: 'bandpass', f: 2600, d: 0.04, g: 0.048, q: 4 },
              { f: 1318, t: 0.05, type: 'triangle', detune: 8, d: 0.75, g: 0.048, lp: 3800 },
              { f: 1979, t: 0.05, type: 'triangle', detune: 12, d: 0.55, g: 0.030, lp: 5200 }],
    whoosh:  [{ kind: 'noise', filter: 'bandpass', f: 300, to: 2600, d: 0.24, g: 0.038, q: 0.9 }]
  };

  function sound(name) {
    var seq = SOUNDS[name];
    if (!seq) return;
    for (var i = 0; i < seq.length; i++) {
      if (seq[i].kind === 'noise') noise(seq[i]);
      else tone(seq[i]);
    }
  }

  function vibrate(pattern) {
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
  }

  // ============================================================
  // 2. PARÇACIK / EFEKT KATMANI
  // ============================================================
  var _layer = null;
  function layer() {
    if (_layer && document.body.contains(_layer)) return _layer;
    _layer = document.createElement('div');
    _layer.className = 'fx-layer';
    _layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(_layer);
    return _layer;
  }

  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  /* Hedefi (element / {x,y} / event) ekran koordinatına çevirir. */
  function pointOf(target) {
    if (!target) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    if (typeof target.x === 'number' && typeof target.y === 'number') return target;
    if (target.clientX != null) return { x: target.clientX, y: target.clientY };
    if (target.getBoundingClientRect) {
      var r = target.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  function animate(el, frames, opts) {
    if (!el.animate) { el.remove(); return; }
    var a = el.animate(frames, opts);
    a.onfinish = function () { el.remove(); };
    a.oncancel = function () { el.remove(); };
  }

  /* Emoji yerine Blender render'ı (blender/fx.py → assets/img/fx). Emoji
     işletim sisteminin çizimi, her cihazda farklı ve Arda'nın deyişiyle
     "emoji gibi duruyor". Çağıranlar emoji vermeye devam eder; eşlemesi
     olmayan emoji eskisi gibi yazı olarak düşer. */
  var FX_RESIM = {
    '⭐': 'yildiz', '✨': 'pirilti', '🎉': 'konfeti', '🔓': 'kilit', '✅': 'tik',
    '💡': 'ampul', '🧠': 'ampul', '🛠️': 'alet', '🔥': 'alev', '👁️': 'pirilti',
    '⚡': 'simsek', '🎬': 'yildiz', '🏅': 'madalya'
  };
  function motif(emoji) {
    var ad = FX_RESIM[emoji];
    return ad ? '<img src="assets/img/fx/fx-' + ad + '.webp" alt="" draggable="false">' : emoji;
  }

  /* Tek parçacık: (x,y)'den hız vektörüyle fırlar, yerçekimiyle düşer. */
  function particle(x, y, o) {
    var p = document.createElement('div');
    var cls = 'fx-particle';
    if (o.emoji) cls += ' star';
    else if (Math.random() > 0.5) cls += ' round';
    p.className = cls;

    if (o.emoji) {
      if (FX_RESIM[o.emoji]) { p.classList.add('resim'); p.innerHTML = motif(o.emoji); }
      else p.textContent = o.emoji;
    }
    else p.style.background = o.color || pick(PALETTE);

    if (o.size) { p.style.width = o.size + 'px'; p.style.height = o.size + 'px'; }
    layer().appendChild(p);

    var dur = o.duration || rand(750, 1500);
    var rot = rand(-540, 540);
    var midX = x + o.vx * 0.55;
    var midY = y + o.vy * 0.55 + o.gravity * 0.30;
    var endX = x + o.vx + rand(-18, 18);
    var endY = y + o.vy + o.gravity;

    animate(p, [
      { transform: 'translate(' + x + 'px,' + y + 'px) rotate(0deg) scale(1)', opacity: 1 },
      { transform: 'translate(' + midX + 'px,' + midY + 'px) rotate(' + (rot * 0.55) + 'deg) scale(1.05)', opacity: 1, offset: 0.55 },
      { transform: 'translate(' + endX + 'px,' + endY + 'px) rotate(' + rot + 'deg) scale(0.65)', opacity: 0 }
    ], { duration: dur, easing: 'cubic-bezier(.12,.62,.38,1)', fill: 'forwards' });
  }

  /* Bir noktadan dışa doğru kıvılcım patlaması. */
  function burst(target, o) {
    if (reduced) return;
    o = o || {};
    var pt = pointOf(target);
    var n = o.count || 14;
    var power = o.power || 130;
    var spread = o.spread == null ? Math.PI * 2 : o.spread;
    var base = o.angle == null ? 0 : o.angle;
    for (var i = 0; i < n; i++) {
      var a = base + (spread === Math.PI * 2 ? (i / n) * Math.PI * 2 : rand(base - spread / 2, base + spread / 2));
      var v = power * rand(0.55, 1.25);
      particle(pt.x, pt.y, {
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        gravity: o.gravity == null ? rand(60, 190) : o.gravity,
        color: o.color,
        size: o.size,
        emoji: o.emojis ? pick(o.emojis) : null,
        duration: o.duration
      });
    }
  }

  /* Ekranın üstünden yağan konfeti + iki yandan havai fişek. */
  function confetti(o) {
    if (reduced) return;
    o = o || {};
    var n = o.count || 90;
    var W = window.innerWidth, H = window.innerHeight;

    for (var i = 0; i < n; i++) {
      var x = rand(0, W);
      particle(x, rand(-60, -10), {
        vx: rand(-70, 70),
        vy: rand(60, 140),
        gravity: H + rand(60, 260),
        color: pick(o.colors || PALETTE),
        emoji: (o.emojis && Math.random() < 0.22) ? pick(o.emojis) : null,
        duration: rand(1800, 3200)
      });
    }

    if (o.cannons !== false) {
      burst({ x: 20, y: H - 20 }, { count: 22, power: 620, spread: 1.0, angle: -Math.PI / 3, gravity: rand(320, 520), duration: 1700 });
      burst({ x: W - 20, y: H - 20 }, { count: 22, power: 620, spread: 1.0, angle: -Math.PI * 2 / 3, gravity: rand(320, 520), duration: 1700 });
    }
  }

  /* Tıklama noktasında genişleyen halka. */
  function ripple(x, y, variant) {
    if (reduced) return;
    var r = document.createElement('div');
    r.className = 'fx-ripple' + (variant ? ' ' + variant : '');
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    document.body.appendChild(r);
    animate(r, [
      { transform: 'scale(0.4)', opacity: 0.85 },
      { transform: 'scale(5.5)', opacity: 0 }
    ], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
  }

  /* Elemanın çevresinde tek seferlik büyüyen halka (başarı vurgusu). */
  function ring(target, variant) {
    if (reduced) return;
    var pt = pointOf(target);
    var el = document.createElement('div');
    el.className = 'fx-ring' + (variant ? ' ' + variant : '');
    var size = 40;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = (pt.x - size / 2) + 'px';
    el.style.top = (pt.y - size / 2) + 'px';
    document.body.appendChild(el);
    animate(el, [
      { transform: 'scale(0.5)', opacity: 0.9 },
      { transform: 'scale(3.4)', opacity: 0 }
    ], { duration: 680, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
  }

  /* Yukarı süzülen "+10 XP" yazısı. */
  function floatText(target, text, variant) {
    if (reduced) return;
    var pt = pointOf(target);
    var el = document.createElement('div');
    el.className = 'fx-float' + (variant ? ' ' + variant : '');
    el.textContent = text;
    el.style.left = pt.x + 'px';
    el.style.top = pt.y + 'px';
    document.body.appendChild(el);
    animate(el, [
      { transform: 'translate(-50%,-50%) scale(0.6)', opacity: 0 },
      { transform: 'translate(-50%,-130%) scale(1.15)', opacity: 1, offset: 0.28 },
      { transform: 'translate(-50%,-320%) scale(1)', opacity: 0 }
    ], { duration: 1150, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
  }

  /* Tüm ekranda kısa renkli parlama. */
  function flash(variant) {
    if (reduced) return;
    var el = document.createElement('div');
    el.className = 'fx-flash' + (variant ? ' ' + variant : '');
    document.body.appendChild(el);
    animate(el, [{ opacity: 0 }, { opacity: 1, offset: 0.18 }, { opacity: 0 }],
      { duration: 620, easing: 'ease-out', fill: 'forwards' });
  }

  function pop(el, strength) {
    if (!el || reduced || !el.animate) return;
    var s = strength || 1.16;
    el.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(' + s + ')', offset: 0.45 },
      { transform: 'scale(1)' }
    ], { duration: 420, easing: 'cubic-bezier(.34,1.7,.5,1)' });
  }

  function shake(el) {
    if (!el || reduced || !el.animate) return;
    el.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-7px)', offset: 0.2 },
      { transform: 'translateX(7px)', offset: 0.45 },
      { transform: 'translateX(-4px)', offset: 0.7 },
      { transform: 'translateX(0)' }
    ], { duration: 420, easing: 'cubic-bezier(.36,.07,.19,.97)' });
  }

  /* ---------- Eleman üzerinde vurgu (WAAPI) ----------
     ÖNEMLİ: bu vurgular CSS sınıfı + @keyframes ile YAPILMAZ.
     Sayfadaki birçok eleman (`.quiz-option`, `.lesson-item`,
     `.step-card`, `.ai-prompt-card`) `opacity: 0` ile başlayıp bir
     giriş animasyonuyla görünür oluyor; aynı elemana ikinci bir CSS
     `animation` yazmak o girişi ezer ve eleman KALICI OLARAK GÖRÜNMEZ
     kalır (2026-08-28: doğru quiz şıkkı böyle kaybolmuştu).
     element.animate() ise CSS animasyonunu ezmeden üstüne biner. */
  function emphasize(el, frames, dur, easing) {
    if (!el || reduced || !el.animate) return;
    el.animate(frames, {
      duration: dur || 600,
      easing: easing || 'cubic-bezier(.34,1.6,.5,1)'
    });
  }

  /* Adım noktası: kısa bir zıplama. */
  function hit(el) {
    emphasize(el, [
      { transform: 'scale(1)' },
      { transform: 'scale(1.9)', offset: 0.45 },
      { transform: 'scale(1)' }
    ], 500);
  }

  /* Kutuyu yeşil/altın bir halkayla flaşlatır. */
  function flashRing(el, rgb) {
    emphasize(el, [
      { boxShadow: '0 0 0 0 rgba(' + rgb + ',0.55)' },
      { boxShadow: '0 0 0 14px rgba(' + rgb + ',0)' }
    ], 620, 'ease-out');
  }

  /* Arka planı bir an için koyulaştırıp normale döner — "bu metin değişti".
     Bitiş karesi elemanın kendi CSS rengiyle aynı olmalı, yoksa animasyon
     biterken tek karelik bir sıçrama olur. */
  function highlight(el, from, to) {
    emphasize(el, [
      { backgroundColor: from || 'rgba(43,182,115,0.45)' },
      { backgroundColor: to || 'rgba(43,182,115,0.15)' }
    ], 850, 'ease-out');
  }

  /* Geriye dönük uyumluluk: CSS sınıfını söküp takar.
     Yeni kodda kullanma — yukarıdaki uyarıya bak. */
  function replay(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, ms || 900);
  }

  // ============================================================
  // 3. BÜYÜK KUTLAMA PERDESİ
  // ============================================================
  var celebrating = false;

  /* Kutlama artık DAMGA (Arda: "rozet ağırlıkla ekrana mühür gibi
     insin, ekran titresin, toz kalksın"). Kalkanlar ve nedenleri:
       dönen konik ışınlar — üretilmiş kutlama ekranlarının ortak imzası,
         anlamı yok, kart/atölye dünyasıyla ilgisi yok;
       çıplak emoji       — işletim sisteminin çizdiği rozet; artık kilden
         bir damga başlığının İÇİNDE motif olarak duruyor;
       emoji konfeti + altın flaş — her kutlamada aynı, gürültü.
     Yerine tek bir fiziksel olay var: ağır bir nesne düşer, vurur,
     ekran sarsılır, toz kalkar, yazı ondan SONRA gelir. */
  /* 3B ödül nesneleri (2026-10-05, blender/efekt3b.py): rozet = dönerek
     gelen altın madalya, seviye = kupa. Nesnenin kendi dönüşü Blender
     karelerinde (bir kez oynayan animasyonlu WebP); ekrandaki yol (yükselip
     yerine oturma) CSS. Hareket kapalıyken son pozun durağan hali. */
  var NESNE_3B = { '🏅': 'madalya', '⚡': 'kupa' }, nesneSayac = 0;
  /* `yol` (2026-10-08): derse özel rozet, ör. 'rozet/ders-1-6'
     (blender/ders-rozet.py). Verilmezse emojinin genel nesnesi. */
  function nesne3b(emoji, yol) {
    var ad = NESNE_3B[emoji] || (yol ? 'madalya' : null);
    if (!ad) return null;
    var kok = 'assets/img/' + (yol || 'fx/' + ad);
    var src = reduced ? kok + '.webp' : kok + '-don.webp#' + (++nesneSayac);
    return '<img class="fx-nesne fx-nesne-' + ad + '" src="' + src + '" alt="" draggable="false">';
  }

  function celebrate(o) {
    o = o || {};
    if (celebrating) return;
    celebrating = true;

    var uc = nesne3b(o.emoji || '🏅', o.nesne);
    var wrap = document.createElement('div');
    wrap.className = 'fx-celebrate' + (uc ? ' fx-3b' : '');
    wrap.innerHTML =
      '<div class="fx-stamp">' +
      '<div class="fx-stamp-disc"><span class="fx-stamp-motif">' + (uc || motif(o.emoji || '🏅')) + '</span></div>' +
      '<div class="fx-stamp-shadow"></div>' +
      '</div>' +
      '<div class="fx-celebrate-title">' + (o.title || 'Tebrikler!') + '</div>' +
      (o.sub ? '<div class="fx-celebrate-sub">' + o.sub + '</div>' : '') +
      '<div class="fx-celebrate-hint">Devam etmek için ekrana dokun</div>';
    document.body.appendChild(wrap);

    /* Ses, sarsıntı ve toz DÜŞÜŞÜN SONUNDA: vuruş anı. CSS'teki düşüş
       420 ms sürüyor; hareket kapalıysa düşüş de yok, vuruş hemen. */
    var vurus = reduced ? 0 : 420;
    setTimeout(function () {
      if (!document.body.contains(wrap)) return;
      sound(o.sound || 'badge');
      vibrate([45, 30, 18]);
      wrap.classList.add('hit');
      if (!reduced) {
        shakeScreen();
        layer().classList.add('above');
        if (uc) {
          // 3B nesnede toz yerine Blender pırıltıları çevresinden saçılır.
          var disk = wrap.querySelector('.fx-stamp-disc');
          burst(disk, { count: 16, power: 230, gravity: 40, emojis: ['✨', '⭐'], size: 26, duration: 1300 });
        } else dust(wrap.querySelector('.fx-stamp-disc'), o.confetti);
      }
    }, vurus);

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      celebrating = false;
      wrap.classList.add('leaving');
      layer().classList.remove('above');
      setTimeout(function () { wrap.remove(); }, 380);
    }
    wrap.addEventListener('click', close);
    setTimeout(close, (o.duration || 3400) + vurus);
  }

  /* Kamera sarsıntısı: damga ağır, ekran onu hissetsin. Gövde en fazla
     5 px oynuyor — daha fazlası sayfayı "bozuk" gösteriyor ve yatay
     kaydırma çubuğu doğuruyor. */
  function shakeScreen() {
    var b = document.body;
    if (!b || !b.animate) return;
    b.animate([
      { transform: 'translate3d(0,0,0)' },
      { transform: 'translate3d(0,5px,0)', offset: 0.12 },
      { transform: 'translate3d(-3px,-2px,0)', offset: 0.32 },
      { transform: 'translate3d(2px,2px,0)', offset: 0.54 },
      { transform: 'translate3d(-1px,0,0)', offset: 0.76 },
      { transform: 'translate3d(0,0,0)' }
    ], { duration: 420, easing: 'ease-out' });
  }

  /* Damganın altından iki yana savrulan toz. Konfeti değil: renkleri
     tezgahın kendi renkleri, yukarı fırlamıyor, yayılıp çöküyor. */
  function dust(el, yogunluk) {
    if (reduced || !el) return;
    var r = el.getBoundingClientRect();
    var pt = { x: r.left + r.width / 2, y: r.bottom - 8 };
    /* Toz YAKINDA kalır: ilk denemede parçacıklar ekranın yarısını
       geçip konfetiye benziyordu. Alçak hız + kısa ömür = damganın
       dibinden kalkıp hemen çöken bir bulut. */
    var n = Math.max(10, Math.round((yogunluk || 120) / 6));
    burst(pt, { count: n, power: 195, spread: Math.PI * 0.55, angle: Math.PI,
      gravity: 95, color: '#E4D5BC', size: 9, duration: 780 });
    burst(pt, { count: n, power: 195, spread: Math.PI * 0.55, angle: 0,
      gravity: 95, color: '#F6ECD9', size: 8, duration: 780 });
  }

  // ============================================================
  // 4. XP / SEVİYE / SERİ HUD'U
  // ============================================================
  var hud = null, hudValue = null, hudLevel = null, hudFill = null, hudChip = null,
      hudStreak = null, hudSoundBtn = null;

  function levelOf(points) {
    return Math.floor(points / XP_PER_LEVEL) + 1;
  }
  function levelName(lv) {
    return LEVEL_NAMES[Math.min(lv - 1, LEVEL_NAMES.length - 1)];
  }

  var SPEAKER_ON  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a9 9 0 0 1 0 12"/></svg>';
  var SPEAKER_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="m17 9 4 6M21 9l-4 6"/></svg>';

  function buildHud() {
    if (hud) return;
    hud = document.createElement('div');
    hud.className = 'fx-hud';
    hud.innerHTML =
      '<span class="fx-streak" id="fxStreak"></span>' +
      '<div class="fx-hud-xp" id="fxXpChip" role="button" tabindex="0" title="Kupa yolu: seviyeler ve ödüller">' +
        '<svg class="fx-hud-bolt" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>' +
        '<span class="fx-hud-meta">' +
          '<span class="fx-hud-level" id="fxLevel"></span>' +
          '<span class="fx-hud-value" id="fxXpValue"></span>' +
        '</span>' +
        '<span class="fx-hud-track"><span class="fx-hud-fill" id="fxXpFill"></span></span>' +
      '</div>' +
      '<button class="fx-hud-sound" id="fxSoundBtn" type="button" aria-label="Sesi aç/kapat"></button>';

    var header = document.querySelector('.header-bar');
    if (header) header.appendChild(hud);
    else {
      hud.style.position = 'fixed';
      hud.style.top = '10px';
      hud.style.right = '14px';
      hud.style.zIndex = '9100';
      document.body.appendChild(hud);
    }

    hudChip     = hud.querySelector('#fxXpChip');
    hudValue    = hud.querySelector('#fxXpValue');
    hudLevel    = hud.querySelector('#fxLevel');
    hudFill     = hud.querySelector('#fxXpFill');
    hudStreak   = hud.querySelector('#fxStreak');
    hudSoundBtn = hud.querySelector('#fxSoundBtn');
    // Tema düğmesi (assets/js/tema.js) ses düğmesinin soluna.
    if (window.Tema) hud.insertBefore(Tema.dugme(), hudSoundBtn);
    // Yönetici düğmesi (assets/js/yonetici.js) yalnız yönetici hesabında.
    if (window.Yonetici && Yonetici.hesap()) hud.insertBefore(Yonetici.dugme(), hud.querySelector('#temaBtn') || hudSoundBtn);

    // XP kutusu kupa yolunu açar (assets/js/seviye-yolu.js).
    function yolAc(e) { e.stopPropagation(); if (window.SeviyeYolu) SeviyeYolu.ac(); }
    hudChip.addEventListener('click', yolAc);
    hudChip.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); yolAc(e); } });

    hudSoundBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      prefs.sound = !prefs.sound;
      writeJSON(PREF_KEY, prefs);
      paintSoundBtn();
      if (prefs.sound) sound('unlock');
    });

    paintSoundBtn();
    paintHud(false);
  }

  function paintSoundBtn() {
    if (!hudSoundBtn) return;
    hudSoundBtn.innerHTML = prefs.sound ? SPEAKER_ON : SPEAKER_OFF;
    hudSoundBtn.classList.toggle('muted', !prefs.sound);
    hudSoundBtn.title = prefs.sound ? 'Sesi kapat' : 'Sesi aç';
  }

  function paintHud(animateCount) {
    if (!hudValue) return;
    var lv = levelOf(xp);
    hudLevel.textContent = 'Sv.' + lv + ' · ' + levelName(lv);
    hudFill.style.width = ((xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100) + '%';

    if (!animateCount || reduced) { hudValue.textContent = xp + ' XP'; return; }

    // Sayacı hedefe doğru kısa bir animasyonla saydır.
    var from = parseInt((hudValue.textContent || '0').replace(/\D/g, ''), 10) || 0;
    var start = performance.now(), dur = 520;
    (function tickCount(now) {
      var k = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      hudValue.textContent = Math.round(from + (xp - from) * eased) + ' XP';
      if (k < 1) requestAnimationFrame(tickCount);
    })(start);
  }

  function award(amount, label, anchor) {
    if (!amount) return;
    var before = levelOf(xp);
    xp += amount;
    writeJSON(XP_KEY, xp);

    buildHud();
    paintHud(true);
    if (hudChip) {
      hudChip.classList.add('bump');
      setTimeout(function () { hudChip.classList.remove('bump'); }, 260);
    }

    floatText(anchor || hudChip, '+' + amount + (label ? ' ' + label : ' XP'));
    sound('xp');

    var after = levelOf(xp);
    if (after > before) {
      setTimeout(function () {
        celebrate({
          emoji: '⚡',
          title: 'Seviye ' + after + '!',
          sub: 'Artık bir <strong>' + levelName(after) + '</strong>sın. Böyle devam!',
          sound: 'levelup',
          confetti: 110,
          duration: 3000
        });
      }, 420);
    }
  }

  /* Aynı ödülü tekrar tekrar toplamayı engeller (adımlar arasında
     ileri-geri gidip XP biriktirilmesin diye). */
  function awardOnce(key, amount, label, anchor) {
    if (!key) return false;
    if (claims[key]) return false;
    claims[key] = 1;
    writeJSON(CLAIM_KEY, claims);
    award(amount, label, anchor);
    return true;
  }

  // ---------- Seri (streak) ----------
  var streak = 0, streakTimer = null;

  function streakHit() {
    streak++;
    if (streak >= 2) {
      buildHud();
      /* "seri" kelimesi artık haftalık serinin (cuzdan.js); bu sayaç üst
         üste doğru cevap. Emoji yerine kendi alev ikonumuz (ikonlar.js). */
      hudStreak.innerHTML = (window.Ikon ? Ikon.alev(14, 0) : '') + '<span>' + streak + ' üst üste!</span>';
      if (window.Ikon) Ikon.canlandir(hudStreak);
      hudStreak.classList.remove('show');
      void hudStreak.offsetWidth;
      hudStreak.classList.add('show');
      clearTimeout(streakTimer);
      streakTimer = setTimeout(function () { hudStreak.classList.remove('show'); }, 6000);
    }
    return streak;
  }
  function streakReset() {
    streak = 0;
    if (hudStreak) hudStreak.classList.remove('show');
  }

  // ============================================================
  // 5. HAZIR SENARYOLAR (sayfaların çağırdığı kısa yollar)
  // ============================================================

  /* Doğru cevap: yeşil halka + yıldız patlaması + akor. */
  function correct(el) {
    sound('correct');
    vibrate(26);
    ring(el, '');
    burst(el, { count: 16, power: 150, emojis: ['⭐', '✨'] });
  }

  /* Yanlış cevap: cesaret kırmayan kısa uyarı. */
  function wrong(el) {
    sound('wrong');
    vibrate([18, 40, 18]);
    shake(el);
    streakReset();
  }

  function unlocked(el, opts) {
    sound('unlock');
    vibrate([20, 50, 30]);
    if (el) {
      emphasize(el, [
        { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255,182,39,0.75)' },
        { transform: 'scale(1.07)', offset: 0.35 },
        { transform: 'scale(1)', boxShadow: '0 0 0 16px rgba(255,182,39,0)' }
      ], 800);
      burst(el, { count: 20, power: 190, emojis: ['🔓', '✨', '⭐'] });
    }
    if (opts && opts.flash !== false) flash('gold');
  }

  function discover(el) {
    sound('discover');
    vibrate(18);
    emphasize(el, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.75) drop-shadow(0 0 8px rgba(255,182,39,0.9))', offset: 0.4 },
      { filter: 'brightness(1)' }
    ], 720, 'ease-out');
    burst(el, { count: 10, power: 110, emojis: ['✨'] });
  }

  function copied(el) {
    sound('copy');
    vibrate(14);
    flashRing(el, '43,182,115');
    burst(el, { count: 8, power: 100, color: '#2BB673' });
  }

  /* İleri butonunu "geçmeye hazır" moduna alır (nefes alan halka). */
  function setReady(on) {
    var btn = document.querySelector('.bottom-nav button.primary');
    if (btn) btn.classList.toggle('fx-ready', !!on);
  }

  // ============================================================
  // 6. OTOMATİK BAĞLANTILAR (her sayfada tek satır kod olmadan)
  // ============================================================
  var TAPPABLE = 'button, .sim-btn, .ai-prompt-btn, .portal-btn, .vp-btn,' +
                 '.step-card-toggle, .modal-close, .panel-toggle';

  /* Kendi ANLAMLI sesi olan ogeler ayrica tap sesi cikarmaz. Yoksa tek
     tiklamada iki ses ust uste biniyordu: ileri/geri (step/back), adim
     noktalari, kod satiri (tick), malzeme (discover), quiz sikki (correct).
     Sikayetin buyuk kismi bu cift sesti. */
  var TAP_SILENT = '#prevBtn, #nextBtn, .step-dot, .ctl-line, .material-item,' +
                   '.quiz-option, .lesson-item, .lesson-card';

  var lastTap = 0;

  function wire() {
    // İlk kullanıcı hareketinde ses motorunu uyandır (tarayıcı politikası).
    var kick = function () {
      audio();
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);

    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var el = e.target.closest(TAPPABLE);
      if (!el) return;
      if (el.hasAttribute('data-fx-silent')) return;
      var variant = el.classList.contains('primary') ? '' : 'accent';
      /* Dalga her zaman cizilir (gorsel geri bildirim kalsin), ses seyrek. */
      ripple(e.clientX, e.clientY, variant);
      if (e.target.closest(TAP_SILENT)) return;
      var now = Date.now();
      if (now - lastTap < 140) return;
      lastTap = now;
      sound('tap');
    }, false);

    buildHud();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  /* ------------------------------------------------------------
     Buluttan GEÇ inen ilerlemeyi yakala.
     xp ve claims bu modülde açılışta bir kez okunup bellekte tutuluyor
     (performans: her ödülde localStorage okunmasın). Bulut senkronu
     ilerlemeyi sayfa açıldıktan saniyeler sonra yazabiliyor — bellekteki
     eski değer hem ekranda yanlış görünüyor hem de bir sonraki ödülde
     buluttaki doğru değeri EZİYORDU (60 XP'li hesap 0'dan başlayıp 10
     yazıyordu). Store'u dinlemek bu sınıfın tamamını kapatıyor.
     Kendi yazdığımız değer de buraya düşer; eşitse hiçbir şey yapılmaz,
     yani döngü oluşmaz. */
  if (window.Store && window.Store.subscribe) {
    window.Store.subscribe(function (key, value) {
      if (key === XP_KEY) {
        var yeni = parseInt(value, 10) || 0;
        if (yeni !== xp) { xp = yeni; paintHud(false); }
      } else if (key === CLAIM_KEY) {
        try { claims = value ? (JSON.parse(value) || {}) : {}; } catch (e) { /* bozuksa eldeki kalsın */ }
      }
    });
  }

  // ============================================================
  // 7. DIŞA AÇILAN API
  // ============================================================
  window.FX = {
    // temel
    sound: sound,
    vibrate: vibrate,
    reduced: reduced,
    isMuted: function () { return !prefs.sound; },
    setMuted: function (m) { prefs.sound = !m; writeJSON(PREF_KEY, prefs); paintSoundBtn(); },

    // görsel
    confetti: confetti,
    burst: burst,
    ripple: ripple,
    ring: ring,
    float: floatText,
    flash: flash,
    pop: pop,
    shake: shake,
    hit: hit,
    highlight: highlight,
    flashRing: flashRing,
    emphasize: emphasize,
    replay: replay,
    celebrate: celebrate,

    // oyunlaştırma
    award: award,
    awardOnce: awardOnce,
    claimed: function (key) { return !!claims[key]; },
    tazeleHud: function () { paintHud(false); },
    xp: function () { return xp; },
    level: function () { return levelOf(xp); },
    levelNameOf: levelName,   // seviye numarasından ad (kupa yolu)
    LEVEL_COUNT: LEVEL_NAMES.length,
    XP_PER_LEVEL: XP_PER_LEVEL,
    levelName: function () { return levelName(levelOf(xp)); },
    streakHit: streakHit,
    streakReset: streakReset,

    // senaryolar
    correct: correct,
    wrong: wrong,
    unlocked: unlocked,
    discover: discover,
    copied: copied,
    setReady: setReady,

    /* Test/geliştirme için: tüm XP ve ödül geçmişini sıfırlar. */
    resetProgress: function () {
      xp = 0; claims = {};
      writeJSON(XP_KEY, 0);
      writeJSON(CLAIM_KEY, {});
      paintHud(false);
    }
  };
})();
