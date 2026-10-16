/* ============================================================
   DERS 1.3 — LED'İ HIZLANDIR
   ============================================================
   İçerik: dk deposu (ozgur79/01_deneyapGiris_dk) → dk0130_hizliLed.
   Veri assets/data/lesson-1-3.js'te; ortak mantık (quiz, malzeme,
   koda-tıkla, AI promptları, "LED yandı mı?") lesson-engine.js'te,
   sayfa tesisatı lesson-page.js'te. Burada yalnızca Ders 1.3'e özgü
   olan kalır:

   - Devre Ders 1.2 ile AYNI. Şema bileşeni (wiring-diagram.js) kurulu
     hâlde açılıyor: çocuk tezgahını onunla karşılaştırıyor, söktüyse
     "Hadi kuralım" ile 1.2'deki rehberli kurulumu yeniden yürütüyor.
   - HIZ MERDİVENİ (Adım 7): dersin asıl işi. Beş basamakta çocuk iki
     delay() sayısını KENDİ değiştiriyor ve ne gördüğünü işaretliyor.
     Hazır kod verilmiyor — sayıyı değiştirip yeniden yüklemek, dersin
     öğrettiği şeyin ta kendisi. Eşiği site söylemiyor, çocuğun
     işaretlerinden okuyor (ders.md §1: "O hızı ders sana vermeyecek").

   Kapılar 1.2'deki gibi ÇOCUĞUN SÖZÜNE bakıyor: site tezgahı göremez.
   ============================================================ */

let currentStep = 1;
let lessonData = null;
let wiring = null;

let devreOnay = false;          // Adım 3: "devrem şemadaki gibi"
let yuklemeUygulandi = false;   // Adım 4: "yükledim, uyguladım"
let kodYuklendi = false;        // yapışkan: Adım 5'e bir kez geçildi
let merdiven = [];              // Adım 7: her basamak null | 'sonuyor' | 'surekli'

