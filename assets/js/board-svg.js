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

    var ledIdAttr = ids ? ' id="layer-led"' : '';
    var glowEl = ids ? '<circle id="layer-glow" cx="84" cy="227.5" r="11" fill="var(--color-accent)"/>' : '';
    var pwrHaloIdAttr = ids ? ' id="layer-pwr-halo"' : '';
    var pwrLedIdAttr = ids ? ' id="layer-pwr-led"' : '';
    var ledLabelClass = ids ? ' wd-boardlbl-led' : '';

    var out = '' +
'<ellipse class="bsvg-golge" cx="86" cy="300" rx="62" ry="6" fill="#2b0f0c" opacity="0.18"/>' +
/* Fiziksel gövde Blender render'ı (blender/deneyap.py): PCB, montaj delikleri,
   USB-C, ESP32-S2 kalkanı, tuşlar, altın pedler, SMD parçalar. Kapsam kart
   yerelinde x10..162, y12..300 — ölçüler bu dosyadaki eski çizimle birebir.
   Yazılar, LED'ler, halkalar SVG'de kalır: ders mantığı onlara bağlı.
   Arda (2026-09-30): "devreleri, Deneyap'ı daha iyi olacaksa Blender ile yap". */
'<image class="bsvg-render" href="assets/img/kart/deneyap-kart.webp" x="10" y="12" width="152" height="288" preserveAspectRatio="none"/>' +
'<circle cx="86" cy="44" r="7" fill="#7a1712" opacity="0.55"/>' +
'<path d="M82 41 h8 M86 41 v7" stroke="#f7e9e6" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
'<text x="84" y="102" class="wd-chiptext">ESP32-S2</text>' +
'<text x="84" y="146" class="wd-brand">DENEYAP</text>' +
'<text x="84" y="157" class="wd-brand-sub">MINI v2</text>' +
'<text x="65" y="206" class="wd-boardlbl">BUTON</text>' +
'<text x="105" y="206" class="wd-boardlbl">RESET</text>' +
glowEl +
'<rect x="77.5" y="221" width="13" height="13" rx="2" fill="#14181d" stroke="#2c3540"/>' +
'<rect' + ledIdAttr + ' x="80" y="223.5" width="8" height="8" rx="1.6" fill="#e2e8f0"/>' +
'<text x="84" y="244" class="wd-boardlbl' + ledLabelClass + '">DAHİLİ LED</text>' +
'<circle' + pwrHaloIdAttr + ' cx="84" cy="262" r="4.6" fill="#ff4438" opacity="0.28"/>' +
'<circle' + pwrLedIdAttr + ' cx="84" cy="262" r="2.4" fill="#ff5a4d"/>' +
'<text x="84" y="275" class="wd-boardlbl">GÜÇ</text>' +
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

  /* Adım 3 keşif bölgeleri — yalnızca ders 1.1 (index.html).
     Type-C: kartın üstündeki USB çıkıntısının (x68 y18 w36 h14) ve
     altındaki vida bezeğinin (86,44) üzerini kapsayan geniş bölge.
     Dahili LED: LED gövdesinin (80,223.5,8,8) üzerini kapsayan bölge. */
  function hotspotsMarkup() {
    return '' +
'<rect id="hotspot-typec" class="hotspot-zone" x="58" y="10" width="56" height="46" rx="8" style="display:none;" onclick="showPartInfo(&#39;typec&#39;)"/>' +
'<text id="hotspot-typec-label" class="hotspot-label" x="86" y="54" text-anchor="middle" style="display:none;">TYPE-C</text>' +
'<text id="hotspot-typec-arrow" class="hotspot-arrow" x="128" y="30" text-anchor="middle" style="display:none;">◀ Tıkla</text>' +
'<rect id="hotspot-led" class="hotspot-zone" x="70" y="212" width="28" height="32" rx="6" style="display:none;" onclick="showPartInfo(&#39;led&#39;)"/>' +
/* Statik "DAHİLİ LED" etiketiyle AYNI konum (84,244) — o etiket bu hotspot
   açıkken CSS ile gizleniyor (bkz. .step3-hotspots .wd-boardlbl-led),
   ikisi ekranda üst üste binmiyor. */
'<text id="hotspot-led-label" class="hotspot-label" x="84" y="244" text-anchor="middle" style="display:none;">DAHİLİ LED</text>' +
/* Ok, LED kutusunun SAGINA, LED ile ayni hizaya kondu — ama tek parca
   degil: "◀" isareti LED hizasinda (y=232), "Tıkla" kelimesi bir satir
   altinda (y=248). Sebep OLCUM: LED hizasinda sagda yalnizca 25.7 birim
   bos yer var (parlama halkasi x 95'te bitiyor, GND pin adi x 120.7'de
   basliyor) ve 13px'lik "◀ Tıkla" 52.4 birim genis — tek satir oraya
   SIGMIYOR. Sag sutunun son pini GND y 231.1'de bitiyor, altinda kalan
   x 100..156 / y 232+ bolgesi tamamen bos; kelime oraya iniyor.
   Eskiden ikisi tek satirda (124,262) idi: hotspot kutusunun (y 212..244)
   18 birim ALTINDA kaliyordu, yani okun ucu kutuyu degil GUC ledinin
   yanindaki bosluğu gosteriyordu — Arda "tıkla tuşunu yukarı alcaz" dedi.
   Cakisma paylari (getBBox ile olculdu, .show animasyonunun +6 birimlik
   saga kaymasi da hesaba katildi): "◀" x 99.3..112.7 / y 217.5..236.5,
   GND pin adina 8 birim (kaymayla 2) kaliyor; "Tıkla" x 108.3..147.7 /
   y 233.4..252.5, GND'nin altinda kaliyor ve sag kenara (156) 8 birim
   (kaymayla 2) var. */
'<text id="hotspot-led-arrow" class="hotspot-arrow" text-anchor="middle" style="display:none;">' +
'<tspan x="106" y="232">◀</tspan><tspan x="128" y="248">Tıkla</tspan></text>';
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
    '.wd-chiptext{font:700 7.5px Arial,sans-serif;fill:#c7ced6;text-anchor:middle}' +
    '.wd-boardlbl{font:700 5.5px Arial,sans-serif;fill:#f7e9e6;text-anchor:middle;opacity:.8}' +
    PIN_USTTE_STIL +
    /* Baskı port tarafından okunur (Arda, 2026-10-07): her yazı kendi ortasında 180° (bkz. board-svg.css). */
    'text.wd-brand,text.wd-brand-sub,text.wd-chiptext,text.wd-boardlbl,text.wd-pin{transform-box:fill-box;transform-origin:center;transform:rotate(180deg)}';
  /* 3B katmanlarının çağrısı korunuyor: konum artık 2B ile aynı, yalnız wd-pin-key vurgusu
     (ders 1.2'nin halkası) 3B'de yok. */
  function pinlerUstte(markup) {
    return markup.replace(/ wd-pin-key/g, '');
  }

  global.BoardSVG = { groupMarkup: groupMarkup, pinlerUstte: pinlerUstte, STIL_3B: STIL_3B };
})(window);
