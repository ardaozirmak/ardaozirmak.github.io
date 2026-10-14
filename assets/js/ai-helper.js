/* ai-helper.js — köşedeki AI yardımcısı (portal + iki ders ortak)
   ==================================================================
   NEDEN VAR: tester'ın isteği — "her sayfada köşede duran yuvarlak bir AI
   yardımcısı olsun, uzun süre bir şey yapmazsam 'yardım lazım mı?' desin,
   dersin başında da kendini tanıtsın."
   Tasarım kararları: docs/superpowers/specs/2026-09-21-ai-yardimci-design.md

   SINIRLAR (kasıtlı):
   - Sayfa içi gerçek sohbet YOK. Sunucu + API anahtarı + her mesajın parası
     demek; o kova ticaret kovası. Mekanizma bugünkü yol: prompt üretilir,
     panoya yazılır, çocuğun seçtiği araç yeni sekmede açılır
     (LessonEngine.openAiTool + copyPromptText — ikisi de zaten var).
   - Ses YOK (Kurallar.md: ses ödül anına saklanır).
   - Kendiliğinden konuşma yalnızca ADIMIN ŞARTI SAĞLANMAMIŞKEN. Tezgahta
     çalışan, şartı geçmiş çocuk dürtülmez. 2026-09-07'de geri alınan "AI
     her adımda görünsün" denemesinin tekrarı değil: orada bağlamsız kartlar
     her adıma basılıyordu, burada tek düğme var ve adımın bağlamıyla konuşuyor.
   ================================================================== */

