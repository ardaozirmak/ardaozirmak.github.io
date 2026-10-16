/* ============================================================
   DERS 1.4 — İKİ LED
   ============================================================
   İçerik: dk deposu (ozgur79/01_deneyapGiris_dk) → dk0030_ikiLed.
   Veri assets/data/lesson-1-4.js'te; ortak mantık (quiz, malzeme,
   koda-tıkla, AI promptları, "LED yandı mı?") lesson-engine.js'te,
   sayfa tesisatı lesson-page.js'te. Burada yalnızca Ders 1.4'e özgü
   olan kalır:

   - Devre: 1.2'nin D5 zinciri tezgahta KURULU ve sökülmüyor. Şema
     bileşeni ikinci-LED modunda açılıyor (wiring-diagram.js,
     ikinciLed: true): birinci zincir sabit, "Hadi kuralım" yalnızca
     ikinci zinciri (LED2, D6 kablosu, direnç 2, GND köprüsü) kurar.
     Adım 3'ün kapısı 1.2'deki gibi devrenin kurulmuş olması.
   - SEN YAP (Adım 7): dk0030 §9'un üç görevi. Çocuk kodu KENDİ
     değiştiriyor; site hazır kod vermiyor. Üçüncü görevin sorusu
     ("adı kaç yerde değiştirdin?") sayıyla cevaplanıyor.

   Kapılar 1.2/1.3'teki gibi ÇOCUĞUN SÖZÜNE bakıyor: site tezgahı göremez.
   ============================================================ */

let currentStep = 1;
let lessonData = null;
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
        <p class="step-card-desc" style="margin-top:6px;">Pinlere artık isim veriyoruz: D5'in adı <code>birinciLed</code>, D6'nın adı <code>ikinciLed</code>.</p>
        ${kodOnizlemeHtml()}
        <button class="ai-prompt-btn" style="margin-top:10px;" onclick="LessonEngine.copyUserCode()"><svg class="icon"><use href="#icon-clipboard"/></svg>Kodu Kopyala</button>
      </div>
      ${yuklemeAdimlariHtml()}`;
  } else if (currentStep === 5) {
    area.innerHTML = `<div class="quiz-box">${LessonEngine.ledCheckHtml()}</div>`;
    LessonEngine.restoreLedCheck();
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
    area.innerHTML = `
      <div class="badge-card">
        <img class="badge-medal" src="assets/img/rozet/ders-1-4.webp" alt="" draggable="false">
        <h3 style="color: var(--color-primary);">Dördüncü Kıvılcım Rozeti</h3>
        <p style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">Deneyap Atölyem - İki LED dersini başarıyla tamamladın!</p>
      </div>
      <a class="next-teaser" href="lesson-1-5.html" style="display:block; margin-top:14px; padding:14px 16px; border:2px dashed var(--color-primary); border-radius:var(--radius-md); text-decoration:none; color:inherit;">
        <strong>Sıradaki: Ders 1.5 — Kara Şimşek →</strong><br>
        Dört LED arasında gidip gelen bir ışık.
      </a>`;
    const firstTime = Store.get('badge_lesson_1_4') !== 'earned';
    Store.set('badge_lesson_1_4', 'earned');
    if (window.FX) {
      FX.awardOnce('l14_badge', 100, 'XP', document.querySelector('.badge-medal'));
      FX.celebrate({
        emoji: '🏅',
        nesne: 'rozet/ders-1-4',   // derse özel rozet (blender/ders-rozet.py)
        title: 'Dördüncü Kıvılcım Rozeti!',
        sub: firstTime
          ? 'Ders 1.4 tamamlandı — iki LED, iki isim, zıt durum!'
          : 'Rozetin cebinde. Modül 1 yolculuğun sürüyor!',
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

/* Sol paneldeki kart+laptop sahnesi yalnızca Adım 1'de (bkz. lesson-1-3.js
   syncLeftPanel — aynı sebep: Adım 3'te ana alandaki şema kartı zaten
   gösteriyor, gradyan id'leri çakışmasın diye kapalıyken çizim DOM'dan çıkar). */
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
    ikinciLed: true,
    emptyTitle: 'Birinci LED devren yerinde. Şimdi ikincisini ekleyelim.',
    emptyHint: '▶ <strong>Hadi kuralım</strong>’a bas: yeni parçaları birlikte, tek tek takacağız.',
    emptyNote: ' Birinci devren söküldüyse önce Ders 1.2’deki gibi yeniden kur.',
    doneText: 'Kodu bir sonraki adımda yükleyeceksin.',
    /* 1.3'ün kodu hâlâ kartta: yalnızca D5 çalışır. İkinci LED yeni kodu
       bekliyor — "hiç yanmıyor" diye telaşlanmasın. */
    doneCheck: "Kartında Ders 1.3'ün kodu duruyorsa yalnızca birinci LED yanıp söner. İkinci LED yeni kodu bekliyor.",
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
  /* Şemadaki LED'ler kodla aynı ritimde: bu dersin kodu yüklenince
     300 + 300 ms ve zıt fazda (lesson-1-4.css .l14-kod). */
  wiring.element.classList.toggle('l14-kod', kodYuklendi);
}

function devreKuruldu() { return !!(wiring && wiring.isBuilt()); }

function pinHaritasiHtml() {
  return LessonEngine.pinMapHtml({
    id: 'pinMapBody',
    icon: 'icon-box',
    title: 'Pini kartta bulamıyor musun?',
    body: 'Kartın üzerinde <code>D5</code> ve <code>D6</code> yazmaz. <code>D5</code>\'in yanında <strong>MI</strong>, <code>D6</code>\'nın yanında <strong>MC</strong> yazar. İkisi yan yana: birinci LED MI\'da, ikinci LED MC\'de.',
    alt: 'Deneyap Mini v2 genişletilmiş pin diyagramı: sol sırada A0-A7, DA0, DA1, D10, D9, GND, 3V3, 5V; sağ sırada EN, RX, TX, D2, D3, MO, MI, MC, SC, SD, 3V3, GND. MI pini Arduino tarafında D5, MO pini D4, MC pini D6 adıyla kullanılır.'
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

/* ---- Adım 6: derinlik İSTEĞE BAĞLI (Kurallar.md: detay metinle
   verilirse boğar). Ekranda başlık, tıklayınca metin. --------------- */
function acilirKutu(id, icon, baslik, govde) {
  return `
    <div class="quiz-box pin-map" data-kutu="${id}" style="margin-top:14px;">
      <button type="button" class="pin-map-toggle" aria-expanded="false" aria-controls="${id}"
              onclick="LessonEngine.togglePinMap(this)">
        <span style="display:flex; align-items:center; gap:8px;">
          <svg class="icon"><use href="#${icon}"/></svg><strong>${baslik}</strong>
        </span>
        <span class="pin-map-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="pin-map-body" id="${id}" hidden>${govde}</div>
    </div>`;
}

function merakKosesiHtml() {
  const m = lessonData.merakKosesi;
  return acilirKutu('merakBody', 'icon-search', m.baslik, LessonEngine.merakSahneHtml(m.sahne) + `<p class="step-card-desc">${m.metin}</p>`);
}

/* ---- Adım 7: SEN YAP ------------------------------------------------ */
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
    /* Soru görevden AYRI satırda (Arda, 2026-09-29: "kafa karıştırıcı").
       Görev ile soru tek cümledeyken "bir adı" mı, iki adın toplamı mı
       sorulduğu belli değildi (4 mü, 8 mi?). İpucu bu görevde sorunun
       ALTINDA: yanlış sayıda kendiliğinden açıldığında girilen kutunun
       hemen altında belirir. */
    eylem = `<div class="l14-sayi">
        <label class="l14-soru" for="sayi-${g.id}">${g.soru}</label>
        <input type="number" min="0" max="20" inputmode="numeric" id="sayi-${g.id}"${bitti ? ` value="${g.cevap}" disabled` : ''}
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
    try { FX.awardOnce('l14_senyap_' + id, 10, 'XP', el || li); } catch (e) {}
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
    /* Yanlışta sayı söylenmez, yol gösterilir (Arda: "cevap bu demek
       yerine yolu vereceksin"). İpucu kutusu kendiliğinden açılır. */
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
  const btn = document.querySelector('#wd-guide:not([hidden]), #wd-done:not([hidden])');
  vurgula(btn);
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

