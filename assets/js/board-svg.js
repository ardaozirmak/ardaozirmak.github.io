/* ============================================================
   DENEYAP MINI v2 KART ÇİZİMİ — TEK KAYNAK
   ============================================================
   Bu kart iki derste ayrı ayrı, birbirinden bağımsız string olarak
   duruyordu (assets/js/wiring-diagram.js ve index.html) — ve bu yüzden
   bugüne kadar iki kez ayrıştı (biri güncellenip diğeri unutuldu).
   Artık TEK çizim burada, iki ders de BoardSVG.groupMarkup() çağırıyor.

   window.BoardSVG global'i (proje düz <script> kullanıyor, ES modül
   YOK — window.Store, window.WiringDiagram deseniyle aynı).

   Koordinatlar wiring-diagram.js'in eski 480x320 viewBox'ından
   aynen taşındı: kart gövdesi x 16..156, y 18 (USB çıkıntısının
   üstü)..306 (gölgenin altı). index.html'deki kart aynı koordinatları
   KIRPILMIŞ bir viewBox ile gösterir (bkz. styles.css #layer-kart) —
   iki kart bu sayede birebir aynı kalır, ölçek/oran farkı yok.

   Kullanım:
     BoardSVG.groupMarkup({ rings: true })                // ders 1.2
     BoardSVG.groupMarkup({ ids: true, hotspots: true })   // ders 1.1

   Seçenekler (hepsi varsayılan false → çıplak kart):
     rings     — yalnızca ders 1.2: MI/GND pin adlarının VURGUSU (wd-pin-key),
                 D5/GND bağlantı halkaları ve
                 "= D5" takma ad yazısı (wiring-diagram.js'in adım
                 vurgusu bu id'leri kullanır).
     ids       — yalnızca ders 1.1: dahili LED ve GÜÇ ledine script.js'in
                 yakaladığı id'ler (layer-led + arkasına layer-glow,
                 layer-pwr-led + layer-pwr-halo). Ayrıca dahili LED'in
                 statik etiketine ayırt edici bir sınıf ekler (Adım 3'te
                 hotspot etiketiyle çakışmasın diye, bkz. board-svg.css
                 .step3-hotspots .wd-boardlbl-led).
     hotspots  — yalnızca ders 1.1: Adım 3 keşif bölgeleri (Type-C soketi,
                 Dahili LED) — script.js showPartInfo()'yu çağırır.

   Bağımlılık yok. Çağıran taraf CSS'i yükler (assets/css/board-svg.css).
   file:// ile çalışır, build gerekmez.
   ============================================================ */

