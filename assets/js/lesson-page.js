/* ============================================================
   lesson-page.js — Ders sayfalarının ORTAK iskeleti (window.LessonPage)
   ============================================================
   Ders 1.1 (`script.js`) ve Ders 1.2 (`assets/js/lesson-1-2.js`) ayrı
   dosyalar ve ÖYLE KALIYOR: iki dersin adım içerikleri (hotspot keşfi,
   canlı LED, video oynatıcı / devre şeması, "SEN YAP") gerçekten farklı
   ve lesson-engine.js'in başındaki not haklı — hepsini tek motora
   sıkıştırmak, aradaki gerçek DOM farkını gizleyen kırılgan bir soyutlama
   olurdu.

   Ama iki dosyada BİREBİR AYNI duran bir tesisat vardı ve Ders 1.3
   yazılınca üçüncü kez kopyalanacaktı:

   - inline onclick'lerin çağırdığı ince sarmalayıcılar
     (changeStep / showToast / openModal / closeModal / toggleAiPrompts),
   - `syncUsbSahne()` (altı satır, iki dosyada harfi harfine aynıydı),
   - `updateReadyGlow()` iskeleti — yalnızca "hangi adımda ne şart"
     kısmı derse göre değişiyordu, gerisi aynıydı,
   - `usbDurumDegisti()` iskeleti (sahneyi eşitle → derse özgü iş →
     kapıları tazele → parıltıyı tazele) ve `UsbLink.init` bağlaması,
   - her adımda tekrar eden iki satır: `.fentop-container.step1-hero` ve
     `#codeContainer`un yalnızca kod adımında görünmesi,
   - ders dosyalarının motorun `LessonEngine.step`ini kendi
     `currentStep` değişkenine kopyalaması.

   Burada duran şey bu tesisat. Derse özgü olan her şey ders dosyasında
   kalır; bu modül onu `setup()` seçenekleriyle içeri alır.
   ============================================================ */

