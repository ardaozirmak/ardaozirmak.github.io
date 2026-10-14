/* ============================================================
   DERS 1.5 / 1.6 — LED SIRASI DERSLERİ (ortak sayfa betiği)
   ============================================================
   1.5 Kara Şimşek (dk0140) ve 1.6 Trafik Lambası (dk0150) aynı iskelet:
   birkaç LED üst blokta tek sırada, her biri kendi pininde (wiring-diagram.js
   ledSirasi). Derse özgü her şey VERİDE (assets/data/lesson-1-5.js / 1-6.js,
   `ders` alanı): LED'ler ve renkleri, kodun loop() deseni, rozet, sıradaki ders.
   Sayfa yalnız kendi veri dosyasını yükler; bu betik hangisi geldiyse onu kullanır.

   Yapı Ders 1.4'ünkiyle aynı (lesson-1-4.js): kapılar çocuğun sözüne bakar,
   SEN YAP kodu çocuk değiştirir, derinlik isteğe bağlı açılır. 1.4'ten farkı:
   devre baştan kurulur (Arda, 2026-10-05: "yeniden diz, tek sıra").
   ============================================================ */

let currentStep = 1;
let lessonData = null;
let ders = null;
let wiring = null;

let yuklemeUygulandi = false;   // Adım 4: "yükledim, uyguladım"
let kodYuklendi = false;        // yapışkan: Adım 5'e bir kez geçildi
let senYapDurum = {};           // Adım 7: görev id → true | seçim metni

function renderStepContent() {
  const area = document.getElementById('interactiveArea');
  area.innerHTML = '';

  if (currentStep === 2) {
    area.innerHTML = LessonEngine.renderMaterials();
  } else if (currentStep === 3) {
    area.innerHTML = UsbLink.html() + `
      <div class="wiring-hero" id="wiringHero" aria-label="Devre şeması"></div>
      ${pinHaritasiHtml()}`;
    UsbLink.paint();
    mountMainWiring();
  } else if (currentStep === 4) {
    area.innerHTML = `
      <div class="quiz-box">
        <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-bolt"/></svg>Karta yükleyeceğin kod</strong>
        <p class="step-card-desc" style="margin-top:6px;">${ders.kodNotu}</p>
        ${kodOnizlemeHtml()}
        <button class="ai-prompt-btn" style="margin-top:10px;" onclick="LessonEngine.copyUserCode()"><svg class="icon"><use href="#icon-clipboard"/></svg>Kodu Kopyala</button>
      </div>
      ${yuklemeAdimlariHtml()}`;
  } else if (currentStep === 5) {
    area.innerHTML = (ders.seriSahne ? seriSahneHtml() : '') + `<div class="quiz-box">${LessonEngine.ledCheckHtml()}</div>`;
    LessonEngine.restoreLedCheck();
    if (ders.seriSahne) seriSahneKur();
  } else if (currentStep === 6) {
    area.innerHTML = LessonEngine.clickToLearnHtml({
      extraButtonHtml: `<button class="ai-prompt-btn" style="margin-top:12px;" onclick="LessonEngine.copyUserCode()"><svg class="icon"><use href="#icon-clipboard"/></svg>Kodu Panoya Kopyala</button>`
    }) + merakKosesiHtml();
    LessonEngine.initAccordions(false);
    LessonEngine.merakSahneKur(area);
  } else if (currentStep === 7) {
    area.innerHTML = senYapHtml();
  } else if (currentStep === 8) {
    LessonEngine.renderQuiz();
  } else if (currentStep === 9) {
    const s = ders.sonraki;
    area.innerHTML = `
      <div class="badge-card">
        <img class="badge-medal" src="assets/img/rozet/ders-${ders.no.replace('.', '-')}.webp" alt="" draggable="false">
        <h3 style="color: var(--color-primary);">${ders.rozet} Rozeti</h3>
        <p style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">${ders.rozetAlt}</p>
      </div>
      <a class="next-teaser" href="${s.href}" style="display:block; margin-top:14px; padding:14px 16px; border:2px dashed var(--color-primary); border-radius:var(--radius-md); text-decoration:none; color:inherit;">
        <strong>${s.baslik} →</strong><br>${s.metin}
      </a>`;
    const anahtar = 'badge_lesson_' + ders.no.replace('.', '_');
    const firstTime = Store.get(anahtar) !== 'earned';
    Store.set(anahtar, 'earned');
    if (window.FX) {
      FX.awardOnce(lessonData.xpPrefix + '_badge', 100, 'XP', document.querySelector('.badge-medal'));
      FX.celebrate({
        emoji: '🏅',
        nesne: 'rozet/ders-' + ders.no.replace('.', '-'),   // derse özel rozet (blender/ders-rozet.py)
        title: ders.rozet + ' Rozeti!',
        sub: firstTime ? ders.kutlamaAlt : 'Rozetin cebinde. Modül ' + (ders.modul || 1) + ' yolculuğun sürüyor!',
        confetti: 160,
        duration: 3800
      });
    } else {
      LessonEngine.burstConfetti();
    }
  }

  syncLeftPanel();
  syncUsbSahne();
}