(function (global) {
  'use strict';

  /* PIN ADLARI — pedin "üstünde" (Arda, 2026-10-07: "yazılar pinin altında, bir pin yukarı al").
     Resmî diyagramdaki gibi: Type-C tarafından bakınca her ad kendi pedinin hemen ÜSTÜNDE,
     pin sırasının çizgisinde, iki ped arasındaki boşlukta. Port kart yerelinde üstte olduğu
     için "üst" = +y: ad, ped merkezinin yarım adım (7.7) aşağısına ortalanır. Eskiden ad pedin
     kartın içine bakan yanındaydı (sol x 30, sağ x 138 — "pinin altında").
     Pedler (blender/deneyap.py, sahne3b.js başlık blokları): sol 12 ped x16..25, merkez
     y 104.2 + i·15.4; sağ 15 ped x147..156, merkez y 58 + i·15.4. Ad ped merkezinden 2 birim içeride (x 23 / 149): "GND" gibi uzun adlar kart
     kenarından taşmasın. Yazı yönü board-svg.css'te. */
  /* PARÇALARIN YERİ — TEK KAYNAK (2026-10-14, kart gerçek Mini v2 yerleşimine geçti).
     blender/deneyap.py'deki KONUM'un AYNISI; tests/test-kart-render.mjs render pikselini bu
     noktalarda örnekler. 3B betikler (sahne3b, kart-sahne3b, kart3b) sabit sayı yazmaz, buradan
     okur. Kart yereli, port ÜSTTE: USB → GÜÇ/I2C → BUTON+RESET → RGB LED → çip → logo.
     Port aşağıdayken (resmî diyagram) BUTON solda, RESET sağda — yerelde tersi. */
  var KONUM = {
    usb: { x: 63, y: 17, w: 46, h: 36, agiz: [86, 17] },   // USB-C; ağız kart kenarından (26) 9 taşar
    cip: { x: 73.4, y: 199.2, w: 42.4, h: 42.4 },          // ESP32-S2 QFN56
    led: [86, 153.6],                                      // dahili RGB LED merceğinin merkezi
    ledGovde: { x: 70.8, y: 139.1, w: 30.4, h: 29 },
    guc: [70.7, 73.4],                                     // GÜÇ LED'i
    buton: [108.6, 115],                                   // basma uçlarının merkezi
    reset: [63.3, 115],
    jst: { x: 19.7, y: 58.2, w: 25.9, h: 36.4 },           // I2C soketi
    logo: [86, 274.5]
  };

  var PIN_SOL = ['GND', '3V3', 'SD', 'SC', 'MC', 'MI', 'MO', 'D3', 'D2', 'TX', 'RX', 'EN'];
  var PIN_SAG = ['5V', '3V3', 'GND', 'D9', 'D10', 'DA1', 'DA0', 'A7', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0'];
  var PIN_ADIM = 15.4, PIN_YARIM = 7.7;
  function pinAdlari(rings) {
    var out = '';
    PIN_SOL.forEach(function (ad, i) {
      var key = rings && (ad === 'GND' || ad === 'MI') ? ' wd-pin-key' : '';
      out += '<text x="23" y="' + (104.2 + i * PIN_ADIM + PIN_YARIM).toFixed(1) + '" class="wd-pin wd-pin-l' + key + '">' + ad + '</text>';
    });
    PIN_SAG.forEach(function (ad, i) {
      out += '<text x="149" y="' + (58 + i * PIN_ADIM + PIN_YARIM).toFixed(1) + '" class="wd-pin">' + ad + '</text>';
    });
    return out;
  }

  function groupMarkup(opts) {
    opts = opts || {};
    var rings = !!opts.rings;
    var ids = !!opts.ids;
    var hotspots = !!opts.hotspots;

    var K = KONUM;
    /* isiksiz: 3B yazı katmanları (sahne3b, kart-sahne3b, kart3b) yalnız BASKIYI ister — LED ve
       GÜÇ ışığını 3B kendisi yakar. Katmana basılan kırmızı GÜÇ halesi beyaz LED gövdesinin
       çevresinde hep yanık bir leke gibi kalıyordu. */
    var isiksiz = !!opts.isiksiz;
    var ledIdAttr = ids ? ' id="layer-led"' : '';
    var glowEl = ids ? '<circle id="layer-glow" cx="' + K.led[0] + '" cy="' + K.led[1] + '" r="16" fill="var(--color-accent)"/>' : '';
    var pwrHaloIdAttr = ids ? ' id="layer-pwr-halo"' : '';
    var pwrLedIdAttr = ids ? ' id="layer-pwr-led"' : '';
    var ledLabelClass = ids ? ' wd-boardlbl-led' : '';

    /* Yazıların y'si TABAN çizgisi; her yazı kendi kutusunda 180° döner (board-svg.css),
       kutu tabanın ~4 birim üstünde. BUTON/RESET tuşların port tarafında (resmî diyagram),
       GÜÇ LED'inin port tarafında, DAHİLİ LED etiketi LED gövdesiyle çip arasında. */
    var out = '' +
'<ellipse class="bsvg-golge" cx="86" cy="300" rx="62" ry="6" fill="#2b0f0c" opacity="0.18"/>' +
/* Fiziksel gövde Blender render'ı (blender/deneyap.py): gerçek Mini v2 yerleşimi —
   çentikli PCB, TTT logosu, ESP32-S2 çipi, kristal, RGB LED, tuşlar, I2C soketi,
   USB-C, ~40 SMD, bakır yollar, lehimli pinler. Kapsam kart yerelinde x10..162,
   y12..300. Yazılar, LED ışıkları, halkalar SVG'de kalır: ders mantığı onlara bağlı.
   Arda (2026-10-14): "deneyap kart üzerindeki detayları arttır, görseldeki gibi". */
'<image class="bsvg-render" href="assets/img/kart/deneyap-kart.webp" x="10" y="12" width="152" height="288" preserveAspectRatio="none"/>' +
'<text x="' + (K.cip.x + K.cip.w / 2) + '" y="' + (K.cip.y + K.cip.h / 2 + 2) + '" class="wd-chiptext">ESP32-S2</text>' +
'<text x="' + K.buton[0] + '" y="97" class="wd-boardlbl">BUTON</text>' +
'<text x="' + K.reset[0] + '" y="97" class="wd-boardlbl">RESET</text>' +
(isiksiz ? '' : glowEl +
'<circle' + ledIdAttr + ' cx="' + K.led[0] + '" cy="' + K.led[1] + '" r="10" fill="#f4f1ea"/>') +
'<text x="' + K.led[0] + '" y="' + (K.ledGovde.y + K.ledGovde.h + 9.4) + '" class="wd-boardlbl' + ledLabelClass + '">DAHİLİ LED</text>' +
(isiksiz ? '' :
'<circle' + pwrHaloIdAttr + ' cx="' + K.guc[0] + '" cy="' + K.guc[1] + '" r="5" fill="#ff4438" opacity="0.28"/>' +
'<circle' + pwrLedIdAttr + ' cx="' + K.guc[0] + '" cy="' + K.guc[1] + '" r="2.2" fill="#ff5a4d"/>') +
'<text x="' + K.guc[0] + '" y="' + (K.guc[1] - 5.4) + '" class="wd-boardlbl">GÜÇ</text>' +
pinAdlari(rings);

    if (rings) {
      /* "= D5" çağrısının yeri düzene göre değişiyor. Dikey kartta pinin
         SOLUNDA boş yer var (MI artık sol sütunda). Yatayda (kart
         breadboard'a takılıyken) yazı MI pininin ÜSTÜNDEKİ boş
         breadboard sırasına gidiyordu. 2026-09-22: devre kanalın alt
         yarısına aynalanınca kablo TAM O SIRAYA (a, y 220) takıldı ve
         yazı kablonun üstüne bindi. Yazı bir sıra daha dışarı alındı
         (board-local x 5.1 -> -9.9, sahnede y 220 -> 235): kabloların
         altındaki boş bant — ama kablo yolu yeniden çizilince orası da doldu.
         NİHAİ YER: kartın dibinde, kırmızı fişin SOLUNDA — sahne (215, 221).
         Eşleme (yazının döndürme merkezi kendi çapasıyla aynı olduğu için
         rotate(90) ile kartın rotate(-90 86 160)'i sadeleşiyor):
           sahne_x = yerel_y + 58.2
           sahne_y = 225.1 - yerel_x
         -> yerel (4.1, 156.8). Yazı 212..221'de, siyah kablo orada ~243'te:
         22 birim pay. ÖNCE İKİ KEZ ÇAKIŞTI — bir kez "MI" baskısının
         üstüne, bir kez GND'ye tırmanan siyah kablonun altına düştü;
         ikisi de yeri ölçmeden tahmin ettiğim içindi.

         KARŞI DÖNÜŞ: bu yazı kartın baskısı DEĞİL, bizim eklediğimiz
         çağrı — kartla birlikte dönmemeli, yatay okunmalı. Kart -90
         döndüğü için yazıya +90 veriliyor; net dönüş sıfır. İşareti
         kartın dönüş yönüyle birlikte değişir, unutulursa yazı BAŞ
         AŞAĞI kalır (2026-09-22'de tam olarak bu oldu). */
      out += '' +
'<text x="' + (opts.horizontal ? 4.1 : 2) + '" y="' + (opts.horizontal ? 156.8 : 187.3) +
  '" class="wd-pin-alias"' + (opts.horizontal ? ' transform="rotate(90 4.1 156.8)"' : '') + '>= D5</text>' +
'<circle class="wd-ring" id="wd-ring-d5" cx="20.5" cy="181.2" r="8.5"/>' +
'<circle class="wd-ring" id="wd-ring-gnd" cx="20.5" cy="104.2" r="8.5"/>';
    }

    if (hotspots) {
      out += hotspotsMarkup();
    }

    /* YATAY KART (opts.horizontal) — breadboard'a takılı hâli.
       Ders 1.2'nin şemasında kart breadboard'un üstünde, orta kanalı
       boydan boya kaplayacak şekilde YATIK duruyor (kaynak: dersin kendi
       devre görseli, assets/img/ders1-2-devre.png). Arda: "Deneyap kart
       breadboard'a da takılı olmalı."

       Çizimi yeniden yapmak yerine aynı tek kaynağı döndürüyoruz:
       -90° etrafında kartın merkezi (86,160). Böylece pin adları, LED,
       butonlar, gradyanlar — hepsi dikey kartla BİREBİR aynı kalıyor.

       YAZILAR DA DÖNÜYOR. Bir süre karşı döndürülüp yatay tutulmuşlardı;
       Arda "yazılar yatay, onları dik yap, gerçek Deneyap'ta nasılsa"
       dedi — haklı: kartın baskısı kartla birlikte döner, kutudan çıkan
       kartı eline alan çocuk ekrandakiyle aynı şeyi görmeli. Tek istisna
       "= D5": o kartın baskısı değil, bizim eklediğimiz çağrı.

       Pin adının y'si dikeyde YAZI TABANI (pad merkezinin 2.6 altı).
       Döndükten sonra bu değer yazının SÜTUN üzerindeki yerini belirliyor,
       yani 2.6'lık taban payı yazıyı pininden kaydırıyordu. Düzeltme CSS'te
       (`.bsvg-h .wd-pin`): dominant-baseline:central + translateY(-2.6px).
       MARKUP'A DOKUNULMUYOR — kart iki derste birebir aynı kalmalı
       (test-board bunu ölçüyor); burada y'yi yeniden yazmak kartı ayırıyordu.
       Arda: "yazı iki pin ortasına, pin lehimlerinin ortasına yazılıyor." */
    if (opts.horizontal) {
      /* DÖNÜŞ -90. Arda'nın istediği son hâl (2026-09-22, gerçek kartı
         eline alıp karşılaştırarak): "sağdaki gri port kısmı kabloya
         girecek, üstteki D5 pini aşağıda olacak."
         Yani: Type-C soketi SOLDA (laptop kablosunun geldiği yer),
         D5 (MI) ve GND breadboard'un ALT tarafında.

         Bu fizikle de uyumlu: kart USB SOLA bakacak şekilde takılıysa
         gerçek Deneyap Mini v2'de MI/D5 aşağı bakar (resmî genişletilmiş
         diyagramın 90° saat yönünde döndürülmüş hâli).

         NOT: kablolar hâlâ breadboard'un ÜST yarısında. Devrenin alt
         yarıya taşınması ayrı bir iş; Arda "başka bir şeyi elleme" dedi. */
      out = '<g class="bsvg-h" transform="rotate(-90 86 160)">' + out + '</g>';
    }

    return out;
  }

  /* Adım 3 keşif bölgeleri — yalnızca ders 1.1 (index.html). 2026-09-28'den beri
     hiçbir sayfa açmıyor (script.js: sarı bölgeler kalktı); koordinatlar yine de
     KONUM'a bağlı, yeniden açılırsa doğru parçayı kaplasın.
     Type-C: USB-C soketinin üstü. Dahili LED: RGB LED gövdesinin üstü. */
  function hotspotsMarkup() {
    var K = KONUM;
    return '' +
'<rect id="hotspot-typec" class="hotspot-zone" x="' + (K.usb.x - 5) + '" y="' + (K.usb.y - 7) + '" width="' + (K.usb.w + 10) + '" height="' + (K.usb.h + 12) + '" rx="8" style="display:none;" onclick="showPartInfo(&#39;typec&#39;)"/>' +
'<text id="hotspot-typec-label" class="hotspot-label" x="86" y="' + (K.usb.y + K.usb.h + 14) + '" text-anchor="middle" style="display:none;">TYPE-C</text>' +
'<text id="hotspot-typec-arrow" class="hotspot-arrow" x="132" y="34" text-anchor="middle" style="display:none;">◀ Tıkla</text>' +
'<rect id="hotspot-led" class="hotspot-zone" x="' + (K.ledGovde.x - 4) + '" y="' + (K.ledGovde.y - 4) + '" width="' + (K.ledGovde.w + 8) + '" height="' + (K.ledGovde.h + 8) + '" rx="6" style="display:none;" onclick="showPartInfo(&#39;led&#39;)"/>' +
/* Statik "DAHİLİ LED" etiketiyle AYNI konum — o etiket bu hotspot açıkken CSS
   ile gizleniyor (bkz. .step3-hotspots .wd-boardlbl-led), üst üste binmiyor. */
'<text id="hotspot-led-label" class="hotspot-label" x="' + K.led[0] + '" y="' + (K.ledGovde.y + K.ledGovde.h + 9.4) + '" text-anchor="middle" style="display:none;">DAHİLİ LED</text>' +
/* Ok LED gövdesinin SAĞINDA, "Tıkla" bir satır altında (tek satır 13px'te pin
   adlarına taşıyordu — eski yerleşimde ölçülmüştü). Bölge kullanılmadığı için
   yeni yerleşimde ölçülmedi; açılırsa getBBox ile yeniden ölç. */
'<text id="hotspot-led-arrow" class="hotspot-arrow" text-anchor="middle" style="display:none;">' +
'<tspan x="' + (K.ledGovde.x + K.ledGovde.w + 8) + '" y="' + (K.led[1] + 4) + '">◀</tspan>' +
'<tspan x="' + (K.ledGovde.x + K.ledGovde.w + 20) + '" y="' + (K.led[1] + 20) + '">Tıkla</tspan></text>';
  }

  /* 3B kartlar için pin adı stili (Arda, 2026-10-05: "gerçekte pinin üstünde yazmakta"). Konum
     2026-10-07'den beri 2B ile aynı (pinAdlari: pedin port tarafına göre üstü); 3B'de yalnız
     yazı daha küçük. Eskiden burada ad pedin PORT tarafına (y −7.4) taşınıyordu: yazılar
     180° dönünce o yan "pinin altı" oldu. */
  var PIN_USTTE_STIL = '.wd-pin{font:700 5px Arial,sans-serif;fill:#f7e9e6;text-anchor:middle;dominant-baseline:central;opacity:.95}';
  /* 3B yazı katmanlarının (sahne3b, kart-sahne3b, kart3b) TEK stil kaynağı: SVG resim olarak
     tuvale çizilince sayfanın CSS'i (board-svg.css) ona ulaşmaz, stil içine gömülür.
     Eskiden üç dosyada ayrı ayrı kopyasıydı (2026-10-05 temizlik). */
  var STIL_3B =
    '.wd-brand{font:700 9px Arial,sans-serif;fill:#fff;text-anchor:middle;letter-spacing:1px}' +
    '.wd-brand-sub{font:600 5.5px Arial,sans-serif;fill:#f7e9e6;text-anchor:middle;letter-spacing:1.6px}' +
    '.wd-chiptext{font:700 5px Arial,sans-serif;fill:#9aa0a8;text-anchor:middle;letter-spacing:.3px}' +
    '.wd-boardlbl{font:700 5.5px Arial,sans-serif;fill:#f7e9e6;text-anchor:middle;opacity:.8}' +
    PIN_USTTE_STIL +
    /* Baskı port tarafından okunur (Arda, 2026-10-07): her yazı kendi ortasında 180° (bkz. board-svg.css). */
    'text.wd-brand,text.wd-brand-sub,text.wd-chiptext,text.wd-boardlbl,text.wd-pin{transform-box:fill-box;transform-origin:center;transform:rotate(180deg)}';
  /* 3B katmanlarının çağrısı korunuyor: konum artık 2B ile aynı, yalnız wd-pin-key vurgusu
     (ders 1.2'nin halkası) 3B'de yok. */
  function pinlerUstte(markup) {
    return markup.replace(/ wd-pin-key/g, '');
  }

  global.BoardSVG = { groupMarkup: groupMarkup, pinlerUstte: pinlerUstte, STIL_3B: STIL_3B, KONUM: KONUM };
})(window);
