/* usb-link.js — "kabloyu gerçekten tak" katmanı (Ders 1.1 ve 1.2 ortak)
   ==================================================================
   NEDEN VAR: Arda'nın isteği. "3. adımda kablo takılı halde olmasın,
   PC'ye takılı ama Type-C kısmı biraz yukarıda ve güç gelmemiş halde
   olacak" + "3. adımdan itibaren port takılı değilse diğer adıma
   geçemesin, illa takması gerek" + "portu çıkarınca dahili LED'in
   yanmaması gerek" + "aynı sistem 1.2'de de olsun".

   İKİ PORT: kablonun iki ucu ayrı ayrı işaretleniyor (yassı uç →
   bilgisayar, küçük uç → kart). Tek uç yetmez; gerçekte de yetmiyor.

   GERÇEK ALGILAMA (WebSerial): tarayıcı fişi kendiliğinden göremez ama
   SORABİLİR. Çocuk bir kez "kartımı bul" deyip listeden seçince tarayıcı
   o porta izin verir; ondan sonra takma/çıkarma olayları CANLI gelir.
   Bu bir YARDIMCI, kapı değil: port ancak USB-seri sürücüsü kuruluysa
   görünüyor, o sürücü de Ders 1.1'in Adım 4'ünde kuruluyor. Kapıyı buna
   bağlarsak çocuk Adım 3'te kilitlenir ve sürücüyü kuracağı adıma hiç
   ulaşamaz. Elle işaretleme bu yüzden her zaman açık.

   ÇOCUĞUN SÖZÜ ÜSTÜN: kutuları kendi işaretlediyse, sonradan gelen bir
   "disconnect" onun işaretini bozmaz — site kablonun gerçek hâlini
   bilmiyor, tek kaynak çocuk (aynı desen "LED yandı mı?" sorusunda da
   kullanılıyor).

   Kullanım:
     UsbLink.init({ onChange: function (bagli) { ... } });
     interactiveArea.innerHTML += UsbLink.html();   // Adım 3
     UsbLink.paint();                               // DOM'a girdikten sonra
     gates: { 3: () => UsbLink.connected() || UsbLink.gateMessage(), ... }
   ================================================================== */
