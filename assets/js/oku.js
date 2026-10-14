/* ============================================================
   SESLİ OKUMA — "Bana oku"
   ============================================================
   Neden var: bir tester "okumak ilgimi çekmiyor" dedi ve OKUMADIĞI İÇİN
   adımı adam akıllı yapamadı (Arda, 2026-09-22). Ders 1.1 ölçümü de aynı
   yere bakıyordu: 8 çocuktan 4'ü satır satır kod açıklamasına tek satır
   bile açmamıştı. Yani bu bir erişilebilirlik süsü değil, TAMAMLAMA sorunu.

   TASARIM KARARLARI (hepsi 5. sınıf davranışından türedi):

   - TEK düğme, adım başlığının yanında. Her metin bloğunun köşesine ayrı
     düğme konmadı: çocuk altı tane hoparlör ikonunu ya gürültü sayar ya
     oyuncak. Tek ve hep aynı yerde olan bir şey öğrenilir.
   - İkon değil YAZI: "Bana oku". Çocuk ikon okumaz, iki kelimeyi okur.
   - Okurken o kelime VURGULANIR. Asıl işi yapan parça bu: okumayan çocuğu
     "okumayan" değil "takip eden" hâline getiriyor. Salt seslendirme
     çocuğu ekrandan koparır.
   - KOD OKUNMAZ ("void setup açık parantez" diye bir şey seslendirilmez).
     Ama koddan BAHSEDEN açıklamalar okunur — Arda: "tabi kodları okumasın
     ama teknik bilgileri okuması gerek."
   - Basınca "Durdur" olur. Yoksa çocuk üst üste basar, sesler binişir.

   SES NEREDEN GELİYOR: çalışma anında üretilmiyor. `tools/ses-uret.py`
   önceden üretiyor, siteyle birlikte dağıtılıyor. Böylece anahtar yok,
   ağ yok, gecikme yok, `file://` altında da çalışıyor ve her öğrencide
   AYNI ses var (cihazda Türkçe ses kurulu olmasa bile).

   BAYAT SES: dosya adı metnin kendisinden türüyor (FNV-1a + uzunluk).
   Metin değişirse anahtar değişir, ses bulunamaz ve o parça sessizce
   ESKİ sesle okunmaz — atlanır. Sessiz yanlış, gürültülü eksikten kötüdür.
   ============================================================ */