(function initLesson14() {
  lessonData = window.LESSON_DATA_1_4;

  const usb = () => UsbLink.connected() || UsbLink.gateMessage();

  /* Adım 4'te sayfa ÖNCE "Kodu Kopyala"ya, kopyalanınca "Yükledim"e gider —
     her ziyarette (Arda, 2026-09-30: "ilk önce kodu kopyala sonra yükle").
     Eskiden kod bir kez kopyalandıysa (kalıcı XP kaydı) bu adım atlanıyor,
     odak doğrudan Yükledim'e atlıyordu; dersi tekrar eden bunu görüyordu. */
  LessonEngine.init({
    nextLesson: { href: 'lesson-1-5.html', label: "Sıradaki derse geç: Ders 1.5" },
    xpPrefix: lessonData.xpPrefix,
    /* Kaldığın yerden devam (lesson-engine devam_v1): geçilen adımların sahnesi geri gelir. */
    devamHazirla: function (enIleri) {
      if (enIleri > 3) { UsbLink.geriYukle(); if (wiring) wiring.setStep(WiringDiagram.STEP_COUNT - 1); }
      if (enIleri > 4) yuklemeUygulandi = true;
    },
    quizStorageKey: lessonData.quizStorageKey,
    materials: lessonData.materials,
    ctlLines: lessonData.ctlLines,
    hataSahneleri: ['reversed', 'short', 'noresistor'],   // "olmadı" deyince hata kartları
    stepsData: lessonData.stepsData,
    totalSteps: 9,
    aiStep: 9,
    quizQuestions: lessonData.quizQuestions,
    aiPrompts: lessonData.aiPrompts,
    quizCelebrateSub: lessonData.quizCelebrateSub,
    ledCheck: lessonData.ledCheck,
    helpPrompt: lessonData.helpPrompt,
    /* Yol gösterme (assets/js/odak.js): sira = sırayla açılan zorunlu
       işler, rehber = sırayla parlayan keşif, daha = "Daha fazlası". */
    odak: {
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
      // SEN YAP: görevler tek tek açılır.
      7: {
        sira: lessonData.senYap.map(g => ({ s: '#gorev-' + g.id, bitti: '.is-done' })),
        daha: ['.pin-map']
      }
    },
    gates: {
      2: () => LessonEngine.materialsReadyFlag ||
           "Önce malzemelerini hazırlayıp 'Malzemeleri Hazırladım!' butonuna basmalısın!",
      3: () => {
        if (!UsbLink.connected()) return UsbLink.gateMessage();
        if (!devreKuruldu()) return "İkinci LED'i ekle: <strong>Hadi kuralım</strong>'a bas ve dört parçayı da tak.";
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
        if (!senYapTamam()) return "Üç SEN YAP görevini de dene.";
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
