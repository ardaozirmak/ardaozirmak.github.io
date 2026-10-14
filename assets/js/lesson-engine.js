/* ============================================================
   LESSON ENGINE — Ders 1.1/1.2 arasında birebir kopyalanmış olan
   ortak mantık (ADIM NAVİGASYONU VE KİLİTLERİ, quiz, malzeme
   kontrolü, koda-tıkla, pano kopyalama, AI promptları, modal, toast,
   konfeti, akordeon). fx.js/profile.js deseniyle aynı: dosyasız modül,
   window.LessonEngine. Ders verisi assets/data/lesson-*.js dosyalarında
   (fetch/JSON DEĞİL — file:// altında da çalışsın diye <script>).

   Lesson'a özgü kalan kısımlar (Ders1.1: hotspot keşfi, canlı LED
   simülasyonu, video-player entegrasyonu, rozet zinciri; Ders1.2:
   statik devre şeması, "SEN YAP" görevleri) BİLEREK burada değil,
   ilgili script.js / lesson-1-2.js dosyasında kalıyor — bunları da
   tek motora sığdırmak, aralarındaki gerçek DOM farkını gizleyip
   kırılgan bir soyutlamaya dönüşürdü.

   Navigasyon neden burada: kilit kontrolleri eskiden her ders
   dosyasının kendi changeStep()'inde, üstelik `direction === 1`
   şartına bağlıydı. Adım noktalarına tıklamak changeStep(diff)'i
   diff=8 ile çağırdığı için TÜM kilitler atlanabiliyordu (Adım 1'den
   9. noktaya tıklayıp sınav çözmeden rozet alınabiliyordu). Artık
   "İleri" de, nokta da, tek kapıdan — navigate() — geçiyor ve ileri
   giderken aradaki HER kapı tek tek kontrol ediliyor.

   Kullanım: her ders dosyası önce LessonEngine.init(config) çağırır,
   sonra üretilen HTML'in inline onclick'leri LessonEngine.* metodlarını
   çağırır (tek sayfada tek ders aktif olduğu için tek global state
   yeterli — çoklu instance gerekmiyor).
   ============================================================ */
