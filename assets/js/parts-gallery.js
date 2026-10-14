/* parts-gallery.js — Adım 3: "Parça Tanıtımı"
   ------------------------------------------------------------------
   NEDEN VAR: Adım 3 eskiden tek paragraflık bir metindi ve içinde
   "anot/katot" geçiyordu. Arda: "3. adımda bütün parçaları tek tek
   görseliyle birlikte gösterip tanıtsın, çünkü parçaları bilmeyecek
   öğrenci" + "anot katot anlamaz öğrenci".

   TASARIM KURALI (bkz. Kurallar.md): derinlik ekrana METİN olarak
   yazılmaz, GÖSTERİLEREK ve isteğe bağlı açılarak verilir. Bu yüzden
   her kartta ekranda yalnızca görsel + TEK kısa cümle durur; gerisi
   "Yakından bak" ile açılan katmandadır. Cümleler 5. sınıf ölçüsünde
   (~8-9 kelime) tutuldu.

   SÖZCÜK SEÇİMİ: anot/katot HİÇ geçmiyor. Çocuğun elindeki LED'de
   gerçekten görebileceği iki ipucu kullanılıyor — bacak uzunluğu
   (UZUN/KISA) ve içerideki parçanın kalınlığı (ŞİŞMAN/İNCE).
   Direncin nereye gireceği bu dille iki kez söyleniyor (hem LED
   kartında hem direnç kartında), çünkü en sık takılınan yer orası.

   Görseller `assets/img/parcalar/` altında. Kart (Deneyap Mini v2)
   için fotoğraf YOK: onu zaten kendimiz çiziyoruz (`board-svg.js`),
   çocuğun ekranda gördüğüyle elindeki aynı olsun diye o çizim
   kullanılıyor. */