(function () {
  'use strict';

  var INTRO_KEY = 'ai_helper_intro_v1';
  /* 3 dakika: tester'ın "uzun süre" dediği süre. Ders adımlarının çoğu
     tezgahta yapılıyor (kablo takma, IDE kurma) — daha kısa bir sayaç
     çalışan çocuğu dürtükler. */
  var BOSTA_MS = 3 * 60 * 1000;
  /* Cevaplanmayan balonun kendi kendine kapanma süresi. 25 sn: bir
     cümleyi okuyup karar vermeye yeter, köşeyi uzun süre kapatmaz. */
  var KAPANMA_MS = 25000;

  /* storage.js üç sayfada da yüklü; yine de yokluğunda modül sessizce
     çalışsın (tanıtım bayrağı tutulamaz, gerisi aynı). */
  function bayrakOku(k) { return window.Store ? Store.get(k) : null; }
  function bayrakYaz(k, v) { if (window.Store) Store.set(k, v); }

  /* TANITIM CİHAZA DEĞİL HESABA BAĞLI — Arda, 2026-09-21: "sağdaki mavi
     AI yoldaşı da her yeni hesapta ne olduğunu söylesin."
     Bayrağın değeri '1' değil, tanıtımı GÖREN hesabın kimliği. Aynı
     cihazda başka bir çocuk giriş yapınca kimlik değişiyor ve tanıtım
     bir kez daha çıkıyor; aynı çocuk tekrar girerse çıkmıyor.
     Hesapsız kullanım 'anon' sayılıyor, o da bir kez görüyor. */
  function sahip() {
    var l = (window.Learner && Learner.isActive && Learner.isActive())
      ? Learner.current() : null;
    var kimlik = l && (l.id || l.username);
    return kimlik ? String(kimlik) : 'anon';
  }
  function tanitimYapildiMi() { return bayrakOku(INTRO_KEY) === sahip(); }

  /* Bayrak artik "cizdik" degil "COCUK GORDU VE KAPATTI" demek.
     Eskiden balonu acar acmaz yaziliyordu; balon profil penceresinin
     karartmasi altinda kaldigi icin cocuk hic gormeden "gosterildi"
     sayiliyor ve bir daha hic cikmiyordu (Arda, 2026-09-22). */
  function tanitimOnayla() {
    if (!tanitimAcik) return false;
    tanitimAcik = false;
    bayrakYaz(INTRO_KEY, sahip());
    return true;
  }

  /* Tanitim, ekranda engelleyici bir pencere varken acilmamali. Profil
     ("Seni Taniyalim!") penceresi ve giris ekrani karartma katmaniyla
     geliyor; balon o katmanin ALTINDA kaliyor — cizilmis ama soluk ve
     dugmelerine BASILAMAZ halde. Olculdu 2026-09-22: balonun uzerinde
     elementFromPoint 'profile-modal-overlay' donduruyordu.
     Sinif adi yazmiyoruz, dogrudan sunu soruyoruz: dugmeye basilabiliyor
     mu? Boylece yeni bir pencere eklendiginde de kendiliginden calisir. */
  function engelVar() {
    if (!dugme) return true;
    var r = dugme.getBoundingClientRect();
    if (!r.width || !r.height) return true;
    var ust = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !(ust && kok && kok.contains(ust));
  }

  /* `?ai=off`: yardımcı hiç kurulmaz. `?cloud=off` deseninin aynısı —
     köşedeki balon açıkken altındaki düğmeleri kapatıyor (bir açılır
     pencerenin doğası), o yüzden yardımcıyla ilgisi olmayan ölçümler
     (ör. Adım 4 video çubuğu geometrisi) onu kapatabilsin. */
  function kapaliMi() {
    try { return new URLSearchParams(location.search).get('ai') === 'off'; }
    catch (e) { return false; }
  }

  var kok = null, balon = null, dugme = null;
  var tanitimAcik = false;
  var sayac = null;
  var kapanmaSayaci = null;
  var susanAdim = null;  // "İyiyim" denen adım — orada bir daha açılmaz

  function dersMi() {
    return !!document.getElementById('stepTitle') && !!window.LessonEngine;
  }

  function adim() {
    return (window.LessonEngine && LessonEngine.step) || 0;
  }

  /* Kapı/modal açıkken gizlenir: çocuğa iki ayrı kapı varmış gibi
     görünmesin (aynı gerekçeyle köşedeki giriş rozeti de gizleniyor,
     bkz. learner-ui.js setScreen). */
  function gizliMi() {
    if (document.querySelector('.learner-gate')) return true;
    var m = document.querySelector('.modal-backdrop');
    if (m && m.classList.contains('show')) return true;
    return false;
  }

  /* ---------- PROMPT: hibrit bağlam ----------
     Sıra: ders helpPrompt'u → nerede olduğu → adıma özel not → sabit kuyruk.
     Ders yoksa (portal) ilk ve üçüncü parça düşer, kalan metin yine çalışır.
     Ders 1.3 yazılırken `aiHelp` yazmayı unutsa bile yardımcı çalışsın diye
     hiçbir parça zorunlu değil. */
  function promptUret() {
    var parca = [];

    var ders = window.LessonEngine && LessonEngine.helpPrompt;
    if (ders) parca.push(ders);

    var dersAdi = document.querySelector('.header-lesson-title');
    var adimBasligi = document.getElementById('stepTitle');
    if (dersAdi && adimBasligi) {
      parca.push('Şu an buradayım: ' + dersAdi.innerText.trim() +
                 ' — ' + adimBasligi.innerText.trim() + '.');
    } else {
      parca.push('Deneyap Mini v2 kartıyla ders yapan bir öğrenciyim ve ' +
                 'derslerin listelendiği sayfadayım.');
    }

    var ek = window.LessonEngine && LessonEngine.stepHelp;
    if (ek) parca.push(ek);

    parca.push('Bu adımda takıldım. Bana yardım et ama hepsini birden ' +
               'anlatma: her seferinde TEK bir soru sor, cevabımı bekle, ' +
               'sonra bir sonraki adıma geç. Kısa cümlelerle, yaşıma uygun ' +
               've sabırlı bir dille anlat.');

    var metin = parca.join('\n\n');
    return window.Profile ? Profile.personalize(metin) : metin;
  }

  function sor() {
    var metin = promptUret();
    /* window.open TIKLAMANIN kendi tick'inde çağrılmalı (bkz. lesson-engine
       openAiTool notu) — pano yazmasını beklersek tarayıcı sekmeyi engelliyor. */
    if (window.LessonEngine && LessonEngine.openAiTool) {
      var gitti = LessonEngine.openAiTool(metin);
      LessonEngine.copyPromptText(metin, LessonEngine.aiSentMessage(gitti));
    }
    balonKapat();
  }

  /* ---------- DOM ---------- */
  function kur() {
    if (kok) return;
    kok = document.createElement('div');
    kok.className = 'ai-helper';
    kok.innerHTML =
      '<div class="ai-helper-balon" hidden>' +
        '<p class="ai-helper-soz"></p>' +
        '<div class="ai-helper-btns">' +
          '<button type="button" class="ai-helper-evet"></button>' +
          '<button type="button" class="ai-helper-hayir"></button>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="ai-helper-dugme" aria-label="AI yardımcısı" ' +
        'aria-expanded="false">' +
        /* Simge <use href="#icon-robot"> ile DEĞİL, gömülü: portal.html'de
           o sprite yok (yalnızca ders sayfalarında tanımlı) ve modül üç
           sayfada da aynı çalışmalı. */
        /* 2026-09-30: Blender render'ı (blender/esyalar2.py → ai-kure.webp):
           parlak mavi küre, gözleri ışıyan yüz ekranı, sarı anten. */
        '<img class="ai-kure" src="assets/img/esya/ai-kure.webp" width="56" height="56" alt="" draggable="false">' +
      '</button>';
    document.body.appendChild(kok);

    balon = kok.querySelector('.ai-helper-balon');
    dugme = kok.querySelector('.ai-helper-dugme');

    dugme.addEventListener('click', function () {
      if (balon.hidden) balonAc(false); else balonKapat();
    });
    kok.querySelector('.ai-helper-evet').addEventListener('click', function () {
      tanitimOnayla();
      sor();
    });
    kok.querySelector('.ai-helper-hayir').addEventListener('click', function () {
      // Tanitimi kapatmak o adimi SUSTURMAZ: "anladim" demek "takilmadim" demek degil.
      if (!tanitimOnayla()) {
        // "İyiyim" o ADIM için susturur; düğme yerinde kalır, çocuk isterse basar.
        susanAdim = adim();
      }
      balonKapat();
    });
  }

  function balonAc(kendiliginden) {
    if (!kok || gizliMi()) return;   // ?ai=off ile hiç kurulmamış olabilir
    var tanitim = kendiliginden && !tanitimYapildiMi();
    // Engel varken tanitimi HARCAMA: ortalik temizlenince tekrar denenir.
    if (tanitim && engelVar()) return;
    var soz = kok.querySelector('.ai-helper-soz');
    if (tanitim) {
      soz.textContent = 'Ben senin AI yardımcınım. Bir yerde takılırsan bu ' +
        'düğmeye bas — takıldığın adımı anlatan bir soruyu senin için hazırlarım.';
      kok.querySelector('.ai-helper-evet').textContent = 'Nasıl çalıştığını gör';
      kok.querySelector('.ai-helper-hayir').textContent = 'Tamam, anladım';
      tanitimAcik = true;
    } else {
      soz.textContent = 'Takıldın mı? İstersen bu adımı anlatan bir soruyu ' +
        'senin için hazırlayayım.';
      kok.querySelector('.ai-helper-evet').textContent = 'Evet, takıldım';
      kok.querySelector('.ai-helper-hayir').textContent = 'İyiyim';
    }
    balon.hidden = false;
    dugme.setAttribute('aria-expanded', 'true');
    /* Cevaplanmayan balon köşede SONSUZA KADAR durmaz: açıkken altındaki
       düğmeleri kapatıyor (Adım 4'te video araç çubuğunun sağ ucu).
       Çocuk balonu görmezden geldiyse 25 saniye sonra kendi kapanır,
       düğme yerinde kalır. */
    if (kapanmaSayaci) clearTimeout(kapanmaSayaci);
    /* TANITIM DA kendi kendine kapanir. Once "kapanmasin" yapmistim ve
       Ders 1.2'de devre rehberinin dugmelerini kapatti (test-wiring
       tikandi, 2026-09-22). O 25 saniyelik kapanma tam bunun icin var.
       "Kesinlikle gorsun" sarti kapanmayla DEGIL, bayrakla saglaniyor:
       bayrak yalnizca cocuk kapatinca yaziliyor, yani gorulmeden kapanan
       tanitim bir sonraki acilista TEKRAR cikiyor. */
    kapanmaSayaci = setTimeout(balonKapat, AiHelper.kapanmaMs);
  }

  function balonKapat() {
    if (!balon) return;
    balon.hidden = true;
    dugme.setAttribute('aria-expanded', 'false');
    if (kapanmaSayaci) { clearTimeout(kapanmaSayaci); kapanmaSayaci = null; }
    sayacKur();
  }

  /* ---------- boşta kalma ---------- */
  function sayacKur() {
    if (sayac) clearTimeout(sayac);
    sayac = setTimeout(bostaDoldu, AiHelper.bostaMs);
  }

  function bostaDoldu() {
    if (!balon || !balon.hidden) return;
    if (gizliMi()) { sayacKur(); return; }
    if (!dersMi()) return;                  // portalda adım/şart yok, dürtme yok
    if (susanAdim === adim()) return;       // "İyiyim" denmişti
    if (stepHazirMi()) { sayacKur(); return; } // çocuk şartı geçmiş, çalışıyor
    balonAc(true);
  }

  /* Adımın şartı sağlandı mı — sözleşme lesson-page.js'te (readyWhen).
     Şart yoksa (kapısız adım) "hazır" sayılır: kapısız adımda takılma
     ölçülemez, dürtmek de rastgele olur. */
  function stepHazirMi() {
    if (window.LessonPage && LessonPage.stepReady) {
      var r = LessonPage.stepReady();
      return r === null ? true : !!r;
    }
    return true;
  }

  /* Herhangi bir hareket sayacı sıfırlar. Balon AÇIKKEN ve tıklama
     yardımcının DIŞINDAYSA balon kapanır: açılır pencere davranışının
     kendisi ve altındaki düğmeyi bloke etmemenin tek doğru yolu —
     çocuk "Sonraki"ye basmak istediğinde balon çekilir. */
  function hareket(e) {
    if (!balon) return;
    if (!balon.hidden) {
      if (e && e.type === 'pointerdown' && kok && !kok.contains(e.target)) balonKapat();
      return;
    }
    sayacKur();
  }

  function baslat() {
    if (kapaliMi()) return;
    kur();
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (e) {
      document.addEventListener(e, hareket, { passive: true });
    });
    sayacKur();

    /* Tanıtım: her HESAP için bir kez, yardımcının göründüğü İLK sayfada
       (portal ya da ders, hangi adım olursa olsun). Eskiden yalnızca
       Ders 1.1 Adım 1'de çıkıyordu; giriş yaptıktan sonra sayfa
       yenilendiği için (learner-ui) yeni hesap kendini dersin ortasında
       bulabiliyor ve tanıtımı hiç görmüyordu.
       Gecikme, açılıştaki diğer hareketin (giriş rozeti, adım animasyonu)
       üstüne binmesin diye. */
    /* Tek seferlik 1.5 sn yerine: ortalik temizlenene kadar bekle.
       Yeni hesap once profil penceresini kapatir, tanitim ondan SONRA cikar. */
    if (!tanitimYapildiMi()) {
      var deneme = 0;
      /* Ilk deneme 1.5 sn sonra: acilistaki diger hareket (giris rozeti,
         adim animasyonu) yerine otursun VE profil penceresi cizilmis olsun.
         Hemen denersek pencere henuz yokken engel gorunmez, balon acilir,
         pencere ustune biner — duzeltmeye calistigimiz durumun ta kendisi. */
      setTimeout(function tanitimDene() {
        if (tanitimYapildiMi() || !balon || !balon.hidden) return;
        if (!engelVar()) { balonAc(true); return; }
        if (++deneme > 120) return;   // ~2 dk sonra birak; sonraki acilista yine denenir
        setTimeout(tanitimDene, 1000);
      }, 1500);
    }
  }

  var AiHelper = {
    bostaMs: BOSTA_MS,
    kapanmaMs: KAPANMA_MS,
    // Testler sayacı kısaltıp gerçek yolu ölçebilsin diye.
    setBostaMs: function (ms) { AiHelper.bostaMs = ms; sayacKur(); },
    ac: function () { balonAc(false); },
    /* "Sağdaki mavi düğmeye bas" denince düğme birkaç kez nabız gibi parlar:
       çocuk hangi düğme olduğunu bulsun. */
    vurgula: function () {
      if (!dugme) return;
      dugme.classList.remove('ai-vurgu'); void dugme.offsetWidth; dugme.classList.add('ai-vurgu');
      setTimeout(function () { dugme.classList.remove('ai-vurgu'); }, 3200);
    },
    kapat: balonKapat,
    sor: sor,
    promptUret: promptUret,
    gizliMi: gizliMi,
    get acik() { return !!balon && !balon.hidden; }
  };
  window.AiHelper = AiHelper;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
