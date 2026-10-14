/* 3B Deneyap Mini v2 kartı — portal hero'su (three.js r149, UMD).
   Spec: docs/superpowers/specs/2026-09-28-hareket-katmani-design.md

   Kartın üst yüzü derslerdeki 2B çizimin KENDİSİ (BoardSVG) — kural:
   öğretici çizim her yerde aynı karttır, çocuk portalda gördüğünü derste
   de görür. Üstüne kalkan, USB-C, düğmeler, LED yuvası ve pin başlıkları
   gerçek yükseklikleriyle kabartılır. Ölçüler board-svg.js koordinatından:
   X = (x - 86) / 20, Z = (y - 160) / 20 (kart 140x268 → 7 x 13.4 birim).

   Doğrudan çağrılmaz: Hareket.kart3b() tembel yükler ve kurar. Buradaki
   tek dış sözleşme `kur(kap, { onFaz })` → true/false (kuruldu mu). */
window.Kart3B = (function () {
  'use strict';

  const W = 7, D = 13.4, T = 0.32;          // kart gövdesi
  const X = (x) => (x - 86) / 20;
  const Z = (y) => (y - 160) / 20;
  const DONGU_MS = 2000;                     // delay(1000) + delay(1000)

  function ustDoku(cb) {
    const olcek = 4;
    // Yazı stili tek kaynaktan (board-svg.js STIL_3B): resim olarak çizilen SVG'ye sayfa CSS'i ulaşmaz.
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="16 26 140 268" width="' + 140 * olcek +
      '" height="' + 268 * olcek + '"><style>' + BoardSVG.STIL_3B + '</style>' + BoardSVG.pinlerUstte(BoardSVG.groupMarkup({})) + '</svg>';
    /* Kart gövdesi Blender render'ı (board-svg.js <image>). Resim olarak çizilen
       SVG kendi içindeki dış görseli YÜKLEMEZ (tarayıcı güvenliği): önce render
       tuvale çizilir, yazılar ve LED'ler SVG'den üstüne basılır. Render kapsamı
       kart yerelinde x10..162, y12..300; tuval x16..156, y26..294 gösteriyor. */
    const c = document.createElement('canvas');
    c.width = 140 * olcek; c.height = 268 * olcek;
    const x = c.getContext('2d');
    const govde = new Image();
    const yazilar = new Image();
    let kalan = 2, hata = false;
    const bitti = function () {
      if (--kalan) return;
      if (hata) { cb(null); return; }
      x.drawImage(govde, (10 - 16) * olcek, (12 - 26) * olcek, 152 * olcek, 288 * olcek);
      x.drawImage(yazilar, 0, 0, c.width, c.height);
      cb(c);
    };
    govde.onload = yazilar.onload = bitti;
    govde.onerror = yazilar.onerror = function () { hata = true; bitti(); };
    govde.src = window.KART_GOVDE_URI || 'assets/img/kart/deneyap-kart.webp';
    yazilar.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
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

  function yaziDoku(metin, zemin, renk) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 192;
    const x = c.getContext('2d');
    x.fillStyle = zemin; x.fillRect(0, 0, 256, 192);
    x.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 6; i++) x.fillRect(24, 26 + i * 8, 90 + (i % 3) * 30, 3);
    x.fillStyle = renk; x.font = '700 34px Arial, sans-serif'; x.textAlign = 'center';
    x.fillText(metin, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
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
    if (!window.THREE || !window.BoardSVG || !kap) return false;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) { return false; }
    if (!renderer.getContext()) return false;

    const gen = () => Math.max(1, kap.clientWidth), yuk = () => Math.max(1, kap.clientHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(gen(), yuk());
    renderer.outputEncoding = THREE.sRGBEncoding;
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

    sahne.add(new THREE.HemisphereLight(0xfff6ea, 0x5a3a2c, 0.95));
    const gunes = new THREE.DirectionalLight(0xffffff, 0.85);
    gunes.position.set(-7, 14, 9);
    sahne.add(gunes);
    const dolgu = new THREE.DirectionalLight(0xffe3c4, 0.35);
    dolgu.position.set(8, 4, -6);
    sahne.add(dolgu);

    const kart = new THREE.Group();
    sahne.add(kart);

    // --- gövde: yuvarlak köşeli PCB, üst yüzde 2B çizim ---
    const kenarMat = new THREE.MeshStandardMaterial({ color: 0x8e1c15, roughness: 0.62 });
    const ustMat = new THREE.MeshStandardMaterial({ color: 0xc93c34, roughness: 0.5, metalness: 0.02 });
    const govdeGeo = new THREE.ExtrudeGeometry(yuvarlakDikdortgen(W, D, 0.62),
      { depth: T, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 8 });
    govdeGeo.rotateX(-Math.PI / 2);
    const govde = new THREE.Mesh(govdeGeo, [ustMat, kenarMat]);
    kart.add(govde);
    /* Alt yüz: ExtrudeGeometry iki kapağa da aynı dokuyu basıyor, kart ters
       çevrilince üst çizimin AYNALI kopyası görünürdü. Altına düz arka yüz. */
    const arkaGeo = new THREE.ShapeGeometry(yuvarlakDikdortgen(W + 0.06, D + 0.06, 0.65), 8);
    arkaGeo.rotateX(Math.PI / 2);
    const arka = new THREE.Mesh(arkaGeo, new THREE.MeshStandardMaterial({
      map: arkaDoku(), color: 0xffffff, roughness: 0.6 }));
    arka.position.y = -0.04;
    kart.add(arka);
    ustDoku(function (tuval) {
      if (!tuval) return;
      const t = new THREE.CanvasTexture(tuval);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      /* ExtrudeGeometry kapak UV'si şeklin kendi (x, y) koordinatı:
         [-W/2, W/2] x [-D/2, D/2] → [0, 1]'e taşı. */
      t.repeat.set(1 / W, 1 / D);
      t.offset.set(0.5, 0.5);
      ustMat.map = t;
      ustMat.color.set(0xffffff);
      ustMat.needsUpdate = true;
    });

    const ust = T + 0.03;
    const metal = new THREE.MeshStandardMaterial({ color: 0xc9cfd6, metalness: 0.85, roughness: 0.32 });

    // --- ESP32-S2 kalkanı (svg 46..122 x 70..126) ---
    const kalkanUst = new THREE.MeshStandardMaterial({ map: yaziDoku('ESP32-S2', '#b9c0c8', '#3a4450'),
      metalness: 0.7, roughness: 0.35 });
    const kalkan = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.34, 2.8),
      [metal, metal, kalkanUst, metal, metal, metal]);
    kalkan.position.set(X(84), ust + 0.17, Z(98));
    kart.add(kalkan);

    // --- USB-C (svg 68..104 x 18..32), kenardan taşar ---
    const usb = kutu(1.8, 0.42, 1.1, metal, X(86), ust + 0.21, Z(26));
    kart.add(usb);
    kart.add(kutu(1.3, 0.16, 0.05, new THREE.MeshStandardMaterial({ color: 0x1a1f26 }), X(86), ust + 0.21, Z(26) - 0.56));

    // --- BUTON / RESET ---
    const beyaz = new THREE.MeshStandardMaterial({ color: 0xeef1f4, roughness: 0.4 });
    const siyahYuvarlak = new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.5 });
    [65, 105].forEach(function (cx) {
      kart.add(kutu(1.3, 0.2, 1.1, beyaz, X(cx), ust + 0.1, Z(187)));
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 20), siyahYuvarlak);
      cap.position.set(X(cx), ust + 0.26, Z(187));
      kart.add(cap);
    });

    // --- dahili RGB LED (svg 80..88 x 223.5..231.5) ---
    kart.add(kutu(0.66, 0.16, 0.66, new THREE.MeshStandardMaterial({ color: 0x14181d }), X(84), ust + 0.08, Z(227.5)));
    const ledMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, emissive: 0x2f7bff, emissiveIntensity: 0, roughness: 0.3 });
    const led = kutu(0.42, 0.12, 0.42, ledMat, X(84), ust + 0.2, Z(227.5));
    kart.add(led);
    const ledIsik = new THREE.PointLight(0x3b8bff, 0, 5, 2);
    ledIsik.position.set(X(84), ust + 0.8, Z(227.5));
    kart.add(ledIsik);
    const hale = new THREE.Sprite(new THREE.SpriteMaterial({ map: radyal('rgba(90,160,255,0.95)', 'rgba(90,160,255,0)'),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    hale.scale.set(3.2, 3.2, 1);
    hale.position.set(X(84), ust + 0.35, Z(227.5));
    kart.add(hale);

    // --- güç LED'i: kart beslendikçe hep yanık ---
    const gucMat = new THREE.MeshStandardMaterial({ color: 0xff5a4d, emissive: 0xff2a1a, emissiveIntensity: 1.2 });
    kart.add(kutu(0.24, 0.1, 0.24, gucMat, X(84), ust + 0.05, Z(262)));

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
      ledMat.emissiveIntensity += (hedef * 2.2 - ledMat.emissiveIntensity) * 0.35;
      ledIsik.intensity += (hedef * 2.4 - ledIsik.intensity) * 0.35;
      hale.material.opacity += (hedef * 0.9 - hale.material.opacity) * 0.35;
      const guc = typeof secenek.gucYanik === 'function' ? !!secenek.gucYanik() : true;
      gucMat.emissiveIntensity = guc ? 1.2 : 0;

      renderer.render(sahne, kamera);
      etiketleriBoya();
    }
    rafId = requestAnimationFrame(kare);

    return {
      /* Kapatınca WebGL bağlamını geri ver — tarayıcı aynı anda ancak
         sınırlı sayıda bağlam tutar, açıp kapamak birikmesin. */
      yoket: function () {
        calisiyor = false;
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