(function (global) {
  'use strict';

  var IMG = 'assets/img/parcalar/';

  /* Her parça: görsel + tek cümle + açılır katman.
     `lines` en fazla 4 satır — kontrol noktası, ders değil. */
  var PARTS = [
    {
      id: 'kart',
      name: 'Deneyap Mini v2 Kartı',
      count: '1 adet',
      board: true,
      short: 'Devrenin beynidir. Kodu buna yükleyeceksin.',
      lines: [
        'Kenarındaki yazılar pin adlarıdır.',
        'Bu derste iki tanesini kullanacaksın: <b>D5</b> ve <b>GND</b>.',
        'D5 akımı verir, GND akımı geri alır.'
      ]
    },
    {
      id: 'usb',
      name: 'Type-C USB Kablosu',
      count: '1 adet',
      img: IMG + 'usb-kablo.jpg',
      w: 502, h: 436,
      alt: 'Bir ucu yassı USB-A, öbür ucu küçük oval Type-C olan beyaz kablo',
      short: 'Kartı bilgisayara bağlar.',
      lines: [
        'Yassı ucu (geniş olan) bilgisayara girer.',
        'Küçük oval ucu karta girer.',
        'Yazdığın kod karta bu kablodan gider.',
        'Her kablo olmaz: bazıları yalnızca şarj eder, veri taşımaz.'
      ]
    },
    {
      id: 'breadboard',
      name: 'Breadboard',
      count: '1 adet',
      img: IMG + 'breadboard.jpg',
      w: 554, h: 373,
      alt: 'Orta boy breadboard, üzerinde sıra sıra delikler var',
      short: 'Lehim yapmadan bağlantı kurduğun delikli tahta.',
      lines: [
        'Aynı sütundaki 5 delik içeriden birbirine bağlıdır.',
        'İki parçayı aynı sütuna takarsan birbirine değmiş olur.',
        'Ortadaki kanalın iki yanı ayrıdır.'
      ]
    },
    {
      id: 'led',
      name: 'LED',
      count: '1 adet',
      img: IMG + 'led-ic-yapisi.png',
      w: 466, h: 405,
      alt: 'LED fotoğrafı ve içinin çizimi: uzun bacak ince tarafta, kısa bacak şişman tarafta',
      short: 'Küçük bir ışık. Yalnızca tek yönde çalışır.',
      lines: [
        '<b>UZUN</b> bacak artı (+) taraftır, D5’e gider.',
        '<b>KISA</b> bacak eksi (−) taraftır, dirence gider.',
        'İçine bak: kısa bacağın tarafı <b>ŞİŞMAN</b>, uzun bacağınki <b>İNCE</b>.',
        'Ters takarsan yanmaz ama bozulmaz. Çevirip tekrar dene.'
      ]
    },
    {
      id: 'direnc',
      name: '220 ohm Direnç',
      count: '1 adet',
      img: IMG + 'direnc-220.png',
      w: 695, h: 190,
      alt: 'Üzerinde kırmızı, kırmızı, kahverengi ve altın renkli bantlar olan direnç',
      short: 'Akımı kısar, LED’i yanmaktan korur.',
      lines: [
        'Bantları <b>kırmızı-kırmızı-kahverengi</b>: bu 220 demektir.',
        'LED’in <b>KISA</b> (şişman) bacağı ile GND arasına girer.',
        'Yönü yoktur, ters takılmaz.'
      ]
    },
    {
      id: 'jumper',
      name: 'Jumper Kablo',
      count: '2 adet',
      img: IMG + 'jumper-kablo.jpg',
      w: 556, h: 607,
      alt: 'İki ucunda da metal iğne olan erkek-erkek jumper kablo',
      short: 'İki ucu da iğneli kablo.',
      lines: [
        'Bir ucu breadboard’a, öbür ucu kartın pinine girer.',
        '“Erkek-erkek” demek: iki uç da iğne.'
      ]
    }
  ];

  function visualHtml(p) {
    if (p.board && global.BoardSVG) {
      /* Kartın kendi çizimi. viewBox index.html'deki #layer-kart ile aynı —
         çocuğun ders boyunca gördüğü kartla birebir aynı görüntü. */
      /* 180°: Type-C portu aşağıda, baskı port tarafından düz okunur (2026-10-07, sol paneldeki
         #layer-kart ile aynı yön). viewBox merkezi (86, 162). */
      return '<svg class="pg-board" viewBox="10 12 152 300" role="img" aria-label="Deneyap Mini v2 kartı çizimi">' +
        '<g transform="rotate(180 86 162)">' + global.BoardSVG.groupMarkup() + '</g></svg>';
    }
    /* Gorsel BUYUTULEBILIR olmali: kartta ~230px genislikte duruyor, LED
       cizimindeki "INCE"/"SISMAN" etiketleri o olcekte okunmuyor (olculdu:
       466px'lik gorsel %47 olcekle iniyor, 17px etiket ekranda 8px kaliyor).
       Dersin bilgisi tam olarak o etiketlerde, bu yuzden tiklayinca tam boy
       aciliyor. Metin eklemeden derinlik vermenin yolu bu (bkz. Kurallar.md). */
    return '<button type="button" class="pg-zoom" onclick="PartsGallery.zoom(this)" ' +
      'aria-label="' + p.name + ' gorselini buyut">' +
      '<img class="pg-img" src="' + p.img + '" width="' + p.w + '" height="' + p.h +
      '" alt="' + p.alt + '" loading="lazy" decoding="async"></button>';
  }

  function cardHtml(p, i) {
    var bodyId = 'pgDetail' + i;
    return '' +
      '<li class="pg-card" data-part="' + p.id + '">' +
      '  <div class="pg-visual">' + visualHtml(p) + '</div>' +
      '  <div class="pg-head"><span class="pg-name">' + p.name + '</span>' +
      '    <span class="pg-count">' + p.count + '</span></div>' +
      '  <p class="pg-short">' + p.short + '</p>' +
      '  <button type="button" class="pg-more" aria-expanded="false" aria-controls="' + bodyId + '"' +
      '    onclick="PartsGallery.toggle(this)">Yakından bak</button>' +
      '  <div class="pg-detail" id="' + bodyId + '" hidden>' +
      '    <ul>' + p.lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>' +
      '  </div>' +
      '</li>';
  }

  /* opts (isteğe bağlı), Ders 1.1 için:
       sadece: ['kart', 'usb']  — yalnızca bu parçalar, bu sırayla
       ozel:   { kart: { short, lines } } — o derse göre metin (1.1'de
               D5/GND yok, orada kartın kendi ışığı anlatılıyor)
     Görsel ve ad yine TEK kaynaktan (PARTS) gelir. */
  function html(opts) {
    opts = opts || {};
    var liste = PARTS;
    if (Array.isArray(opts.sadece)) {
      liste = opts.sadece.map(function (id) {
        for (var i = 0; i < PARTS.length; i++) if (PARTS[i].id === id) return PARTS[i];
        return null;
      }).filter(Boolean);
    }
    if (opts.ozel) {
      liste = liste.map(function (p) {
        var o = opts.ozel[p.id];
        if (!o) return p;
        var kopya = {};
        for (var k in p) kopya[k] = p[k];
        for (var k2 in o) kopya[k2] = o[k2];
        return kopya;
      });
    }
    return '' +
      '<div class="quiz-box">' +
      '  <strong style="display:flex; align-items:center; gap:8px;">' +
      '    <svg class="icon"><use href="#icon-box"/></svg>Parçaları Tanıyalım</strong>' +
      '  <p class="step-card-desc" style="margin-top:8px;">Masandaki her parçaya tek tek bak. ' +
      'Merak ettiğini <strong>Yakından bak</strong> ile aç.</p>' +
      '  <ul class="pg-grid">' + liste.map(cardHtml).join('') + '</ul>' +
      '</div>';
  }

  /* Açılır katman. Ses YOK: gezinme ses çıkarmaz, ses ödül anına saklıdır
     (bkz. Kurallar.md — "her bir şeye basınca bıgıd bıgıd ses kafa ağrıtıyor"). */
  function toggle(btn) {
    var body = document.getElementById(btn.getAttribute('aria-controls'));
    if (!body) return;
    var open = body.hasAttribute('hidden');
    if (open) body.removeAttribute('hidden'); else body.setAttribute('hidden', '');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Kapat' : 'Yakından bak';
  }

  /* Tam boy gorsel perdesi. Sayfada tek bir perde var, her acilista
     yeniden doldurulur. Kapanma: perdeye tikla ya da Esc. */
  function zoom(btn) {
    var img = btn.querySelector('img');
    if (!img) return;
    var ov = document.createElement('div');
    ov.className = 'pg-lightbox';
    ov.innerHTML = '<img src="' + img.getAttribute('src') + '" alt="' + img.getAttribute('alt') + '">' +
      '<button type="button" class="pg-lightbox-close" aria-label="Kapat">Kapat</button>';
    function kapat() {
      ov.remove();
      document.removeEventListener('keydown', esc);
      btn.focus();
    }
    function esc(e) { if (e.key === 'Escape') kapat(); }
    ov.addEventListener('click', kapat);
    // Gorselin kendisine tiklamak perdeyi kapatmasin — cocuk bakmak icin
    // tikliyor, kapatmak icin degil. Kapatma: zemin, "Kapat" ya da Esc.
    ov.querySelector('img').addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('keydown', esc);
    document.body.appendChild(ov);
    ov.querySelector('.pg-lightbox-close').focus();
  }

  /* Adim 4 rehberi bu parca metinlerini yeniden gosteriyor (Arda: "3.
     adimi da dikkate almalarini istiyorum, oradaki bilgileri alirlarsa
     kurulumu daha kolay yapacaklar"). Metin KOPYALANMAZ - tek kaynak
     yukaridaki PARTS dizisi. Adim 3'te bir cumle degisirse Adim 4'teki
     de degisir, ikisi ayrisamaz. */
  function get(id) {
    for (var i = 0; i < PARTS.length; i++) {
      if (PARTS[i].id === id) return { id: id, name: PARTS[i].name, lines: PARTS[i].lines || [] };
    }
    return null;
  }

  global.PartsGallery = { html: html, toggle: toggle, zoom: zoom, parts: PARTS, get: get };
})(window);