window.LessonEngine = (function () {
  let cfg = null;
  const state = {
    quizIndex: 0,
    quizPassed: false,
    materialsReadyFlag: false,
    displayedPrompts: [],
    currentStep: 1,
    ledCheckAnswer: null,   // "LED yandı mı?" — null = henüz sorulmadı
  };

  function init(config) {
    cfg = config;
    cfg.totalSteps = config.totalSteps || (config.stepsData ? config.stepsData.length : 9);
    cfg.gates = config.gates || {};
    cfg.onBlocked = config.onBlocked || null;   // kapı kapandığında ders ne yapsın
    cfg.aiStep = config.aiStep || 8;
    state.quizIndex = 0;
    // Sınav önceki oturumda geçilmişse kapı baştan açık olsun — yoksa
    // geri dönen öğrenci 7. adıma yürüyene kadar noktalar kilitli görünüyordu.
    state.quizPassed = Store.get(config.quizStorageKey) === '1';
    state.materialsReadyFlag = false;
    state.displayedPrompts = config.aiPrompts || [];
    state.currentStep = 1;
    state.ledCheckAnswer = null;
    state.devamSiniri = 0;
  }

  // ---------- KALDIĞIN YERDEN DEVAM (2026-10-04) ----------
  /* Arda: "çocuk tek başına yapmalı; ilerleme kaydı, oyundaki gibi
     kaldığı yerden devam". Her adım değişiminde ders başına iki sayı:
     şu anki adım ve EN İLERİ gidilen adım. Ders açılınca çocuk kaldığı
     adıma götürülür; en ileri adımdan önceki kapılar bir daha sorulmaz
     (geçtiği kapıyı ertesi gün yeniden geçmesin). Ders kendi sahnesini
     (kablo, devre, yükleme) cfg.devamHazirla ile geri kurar.
     Anahtar storage.js PROGRESS_KEYS'te: hesapla cihazlar arası taşınır. */
  const DEVAM_KEY = 'devam_v1';
  function devamTumu() {
    try { const v = JSON.parse(Store.get(DEVAM_KEY) || '{}'); return (v && typeof v === 'object') ? v : {}; }
    catch (e) { return {}; }
  }
  function devamOku() {
    const d = cfg && cfg.xpPrefix ? devamTumu()[cfg.xpPrefix] : null;
    if (d && d.adim) return d;
    /* devam_v1'den (2026-10-04) önce bitirilmiş ders: rozeti var ama kaydı
       yok. Bitmiş sayılır — zaman makinesi (?adim) o derste de çalışsın. */
    const m = cfg && /^l(\d)(\d)$/.exec(cfg.xpPrefix || '');
    if (m && Store.get('badge_lesson_' + m[1] + '_' + m[2]) === 'earned') return { adim: cfg.totalSteps, enIleri: cfg.totalSteps };
    return null;
  }
  function devamYaz(adim) {
    if (!cfg || !cfg.xpPrefix) return;
    const tum = devamTumu(), eski = tum[cfg.xpPrefix] || {};
    const yeni = { adim: adim, enIleri: Math.max(eski.enIleri || 1, adim), t: Date.now() };
    if (eski.adim === yeni.adim && eski.enIleri === yeni.enIleri) return;
    tum[cfg.xpPrefix] = yeni;
    Store.set(DEVAM_KEY, JSON.stringify(tum));
    kayitIsareti();
  }
  /* "Kaydedildi ✓": çocuk "çıkarsam silinir mi" diye düşünmesin. Adım
     sayacının yanında 1.6 sn görünüp söner; ekran okuyucuya da söylenir. */
  let kayitZaman = null;
  function kayitIsareti() {
    const yer = document.getElementById('stepIndicator');
    if (!yer) return;
    let el = document.getElementById('kayitIsaret');
    if (!el) {
      el = document.createElement('span');
      el.id = 'kayitIsaret'; el.className = 'kayit-isaret';
      el.setAttribute('role', 'status');
      el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Kaydedildi';
      yer.insertAdjacentElement('afterend', el);
    }
    el.classList.remove('is-gorunur'); void el.offsetWidth; el.classList.add('is-gorunur');
    clearTimeout(kayitZaman);
    kayitZaman = setTimeout(function () { el.classList.remove('is-gorunur'); }, 1600);
  }
  /* Açılışta: kaldığı adıma git. Bitmiş derste (son adımda kalmış) baştan
     açılır ama kapılar açık kalır — tekrar eden çocuk istediği adıma gider.
     ?bastan=1: kayıt dursun, ders 1. adımdan açılsın. */
  function devamEt() {
    const d = devamOku();
    if (!d) return;
    let bastan = false;
    try { bastan = new URLSearchParams(location.search).get('bastan') === '1'; } catch (e) {}
    state.devamSiniri = d.enIleri || 1;
    if (state.devamSiniri > 2) state.materialsReadyFlag = true;   // malzemeler bir kez onaylandı
    if (typeof cfg.devamHazirla === 'function') { try { cfg.devamHazirla(state.devamSiniri); } catch (e) {} }
    let hedef = (bastan || d.adim >= cfg.totalSteps) ? 1 : Math.min(d.adim, cfg.totalSteps);
    /* ?adim=N (zaman makinesi, portal): yalnız daha önce ULAŞILMIŞ bir adıma
       (≤ enIleri) götürür — kapı atlatmaz, öğrenmeyi atlatmaz. */
    let istek = 0;
    try { istek = parseInt(new URLSearchParams(location.search).get('adim'), 10) || 0; } catch (e) {}
    if (istek >= 1 && istek <= state.devamSiniri && istek <= cfg.totalSteps) hedef = istek;
    if (hedef > 1) {
      applyStep(hedef);
      showToast(istek === hedef ? 'Zaman makinesi: <strong>Adım ' + hedef + '</strong>’e döndün.'
        : 'Kaldığın yerden devam: <strong>Adım ' + hedef + '</strong>. Geri dönmek istersen üstteki noktalara bas.', 'info', 4200);
    } else paintDots();
  }

  /* Dersin kodu TEK kaynaktan gelir: "Koda Tıkla" kartındaki satırlar.
     Eskiden data dosyasında ayrı bir ledCode alanı vardı ve ekranda
     gösterilen kod ile panoya kopyalanan kod sessizce ayrışıyordu
     (yorum satırları kopyalanan kodda yoktu — Ders 1.2'de hocanın
     bilerek koyduğu "kara kutu" notları kayboluyordu). Artık ikisi
     aynı diziden üretiliyor, ayrışması imkânsız. */
  function lessonCode() {
    if (cfg.ledCode) return cfg.ledCode;
    return (cfg.ctlLines || []).map(function (l) { return l.code; }).join('\n');
  }

  // ---------- TOAST ----------
  function showToast(msg, type, durationMs) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const iconId = type === 'warn' ? 'icon-alert' : 'icon-check';
    toast.innerHTML = `<svg class="icon"><use href="#${iconId}"/></svg><span>${msg}</span>`;
    toast.classList.toggle('warn', type === 'warn');
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    // Kırmızı (varsayılan) mesajlar daha uzun ekranda kalır; sarı "warn"
    // uyarıları kısa/anlık kalır.
    const fallback = type === 'warn' ? 2500 : 4500;
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), durationMs || fallback);
  }

  // ---------- PANO KOPYALAMA ----------
  /* navigator.clipboard file:// altında (ve genel olarak güvensiz
     bağlamda) "Write permission denied" ile REDDEDİLİYOR. Eskiden
     hata yakalanmadığı için pano boş kalıyor ama ekranda yine de
     "Kopyalandı!" yazıyordu — öğrenci Arduino IDE'ye yapıştırıyor,
     hiçbir şey gelmiyordu. README "dosyayı tarayıcıda aç" dediği için
     bu, en sık karşılaşılacak senaryoydu.
     Sıra: clipboard API -> gizli textarea + execCommand -> prompt(). */
  function legacyCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) return true;
    } catch (e) { /* aşağıdaki prompt'a düşülür */ }
    window.prompt('Kopyalamak için Ctrl+C, sonra Enter:', text);
    return 'manual';
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
        .then(function () { return true; })
        .catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  /* Toast SADECE gerçekten kopyalandıysa "Kopyalandı" der; prompt'a
     düşüldüyse öğrenciye ne yapması gerektiği söylenir. onSuccess
     (XP/efekt) da yalnızca gerçek başarıda çalışır. */
  function copyWithToast(text, okMsg, onSuccess) {
    return copyText(text).then(function (res) {
      if (res === 'manual') {
        showToast('Kopyalama kutusu açıldı — Ctrl+C ile kopyala.', 'warn');
        return false;
      }
      showToast(okMsg);
      if (typeof onSuccess === 'function') onSuccess();
      return true;
    });
  }

  // ---------- MODAL ----------
  function modalEscHandler(e) {
    if (e.key === 'Escape') closeModal();
  }
  function openModal(title, bodyHtml) {
    const backdrop = document.getElementById('modalBackdrop');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    if (!backdrop || !titleEl || !bodyEl) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    backdrop.classList.add('show');
    if (window.Hareket) Hareket.pencere(backdrop.querySelector('.modal-window'));
    document.addEventListener('keydown', modalEscHandler);
  }
  function closeModal() {
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) backdrop.classList.remove('show');
    document.removeEventListener('keydown', modalEscHandler);
  }

  // ---------- KONFETİ ----------
  function burstConfetti() {
    if (window.FX) { FX.confetti({ count: 130, emojis: ['⭐', '✨', '🎉'] }); return; }
    const layer = document.getElementById('confettiLayer');
    if (!layer) return;
    const colors = ['#E63946', '#2F6FED', '#FFB627', '#2BB673', '#17B3A3'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
      piece.style.animationDelay = (Math.random() * 0.4) + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), 3600);
    }
  }

  // ---------- AKORDEON (Koda Tıkla kartları) ----------
  function initAccordions(defaultOpenFirst) {
    const cards = document.querySelectorAll('[data-step-card]');
    if (!cards.length) return;
    cards.forEach((card, i) => {
      const toggle = card.querySelector('.step-card-toggle');
      const body = card.querySelector('.step-card-body');
      if (!toggle || !body) return;

      const defaultOpen = !!defaultOpenFirst && i === 0;
      toggle.setAttribute('aria-expanded', String(defaultOpen));
      if (defaultOpen) body.removeAttribute('hidden');
      else body.setAttribute('hidden', '');

      if (toggle.dataset.bound) return;
      toggle.dataset.bound = '1';
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        body.toggleAttribute('hidden', expanded);
      });
    });
  }

  // ---------- AÇ-KAPA PANELİ (PİN HARİTASI) ----------
  /* Resmî pin diyagramını dersin İÇİNDE, kapalı bir panelde tutar.
     Kapalı başlar: her çocuk ihtiyaç duymaz, duyan tek tıkla açar
     (Kurallar.md — derinlik metinle değil, isteğe bağlı katmanla).

     Bileşen burada duruyor çünkü İKİ ders de kullanıyor: 1.2'de "D5'i
     kartta bulamıyorum" sorusunu, 1.1'de "yanan ışık hangi pinde"
     sorusunu cevaplıyor. Ders dosyasına kopyalanmaz, metni veriden gelir. */
  function pinMapHtml(opts) {
    const o = opts || {};
    if (!o.title || !o.body) return '';
    const id = o.id || 'pinMapBody';
    const img = o.img || 'assets/img/deneyap-mini-v2-pin-diyagrami.png';
    return `
    <div class="quiz-box pin-map">
      <button type="button" class="pin-map-toggle" aria-expanded="false" aria-controls="${id}"
              onclick="LessonEngine.togglePinMap(this)">
        <span style="display:flex; align-items:center; gap:8px;">
          <svg class="icon"><use href="#${o.icon || 'icon-box'}"/></svg><strong>${o.title}</strong>
        </span>
        <span class="pin-map-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="pin-map-body" id="${id}" hidden>
        <p class="step-card-desc">${o.body}</p>
        <a class="pin-map-figure" href="${img}" target="_blank" rel="noopener"
           title="Büyütmek için tıkla">
          <img src="${img}" alt="${o.alt || ''}" loading="lazy">
        </a>
        <p class="step-card-desc pin-map-note">Büyütmek için resme tıkla.</p>
      </div>
    </div>`;
  }

  /* Hangi gövdeyi açacağını aria-controls'tan okur — eskiden `pinMapBody`
     id'si işin içine gömülüydü, o yüzden sayfada tek bir panel olabiliyordu. */
  function togglePinMap(btn) {
    const body = document.getElementById(btn.getAttribute('aria-controls'));
    if (!body) return;
    const acik = !body.hidden;
    body.hidden = acik;
    btn.setAttribute('aria-expanded', String(!acik));
    btn.classList.toggle('is-open', !acik);
    if (!acik && window.FX) { try { FX.sound('step'); } catch (e) {} }
  }

  // ---------- MALZEMELER ----------
  function renderMaterials() {
    const m = cfg.materials;
    const btnHtml = (label) => `<svg class="icon"><use href="#icon-check"/></svg>${label}`;
    const items = m.items.map((label, i) => `<div class="material-item"><span class="mat-num">${i + 1}</span>${label}</div>`).join('');
    return `
      <div class="quiz-box">
        <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#${m.icon || 'icon-box'}"/></svg>Gerekli Malzemeler</strong>
        ${items}
        ${m.note ? `<p class="step-card-desc" style="margin-top:8px;">${m.note}</p>` : ''}
        <button class="ai-prompt-btn" id="materialsBtn" onclick="LessonEngine.materialsReady()">${state.materialsReadyFlag ? btnHtml('Malzemeler Hazır!') : btnHtml('Malzemeleri Hazırladım!')}</button>
      </div>`;
  }

  function materialsReady() {
    const first = !state.materialsReadyFlag;
    state.materialsReadyFlag = true;
    const btn = document.getElementById('materialsBtn');
    if (btn) btn.innerHTML = '<svg class="icon"><use href="#icon-check"/></svg>Malzemeler Hazır!';
    showToast(cfg.materials.readyMessage || 'Harika! Malzemelerin hazır.');

    if (window.FX && first) {
      FX.sound('correct');
      FX.vibrate(22);
      FX.pop(btn);
      FX.ring(btn);
      FX.burst(btn, { count: 14, power: 140, emojis: ['✅', '✨'] });
      FX.awardOnce(cfg.xpPrefix + '_materials', 15, 'XP', btn);
    }
    refreshGates();
    if (typeof cfg.onReadyGlowChange === 'function') cfg.onReadyGlowChange();

    /* Arda (2026-09-22): "malzemeler hazir deyince otomatik bir sonraki
       adima gecsin, ileri demeden." Cocuk zaten "hazirim" dedi; ondan bir
       de "Ileri"ye basmasini istemek fazladan bir engel.
       Gecikme: kutlama (ses, konfeti, XP) gorulsun, sonra gecilsin -
       aninda gecersek cocuk ne kazandigini hic gormuyor.
       Yalnizca ILK basista: adima geri donen cocuk yeniden firlatilmasin.
       Arda (2026-09-28): "ders 1.1'deki 2. adımda malzemeler hazır deyince
       oto ilerlemeyi kaldır" — derse göre: cfg.malzemeOtoIleri === false
       ise geçilmez, İleri parlar (odak.js) ve çocuk kendi basar. */
    if (first && cfg.malzemeOtoIleri !== false) {
      setTimeout(function () {
        if (state.currentStep === 2) navigate(3);
      }, 900);
    }
  }

  // ---------- KODA TIKLA ----------
  /* 2026-10-08 (Arda: "koda tıkla güzel, daha çok geliştir, animasyonlu
     olsun"): açıklama kutusu tıklanan satırın hemen ALTINA taşınır (aynı
     #ctlDesc öğesi, yer değiştirir); okunan satırın numarası ✓ olur;
     başlıkta "çözülen satır" çubuğu dolar. Hareket kapalıyken (otomasyon,
     reduced-motion) aynısı animasyonsuz olur. */
  function ctlOkundu(i) {
    return !!(window.FX && FX.claimed(cfg.xpPrefix + '_ctl_' + i));
  }
  function ctlSayac() {
    const n = cfg.ctlLines.length;
    const k = cfg.ctlLines.filter((_, i) => ctlOkundu(i)).length;
    return { k: k, n: n, yuzde: n ? Math.round(k * 100 / n) : 0 };
  }
  function ctlSayacBoya() {
    const c = ctlSayac();
    const sayi = document.getElementById('ctlSayac');
    const bar = document.getElementById('ctlBar');
    if (sayi) sayi.textContent = c.k + '/' + c.n;
    if (bar) bar.style.width = c.yuzde + '%';
    const kart = document.querySelector('.ctl-card');
    if (kart) kart.classList.toggle('ctl-tamam', c.k === c.n);
  }

  /* ---- Koda Tıkla kart sahnesi (2026-10-08, Arda: "hepsini ekle") ----
     Satırın ne yaptığı KODUN KENDİSİNDEN çıkarılır, ders verisine elle
     yazılmaz: yeni ders eklenince sahne kendiliğinden gelir. Yorum ve
     blok yorum satırlarının etkisi yok (sahne gizli). Görseller Blender:
     blender/kod-sahne.py → assets/img/kod/. */
  const KOD_RENK = { kirmizi: [255, 59, 38], sari: [255, 210, 63], yesil: [59, 227, 107] };
  function hexRgb(h) {
    const m = /^#?([0-9a-f]{6})$/i.exec(h || '');
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  function enYakinRenk(rgb) {
    let en = 'kirmizi', d = Infinity;
    Object.keys(KOD_RENK).forEach(function (k) {
      const c = KOD_RENK[k];
      const x = (c[0] - rgb[0]) ** 2 + (c[1] - rgb[1]) ** 2 + (c[2] - rgb[2]) ** 2;
      if (x < d) { d = x; en = k; }
    });
    return en;
  }
  function ctlIsimler() {
    const isim = {};
    (cfg.ctlLines || []).forEach(function (l) {
      const m = /^\s*const\s+int\s+(\w+)\s*=\s*(D\d+)\s*;/.exec(l.code);
      if (m) isim[m[1]] = m[2];
    });
    return isim;
  }
  // Pin → LED rengi: ders verisindeki renk > değişken adı > kırmızı.
  function pinRengi(pin, ad) {
    const sira = cfg.ledSirasi || [];
    const kayit = sira.find(function (l) { return l.pin === pin; });
    const rgb = kayit && kayit.renk && hexRgb(kayit.renk.yanik);
    if (rgb) return enYakinRenk(rgb);
    const a = (ad || '').toLowerCase();
    if (a.indexOf('sari') !== -1) return 'sari';
    if (a.indexOf('yesil') !== -1) return 'yesil';
    return 'kirmizi';
  }
  function kodEtkisi(i) {
    const lines = cfg.ctlLines || [];
    let blok = false;
    for (let k = 0; k < i; k++) {
      const c = lines[k].code;
      if (!blok && c.indexOf('/*') !== -1 && c.indexOf('*/') === -1) blok = true;
      else if (blok && c.indexOf('*/') !== -1) blok = false;
    }
    const ham = (lines[i] && lines[i].code) || '';
    if (blok || /^\s*(\/\/|\/\*|\*)/.test(ham)) return null;
    const c = ham.replace(/\/\/.*$/, '');
    const isim = ctlIsimler();
    const pinOf = function (x) { return isim[x] || (/^D\d+$/.test(x) ? x : null); };
    let m;
    if ((m = /const\s+int\s+(\w+)\s*=\s*(D\d+)/.exec(c))) {
      return { tip: 'isim', ad: m[1], pin: m[2], renk: pinRengi(m[2], m[1]) };
    }
    if ((m = /pinMode\(\s*(\w+)\s*,\s*(OUTPUT|INPUT)\s*\)/.exec(c)) && pinOf(m[1])) {
      return { tip: 'mod', ad: m[1], pin: pinOf(m[1]), mod: m[2] };
    }
    if ((m = /digitalWrite\(\s*(\w+)\s*,\s*(HIGH|LOW)\s*\)/.exec(c)) && pinOf(m[1])) {
      const pin = pinOf(m[1]);
      return { tip: 'yaz', ad: m[1], pin: pin, yuksek: m[2] === 'HIGH', renk: pinRengi(pin, m[1]) };
    }
    if ((m = /delay\(\s*(\d+)\s*\)/.exec(c))) return { tip: 'bekle', ms: +m[1] };
    if ((m = /Serial\.begin\(\s*(\d+)\s*\)/.exec(c))) return { tip: 'baslat', hiz: +m[1] };
    if ((m = /Serial\.print(?:ln)?\(\s*"([^"]*)"/.exec(c))) return { tip: 'seri', metin: m[1] };
    if ((m = /digitalRead\(\s*(\w+)\s*\)/.exec(c)) && pinOf(m[1])) return { tip: 'oku', ad: m[1], pin: pinOf(m[1]) };
    return null;
  }

  function sn(ms) {
    const s = ms / 1000;
    return s.toLocaleString('tr-TR') + ' saniye';
  }
  function ledImg(renk, acik) {
    return `<img class="ks-led${acik ? ' is-acik' : ''}" src="assets/img/kod/led-${renk}-${acik ? 'acik' : 'kapali'}.webp" alt="" draggable="false">`;
  }
  function kodSahneHtml(e) {
    if (!e) return '';
    const cip = (pin, ek) => `<span class="ks-cip">${pin}${ek ? ' <small>' + ek + '</small>' : ''}</span>`;
    if (e.tip === 'yaz') {
      return `<div class="ks ks-yaz" data-tip="yaz">${cip(e.pin, e.yuksek ? 'HIGH' : 'LOW')}<span class="ks-tel${e.yuksek ? ' is-akim' : ''}"><i></i><i></i><i></i></span>${ledImg(e.renk, e.yuksek)}<span class="ks-not">${e.yuksek ? 'LED yanar' : 'LED söner'}</span></div>`;
    }
    if (e.tip === 'isim') {
      return `<div class="ks ks-isim" data-tip="isim"><span class="ks-etiket">${e.ad}</span><span class="ks-ok" aria-hidden="true">→</span>${cip(e.pin)}${ledImg(e.renk, false)}</div>`;
    }
    if (e.tip === 'mod') {
      const cikis = e.mod === 'OUTPUT';
      return `<div class="ks ks-mod" data-tip="mod">${cip(e.pin)}<span class="ks-yon ${cikis ? 'is-cikis' : 'is-giris'}" aria-hidden="true"><i></i></span><span class="ks-not">${cikis ? 'ÇIKIŞ: elektrik gönderir' : 'GİRİŞ: elektriği okur'}</span></div>`;
    }
    if (e.tip === 'bekle') {
      const tur = e.ms / 1000;
      const cizgi = Array.from({ length: 12 }, (_, k) => `<line x1="50" y1="${k % 3 ? 16 : 13}" x2="50" y2="21" transform="rotate(${k * 30} 50 50)"/>`).join('');
      return `<div class="ks ks-bekle" data-tip="bekle" data-ms="${e.ms}"><span class="ks-saat"><img src="assets/img/kod/kronometre.webp" alt="" draggable="false"><svg viewBox="0 0 100 100" aria-hidden="true"><g class="ks-cizgi">${cizgi}</g><line class="ks-ibre" x1="50" y1="50" x2="50" y2="22" style="transform: rotate(${(tur % 1) * 360}deg)"/><circle class="ks-merkez" cx="50" cy="50" r="3"/></svg></span><span class="ks-not"><b>${e.ms}</b> ms = ${sn(e.ms)} bekle</span></div>`;
    }
    if (e.tip === 'baslat' || e.tip === 'seri') {
      const govde = e.tip === 'seri'
        ? `<span class="ks-satir">${e.metin}</span>`
        : `<span class="ks-hiz">${e.hiz} baud</span><span class="ks-nokta"><i></i><i></i><i></i></span>`;
      return `<div class="ks ks-seri" data-tip="${e.tip}"><span class="ks-pencere"><span class="ks-pencere-baslik">Seri Monitör</span>${govde}</span><span class="ks-not">${e.tip === 'seri' ? 'Bilgisayara yazı gider' : 'Kart ile bilgisayar konuşmaya başlar'}</span></div>`;
    }
    if (e.tip === 'oku') {
      return `<div class="ks ks-oku" data-tip="oku">${cip(e.pin)}<img class="ks-buton" src="assets/img/kart/buton-ust.webp" alt="" draggable="false"><span class="ks-not">basılı = 1, değil = 0</span></div>`;
    }
    return '';
  }

  /* ---- Merak Köşesi sahnesi (2026-10-08) ----
     Merak metninin üstünde kendiliğinden dönen kısa sahne. Kareler ders
     verisinde (merakKosesi.sahne); görsel dili Koda Tıkla sahnesiyle aynı
     (kodSahneHtml tipleri + sira/kod/okuma). Hareket kapalıyken (reduced
     motion, otomasyon) dönmez: ilk kare durur, noktalarla elle geçilir. */
  function sahneKareHtml(k) {
    if (k.tip === 'sira') {
      return `<div class="ks ks-sira">${k.ledler.map((r, j) =>
        `<span class="ks-sira-led">${ledImg(r, (k.yanik || []).indexOf(j) !== -1)}<small>${j + 1}</small></span>`).join('')}</div>`;
    }
    if (k.tip === 'kod') {
      const kod = k.kod.replace(k.vurgu, `<mark>${k.vurgu}</mark>`);
      return `<div class="ks ks-kod"><span class="ks-pencere ks-kod-pencere"><span class="ks-pencere-baslik">Kod</span><span class="ks-satir">${kod}</span></span>${k.not ? `<span class="ks-not">${k.not}</span>` : ''}</div>`;
    }
    if (k.tip === 'okuma') {
      const yanik = k.deger === 1;
      return `<div class="ks ks-okuma" data-deger="${k.deger}"><span class="ks-cip">${k.pin}</span>` +
        `<img class="ks-buton${k.basili ? ' is-basili' : ''}" src="assets/img/kart/buton-ust.webp" alt="" draggable="false">` +
        `<span class="ks-direnc${k.direnc ? '' : ' is-yok'}">10K</span>` +
        `<span class="ks-deger">${k.deger === '?' ? '?' : k.deger}</span>${ledImg(k.renk || 'kirmizi', yanik)}</div>`;
    }
    return kodSahneHtml(k);
  }
  function merakSahneHtml(kareler) {
    if (!kareler || !kareler.length) return '';
    const veri = encodeURIComponent(JSON.stringify(kareler));
    return `<div class="merak-sahne" data-kareler="${veri}" aria-hidden="true">
      <div class="ms-kare"></div><p class="ms-yazi"></p>
      <div class="ms-noktalar">${kareler.map((_, j) => `<button type="button" tabindex="-1" class="ms-nokta" data-k="${j}" aria-label="Kare ${j + 1}"></button>`).join('')}</div>
    </div>`;
  }
  function merakSahneKur(kok) {
    (kok || document).querySelectorAll('.merak-sahne:not([data-kuruldu])').forEach(function (el) {
      el.setAttribute('data-kuruldu', '1');
      let kareler = [];
      try { kareler = JSON.parse(decodeURIComponent(el.getAttribute('data-kareler'))); } catch (e) { return; }
      const kareEl = el.querySelector('.ms-kare'), yazi = el.querySelector('.ms-yazi');
      let k = 0, zaman = null, titre = null, gorunur = false;
      const donsun = !!(window.Hareket && Hareket.aktif);
      function goster(j) {
        k = (j + kareler.length) % kareler.length;
        const kare = kareler[k];
        kareEl.innerHTML = sahneKareHtml(kare);
        yazi.innerHTML = kare.yazi || '';
        el.querySelectorAll('.ms-nokta').forEach((n, x) => n.classList.toggle('is-aktif', x === k));
        clearInterval(titre); titre = null;
        if (window.Hareket) {
          Hareket.kodSahne(kareEl.firstElementChild, kare);
          Hareket.merakYazi(yazi);
        }
        // "Havada asılı" pin: değer rastgele 0/1 titrer (yalnız hareket açıkken).
        if (kare.tip === 'okuma' && kare.deger === '?' && donsun) {
          const d = kareEl.querySelector('.ks-deger'), led = kareEl.querySelector('.ks-led');
          titre = setInterval(function () {
            if (!el.isConnected) { clearInterval(titre); return; }
            const v = Math.random() < 0.5 ? 1 : 0;
            d.textContent = v;
            led.src = led.src.replace(/-(acik|kapali)\.webp$/, v ? '-acik.webp' : '-kapali.webp');
            led.classList.toggle('is-acik', !!v);
          }, 180 + Math.random() * 160);
        }
      }
      function planla() {
        clearTimeout(zaman);
        if (!donsun || !gorunur) return;
        zaman = setTimeout(function () {
          if (!el.isConnected) return;
          goster(k + 1); planla();
        }, kareler[k].ms || 3200);
      }
      el.querySelectorAll('.ms-nokta').forEach(function (n) {
        n.addEventListener('click', function () { goster(+n.dataset.k); planla(); });
      });
      goster(0);
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(function (g) {
          if (!el.isConnected) { io.disconnect(); return; }
          gorunur = g[0].isIntersecting;
          if (gorunur) planla(); else clearTimeout(zaman);
        }, { threshold: 0.3 });
        io.observe(el);
      }
    });
  }

  function clickToLearnHtml(opts) {
    opts = opts || {};
    const headerIcon = opts.headerIcon || 'icon-cursor';
    const headerText = opts.headerText || 'Koda Tıkla, Her Satırı Öğren';
    const extraButton = opts.extraButtonHtml || '';
    const c = ctlSayac();
    return `
      <div class="ctl-card${c.k === c.n ? ' ctl-tamam' : ''}">
        <div class="ctl-header"><svg class="icon"><use href="#${headerIcon}"/></svg><span class="ctl-baslik">${headerText}</span>
          <span class="ctl-ilerleme" title="Çözdüğün satırlar"><span class="ctl-bar"><i id="ctlBar" style="width:${c.yuzde}%"></i></span><b id="ctlSayac">${c.k}/${c.n}</b></span>
        </div>
        <div class="ctl-code">${cfg.ctlLines.map((l, i) => {
          const code = l.code === '' ? '&nbsp;' : l.code;
          return `<div class="ctl-line${i % 2 ? ' alt' : ''}${ctlOkundu(i) ? ' okundu' : ''}" role="button" tabindex="0" aria-label="Kod satırı ${i + 1}, açıklamasını görmek için seç" onclick="LessonEngine.selectCtlLine(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();LessonEngine.selectCtlLine(${i});}"><span class="ctl-num" data-n="${i + 1}"></span><span class="ctl-text">${code}</span></div>`;
        }).join('')}</div>
        <div class="ctl-desc" id="ctlDesc" aria-live="polite"><svg class="icon"><use href="#icon-cursor"/></svg><span id="ctlDescText">Yukarıdaki kod satırlarından birine tıkla, ne işe yaradığını öğren.</span></div>
        ${extraButton}
      </div>`;
  }

  function selectCtlLine(i) {
    const lines = document.querySelectorAll('.ctl-line');
    lines.forEach(l => l.classList.remove('active'));
    const satir = lines[i];
    if (satir) satir.classList.add('active');
    const desc = document.getElementById('ctlDesc');
    const descText = document.getElementById('ctlDescText');
    const yeni = satir && !satir.classList.contains('okundu');

    // Kutuyu satırın altına taşı; Hareket eski yerinden kaydırarak getirir.
    const once = desc ? desc.getBoundingClientRect() : null;
    if (desc && satir && satir.nextElementSibling !== desc) {
      satir.insertAdjacentElement('afterend', desc);
      desc.classList.add('satir-ici');
    }
    if (descText) descText.innerHTML = (cfg.ctlLines[i] && cfg.ctlLines[i].desc) || 'Boş satır, koda etkisi yoktur.';
    // Kart sahnesi: satırın etkisi varsa açıklamanın yanında oynar.
    let sahne = document.getElementById('ctlSahne');
    if (desc && !sahne) {
      sahne = document.createElement('div');
      sahne.id = 'ctlSahne';
      sahne.className = 'ctl-sahne';
      sahne.setAttribute('aria-hidden', 'true');
      desc.appendChild(sahne);
    }
    const etki = kodEtkisi(i);
    if (sahne) { sahne.innerHTML = kodSahneHtml(etki); sahne.hidden = !etki; }
    if (window.Hareket) Hareket.kodSatiri(satir, desc, once, yeni);
    if (window.Hareket && etki && sahne) Hareket.kodSahne(sahne.firstElementChild, etki);
    showToast("Bu satırın görevini öğrendin!");

    if (window.FX) {
      if (!window.Hareket || !Hareket.aktif) { FX.pop(desc, 1.03); FX.highlight(desc); }
      FX.awardOnce(cfg.xpPrefix + '_ctl_' + i, 3, 'XP', satir || desc);
      if (satir) satir.classList.add('okundu');
      ctlSayacBoya();

      const allRead = cfg.ctlLines.every((_, k) => FX.claimed(cfg.xpPrefix + '_ctl_' + k));
      if (allRead && FX.awardOnce(cfg.xpPrefix + '_ctl_all', 25, 'XP', desc)) {
        FX.sound('unlock');
        FX.burst(desc, { count: 18, power: 170, emojis: ['🧠', '⭐'] });
        showToast("Kodun her satırını çözdün! +25 XP");
        if (window.Hareket) Hareket.kodBitti(lines);
      }
    }
  }

  function copyUserCode() {
    copyWithToast(lessonCode(), 'LED Kodu Panoya Kopyalandı!', function () {
      if (window.FX) {
        FX.copied(document.getElementById('codeContainer') || document.body);
        FX.awardOnce(cfg.xpPrefix + '_copy_code', 10, 'XP');
      }
    });
  }

  // ---------- AI PROMPTLARI ----------
  /* ---------- AI YOLDAŞI ----------
     "AI Yoldaşına Sor" ADIM 8'İN KENDİ İÇERİĞİ — o adımın başlığı da bu
     (iki derste de). Yani görünürlük koşulu unutulmuş bir kilit değil,
     dersin akışı: mini sınavdan sonra gelen pekiştirme adımı. Promptlar da
     ders sonuna göre yazılmış (setup/loop farkı, neopixelWrite'taki sayılar,
     delay azalınca ne olur) — Adım 1'de gösterilse çocuk kodu daha görmemiş
     olur, soru bağlamsız kalır.

     2026-09-07'de bir tur "her adımda görünsün" diye açıldı ve geri alındı:
     istek makuldü (çocuk her adımda yardıma ulaşabilmeli) ama çözüm yanlıştı.
     Takılma anının yardımı zaten yerinde ve bağlamlı: Adım 5'teki
     "Hâlâ olmadı — AI yoldaşıma soracağım" butonu, data'daki helpPrompt ile.

     Kural yine de MOTORDA duruyor: eskiden iki ders dosyasında birebir
     kopyalanmış tek satırdı, kopya olması gerçek sorundu. Adım numarası
     artık veri (cfg.aiStep), kod değil. */
  function paintAiSection() {
    const el = document.getElementById('aiSection');
    if (el) el.style.display = (state.currentStep === cfg.aiStep) ? 'block' : 'none';
  }

  /* Prompt kopyalanınca çocuğun onu YAPIŞTIRACAĞI yer de açılır. Eskiden
     ekran "kendi AI aracına yapıştır" diyordu ama bağlantı vermiyordu —
     yanında yetişkin olmayan çocuk için bu adım tek başına bir engel.
     Tercih localStorage'da, profile.js'teki desenle (dosya yok, sunucu yok). */
  /* `q` alanı: soruyu adresin içine koyup göndermeyi destekleyen araçlar.
     ChatGPT açılışta ?q= içeriğini sohbet kutusuna yazıyor — çocuğun
     yapıştırması gerekmiyor. Claude ve Gemini bunu desteklemiyor, onlarda
     eski yol (kopyala + Ctrl+V) sürüyor. Pano yedeği HER ZAMAN yazılıyor:
     bağlantı bir şekilde boş açılırsa çocuk yine yapıştırabilsin. */
  const AI_TOOLS = {
    chatgpt: { label: 'ChatGPT', openLabel: "ChatGPT'de aç", url: 'https://chatgpt.com/', q: 'q' },
    claude:  { label: 'Claude',  openLabel: "Claude'da aç",  url: 'https://claude.ai/new', q: null },
    gemini:  { label: 'Gemini',  openLabel: "Gemini'de aç",  url: 'https://gemini.google.com/app', q: null },
  };
  /* Adres çubuğu sınırsız değil; uzun promptta gömme yerine panoya düşülür. */
  const AI_URL_MAX = 6000;
  const AI_TOOL_KEY = 'ai_tool_v1';

  function aiTool() {
    const v = Store.get(AI_TOOL_KEY);
    return AI_TOOLS[v] ? v : 'chatgpt';
  }

  function setAiTool(key) {
    if (!AI_TOOLS[key]) return;
    Store.set(AI_TOOL_KEY, key);
    toggleAiPrompts(); // modal içeriğini seçili araca göre yeniden çiz
  }

  /* Soru metnini adrese gömer. Gömülemiyorsa (araç desteklemiyor ya da
     adres çok uzun) aracın boş sayfasını döndürür. */
  function aiToolUrl(text) {
    const t = AI_TOOLS[aiTool()];
    if (!t.q || !text) return { url: t.url, sent: false };
    const url = t.url + (t.url.indexOf('?') >= 0 ? '&' : '?') + t.q + '=' + encodeURIComponent(text);
    return url.length > AI_URL_MAX ? { url: t.url, sent: false } : { url: url, sent: true };
  }

  /* window.open TIKLAMANIN kendi tick'inde çağrılmalı — pano yazma
     promise'inin içine konursa tarayıcı bunu kullanıcı hareketi saymayıp
     sekmeyi engelliyor. O yüzden kopyalamayla aynı anda, beklemeden.
     Dönüş: soru adrese gömülebildi mi (ekranda ne yazacağını belirler). */
  function openAiTool(text) {
    const r = aiToolUrl(text);
    window.open(r.url, '_blank', 'noopener');
    return r.sent;
  }

  /* Ekranda ne yazacağı tek yerden gelsin: gönderildiyse "gönderildi",
     gönderilemediyse çocuğa ne yapacağı söylensin. */
  function aiSentMessage(sent) {
    const label = AI_TOOLS[aiTool()].label;
    return sent
      ? 'Soru ' + label + "'ye gönderildi! Açılan sekmeye bak — gelmediyse Ctrl+V ile yapıştır."
      : 'Soru kopyalandı! Açılan ' + label + ' sekmesine Ctrl+V ile yapıştır.';
  }

  function toggleAiPrompts() {
    state.displayedPrompts = (window.Profile ? Profile.sortByLevel(cfg.aiPrompts) : cfg.aiPrompts);
    const profileHint = (window.Profile && !Profile.isSet())
      ? `<p class="step-card-desc" style="margin-bottom:12px;"><img class="fx-ikon" src="assets/img/fx/fx-ampul.webp" alt="" aria-hidden="true" draggable="false"> <a href="portal.html" style="color:inherit;text-decoration:underline;">Portalda profilini doldurursan</a> (yaş + hitap tercihi) promptlar sana özel kişiselleşir ve seviyene uygun olanlar önce gösterilir.</p>`
      : '';
    const tool = aiTool();
    const sends = !!AI_TOOLS[tool].q;
    const toolPicker = `<p class="step-card-desc" style="margin-bottom:12px;">` +
      (sends
        ? `Bir soru seç: <strong>${AI_TOOLS[tool].label}</strong> yeni sekmede açılır ve soru <strong>hazır gelir</strong>, sen sadece cevabı oku. Başka bir tane kullanıyorsan seç: `
        : `Soruyu kopyalayınca <strong>${AI_TOOLS[tool].label}</strong> yeni sekmede açılır, oraya yapıştır. Başka bir tane kullanıyorsan seç: `) +
      Object.keys(AI_TOOLS).map(function (k) {
        return k === tool
          ? `<strong>${AI_TOOLS[k].label}</strong>`
          : `<a href="#" onclick="LessonEngine.setAiTool('${k}');return false;" style="color:inherit;text-decoration:underline;">${AI_TOOLS[k].label}</a>`;
      }).join(' · ') + `</p>`;
    const html = profileHint + toolPicker + state.displayedPrompts.map((p, i) => `
      <div class="ai-prompt-card">
        <span class="ai-prompt-cat cat-${p.catColor}">${p.cat}</span>
        <div class="ai-prompt-title">${p.title}</div>
        <p class="ai-prompt-text">${p.prompt}</p>
        <button class="sim-btn copy-user" onclick="LessonEngine.copyPrompt(${i})"><svg class="icon"><use href="#icon-${sends ? 'robot' : 'clipboard'}"/></svg>${sends ? `Bu soruyu ${AI_TOOLS[tool].label}'ye sor` : `Kopyala ve ${AI_TOOLS[tool].openLabel}`}</button>
      </div>`).join('');
    openModal('AI Yoldaşına Sor', html);
  }

  /* Hazır bir prompt metnini profille kişiselleştirip kopyalar.
     Sitede öğretmen yok — AI yoldaşı öğretmenin yerini tutuyor. Çocuğun
     kendi başına çözemeyeceği teknik ayrıntılar (sürücü, kart ayarları,
     derleyici hataları) ekrana METİN olarak basılmak yerine bu promptun
     içine konuluyor: bilgi kaybolmuyor, sadece muhatabı değişiyor. */
  function copyPromptText(raw, okMsg) {
    const finalText = window.Profile ? Profile.personalize(raw) : raw;
    return copyWithToast(finalText, okMsg || 'Prompt panoya kopyalandı!');
  }

  function copyPrompt(i) {
    const raw = state.displayedPrompts[i].prompt;
    const finalText = window.Profile ? Profile.personalize(raw) : raw;
    const sent = openAiTool(finalText);
    copyWithToast(finalText, aiSentMessage(sent), function () {
      if (window.FX) {
        FX.copied(document.querySelectorAll('.ai-prompt-card')[i]);
        FX.awardOnce(cfg.xpPrefix + '_copy_prompt', 10, 'XP');
      }
    });
  }

  // ---------- "LED YANDI MI?" KONTROLÜ ----------
  /* Sorun giderme HERKESE gösterilmiyor. LED'i yanan çocuk (çoğunluk)
     zafer anında arıza kılavuzu okumak zorunda kalıyordu. Önce tek bir
     soru sorulur, yardım sadece "yanmadı" diyene açılır.

     Metinler burada DEĞİL, ders verisinde (cfg.ledCheck): iki ders aynı
     motoru kullanıyor. Blok daha önce iki dosyaya kopyalanmış olsaydı
     (aiSection'da olduğu gibi) birinde yapılan düzeltme ötekine geçmezdi.

     cfg.ledCheck = { question, yesLabel, noLabel, successText,
                      fixesIntro, fixes: [{icon, title, text}] }
     Yardım promptu cfg.helpPrompt'tan gelir. */
  function ledCheckHtml() {
    const c = cfg.ledCheck;
    if (!c) return '';
    return `
      <div class="led-check" id="ledCheck">
        <div class="led-check-q">${c.question}</div>
        <div class="led-check-btns">
          <button type="button" class="led-check-btn ok" onclick="LessonEngine.ledCheck(true)">${c.yesLabel || 'Evet, yanıp sönüyor!'}</button>
          <button type="button" class="led-check-btn no" onclick="LessonEngine.ledCheck(false)">${c.noLabel || 'Hayır, bir şey olmadı'}</button>
        </div>
      </div>
      <div id="ledCheckResult"></div>`;
  }

  /* restore=true: adıma geri dönüldüğünde önceki cevabı sessizce geri koyar
     (ses yok, XP yok, konfeti yok). */
  function ledCheck(basarili, restore) {
    const c = cfg.ledCheck;
    const box = document.getElementById('ledCheckResult');
    if (!c || !box) return;
    state.ledCheckAnswer = basarili;
    /* "Ileri" gorunurlugu ve parilti bu cevaba bagli (Adim 5 kapisi):
       cagirmazsak cocuk soruyu cevaplar ama dugme hic cikmaz ve kilitli
       kalir (olculdu 2026-09-22). */
    if (typeof cfg.onReadyGlowChange === 'function') cfg.onReadyGlowChange();

    // Butonlar cevap sonrası KİLİTLENMEZ: site LED'in gerçekten yanıp
    // yanmadığını bilemez, tek kaynak çocuğun cevabı. Yanlış butona basan
    // ya da sonradan sorun yaşayan çocuk fikrini değiştirebilmeli.
    const q = document.getElementById('ledCheck');
    if (q) q.classList.add('answered');
    document.querySelectorAll('.led-check-btn').forEach(function (b) {
      b.classList.toggle('selected', b.classList.contains(basarili ? 'ok' : 'no'));
    });

    if (basarili) {
      box.innerHTML = `
        <div class="callout green"><svg class="icon callout-icon"><use href="#icon-medal"/></svg>
          <span>${c.successText}</span>
        </div>
        <button type="button" class="led-check-undo" onclick="LessonEngine.ledCheck(false)">Yine de bir sorun mu çıktı? Yardım al →</button>`;
      if (window.FX && !restore) {
        FX.sound('unlock');
        FX.awardOnce(cfg.xpPrefix + '_led_works', 25, 'XP', box);
        FX.burst(box, { count: 18, power: 160, emojis: ['💡', '🎉', '✨'] });
      }
      return;
    }

    // Sadece çocuğun kendi başına yapabileceği kontroller listelenir.
    // Sürücü/kart ayarı/derleyici hatası gibi teknik ayrıntılar ekrana
    // basılmıyor — AI yoldaşına giden promptun (cfg.helpPrompt) içinde.
    box.innerHTML = `
      <div class="callout yellow"><svg class="icon callout-icon"><use href="#icon-alert"/></svg>
        <span>${c.fixesIntro || '<strong>Olur böyle, hiç sorun değil.</strong> Sırayla şunlara bak:'}</span>
      </div>
      ${hataKartlariHtml()}
      ${(c.fixes || []).map(function (f, i) {
        return `<div class="callout"><svg class="icon callout-icon"><use href="#icon-${f.icon}"/></svg>
          <span><strong>${i + 1}. ${f.title}</strong> ${f.text}</span></div>`;
      }).join('')}
      <button class="ai-prompt-btn" onclick="LessonEngine.askHelpFromAI()"><svg class="icon"><use href="#icon-robot"/></svg>Hâlâ olmadı — AI yoldaşıma soracağım</button>
      <button type="button" class="led-check-undo" onclick="LessonEngine.ledCheck(true)">Düzeldi, LED şimdi yanıyor →</button>`;
    if (!restore) hataSahnesiOynat();
    if (window.FX && !restore) {
      FX.sound('tick');
      /* "İlk Hata" rozeti: hata anını utançtan ödüle çevirir (Arda,
         2026-09-23). Tam ekran kutlama DEĞİL — çocuk sorun çözerken
         ekranı kapatmayalım; tek seferlik küçük bir ödül yeter. */
      if (!FX.claimed('ilk_hata')) {
        FX.awardOnce('ilk_hata', 15, 'XP', box);
        FX.burst(box, { count: 12, power: 120, emojis: ['🛠️', '⭐'] });
        showToast('🛠️ İlk Hata rozeti! Gerçek mühendisler de buradan geçer.', null, 4200);
      }
    }
  }

  /* ---- "Olmadı" hata sahneleri (2026-10-08) ----
     Çocuk "olmadı" deyince düzeltme listesinin üstünde sık hataların
     kartları. Arda: "basit çizimler çıkmasın, motion design veya Blender".
     Devre hataları Blender yakın çekimi (blender/hata-sahne.py →
     assets/img/hata/<id>-yanlis|dogru.webp): önce YANLIŞ, sorunlu noktada
     kırmızı halka atar; sonra resim doğrusuna geçer, halka yeşile döner ve
     doğru yere kayar. Halkanın yeri Blender kamerasından (HATA_ISARET).
     Seri hız hatası motion design: bozuk işaretler akar, hız 115200'e
     döner, yazı temizlenir. Ekranda hep TEK resim (lesson-1-2.js kararı).
     Metinler WiringDiagram.ERROR_ITEMS'tan; hangileri derse uyar →
     cfg.hataSahneleri. */
  const HATA_ISARET = {"reversed":{"yanlis":[0.3808,0.1755],"dogru":[0.3808,0.1755]},"short":{"yanlis":[0.3553,0.5231],"dogru":[0.3808,0.1755]},"noresistor":{"yanlis":[0.6087,0.8263],"dogru":[0.5709,0.6282]},"wrongpin":{"yanlis":[0.5936,0.7641],"dogru":[0.5047,0.7851]}};
  const SERI_HATA = {
    id: 'baud',
    check: 'Seri Monitör\'ün sağ altındaki hız <strong>115200</strong> mü?',
    fix: 'Koddaki <code>Serial.begin</code> hızı ile ekrandaki hız aynı değilse yazı anlamsız işaretlere döner.'
  };
  function hataOgeleri() {
    const ids = cfg.hataSahneleri || [];
    const devre = (window.WiringDiagram && WiringDiagram.ERROR_ITEMS) || [];
    return ids.map(function (id) {
      return id === 'baud' ? SERI_HATA : devre.find(function (it) { return it.id === id; });
    }).filter(Boolean);
  }
  function hataResimHtml(it) {
    if (it.id === 'baud') {
      return `<div class="hata-seri"><span class="ks-pencere"><span class="ks-pencere-baslik">Seri Monitör</span>
        <span class="hs-yazi">KIRMIZI<br>YESIL</span></span>
        <span class="hs-hiz"><span class="hs-hiz-ad">hız</span><b class="hs-hiz-deger">115200</b></span></div>`;
    }
    const m = HATA_ISARET[it.id] || { yanlis: [0.5, 0.5], dogru: [0.5, 0.5] };
    const d = m.dogru;
    return `<div class="hata-foto" data-yanlis="${m.yanlis.join(',')}" data-dogru="${d.join(',')}">
        <img class="hf-yanlis" src="assets/img/hata/${it.id}-yanlis.webp" alt="" draggable="false">
        <img class="hf-dogru" src="assets/img/hata/${it.id}-dogru.webp" alt="" draggable="false">
        <span class="hata-halka" style="left:${d[0] * 100}%;top:${d[1] * 100}%"></span>
      </div>`;
  }
  function hataKartlariHtml() {
    const ogeler = hataOgeleri();
    if (!ogeler.length) return '';
    return `<div class="hata-sahne">
      <p class="hata-sahne-baslik">En sık olanlar: senin tezgahın <strong>doğrusu</strong> gibi mi?</p>
      <ol class="hata-kartlar">${ogeler.map(function (it, i) {
        return `<li class="hata-kart" data-hata="${i}">
          <div class="hata-soru"><span class="err-no">${i + 1}</span><span>${it.check}</span></div>
          <div class="hata-resim is-dogru">${hataResimHtml(it)}</div>
          <span class="hata-etiket is-dogru">✓ Doğrusu</span>
          <p class="err-fix">${it.fix}</p>
          <button type="button" class="err-toggle" aria-pressed="false" onclick="LessonEngine.hataCevir(${i})">Yanlışı göster</button>
        </li>`;
      }).join('')}</ol></div>`;
  }
  function hataGoster(i, yanlis) {
    const it = hataOgeleri()[i];
    const kart = document.querySelector('.hata-kart[data-hata="' + i + '"]');
    if (!it || !kart) return;
    const resim = kart.querySelector('.hata-resim'), etiket = kart.querySelector('.hata-etiket');
    const btn = kart.querySelector('.err-toggle');
    resim.classList.toggle('is-dogru', !yanlis); resim.classList.toggle('is-yanlis', yanlis);
    etiket.classList.toggle('is-dogru', !yanlis); etiket.classList.toggle('is-yanlis', yanlis);
    etiket.textContent = yanlis ? '✗ Yanlış' : '✓ Doğrusu';
    btn.setAttribute('aria-pressed', String(yanlis));
    btn.textContent = yanlis ? 'Doğrusunu göster' : 'Yanlışı göster';
    const foto = resim.querySelector('.hata-foto');
    if (foto) {
      const xy = foto.getAttribute(yanlis ? 'data-yanlis' : 'data-dogru').split(',');
      const halka = foto.querySelector('.hata-halka');
      halka.style.left = (xy[0] * 100) + '%';
      halka.style.top = (xy[1] * 100) + '%';
    } else if (!yanlis) {
      const y = resim.querySelector('.hs-yazi'), h = resim.querySelector('.hs-hiz-deger');
      if (y) y.innerHTML = 'KIRMIZI<br>YESIL';
      if (h) h.textContent = '115200';
    } else {
      const y = resim.querySelector('.hs-yazi'), h = resim.querySelector('.hs-hiz-deger');
      if (y) y.textContent = 'ÿ⸮x⸮⸮ÿ⸮';
      if (h) h.textContent = '9600';
    }
    if (window.Hareket) Hareket.hataGecis(resim, yanlis);
  }
  function hataCevir(i) {
    const btn = document.querySelector('.hata-kart[data-hata="' + i + '"] .err-toggle');
    if (btn) hataGoster(i, btn.getAttribute('aria-pressed') !== 'true');
  }
  /* Hareket açıksa her kart sırayla: yanlış → 2,2 sn → doğrusu. */
  function hataSahnesiOynat() {
    if (!window.Hareket || !Hareket.aktif) return;
    hataOgeleri().forEach(function (_, i) {
      hataGoster(i, true);
      setTimeout(function () {
        const kart = document.querySelector('.hata-kart[data-hata="' + i + '"]');
        if (kart && kart.isConnected) hataGoster(i, false);
      }, 2200 + i * 500);
    });
  }

  // Adım yeniden çizildiğinde önceki cevabı geri koyar.
  function restoreLedCheck() {
    if (state.ledCheckAnswer !== null) ledCheck(state.ledCheckAnswer, true);
  }

  /* Öğretmen yok, AI yoldaşı öğretmen: çocuğun tarif edemeyeceği teknik
     ayrıntılar promptun içinde gidiyor ve soru AI'ya hazır ulaşıyor. */
  function askHelpFromAI() {
    if (!cfg.helpPrompt) return;
    const text = window.Profile ? Profile.personalize(cfg.helpPrompt) : cfg.helpPrompt;
    const sent = openAiTool(text);
    copyPromptText(cfg.helpPrompt, aiSentMessage(sent));
  }

  // ---------- QUIZ ----------
  /* Doğru şık veride DÜZ SAYI olarak durmaz. Eskiden her soruda
     "correct": 0 yazıyordu ve bu dosya tarayıcıya gittiği için F12 açan
     çocuk cevapları okuyabiliyordu. Hedef hile yapmayı imkânsızlaştırmak
     DEĞİL — statik sitede bu mümkün değil, sunucu yok. Hedef KAZARA
     görmeyi engellemek: merakla geliştirici konsolunu açan çocuk cevabı
     istemeden görmesin. O yüzden kriptografik hash değil, kısa ve
     bağımlılıksız FNV-1a yeterli (SubtleCrypto file:// altında her
     tarayıcıda güvenli bağlam saymıyor; bu her yerde çalışır).

     Bakım: cevap artık insan tarafından okunamıyor. Bir soruyu
     güncellerken doğru şıkkı görmek için tools/quiz-answers.mjs --show
     kullanılır — hash'ten geri çözer. Cevap TEK temsilde kalır (hash),
     yani ayrışacak ikinci bir kopya yok. */
  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  function optionHash(qIndex, optionText) {
    return fnv1a(cfg.quizStorageKey + '|' + qIndex + '|' + optionText);
  }

  /* Eski "correct" alanı hâlâ desteklenir — veri dosyası dönüştürülmemiş
     olsa da sınav çalışmaya devam etsin diye. */
  function isCorrectOption(q, qIndex, optIndex) {
    if (q.answer) return optionHash(qIndex, q.options[optIndex]) === q.answer;
    return optIndex === q.correct;
  }


  function renderQuiz() {
    state.quizIndex = 0;
    const alreadyPassed = Store.get(cfg.quizStorageKey) === '1';
    state.quizPassed = alreadyPassed;
    if (alreadyPassed) refreshGates();
    const questions = cfg.quizQuestions;
    const area = document.getElementById('interactiveArea');
    area.innerHTML = `
      <div class="quiz-box quiz-sinav">
        <div class="quiz-head"><strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-clipboard"/></svg>Mini Sınav</strong><span id="quizCounter">Soru 1 / ${questions.length}</span></div>
        ${alreadyPassed ? `<div class="callout green" style="margin-top:8px;"><svg class="icon callout-icon"><use href="#icon-medal"/></svg><span><strong>Bu sınavı zaten tamamladın!</strong> Sorular arasında serbestçe gezinebilirsin, tekrar cevaplamana gerek yok.</span></div>` : ''}
        <div class="quiz-progress"><div class="quiz-progress-fill" id="quizProgressFill" style="width:${alreadyPassed ? 100 : 0}%;"></div></div>
        <div id="quizBody"></div>
      </div>`;
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    state.quizAwaitNext = false;
    const questions = cfg.quizQuestions;
    const q = questions[state.quizIndex];
    const body = document.getElementById('quizBody');
    const alreadyPassed = Store.get(cfg.quizStorageKey) === '1';

    if (alreadyPassed) {
      body.innerHTML = `
        <div class="quiz-question">${q.q}</div>
        ${q.options.map((opt, i) => `<div class="quiz-option${isCorrectOption(q, state.quizIndex, i) ? ' correct' : ''}" style="pointer-events:none;">${String.fromCharCode(65 + i)}) ${opt}</div>`).join('')}
        ${q.hint ? `<div class="callout green" style="margin-top:10px;"><svg class="icon callout-icon"><use href="#icon-brain"/></svg><span><strong>Çözüm Açıklaması:</strong> ${q.hint}</span></div>` : ''}
        <div style="display:flex; gap:8px; margin-top:14px;">
          <button class="ai-prompt-btn" ${state.quizIndex === 0 ? 'disabled' : ''} onclick="LessonEngine.quizPrev()">◀ Önceki Soru</button>
          <button class="ai-prompt-btn" ${state.quizIndex === questions.length - 1 ? 'disabled' : ''} onclick="LessonEngine.quizNext()">Sonraki Soru ▶</button>
        </div>`;
      document.getElementById('quizCounter').textContent = `Soru ${state.quizIndex + 1} / ${questions.length}`;
      return;
    }

    body.innerHTML = `
      <div class="quiz-question">${q.q}</div>
      ${/* ŞIK = <button>, <div onclick> DEĞİL: div'e Tab ile ulaşılmıyordu,
            yani klavyeyle çalışan (ya da ekran okuyucu kullanan) çocuk mini
            sınavı hiç çözemiyordu. Aynı hata "tıkla-öğren" satırlarında
            elle düzeltilmişti (role+tabindex+keydown); burada doğru öğe
            zaten var, onu kullanmak yeterli — Enter ve Boşluk kendiliğinden
            çalışıyor. Görünüm styles.css'te birebir korundu. */''}
      ${q.options.map((opt, i) => `<button type="button" class="quiz-option" onclick="LessonEngine.answerQuiz(this, ${i})">${String.fromCharCode(65 + i)}) ${opt}</button>`).join('')}
      ${/* İPUCU = cevabı değil YOLU verir (Arda 2026-09-29: "cevap bu demek
            yerine yolu vereceksin"). Kapalı durur, isteyen açar; yanlış
            cevapta kendiliğinden açılır. "hint" ayrı şey: doğru cevaptan
            SONRA gelen çözüm açıklaması. */''}
      ${q.ipucu ? `<details class="quiz-ipucu"><summary><svg class="icon"><use href="#icon-bulb"/></svg><span class="quiz-ipucu-baslik">Takıldın mı? İpucuna bak</span><span class="quiz-ipucu-ac" aria-hidden="true"></span></summary><div class="quiz-ipucu-body">${q.ipucu}</div></details>` : ''}
    `;
    document.getElementById('quizCounter').textContent = `Soru ${state.quizIndex + 1} / ${questions.length}`;
  }

  function quizNext() { state.quizIndex++; renderQuizQuestion(); }
  function quizPrev() { state.quizIndex--; renderQuizQuestion(); }

  function answerQuiz(el, idx) {
    const questions = cfg.quizQuestions;
    const q = questions[state.quizIndex];
    const options = el.parentElement.querySelectorAll('.quiz-option');

    if (isCorrectOption(q, state.quizIndex, idx)) {
      options.forEach(o => o.style.pointerEvents = 'none');
      el.classList.add('correct');
      document.getElementById('quizProgressFill').style.width = ((state.quizIndex + 1) / questions.length * 100) + '%';
      if (q.hint) {
        const hint = document.createElement('div');
        hint.className = 'callout green';
        hint.innerHTML = '<svg class="icon callout-icon"><use href="#icon-brain"/></svg><span><strong>Çözüm Açıklaması:</strong> ' + q.hint + '</span>';
        el.parentElement.appendChild(hint);
      }
      if (state.quizIndex < questions.length - 1) {
        /* "Sonraki Soru" düğmesi yok: İleri sonraki soruya geçirir.
           Arda (2026-09-23): "ben bile sonraki soruya basmadan ileriye
           basıyorum" — çocuğun eli zaten İleri'de. */
        state.quizAwaitNext = true;
        const next = document.createElement('div');
        next.className = 'quiz-next-hint';
        next.style.marginTop = '14px';
        next.style.fontWeight = '600';
        next.textContent = "Sonraki soru için İleri'ye bas ▶";
        el.parentElement.appendChild(next);

        if (window.FX) {
          FX.correct(el);
          FX.awardOnce(cfg.xpPrefix + '_quiz_' + state.quizIndex, 20, 'XP', el);
          const s = FX.streakHit();
          showToast(s >= 3 ? `🔥 ${s} doğru üst üste! Efsanesin!` : (s === 2 ? "Arka arkaya doğru! 🔥" : "Doğru!"));
          if (s >= 3) FX.burst(el, { count: 22, power: 200, emojis: ['🔥', '⭐', '✨'] });
        } else {
          showToast("Doğru!");
        }
      } else {
        state.quizPassed = true;
        Store.set(cfg.quizStorageKey, '1');
        const done = document.createElement('div');
        done.className = 'callout green';
        done.innerHTML = '<svg class="icon callout-icon"><use href="#icon-medal"/></svg><span><strong>Tüm soruları doğru cevapladın!</strong> Şimdi İleri butonuyla sonraki adıma geçebilirsin.</span>';
        el.parentElement.appendChild(done);
        showToast("Tebrikler! Mini Sınavı Tamamladın.");

        if (window.FX) {
          FX.correct(el);
          FX.awardOnce(cfg.xpPrefix + '_quiz_' + state.quizIndex, 20, 'XP', el);
          FX.streakHit();
          FX.awardOnce(cfg.xpPrefix + '_quiz_done', 50, 'XP bonus', done);
          FX.celebrate({
            emoji: '🧠',
            title: 'Mini Sınav Tamam!',
            sub: cfg.quizCelebrateSub || '6 sorunun hepsini doğru bildin. Rozet çok yakın!',
            confetti: 120,
            duration: 3000
          });
        }
        refreshGates();
        if (typeof cfg.onReadyGlowChange === 'function') cfg.onReadyGlowChange();
      }
    } else {
      el.classList.add('wrong');
      setTimeout(() => el.classList.remove('wrong'), 600);
      const ipucu = el.parentElement.querySelector('.quiz-ipucu');
      if (ipucu) ipucu.open = true;
      showToast("Tekrar Dene! Doğru cevabı bulana kadar devam et.", 'warn');
      if (window.FX) FX.wrong(el);
    }
  }

  // ---------- ADIM NAVİGASYONU VE KİLİTLER ----------
  /* cfg.gates: { adimNo: fn } — fn true dönerse kapı açık, string
     dönerse kapı kapalı ve o metin öğrenciye gösterilir. Kapı "o
     adımdan İLERİ çıkışı" korur (ör. 7 = sınav geçilmeden 8'e geçilmez). */
  function gateFor(step) {
    const gate = cfg.gates && cfg.gates[step];
    if (!gate) return null;
    if (window.Yonetici && Yonetici.aktif('kilit')) return null;   // yonetici.js
    if (state.devamSiniri && step < state.devamSiniri) return null; // bu kapıyı daha önce geçti (devam_v1)
    const res = gate();
    if (res === true || res == null) return null;
    return typeof res === 'string' ? res : 'Bu adımı tamamlamadan ilerleyemezsin.';
  }

  /* Şu anda ileri gidilebilecek en yüksek adım: 1'den başlar, ilk
     kapalı kapıda durur. Adım noktalarının "kilitli" görünmesi için de
     kullanılır — öğrenci nereye kadar gidebileceğini görür. */
  function maxAllowedStep() {
    for (let s = 1; s < cfg.totalSteps; s++) {
      if (gateFor(s)) return s;
    }
    return cfg.totalSteps;
  }

  function navigate(target) {
    target = Math.max(1, Math.min(cfg.totalSteps, target));
    if (target === state.currentStep) return false;

    // İleri giderken aradaki HER kapı kontrol edilir. Tek adım da,
    // nokta ile 8 adım atlama da aynı kontrolden geçer.
    if (target > state.currentStep) {
      for (let s = state.currentStep; s < target; s++) {
        const msg = gateFor(s);
        if (msg) { blockStep(msg, s); return false; }
      }
    }
    applyStep(target);
    return true;
  }

  function changeStep(direction) {
    // Doğru cevaplanmış bir sorudayken İleri adımı değil soruyu ilerletir.
    if (direction === 1 && state.quizAwaitNext && document.getElementById('quizBody')) {
      quizNext();
      return true;
    }
    /* Arda (2026-09-28): "her ders sonunda 9. adıma geldiğinde tekrar
       ileri tuşuna basınca bir sonraki derse geçsin." Son adıma ancak
       bütün kapılardan geçilerek gelinir ve rozet orada kazanılır, yani
       burada ayrıca kapı sorulmaz. Hedef ders verisinden (cfg.nextLesson);
       yoksa İleri eskisi gibi hiçbir şey yapmaz. */
    if (direction === 1 && state.currentStep === cfg.totalSteps && cfg.nextLesson) {
      sonrakiDerseGec();
      return true;
    }
    return navigate(state.currentStep + direction);
  }

  function sonrakiDerseGec() {
    const hedef = cfg.nextLesson.href;
    let gitti = false;
    const git = function () { if (gitti) return; gitti = true; window.location.href = hedef; };
    if (window.Hareket && Hareket.aktif) Hareket.cikis(git);
    else git();
  }

  /* Son adımda İleri'nin nereye gittiği düğmenin kendisinde de yazsın
     (ekran okuyucu + fareyle üstüne gelen çocuk). Metin "İleri" kalıyor:
     320px'te çubuk genişlemesin. */
  function paintNextBtn() {
    const btn = document.getElementById('nextBtn');
    if (!btn) return;
    const son = !!cfg.nextLesson && state.currentStep === cfg.totalSteps;
    btn.classList.toggle('is-sonraki-ders', son);
    if (son) {
      btn.setAttribute('aria-label', cfg.nextLesson.label);
      btn.title = cfg.nextLesson.label;
    } else {
      btn.removeAttribute('aria-label');
      btn.removeAttribute('title');
    }
  }

  function paintStepHeader() {
    const data = cfg.stepsData && cfg.stepsData[state.currentStep - 1];
    if (!data) return;
    const titleEl = document.getElementById('stepTitle');
    const descEl = document.getElementById('stepDescription');
    const indEl = document.getElementById('stepIndicator');
    const fillEl = document.getElementById('lessonProgressFill');
    if (titleEl) titleEl.innerText = data.title;
    if (descEl) descEl.innerHTML = (typeof data.desc === 'function') ? data.desc() : data.desc;
    if (indEl) indEl.innerText = state.currentStep + ' / ' + cfg.totalSteps;
    if (fillEl) fillEl.style.width = (state.currentStep / cfg.totalSteps * 100) + '%';
  }

  function paintDots() {
    document.body.dataset.adim = String(state.currentStep);   // açılışta da (applyStep çağrılmadan)
    /* Bu oturumda 3. adıma (kablo) bir kez gelindiyse geri dönünce de laptop kalır
       (eski istek: "takılıyken 1. adıma dönünce de gelsin"); yalnız SAYFA AÇILIŞI
       1–2. adımdaysa kart tek başına (2026-10-05: "ilk açılırken 1. adımda laptop var"). */
    if (state.currentStep >= 3) document.body.dataset.kabloGoruldu = '1';
    const allowed = maxAllowedStep();
    document.querySelectorAll('#stepDots .step-dot').forEach(function (dot) {
      const step = parseInt(dot.dataset.dot, 10) || 0;
      const locked = step > allowed;
      dot.classList.toggle('active', step === state.currentStep);
      dot.classList.toggle('done', step < state.currentStep);
      dot.classList.toggle('locked', locked);
      // Kilitli nokta aria-disabled DEĞİL: buton gerçekten çalışıyor,
      // basınca "neden geçemiyorsun" mesajını veriyor. disabled demek
      // hem ekran okuyucuya hem otomasyona yanlış bilgi olurdu; durumu
      // etikette söylüyoruz.
      dot.removeAttribute('aria-disabled');
      dot.setAttribute('aria-label', 'Adım ' + step + (locked ? ' — henüz kilitli' : ''));
      if (step === state.currentStep) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });
    paintNextBtn();
    if (window.Hareket) Hareket.rayGit();
  }

  function applyStep(target) {
    state.quizAwaitNext = false;
    const prev = state.currentStep;
    state.currentStep = target;
    // Sahneler (3B kart, düz çizim) adıma göre ne göstereceğini buradan okur:
    // ör. laptop + kablo 1–2. adımda görünmez (kablo kaydı olsa bile).
    document.body.dataset.adim = String(target);

    const stepContentEl = document.querySelector('.step-content');
    const hareketli = !!(window.Hareket && Hareket.aktif);
    // Hareket katmanı açıksa giriş onun işi; CSS animasyonu ikinci kez oynamasın.
    if (stepContentEl && !hareketli) {
      stepContentEl.classList.remove('step-enter');
      void stepContentEl.offsetWidth;
      stepContentEl.classList.add('step-enter');
    }

    paintStepHeader();
    paintDots();
    paintAiSection();
    devamYaz(target);

    // --- DOPAMİN: adım geçişi ödülü ---
    if (window.FX && target !== prev) {
      FX.sound(target > prev ? 'step' : 'back');
      FX.vibrate(14);
      const activeDot = document.querySelector('#stepDots .step-dot.active');
      if (activeDot) FX.hit(activeDot);
      if (target > prev) {
        // Her adım İLK KEZ tamamlandığında XP; ileri-geri gidip puan
        // biriktirmek mümkün olmasın diye awardOnce.
        const anchorEl = activeDot || document.getElementById('lessonProgressFill');
        FX.awardOnce(cfg.xpPrefix + '_step_' + target, 10, 'XP', anchorEl);
        if (activeDot) FX.burst(activeDot, { count: 8, power: 90, emojis: ['✨'] });
      }
    }

    // Derse özgü DOM (simülasyon kutusu, video sarmalayıcı, hotspot'lar,
    // interaktif alanın yeniden çizimi) ilgili ders dosyasında kalır.
    if (typeof cfg.onStepChange === 'function') cfg.onStepChange(target, prev);
    if (typeof cfg.onReadyGlowChange === 'function') cfg.onReadyGlowChange();
    // Yol gösterme (odak.js): ders DOM'u çizildikten SONRA — neyin
    // görüneceğine ve neyin parlayacağına çizilmiş içerik üstünden bakar.
    if (window.Odak) Odak.adim(target, cfg.odak);

    // İçerik ANINDA yerinde; hareket yalnızca görünümü canlandırır.
    if (hareketli) Hareket.adim(stepContentEl, target > prev ? 1 : -1);
  }

  /* Adım noktaları klavyeyle de çalışır (Enter/Space) — eskiden düz
     <span> oldukları için klavye kullanıcısı için tamamen erişilemezdi. */
  function bindDots() {
    document.querySelectorAll('#stepDots .step-dot').forEach(function (dot) {
      if (dot.dataset.bound) return;
      dot.dataset.bound = '1';
      const go = function () {
        const target = parseInt(dot.dataset.dot, 10);
        if (!Number.isFinite(target)) return;
        navigate(target);
      };
      dot.addEventListener('click', go);
      dot.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });
  }

  /* init()'ten sonra çağrılır: ilk adımı boyar, noktaları bağlar ve
     derse "1. adımdasın" der (renderStepContent buradan tetiklenir). */
  function start() {
    bindDots();
    if (window.Hareket) Hareket.rayKur();
    paintStepHeader();
    paintDots();
    paintAiSection();
    if (typeof cfg.onStepChange === 'function') cfg.onStepChange(state.currentStep, 0);
    if (typeof cfg.onReadyGlowChange === 'function') cfg.onReadyGlowChange();
    if (window.Odak) Odak.adim(state.currentStep, cfg.odak);
    devamEt();
  }

  /* Kilit durumu ders içinde değişince (malzeme onaylandı, video bitti,
     sınav geçildi) noktaların kilit görünümü tazelensin. */
  function refreshGates() { paintDots(); if (window.Odak) Odak.tazele(); }

  // ---------- ADIM GEÇİŞİ ENGELİ ----------
  /* Kapı kapalı: mesajı göster, sonra DERSE HABER VER.
     Arda: "3. adımda usb takmadan geçmeye çalışınca oto scroll kabloyu
     tak kısmına gitsin." Toast ekranın üstünde çıkıyor, çocuğun yapması
     gereken şey sayfanın altında kalabiliyor — ne yapacağını okuyor ama
     nereye bakacağını bilmiyor. Motor sayfanın neresinde ne olduğunu
     bilmez, o yüzden götürme işini derse bırakıyor: cfg.onBlocked. */
  function blockStep(msg, step) {
    showToast(msg, 'warn');
    if (window.FX) {
      FX.sound('warn');
      FX.vibrate([16, 40, 16]);
      FX.shake(document.getElementById('nextBtn'));
    }
    if (typeof cfg.onBlocked === 'function') {
      try { cfg.onBlocked(step == null ? state.currentStep : step, msg); } catch (e) {}
    }
    // Ders götürmek istediği yer henüz sırası gelmediği için gizliyse
    // (odak.js), çocuk sıradaki parlayan işe götürülür.
    if (window.Odak) Odak.goster();
  }

  return {
    init, start,
    navigate, changeStep, refreshGates, maxAllowedStep,
    copyText, copyWithToast, lessonCode,
    showToast,
    openModal, closeModal,
    burstConfetti,
    initAccordions,
    renderMaterials, materialsReady,
    pinMapHtml, togglePinMap,
    clickToLearnHtml, selectCtlLine, kodEtkisi, merakSahneHtml, merakSahneKur, hataCevir, copyUserCode, lessonCode,
    toggleAiPrompts, copyPrompt, copyPromptText, aiSentMessage,
    ledCheckHtml, ledCheck, restoreLedCheck, askHelpFromAI,
    paintAiSection, aiTool, setAiTool, openAiTool,
    renderQuiz, renderQuizQuestion, answerQuiz, quizNext, quizPrev,
    blockStep,
    /* Köşedeki AI yardımcısı (ai-helper.js) dersin teknik derinliğini
       buradan okuyor: ders verisi motorun içinde, modülün dışında.
       `stepHelp` bugün hiçbir derste yok — sözleşme baştan tanımlı ki
       Ders 1.3 adıma özel bir not eklemek isterse yeri hazır olsun. */
    get helpPrompt() { return cfg.helpPrompt || ''; },
    get stepHelp() {
      var d = cfg.stepsData && cfg.stepsData[state.currentStep - 1];
      return (d && d.aiHelp) || '';
    },
    get step() { return state.currentStep; },
    /* Robot yardımcı kademe 4: ders sonu sınav pratiği. Yalnız sınav
       GEÇİLDİKTEN sonra açılır — pratik, sınavın yerine geçmez; ödül vermez. */
    get quizPratik() {
      if (!cfg || !cfg.quizQuestions || Store.get(cfg.quizStorageKey) !== '1') return null;
      return {
        sayi: cfg.quizQuestions.length,
        soru: function (i) { var q = cfg.quizQuestions[i]; return q ? { q: q.q, options: q.options.slice(), hint: q.hint || '' } : null; },
        dogruMu: function (i, j) { var q = cfg.quizQuestions[i]; return !!q && isCorrectOption(q, i, j); }
      };
    },
    /* Şu anki adımdan sonrakinin kapısı kapalıysa o kapının cümlesi (robot
       kademe 3 "takılınca tek cümle yol"). Cevap değil, ne yapılacağı. */
    get kapiMesaji() { return cfg ? gateFor(state.currentStep + 1) : null; },
    get nextLesson() { return cfg.nextLesson || null; },
    get totalSteps() { return cfg.totalSteps; },
    get quizPassed() { return state.quizPassed; },
    get ledCheckAnswer() { return state.ledCheckAnswer; },
    get materialsReadyFlag() { return state.materialsReadyFlag; },
  };
})();