function renderStepContent() {
  const area = document.getElementById('interactiveArea');
  area.innerHTML = '';

  if (currentStep === 2) {
    area.innerHTML = LessonEngine.renderMaterials();
  } else if (currentStep === 3) {
    area.innerHTML = UsbLink.html() + `
      <div class="wiring-hero" id="wiringHero" aria-label="Devre şeması"></div>
      ${pinHaritasiHtml()}
      ${devreOnayHtml()}`;
    UsbLink.paint();
    mountMainWiring();
  } else if (currentStep === 4) {
    area.innerHTML = `
      <div class="quiz-box">
        <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-bolt"/></svg>Karta yükleyeceğin kod</strong>
        <p class="step-card-desc" style="margin-top:6px;">Ders 1.2'deki koddan tek farkı: iki <code>delay()</code> artık 1000 değil, <strong>500</strong>.</p>
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
    }) + frekansKartiHtml() + merakKosesiHtml();
    LessonEngine.initAccordions(false);
    LessonEngine.merakSahneKur(area);
  } else if (currentStep === 7) {
    area.innerHTML = merdivenHtml();
    esikBoya();
  } else if (currentStep === 8) {
    LessonEngine.renderQuiz();
  } else if (currentStep === 9) {
    area.innerHTML = `
      <div class="badge-card">
        <img class="badge-medal" src="assets/img/rozet/ders-1-3.webp" alt="" draggable="false">
        <h3 style="color: var(--color-primary);">Üçüncü Kıvılcım Rozeti</h3>
        <p style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">Deneyap Atölyem - LED'i Hızlandır dersini başarıyla tamamladın!</p>
      </div>
      <a class="next-teaser" href="lesson-1-4.html" style="display:block; margin-top:14px; padding:14px 16px; border:2px dashed var(--color-primary); border-radius:var(--radius-md); text-decoration:none; color:inherit;">
        <strong>▶ Sıradaki: Ders 1.4 — İki LED</strong><br>
        İkinci LED geliyor: biri yanarken öteki sönecek.
      </a>`;
    const firstTime = Store.get('badge_lesson_1_3') !== 'earned';
    Store.set('badge_lesson_1_3', 'earned');
    if (window.FX) {
      FX.awardOnce('l13_badge', 100, 'XP', document.querySelector('.badge-medal'));
      FX.celebrate({
        emoji: '🏅',
        nesne: 'rozet/ders-1-3',   // derse özel rozet (blender/ders-rozet.py)
        title: 'Üçüncü Kıvılcım Rozeti!',
        sub: firstTime
          ? 'Ders 1.3 tamamlandı — gözünün sınırını kendin buldun!'
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

/* Sol paneldeki kart+laptop sahnesi yalnızca Adım 1'de: Adım 3'te
   ana alanda zaten kartı da gösteren devre şeması var, ikisi yan yana
   ekranı daraltıyordu. Gradyan id çakışması notu için bkz. lesson-1-2.js
   syncLeftPanel — aynı sebeple panel kapalıyken çizim DOM'dan çıkıyor. */
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

/* ---- Devre şeması ---------------------------------------------------
   1.2'deki bileşenin aynısı, tek fark KURULU açılması: bu derste devre
   kurulmuyor, karşılaştırılıyor. Son adıma setStep, bileşenin içinde
   "devre kuruldu" bayrağını da kaldırıyor (wiring-diagram.js setStep). */
function mountWiringDiagram() {
  if (!window.WiringDiagram) return;
  const host = document.createElement('div');
  wiring = window.wiring = WiringDiagram.mount({
    container: host,
    steps: lessonData.wiringSteps,
    guide: lessonData.wiringGuide,
    partInfo: (id) => (window.PartsGallery ? PartsGallery.get(id) : null),
    doneText: 'Kodu bir sonraki adımda yükleyeceksin.',
    /* 1.2'nin kodu hâlâ kartta: kablo takılıysa LED saniyede bir yanıp
       söner (şema da öyle gösteriyor). "Henüz yanmaz" burada yanlış olurdu. */
    doneCheck: "Kartında Ders 1.2'nin kodu duruyorsa LED saniyede bir yanıp söner.",
    onStepChange: function () { LessonEngine.refreshGates(); }
  });
  wiring.setStep(WiringDiagram.STEP_COUNT - 1);
}

function mountMainWiring() {
  if (!wiring) return;
  const host = document.getElementById('wiringHero');
  if (host && wiring.element.parentElement !== host) host.appendChild(wiring.element);
  heroYuksekligiAyarla();
}

/* Ölçü gerekçesi lesson-1-2.js heroYuksekligiAyarla'da: sahne alttaki
   sabit gezinme çubuğunun altında kalmasın, sayılar elle yazılmasın. */
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
  /* Şemadaki LED kodla aynı ritimde yansın: 1.2'nin kodu (1 sn) karta
     yüklüyken 1 sn, bu dersin kodu (yarım sn) yüklendikten sonra yarım
     saniye. Ritim CSS'te (lesson-1-3.css .l13-hizli). */
  wiring.element.classList.toggle('l13-hizli', kodYuklendi);
}

/* ---- Adım 3: "devrem şemadaki gibi" --------------------------------- */
function devreOnayHtml() {
  return `
    <div class="quiz-box${devreOnay ? ' is-done' : ''}" id="devreOnayKart" style="margin-top:14px;">
      <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-breadboard"/></svg>Seninki de böyle mi?</strong>
      <p class="step-card-desc" style="margin-top:6px;">LED'in uzun bacağı <strong>D5</strong>'e (kartta <strong>MI</strong>), kısa bacağı dirençten <strong>GND</strong>'ye gidiyor mu? Söktüysen yukarıdaki <strong>Hadi kuralım</strong> ile yeniden kur.</p>
      <button type="button" class="ai-prompt-btn yukleme-onay" id="devreOnayBtn"
              onclick="devremHazir(this)"${devreOnay ? ' disabled' : ''}>
        <svg class="icon"><use href="#icon-${devreOnay ? 'check' : 'bolt'}"/></svg>${devreOnay ? 'Devrem hazır' : 'Devrem şemadaki gibi'}
      </button>
    </div>`;
}

function devremHazir(btn) {
  devreOnay = true;
  const kart = document.getElementById('devreOnayKart');
  if (kart) kart.classList.add('is-done');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<svg class="icon"><use href="#icon-check"/></svg>Devrem hazır';
  }
  if (window.FX) { try { FX.sound('unlock'); FX.pop(btn, 1.18); } catch (e) {} }
  LessonEngine.refreshGates();
  updateReadyGlow();
}

function pinHaritasiHtml() {
  return LessonEngine.pinMapHtml({
    id: 'pinMapBody',
    icon: 'icon-box',
    title: 'Pini kartta bulamıyor musun?',
    body: 'Kartın üzerinde <code>D5</code> yazmaz. O pinin yanında <strong>MI</strong> yazar — ikisi aynı pindir. Kodda <code>D5</code>, kartta <strong>MI</strong>.',
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
      <p class="step-card-desc yukleme-onay-not">LED beklediğin gibi yanmasa bile bas — ona <strong>Adım 5</strong>’te birlikte bakacağız.</p>
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
   verilirse boğar). Ekranda başlık, tıklayınca hesap. ---------------- */
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

/* ders.md §5 "İleri analiz". Tablo hız merdiveniyle aynı sayılardan
   türetiliyor, elle ikinci bir kopya yazılmıyor. */
function frekansKartiHtml() {
  const satirlar = [{ hiz: 2, delay: 250 }].concat(lessonData.hizMerdiveni)
    .sort((a, b) => b.delay - a.delay)
    .map(r => `<tr><td><code>${r.delay}</code> ms</td><td>${2 * r.delay} ms</td><td><strong>${r.hiz}</strong> Hz</td></tr>`)
    .join('');
  const govde = `
    <p class="step-card-desc">Bir tam tur (yan + sön) iki <code>delay()</code> sürer, yani <code>2 × delay</code> milisaniye. Saniyede kaç tur olduğu buradan çıkar:</p>
    <div class="math-card" style="margin-top:8px;">
      <div><em>frekans</em> = 1000 ÷ (2 × <em>delay</em>)</div>
      <div style="margin-top:4px; font-size:12px; color:var(--color-text-muted);">Birimi hertz (Hz): saniyede kaç tur.</div>
    </div>
    <table class="l13-tablo">
      <thead><tr><th>delay</th><th>bir tur</th><th>frekans</th></tr></thead>
      <tbody>${satirlar}</tbody>
    </table>
    <p class="step-card-desc">Ters yönde de çalışır: saniyede 25 kez istiyorsan <code>delay = 1000 ÷ (2 × 25) = 20</code> ms.</p>`;
  return acilirKutu('frekansBody', 'icon-brain', 'Hesabını merak ediyorsan: frekans', govde);
}

function merakKosesiHtml() {
  const m = lessonData.merakKosesi;
  return acilirKutu('merakBody', 'icon-search', m.baslik, LessonEngine.merakSahneHtml(m.sahne) + `<p class="step-card-desc">${m.metin}</p>`);
}

/* ---- Adım 7: HIZ MERDİVENİ ------------------------------------------ */
function merdivenTamam() {
  return lessonData.hizMerdiveni.every((_, i) => !!merdiven[i]);
}

function merdivenHtml() {
  const satir = (r, i) => {
    const c = merdiven[i];
    return `
      <li class="l13-basamak${c ? ' is-done' : ''}" id="basamak${i}">
        <div class="l13-basamak-hiz"><span class="l13-no">${i + 1}</span><span>Saniyede <strong>${r.hiz}</strong> kez</span></div>
        <div class="l13-basamak-kod"><code>delay(${r.delay});</code> <span>iki satırda da</span></div>
        <div class="l13-basamak-sec" role="group" aria-label="Basamak ${i + 1}: ne gördün?">
          <button type="button" class="led-check-btn ok${c === 'sonuyor' ? ' selected' : ''}" onclick="merdivenIsaretle(${i}, 'sonuyor')">Yanıp sönüyor</button>
          <button type="button" class="led-check-btn no${c === 'surekli' ? ' selected' : ''}" onclick="merdivenIsaretle(${i}, 'surekli')">Sürekli yanıyor gibi</button>
        </div>
      </li>`;
  };
  const sorun = lessonData.merdivenSorun.map(s =>
    `<div class="callout"><svg class="icon callout-icon"><use href="#icon-search"/></svg><span><strong>${s.title}</strong> ${s.text}</span></div>`).join('');
  const yetiskin = `
    <p class="step-card-desc">Bu kart çocuğa değil, yanındaki büyüğe yazıldı. Cevabı söylemeyin, şu üçünü sırayla sorun:</p>
    <ol class="l13-liste">${lessonData.yetiskinKarti.map(s => `<li>${s}</li>`).join('')}</ol>
    <p class="step-card-desc">Cevabı siz vermeyin; bu sorular yalnızca gözlemini netleştirmesine yardım etsin.</p>`;
  return `
    <div class="quiz-box">
      <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-bolt"/></svg>Hız merdiveni</strong>
      <p class="step-card-desc" style="margin-top:6px;">Her basamakta: Arduino IDE'de iki <code>delay()</code> sayısını yaz → <strong>Yükle</strong> → LED'ine bak → ne gördüysen işaretle. Doğru ya da yanlış cevap yok; senin gözün ne görüyorsa o.</p>
      <ol class="l13-merdiven">${lessonData.hizMerdiveni.map(satir).join('')}</ol>
      <div id="esikKutu" aria-live="polite"></div>
    </div>
    ${acilirKutu('merdivenSorunBody', 'icon-alert', 'LED hızlanmıyor mu?', sorun)}
    <div class="quiz-box" style="margin-top:14px;">
      <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-clipboard"/></svg>SEN YAP</strong>
      <ol class="l13-liste">${lessonData.senYap.map(s => `<li>${s}</li>`).join('')}</ol>
    </div>
    ${acilirKutu('yetiskinBody', 'icon-brain', 'Yanındaki yetişkine', yetiskin)}`;
}

function merdivenIsaretle(i, secim) {
  const ilk = !merdiven[i];
  const oncedenTamam = merdivenTamam();
  merdiven[i] = secim;
  const li = document.getElementById('basamak' + i);
  if (li) {
    li.classList.add('is-done');
    li.querySelectorAll('.led-check-btn').forEach(b => {
      b.classList.toggle('selected', b.classList.contains(secim === 'sonuyor' ? 'ok' : 'no'));
    });
  }
  if (window.FX && ilk && li) {
    try { FX.awardOnce('l13_merdiven_' + i, 10, 'XP', li); } catch (e) {}
  }
  esikBoya();
  /* Ödül anı: beşinci basamak işaretlendi — ses buraya saklanır. */
  if (!oncedenTamam && merdivenTamam() && window.FX) {
    try {
      FX.sound('unlock');
      FX.burst(document.getElementById('esikKutu'), { count: 18, power: 150, emojis: ['👁️', '⚡', '✨'] });
    } catch (e) {}
  }
  LessonEngine.refreshGates();
  updateReadyGlow();
}

/* Eşik site tarafından SÖYLENMİYOR, çocuğun işaretlerinden okunuyor:
   "sürekli" dediği ilk basamak. Bir öncekinde hâlâ sönme görüyorsa eşik
   ikisinin arasında. */
function esikBoya() {
  const kutu = document.getElementById('esikKutu');
  if (!kutu) return;
  if (!merdivenTamam()) {
    const kalan = lessonData.hizMerdiveni.length - merdiven.filter(Boolean).length;
    kutu.innerHTML = kalan < lessonData.hizMerdiveni.length
      ? `<p class="step-card-desc l13-kalan">${kalan} basamak kaldı.</p>` : '';
    return;
  }
  const m = lessonData.hizMerdiveni;
  const i = merdiven.findIndex(c => c === 'surekli');
  let metin;
  if (i === -1) {
    metin = `Saniyede <strong>${m[m.length - 1].hiz}</strong> kezde bile sönmeyi görüyorsun — keskin göz! Başını sağa sola sallayarak bir daha bak; akşam da dene.`;
  } else if (i === 0) {
    metin = `İlk basamakta bile sürekli gördün. Saniyede 1 kez yavaş bir hız — kodu yeniden yüklediğinden emin ol ve <strong>LED hızlanmıyor mu?</strong> kutusuna bak.`;
  } else {
    metin = `Senin eşiğin: saniyede <strong>${m[i - 1].hiz}</strong> ile <strong>${m[i].hiz}</strong> kez arasında. Bu sayıyı defterine yaz.`;
  }
  kutu.innerHTML = `
    <div class="callout green" style="margin-top:12px;"><svg class="icon callout-icon"><use href="#icon-medal"/></svg>
      <span>${metin} Gerçekte LED hâlâ sönüyor; değişen LED değil, <strong>gözün</strong>.</span>
    </div>`;
}

function merdiveneGotur() {
  const i = lessonData.hizMerdiveni.findIndex((_, k) => !merdiven[k]);
  const li = document.getElementById('basamak' + (i < 0 ? 0 : i));
  if (!li) return;
  const yumusak = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  li.scrollIntoView({ behavior: yumusak ? 'smooth' : 'auto', block: 'center' });
  vurgula(li);
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
  const el = document.getElementById(id);
  if (!el) return;
  const yumusak = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: yumusak ? 'smooth' : 'auto', block: 'center' });
  vurgula(el);
}

const READY_WHEN = {
  2: () => LessonEngine.materialsReadyFlag,
  3: () => UsbLink.connected() && devreOnay,
  4: () => UsbLink.connected() && yuklemeUygulandi,
  7: () => merdivenTamam(),
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

(function initLesson13() {
  lessonData = window.LESSON_DATA_1_3;
  merdiven = lessonData.hizMerdiveni.map(() => null);

  const usb = () => UsbLink.connected() || UsbLink.gateMessage();

  /* Adım 4'te sayfa ÖNCE "Kodu Kopyala"ya, kopyalanınca "Yükledim"e gider —
     her ziyarette (Arda, 2026-09-30: "ilk önce kodu kopyala sonra yükle").
     Eskiden kod bir kez kopyalandıysa (kalıcı XP kaydı) bu adım atlanıyor,
     odak doğrudan Yükledim'e atlıyordu; dersi tekrar eden bunu görüyordu. */
  LessonEngine.init({
    // Son adımda İleri → sıradaki ders (lesson-engine.js changeStep).
    nextLesson: { href: 'lesson-1-4.html', label: "Sıradaki derse geç: Ders 1.4" },
    xpPrefix: lessonData.xpPrefix,
    /* Kaldığın yerden devam (lesson-engine devam_v1): geçilen adımların sahnesi geri gelir. */
    devamHazirla: function (enIleri) {
      if (enIleri > 3) { UsbLink.geriYukle(); devreOnay = true; }
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
          { s: '#devreOnayBtn', kutu: '#devreOnayKart', bitti: '[disabled]' }
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
      // Hız merdiveni: basamaklar tek tek açılır.
      7: {
        sira: [0, 1, 2, 3, 4].map(i => ({ s: '#basamak' + i, bitti: '.is-done' })),
        daha: ['.pin-map']
      }
    },
    gates: {
      2: () => LessonEngine.materialsReadyFlag ||
           "Önce malzemelerini hazırlayıp 'Malzemeleri Hazırladım!' butonuna basmalısın!",
      3: () => {
        if (!UsbLink.connected()) return UsbLink.gateMessage();
        if (!devreOnay) return "Devreni şemayla karşılaştır, sonra <strong>Devrem şemadaki gibi</strong> düğmesine bas.";
        return true;
      },
      4: () => {
        if (!UsbLink.connected()) return UsbLink.gateMessage();
        if (!yuklemeUygulandi)
          return "Kodu Arduino IDE'de karta yükle, sonra <strong>Yükledim, uyguladım</strong> düğmesine bas. LED yanmasa da olur — ona Adım 5'te bakacağız.";
        return true;
      },
      5: usb,
      6: usb,
      7: () => {
        if (!UsbLink.connected()) return UsbLink.gateMessage();
        if (!merdivenTamam()) return "Beş basamağın hepsini dene ve her birinde ne gördüğünü işaretle.";
        return true;
      },
      8: () => !UsbLink.connected() ? UsbLink.gateMessage()
           : (LessonEngine.quizPassed || "Lütfen önce mini sınavı doğru cevaplayın!")
    },
    onBlocked: function (adim) {
      if (window.UsbLink && !UsbLink.connected()) { UsbLink.focusGate(); return; }
      if (adim === 3 && !devreOnay) karta('devreOnayKart');
      else if (adim === 4 && !yuklemeUygulandi) karta('yuklemeKart');
      else if (adim === 7 && !merdivenTamam()) merdiveneGotur();
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