(function () {
  'use strict';

  var cfg = {
    readyWhen: {},        // { adımNo: function () { return şartSağlandıMı; } }
    heroStep: 1,          // .fentop-container.step1-hero hangi adımda
    ideStep: null,        // .fentop-container.step4-ide (yalnızca Ders 1.1)
    codeCardsStep: 6,     // #codeContainer hangi adımda flex
    onUsbChange: null     // kablo durumu değişince derse özgü ek iş
  };

  function step() {
    return (window.LessonEngine && LessonEngine.step) || 1;
  }

  /* ---------- inline onclick'lerin çağırdığı sarmalayıcılar ----------
     HTML'de `onclick="changeStep(1)"` gibi çağrılar var; bunların global
     olması şart. Dosya normal <script> ile yüklendiği için buradaki
     atamalar global. */
  window.changeStep = function (direction) { LessonEngine.changeStep(direction); };
  window.showToast = function (msg, type, durationMs) { LessonEngine.showToast(msg, type, durationMs); };
  window.openModal = function (title, bodyHtml) { LessonEngine.openModal(title, bodyHtml); };
  window.closeModal = function () { LessonEngine.closeModal(); };
  window.toggleAiPrompts = function () { LessonEngine.toggleAiPrompts(); };

  /* ---------- kablo/sahne ---------- */
  function syncUsbSahne() {
    var simBox = document.getElementById('simulationBox');
    if (!simBox) return;
    var bagli = UsbLink.connected();
    simBox.classList.toggle('usb-ready', step() >= 3 || bagli);
    simBox.classList.toggle('connected', bagli);
  }

  /* "İleri" HER ADIMDA GORUNUR (Arda, 2026-09-22: "ileri butonu surekli
     gozukür halde olsun; normalde adimi yapip gecebilirdi ama zaten
     gerekli onlemler var, gecmeye calisirsa uyari vermekte").

     Bir tur gizlenmisti (sart saglanana kadar kaldir). Geri alindi: kapi
     zaten LessonEngine.navigate icinde ve kapali kapi hem uyari yaziyor
     hem dugmeyi sallayip cocugu yapmasi gereken yere goturuyor
     (blockStep -> cfg.onBlocked). Dugmeyi gizlemek o yardimi hic
     tetiklemiyordu: cocuk neden ilerleyemedigini OGRENEMIYORDU, ekranda
     kaybolmus bir dugme ariyordu. Kilit kalkmadi, yalnizca gorunur oldu.
     "Hazir" parıltısı (FX.setReady) sinyali vermeye devam ediyor. */
  /* Kilitli adımlarda şart yerine gelir gelmez "İleri" nefes almaya
     başlar — öğrenciye "artık geçebilirsin" sinyali. Hangi adımda hangi
     şart olduğu derse ait, onu `readyWhen` söylüyor. */
  function updateReadyGlow() {
    // Kapı durumu değişmiş olabilir — nokta kilitleri FX olmasa da tazelensin.
    LessonEngine.refreshGates();
    var sart = cfg.readyWhen[step()];
    var ready = false;
    if (typeof sart === 'function') {
      try { ready = !!sart(); } catch (e) { ready = false; }
    }
    if (!window.FX) return;
    FX.setReady(ready);
  }

  function usbDurumDegisti() {
    syncUsbSahne();
    if (typeof cfg.onUsbChange === 'function') cfg.onUsbChange();
    LessonEngine.refreshGates();
    updateReadyGlow();
  }

  /* ---------- her adımda tekrar eden ortak DOM ----------
     Ders dosyasının onStepChange'i EN BAŞTA bunu çağırır, sonra kendi
     işine bakar. */
  function paintStepDom() {
    var s = step();
    var fentop = document.querySelector('.fentop-container');
    if (fentop) {
      fentop.classList.toggle('step1-hero', s === cfg.heroStep);
      /* `adim4-tam-video` BURADA takiliyor, ders dosyasinda degil:
         asagidaki ustBarOlc() ders seridini olcuyor ve serit tam bu
         sinifla gizleniyor (bkz. index-theme.css). Ders dosyasinda
         kalsaydi olcu bir adim GERIDEN gelirdi - sinif paintStepDom'dan
         SONRA takiliyordu. Yalnizca video adimi olan derste anlamli,
         o yuzden cfg.ideStep'e bagli. */
      if (cfg.ideStep !== null) {
        fentop.classList.toggle('step4-ide', s === cfg.ideStep);
        document.body.classList.toggle('adim4-tam-video', s === cfg.ideStep);
      }
    }
    var codeContainer = document.getElementById('codeContainer');
    if (codeContainer) codeContainer.style.display = (s === cfg.codeCardsStep) ? 'flex' : 'none';
    // Şeridin dolgusu adıma göre değişiyor (Adım 4 sıkıştırması), ölçü tazelensin.
    ustBarOlc();
  }

  /* ---------- üst yapışkan barların toplam boyu ----------
     Sol panel yapışkan (bkz. index-theme.css .left-panel): nereye
     yapışacağı, üstünde duran yapışkan başlık + ders şeridinin toplam
     boyuna bağlı. Sabit yazılmaz — şerit ekran darken iki satıra
     düşüyor, Adım 4'te dolgusu kısalıyor, ders sayısı değişebiliyor. */
  function ustBarOlc() {
    var toplam = 0;
    ['.header-bar', '.sidebar-panel'].forEach(function (sec) {
      var el = document.querySelector(sec);
      if (el) toplam += Math.round(el.getBoundingClientRect().height);
    });
    if (toplam > 0) document.documentElement.style.setProperty('--ust-bar', toplam + 'px');
  }
  window.addEventListener('resize', ustBarOlc);
  window.LessonPageUstBar = ustBarOlc;

  function setup(options) {
    options = options || {};
    for (var k in options) {
      if (Object.prototype.hasOwnProperty.call(options, k)) cfg[k] = options[k];
    }
    if (window.UsbLink && UsbLink.init) UsbLink.init({ onChange: usbDurumDegisti });
  }

  /* Ders dosyaları bu ikisini kendi adlarıyla da çağırıyor (ve
     video-player.js `window.updateReadyGlow`u arıyor). */
  window.syncUsbSahne = syncUsbSahne;
  window.updateReadyGlow = updateReadyGlow;
  window.usbDurumDegisti = usbDurumDegisti;

  /* Adımın şartı sağlandı mı? `readyWhen` zaten "İleri" parıltısı için
     duruyordu; köşedeki AI yardımcısı da aynı bilgiyi kullanıyor (çalışan
     çocuğu dürtmemek için). Şartsız adımda null döner — "bilinmiyor",
     "sağlanmadı" değil. */
  function stepReady() {
    var sart = cfg.readyWhen[step()];
    if (typeof sart !== 'function') return null;
    try { return !!sart(); } catch (e) { return null; }
  }

  /* ---------- üst ders sekmeleri: TEK kilit kuralı ----------
     Arda (2026-09-28): "1.2'ye geçince üstten oto 1.3'ün de kilidi
     açılıyor sanki." Her sayfa sekmeleri elle yazıyordu: 1.1'de 1.3 hep
     kilitli, 1.2'de 1.3 hep açıktı. Kural artık tek: bir ders, ondan
     önceki dersin rozeti kazanılmışsa açık. Rozet değişince (ders sonu,
     buluttan senkron) yeniden boyanır. */
  /* Sekmenin data-step'i bu listedeki SIRA (1'den): modül değişince "1.n" varsayımı
     bozulmasın diye (Ders 2.1, 2026-10-06). Bir ders, listede kendinden öncekinin
     rozetiyle açılır: 2.1'in önkoşulu 1.6. */
  var DERSLER = [['1_1', 'index.html'], ['1_2', 'lesson-1-2.html'], ['1_3', 'lesson-1-3.html'],
    ['1_4', 'lesson-1-4.html'], ['1_5', 'lesson-1-5.html'], ['1_6', 'lesson-1-6.html'],
    ['2_1', 'lesson-2-1.html'], ['2_2', 'lesson-2-2.html'], ['3_1', 'lesson-3-1.html']];
  var DERS_SAYFA = {};
  DERSLER.forEach(function (d, i) { DERS_SAYFA[i + 1] = d[1]; });
  function rozetVar(n) { var d = DERSLER[n - 1]; return !!(d && window.Store && Store.get('badge_lesson_' + d[0]) === 'earned'); }
  function dersNo(n) { var d = DERSLER[n - 1]; return d ? d[0].replace('_', '.') : '1.' + n; }
  function sekmeleriBoya() {
    document.querySelectorAll('#lessonList .lesson-item').forEach(function (el) {
      var n = parseInt(el.dataset.step, 10);
      if (!n) return;
      var aktif = el.classList.contains('active');
      var acik = aktif || n === 1 || rozetVar(n - 1) || !!(window.Yonetici && Yonetici.aktif('kilit'));
      var bitti = rozetVar(n);
      var num = el.querySelector('.lesson-num'), ad = el.querySelector('.lesson-name');
      var yeni = document.createElement(acik && !aktif ? 'a' : 'div');
      yeni.className = 'lesson-item' + (aktif ? ' active' : '') + (acik ? '' : ' locked');
      yeni.dataset.step = String(n);
      if (el.id) yeni.id = el.id;
      if (acik && !aktif) { yeni.href = DERS_SAYFA[n]; yeni.style.textDecoration = 'none'; }
      yeni.innerHTML = '<span class="lesson-num">' + (num ? num.textContent : dersNo(n)) + '</span>' +
        '<span class="lesson-name">' + (ad ? ad.textContent : '') + '</span>' +
        (bitti ? '<span class="lesson-status"><svg class="icon"><use href="#icon-check"/></svg></span>'
               : (acik ? '' : '<span class="lock-icon"><svg class="icon"><use href="#icon-lock"/></svg></span>'));
      if (!acik) {
        yeni.addEventListener('click', function () {
          if (window.showToast) showToast('Önce Ders ' + dersNo(n - 1) + '’i bitir.', 'warn');
        });
      }
      el.replaceWith(yeni);
    });
  }
  if (window.Store && Store.subscribe) {
    Store.subscribe(function (key) { if (String(key).indexOf('badge_lesson_') === 0) sekmeleriBoya(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sekmeleriBoya);
  else sekmeleriBoya();

  window.LessonPage = {
    sekmeleriBoya: sekmeleriBoya,
    setup: setup,
    stepReady: stepReady,
    step: step,
    syncUsbSahne: syncUsbSahne,
    updateReadyGlow: updateReadyGlow,
    usbDurumDegisti: usbDurumDegisti,
    paintStepDom: paintStepDom
  };
})();
