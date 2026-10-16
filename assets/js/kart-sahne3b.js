/* ============================================================
   KART SAHNESİ 3B — Ders 1.1 / 1.3 sol paneli (2026-10-04)
   ============================================================
   Arda: "3B olacak ama hareket etmeyecek, Blender ile; 3B çevir olmasın,
   hareket ettir butonu olsun, o zaman hareket ettirebilsin." Efektler:
   LED parlaması, ekran parıltısı, masa yüzeyi, kenar ışığı — hepsi.

   3B AYNA (sahne3b.js ile aynı yöntem): #simulationBox'taki SVG katmanları
   (#layer-kart, -kablo, -plug, -laptop) DOM'da kalır ve dersin tek doğru
   kaynağıdır — adım (.usb-ready / .connected), LED ritmi (#layer-led,
   #layer-glow), tezgah eşyaları (data-masa, --lt-ekran). Bu katman üstlerine
   bir <canvas> koyar, her karede okur ve aynısını 3B çizer; SVG görünmez
   olur ama yerinde kalır.
     - Modeller Blender'dan (blender/parca3b.py, deneyap.py → assets/3b/
       modeller.js), masa dokuları Blender'dan (blender/masa.py →
       assets/3b/masa-dokulari.js). Hepsi data:/base64 (file:// kuralı).
     - Kamera SABİT. "Hareket ettir" düğmesi açılınca çocuk sürükleyerek
       çevirir; kapatınca sahne yavaşça ilk açısına döner.
     - Işık sayısı baştan sabit (LED, GÜÇ, ekran ışıkları sönük başlar):
       sayı değişince three.js bütün shader'ları yeniden derliyor, sayfa
       donuyordu (sahne3b.js'te ölçüldü, 2026-10-04).
   Kurulmaz (SVG görünür kalır): WebGL yoksa ya da Hareket kapalıysa
   (otomasyon, "hareketi azalt").
   ============================================================ */
