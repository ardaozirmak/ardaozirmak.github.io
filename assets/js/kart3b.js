/* 3B Deneyap Mini v2 kartı — portal hero'su (three.js r149, UMD).
   Spec: docs/superpowers/specs/2026-09-28-hareket-katmani-design.md

   Kart derslerdeki 3B kartın AYNISI — kural: öğretici çizim her yerde aynı
   karttır, çocuk portalda gördüğünü derste de görür. Gövde Blender glb'si
   (blender/deneyap.py → assets/3b/kart-model.js, gerçek Mini v2 yerleşimi,
   2026-10-14); baskı (pin adları, BUTON/RESET/GÜÇ) BoardSVG'den şeffaf katman;
   parça yerleri BoardSVG.KONUM'dan. Ölçüler board-svg.js koordinatından:
   X = (x - 86) / 20, Z = (y - 160) / 20 (kart 140x268 → 7 x 13.4 birim).

   Doğrudan çağrılmaz: Hareket.kart3b() tembel yükler (three, GLTFLoader,
   board-svg, kart-model) ve kurar. Dış sözleşme `kur(kap, { onFaz })` →
   denetim nesnesi ({ yoket }) ya da false (kurulamadı). */
window.Kart3B = (function () {
  'use strict';

  const W = 7, D = 13.4;                     // kart gövdesi (140 x 268 birim / 20)
  const X = (x) => (x - 86) / 20;
  const Z = (y) => (y - 160) / 20;
  const DONGU_MS = 2000;                     // delay(1000) + delay(1000)

  /* Kartın baskısı şeffaf zeminde (sahne3b.js kartYazilari ile aynı yöntem). Yazı stili tek
     kaynaktan (board-svg.js STIL_3B): resim olarak çizilen SVG'ye sayfa CSS'i ulaşmaz; içindeki
     <image> (2B render) de yüklenmez — burada istenen de yalnız baskı. */
  function yaziDokusu(cb) {
    const olcek = 6;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="16 26 140 268" width="' + 140 * olcek +
      '" height="' + 268 * olcek + '"><style>' + BoardSVG.STIL_3B + '</style>' +
      BoardSVG.pinlerUstte(BoardSVG.groupMarkup({ isiksiz: true })) + '</svg>';
    const img = new Image();
    img.onload = function () {
      const c = document.createElement('canvas');
      c.width = 140 * olcek; c.height = 268 * olcek;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      cb(c);
    };
    img.onerror = function () { cb(null); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // glb base64 JS'e gömülü (file:// altında .glb fetch edilemez).
  function tampon(b64) {
    const s = atob(b64), u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u.buffer;
  }

  function radyal(ic, dis, boyut) {
    const c = document.createElement('canvas');
    c.width = c.height = boyut || 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(c.width / 2, c.height / 2, 0, c.width / 2, c.height / 2, c.width / 2);
    g.addColorStop(0, ic); g.addColorStop(1, dis);
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    return new THREE.CanvasTexture(c);
  }

  /* Kartın arkası: düz kırmızı, ortada küçük "DENEYAP" baskısı. Doku
     ShapeGeometry'nin şekil koordinatına göre (x, y birim) — repeat/offset
     ile [0,1]'e taşınır, üst yüzdeki gibi. */
  function arkaDoku() {
    const c = document.createElement('canvas');
    c.width = 280; c.height = 536;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 536);
    g.addColorStop(0, '#b8322b'); g.addColorStop(1, '#86190f');
    x.fillStyle = g; x.fillRect(0, 0, 280, 536);
    x.save(); x.translate(140, 268); x.rotate(-Math.PI / 2);
    x.fillStyle = 'rgba(255,240,235,0.55)'; x.font = '700 26px Arial, sans-serif'; x.textAlign = 'center';
    x.fillText('DENEYAP', 0, 8);
    x.restore();
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.repeat.set(1 / (W + 0.06), 1 / (D + 0.06));
    t.offset.set(0.5, 0.5);
    return t;
  }

  function yuvarlakDikdortgen(w, d, r) {
    const s = new THREE.Shape();
    const x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  function kutu(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    return m;
  }

  function kur(kap, secenek) {
    secenek = secenek || {};
    if (!window.THREE || !THREE.GLTFLoader || !window.KART_GLB || !window.BoardSVG || !BoardSVG.KONUM || !kap) return false;
    let kapandi = false;       // glb ve yazı dokusu kapandıktan sonra gelirse sahneye eklenmesin
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) { return false; }
    if (!renderer.getContext()) return false;

    const gen = () => Math.max(1, kap.clientWidth), yuk = () => Math.max(1, kap.clientHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(gen(), yuk());
    renderer.outputEncoding = THREE.sRGBEncoding;
    /* Derslerdeki 3B sahneyle aynı tonlama (sahne3b.js): glb'nin beyaz parçaları (RGB LED, tuşlar,
       I2C soketi) tonlamasız ışıkta beyaza kırpılıyordu. */
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.className = 'hk-3b-tuval';
    kap.appendChild(renderer.domElement);

    /* İki mod: 'hero' (portal: uzaktan, salınır, bırakınca geri döner) ve
       'incele' (Ders 1.1: yakın, serbest çevrilir, ters de çevrilir, üstünde
       parça etiketleri). */
    const incele = secenek.mod === 'incele';
    const sahne = new THREE.Scene();
    const kamera = new THREE.PerspectiveCamera(incele ? 34 : 30, gen() / yuk(), 0.1, 100);
    /* incele: kart kutuya SIĞSIN — uzaklık kutunun oranından. Kartın
       uzun kenarı (13.4) dikeyde, kısa kenarı (7) yatayda payla sığacak
       kadar geri çekil; hangisi daha uzaksa o. */
    function kameraKonumla() {
      if (!incele) { kamera.position.set(0, 11, 20); kamera.lookAt(0, 0, 0); return; }
      const tan = Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2));
      const dikey = (D * 1.12) / (2 * tan);
      const yatay = (D * 0.95) / (2 * tan * kamera.aspect);   // döndürünce uzun kenar yataya da gelir
      const uzak = Math.max(dikey, yatay, 12);
      kamera.position.set(0, uzak * 0.5, uzak * 0.866);
      kamera.lookAt(0, 0, 0);
    }
    kameraKonumla();

    /* Işık derslerdeki 3B sahneye yakın (sahne3b.js: yarım küre 0.4 + güneş 1.75 + ortam yansıması):
       eski düz levha için ayarlı güçlü ışık (0.95 + 0.85) glb'yi beyaza kırpıyordu. */
    sahne.add(new THREE.HemisphereLight(0xfff6ea, 0x5a3a2c, 0.45));
    const gunes = new THREE.DirectionalLight(0xfff8ee, 1.5);
    gunes.position.set(-7, 14, 9);
    sahne.add(gunes);
    const dolgu = new THREE.DirectionalLight(0xffe3c4, 0.3);
    dolgu.position.set(8, 4, -6);
    sahne.add(dolgu);

    const kart = new THREE.Group();
    sahne.add(kart);

    /* Ortam yansıması (sahne3b.js ile aynı sıcak oda): glb'nin metal pedleri, USB-C ve lehimler
       ortam olmadan siyaha kaçıyor. */
    const pm = new THREE.PMREMGenerator(renderer);
    const oda = new THREE.Scene();
    oda.add(new THREE.Mesh(new THREE.SphereGeometry(10, 16, 8), new THREE.MeshBasicMaterial({ color: 0xE8DCCB, side: THREE.BackSide })));
    [[0, 8, 0, 0xffffff, 6], [-6, 3, 4, 0xfff1dd, 4], [6, 3, -4, 0xdfe8ff, 3]].forEach(function (l) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(l[3]).multiplyScalar(l[4]) }));
      p.position.set(l[0], l[1], l[2]); p.lookAt(0, 0, 0); oda.add(p);
    });
    sahne.environment = pm.fromScene(oda, 0.04).texture;
    pm.dispose();

    /* --- gövde: derslerdeki 3B kartın AYNISI (blender/deneyap.py → assets/3b/kart-model.js) ---
       2026-10-14 (Arda: "deneyap kart üzerindeki detayları arttır, görseldeki gibi"): eskiden düz
       bir levha + üstüne basılmış 2B render + elle kutulanmış kalkan/tuş/USB'ydi, parçalar gerçek
       kartın yerinde değildi. glb'de 1 SVG birimi 0.01, burada 1/20 → ×5; kart merkezi (86, 160).
       PCB glb'de z −3..0.2 birim: alt yüzü y=0'a oturur, Y() deneyap.py yüksekliğini sahneye çevirir. */
    const B = 1 / 20, TABAN = 3 * B;
    const Y = (z) => TABAN + z * B;
    const model = new THREE.Group();
    model.scale.setScalar(5);
    model.position.set(-86 * B, TABAN, -160 * B);
    kart.add(model);
    new THREE.GLTFLoader().parse(tampon(window.KART_GLB), '', function (g) {
      if (kapandi) return;
      const koyulasan = [];
      g.scene.traverse(function (n) {
        if (!n.isMesh) return;
        /* Lehim maskesi doygun kırmızı kalsın (sahne3b.js ile aynı ayar ve gerekçe). */
        if (/^(pcb|yol)/.test(n.material.name) && koyulasan.indexOf(n.material) < 0) {
          koyulasan.push(n.material); n.material.color.multiplyScalar(0.55); n.material.envMapIntensity = 0.35;
          n.material.roughness = 0.5; if ('clearcoat' in n.material) n.material.clearcoat = 0;
        }
        if (/^yollar/.test(n.name)) n.material.side = THREE.FrontSide;
      });
      model.add(g.scene);
    }, function () { /* glb okunamadı: başlıklar ve gölge kalır, kart görünmez */ });

    /* Alt yüz: düz kırmızı + "DENEYAP" baskısı (kart ters çevrilince). */
    const arkaGeo = new THREE.ShapeGeometry(yuvarlakDikdortgen(W, D, 0.15), 8);
    arkaGeo.rotateX(Math.PI / 2);
    const arka = new THREE.Mesh(arkaGeo, new THREE.MeshStandardMaterial({
      map: arkaDoku(), color: 0xffffff, roughness: 0.6 }));
    arka.position.y = -0.004;
    kart.add(arka);

    /* Baskı (pin adları, BUTON/RESET/GÜÇ, DAHİLİ LED) gövdenin üstünde şeffaf katman; ESP32-S2 yazısı
       çipin üstünde ikinci düzlem (çip 2.3 birim yüksek, katmanı örter). */
    const ust = Y(0.32);
    yaziDokusu(function (tuval) {
      if (!tuval || kapandi) return;
      const t = new THREE.CanvasTexture(tuval);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const d = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      d.rotation.x = -Math.PI / 2; d.position.set(0, ust, 0); kart.add(d);
      const C = BoardSVG.KONUM.cip, g = new THREE.PlaneGeometry(C.w * B, C.h * B), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, (C.x - 16 + uv.getX(i) * C.w) / 140, 1 - (C.y - 26 + (1 - uv.getY(i)) * C.h) / 268);
      }
      const e = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      e.rotation.x = -Math.PI / 2; e.position.set(X(C.x + C.w / 2), Y(2.32), Z(C.y + C.h / 2)); kart.add(e);
    });

    // --- dahili RGB LED: merceğin üstünde yalnız yanıkken görünen ışık yüzü + nokta ışık + hale ---
    const K = BoardSVG.KONUM;
    /* Yanıkken tonlamasız saf mavi (kart-sahne3b.js ile aynı gerekçe: ACES yüksek ışımayı beyaza
       çekiyordu). Saydamlık ritimle açılır; sönükken modelin krem merceği görünür. */
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x1e7bff, toneMapped: false, transparent: true, opacity: 0 });
    let ledGuc = 0;
    const led = new THREE.Mesh(new THREE.CylinderGeometry(10.5 * B, 10.5 * B, 0.01, 32), ledMat);
    led.position.set(X(K.led[0]), Y(3.87), Z(K.led[1]));   // merceğin üstü 3.84 birim (deneyap.py)
    kart.add(led);
    const ledIsik = new THREE.PointLight(0x3b8bff, 0, 5, 2);
    ledIsik.position.set(X(K.led[0]), Y(3.75) + 0.5, Z(K.led[1]));
    kart.add(ledIsik);
    const hale = new THREE.Sprite(new THREE.SpriteMaterial({ map: radyal('rgba(90,160,255,0.95)', 'rgba(90,160,255,0)'),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    hale.scale.set(3.2, 3.2, 1);
    hale.position.set(X(K.led[0]), Y(3.75) + 0.15, Z(K.led[1]));
    kart.add(hale);

    // --- GÜÇ LED'i: kart beslendikçe yanık (sönükken modelin beyaz gövdesi görünür) ---
    const gucMat = new THREE.MeshStandardMaterial({ color: 0xff5a4d, emissive: 0xff2a1a, emissiveIntensity: 1.2 });
    const gucParca = kutu(6 * B, 0.01, 3.9 * B, gucMat, X(K.guc[0]), Y(1.55), Z(K.guc[1]));
    kart.add(gucParca);

    // --- pin başlıkları: kartın altında siyah plastik + altın iğneler ---
    const plastik = new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: 0.7 });
    const altin = new THREE.MeshStandardMaterial({ color: 0xe0b85a, metalness: 0.9, roughness: 0.28 });
    const igneGeo = new THREE.CylinderGeometry(0.075, 0.075, 1.3, 8);
    [[20.5, 100.7, 12], [151.5, 54.5, 15]].forEach(function (s) {
      const ilk = s[1] + 3.5, son = ilk + (s[2] - 1) * 15.4;
      const orta = (ilk + son) / 2, boy = (son - ilk) / 20 + 0.8;
      kart.add(kutu(0.62, 0.5, boy, plastik, X(s[0]), -0.25, Z(orta)));
      for (let i = 0; i < s[2]; i++) {
        const igne = new THREE.Mesh(igneGeo, altin);
        igne.position.set(X(s[0]), -0.55, Z(ilk + i * 15.4));
        kart.add(igne);
      }
    });

    // --- temas gölgesi ---
    const golge = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.9, D * 1.5),
      new THREE.MeshBasicMaterial({ map: radyal('rgba(60,30,20,0.42)', 'rgba(60,30,20,0)'), transparent: true, depthWrite: false }));
    golge.rotation.x = -Math.PI / 2;
    golge.position.y = -1.9;
    sahne.add(golge);

    kart.rotation.set(0.12, -0.5, 0);

    /* --- sürükleyince çevir ---
       hero: bırakınca kendi salınımına döner, eğim sınırlı.
       incele: nerede bıraktıysan orada kalır, ters de çevrilir (pinler). */
    let surukle = null, ekYaw = 0, ekPitch = 0, hizYaw = 0, sonDokunus = -1e9;
    const tuval = renderer.domElement;
    /* incele: yukarı sürükleyince kart takla atıp ALTINI gösterir (pinler). */
    const pitchMin = incele ? -2.9 : -0.5, pitchMax = incele ? 1.1 : 0.6;
    tuval.addEventListener('pointerdown', function (e) {
      surukle = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: ekYaw, pitch: ekPitch };
      try { tuval.setPointerCapture(e.pointerId); } catch (er) {}
      kap.classList.add('is-surukleniyor');
    });
    tuval.addEventListener('pointermove', function (e) {
      if (!surukle) return;
      // Bırakma kaçırıldıysa sürükleme takılı kalmasın (sahne3b.js ile aynı, 2026-10-07).
      if (e.pointerType === 'mouse' && !(e.buttons & 1)) { birak(); return; }
      if (e.pointerId !== surukle.id) return;
      const yeni = surukle.yaw + (e.clientX - surukle.x) * 0.012;
      hizYaw = yeni - ekYaw;
      ekYaw = yeni;
      ekPitch = Math.max(pitchMin, Math.min(pitchMax, surukle.pitch + (e.clientY - surukle.y) * 0.009));
      sonDokunus = performance.now();
    });
    const birak = function () { surukle = null; kap.classList.remove('is-surukleniyor'); };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { tuval.addEventListener(t, birak); });

    /* --- parça etiketleri (yalnızca incele) ---
       3B noktayı her karede ekrana izdüşürüp HTML etiketi oraya koyar.
       Üst yüzdekiler kart ters dönünce gizlenir; pin etiketi (alt) tersi.
       `id` verilen etiket tıklanır olur (onEtiket); Ders 1.1 artık vermiyor. */
    const etiketler = [];
    if (incele && Array.isArray(secenek.etiketler)) {
      const katman = document.createElement('div');
      katman.className = 'hk-3b-etiketler';
      kap.appendChild(katman);
      secenek.etiketler.forEach(function (et) {
        const el = document.createElement(et.id ? 'button' : 'span');
        el.className = 'hk-3b-etiket' + (et.id ? ' is-tiklanir' : '');
        if (et.id) {
          el.type = 'button';
          el.addEventListener('click', function () {
            if (typeof secenek.onEtiket === 'function') secenek.onEtiket(et.id);
          });
        }
        el.textContent = et.ad;
        katman.appendChild(el);
        etiketler.push({ el: el, nokta: new THREE.Vector3(X(et.x), et.alt ? -0.9 : ust + (et.h || 0.4), Z(et.y)), alt: !!et.alt });
      });
    }
    const gecici = new THREE.Vector3(), normal = new THREE.Vector3(), bakis = new THREE.Vector3();
    function etiketleriBoya() {
      if (!etiketler.length) return;
      normal.set(0, 1, 0).applyQuaternion(kart.quaternion);
      bakis.copy(kamera.position).normalize();
      const ustGorunur = normal.dot(bakis) > 0.12;
      const w = gen(), h = yuk();
      etiketler.forEach(function (e) {
        gecici.copy(e.nokta).applyMatrix4(kart.matrixWorld).project(kamera);
        e.el.style.transform = 'translate(' + ((gecici.x + 1) / 2 * w) + 'px,' + ((1 - gecici.y) / 2 * h) + 'px)';
        /* Üst yüz etiketleri yalnızca üst görünürken, pin etiketi yalnızca
           ALT görünürken — düz dururken pin etiketi üst yüzün ortasında
           havada asılı kalıyordu (ekran görüntüsüyle görüldü). */
        e.el.classList.toggle('is-gizli', e.alt ? ustGorunur : !ustGorunur);
      });
    }

    // --- döngü: yalnızca görünürken çiz ---
    let gorunur = true, sonFaz = null, calisiyor = true, rafId = 0;
    let io = null, ro = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (e) { gorunur = e[0].isIntersecting; });
      io.observe(kap);
    }
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(function () {
        renderer.setSize(gen(), yuk());
        kamera.aspect = gen() / yuk();
        kamera.updateProjectionMatrix();
        kameraKonumla();
      });
      ro.observe(kap);
    }

    const bas = performance.now();
    /* +π: kart Type-C portu kameraya dönük durur (Arda, 2026-10-07: "port kısmından bakalım ki
       yazılar ters gelmesin"). Kartın baskısı o taraftan düz okunur. */
    const tabanYaw = (incele ? -0.35 : -0.5) + Math.PI, tabanPitch = incele ? 0.3 : 0.12;
    function kare(simdi) {
      if (!calisiyor) return;
      rafId = requestAnimationFrame(kare);
      if (!gorunur || document.hidden) return;
      const t = (simdi - bas) / 1000;

      if (!surukle) {
        ekYaw += hizYaw; hizYaw *= 0.92;          // atalet
        if (!incele) { ekYaw *= 0.985; ekPitch *= 0.95; }   // hero: salınıma dön
      }
      /* incele: çocuk dokunmadıysa kart hafifçe salınır ("beni çevir");
         dokunduktan sonra 6 sn boyunca olduğu yerde durur. */
      const salinim = secenek.salinimYok ? 0 : incele ? (simdi - sonDokunus > 6000 ? 1 : 0) : 1;
      kart.rotation.y = tabanYaw + Math.sin(t * 0.45) * (incele ? 0.22 : 0.32) * salinim + ekYaw;
      kart.rotation.x = tabanPitch + Math.sin(t * 0.7) * 0.04 * salinim + ekPitch;
      kart.position.y = Math.sin(t * 1.1) * (incele ? 0.1 : 0.18);
      golge.material.opacity = 0.85 - kart.position.y * 0.6;
      kart.updateMatrixWorld();

      /* LED: incelede sahnedeki LED'in O ANKİ durumu (ledYanik), portalda
         koddaki döngü (1 sn yanık / 1 sn sönük, faz değişince onFaz). */
      let yanik;
      if (typeof secenek.ledYanik === 'function') {
        yanik = !!secenek.ledYanik();
      } else {
        yanik = ((simdi - bas) % DONGU_MS) < DONGU_MS / 2;
        if (yanik !== sonFaz) {
          sonFaz = yanik;
          if (typeof secenek.onFaz === 'function') secenek.onFaz(yanik);
        }
      }
      const hedef = yanik ? 1 : 0;
      ledGuc += (hedef - ledGuc) * 0.35;
      ledMat.opacity = ledGuc;                // sönükken modelin krem merceği görünür
      ledIsik.intensity = ledGuc * 2.4;
      hale.material.opacity = ledGuc * 0.6;
      const guc = typeof secenek.gucYanik === 'function' ? !!secenek.gucYanik() : true;
      gucMat.emissiveIntensity = guc ? 1.2 : 0;
      gucParca.visible = guc;

      renderer.render(sahne, kamera);
      etiketleriBoya();
    }
    rafId = requestAnimationFrame(kare);

    return {
      /* Kapatınca WebGL bağlamını geri ver — tarayıcı aynı anda ancak
         sınırlı sayıda bağlam tutar, açıp kapamak birikmesin. */
      yoket: function () {
        calisiyor = false; kapandi = true;
        cancelAnimationFrame(rafId);
        if (io) io.disconnect();
        if (ro) ro.disconnect();
        sahne.traverse(function (o) {
          if (o.geometry) o.geometry.dispose();
          if (o.material) [].concat(o.material).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); });
        });
        renderer.dispose();
        renderer.forceContextLoss();
        kap.innerHTML = '';
      },
    };
  }

  return { kur: kur };
})();
