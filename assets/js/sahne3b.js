/* ============================================================
   SAHNE 3B — devre sahnesinin gerçek 3B hali (2026-09-30)
   ============================================================
   Arda: "3B animasyon yap, ders SVG yerine; laptopu da değiş, laptoptan
   karta giden kablo da güzel değil." Kapsam: sahnenin tamamı 3B.
   Spec: docs/superpowers/specs/2026-09-30-sahne-3b.md

   3B AYNA: SVG sahne (wiring-diagram.js) DOM'da kalır ve dersin tek
   doğru kaynağıdır — adım, parça durumu, USB, LED ritmi, tezgah eşyaları.
   Bu katman SVG'nin üstüne bir <canvas> koyar, SVG'yi her karede okur ve
   aynısını 3B çizer; SVG görünmez olur ama yerinde kalır.
     - Koordinat: SVG birimi × 0.01 → three; x → X, y → Z, yükseklik Y.
       Blender modelleri (blender/*.py) aynı ölçüyle üretildi.
     - Kartın yeri SVG'deki kart resminin dönüşüm matrisinden okunur;
       parça bacakları WiringDiagram.TAK_DELIK'teki deliklere iner.
     - LED parlaklığı SVG'deki ışıma katmanının o anki saydamlığından:
       1.3'ün hızlı, 1.4'ün sıralı yanıp sönmesi kendiliğinden eşleşir.
   Kurulmaz (SVG görünür kalır): WebGL yoksa ya da Hareket kapalıysa
   (otomasyon, "hareketi azalt"). Testler bu yüzden SVG'yi görür.
   file://: modeller ve dokular data:/tuvalden — dosyadan yüklenen resim
   WebGL dokusu olamıyor (tuvali kirletir).
   ============================================================ */