window.KartSahne3B = (function () {
  'use strict';
  var S = 0.01;
  var KART_Y = 0.07;                         // kart pin başlıklarının üstünde, masa y=0
  /* Parça yerleri TEK kaynaktan: BoardSVG.KONUM (board-svg.js, kart render'ıyla aynı; bu dosyadan
     önce yüklenir). 2026-10-14: kart gerçek Mini v2 yerleşimine geçti — dahili LED ortadaki beyaz
     RGB LED, GÜÇ LED'i port ucunda. Yedek değerler yalnız board-svg.js yüklenmemişse. */
  var KONUM = (window.BoardSVG && BoardSVG.KONUM) ||
    { led: [86, 153.6], guc: [70.7, 73.4], usb: { agiz: [86, 17] }, cip: { x: 73.4, y: 199.2, w: 42.4, h: 42.4 } };
  var LED = KONUM.led, PWR = KONUM.guc;
  var USB = KONUM.usb.agiz;                  // Type-C soketinin ağzı
  var kurulu = null;
  var kartFoto = null;                       // galerideki kart için 3B ürün fotoğrafı (data:)
  function galeriDegistir() {
    if (!kartFoto) return;
    document.querySelectorAll('svg.pg-board').forEach(function (svg) {
      var img = new Image();
      img.className = 'pg-board pg-board-3b'; img.src = kartFoto; img.width = 152; img.height = 300;
      img.alt = svg.getAttribute('aria-label') || 'Deneyap Mini v2 kartı';
      svg.replaceWith(img);
    });
  }

  // ---------------- yardımcılar ----------------
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
  var sozler = {};
  function yukle(src) {
    if (!sozler[src]) sozler[src] = new Promise(function (ok, hata) {
      var s = document.createElement('script'); s.src = src;
      s.onload = ok; s.onerror = hata; document.head.appendChild(s);
    });
    return sozler[src];
  }
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
  function yay(t) { var s = 1.70158 * 1.2; t -= 1; return t * t * ((s + 1) * t + s) + 1; }    // outBack
  function yumusak(t) { return 1 - Math.pow(1 - t, 3); }
  function dongu(x) { return ((x % 1) + 1) % 1; }
  function V(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* Yumuşak ışıma lekesi (LED, GÜÇ, ekran): beyaz merkez → saydam kenar; renk malzemeden. */
  var lekeDoku = null;
  function leke() {
    if (lekeDoku) return lekeDoku;
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.22, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    lekeDoku = new THREE.CanvasTexture(c);
    return lekeDoku;
  }
  function isima(boyut, normal) {
    // Toplamalı karışım kırmızı kartın üstünde maviyi pembe-beyaza çeviriyordu: mavi LED normal karışımla.
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: leke(), blending: normal ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false, transparent: true, opacity: 0, toneMapped: false }));
    s.scale.set(boyut, boyut, 1);
    return s;
  }

  /* Laptop ekranı: Arduino IDE penceresi, mağazadaki ekran temasının renkleri,
     üstünden geçen yumuşak bir parıltı bandı (ekran parıltısı). */
  function ekranCiz(tuval, zaman) {
    var x = tuval.getContext('2d'), W = tuval.width, H = tuval.height;
    var zemin = cssVar('--lt-ekran', '#0b1220'), vurgu = cssVar('--lt-vurgu', '#6FB7FF');
    x.fillStyle = zemin; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(0, 0, W, 34);
    [['#ef4444', 18], ['#f59e0b', 36], ['#22c55e', 54]].forEach(function (d) {
      x.fillStyle = d[0]; x.beginPath(); x.arc(d[1], 17, 6, 0, 7); x.fill();
    });
    x.fillStyle = vurgu; x.font = 'bold 34px Arial, sans-serif'; x.textAlign = 'center';
    x.fillText('DENEYAP ATÖLYEM', W / 2, H * 0.52);
    x.fillStyle = 'rgba(166,149,126,0.9)'; x.font = '18px Arial, sans-serif';
    x.fillText('Arduino IDE 2.3.10', W / 2, H * 0.52 + 30);
    var satir = [['#7FB4FF', 0.2], ['#E5C07B', 0.3], ['#98C379', 0.14]];
    var canli = document.documentElement.hasAttribute('data-ekran-canli');
    satir.forEach(function (s, i) {
      var k = canli ? Math.min(1, Math.max(0.05, ((zaman / 350) % 10) - i * 0.9) / 3) : 1;
      x.globalAlpha = 0.6; x.fillStyle = canli ? vurgu : s[0];
      x.fillRect(30, 56 + i * 22, W * s[1] * k, 9);
      x.fillRect(W - 30 - W * s[1] * 0.8 * k, 56 + i * 22, W * s[1] * 0.8 * k, 9);
    });
    x.globalAlpha = 1;
    x.fillStyle = 'rgba(30,41,59,1)'; x.fillRect(W / 2 - 90, H * 0.78, 180, 26);
    x.fillStyle = vurgu; x.globalAlpha = 0.85; x.fillRect(W / 2 - 80, H * 0.78 + 8, 90, 10); x.globalAlpha = 1;
    // Parıltı: 5 sn'de bir çapraz geçen yumuşak ışık bandı.
    var p = dongu(zaman / 5000) * 2.2 - 0.6;
    var g = x.createLinearGradient(W * p - 120, 0, W * p + 120, H);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }

  /* Kartın yazıları ve LED'leri (BoardSVG), şeffaf zeminde (sahne3b.js ile aynı). */
  function kartYazilari(cb) {
    var olcek = 6;
    var stil = BoardSVG.STIL_3B;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="16 26 140 268" width="' + 140 * olcek + '" height="' + 268 * olcek +
      '"><style>' + stil + '</style>' + BoardSVG.pinlerUstte(BoardSVG.groupMarkup({ isiksiz: true })) + '</svg>';
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = 140 * olcek; c.height = 268 * olcek;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      cb(c);
    };
    img.onerror = function () { cb(null); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // ---------------- kur ----------------
  function kur(kutu) {
    if (!kutu || kurulu || !document.getElementById('layer-kart') || !window.BoardSVG) return false;
    if (!(window.Hareket && Hareket.aktif) || !webglVar()) return false;
    kurulu = { kutu: kutu, hazir: false };
    var yukler = [];
    if (!window.THREE) yukler.push(yukle('assets/vendor/three.min.js'));
    Promise.all(yukler)
      .then(function () {
        return Promise.all([window.THREE.GLTFLoader ? 0 : yukle('assets/vendor/GLTFLoader.js'),
                            window.SAHNE3B_GLB ? 0 : yukle('assets/3b/modeller.js'),
                            window.MASA_DOKU ? 0 : yukle('assets/3b/masa-dokulari.js')]);
      })
      .then(function () { return Promise.all(['deneyap-kart', 'laptop', 'fis'].map(glb)); })
      .then(function (m) {
        if (!kutu.isConnected) { kurulu = null; bekleBitti(); return; }
        kurulu = sahneKur(kutu, { kart: m[0], laptop: m[1], fis: m[2] });
      })
      .catch(function (e) { kurulu = null; bekleBitti(); if (window.console) console.warn('KartSahne3B kurulamadı:', e); });
    return true;
  }

  function sahneKur(kutu, M) {
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    var tuval = renderer.domElement;
    tuval.className = 'ks3b-tuval';
    tuval.setAttribute('aria-hidden', 'true');
    kutu.appendChild(tuval);

    var sahne = new THREE.Scene();
    // Ortam yansıması: sıcak atölye tonlu oda (metal kenarlar, ekran camı).
    var pm = new THREE.PMREMGenerator(renderer), oda = new THREE.Scene();
    oda.add(new THREE.Mesh(new THREE.SphereGeometry(10, 16, 8), new THREE.MeshBasicMaterial({ color: 0xE8DCCB, side: THREE.BackSide })));
    [[0, 8, 0, 0xffffff, 6], [-6, 3, 4, 0xfff1dd, 4], [6, 3, -4, 0xdfe8ff, 3]].forEach(function (l) {
      var p = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(l[3]).multiplyScalar(l[4]) }));
      p.position.set(l[0], l[1], l[2]); p.lookAt(0, 0, 0); oda.add(p);
    });
    sahne.environment = pm.fromScene(oda, 0.04).texture;

    // ---- ışıklar (sayı sabit) ----
    var hemi = new THREE.HemisphereLight(0xfff6ea, 0x8f7c66, 0.5); sahne.add(hemi);
    var gunes = new THREE.DirectionalLight(0xfff4e6, 1.3);
    gunes.position.set(-2.5, 6, 3.5); gunes.target.position.set(0.8, 0, 0.8);
    gunes.castShadow = true; gunes.shadow.mapSize.set(2048, 2048); gunes.shadow.radius = 5; gunes.shadow.bias = -0.0004;
    var sk = gunes.shadow.camera; sk.left = -3.5; sk.right = 3.5; sk.top = 3.5; sk.bottom = -3.5; sk.near = 1; sk.far = 14;
    sahne.add(gunes, gunes.target);
    // Kenar ışığı: arkadan, serin; laptop kapağının, kartın ve fişin kenarlarını çizer.
    var kenar = new THREE.DirectionalLight(0x9FC8FF, 1.6);
    kenar.position.set(1.5, 2.2, -5); kenar.target.position.set(0.8, 0, 1);
    sahne.add(kenar, kenar.target);
    var ledIsik = new THREE.PointLight(0x6fa8ff, 0, 1.2, 2);
    var pwrIsik = new THREE.PointLight(0xff3b30, 0, 0.6, 2);
    var ekranIsik = new THREE.PointLight(0x6FB7FF, 0, 2.2, 2);
    sahne.add(ledIsik, pwrIsik, ekranIsik);

    // ---- masa: Blender dokusu, mağazadaki masaya göre ----
    var masaMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    var masa = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), masaMat);   // çevirince kenarı görünmesin
    sahne.fog = new THREE.Fog(0xF3EEE6, 16, 46);   // ufuk sise karışır (çevirince masa bitişi sert görünmesin)
    masa.rotation.x = -Math.PI / 2; masa.position.set(0.8, 0, 0.8); masa.receiveShadow = true;
    sahne.add(masa);
    var MASA_YUZEY = {                       // pürüz, metal, kendi ışığı (yıldızlar)
      varsayilan: [0.75, 0, 0], ahsap: [0.6, 0, 0], metal: [0.38, 0.65, 0], gece: [0.55, 0, 0.55],
      mat: [0.85, 0, 0], mermer: [0.22, 0, 0], uzay: [0.5, 0, 0.8]
    };
    var masaDokular = {}, masaSon = null;
    function masaGuncelle() {
      var ad = document.documentElement.getAttribute('data-masa') || 'varsayilan';
      if (!window.MASA_DOKU || !MASA_DOKU[ad]) ad = 'varsayilan';
      if (ad === masaSon) return;
      masaSon = ad;
      var y = MASA_YUZEY[ad] || MASA_YUZEY.varsayilan;
      masaMat.roughness = y[0]; masaMat.metalness = y[1];
      var uygula = function (t) {
        masaMat.map = t; masaMat.emissiveMap = y[2] ? t : null;
        masaMat.emissive = new THREE.Color(y[2] ? 0xffffff : 0x000000); masaMat.emissiveIntensity = y[2];
        masaMat.needsUpdate = true;
      };
      if (masaDokular[ad]) return uygula(masaDokular[ad]);
      if (!window.MASA_DOKU) return;
      new THREE.TextureLoader().load(MASA_DOKU[ad], function (t) {
        t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
        t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.repeat.set(40, 40);   // aynalı: dikiş görünmez (160 birimlik masa)
        masaDokular[ad] = t;
        if (masaSon === ad) uygula(t);
      });
    }
    masaGuncelle();

    function golgeli(o) { o.traverse(function (n) { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } }); return o; }

    // ---- kart: masada, pin başlıklarının üstünde ----
    var kart = new THREE.Group();
    kart.position.y = KART_Y;
    kart.add(golgeli(M.kart));
    /* Bakır yollar (blender/deneyap.py) çift taraflı ince şerit: kendi üstüne gölge düşürmesin. */
    M.kart.traverse(function (n) { if (n.isMesh && /^yollar/.test(n.name)) { n.castShadow = false; n.material.side = THREE.FrontSide; } });
    /* Lehim maskesi doygun kırmızı kalsın: ACES + ortam yansıması turuncuya/pembeye çekiyordu
       (sahne3b.js ile aynı ayar, gerekçesi orada). */
    var koyulasan = [];
    M.kart.traverse(function (n) {
      if (n.isMesh && /^(pcb|yol)/.test(n.material.name) && koyulasan.indexOf(n.material) < 0) {
        koyulasan.push(n.material); n.material.color.multiplyScalar(0.55); n.material.envMapIntensity = 0.35;
        n.material.roughness = 0.5; if ('clearcoat' in n.material) n.material.clearcoat = 0;
      }
    });
    var baslik = new THREE.MeshStandardMaterial({ color: 0x1B1F24, roughness: 0.6 });
    [[20.5, 97, 188], [151.5, 51, 234]].forEach(function (b) {
      var h = new THREE.Mesh(new THREE.BoxGeometry(0.08, KART_Y, b[2] * S), baslik);
      h.position.set(b[0] * S, -KART_Y / 2, (b[1] + b[2] / 2) * S); golgeli(h); kart.add(h);
    });
    kartYazilari(function (c) {
      if (!c) return;
      var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
      var d = new THREE.Mesh(new THREE.PlaneGeometry(1.40, 2.68), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      d.rotation.x = -Math.PI / 2; d.position.set(0.86, 0.0032, 1.60); kart.add(d);
      /* ESP32-S2 baskısı çipin üst yüzünde (çip 2.3 birim yüksek, yazı katmanını örter): aynı dokunun
         çip bölgesi çipin üstüne ikinci bir düzlem olarak basılır. */
      var C = KONUM.cip, g = new THREE.PlaneGeometry(C.w * S, C.h * S), uv = g.attributes.uv;
      for (var i = 0; i < uv.count; i++) {
        uv.setXY(i, (C.x - 16 + uv.getX(i) * C.w) / 140, 1 - (C.y - 26 + (1 - uv.getY(i)) * C.h) / 268);
      }
      var e = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      e.rotation.x = -Math.PI / 2; e.position.set((C.x + C.w / 2) * S, 0.0232, (C.y + C.h / 2) * S); kart.add(e);
      galeriResmi();
    });

    /* Malzeme galerisindeki kart (parts-gallery.js, her dersin 2. adımı) düz SVG'ydi:
       aynı 3B modelden bir kez ürün fotoğrafı çekilir, SVG'nin yerine konur
       (Arda: "tüm derslerde kart 3B değil sanki"). Ayrı, tek seferlik bir bağlam. */
    function galeriResmi() {
      if (kartFoto) return galeriDegistir();
      try {
        var r2 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        r2.outputEncoding = THREE.sRGBEncoding; r2.toneMapping = THREE.ACESFilmicToneMapping;
        r2.setPixelRatio(1); r2.setSize(304, 600, false);
        var s2 = new THREE.Scene(); s2.environment = sahne.environment;
        s2.add(new THREE.HemisphereLight(0xfff6ea, 0x8f7c66, 0.7));
        var d2 = new THREE.DirectionalLight(0xfff4e6, 1.4); d2.position.set(-2, 6, 4); s2.add(d2);
        var k2 = new THREE.DirectionalLight(0x9FC8FF, 1.2); k2.position.set(1.5, 2, -5); s2.add(k2);
        var kopya = kart.clone(true); kopya.position.set(0, 0, 0); s2.add(kopya);
        var c2 = new THREE.PerspectiveCamera(24, 304 / 600, 0.1, 40);
        c2.position.set(0.8, 7.0, -4.16); c2.lookAt(0.86, 0, 1.62);   // port tarafından: yazılar düz (2026-10-07)
        r2.render(s2, c2);
        kartFoto = r2.domElement.toDataURL('image/png');
        r2.dispose(); if (r2.forceContextLoss) r2.forceContextLoss();
      } catch (er) { kartFoto = null; return; }
      galeriDegistir();
      if (window.MutationObserver) new MutationObserver(galeriDegistir).observe(document.body, { childList: true, subtree: true });
    }
    /* Dahili LED ve GÜÇ ışığı: ışık yüzeyi + ışıma lekesi + nokta ışık. Yüzeyler YALNIZ yanıkken
       görünür; sönükken modelin kendi parçası (RGB LED'in krem merceği, GÜÇ LED'in beyaz gövdesi)
       görünsün. Yükseklikler deneyap.py'den: RGB LED merceğinin üstü 3.84, GÜÇ LED'i 1.5 birim. */
    function yuzeyLed(xy, en, boy, y, yuvarlak) {
      var m = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, emissive: 0x000000 });
      var geo = yuvarlak ? new THREE.CylinderGeometry(en / 2, en / 2, 0.004, 28) : new THREE.BoxGeometry(en, 0.004, boy);
      var l = new THREE.Mesh(geo, m);
      l.position.set(xy[0] * S, y, xy[1] * S); l.visible = false; kart.add(l);
      return { m: m, l: l };
    }
    var ledP = yuzeyLed(LED, 0.2, 0.2, 0.0386, true), pwrP = yuzeyLed(PWR, 0.058, 0.037, 0.0152, false), pwrMat = pwrP.m;
    // Yanıkken tonlamasız saf renk: ACES yüksek ışımayı beyaza çekiyordu.
    var ledYanikMat = new THREE.MeshBasicMaterial({ color: 0x1e7bff, toneMapped: false });
    var ledLeke = isima(0.9, true), pwrLeke = isima(0.4);
    ledLeke.position.set(LED[0] * S, 0.06, LED[1] * S); pwrLeke.position.set(PWR[0] * S, 0.05, PWR[1] * S);
    kart.add(ledLeke, pwrLeke);
    ledIsik.position.set(LED[0] * S, KART_Y + 0.25, LED[1] * S);
    pwrIsik.position.set(PWR[0] * S, KART_Y + 0.15, PWR[1] * S);
    sahne.add(kart);

    /* ---- laptop: kartın SAĞINDA, ekranı çocuğa (kameraya) dönük, sağ yan portu karta bakar ----
       2026-10-07 (Arda): sabit kamera kartın Type-C tarafından bakar ("yazılar ters gelmesin"),
       bu yüzden grup y'de 180° döner: modelin +z'si (ekran) kameraya, +x'i (port yanı) karta bakar.
       2026-10-14 (Arda: "kartın yanında bilgisayar küçük kaldı" → "Büyük, köşesi kadraj dışı"):
       model blender/laptop.py — gerçek 14" oranında, kendi yerelinde (orijin taban izinin ortası).
       Tam kadrajda ekranı görünür, sol köşesi panelin dışına taşar; kart aynı boyda kalır ve kapak
       kartın köşesini örtmez (x 2.9'da örtüyordu, ölçüldü). */
    var LAP = V(3.2, 0, -1.35), LAP_OLCEK = 0.8;
    var laptop = new THREE.Group(); laptop.add(golgeli(M.laptop)); M.laptop.scale.setScalar(LAP_OLCEK);
    laptop.position.copy(LAP); laptop.rotation.y = Math.PI; sahne.add(laptop);
    var kabloCikis = M.laptop.getObjectByName('kablo_cikis');   // takılı fişin arka ucu
    var kabloYon = V(1, 0, 0).applyQuaternion(laptop.quaternion);   // fişten dışarı: karta doğru
    function portBul() {                     // laptop iniş animasyonunda yer değiştirir
      laptop.updateMatrixWorld(true);
      return kabloCikis ? kabloCikis.getWorldPosition(V(0, 0, 0)) : LAP.clone().add(V(-1.5, 0.06, -0.1));
    }
    var ekranTuval = document.createElement('canvas'); ekranTuval.width = 512; ekranTuval.height = 320;
    var ekranDoku = new THREE.CanvasTexture(ekranTuval); ekranDoku.encoding = THREE.sRGBEncoding; ekranDoku.flipY = false;
    var ekranMerkez = null;
    laptop.updateMatrixWorld(true);          // düğüm konumları + ölçek: ekran merkezi laptop yerelinde doğru çıksın
    M.laptop.traverse(function (n) {
      if (n.isMesh && /ekran/.test(n.name)) {
        n.material = new THREE.MeshBasicMaterial({ map: ekranDoku, toneMapped: false });   // ekran gerçekten ışık saçar
        n.geometry.computeBoundingBox(); ekranMerkez = n.geometry.boundingBox.getCenter(V(0, 0, 0));
        n.localToWorld(ekranMerkez); laptop.worldToLocal(ekranMerkez);
      }
    });
    ekranMerkez = ekranMerkez || V(0, 1.0, -0.9);
    var ekranLeke = isima(2.8); ekranLeke.position.copy(ekranMerkez).add(V(0, 0, 0.12)); laptop.add(ekranLeke);
    laptop.updateMatrixWorld(true);
    ekranIsik.position.copy(laptop.localToWorld(ekranMerkez.clone().add(V(0, -0.05, 0.45))));

    // ---- Type-C fiş + kablo + veri topları ----
    var fis = golgeli(M.fis); fis.rotation.y = -Math.PI / 2; sahne.add(fis);   // dil +x → +z (sokete)
    var SOKET_Y = KART_Y + 0.0325;
    var agiz = V(USB[0] * S, SOKET_Y - 0.06, USB[1] * S);
    var kabloMat = new THREE.MeshStandardMaterial({ color: 0xE9ECEF, roughness: 0.45 });
    var kablo = null, kabloEgri = null, kabloSon = '';
    var veriMat = new THREE.MeshBasicMaterial({ color: 0x4DA3FF, toneMapped: false });
    var veri = [0, 1, 2].map(function () {
      var v = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), veriMat); v.add(isima(0.16)); sahne.add(v); return v;
    });
    function tup(noktalar, r, mat) {
      var e = new THREE.CatmullRomCurve3(noktalar);
      var m = new THREE.Mesh(new THREE.TubeGeometry(e, 64, r, 10, false), mat);
      m.castShadow = true; m.receiveShadow = true; m.userData.egri = e;
      return m;
    }
    function kabloKur(arka) {
      var port = portBul();
      var anahtar = [port.y, arka.x, arka.y, arka.z].map(function (v) { return v.toFixed(3); }).join();
      if (anahtar === kabloSon) return;
      kabloSon = anahtar;
      if (kablo) { sahne.remove(kablo); kablo.geometry.dispose(); }
      // Laptopun karta bakan yanındaki fişten çıkar, masaya iner, kavisle fişin arkasına (−z) dolanır.
      var cik = port.clone().addScaledVector(kabloYon, 0.16).setY(Math.max(0.025, port.y - 0.02));
      kablo = tup([port, cik, V((cik.x + arka.x) / 2 + 0.1, 0.025, Math.min(cik.z, arka.z - 0.4) - 0.15),
                   V(arka.x + 0.25, 0.03, arka.z - 0.4), V(arka.x, Math.max(0.04, arka.y * 0.6), arka.z - 0.12), arka], 0.022, kabloMat);
      kabloEgri = kablo.userData.egri;
      sahne.add(kablo);
    }

    // ---- kamera: sabit iki kadraj (yalnız kart / kart + laptop), yumuşak geçiş ----
    var kamera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
    var KADRAJ = { tek: { hedef: V(0.86, 0.05, 1.62), uzak: 6.8 }, tam: { hedef: V(1.85, 0.15, 0.45), uzak: 10.2 } };
    /* YON0 π: kamera kartın Type-C tarafında (Arda, 2026-10-07: "sabitle dediğimizde Type-C port
       kısmından bakalım ki yazılar ters gelmesin"). Kartın baskısı o taraftan düz okunur. */
    var EGIM0 = 0.92, YON0 = Math.PI - 0.12;   // yükseklik açısı (rad), yan açı (rad)
    var kam = { hedef: KADRAJ.tek.hedef.clone(), uzak: KADRAJ.tek.uzak, egim: EGIM0, yon: YON0 };
    function boyutla() {
      var w = Math.max(1, kutu.clientWidth), h = Math.max(1, kutu.clientHeight);
      renderer.setSize(w, h, false);
      tuval.style.width = w + 'px'; tuval.style.height = h + 'px';
      kamera.aspect = w / h; kamera.updateProjectionMatrix();
    }
    boyutla();
    function kameraYerlestir() {
      // Dar kutuda (yatay alan az) biraz geri çekil.
      var u = kam.uzak * Math.max(1, 0.9 / kamera.aspect);
      kamera.position.set(kam.hedef.x + Math.sin(kam.yon) * Math.cos(kam.egim) * u, kam.hedef.y + Math.sin(kam.egim) * u,
                          kam.hedef.z + Math.cos(kam.yon) * Math.cos(kam.egim) * u);
      kamera.lookAt(kam.hedef);
    }

    // ---- "Hareket ettir": açıkken sürükle → çevir; kapalıyken sabit ----
    var hareket = { acik: false, yon: 0, egim: 0, surukle: null };
    var dugme = document.createElement('button');
    dugme.type = 'button'; dugme.className = 'ks3b-hareket';
    dugme.setAttribute('aria-pressed', 'false');
    var ipucu = document.createElement('p'); ipucu.className = 'ks3b-ipucu'; ipucu.hidden = true;
    ipucu.textContent = 'Sürükle: sahneyi çevir';
    function dugmeYaz() {
      dugme.innerHTML = hareket.acik
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V7a5 5 0 0 1 10 0v4"/><rect x="5" y="11" width="14" height="10" rx="2"/></svg>Sabitle'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>Hareket ettir';
      dugme.setAttribute('aria-pressed', String(hareket.acik));
      dugme.setAttribute('aria-label', hareket.acik ? 'Sahneyi sabitle' : 'Sahneyi hareket ettir: sürükleyerek çevir');
      kutu.classList.toggle('ks3b-hareketli', hareket.acik);
      ipucu.hidden = !hareket.acik;
    }
    dugme.addEventListener('click', function () { hareket.acik = !hareket.acik; dugmeYaz(); });
    kutu.appendChild(dugme); kutu.appendChild(ipucu); dugmeYaz();
    tuval.addEventListener('pointerdown', function (e) {
      if (!hareket.acik) return;
      hareket.surukle = { id: e.pointerId, x: e.clientX, y: e.clientY, yon: hareket.yon, egim: hareket.egim };
      try { tuval.setPointerCapture(e.pointerId); } catch (er) {}
    });
    tuval.addEventListener('pointermove', function (e) {
      var s = hareket.surukle; if (!s || !hareket.acik) return;
      /* Bırakma kaçırıldıysa (tuval dışında bırakıldı, yakalama düştü) sürükleme takılı kalıp
         basılı olmayan fareyle kamerayı çeviriyordu (sahne3b.js ile aynı düzeltme, 2026-10-07). */
      if (e.pointerType === 'mouse' && !(e.buttons & 1)) { birak(); return; }
      if (e.pointerId !== s.id) return;
      hareket.yon = Math.max(-1.3, Math.min(1.3, s.yon - (e.clientX - s.x) * 0.012));
      hareket.egim = Math.max(-0.62, Math.min(0.5, s.egim + (e.clientY - s.y) * 0.008));
    });
    function birak() { hareket.surukle = null; }
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { tuval.addEventListener(t, birak); });
    dugme.addEventListener('keydown', function (e) {        // klavyeyle de çevrilebilsin
      if (!hareket.acik) return;
      var d = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08] }[e.key];
      if (!d) return;
      e.preventDefault();
      hareket.yon = Math.max(-1.3, Math.min(1.3, hareket.yon + d[0]));
      hareket.egim = Math.max(-0.62, Math.min(0.5, hareket.egim + d[1]));
    });

    kutu.classList.add('ks3b-acik');        // SVG katmanları yerinde, görünmez (styles.css)
    bekleBitti();

    // ---------------- her kare: SVG'yi oku, 3B'yi güncelle ----------------
    var sonCizim = 0, basla = performance.now(), sonEkran = -1e9, rafId = 0, calisiyor = true;
    var durum = { gorun: null, gorunBas: 0, fisT: 0 };
    var ledEl = function () { return document.getElementById('layer-led'); };
    var glowEl = function () { return document.getElementById('layer-glow'); };
    var ro = window.ResizeObserver ? new ResizeObserver(boyutla) : null;
    if (ro) ro.observe(kutu);

    function kare(zaman) {
      if (!calisiyor) return;
      rafId = requestAnimationFrame(kare);
      if (document.hidden || !kutu.isConnected || !kutu.offsetParent) return;
      // En çok 30 kare/sn, sürüklerken 60 (sahne3b.js ile aynı gerekçe: dizüstü fanı/pili).
      if (!hareket.surukle && zaman - sonCizim < 30) return;
      sonCizim = zaman;
      var z = Math.max(0, zaman - basla);
      var hazirlik = kutu.classList.contains('usb-ready'), bagli = kutu.classList.contains('connected');
      // 1–2. adımda laptop yok (kablo kaydı kalsa bile); motor body[data-adim] yazar.
      var adimNo = +(document.body.dataset.adim || (window.LessonEngine && LessonEngine.step) || 0);
      var erken = adimNo > 0 && adimNo < 3 && !document.body.dataset.kabloGoruldu;
      var lapGorun = (hazirlik || bagli) && !erken;

      // Laptop + kablo + fiş: hazırlıkta yukarıdan iner, oturur.
      if (lapGorun !== durum.gorun) { durum.gorun = lapGorun; durum.gorunBas = z; }
      var t = Math.min(1, (z - durum.gorunBas) / 650);
      var inis = lapGorun ? (1 - yay(t)) * 1.2 : 0;
      laptop.visible = lapGorun; laptop.position.y = LAP.y + inis;
      fis.visible = lapGorun;
      // Fiş: hazırlıkta soketin üstünde asılı, takılınca yerine kayar (0.7 sn).
      durum.fisT += ((bagli ? 1 : 0) - durum.fisT) * 0.12;
      var ft = durum.fisT;
      // Asılıyken soketin hemen üstünde ve önünde: yüksek tutunca perspektifte laptopun önüne düşüyordu.
      fis.position.set(agiz.x, agiz.y + (1 - ft) * 0.13 + inis, agiz.z - 0.02 + (1 - ft) * 0.05);
      if (lapGorun) {
        var arka = fis.position.clone().add(V(0, 0.06, -0.62));   // fişin kablo çıkışı (yerel -x → -z; boyun ucu 64 birim)
        kabloKur(arka);
        kablo.visible = true; kablo.position.y = 0;
      } else if (kablo) kablo.visible = false;
      veri.forEach(function (v, i) {
        v.visible = lapGorun && bagli && !!kabloEgri && ft > 0.95;
        if (v.visible) v.position.copy(kabloEgri.getPointAt(dongu(z / 1400 + i / 3)));
      });

      // Dahili LED: SVG'deki ışıma katmanının o anki saydamlığı (ritim script.js'ten).
      var led = ledEl(), glow = glowEl();
      var g = glow ? Math.min(1, (parseFloat(getComputedStyle(glow).opacity) || 0) / 0.85) : 0;
      var lr = renk(led && led.classList.contains('active') ? getComputedStyle(led).fill : '', '#6fa8ff');
      if (!(led && led.classList.contains('active')) && g < 0.02) lr.set(0x6fa8ff);
      /* Arda: "3B'de LED'in rengi mavi olsun." SVG'nin açık mavisi (#6fa8ff) yüksek ışımada
         tonlamayla beyaza kaçıyordu: renk doygunlaştırılır, şiddet ölçülü tutulur. */
      lr.offsetHSL(0, 0.3, -0.16);
      ledP.l.material = ledYanikMat; ledP.l.visible = g > 0.3;
      ledYanikMat.color.copy(lr);
      ledLeke.material.color.copy(lr); ledLeke.material.opacity = g * 0.85;
      ledLeke.scale.setScalar(0.6 + g * 0.6);
      ledIsik.color.copy(lr); ledIsik.intensity = g * 2.2;
      durum.led = g; durum.ledRenk = lr.getHexString();
      // GÜÇ ışığı: kart bağlıyken kırmızı, hafif nabızlı.
      var p = bagli ? 0.85 + 0.15 * Math.sin(z / 380) : 0;
      pwrP.l.visible = p > 0;
      pwrMat.color.set(0xff5a4d); pwrMat.emissive.set(0xff3b30); pwrMat.emissiveIntensity = p * 2.2;
      pwrLeke.material.color.set(0xff4438); pwrLeke.material.opacity = p * 0.8;
      pwrIsik.intensity = p * 0.9;
      // Ekran parıltısı: tema vurgusuyla klavyeye ve masaya ışık düşer.
      var vurgu = renk(cssVar('--lt-vurgu', '#6FB7FF'), '#6FB7FF');
      ekranLeke.material.color.copy(vurgu); ekranLeke.material.opacity = lapGorun ? 0.16 + 0.04 * Math.sin(z / 900) : 0;
      ekranIsik.color.copy(vurgu); ekranIsik.intensity = lapGorun ? (bagli ? 1.1 : 0.8) : 0;
      if (lapGorun && z - sonEkran > 90) { sonEkran = z; ekranCiz(ekranTuval, z); ekranDoku.needsUpdate = true; }

      masaGuncelle();

      // Kamera: kadraj adıma göre, hareket kapalıyken çocuğun açısı yavaşça sıfırlanır.
      var hedefK = lapGorun ? KADRAJ.tam : KADRAJ.tek;
      kam.hedef.lerp(hedefK.hedef, 0.06); kam.uzak += (hedefK.uzak - kam.uzak) * 0.06;
      if (!hareket.acik && !hareket.surukle) { hareket.yon *= 0.9; hareket.egim *= 0.9; }
      kam.yon = YON0 + hareket.yon; kam.egim = EGIM0 + hareket.egim;
      kameraYerlestir();
      renderer.render(sahne, kamera);
      if (!kurulu.hazir) { kurulu.hazir = true; kutu.dispatchEvent(new CustomEvent('ks3b:hazir')); }
    }
    rafId = requestAnimationFrame(kare);

    function yoket() {
      calisiyor = false; cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
      kutu.classList.remove('ks3b-acik', 'ks3b-hareketli');
      tuval.remove(); dugme.remove(); ipucu.remove(); renderer.dispose();
      kurulu = null;
    }
    return { kutu: kutu, yoket: yoket, renderer: renderer, hazir: false,
      kamera: kamera, hareket: hareket, durum: durum };
  }

  /* Kart script.js / lesson-1-3.js içinde DOMContentLoaded'da enjekte ediliyor; sonrasında kur. */
  function baslat() {
    var kutu = document.getElementById('simulationBox');
    if (!(kutu && document.getElementById('layer-kart') && kur(kutu))) bekleBitti();
  }
  /* Yenilerken eski SVG kart görünmesin (Arda, 2026-10-05: "site yenilenirken eski
     svg kart görünümü geliyor"). 3B ancak sayfa yüklenince kuruluyor; o arada SVG
     gizli, yerinde kartın Blender render'ı durur (kurulum-kart.py). 3B hazır olunca
     ona geçer; kurulamazsa (WebGL yok, hata) bekleme kalkar ve SVG geri gelir.
     Hareket kapalıyken (otomasyon, "hareketi azalt") hiç beklenmez: SVG kalır. */
  function bekleBitti() { document.documentElement.classList.remove('ks3b-bekle'); }
  if (window.Hareket && Hareket.aktif && webglVar()) {
    document.documentElement.classList.add('ks3b-bekle');
    setTimeout(bekleBitti, 8000);           // güvenlik: ne olursa olsun 8 sn sonra SVG'ye düş
  }
  if (document.readyState === 'complete') setTimeout(baslat, 0);
  else window.addEventListener('load', baslat);

  /* bilgi(): test için — kurulu mu, son karede kaç üçgen, hareket açık mı, kamera açısı. */
  return { kur: kur, get kurulu() { return !!(kurulu && kurulu.renderer); },
    bilgi: function () {
      if (!kurulu || !kurulu.renderer) return null;
      return { ucgen: kurulu.renderer.info.render.triangles, cagri: kurulu.renderer.info.render.calls,
        hareket: kurulu.hareket.acik, yon: +kurulu.hareket.yon.toFixed(3), egim: +kurulu.hareket.egim.toFixed(3),
        led: +(kurulu.durum.led || 0).toFixed(2), ledRenk: kurulu.durum.ledRenk };
    } };
})();