/* Sol paneldeki kart+laptop sahnesi yalnızca Adım 1'de (bkz. lesson-1-4.js). */
function syncLeftPanel() {
  const panel = document.getElementById('leftPanel');
  const kart = document.getElementById('layer-kart');
  if (!panel) return;
  const goster = currentStep === 1;
  panel.classList.toggle('is-off', !goster);
  if (kart && window.BoardSVG) {
    if (goster && !kart.innerHTML) kart.innerHTML = BoardSVG.groupMarkup({ ids: true });
    else if (!goster && kart.innerHTML) kart.innerHTML = '';
  }
}

function usbEkIs() {
  if (wiring && wiring.setPlugged) wiring.setPlugged(UsbLink.connected());
  if (wiring && wiring.setCodeUploaded) wiring.setCodeUploaded(kodYuklendi);
}

/* ---- Devre şeması --------------------------------------------------- */
function mountWiringDiagram() {
  if (!window.WiringDiagram) return;
  const host = document.createElement('div');
  wiring = window.wiring = WiringDiagram.mount({
    container: host,
    steps: lessonData.wiringSteps,
    guide: lessonData.wiringGuide,
    partInfo: (id) => (window.PartsGallery ? PartsGallery.get(id) : null),
    ledSirasi: ders.ledSirasi,
    trafikModulu: !!ders.trafikModulu,
    buton: !!ders.buton,                 // Ders 3.1: buton + 10K pull-down (wiring-diagram.js buton düzeni)   // Ders 1.6: trafik lambası modülü (wiring-diagram.js modul düzeni)
    desen: ders.desen,
    emptyTitle: ders.bosBaslik,
    emptyHint: ders.bosIpucu,
    emptyNote: ders.bosNot,
    doneText: 'Kodu bir sonraki adımda yükleyeceksin.',
    doneCheck: ders.bitisKontrol,
    onStepChange: function () { LessonEngine.refreshGates(); updateReadyGlow(); }
  });
}

function mountMainWiring() {
  if (!wiring) return;
  const host = document.getElementById('wiringHero');
  if (host && wiring.element.parentElement !== host) host.appendChild(wiring.element);
  heroYuksekligiAyarla();
}

/* Ölçü gerekçesi lesson-1-2.js heroYuksekligiAyarla'da. */
function heroYuksekligiAyarla() {
  const hero = document.getElementById('wiringHero');
  if (!hero) return;
  let ust = 0, el = hero;
  while (el) { ust += el.offsetTop; el = el.offsetParent; }
  const altNav = document.querySelector('.bottom-nav');
  const alt = altNav ? Math.round(altNav.getBoundingClientRect().height) : 0;
  hero.style.setProperty('--wd-ust', (ust + alt + 6) + 'px');
}
window.addEventListener('resize', heroYuksekligiAyarla);

function syncWiringToStep() {
  if (!wiring) return;
  if (currentStep >= 5) kodYuklendi = true;
  if (wiring.setCodeUploaded) wiring.setCodeUploaded(kodYuklendi);
  wiring.setGuideVisible(currentStep === 3);
  if (wiring.setPlugged) wiring.setPlugged(UsbLink.connected());
}

function devreKuruldu() { return !!(wiring && wiring.isBuilt()); }

function pinHaritasiHtml() {
  return LessonEngine.pinMapHtml({
    id: 'pinMapBody',
    icon: 'icon-box',
    title: ders.pinBaslik,
    body: ders.pinAciklama,
    alt: 'Deneyap Mini v2 genişletilmiş pin diyagramı: sol sırada A0-A7, DA0, DA1, D10, D9, GND, 3V3, 5V; sağ sırada EN, RX, TX, D2, D3, MO, MI, MC, SC, SD, 3V3, GND. MI pini Arduino tarafında D5, MC pini D6 adıyla kullanılır.'
  });
}