(function (global) {
  'use strict';

  /* Toplayıcı (tools/ses-topla.mjs) ile AYNI seçiciler olmalı; biri
     değişip öbürü kalırsa ekranda okunacak metin üretilmemiş olur. */
  var SECICILER = [
    /* ders sayfalari */
    '.step-content h2', '.step-content > p', '.step-content .step-card-desc',
    /* portal: yalnizca tanitim metni. Ders KARTLARI okunmuyor - onlar
       gezinme ogesi, cocugun dinleyecegi icerik degil. */
    '.portal-hero-text h1', '.portal-hero-text p'
  ];

  /* Dugmenin tutunacagi yer sayfaya gore degisiyor: derste adim basligi,
     portalda tanitim basligi. Ilk bulunan kullanilir. */
  var CAPALAR = ['.step-content h2', '.portal-hero-text h1'];
  var SES_YOLU = 'assets/ses/';

  /* IKONLAR ICERIDE, sprite'a bagli DEGIL: sprite index.html ve
     portal.html'de var ama lesson-1-2.html'de YOK; <use href="#icon-..">
     orada hic cozulmezdi. Sayfadaki diger ikonlarla ayni dil:
     24x24 viewBox, currentColor, stroke 1.75. */
  var IKON_HOPARLOR =
    '<svg class="oku-ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>' +
    '<path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  var IKON_DUR =
    '<svg class="oku-ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="6" y="5" width="4" height="14" rx="1"/>' +
    '<rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var YAZI_OKU = 'Bana oku', YAZI_DUR = 'Durdur';

  function dugmeYuzu(oynuyor) {
    return (oynuyor ? IKON_DUR : IKON_HOPARLOR) +
           '<span class="oku-yazi">' + (oynuyor ? YAZI_DUR : YAZI_OKU) + '</span>';
  }

  var dugme = null, ses = null, calisiyor = false;
  var sira = [], sirada = 0, cerceve = null, geriAl = [];

  /* ses-uret.py'deki anahtar() ile BİREBİR aynı olmalı: FNV-1a 32 bit,
     UTF-8 baytları üzerinden, sonuna metnin uzunluğu. */
  function anahtar(metin) {
    var bayt = new TextEncoder().encode(metin);
    var h = 2166136261;
    for (var i = 0; i < bayt.length; i++) {
      h ^= bayt[i];
      /* Math.imul ŞART: h * 16777619 sonucu 2^56'ya çıkar ve JS'in güvenli
         tamsayı sınırını (2^53) aşar — çarpım sessizce hassasiyet kaybeder
         ve Python tarafıyla FARKLI anahtar üretir. imul 32 bitte çarpar. */
      h = Math.imul(h, 16777619) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8) + '-' + metin.length;
  }

  /* Metni okurken KENDİ düğmemizi sayma. Düğme başlığın İÇİNDE duruyor;
     katarsak başlığın metni "... 🔊 Bana oku" olur, anahtar tutmaz ve
     başlık hiç okunmaz. (2026-09-22'de tam olarak bu oldu.) */
  function duz(el) {
    var t = '';
    [].forEach.call(el.childNodes, function (n) {
      if (n.nodeType === 1 && n.classList && n.classList.contains('oku-dugme')) return;
      t += n.textContent || '';
    });
    return t.replace(/\s+/g, ' ').trim();
  }

  /* Hangi adımdayız? Motor varsa ondan; yoksa başlığın kendi yazısından
     (düğmenin yazısı hariç — düğme başlığın içinde duruyor). */
  function capa() {
    for (var i = 0; i < CAPALAR.length; i++) {
      var e = document.querySelector(CAPALAR[i]);
      if (e) return e;
    }
    return null;
  }

  function adimNo() {
    if (global.LessonEngine && typeof LessonEngine.step === 'number') return LessonEngine.step;
    var h = capa();
    if (!h) return -1;
    var t = '';
    [].forEach.call(h.childNodes, function (n) {
      if (n.nodeType === 3) t += n.nodeValue;
    });
    return t.replace(/\s+/g, ' ').trim();
  }

  function gorunur(el) {
    if (!el.getClientRects().length) return false;
    var s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none';
  }

  /* Ekranda O AN görünen, okunacak metinleri okuma sırasıyla toplar. */
  function parcalar() {
    var hepsi = [];
    SECICILER.forEach(function (sec) {
      [].forEach.call(document.querySelectorAll(sec), function (el) {
        if (el.closest('pre, code, .code, [class*="editor"]')) return;
        if (el.tagName === 'BUTTON') return;
        /* İçinde düğme olan blok okunmaz (rozet, "İleri" vb.) — ama bizim
           kendi düğmemiz bu kuralın dışında, yoksa başlığı elerdik. */
        if (el.querySelector('button:not(.oku-dugme)')) return;
        if (!gorunur(el)) return;
        var t = duz(el);
        if (t.length < 10) return;
        hepsi.push({ el: el, metin: t, anahtar: anahtar(t) });
      });
    });
    /* Belge sırasına diz: çocuk yukarıdan aşağı okur, ses de öyle gitsin. */
    hepsi.sort(function (a, b) {
      var k = a.el.compareDocumentPosition(b.el);
      return (k & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
    });
    return hepsi.filter(function (p) {
      return global.SES_ZAMAN && global.SES_ZAMAN[p.anahtar];
    });
  }

  /* Kelimeleri span'a sarar. İçinde başka etiket varsa DOKUNMAZ — sarmak
     o etiketleri (inline <code>, <b>) yok ederdi; o durumda bloğun
     tamamı vurgulanır. */
  function sar(el) {
    /* Kendi düğmemiz sarmayı engellemez: başlığın içinde duruyor ve
       "çocuk elemanı var" diye bakarsak BAŞLIK hiç kelime vurgusu almaz.
       Düğme olduğu yerde bırakılıp yalnızca metin düğümleri sarılıyor. */
    var yabanci = [].filter.call(el.children, function (c) {
      return !c.classList.contains('oku-dugme');
    });
    if (yabanci.length) { el.classList.add('oku-blok'); return null; }

    var dugumler = [].slice.call(el.childNodes);
    var spanlar = [];
    dugumler.forEach(function (d) {
      if (d.nodeType !== 3) return;                       // düğme vb. dokunulmaz
      var parca = document.createDocumentFragment();
      (d.nodeValue || '').split(/(\s+)/).forEach(function (k) {
        if (!k) return;
        if (/^\s+$/.test(k)) { parca.appendChild(document.createTextNode(k)); return; }
        var sp = document.createElement('span');
        sp.className = 'oku-kelime';
        sp.textContent = k;
        parca.appendChild(sp);
        spanlar.push(sp);
      });
      el.replaceChild(parca, d);
    });
    /* Geri alma innerHTML ile YAPILMAZ: innerHTML yazmak başlığın içindeki
       düğmeyi yok edip kopyasını koyar, olay dinleyicisi gider ve düğme
       ölür. Onun yerine yalnızca eklediğimiz span'ları metne çeviriyoruz —
       düğmeye hiç dokunulmuyor. */
    if (spanlar.length) geriAl.push({ el: el, spanlar: spanlar });
    return spanlar.length ? spanlar : null;
  }

  /* Biten parçayı hemen sarmalından çöz: yoksa bir sonrakine geçildiğinde
     önceki parçanın sarı kelimesi ekranda ASILI kalıyor ve çocuk sesin
     nerede olduğunu iki ayrı yerde görüyor (2026-09-22'de ölçüldü). */
  function coz(el) {
    geriAl = geriAl.filter(function (g) {
      if (g.el !== el) return true;
      g.spanlar.forEach(function (sp) {
        if (sp.parentNode) sp.parentNode.replaceChild(document.createTextNode(sp.textContent), sp);
      });
      if (el.normalize) el.normalize();
      return false;
    });
    el.classList.remove('oku-blok');
    el.classList.remove('oku-okunuyor');
  }

  function temizle() {
    geriAl.forEach(function (g) {
      g.spanlar.forEach(function (sp) {
        if (sp.parentNode) sp.parentNode.replaceChild(document.createTextNode(sp.textContent), sp);
      });
      if (g.el.normalize) g.el.normalize();   // bölünmüş metin düğümlerini birleştir
    });
    geriAl = [];
    /* .oku-okunuyor da burada kalkmali: eskiden yalnizca ses BITINCE
       kaldiriliyordu, cocuk ortasinda durdurunca blok isaretli kaliyordu. */
    [].forEach.call(document.querySelectorAll('.oku-blok, .oku-okunuyor'), function (e) {
      e.classList.remove('oku-blok');
      e.classList.remove('oku-okunuyor');
    });
  }

  function dur() {
    calisiyor = false;
    if (cerceve) { cancelAnimationFrame(cerceve); cerceve = null; }
    if (ses) { ses.pause(); ses.removeAttribute('src'); }
    temizle();
    if (dugme) { dugme.innerHTML = dugmeYuzu(false); dugme.classList.remove('oku-calisiyor'); }
  }

  /* Noktalama at, karsilastirilabilir hale getir. */
  function sade(t) {
    return (t || '').toLowerCase().replace(/[^0-9a-zçğıiöşü]/g, '');
  }

  /* Zamanlama listesi ile ekrandaki span'lar BIREBIR ayni degil: motor
     "&" gibi isaretleri kelime saymiyor ve "1:" yerine "1" bildiriyor.
     Indeksle eslersek vurgu kayiyor ve son kelimeye hic gecmiyor
     (2026-09-22'de olculdu: 6 span / 5 zamanlama). Bu yuzden metinden
     esliyoruz: her zamanlama kelimesi icin siradaki uygun span aranir. */
  function esle(zaman, spanlar) {
    var harita = [], si = 0;
    for (var i = 0; i < zaman.length; i++) {
      var hedef = sade(zaman[i][1]);
      var bulundu = -1;
      for (var j = si; j < spanlar.length; j++) {
        var sp = sade(spanlar[j].textContent);
        if (sp && hedef && (sp.indexOf(hedef) === 0 || hedef.indexOf(sp) === 0)) { bulundu = j; break; }
      }
      if (bulundu >= 0) { harita[i] = bulundu; si = bulundu + 1; }
      else { harita[i] = (i ? harita[i - 1] : 0); }
    }
    return harita;
  }

  function parcaCal(p, bitince) {
    var zaman = global.SES_ZAMAN[p.anahtar] || [];
    var spanlar = sar(p.el);
    var harita = spanlar ? esle(zaman, spanlar) : null;
    p.el.classList.add('oku-okunuyor');
    ses.src = SES_YOLU + p.anahtar + '.mp3';

    function boya() {
      if (!calisiyor) return;
      var ms = ses.currentTime * 1000;
      if (spanlar) {
        var k = -1;
        for (var i = 0; i < zaman.length; i++) {
          if (zaman[i][0] <= ms) k = harita[i]; else break;
        }
        for (var j = 0; j < spanlar.length; j++) {
          spanlar[j].classList.toggle('oku-aktif', j === k);
        }
      }
      cerceve = requestAnimationFrame(boya);
    }

    ses.onended = function () { coz(p.el); bitince(); };
    ses.onerror = function () {
      /* Ses dosyası yok/bozuk: sessizce yanlış sesi çalmaktansa atla. */
      coz(p.el);
      bitince();
    };
    ses.play().then(function () { boya(); }).catch(function () { bitince(); });
  }

  function basla() {
    sira = parcalar();
    if (!sira.length) return;
    calisiyor = true;
    sirada = 0;
    dugme.innerHTML = dugmeYuzu(true);
    dugme.classList.add('oku-calisiyor');
    (function sonraki() {
      if (!calisiyor || sirada >= sira.length) { dur(); return; }
      var p = sira[sirada++];
      parcaCal(p, sonraki);
    })();
  }

  function dugmeKur() {
    var baslik = capa();
    if (!baslik) return;
    if (dugme && dugme.parentNode === baslik) return;   // zaten yerinde
    if (dugme && dugme.parentNode) dugme.parentNode.removeChild(dugme);
    dugme = document.createElement('button');
    dugme.type = 'button';
    dugme.className = 'oku-dugme';
    dugme.innerHTML = dugmeYuzu(false);
    dugme.addEventListener('click', function () { calisiyor ? dur() : basla(); });
    baslik.appendChild(dugme);
    /* Dugme basligi birkac piksel yukseltiyor ve Ders 1.2'de devre sahnesi
       yuksekligini GORUNUMDEN turetiyor (heroYuksekligiAyarla, 'resize'e
       bagli). Dugme eklendikten sonra yeniden olculmezse sahnenin alti
       gezinme cubugunun altina kayiyor (olculdu 2026-09-22: 4px tasma,
       test-wiring "Sahnenin ALTI ... ustunde" kirmizi verdi).
       Kendi yerlestirdigimiz seyin sonucunu kendimiz duyuruyoruz. */
    try { global.dispatchEvent(new Event('resize')); } catch (e) {}
    /* Bu adımda okunacak bir şey yoksa düğmeyi hiç gösterme: çalışmayan
       bir düğme çocuğun güvenini bir kez kırar, bir daha basmaz. */
    dugme.hidden = !parcalar().length;
  }

  function kur() {
    if (!global.SES_ZAMAN) return;        // ses paketi yüklenmemiş
    ses = new Audio();
    ses.preload = 'auto';
    dugmeKur();

    /* Adım değişince düğme yeni başlığa taşınır ve okuma durur.
       DİKKAT — SONSUZ DÖNGÜ TUZAĞI (2026-09-22'de tam olarak oldu):
       gözlemci .step-content alt ağacını izliyor, düğme de O AĞACIN
       İÇİNDE. dur() düğmenin yazısını değiştirince gözlemci yeniden
       tetikleniyor, o da dur() çağırıyor... sayfa kilitleniyor.
       Çözüm: ADIM gerçekten değişti mi diye bak. Kendi yaptığımız
       değişiklikler adım numarasını değiştirmediği için döngü kırılıyor. */
    var sonAdim = adimNo();
    new MutationObserver(function () {
      var a = adimNo();
      if (a === sonAdim) return;
      sonAdim = a;
      dur();
      dugmeKur();
    }).observe(document.querySelector('.step-content') || document.body,
               { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kur);
  } else { kur(); }

  global.Oku = { basla: basla, dur: dur, parcalar: parcalar, anahtar: anahtar };
})(window);