window.Sahne3B = (function () {
  'use strict';
  var S = 0.01;
  var MASA_Y = -0.092;           // breadboard tabanı (blender/breadboard.py: -9 birim)
  var KART_Y = 0.07;             // kart, pin başlıklarının üstünde
  /* Parça listesi SVG'den okunur (sahneKur): 1.2/1.4'ün sabit adları ve 1.5/1.6 LED sırasının
     led-1…, direnc-1…, kablo-d9… adları aynı yoldan gelir. */

  var kurulu = null;             // { stage, svg } — aynı sahneye iki kez kurma

  // ---------------- yardımcılar ----------------
  /* Bir kez sınanır: her sınama yeni bir WebGL bağlamı açıyor, gözlemci
     defalarca çağırınca tarayıcı "çok fazla bağlam" deyip sahneninkini kapatıyordu. */
  var webgl = null;
  function webglVar() {
    if (webgl === null) {
      try {
        var c = document.createElement('canvas'), g = c.getContext('webgl') || c.getContext('experimental-webgl');
        webgl = !!g;
        var k = g && g.getExtension('WEBGL_lose_context'); if (k) k.loseContext();
      } catch (e) { webgl = false; }
    }
    return webgl;
  }
  /* Aynı betik için tek söz: sahne çizilirken gözlemci defalarca tetikleniyor;
     ikinci çağrı yüklemesi bitmemiş betiği "hazır" sanıp THREE'siz kalıyordu. */
  var sozler = {};
  function yukle(src) {
    if (!sozler[src]) sozler[src] = new Promise(function (ok, hata) {
      var s = document.createElement('script'); s.src = src;
      s.onload = ok; s.onerror = hata; document.head.appendChild(s);
    });
    return sozler[src];
  }
  var kuruluyor = null;            // şu an kurulumu süren svg
  function tampon(b64) {
    var bin = atob(b64), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  }
  function glb(ad) {
    return new Promise(function (ok, hata) {
      new THREE.GLTFLoader().parse(tampon(window.SAHNE3B_GLB[ad]), '', function (g) { ok(g.scene); }, hata);
    });
  }
  function renk(css, yedek) {
    var c = new THREE.Color();
    try { c.setStyle((css || '').trim() || yedek); } catch (e) { c.setStyle(yedek); }
    return c;
  }
  function cssVar(ad, yedek) { return getComputedStyle(document.documentElement).getPropertyValue(ad).trim() || yedek; }
  function yay(t) { var s = 1.70158 * 1.4; t -= 1; return t * t * ((s + 1) * t + s) + 1; }    // outBack
  function yumusak(t) { return 1 - Math.pow(1 - t, 3); }
  function dongu(x) { return ((x % 1) + 1) % 1; }      // her zaman 0..1 (eğri dışına taşmasın)

  /* SVG elemanının yerel koordinatını SVG kök (viewBox) koordinatına götüren matris. */
  function svgMatris(svg, el) {
    return svg.getScreenCTM().inverse().multiply(el.getScreenCTM());
  }
  /* 2B afin (a b c d e f) → 3B: x → X, y → Z; öteleme × S. */
  function matris4(m) {
    var M = new THREE.Matrix4();
    M.set(m.a, 0, m.c, m.e * S, 0, 1, 0, 0, m.b, 0, m.d, m.f * S, 0, 0, 0, 1);
    return M;
  }
  function nokta(x, y, h) { return new THREE.Vector3(x * S, h || 0, y * S); }

  // ---------------- tuval dokuları ----------------
  /* Laptop ekranı: Arduino IDE penceresi, mağazadaki ekran temasının renkleri. */
  function ekranCiz(tuval, zaman) {
    var x = tuval.getContext('2d'), W = tuval.width, H = tuval.height;
    var zemin = cssVar('--lt-ekran', '#0b1220'), vurgu = cssVar('--lt-vurgu', '#6FB7FF');
    x.fillStyle = zemin; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(0, 0, W, 34);
    [['#ef4444', 18], ['#f59e0b', 36], ['#22c55e', 54]].forEach(function (d) {
      x.fillStyle = d[0]; x.beginPath(); x.arc(d[1], 17, 6, 0, 7); x.fill();
    });
    x.fillStyle = vurgu; x.font = 'bold 20px Arial, sans-serif'; x.textAlign = 'center';
    x.fillText('Arduino IDE', W / 2, 24);
    var satir = [['#7FB4FF', 0.32, 0], ['#E5C07B', 0.46, 1], ['#7FB4FF', 0.12, 0], ['#98C379', 0.36, 0], ['#E5C07B', 0.5, 1], ['#98C379', 0.28, 0]];
    var canli = document.documentElement.hasAttribute('data-ekran-canli');
    satir.forEach(function (s, i) {
      var k = canli ? Math.min(1, Math.max(0.05, ((zaman / 350) % 10) - i * 0.9) / 3) : 1;
      x.fillStyle = canli ? vurgu : s[0];
      x.globalAlpha = 0.9;
      x.fillRect(40 + s[2] * 28, 60 + i * 34, W * s[1] * k, 12);
    });
    x.globalAlpha = 1;
  }

  /* Kartın yazıları ve LED'leri (BoardSVG): gövde render'ı olmadan, şeffaf zeminde.
     Resim olarak çizilen SVG içindeki <image> yüklenmez — tam istediğimiz bu. */
  function kartYazilari(cb) {
    var olcek = 6;
    var stil = BoardSVG.STIL_3B;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="16 26 140 268" width="' + 140 * olcek + '" height="' + 268 * olcek +
      '"><style>' + stil + '</style>' + BoardSVG.pinlerUstte(BoardSVG.groupMarkup({})) + '</svg>';
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = 140 * olcek; c.height = 268 * olcek;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      cb(c);
    };
    img.onerror = function () { cb(null); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* Breadboard üst yüzü: delikler, ray çizgileri, + / − işaretleri — SVG'deki
     elemanların kendi koordinatlarından (x40..550, y10..276). */
  function breadboardYuzu(svg) {
    var olcek = 4, X0 = 40, Y0 = 10, W = 510, H = 266;
    var c = document.createElement('canvas'); c.width = W * olcek; c.height = H * olcek;
    var x = c.getContext('2d'); x.scale(olcek, olcek); x.translate(-X0, -Y0);
    svg.querySelectorAll('.wd-rail-line').forEach(function (l) {
      x.strokeStyle = l.classList.contains('is-plus') ? 'rgba(214,39,58,0.75)' : 'rgba(29,78,216,0.7)';
      x.lineWidth = 1.4; x.beginPath();
      x.moveTo(+l.getAttribute('x1'), +l.getAttribute('y1')); x.lineTo(+l.getAttribute('x2'), +l.getAttribute('y2')); x.stroke();
    });
    svg.querySelectorAll('.wd-rail-mark').forEach(function (t) {
      x.fillStyle = t.classList.contains('is-plus') ? '#D6273A' : '#1D4ED8';
      x.font = 'bold 11px Arial'; x.fillText(t.textContent, +t.getAttribute('x'), +t.getAttribute('y'));
    });
    /* Gerçek breadboard'daki baskı (Arda, 2026-10-05: "daha gerçekçi"): satır harfleri iki yanda
       (üst blok j..f, alt blok e..a — wiring-diagram.js ROW_UP/ROW_DOWN), sütun numaraları 1,5,10..30. */
    var satirlar = {}, sutunlar = {};
    svg.querySelectorAll('.wd-hole').forEach(function (h) {
      satirlar[+h.getAttribute('y') + 3] = 1; sutunlar[+h.getAttribute('x') + 3] = 1;
    });
    var ys = Object.keys(satirlar).map(Number).sort(function (a, b) { return a - b; });
    var xs = Object.keys(sutunlar).map(Number).sort(function (a, b) { return a - b; });
    x.fillStyle = 'rgba(110,98,84,0.75)'; x.font = '600 7px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (ys.length === 10 && xs.length) {
      'jihgfedcba'.split('').forEach(function (harf, i) {
        x.fillText(harf, xs[0] - 13, ys[i]); x.fillText(harf, xs[xs.length - 1] + 13, ys[i]);
      });
      xs.forEach(function (sx, i) {
        if (i !== 0 && (i + 1) % 5) return;
        x.fillText(String(i + 1), sx, ys[0] - 10); x.fillText(String(i + 1), sx, ys[9] + 10);
      });
    }
    /* Delik: kare huni (üst kenar ışığa bakar → açık, ön kenar gölgede → koyu), dipte koyu
       boşluk ve içerideki metal klipsin ince parıltısı. Aynı şekil kabartma haritasına
       çukur olarak çizilir (k): ışık değişince de delik içe göçük görünür. */
    var k = document.createElement('canvas'); k.width = c.width; k.height = c.height;
    var kx = k.getContext('2d'); kx.fillStyle = '#fff'; kx.fillRect(0, 0, k.width, k.height);
    kx.scale(olcek, olcek); kx.translate(-X0, -Y0);
    svg.querySelectorAll('.wd-hole, .wd-rail-hole').forEach(function (h) {
      var hx = +h.getAttribute('x') + 3, hy = +h.getAttribute('y') + 3;
      var g = x.createLinearGradient(0, hy - 3.6, 0, hy + 3.6);
      g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.5, 'rgba(150,135,115,0.35)'); g.addColorStop(1, 'rgba(90,75,60,0.45)');
      x.fillStyle = g; x.fillRect(hx - 3.6, hy - 3.6, 7.2, 7.2);
      x.fillStyle = '#1E1914'; x.fillRect(hx - 2.2, hy - 2.2, 4.4, 4.4);
      x.fillStyle = 'rgba(190,196,204,0.55)'; x.fillRect(hx - 1.5, hy - 1.9, 3.0, 0.7);   // klips
      x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(hx - 2.2, hy + 1.2, 4.4, 1.0);
      kx.fillStyle = '#9a9a9a'; kx.fillRect(hx - 3.4, hy - 3.4, 6.8, 6.8);
      kx.fillStyle = '#000'; kx.fillRect(hx - 2.2, hy - 2.2, 4.4, 4.4);
    });
    c.kabartma = k;
    return c;
  }

  // ---------------- kur ----------------
  function kur(stage) {
    var svg = stage && stage.querySelector('#wd-svg');
    if (!svg || !window.WiringDiagram || !(window.Hareket && Hareket.aktif) || !webglVar()) return;
    if ((kurulu && kurulu.svg === svg) || kuruluyor === svg) return;
    if (kurulu) kurulu.yoket();
    kuruluyor = svg;
    document.documentElement.classList.add('s3b-bekle');   // devre sonradan çizildiyse de SVG görünmesin

    var yukler = [];
    if (!window.THREE) yukler.push(yukle('assets/vendor/three.min.js'));
    Promise.all(yukler)
      .then(function () { return Promise.all([window.THREE.GLTFLoader ? 0 : yukle('assets/vendor/GLTFLoader.js'),
                                              window.SAHNE3B_GLB ? 0 : yukle('assets/3b/modeller.js'),
                                              window.MASA_DOKU ? 0 : yukle('assets/3b/masa-dokulari.js')]); })
      .then(function () {
        return Promise.all(['breadboard', 'deneyap-kart', 'laptop', 'fis', 'led', 'direnc', 'trafik', 'buton', 'direnc10k'].map(glb));
      })
      .then(function (m) {
        if (kuruluyor === svg) kuruluyor = null;
        if (!svg.isConnected) return;
        kurulu = sahneKur(stage, svg, { breadboard: m[0], kart: m[1], laptop: m[2], fis: m[3], led: m[4], direnc: m[5], trafik: m[6], buton: m[7], direnc10k: m[8] });
      })
      .catch(function (e) { kuruluyor = null; bekleBitti(); if (window.console) console.warn('Sahne3B kurulamadı:', e); });
  }

  function sahneKur(stage, svg, M) {
    /* r149'da renk yönetimi varsayılan "eski mod": koddan verilen #D6273A gibi
       renkler doğrusala çevrilmeden basılıyor, çıkışta ikinci kez açılıp
       yıkanıyordu (kırmızı kablo pembe, siyah gri). glTF renkleri zaten doğru. */
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    var tuval = renderer.domElement;
    tuval.className = 's3b-tuval';
    tuval.setAttribute('aria-hidden', 'true');
    stage.style.position = stage.style.position || 'relative';
    stage.appendChild(tuval);

    var sahne = new THREE.Scene();
    // Ortam yansıması (metaller için): sıcak atölye tonlu basit oda.
    var pm = new THREE.PMREMGenerator(renderer);
    var oda = new THREE.Scene();
    oda.add(new THREE.Mesh(new THREE.SphereGeometry(10, 16, 8), new THREE.MeshBasicMaterial({ color: 0xE8DCCB, side: THREE.BackSide })));
    [[0, 8, 0, 0xffffff, 6], [-6, 3, 4, 0xfff1dd, 4], [6, 3, -4, 0xdfe8ff, 3]].forEach(function (l) {
      var p = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(l[3]).multiplyScalar(l[4]) }));
      p.position.set(l[0], l[1], l[2]); p.lookAt(0, 0, 0); oda.add(p);
    });
    sahne.environment = pm.fromScene(oda, 0.04).texture;

    var hemi = new THREE.HemisphereLight(0xfff6ea, 0x8f7c66, 0.4); sahne.add(hemi);
    var gunes = new THREE.DirectionalLight(0xfff8ee, 1.75);
    gunes.position.set(-1.5, 7, 4.5); gunes.target.position.set(1.9, 0, 1.4);
    gunes.castShadow = true; gunes.shadow.mapSize.set(2048, 2048); gunes.shadow.radius = 5; gunes.shadow.bias = -0.0004;
    var sk = gunes.shadow.camera; sk.left = -5; sk.right = 5; sk.top = 4; sk.bottom = -4; sk.near = 1; sk.far = 16;
    sahne.add(gunes, gunes.target);
    /* LED ışıkları baştan sahnede (sönük): ışık sayısı değişince three.js BÜTÜN
       standart malzemelerin shader'ını yeniden derliyor — LED takıldığı karede
       sayfa ~1.2 sn donuyordu (ölçüldü, 2026-10-04, takma animasyonu kayıyordu). */
    var ledIsik = {};
    // Sahnedeki her LED parçası için (1.2: led · 1.4: led, led2 · 1.5: led-1…led-4).
    Array.prototype.map.call(svg.querySelectorAll('[id^="wd-part-led"]'), function (e) { return e.id.slice(8); }).forEach(function (ad) {
      var l = ledIsik[ad] = new THREE.PointLight(0xff3b26, 0, 1.4, 2);
      l.position.set(0, -5, 0); sahne.add(l);
    });

    // Masa: mağazadaki masa eşyasına göre renk.
    var masaMat = new THREE.MeshStandardMaterial({ color: 0xF6EFE4, roughness: 0.85 });
    var masa = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), masaMat);   // çevirince kenarı görünmesin
    sahne.fog = new THREE.Fog(0xF6EFE4, 16, 46);   // ufuk sise karışır; rengi masayla aynı (aşağıda)
    masa.rotation.x = -Math.PI / 2; masa.position.set(1.9, MASA_Y, 1.4); masa.receiveShadow = true;
    sahne.add(masa);
    /* Masa dokusu (Blender, blender/masa.py → assets/3b/masa-dokulari.js): kart sahnesiyle
       aynı (Arda, 2026-10-05: "mağazadaki eşyalar daha çok yerde"). Doku yoksa düz renk kalır. */
    var MASA_YUZEY = { varsayilan: [0.75, 0, 0], ahsap: [0.6, 0, 0], metal: [0.38, 0.65, 0], gece: [0.55, 0, 0.55],
      mat: [0.85, 0, 0], mermer: [0.22, 0, 0], uzay: [0.5, 0, 0.8] };
    var masaDokular = {};
    function masaDokuUygula(ad) {
      var y = MASA_YUZEY[ad] || MASA_YUZEY.varsayilan;
      masaMat.roughness = y[0]; masaMat.metalness = y[1];
      var uygula = function (t) {
        masaMat.map = t; masaMat.color.set(0xffffff);   // doku kendi rengini taşır
        masaMat.emissiveMap = y[2] ? t : null;
        masaMat.emissive = new THREE.Color(y[2] ? 0xffffff : 0x000000); masaMat.emissiveIntensity = y[2];
        masaMat.needsUpdate = true;
      };
      if (!window.MASA_DOKU || !MASA_DOKU[ad]) return false;
      if (masaDokular[ad]) { uygula(masaDokular[ad]); return true; }
      new THREE.TextureLoader().load(MASA_DOKU[ad], function (t) {
        t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
        t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.repeat.set(40, 40);
        masaDokular[ad] = t;
        if ((document.documentElement.getAttribute('data-masa') || 'varsayilan') === ad) uygula(t);
      });
      return true;
    }
    var MASA_RENK = { ahsap: 0xC99862, metal: 0x9AA3AD, gece: 0x1A2140, mat: 0x2E7D5B, mermer: 0xEDEAE4, uzay: 0x0B0E2A };

    function golgeli(o) { o.traverse(function (n) { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } }); return o; }

    // Breadboard (mutlak koordinat) + delik yüzü
    sahne.add(golgeli(M.breadboard));
    var yuz = new THREE.Mesh(new THREE.PlaneGeometry(5.10, 2.66),
      (function () {
        var c = breadboardYuzu(svg), t = new THREE.CanvasTexture(c);
        t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
        return new THREE.MeshStandardMaterial({ map: t, bumpMap: new THREE.CanvasTexture(c.kabartma), bumpScale: 0.6,
          transparent: true, roughness: 0.62 });
      })());
    yuz.rotation.x = -Math.PI / 2; yuz.position.set(2.95, 0.0015, 1.43); yuz.receiveShadow = true;
    sahne.add(yuz);

    // Kart: SVG'deki kart resminin matrisiyle, pin başlıklarının üstünde
    var kart = new THREE.Group(); kart.matrixAutoUpdate = false;
    kart.add(golgeli(M.kart));
    /* Bakır yollar (blender/deneyap.py) çift taraflı ince şerit: kendi üstüne gölge düşürmesin. */
    M.kart.traverse(function (n) { if (n.isMesh && /^yollar/.test(n.name)) { n.castShadow = false; n.material.side = THREE.FrontSide; } });
    /* Lehim maskesi: güçlü tepe ışığında pembeye kaçıyordu — gerçek kart koyu, doygun kırmızı. */
    var koyulasan = [];   // malzeme paylaşılıyor (viyalar + yollar aynı 'yol'): her biri TEK kez koyulaşsın
    M.kart.traverse(function (n) {
      if (n.isMesh && /^(pcb|yol)/.test(n.material.name) && koyulasan.indexOf(n.material) < 0) {
        koyulasan.push(n.material); n.material.color.multiplyScalar(0.78); n.material.envMapIntensity = 0.6;
      }
    });
    var baslik = new THREE.MeshStandardMaterial({ color: 0x1B1F24, roughness: 0.6 });
    /* Pin başlıkları: gerçeğindeki gibi pin başına bir siyah plastik blok (2.54 mm adım,
       aralarında ince yarık), her pedin altında. Pedler board-svg.js: sol 12 (y 100.7 + i·15.4),
       sağ 15 (y 54.5 + i·15.4), ped boyu 7 → merkez +3.5. */
    var blok = new THREE.BoxGeometry(0.13, KART_Y, 0.146);
    [[20.5, 100.7, 12], [151.5, 54.5, 15]].forEach(function (b) {
      for (var i = 0; i < b[2]; i++) {
        var h = new THREE.Mesh(blok, baslik);
        h.position.set(b[0] * S, -KART_Y / 2, (b[1] + 3.5 + i * 15.4) * S); h.castShadow = true; h.receiveShadow = true; kart.add(h);
      }
    });
    kartYazilari(function (c) {
      if (!c) return;
      var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
      var d = new THREE.Mesh(new THREE.PlaneGeometry(1.40, 2.68), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      d.rotation.x = -Math.PI / 2; d.position.set(0.86, 0.0032, 1.60); kart.add(d);
      // ESP32-S2 yazısı kalkanın üstündeki etikette (x51..117, y94.5..103.5)
      var g = new THREE.PlaneGeometry(0.66, 0.09), uv = g.attributes.uv;
      for (var i = 0; i < uv.count; i++) {
        uv.setXY(i, (51 - 16 + uv.getX(i) * 66) / 140, 1 - (94.5 - 26 + (1 - uv.getY(i)) * 9) / 268);
      }
      var e = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      e.rotation.x = -Math.PI / 2; e.position.set(0.84, 0.0595, 0.99); kart.add(e);
    });
    sahne.add(kart);

    // Laptop (mutlak), ekran tuvali
    var laptop = golgeli(M.laptop); laptop.position.y = MASA_Y; sahne.add(laptop);
    var ekranTuval = document.createElement('canvas'); ekranTuval.width = 512; ekranTuval.height = 320;
    var ekranDoku = new THREE.CanvasTexture(ekranTuval); ekranDoku.encoding = THREE.sRGBEncoding;
    ekranDoku.flipY = false;   // glTF UV'leri ters eksenli: yoksa başlık altta kalıyordu
    laptop.traverse(function (n) { if (n.isMesh && /ekran/.test(n.name)) n.material = new THREE.MeshBasicMaterial({ map: ekranDoku }); });

    // Fiş + Type-C kablo
    var fis = golgeli(M.fis); sahne.add(fis);
    var kabloMat = new THREE.MeshStandardMaterial({ color: 0xE9ECEF, roughness: 0.45 });
    var kablo = null, kabloEgri = null, kabloDurum = null;
    var veri = [0, 1, 2].map(function () {
      var v = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: 0x4DA3FF }));
      sahne.add(v); return v;
    });

    // Parçalar
    var bacakMat = new THREE.MeshStandardMaterial({ color: 0xD8DDE3, metalness: 1, roughness: 0.28 });
    var elektronMat = new THREE.MeshBasicMaterial({ color: 0xFFD23F });
    var parca = {};
    var parcaAdlari = Array.prototype.map.call(svg.querySelectorAll('[id^="wd-part-"]'), function (e) { return e.id.slice(8); });

    function tup(noktalar, r, mat) {
      var e = new THREE.CatmullRomCurve3(noktalar);
      var m = new THREE.Mesh(new THREE.TubeGeometry(e, Math.max(24, noktalar.length * 8), r, 10, false), mat);
      m.castShadow = true; m.userData.egri = e;
      return m;
    }
    function delikler(ad) { return (WiringDiagram.TAK_DELIK || {})[ad] || null; }

    function ledKur(ad) {
      var d = delikler(ad); if (!d) return null;
      var g = new THREE.Group();
      var govde = M.led.clone(true);
      var mat = null;
      govde.traverse(function (n) { if (n.isMesh) { mat = mat || n.material.clone(); n.material = mat; n.castShadow = true; } });
      // Blender'daki geçirgenlik three'de camsı, soluk pembe yapıyordu: dolu epoksi.
      mat.transmission = 0; mat.transparent = false; mat.opacity = 1; mat.roughness = 0.32; mat.envMapIntensity = 0.5;
      // Gerçek 5 mm LED: buzlu (dağıtıcı) epoksi + üstte parlak cila — sönükken koyu, cam gibi parlak yansıma.
      mat.clearcoat = 1; mat.clearcoatRoughness = 0.06;
      /* Trafik lambası modülünün LED'i (Ders 1.6): bacak yok, modülün kartına lehimli. Modelin
         yatık koordinatında (kubbe yukarı, LED'in yeri x MODUL_LED_X, y 231, kart yüzü z 6)
         kurulur, sonra modülle aynı dönüşle ayağa kalkar: kubbe çocuğa bakar. Işığı aşağıdaki
         ortak döngü yakar. */
      if (d[0][2] === 'modul') {
        var don = modulDonusu(); if (!don) return null;
        govde.scale.setScalar(0.6);
        govde.position.set(MODUL_LED_X[d[0][3]] * S, 6 * S, 231 * S);
        govde.updateMatrix(); govde.applyMatrix4(don);
        g.add(govde);
        var mIsik = ledIsik[ad];
        if (!mIsik) { mIsik = new THREE.PointLight(0xff3b26, 0, 1.4, 2); g.add(mIsik); }
        mIsik.position.copy(new THREE.Vector3(MODUL_LED_X[d[0][3]] * S, 40 * S, 231 * S).applyMatrix4(don));
        g.userData = { tur: 'led', mat: mat, isik: mIsik };
        return g;
      }
      var a = nokta(d[0][0], d[0][1]), k = nokta(d[1][0], d[1][1]);
      var orta = a.clone().add(k).multiplyScalar(0.5), yon = k.clone().sub(a).normalize();
      var H = 0.14;
      govde.position.copy(orta).setY(H);
      govde.rotation.y = -Math.atan2(yon.z, yon.x);   // flanşın düz kesiği (+x) katot deliğine baksın
      g.add(govde);
      // Uzun (+) bacak dizden kıvrılır, kısa (−) düz iner — gerçek LED gibi.
      g.add(tup([orta.clone().addScaledVector(yon, -0.06).setY(H), a.clone().setY(H * 0.55), a.clone().setY(0.02), a.clone().setY(-0.03)], 0.011, bacakMat));
      g.add(tup([orta.clone().addScaledVector(yon, 0.06).setY(H), k.clone().setY(H * 0.6), k.clone().setY(-0.03)], 0.011, bacakMat));
      // Işık grupta DEĞİL sahnede kalır: grup gizlenince (geri gidince) görünmez ışık
      // sayılmaz ve sayı yine değişirdi. Söndürmek için yalnız parlaklık sıfırlanır.
      var isik = ledIsik[ad];
      if (!isik) { isik = new THREE.PointLight(0xff3b26, 0, 1.4, 2); g.add(isik); }
      isik.position.copy(orta).setY(H + 0.3);
      g.userData = { tur: 'led', mat: mat, isik: isik };
      return g;
    }
    function direncKur(ad) {
      var d = delikler(ad); if (!d) return null;
      var g = new THREE.Group();
      var a = nokta(d[0][0], d[0][1]), b = nokta(d[1][0], d[1][1]);
      var orta = a.clone().add(b).multiplyScalar(0.5), yon = b.clone().sub(a).normalize(), H = 0.085;
      // Ders 3.1: 10K pull-down direnci kendi bantlarıyla (blender/buton.py).
      var govde = golgeli((ad === 'direnc-10k' && M.direnc10k ? M.direnc10k : M.direnc).clone(true));
      /* 1.5/1.6: − rayından j satırına, iki delik arası 0.24 — yatık direnç sığmaz. Gerçek
         kitlerdeki gibi DİK durur: gövde ray deliğinin üstünde ayakta, alt bacak dümdüz
         raya, üst bacak tepeden kıvrılıp öbür deliğe iner. */
      if (a.distanceTo(b) < 0.3) {
        var o = 0.7, yr = 0.19 * o, alt = 0.06, cy = alt + yr, tepe = cy + yr;
        govde.scale.setScalar(o);
        govde.rotation.set(0, 0, Math.PI / 2);   // modelin ekseni yerel x → dikey
        govde.position.copy(a).setY(cy);
        g.add(govde);
        g.add(tup([a.clone().setY(alt + 0.01), a.clone().setY(alt * 0.5), a.clone().setY(-0.03)], 0.009, bacakMat));
        g.add(tup([a.clone().setY(tepe - 0.01), a.clone().setY(tepe + 0.05), a.clone().lerp(b, 0.5).setY(tepe + 0.08),
                   b.clone().setY(tepe + 0.03), b.clone().setY(tepe * 0.5), b.clone().setY(-0.03)], 0.009, bacakMat));
        g.userData = { tur: 'direnc' };
        return g;
      }
      /* Gövde 0.38 birim (blender/parca3b.py). Kısa aralıkta gövde sığacak kadar küçülür,
         bacaklar geriye kıvrılmasın. */
      var olcek = Math.min(1, (a.distanceTo(b) - 0.06) / 0.38), yari = 0.19 * olcek;
      govde.scale.setScalar(olcek);
      govde.position.copy(orta).setY(H);
      govde.rotation.y = -Math.atan2(yon.z, yon.x);
      g.add(govde);
      [[a, -1], [b, 1]].forEach(function (u) {
        var uc = orta.clone().addScaledVector(yon, u[1] * yari).setY(H);
        g.add(tup([uc, u[0].clone().setY(H), u[0].clone().setY(H * 0.4), u[0].clone().setY(-0.03)], 0.009, bacakMat));
      });
      g.userData = { tur: 'direnc' };
      return g;
    }
    /* Trafik lambası modülü (Ders 1.6): Blender modeli (blender/trafik-modul.py) yatık çizildi,
       pinleri +x, şemanın ~0.6 katı. 2026-10-07'den beri breadboard'a takılı (Arda: "trafik
       ışığını breadboard'a tak"): yatay başlıkla takılınca modül DİK durur. Dönüş 2B görselle
       (DIK=1) aynı: pin yönü aşağı, ön yüz çocuğa (+z), R tarafı sağa; pin adımı breadboard'unkine
       büyür (gerçek boy). GND pininin başlık altı TAK_DELIK.modul[0] deliğine oturur. */
    var MODUL_PIN_Y = [217.1, 226.4, 235.6, 244.9], MODUL_LED_X = [-138, -90, -42];
    var MODUL_K = 15.4 / ((MODUL_PIN_Y[3] - MODUL_PIN_Y[0]) / 3);
    function modulDonusu() {
      var d = delikler('modul'); if (!d) return null;
      var R = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0));
      var m = R.multiply(new THREE.Matrix4().makeScale(MODUL_K, MODUL_K, MODUL_K));
      var p0 = new THREE.Vector3(21 * S, 9.5 * S, MODUL_PIN_Y[3] * S).applyMatrix4(m);   // GND pini, başlığın altı
      return new THREE.Matrix4().makeTranslation(d[0][0] * S - p0.x, -p0.y, d[0][1] * S - p0.z).multiply(m);
    }
    function modulKur() {
      var don = modulDonusu(); if (!M.trafik || !don) return null;
      var g = new THREE.Group();
      var m = golgeli(M.trafik.clone(true));
      m.applyMatrix4(don);
      g.add(m);
      g.userData = { tur: 'modul' };
      return g;
    }
    /* Ders 3.1 butonu (blender/buton.py): kanalın üstünde, dört bacak deliklerde. Kapak ayrı
       obje: 2B'de .is-basili olunca aşağı iner. */
    function butonKur() {
      var d = delikler('buton'); if (!d || !M.buton) return null;
      var g = new THREE.Group();
      var m = golgeli(M.buton.clone(true));
      m.position.copy(nokta((d[0][0] + d[1][0]) / 2, (d[0][1] + d[1][1]) / 2, 0.02));
      g.add(m);
      var kapak = null;
      m.traverse(function (n) { if (!kapak && /buton_kapak/.test(n.name)) kapak = n; });
      g.userData = { tur: 'buton', kapak: kapak, kapakY: kapak ? kapak.position.y : 0 };
      return g;
    }
    function jumperKur(el, ad) {
      var yol = el.querySelector('.wd-wire'); if (!yol) return null;
      var d = delikler(ad);
      var mat = svgMatris(svg, yol), L = yol.getTotalLength(), N = 28, n = [];
      for (var i = 0; i <= N; i++) {
        var p = yol.getPointAtLength(L * i / N), q = new DOMPoint(p.x, p.y).matrixTransform(mat);
        var t = i / N, h = 0.03 + 0.2 * Math.pow(Math.sin(Math.PI * t), 0.6);
        n.push(nokta(q.x, q.y, h));
      }
      /* Uçlar Dupont başlığı (Arda, 2026-10-05: "daha gerçekçi"): kare siyah plastik gövde,
         altından deliğe giren metal iğne; tel gövdenin TEPESİNDEN dikey çıkıp kavis yapar. */
      var GOVDE_UST = 0.27;
      if (d) {
        n[0] = nokta(d[0][0], d[0][1], GOVDE_UST);
        n[1].y = Math.max(n[1].y, GOVDE_UST + 0.08);
        for (var j = 2; j < N - 1; j++) n[j].y += GOVDE_UST - 0.03;
        n[N] = nokta(d[1][0], d[1][1], GOVDE_UST);
        n[N - 1].y = Math.max(n[N - 1].y, GOVDE_UST + 0.08);
        n.splice(1, 0, n[0].clone().setY(GOVDE_UST + 0.06));
        n.splice(n.length - 1, 0, n[n.length - 1].clone().setY(GOVDE_UST + 0.06));
      }
      // Ortam yansıması açık renge çekiyordu (kırmızı pembe, siyah gri): yansıma kısık, mat plastik.
      var cMat = new THREE.MeshStandardMaterial({ color: renk(yol.getAttribute('stroke'), '#D6273A'), roughness: 0.55, envMapIntensity: 0.25 });
      var g = new THREE.Group();
      var t = tup(n, 0.02, cMat); g.add(t);
      var ucMat = new THREE.MeshStandardMaterial({ color: 0x15171B, roughness: 0.42 });
      var ignMat = new THREE.MeshStandardMaterial({ color: 0xD9DEE4, metalness: 1, roughness: 0.25 });
      [n[0], n[n.length - 1]].forEach(function (p) {
        if (!d) return;
        var u = new THREE.Mesh(new THREE.BoxGeometry(0.1, GOVDE_UST - 0.02, 0.1), ucMat);
        u.position.copy(p).setY(0.02 + (GOVDE_UST - 0.02) / 2); u.castShadow = true; g.add(u);
        var boyun = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.05, 10), ucMat);   // telin girdiği kılıf ağzı
        boyun.position.copy(p).setY(GOVDE_UST + 0.02); g.add(boyun);
        var ig = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.08, 0.018), ignMat);
        ig.position.copy(p).setY(-0.01); g.add(ig);
      });
      var el3 = [0, 1].map(function () { var s = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), elektronMat); g.add(s); return s; });
      g.userData = { tur: 'jumper', tup: t, egri: t.userData.egri, elektron: el3, toplam: t.geometry.index.count };
      t.geometry.setDrawRange(0, 0);
      return g;
    }

    /* Kamera SABİT (Arda, 2026-10-04: "devreyi de hareket ettir butonu olsun, istediğim gibi
       hareket ettireyim"). Eskiden fare sahnenin üstünde gezince kendiliğinden biraz eğiliyordu;
       artık yalnız "Hareket ettir" açıkken sürükleyerek çevrilir, "Sabitle" ilk açıya döndürür.
       Düğme ve ipucu kart sahnesindekiyle aynı (hareket.css .ks3b-*). */
    var kamera = new THREE.PerspectiveCamera(32, 2, 0.1, 60);
    var HEDEF = new THREE.Vector3(1.9, 0, 1.52), ACI0 = THREE.MathUtils.degToRad(40);
    /* Trafik lambası modülü breadboard'da dik (~3.1 birim boy, gerçek ölçü): tam görünümde
       tepesi kadraja girsin diye kamera daha yukarıdan bakar (dik nesne kısalır), hedef
       modüle doğru kayar, biraz geri çekilir. Diğer derslerde aynı. */
    var MODUL_DIK = parcaAdlari.indexOf('modul') >= 0, UZAK_KAT = MODUL_DIK ? 1.55 : 1;
    if (MODUL_DIK) { HEDEF.set(2.2, 0.75, 1.15); ACI0 = THREE.MathUtils.degToRad(57); }
    var hareket = { acik: false, yon: 0, egim: 0, surukle: null };
    var dugme = document.createElement('button');
    dugme.type = 'button'; dugme.className = 'ks3b-hareket s3b-hareket';
    var ipucu = document.createElement('p'); ipucu.className = 'ks3b-ipucu'; ipucu.hidden = true;
    ipucu.textContent = 'Sürükle: çevir · Tekerlek ya da iki parmak: yaklaş';
    ipucu.style.zIndex = 9;   // tuval hareketliyken 5'te; ipucu üstünde kalsın
    ipucu.style.color = '#fff';   // devre sahnesinin p rengi (kahve) ezmesin — ölçüldü: rgb(92,75,58)
    stage.appendChild(dugme); stage.appendChild(ipucu);
    function dugmeYaz() {
      dugme.innerHTML = hareket.acik
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V7a5 5 0 0 1 10 0v4"/><rect x="5" y="11" width="14" height="10" rx="2"/></svg>Sabitle'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>Hareket ettir';
      dugme.setAttribute('aria-pressed', String(hareket.acik));
      dugme.setAttribute('aria-label', hareket.acik ? 'Devreyi sabitle' : 'Devreyi hareket ettir: sürükleyerek çevir');
      stage.classList.toggle('s3b-hareketli', hareket.acik);
      ipucu.hidden = !hareket.acik;
    }
    dugme.addEventListener('click', function () { hareket.acik = !hareket.acik; dugmeYaz(); });
    dugmeYaz();
    /* Eğim sınırı açıya göre (Arda, 2026-10-07: "hareket ettirirken kamera bir anda ters yere
       kayıyor"): ACI0 + egim 90°'yi geçerse kamera tepeden aşıyor, lookAt görüntüyü ters
       çeviriyordu. 1.6'da ACI0 57° iken eski sabit 0.75 sınırı 100°'ye çıkarıyordu. Tavan 85°. */
    var EGIM_UST = THREE.MathUtils.degToRad(85) - ACI0;
    function sinirla() {
      hareket.yon = Math.max(-1.4, Math.min(1.4, hareket.yon));
      hareket.egim = Math.max(-0.45, Math.min(Math.min(0.75, EGIM_UST), hareket.egim));
    }
    tuval.addEventListener('pointerdown', function (e) {
      if (!hareket.acik) return;
      hareket.surukle = { id: e.pointerId, x: e.clientX, y: e.clientY, yon: hareket.yon, egim: hareket.egim };
      try { tuval.setPointerCapture(e.pointerId); } catch (er) {}
    });
    tuval.addEventListener('pointermove', function (e) {
      var s = hareket.surukle; if (!s || !hareket.acik) return;
      /* Bırakma kaçırıldıysa (tuval dışında bırakıldı, yakalama düştü) sürükleme takılı
         kalıyor, fare basılı değilken her kıpırtı kamerayı çeviriyordu: tuş basılı değilse bitir. */
      if (e.pointerType === 'mouse' && !(e.buttons & 1)) { birakSurukle(); return; }
      if (e.pointerId !== s.id) return;   // ikinci parmak sürüklemeyi zıplatmasın
      hareket.yon = s.yon - (e.clientX - s.x) * 0.01; hareket.egim = s.egim + (e.clientY - s.y) * 0.007; sinirla();
    });
    function birakSurukle() { hareket.surukle = null; }
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { tuval.addEventListener(t, birakSurukle); });
    dugme.addEventListener('keydown', function (e) {
      if (!hareket.acik) return;
      var d = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08] }[e.key];
      if (!d) return;
      e.preventDefault(); hareket.yon += d[0]; hareket.egim += d[1]; sinirla();
    });

    function kameraKonumla() {
      var r = svg.getBoundingClientRect();
      var w = Math.max(1, r.width), h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      tuval.style.width = w + 'px'; tuval.style.height = h + 'px';
      var s = stage.getBoundingClientRect();
      var sol = r.left - s.left + stage.scrollLeft, ust = r.top - s.top + stage.scrollTop;
      tuval.style.left = sol + 'px'; tuval.style.top = ust + 'px';
      // Düğme sahnenin (tuvalin) sağ üst köşesinde, ipucu alt ortasında.
      dugme.style.top = (ust + 10) + 'px'; dugme.style.right = Math.max(10, s.width - (sol + w) + 10) + 'px';
      ipucu.style.left = (sol + w / 2) + 'px'; ipucu.style.top = (ust + h - 40) + 'px'; ipucu.style.bottom = 'auto';
      kamera.aspect = w / h;
      // 7.6 birim genişliği görünür kılacak uzaklık
      var yatayFov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2) * kamera.aspect);
      var uzak = UZAK_KAT * 4.05 / Math.tan(yatayFov / 2);   // sağ ön köşe kesilmesin (perspektifte ön taraf geniş)
      kamera.userData.uzak = uzak;
      kamera.updateProjectionMatrix();
    }
    /* Yakınlaştırma (Arda, 2026-10-05: "3B devre kurulumunda zoom atılsın"): rehber açıkken
       ("Taktım" görünürken) kamera o an takılan parçanın iki deliğine yaklaşır; devre bitince
       ya da rehber kapalıyken bütün tezgaha geri açılır. Hareket ettir açıkken tekerlek/kıstırma
       ile de yaklaşılır (yakin: 1 = tam görünüm). */
    var odak = { hedef: HEDEF.clone(), uzak: 0, yakin: 1 };
    var doneDugme = (stage.closest('.wd-root') || document).querySelector('#wd-done');
    function odakHesapla() {
      var tam = kamera.userData.uzak || 12, h = HEDEF, u = tam;
      /* Bir adımda birden çok parça açılabiliyor (1.5: dört LED tek adım): hepsinin
         deliklerini kapsayan kutuya bakılır. */
      var noktalar = [];
      if (doneDugme && !doneDugme.hidden) {
        svg.querySelectorAll('[id^="wd-part-"].is-active').forEach(function (e) {
          (delikler(e.id.replace('wd-part-', '')) || []).forEach(function (p) { noktalar.push(nokta(p[0], p[1])); });
        });
      }
      if (noktalar.length) {
        var kutuA = new THREE.Box3().setFromPoints(noktalar);
        h = kutuA.getCenter(new THREE.Vector3());
        var yaricap = kutuA.getSize(new THREE.Vector3()).length() / 2;
        var yatayFov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2) * kamera.aspect);
        // Deliklerin yayıldığı alan + her yanda pay: kısa parçada (LED) çok dibe girmesin.
        u = Math.min(tam, Math.max(2.4, (yaricap + 1.1) / Math.tan(yatayFov / 2)));
      }
      // Kare hızından bağımsız (~0.6 sn'de varır): yavaş makinede de kamera hedefte durur.
      var simdi = performance.now(), k = 1 - Math.exp(-Math.min(100, simdi - (odak.son || simdi)) / 180);
      odak.son = simdi;
      if (!hareket.acik) odak.yakin += (1 - odak.yakin) * k;
      if (!odak.uzak) odak.uzak = u;
      odak.hedef.lerp(h, k);
      odak.uzak += ((u * odak.yakin) - odak.uzak) * k;
    }
    tuval.addEventListener('wheel', function (e) {
      if (!hareket.acik) return;
      e.preventDefault();
      odak.yakin = Math.max(0.35, Math.min(1.25, odak.yakin * Math.exp(e.deltaY * 0.0012)));
    }, { passive: false });
    var dokunus = {}, kistirBas = null;   // iki parmak: aradaki mesafe değişimi = yaklaş/uzaklaş
    function kistirma() {
      var p = Object.keys(dokunus).map(function (k) { return dokunus[k]; });
      return p.length === 2 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0;
    }
    tuval.addEventListener('pointerdown', function (e) {
      dokunus[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (kistirma()) { hareket.surukle = null; kistirBas = { d: kistirma(), yakin: odak.yakin }; }
    });
    tuval.addEventListener('pointermove', function (e) {
      if (!dokunus[e.pointerId]) return;
      dokunus[e.pointerId] = { x: e.clientX, y: e.clientY };
      var d = kistirma();
      if (kistirBas && d && hareket.acik) { hareket.surukle = null; odak.yakin = Math.max(0.35, Math.min(1.25, kistirBas.yakin * kistirBas.d / d)); }
    });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      tuval.addEventListener(t, function (e) { delete dokunus[e.pointerId]; kistirBas = null; });
    });
    function kameraYerlestir() {
      if (!hareket.acik && !hareket.surukle) { hareket.yon *= 0.9; hareket.egim *= 0.9; }   // Sabitle: yavaşça ilk açıya
      odakHesapla();
      var u = odak.uzak, aci = ACI0 + hareket.egim, yon = hareket.yon, H = odak.hedef;
      kamera.position.set(H.x + Math.sin(yon) * Math.cos(aci) * u, H.y + Math.sin(aci) * u,
                          H.z + Math.cos(yon) * Math.cos(aci) * u);
      kamera.lookAt(H);
    }
    kameraKonumla();

    svg.classList.add('s3b-gizli');   // SVG yerinde, görünmez (wiring-diagram.css)
    stage.classList.add('s3b-acik');
    bekleBitti();

    // ---------------- her kare: SVG'yi oku, 3B'yi güncelle ----------------
    var basla = performance.now(), sonCizim = 0, sonEkran = 0, gorunur = true, rafId = 0, calisiyor = true, masaSon = null;
    var io = window.IntersectionObserver ? new IntersectionObserver(function (e) { gorunur = e[0].isIntersecting; }) : null;
    if (io) io.observe(stage);
    var ro = window.ResizeObserver ? new ResizeObserver(kameraKonumla) : null;
    if (ro) ro.observe(stage);

    function kartGuncelle() {
      var img = svg.querySelector('#wd-board image.bsvg-render');
      if (!img) return null;
      var m = svgMatris(svg, img);
      kart.matrix.copy(matris4(m)); kart.matrix.elements[13] = KART_Y; kart.matrixWorldNeedsUpdate = true;
      return m;
    }

    function fisGuncelle(km, zaman) {
      if (!km) return;
      var takili = !svg.classList.contains('is-unplugged');
      // Soket ağzı: kart yerelinde USB'nin üst kenarının ortası (86, 18); dışarı yönü yerel -y.
      var agiz = new DOMPoint(86, 20).matrixTransform(km), ic = new DOMPoint(86, 40).matrixTransform(km);
      var dis = new THREE.Vector3((agiz.x - ic.x), 0, (agiz.y - ic.y)).normalize();
      // Soketin merkezi kartta 3.25 birim yüksekte; fiş modelinin merkezi kendi tabanının 6 birim üstünde.
      var hedefUc = nokta(agiz.x, agiz.y, KART_Y + 0.0325 - 0.06).addScaledVector(dis, takili ? 0.02 : 0.34);
      var fu = fis.userData;
      if (!fu.uc) { fu.uc = hedefUc.clone(); }
      fu.uc.lerp(hedefUc, 0.12);
      fis.position.copy(fu.uc);
      fis.rotation.set(0, Math.atan2(dis.z, -dis.x) , 0);
      // Kablo: laptopun sağındaki porttan masaya sarkar, fişin arkasına girer.
      var arka = fu.uc.clone().addScaledVector(dis, 0.5);
      var durum = takili + '|' + arka.x.toFixed(3) + arka.z.toFixed(3);
      if (durum !== kabloDurum) {
        kabloDurum = durum;
        if (kablo) { sahne.remove(kablo); kablo.geometry.dispose(); }
        var port = new THREE.Vector3(-0.405, MASA_Y + 0.03, 1.50);
        var orta = port.clone().lerp(arka, 0.5);
        kablo = tup([port, port.clone().add(new THREE.Vector3(0.18, -0.01, 0.06)), new THREE.Vector3(orta.x, MASA_Y + 0.022, orta.z + 0.35),
                     arka.clone().addScaledVector(dis, 0.28).setY(MASA_Y + 0.04), arka.clone().addScaledVector(dis, 0.06), arka], 0.021, kabloMat);
        kablo.receiveShadow = true;
        kabloEgri = kablo.userData.egri;
        sahne.add(kablo);
      }
      veri.forEach(function (v, i) {
        v.visible = takili && !!kabloEgri;
        if (v.visible) v.position.copy(kabloEgri.getPointAt(dongu(1 - (zaman / 1900 + i / 3))));
      });
    }

    function parcaGuncelle(zaman, canli) {
      parcaAdlari.forEach(function (ad) {
        var el = svg.querySelector('#wd-part-' + ad);
        var p = parca[ad];
        var gorun = !!el && !el.classList.contains('is-ghost') && getComputedStyle(el).display !== 'none';
        if (gorun && !p) {
          var o = /^led/.test(ad) ? ledKur(ad) : /^(resistor|direnc)/.test(ad) ? direncKur(ad) : ad === 'modul' ? modulKur() : ad === 'buton' ? butonKur() : jumperKur(el, ad);
          if (!o) return;
          p = parca[ad] = { o: o, bas: zaman };
          sahne.add(o);
        }
        if (!p) return;
        p.o.visible = gorun;
        if (!gorun) { if (p.o.userData.isik) p.o.userData.isik.intensity = 0; p.bas = null; return; }
        if (p.bas == null) p.bas = zaman;
        var t = Math.min(1, (zaman - p.bas) / 520), u = p.o.userData;
        if (u.tur === 'jumper') {
          u.tup.geometry.setDrawRange(0, Math.floor(u.toplam * yumusak(Math.min(1, (zaman - p.bas) / 650)) / 3) * 3);
          var akim = canli && t >= 1;
          u.elektron.forEach(function (e, i) {
            e.visible = akim;
            if (akim) e.position.copy(u.egri.getPointAt(dongu(zaman / 1600 + i / 2)));
          });
        } else {
          p.o.position.y = (1 - yay(t)) * 0.9;     // yukarıdan düşer, deliğe oturur, sekme
        }
        if (u.tur === 'buton' && u.kapak) {
          u.kapak.position.y = u.kapakY - (el.classList.contains('is-basili') ? 0.05 : 0);
        }
        if (u.tur === 'led') {
          var glow = el.querySelector('.wd-led-glow'), bulb = el.querySelector('.wd-led-bulb');
          var g, r;
          if (el.classList.contains('wd-led-sira')) {
            /* LED sırası (1.5+): durum doğrudan .is-yanik sınıfından, renk değişkenlerden. Parlama
               katmanı Hareket açıkken ~1 sn yumuşuyordu; 3B LED bir adım geriden geliyordu
               (Ders 3.1'de buton basılıyken sönük, bırakınca yanık görünüyordu). */
            var yanik = el.classList.contains('is-yanik'), cs = getComputedStyle(el);
            g = yanik ? 1 : 0;
            r = renk(cs.getPropertyValue(yanik ? '--sira-yanik' : '--sira-kapali').trim() ||
                     (bulb ? getComputedStyle(bulb).fill : ''), '#FF3B26');
          } else {
            g = glow ? parseFloat(getComputedStyle(glow).opacity) || 0 : 0;
            r = renk(bulb ? getComputedStyle(bulb).fill : '', '#FF3B26');
          }
          u.mat.color.copy(r).multiplyScalar(0.55 + 0.45 * g);   // sönük LED koyu kırmızı, yanınca açılır
          u.mat.emissive = u.mat.emissive || new THREE.Color();
          u.mat.emissive.copy(r); u.mat.emissiveIntensity = 0.06 + g * 2.2;
          u.isik.color.copy(r); u.isik.intensity = g * 2.4;
          // Gökkuşağı RGB LED: renk SVG'de hue-rotate süzgeciyle dönüyor, burada tonu kaydır.
          if (document.documentElement.hasAttribute('data-led-rgb') && ad === 'led') {
            u.mat.color.offsetHSL(((zaman / 3000) % 1), 0, 0); u.mat.emissive.copy(u.mat.color); u.isik.color.copy(u.mat.color);
          }
        }
      });
    }

    function kare(zaman) {
      if (!calisiyor) return;
      rafId = requestAnimationFrame(kare);
      if (!gorunur || document.hidden || !svg.isConnected) return;
      /* En çok 30 kare/sn (sürüklerken 60): sahne çoğu an durgun, 60'ta çizmek okul
         dizüstülerinde fanı ve pili yoruyordu. Hareketler zamana bağlı, akıcılık bozulmaz. */
      if (!hareket.surukle && zaman - sonCizim < 30) return;
      sonCizim = zaman;
      // İlk karenin zaman damgası kurulumdan biraz geride kalabiliyor: negatif olmasın.
      var z = Math.max(0, zaman - basla);
      var canli = svg.classList.contains('is-live') || svg.classList.contains('is-live1');
      var km = kartGuncelle();
      fisGuncelle(km, z);
      parcaGuncelle(z, canli);
      yuz.material.opacity = svg.classList.contains('is-xray') ? 0.35 : 1;
      M.breadboard.traverse(function (n) {
        if (n.isMesh) { n.material.transparent = true; n.material.opacity = svg.classList.contains('is-xray') ? 0.35 : 1; }
      });
      var ms = document.documentElement.getAttribute('data-masa') || '';
      if (ms !== masaSon) {
        masaSon = ms;
        sahne.fog.color.set(MASA_RENK[ms] || 0xF6EFE4);   // ufuk: masanın ortalama rengi
        if (!masaDokuUygula(ms || 'varsayilan')) { masaMat.map = null; masaMat.emissiveMap = null; masaMat.color.set(MASA_RENK[ms] || 0xF6EFE4); masaMat.needsUpdate = true; }
      }
      if (z - sonEkran > 120) { sonEkran = z; ekranCiz(ekranTuval, z); ekranDoku.needsUpdate = true; }
      kameraYerlestir();
      renderer.render(sahne, kamera);
    }
    rafId = requestAnimationFrame(kare);

    function yoket() {
      calisiyor = false; cancelAnimationFrame(rafId);
      if (io) io.disconnect(); if (ro) ro.disconnect();
      svg.classList.remove('s3b-gizli'); stage.classList.remove('s3b-acik', 's3b-hareketli');
      tuval.remove(); dugme.remove(); ipucu.remove(); renderer.dispose();
      kurulu = null;
    }
    return { stage: stage, svg: svg, yoket: yoket, renderer: renderer, hareket: hareket };
  }

  /* Sahne sonradan çiziliyor (WiringDiagram.mount); #wd-svg gelince kur. */
  function izle() {
    var bul = function () { var st = document.getElementById('wd-stage'); if (st) kur(st); };
    bul();
    if (window.MutationObserver) {
      new MutationObserver(function () {
        var svg = document.getElementById('wd-svg');
        if (svg && (!kurulu || kurulu.svg !== svg)) bul();
      }).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', izle); else izle();

  /* Yenilerken eski SVG devre görünmesin (kart-sahne3b.js ile aynı): 3B yüklenene
     kadar SVG gizli, yerinde breadboard'un Blender render'ı; kurulamazsa SVG'ye düş. */
  function bekleBitti() { document.documentElement.classList.remove('s3b-bekle'); }
  if (window.Hareket && Hareket.aktif && webglVar()) {
    document.documentElement.classList.add('s3b-bekle');
    setTimeout(bekleBitti, 8000);
  }

  /* bilgi(): son karede çizilen üçgen/çağrı sayısı (test için: tuval boş mu). */
  return { kur: kur, get kurulu() { return !!kurulu; },
    bilgi: function () {
      return kurulu ? { ucgen: kurulu.renderer.info.render.triangles, cagri: kurulu.renderer.info.render.calls,
        hareket: kurulu.hareket.acik, yon: +kurulu.hareket.yon.toFixed(3), egim: +kurulu.hareket.egim.toFixed(3) } : null;
    } };
})();