/* ---- Adım 4: kod + yükleme ------------------------------------------ */
function kodOnizlemeHtml() {
  const kod = LessonEngine.lessonCode();
  const kacis = kod.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<pre class="kod-onizleme" aria-label="Karta yüklenecek kod"><code>${kacis}</code></pre>`;
}

function yuklemeAdimlariHtml() {
  const adimlar = [
    'Arduino IDE’de eski kodu sil, bu kodu yapıştır.',
    '<b>Araçlar &gt; Kart</b>: <b>Deneyap Mini v2</b> seçili mi bak.',
    '<b>Araçlar &gt; Port</b>: listede görünen portu seç.',
    'Sol üstteki <b>→ Yükle</b> düğmesine bas.'
  ];
  return `
    <div class="quiz-box${yuklemeUygulandi ? ' is-done' : ''}" id="yuklemeKart" style="margin-top:14px;">
      <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-wrench"/></svg>Arduino IDE’de yükle</strong>
      <ol class="yukleme-adimlari">
        ${adimlar.map(a => `<li>${a}</li>`).join('')}
      </ol>
      <button type="button" class="ai-prompt-btn yukleme-onay" id="yuklemeOnayBtn"
              onclick="yuklemeyiUyguladim(this)"${yuklemeUygulandi ? ' disabled' : ''}>
        <svg class="icon"><use href="#icon-${yuklemeUygulandi ? 'check' : 'bolt'}"/></svg>${yuklemeUygulandi ? 'Uyguladım' : 'Yükledim, uyguladım'}
      </button>
      <p class="step-card-desc yukleme-onay-not">LED'ler beklediğin gibi yanmasa bile bas — onlara <strong>Adım 5</strong>’te birlikte bakacağız.</p>
    </div>`;
}

function yuklemeyiUyguladim(btn) {
  yuklemeUygulandi = true;
  const kart = document.getElementById('yuklemeKart');
  if (kart) kart.classList.add('is-done');
  if (btn) {
    btn.classList.add('is-done');
    btn.disabled = true;
    btn.innerHTML = '<svg class="icon"><use href="#icon-check"/></svg>Uyguladım';
  }
  if (window.FX) { try { FX.sound('unlock'); FX.pop(btn, 1.18); } catch (e) {} }
  LessonEngine.refreshGates();
  updateReadyGlow();
}

/* ---- Adım 5 (Ders 2.1): Seri Monitör'ü açmayı gösteren sahne ------------
   Motion design (kurulum-sahne.js SAHNELER.seri), etkileşimli alet değil: çocuk
   aynısını kendi Arduino IDE'sinde yapar. Oynatıcı yalın: oynat/durdur + sarma. */
function seriSahneHtml() {
  return `
    <div class="quiz-box seri-sahne-kutu" style="margin-bottom:14px;">
      <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-search"/></svg>Seri Port Ekranı'nı aç</strong>
      <div class="seri-sahne-cerceve" id="seriCerceve">
        <div class="vp-video seri-sahne" id="seriSahne" role="img" aria-label="Arduino IDE'de Seri Port Ekranı'nı açıp hızı 115200 seçmeyi gösteren animasyon"></div>
        <button type="button" class="vp-fullscreen-btn" id="seriBuyut" title="Videoyu büyüt"><svg class="icon"><use href="#icon-expand"/></svg></button>
        <div class="vp-durdu" aria-hidden="true"><svg viewBox="0 0 12 12"><rect x="2" y="1.5" width="2.8" height="9" rx="0.8" fill="currentColor"/><rect x="7.2" y="1.5" width="2.8" height="9" rx="0.8" fill="currentColor"/></svg>Durdu</div>
      </div>
      <div class="seri-sahne-kontrol">
        <button type="button" class="vp-btn vp-btn-pill" id="seriOynat">▶ Video Oynat</button>
        <input type="range" id="seriCubuk" min="0" max="1000" value="0" aria-label="Animasyonda ilerle">
      </div>
    </div>`;
}

function seriSahneKur() {
  const el = document.getElementById('seriSahne');
  if (!el || !window.KurulumSahne) return;
  KurulumSahne.bagla(el);
  // 2.1: 'seri' (YANDI/SONDU); 2.2: ders.seriSahne = 'seriTrafik' (KIRMIZI/YESIL/SARI).
  el.src = 'sahne:' + (typeof ders.seriSahne === 'string' ? ders.seriSahne : 'seri');
  el.load();
  const dugme = document.getElementById('seriOynat');
  const cubuk = document.getElementById('seriCubuk');
  /* 1.1'deki oynatıcıyla aynı dil (video-player.js): sarı düğme "Video Oynat / Videoyu Durdur";
     bir kez oynamış video durunca sol üstte küçük "Durdu" + hafif karartma (video-player.css .vp-durdu). */
  const cerceve = document.getElementById('seriCerceve');
  const boya = () => {
    dugme.textContent = el.paused ? (el.ended ? '↺ Tekrar İzle' : '▶ Video Oynat') : '⏸ Videoyu Durdur';
    cerceve.classList.toggle('vp-oynuyor', !el.paused);
    cerceve.classList.toggle('vp-bitti', !!el.ended);
    if (!el.paused) cerceve.classList.add('vp-basladi');
  };
  const cevir = () => { if (el.paused) el.play(); else el.pause(); };
  dugme.addEventListener('click', cevir);
  el.addEventListener('click', cevir);
  ['play', 'pause', 'ended'].forEach(o => el.addEventListener(o, boya));
  el.addEventListener('timeupdate', () => { if (el.duration) cubuk.value = Math.round(el.currentTime / el.duration * 1000); });
  cubuk.addEventListener('input', () => { if (el.duration) el.currentTime = cubuk.value / 1000 * el.duration; });
  // Büyüt/küçült: 1.1'deki video oynatıcının düğmesiyle aynı (Fullscreen API, kutu tam ekrana).
  const kutu = document.querySelector('.seri-sahne-kutu');
  const buyut = document.getElementById('seriBuyut');
  const tamMi = () => (document.fullscreenElement || document.webkitFullscreenElement) === kutu;
  const boyaBuyut = () => {
    buyut.querySelector('use').setAttribute('href', tamMi() ? '#icon-collapse' : '#icon-expand');
    buyut.title = tamMi() ? 'Videoyu küçült' : 'Videoyu büyüt';
  };
  buyut.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!tamMi()) { const f = kutu.requestFullscreen || kutu.webkitRequestFullscreen; if (f) f.call(kutu); }
    else { const f = document.exitFullscreen || document.webkitExitFullscreen; if (f) f.call(document); }
  });
  document.addEventListener('fullscreenchange', boyaBuyut);
  document.addEventListener('webkitfullscreenchange', boyaBuyut);
}

/* 2026-10-08 (Arda): "2. modülden itibaren daha fazla kısmını kaldır, bilgi
   versin." Modül 2+ derslerde "Daha fazlası" katlaması yok (odak `daha`
   listeleri silinir) ve açılır kutular açık gelir. Modül 1 olduğu gibi. */
function bilgiAcik() { return (ders.modul || 1) >= 2; }
function dahaSuz(odak) {
  if (!bilgiAcik()) return odak;
  Object.keys(odak).forEach(function (k) { delete odak[k].daha; });
  return odak;
}

/* ---- Adım 6: derinlik isteğe bağlı (Kurallar.md) ---------------------- */
function acilirKutu(id, icon, baslik, govde) {
  const acik = bilgiAcik();
  return `
    <div class="quiz-box pin-map" style="margin-top:14px;">
      <button type="button" class="pin-map-toggle${acik ? ' is-open' : ''}" aria-expanded="${acik}" aria-controls="${id}"
              onclick="LessonEngine.togglePinMap(this)">
        <span style="display:flex; align-items:center; gap:8px;">
          <svg class="icon"><use href="#${icon}"/></svg><strong>${baslik}</strong>
        </span>
        <span class="pin-map-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="pin-map-body" id="${id}"${acik ? '' : ' hidden'}>${govde}</div>
    </div>`;
}

function merakKosesiHtml() {
  const m = lessonData.merakKosesi;
  return acilirKutu('merakBody', 'icon-search', m.baslik, LessonEngine.merakSahneHtml(m.sahne) + `<p class="step-card-desc">${m.metin}</p>`);
}

/* ---- Adım 7: SEN YAP (görev biçimleri lesson-1-4.js ile aynı; CSS lesson-1-4.css) ---- */
function gorevTamam(g) {
  const d = senYapDurum[g.id];
  return g.tip === 'sayi' ? d === true : !!d;
}
function senYapTamam() { return lessonData.senYap.every(gorevTamam); }

function gorevHtml(g, i) {
  const bitti = gorevTamam(g);
  const ipucu = `<details class="quiz-ipucu l14-ipucu"><summary><svg class="icon"><use href="#icon-bulb"/></svg><span class="quiz-ipucu-baslik">Takıldın mı? İpucuna bak</span><span class="quiz-ipucu-ac" aria-hidden="true"></span></summary><div class="quiz-ipucu-body">${g.ipucu}</div></details>`;
  let eylem = '';
  if (g.tip === 'yaptim') {
    eylem = `<button type="button" class="ai-prompt-btn l14-yaptim" onclick="gorevYaptim('${g.id}', this)"${bitti ? ' disabled' : ''}>
        <svg class="icon"><use href="#icon-${bitti ? 'check' : 'bolt'}"/></svg>${bitti ? 'Yaptım' : g.etiket}</button>`;
  } else if (g.tip === 'gozlem') {
    const secim = senYapDurum[g.id];
    eylem = `<div class="l14-sec" role="group" aria-label="Ne gördün?">` +
      g.secenekler.map((s, k) => `<button type="button" class="led-check-btn ${k === 0 ? 'ok' : 'no'}${secim === s ? ' selected' : ''}" onclick="gorevGozlem('${g.id}', ${k})">${s}</button>`).join('') +
      `</div>`;
  } else if (g.tip === 'sayi') {
    // Soru görevden ayrı satırda, ipucu sorunun altında (lesson-1-4.js'teki gerekçe).
    eylem = `<div class="l14-sayi">
        <label class="l14-soru" for="sayi-${g.id}">${g.soru}</label>
        <input type="number" min="0" max="99" inputmode="numeric" id="sayi-${g.id}"${bitti ? ` value="${g.cevap}" disabled` : ''}
               onkeydown="if(event.key==='Enter') gorevSayi('${g.id}')">
        <button type="button" class="ai-prompt-btn" onclick="gorevSayi('${g.id}')"${bitti ? ' disabled' : ''}>Kontrol et</button>
      </div>
      ${ipucu}
      <div class="l14-geri" id="geri-${g.id}" aria-live="polite">${bitti ? `<div class="callout green"><svg class="icon callout-icon"><use href="#icon-check"/></svg><span>${g.dogru}</span></div>` : ''}</div>`;
  }
  return `
    <li class="l14-gorev${bitti ? ' is-done' : ''}" id="gorev-${g.id}">
      <div class="l14-gorev-bas"><span class="l13-no">${i + 1}</span><span>${g.gorev}</span></div>
      ${g.tip === 'sayi' ? '' : ipucu}
      ${eylem}
    </li>`;
}

function senYapHtml() {
  const yetiskin = `
    <p class="step-card-desc">Bu kart çocuğa değil, yanındaki büyüğe yazıldı; AI ve internet gerekmez. Cevabı söylemeyin, şu üçünü sırayla sorun:</p>
    <ol class="l13-liste">${lessonData.yetiskinKarti.map(s => `<li>${s}</li>`).join('')}</ol>`;
  return `
    <div class="quiz-box">
      <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-clipboard"/></svg>SEN YAP</strong>
      <p class="step-card-desc" style="margin-top:6px;">Her görevde: Arduino IDE'de kodu değiştir → <strong>Yükle</strong> → LED'lerine bak.</p>
      <ol class="l14-gorevler">${lessonData.senYap.map(gorevHtml).join('')}</ol>
    </div>
    ${acilirKutu('yetiskinBody', 'icon-brain', 'Yanındaki yetişkine', yetiskin)}`;
}

function gorevBitti(id, el) {
  const li = document.getElementById('gorev-' + id);
  if (li) li.classList.add('is-done');
  if (window.FX && li) {
    try { FX.awardOnce(lessonData.xpPrefix + '_senyap_' + id, 10, 'XP', el || li); } catch (e) {}
    if (senYapTamam()) { try { FX.sound('unlock'); } catch (e) {} }
  }
  LessonEngine.refreshGates();
  updateReadyGlow();
}

function gorevYaptim(id, btn) {
  senYapDurum[id] = true;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<svg class="icon"><use href="#icon-check"/></svg>Yaptım';
  }
  gorevBitti(id, btn);
}

function gorevGozlem(id, k) {
  const g = lessonData.senYap.find(x => x.id === id);
  const ilk = !senYapDurum[id];
  senYapDurum[id] = g.secenekler[k];
  const li = document.getElementById('gorev-' + id);
  if (li) li.querySelectorAll('.led-check-btn').forEach((b, j) => b.classList.toggle('selected', j === k));
  if (ilk) gorevBitti(id, li);
}

function gorevSayi(id) {
  const g = lessonData.senYap.find(x => x.id === id);
  const inp = document.getElementById('sayi-' + id);
  const geri = document.getElementById('geri-' + id);
  if (!inp || !geri || senYapDurum[id] === true) return;
  const v = parseInt(inp.value, 10);
  if (isNaN(v)) {
    geri.innerHTML = `<p class="step-card-desc">Önce bir sayı yaz.</p>`;
    return;
  }
  if (v === g.cevap) {
    senYapDurum[id] = true;
    inp.disabled = true;
    const btn = inp.parentElement.querySelector('button');
    if (btn) btn.disabled = true;
    geri.innerHTML = `<div class="callout green"><svg class="icon callout-icon"><use href="#icon-check"/></svg><span>${g.dogru}</span></div>`;
    gorevBitti(id, inp);
  } else {
    // Yanlışta sayı söylenmez, yol gösterilir; ipucu kendiliğinden açılır.
    geri.innerHTML = `<div class="callout yellow"><svg class="icon callout-icon"><use href="#icon-search"/></svg><span><strong>${v}</strong> değil. Kodu bir daha tara; aşağıdaki ipucu nereye bakacağını söylüyor.</span></div>`;
    const ip = document.querySelector('#gorev-' + id + ' .l14-ipucu');
    if (ip) ip.open = true;
  }
}

function gorevlereGotur() {
  const g = lessonData.senYap.find(x => !gorevTamam(x));
  karta(g ? 'gorev-' + g.id : null);
}

function vurgula(el) {
  if (!el) return;
  el.classList.remove('is-calling');
  void el.offsetWidth;
  el.classList.add('is-calling');
  clearTimeout(el._vurguZaman);
  el._vurguZaman = setTimeout(function () { el.classList.remove('is-calling'); }, 1800);
}

function karta(id) {
  const el = id && document.getElementById(id);
  if (!el) return;
  const yumusak = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: yumusak ? 'smooth' : 'auto', block: 'center' });
  vurgula(el);
}

function devreyeGotur() {
  const hero = document.getElementById('wiringHero');
  if (!hero) return;
  const yumusak = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  hero.scrollIntoView({ behavior: yumusak ? 'smooth' : 'auto', block: 'start' });
  vurgula(document.querySelector('#wd-guide:not([hidden]), #wd-done:not([hidden])'));
}

const READY_WHEN = {
  2: () => LessonEngine.materialsReadyFlag,
  3: () => UsbLink.connected() && devreKuruldu(),
  4: () => UsbLink.connected() && yuklemeUygulandi,
  7: () => senYapTamam(),
  8: () => LessonEngine.quizPassed
};

function onStepChange(step, prevStep) {
  currentStep = step;
  LessonPage.paintStepDom();
  syncWiringToStep();
  renderStepContent();
  if (step !== prevStep && (step === 3 || step === 7)) basaDon();
}

function basaDon() {
  const yumusak = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hedef = document.scrollingElement || document.documentElement;
  hedef.scrollTo({ top: 0, behavior: yumusak ? 'smooth' : 'auto' });
}

(function initDersSira() {
  lessonData = window.LESSON_DATA_3_1 || window.LESSON_DATA_2_2 || window.LESSON_DATA_2_1 || window.LESSON_DATA_1_6 || window.LESSON_DATA_1_5;
  ders = lessonData.ders;

  const usb = () => UsbLink.connected() || UsbLink.gateMessage();

  LessonEngine.init({
    nextLesson: { href: ders.sonraki.href, label: ders.sonraki.label },
    xpPrefix: lessonData.xpPrefix,
    ledSirasi: ders.ledSirasi,   // Koda Tıkla kart sahnesi LED rengini buradan alır
    // "Olmadı" hata sahneleri: modülde LED/direnç hazır (1.6, 2.2) → devre hataları yok.
    hataSahneleri: (ders.trafikModulu ? [] : ['reversed', 'short', 'noresistor']).concat(ders.seriSahne ? ['baud'] : []),
    // Kaldığın yerden devam: geçilen adımların sahnesi geri gelir.
    devamHazirla: function (enIleri) {
      if (enIleri > 3) { UsbLink.geriYukle(); if (wiring) wiring.setStep(wiring.stepCount() - 1); }
      if (enIleri > 4) yuklemeUygulandi = true;
    },
    quizStorageKey: lessonData.quizStorageKey,
    materials: lessonData.materials,
    ctlLines: lessonData.ctlLines,
    stepsData: lessonData.stepsData,
    totalSteps: 9,
    aiStep: 9,
    quizQuestions: lessonData.quizQuestions,
    aiPrompts: lessonData.aiPrompts,
    quizCelebrateSub: lessonData.quizCelebrateSub,
    ledCheck: lessonData.ledCheck,
    helpPrompt: lessonData.helpPrompt,
    odak: dahaSuz({
      3: {
        sira: [
          { s: '#usbTak', bitti: '.is-on' },
          { s: '#wd-guide, #wd-done', bitti: devreKuruldu }
        ],
        daha: ['.pin-map', '#wd-prev', '#wd-next']
      },
      4: {
        sira: [
          { s: '#interactiveArea .ai-prompt-btn:not(.yukleme-onay)' },
          { s: '#yuklemeOnayBtn', kutu: '#yuklemeKart', bitti: '[disabled]' }
        ]
      },
      6: {
        rehber: ['.ctl-line'],
        daha: ['[data-step-card]', '#interactiveArea .ai-prompt-btn', '.pin-map']
      },
      7: {
        sira: lessonData.senYap.map(g => ({ s: '#gorev-' + g.id, bitti: '.is-done' })),
        daha: ['.pin-map']
      }
    }),
    gates: {
      2: () => LessonEngine.materialsReadyFlag ||
           "Önce malzemelerini hazırlayıp 'Malzemeleri Hazırladım!' butonuna basmalısın!",
      3: () => {
        if (!UsbLink.connected()) return UsbLink.gateMessage();
        if (!devreKuruldu()) return ders.kurKapisi;
        return true;
      },
      4: () => {
        if (!UsbLink.connected()) return UsbLink.gateMessage();
        if (!yuklemeUygulandi)
          return "Kodu Arduino IDE'de karta yükle, sonra <strong>Yükledim, uyguladım</strong> düğmesine bas. LED'ler yanmasa da olur — onlara Adım 5'te bakacağız.";
        return true;
      },
      5: usb,
      6: usb,
      7: () => {
        if (!UsbLink.connected()) return UsbLink.gateMessage();
        if (!senYapTamam()) return "SEN YAP görevlerinin hepsini (" + lessonData.senYap.length + ") dene.";
        return true;
      },
      8: () => !UsbLink.connected() ? UsbLink.gateMessage()
           : (LessonEngine.quizPassed || "Lütfen önce mini sınavı doğru cevaplayın!")
    },
    onBlocked: function (adim) {
      if (window.UsbLink && !UsbLink.connected()) { UsbLink.focusGate(); return; }
      if (adim === 3 && !devreKuruldu()) devreyeGotur();
      else if (adim === 4 && !yuklemeUygulandi) karta('yuklemeKart');
      else if (adim === 7 && !senYapTamam()) gorevlereGotur();
    },
    onStepChange: onStepChange,
    onReadyGlowChange: updateReadyGlow,
  });

  const leftKart = document.getElementById('layer-kart');
  if (leftKart && window.BoardSVG) leftKart.innerHTML = BoardSVG.groupMarkup({ ids: true });

  LessonPage.setup({
    readyWhen: READY_WHEN,
    onUsbChange: usbEkIs
  });
  mountWiringDiagram();

  LessonEngine.start();

  const leftToggle = document.getElementById('leftPanelToggle');
  const leftPanel = document.getElementById('leftPanel');
  if (leftToggle && leftPanel) {
    leftToggle.addEventListener('click', () => {
      const collapsed = leftPanel.classList.toggle('collapsed');
      leftToggle.setAttribute('aria-expanded', String(!collapsed));
      const label = leftToggle.querySelector('.panel-toggle-label');
      if (label) label.textContent = collapsed ? 'Büyüt' : 'Küçült';
    });
  }
})();