(function (global) {
  'use strict';

  /* Seçicide yalnızca kart olabilecek cihazlar görünsün: 0x10C4 Silicon
     Labs (CP210x — Deneyap kartlarındaki köprü), 0x303A Espressif
     (ESP32-S2'nin yerleşik USB'si), 0x1A86 WCH (CH340). Çocuğa onlarca
     COM portu listelemenin anlamı yok. */
  var SATICILAR = [
    { usbVendorId: 0x10C4 },
    { usbVendorId: 0x303A },
    { usbVendorId: 0x1A86 }
  ];

  var usbUcu = false;      // yassı uç bilgisayarda
  var typecUcu = false;    // küçük uç kartta
  var algiylaBagli = false;
  var cagriliyor = false;   // "kartı bul" düğmesi dikkat çekiyor mu
  var onChange = null;
  var kuruldu = false;

  function serialVarMi() {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  function connected() { return usbUcu && typecUcu; }

  /* Kurulum tamamken LED yanmıyorsa sebebi tektir: karta güç gitmiyor.
     Arda: "port takılı değilken kurulum izlenirse LED yanmadı çünkü
     Deneyap kart porta takılı değil gibisinden uyarı verecek."
     Metin tek yerde: iki ders de buradan okuyor. */
  function noPowerMessage() {
    return 'LED yanmadı çünkü <strong>Deneyap kart porta takılı değil</strong>. Kablonun iki ucunu da tak, sonra tekrar bak.';
  }

  function gateMessage() {
    return 'Önce kabloyu tak: yassı ucu bilgisayara, küçük (Type-C) ucu karta. ' +
      'Kart bağlı değilken bu dersin geri kalanı çalışmaz.';
  }

  function duyur() {
    if (onChange) onChange(connected());
  }

  /* Kapı kapandığında çocuğu YAPACAĞI ŞEYİN YANINA götür.
     Arda: "3. adımda usb takmadan geçmeye çalışınca oto scroll kabloyu
     tak kısmına gitsin." Kutu yalnızca Adım 3'te DOM'da; daha ileri bir
     adımda kablo çıkarsa götürülecek bir yer yok, o zaman false dönüyor
     ve geriye yalnızca toast kalıyor. */
  function focusGate() {
    var kutu = document.querySelector('.usb-link');
    cagriliyor = true;
    paint();
    if (!kutu) return false;
    try { kutu.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    catch (e) { kutu.scrollIntoView(); }
    /* Sınıfı önce söküp yeniden takmak animasyonu baştan başlatıyor —
       üst üste iki denemede ikincisi sessiz kalmasın. */
    kutu.classList.remove('is-calling');
    void kutu.offsetWidth;
    kutu.classList.add('is-calling');
    clearTimeout(kutu._usbVurguZaman);
    kutu._usbVurguZaman = setTimeout(function () {
      kutu.classList.remove('is-calling');
    }, 1800);
    return true;
  }

  function html() {
    return '' +
      '<div class="quiz-box usb-link" style="margin-top:14px;">' +
      '  <strong style="display:flex; align-items:center; gap:8px;">' +
      '    <svg class="icon"><use href="#icon-plug"/></svg>Kabloyu tak</strong>' +
      '  <p class="step-card-desc" style="margin-top:6px;"><strong>Yassı ucu</strong> bilgisayara, ' +
      '<strong>küçük ucu</strong> karta tak. Sonra aşağıdaki düğmeye bas.</p>' +
      /* TEK DÜĞME (Arda, 2026-09-28): "kabloyu tak kısmında sadece tek
         buton, iki kabloyu da taktım butonu olsun, kafa karıştırmamak
         adına." Eskiden iki uç ayrı ayrı işaretleniyordu (1 ve 2). İçeride
         iki uç hâlâ ayrı tutuluyor (WebSerial algılaması ve testler için),
         ama çocuk tek şey söylüyor: ikisini de taktım. */
      '  <div class="usb-ports">' +
      '    <button type="button" class="usb-port" id="usbTak" aria-pressed="false" onclick="UsbLink.toggle(\'ikisi\')">' +
      '      <span class="usb-port-txt">Kablonun <b>iki ucunu da</b> taktım</span>' +
      '      <span class="usb-port-tick">✓</span></button>' +
      '  </div>' +
      '  <button type="button" class="usb-detect" id="usbDetect" onclick="UsbLink.detect()" hidden>' +
      '    <svg class="icon"><use href="#icon-search"/></svg>Bilgisayarım kartı görüyor mu?</button>' +
      '  <div class="callout" id="usbDurum"><svg class="icon callout-icon"><use href="#icon-alert"/></svg>' +
      '    <span id="usbDurumText"></span></div>' +
      '</div>';
  }

  function paint() {
    var tak = document.getElementById('usbTak');
    if (tak) { tak.classList.toggle('is-on', connected()); tak.setAttribute('aria-pressed', String(connected())); }

    var bul = document.getElementById('usbDetect');
    if (bul) {
      bul.hidden = !serialVarMi() || connected();
      /* Düğme ortada duruyor ama çocuk onun basılacak bir şey olduğunu
         anlamıyordu (Arda: "efektli bir şekilde parlasın, ona basacağını
         bilsin"). Kapıya bir kez takıldıysa düğme nabız gibi atıyor;
         kabloyu takınca ya da düğmeye basınca susuyor. */
      bul.classList.toggle('is-calling', cagriliyor && !bul.hidden);
    }

    var kutu = document.getElementById('usbDurum');
    var yazi = document.getElementById('usbDurumText');
    if (!kutu || !yazi) return;
    if (connected()) {
      kutu.className = 'callout green';
      yazi.innerHTML = algiylaBagli
        ? '<strong>Kartını buldum!</strong> Bilgisayarın kartı görüyor, güç geldi. Şimdi İleri’ye basabilirsin.'
        : '<strong>Güç geldi!</strong> Kartın üzerindeki kırmızı ışık yandı. Şimdi İleri’ye basabilirsin.';
    } else if (usbUcu || typecUcu) {
      kutu.className = 'callout yellow';
      yazi.innerHTML = 'Bir uç daha var. İki ucu da takmadan kart çalışmaz.';
    } else {
      kutu.className = 'callout';
      yazi.innerHTML = 'Kabloyu gerçekten tak, sonra düğmeye bas.';
    }
  }

  function toggle(hangi) {
    var onceki = connected();
    if (hangi === 'ikisi') {
      // Tek düğme: ikisi takılıysa ikisini de çıkar, değilse ikisini de tak.
      var tak = !onceki;
      usbUcu = tak; typecUcu = tak;
    } else if (hangi === 'usb') usbUcu = !usbUcu; else typecUcu = !typecUcu;
    if (!connected()) algiylaBagli = false;
    if (connected()) cagriliyor = false;
    /* Ödül anı: kart İLK kez güç aldığında. Tek tek kutular sessiz —
       gezinme ses çıkarmaz (bkz. Kurallar.md). */
    if (connected() && !onceki && global.FX) {
      try { FX.sound('unlock'); } catch (e) {}
    }
    paint();
    duyur();
  }

  function kartTakildi() {
    cagriliyor = false;
    if (connected()) { algiylaBagli = true; paint(); return; }
    usbUcu = true;
    typecUcu = true;
    algiylaBagli = true;
    if (global.FX) { try { FX.sound('unlock'); } catch (e) {} }
    paint();
    duyur();
  }

  /* Kart çıkarıldı: yalnızca bağlantı ALGIYLA kurulduysa geri al. */
  function kartCikarildi() {
    if (!algiylaBagli) return;
    usbUcu = false;
    typecUcu = false;
    algiylaBagli = false;
    paint();
    duyur();
  }

  function detect() {
    if (!serialVarMi()) return;
    /* Çocuk düğmeyi gördü ve bastı — çağrının işi bitti. */
    cagriliyor = false;
    paint();
    navigator.serial.requestPort({ filters: SATICILAR })
      .then(function () { kartTakildi(); })
      .catch(function () {
        /* Seçici boş geldi ya da çocuk vazgeçti. Kilitleme — elle
           işaretleme yolu zaten açık; neden bulunamadığını da söyle. */
        var kutu = document.getElementById('usbDurum');
        var yazi = document.getElementById('usbDurumText');
        if (kutu) kutu.className = 'callout yellow';
        if (yazi) {
          yazi.innerHTML = 'Kartını bulamadım. Kablo takılıysa sorun sürücüde olabilir — ' +
            'o da <strong>Ders 1.1, Adım 4</strong>’te kuruluyor. Şimdilik düğmeye kendin bas.';
        }
      });
  }

  function init(opts) {
    onChange = (opts && opts.onChange) || null;
    if (kuruldu) return;
    kuruldu = true;
    if (!serialVarMi()) return;
    navigator.serial.addEventListener('connect', kartTakildi);
    navigator.serial.addEventListener('disconnect', kartCikarildi);
    navigator.serial.getPorts().then(function (portlar) {
      if (portlar.length) kartTakildi();
    }).catch(function () {});
  }

  /* Kaldığın yerden devam (lesson-engine devam_v1, 2026-10-04): çocuk kabloyu
     önceki oturumda taktıysa sahne takılı açılır. Ses ve ödül YOK — bu bir
     ödül anı değil, eski durumun geri gelmesi. */
  function geriYukle() {
    if (connected()) return;
    usbUcu = true; typecUcu = true; cagriliyor = false;
    paint();
    duyur();
  }

  global.UsbLink = {
    init: init, html: html, paint: paint, toggle: toggle, detect: detect,
    connected: connected, gateMessage: gateMessage, noPowerMessage: noPowerMessage,
    focusGate: focusGate, geriYukle: geriYukle
  };
})(window);
