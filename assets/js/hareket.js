/* Hareket katmanı — Motion (arayüz), anime.js (SVG), three.js (3B hero).
   Spec: docs/superpowers/specs/2026-09-28-hareket-katmani-design.md

   Tek kural: hareket DURUMU asla geciktirmez. İçerik anında değişir,
   kapılar ve adım numarası hareketten bağımsızdır; bu dosya yalnızca
   görünümü canlandırır. Motor ve dersler kütüphaneleri doğrudan
   çağırmaz, `Hareket.*` çağırır — kapalıyken her çağrı sessizce no-op.

   Kapalı: prefers-reduced-motion (her bayraktan önce gelir), ?motion=off,
   otomasyon (webdriver; ?motion=on açar).
   Otomasyonda kapalı olmasının sebebi mevcut süitlerin konum/zamanlama
   ölçmesi; hareketin kendisi test-hareket.mjs'te ?motion=on ile ölçülüyor.
   Ödül anları (konfeti, XP, ses) fx.js'te kalır, burada ses YOK. */
window.Hareket = (function () {
  'use strict';

  const q = new URLSearchParams(location.search);
  const azHareket = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Çocuğun cihaz tercihi (reduced-motion) her bayraktan önce gelir.
  const aktif = !!window.Motion && !azHareket &&
    q.get('motion') !== 'off' &&
    (q.get('motion') === 'on' || !navigator.webdriver);

  /* Yay ayarları tek yerde: "yanaşma" hissi hafif sekmeli, içerik
     girişi sekmesiz. Süreler 7. sınıf gözü için — yavaş değil, fark edilir. */
  const YAY_VAGON = { type: 'spring', stiffness: 420, damping: 26 };
  const YAY_ICERIK = { type: 'spring', stiffness: 260, damping: 30 };

  /* Animasyon bitince satır içi stili temizle: kalıcı bir transform,
     içerideki position:fixed öğeler için yeni bir kap yaratır (overflow
     hidden/sticky dersini zaten bir kez yaşadık). */
  function temizle(els) {
    els.forEach(function (el) { el.style.transform = ''; el.style.opacity = ''; });
  }

  // ---------- ADIM GİRİŞİ ----------
  /* İleri basınca yeni adım sağdan, geri basınca soldan gelir; başlık,
     açıklama, kartlar sırayla. Gizli (display:none) çocuklar atlanır —
     stagger sırası boşluğa düşmesin. */
  function adim(kap, yon) {
    if (!aktif || !kap) return false;
    const cocuklar = Array.prototype.filter.call(kap.children, function (el) {
      return el.offsetParent !== null || el.getClientRects().length > 0;
    });
    if (!cocuklar.length) return false;
    const dx = yon < 0 ? -28 : 28;
    const an = Motion.animate(cocuklar,
      { opacity: [0, 1], x: [dx, 0] },
      Object.assign({ delay: Motion.stagger(0.045) }, YAY_ICERIK));
    an.finished.then(function () { temizle(cocuklar); }, function () {});
    return true;
  }

  // ---------- TREN HATTI ----------
  /* Adım noktaları istasyon: arkada ray, geçilen kısım dolu ray, aktif
     istasyonu saran vagon. Nokta düğmelerine DOKUNULMAZ (sınıfları,
     boyutları ve erişilebilirlik etiketleri motorun işi); ray yalnızca
     arkalarına eklenen süs. Hareket kapalıyken de ray görünür, sadece
     vagon kaymadan yerine konur. */
  let ray = null;

  function rayKur() {
    const kap = document.getElementById('stepDots');
    if (!kap || kap.querySelector('.ray')) return;
    kap.classList.add('ray-kurulu');
    const el = function (cls) { const s = document.createElement('span'); s.className = cls; s.setAttribute('aria-hidden', 'true'); return s; };
    ray = { kap: kap, hat: el('ray'), dolu: el('ray-dolu'), vagon: el('ray-vagon'), onceki: null };
    kap.prepend(ray.vagon);
    kap.prepend(ray.dolu);
    kap.prepend(ray.hat);
    window.addEventListener('resize', function () { rayGit(false); });
  }

  function merkez(dot) { return dot.offsetLeft + dot.offsetWidth / 2; }

  function rayGit(canli) {
    if (!ray) return;
    const dots = ray.kap.querySelectorAll('.step-dot');
    const akt = ray.kap.querySelector('.step-dot.active');
    if (!dots.length || !akt) return;
    const bas = merkez(dots[0]);
    const son = merkez(dots[dots.length - 1]);
    const hedef = merkez(akt);
    ray.hat.style.left = bas + 'px';
    ray.hat.style.width = (son - bas) + 'px';
    ray.dolu.style.left = bas + 'px';

    const vagonX = hedef - ray.vagon.offsetWidth / 2;
    const doluW = Math.max(0, hedef - bas);
    const ileri = ray.onceki == null || hedef >= ray.onceki;
    const hareketli = aktif && canli !== false && ray.onceki != null;
    ray.onceki = hedef;

    /* Dar ekranda hat kutuya sığmıyor: aktif istasyonu ortaya kaydır. */
    const k = ray.kap;
    if (k.scrollWidth > k.clientWidth + 1) {
      const sol = Math.max(0, Math.min(k.scrollWidth - k.clientWidth, hedef - k.clientWidth / 2));
      k.scrollTo({ left: sol, behavior: hareketli ? 'smooth' : 'instant' });
    }

    if (hareketli) {
      Motion.animate(ray.dolu, { width: doluW + 'px' }, { duration: 0.45, ease: [0.22, 1, 0.36, 1] });
      Motion.animate(ray.vagon, { x: vagonX }, YAY_VAGON);
      /* Yanaşma: istasyona varınca vagon bir an basılır. */
      Motion.animate(ray.vagon,
        { scaleX: [1, ileri ? 1.18 : 1.1, 1], scaleY: [1, 0.86, 1] },
        { duration: 0.42, delay: 0.16, ease: 'easeOut' });
    } else {
      ray.dolu.style.width = doluW + 'px';
      ray.vagon.style.transform = 'translateX(' + vagonX + 'px)';
    }
  }

  // ---------- SIRAYLA BELİR (portal) ----------
  /* Kartlar görünüme girince sırayla belirir. Hareket kapalıyken hiçbir
     şey gizlenmez; açıkken de yalnızca GÖRÜNÜM dışındakiler gizlenir, ki
     ilk ekranda bir şey boş görünmesin. */
  function belir(secici, kok) {
    if (!aktif) return;
    const gruplar = new Map();
    (kok || document).querySelectorAll(secici).forEach(function (el) {
      const ata = el.parentElement;
      if (!gruplar.has(ata)) gruplar.set(ata, []);
      gruplar.get(ata).push(el);
    });
    gruplar.forEach(function (els, ata) {
      els.forEach(function (el) { el.style.opacity = '0'; });
      Motion.inView(ata, function () {
        const an = Motion.animate(els,
          { opacity: [0, 1], y: [22, 0], scale: [0.97, 1] },
          Object.assign({ delay: Motion.stagger(0.07) }, YAY_ICERIK));
        an.finished.then(function () { temizle(els); }, function () {});
      }, { amount: 0.15 });
    });
  }

  // ---------- PENCERE ----------
  function pencere(kutu) {
    if (!aktif || !kutu) return;
    const an = Motion.animate(kutu,
      { opacity: [0, 1], y: [18, 0], scale: [0.94, 1] },
      { type: 'spring', stiffness: 380, damping: 28 });
    an.finished.then(function () { temizle([kutu]); }, function () {});
  }

  // ---------- KODA TIKLA ----------
  /* Satıra basınca: açıklama kutusu eski yerinden satırın altına kayar
     (FLIP, mesafe 160 px'te kırpılır — 60 satırlık kodda uçuş uzamasın),
     metin soldan sağa açılır, satırın üstünden bir tarama ışığı geçer,
     ilk kez okunan satırın ✓'i pıt diye çıkar. Durum motor tarafında
     zaten değişmiştir; burası yalnızca görünüm. */
  function kodSatiri(satir, kutu, once, yeni) {
    if (!aktif || !satir || !kutu) return;
    if (once) {
      const sonra = kutu.getBoundingClientRect();
      const dy = Math.max(-160, Math.min(160, once.top - sonra.top));
      if (Math.abs(dy) > 2) {
        Motion.animate(kutu, { y: [dy, 0], scale: [0.97, 1] }, YAY_VAGON)
          .finished.then(function () { temizle([kutu]); }, function () {});
      }
    }
    const metin = kutu.querySelector('#ctlDescText');
    if (metin) {
      Motion.animate(metin,
        { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'], opacity: [0.3, 1] },
        { duration: 0.42, ease: [0.23, 1, 0.32, 1] })
        .finished.then(function () { metin.style.clipPath = ''; metin.style.opacity = ''; }, function () {});
    }
    const isik = document.createElement('span');
    isik.className = 'ctl-tarama';
    satir.appendChild(isik);
    Motion.animate(isik, { x: ['-30%', '330%'], opacity: [0, 1, 0] }, { duration: 0.55, ease: 'easeOut' })
      .finished.then(function () { isik.remove(); }, function () { isik.remove(); });
    if (yeni) {
      const num = satir.querySelector('.ctl-num');
      if (num) Motion.animate(num, { scale: [0.3, 1.35, 1], rotate: [-25, 0] }, { type: 'spring', stiffness: 500, damping: 14 })
        .finished.then(function () { num.style.transform = ''; }, function () {});
    }
  }

  /* Koda Tıkla kart sahnesi: satırın etkisini oynatır (lesson-engine.js
     kodEtkisi). Son durum HTML'de zaten yazılı (yanık LED, ibrenin yeri,
     yazının tamamı); burası oraya nasıl gelindiğini gösterir. */
  function kodSahne(el, e) {
    if (!aktif || !el || !e) return;
    const q = function (s) { return el.querySelector(s); };
    const qa = function (s) { return Array.from(el.querySelectorAll(s)); };
    Motion.animate(el, { opacity: [0, 1], x: [14, 0] }, YAY_ICERIK)
      .finished.then(function () { temizle([el]); }, function () {});
    if (e.tip === 'yaz') {
      const led = q('.ks-led');
      if (e.yuksek) {
        const nok = qa('.ks-tel i');
        Motion.animate(nok, { left: ['0%', '100%'], opacity: [0, 1, 0] },
          { duration: 0.5, ease: 'easeIn', delay: Motion.stagger(0.09) });
        if (led) Motion.animate(led, { scale: [0.85, 1.18, 1], filter: ['brightness(0.45)', 'brightness(1.35)', 'brightness(1)'] },
          { duration: 0.55, delay: 0.42, ease: 'easeOut' })
          .finished.then(function () { led.style.transform = ''; led.style.filter = ''; }, function () {});
      } else if (led) {
        Motion.animate(led, { filter: ['brightness(1.6)', 'brightness(1)'], scale: [1.06, 1] }, { duration: 0.45, ease: 'easeOut' })
          .finished.then(function () { led.style.transform = ''; led.style.filter = ''; }, function () {});
      }
    } else if (e.tip === 'isim') {
      const et = q('.ks-etiket'), cip = q('.ks-cip');
      if (et) Motion.animate(et, { x: [-26, 0], rotate: [-8, 0], opacity: [0, 1] }, YAY_VAGON);
      if (cip) Motion.animate(cip, { scale: [1, 1.18, 1] }, { duration: 0.4, delay: 0.25 });
    } else if (e.tip === 'mod') {
      const ok = q('.ks-yon i');
      const yon = e.mod === 'OUTPUT' ? 1 : -1;
      if (ok) Motion.animate(ok, { x: [-12 * yon, 0], opacity: [0, 1] }, { duration: 0.5, repeat: 2, ease: 'easeOut' })
        .finished.then(function () { ok.style.transform = ''; ok.style.opacity = ''; }, function () {});
    } else if (e.tip === 'bekle') {
      const ibre = q('.ks-ibre'), sayi = q('.ks-not b');
      const sure = Math.min(Math.max(e.ms, 300), 1600) / 1000;
      if (ibre) Motion.animate(ibre, { rotate: [0, (e.ms / 1000) * 360] }, { duration: sure, ease: 'linear' });
      if (sayi) {
        const t0 = performance.now();
        const adim = function (t) {
          const k = Math.min(1, (t - t0) / (sure * 1000));
          sayi.textContent = Math.round(e.ms * k);
          if (k < 1 && sayi.isConnected) requestAnimationFrame(adim);
        };
        requestAnimationFrame(adim);
      }
    } else if (e.tip === 'baslat') {
      Motion.animate(qa('.ks-nokta i'), { opacity: [0.2, 1, 0.2], scale: [0.7, 1.2, 0.7] },
        { duration: 0.6, repeat: 2, delay: Motion.stagger(0.12) });
    } else if (e.tip === 'seri') {
      const satir = q('.ks-satir');
      if (satir) {
        const metin = e.metin;
        satir.textContent = '';
        satir.classList.add('is-yaziyor');
        let k = 0;
        const zaman = setInterval(function () {
          k++;
          satir.textContent = metin.slice(0, k);
          if (k >= metin.length || !satir.isConnected) {
            clearInterval(zaman);
            satir.textContent = metin;
            satir.classList.remove('is-yaziyor');
          }
        }, 70);
      }
    } else if (e.tip === 'oku') {
      const b = q('.ks-buton');
      if (b) Motion.animate(b, { y: [0, 5, 0], scale: [1, 0.93, 1] }, { duration: 0.45, repeat: 1, ease: 'easeInOut' })
        .finished.then(function () { b.style.transform = ''; }, function () {});
    }
  }

  /* Hata kartı (Blender yakın çekimi): yanlışta sorunlu noktada kırmızı
     halka atar ve resim hafifçe titrer; doğruya geçişte resimler çapraz
     erir (CSS), halka yeşile döner ve doğru yere kayar (CSS left/top
     geçişi), LED'in yandığı an küçük bir parlama. Seri hız kartında:
     bozuk işaretler akar, doğruya geçişte hız 9600'den 115200'e sayar ve
     temiz yazı daktiloyla gelir. */
  function hataGecis(resim, yanlis) {
    if (!aktif || !resim) return;
    const halka = resim.querySelector('.hata-halka');
    if (halka) {
      Motion.animate(halka, { scale: yanlis ? [0.4, 1.25, 1] : [1.4, 0.9, 1], opacity: [0, 1] },
        { duration: 0.6, ease: 'easeOut' });
      if (yanlis) Motion.animate(resim, { x: [0, -5, 5, -3, 0] }, { duration: 0.42, delay: 0.25 })
        .finished.then(function () { temizle([resim]); }, function () {});
      else Motion.animate(resim, { filter: ['brightness(1)', 'brightness(1.18)', 'brightness(1)'] }, { duration: 0.7, delay: 0.25 })
        .finished.then(function () { resim.style.filter = ''; }, function () {});
    }
    const yazi = resim.querySelector('.hs-yazi'), hiz = resim.querySelector('.hs-hiz-deger');
    if (yazi && hiz) {
      clearInterval(resim._seri);
      if (yanlis) {
        const cop = 'ÿ⸮x¿Ð▒þ§¤ø';
        let n = 0;
        yazi.textContent = '';
        resim._seri = setInterval(function () {
          if (!resim.isConnected || !resim.classList.contains('is-yanlis')) { clearInterval(resim._seri); return; }
          yazi.textContent = (yazi.textContent + cop[Math.floor(Math.random() * cop.length)]).slice(-22);
          if (++n % 11 === 0) yazi.textContent += '\n';
        }, 70);
      } else {
        const t0 = performance.now();
        const say = function (t) {
          const k = Math.min(1, (t - t0) / 700);
          hiz.textContent = Math.round(9600 + (115200 - 9600) * k * k);
          if (k < 1) requestAnimationFrame(say);
        };
        requestAnimationFrame(say);
        const metin = 'KIRMIZI\nYESIL';
        let i = 0;
        yazi.textContent = '';
        setTimeout(function () {
          resim._seri = setInterval(function () {
            i++;
            yazi.textContent = metin.slice(0, i);
            if (i >= metin.length || !resim.isConnected) { clearInterval(resim._seri); yazi.innerHTML = 'KIRMIZI<br>YESIL'; }
          }, 75);
        }, 700);
      }
    }
    const etiket = resim.parentElement && resim.parentElement.querySelector('.hata-etiket');
    if (etiket) Motion.animate(etiket, { scale: [0.6, 1.15, 1] }, { duration: 0.4, ease: 'easeOut' })
      .finished.then(function () { etiket.style.transform = ''; }, function () {});
  }

  function merakYazi(el) {
    if (!aktif || !el) return;
    Motion.animate(el, { opacity: [0, 1], y: [6, 0] }, { duration: 0.35, ease: 'easeOut' })
      .finished.then(function () { temizle([el]); }, function () {});
  }

  /* Bütün satırlar çözülünce yukarıdan aşağı bir dalga: her satır sırayla
     hafifçe sağa kayıp yerine döner. Ödülün kendisi (ses, konfeti) fx.js'te. */
  function kodBitti(satirlar) {
    if (!aktif || !satirlar || !satirlar.length) return;
    const els = Array.from(satirlar);
    Motion.animate(els, { x: [0, 8, 0] },
      { duration: 0.36, ease: 'easeOut', delay: Motion.stagger(Math.min(0.03, 0.9 / els.length)) })
      .finished.then(function () { temizle(els); }, function () {});
  }

  // ---------- SAYFADAN ÇIKIŞ (sonraki derse geçerken) ----------
  /* İçerik yukarı kayıp söner, sonra git. Emniyet: animasyon ne olursa
     olsun 450 ms'de git çağrılır — geçiş asla hareket yüzünden takılmaz. */
  function cikis(git) {
    if (!aktif) { git(); return; }
    const emniyet = setTimeout(git, 450);
    const el = document.querySelector('.fentop-container') || document.body;
    Motion.animate(el, { opacity: [1, 0], y: [0, -18] }, { duration: 0.28, ease: 'easeIn' })
      .finished.then(function () { clearTimeout(emniyet); git(); }, function () {});
  }

  // ================= anime.js: SVG =================
  const animeAcik = aktif && !!window.anime;
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* Kalem ucu: kablo çizilirken ucunda parlayan bir nokta yolu takip eder.
     Çizim CSS'te (wd-draw, --wd-ease, 620ms); uç AYNI eğriyle ve aynı
     sürede gider — ikisi de yolun uzunluk oranıyla ilerlediği için uç
     tam çizginin başında kalır. */
  const WD_EASE = animeAcik ? anime.cubicBezier(0.23, 1, 0.32, 1) : null;

  /* "Tık": bir bacak/iğne deliğe girdiği an delikte açılan halka. Çocuk
     parçanın NEREYE girdiğini gözüyle yakalasın diye — sütun kuralının
     görsel karşılığı. */
  function tik(svg, x, y, gecikme) {
    if (!animeAcik || !svg) return;
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'hk-tik');
    g.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
    const halka = document.createElementNS(SVGNS, 'circle');
    halka.setAttribute('r', '3');
    halka.setAttribute('class', 'hk-tik-halka');
    const nokta = document.createElementNS(SVGNS, 'circle');
    nokta.setAttribute('r', '2.4');
    nokta.setAttribute('class', 'hk-tik-nokta');
    g.appendChild(halka); g.appendChild(nokta);
    svg.appendChild(g);
    anime.animate(halka, { r: [3, 13], opacity: [0.95, 0], strokeWidth: [2.4, 0.6],
      duration: 520, delay: gecikme || 0, ease: 'outCubic' });
    sutunDalgasi(svg, x, y, (gecikme || 0) + 60);
    anime.animate(nokta, { opacity: [0.9, 0], duration: 420, delay: gecikme || 0, ease: 'outQuad',
      onComplete: function () { g.remove(); } });
  }

  /* Sütun dalgası: bacak bir deliğe girince AYNI SÜTUNUN (aynı blok) bütün
     delikleri, girilen delikten dışarı doğru sırayla yanar. "Aynı sütundaki
     delikler bağlıdır" kuralı metinle değil gözle görülür (anime stagger,
     from = girilen delik). Kanal (y 135..151) blokları ayırır: dalga
     kanalı geçmez — gerçek tahtada da geçmez. */
  const KANAL_UST = 135, KANAL_ALT = 151;
  function sutunDalgasi(svg, x, y, gecikme) {
    if (!animeAcik || !svg) return;
    const ustBlok = y < KANAL_UST;
    const delikler = Array.prototype.filter.call(svg.querySelectorAll('.wd-hole'), function (h) {
      const hx = +h.getAttribute('x') + 3, hy = +h.getAttribute('y') + 3;
      return Math.abs(hx - x) < 1 && (ustBlok ? hy < KANAL_UST : hy > KANAL_ALT);
    }).sort(function (a, b) { return +a.getAttribute('y') - +b.getAttribute('y'); });
    if (delikler.length < 2) return;
    let from = 0, enYakin = Infinity;
    delikler.forEach(function (h, i) {
      const d = Math.abs(+h.getAttribute('y') + 3 - y);
      if (d < enYakin) { enYakin = d; from = i; }
    });
    /* Deliğin kendi rengine dokunulmaz: rehberdeki sütunun delikleri CSS
       ile nabız atıyor (is-pulse) ve CSS animasyonu satır içi rengi ezer —
       ölçüldü, dalga görünmüyordu. Her deliğin üstüne geçici bir parıltı. */
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'hk-dalga');
    const pariltilar = delikler.map(function (h) {
      const c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', +h.getAttribute('x') + 3);
      c.setAttribute('cy', +h.getAttribute('y') + 3);
      c.setAttribute('r', '4.6');
      g.appendChild(c);
      return c;
    });
    svg.appendChild(g);
    anime.animate(pariltilar, {
      opacity: [{ from: 0, to: 0.95, duration: 130 }, { to: 0, duration: 480 }],
      r: [{ from: 2.5, to: 5.4, duration: 130 }, { to: 4, duration: 480 }],
      delay: anime.stagger(70, { from: from, start: gecikme || 0 }),
      ease: 'outQuad',
      onComplete: function () { g.remove(); },
    });
  }

  function kalemUcu(yol, sureMs, delikler) {
    if (!animeAcik || !yol) return null;
    const svg = yol.ownerSVGElement;
    const uc = document.createElementNS(SVGNS, 'circle');
    uc.setAttribute('r', '4.2');
    uc.setAttribute('class', 'hk-kalem');
    yol.parentNode.appendChild(uc);
    const yolAnim = anime.createMotionPath(yol);
    // İlk iğne kalem kalkmadan deliğe girer; ikincisi kalem varınca.
    if (delikler && delikler[0]) tik(svg, delikler[0][0], delikler[0][1]);
    return anime.animate(uc, {
      translateX: yolAnim.translateX,
      translateY: yolAnim.translateY,
      duration: sureMs || 620,
      ease: WD_EASE,
      onComplete: function () {
        if (delikler && delikler[1]) tik(svg, delikler[1][0], delikler[1][1]);
        anime.animate(uc, { opacity: [1, 0], scale: [1, 2.2], duration: 260, ease: 'outQuad',
          onComplete: function () { uc.remove(); } });
      },
    });
  }

  /* Takma: parça yukarıdan hafif eğik gelir, bacakları deliklerin
     üstünde hizalanır, bir an durur, bastırılır (hafif basılma), delikte
     "tık". Gerçek tezgahta çocuğun elinin yaptığı hareketin aynısı:
     hizala → bastır. transform-origin CSS'te (.wd-drop: fill-box, alt orta). */
  function tak(parca, delikler) {
    if (!animeAcik || !parca) return null;
    birak(parca);
    const svg = parca.ownerSVGElement;
    const tl = anime.createTimeline({
      onComplete: function () { parca.style.transform = ''; parca.style.opacity = ''; },
    });
    tl.add(parca, { opacity: [0, 1], translateY: [-42, -11], rotate: [-5, 0], duration: 420, ease: 'outCubic' })
      .add(parca, { translateY: [-11, -9], duration: 150, ease: 'inOutSine' })
      .add(parca, { translateY: [-9, 0], scaleY: [1, 0.95], duration: 130, ease: 'inQuad' })
      .call(function () {
        (delikler || []).forEach(function (d, i) { tik(svg, d[0], d[1], i * 40); });
      })
      .add(parca, { scaleY: [0.95, 1], duration: 260, ease: 'outBack(3)' });
    parca._hkTak = tl;
    return tl;
  }

  /* Parça sahneden kalkarken yarıda kalmış takma/kalem hareketini
     durdur ve satır içi stili temizle — yoksa inline opacity .is-ghost'u
     ezer (wd-place'in fill-mode hatasının aynısı). */
  function birak(parca) {
    if (!parca || !window.anime) return;
    if (parca._hkTak) { parca._hkTak.pause(); parca._hkTak = null; }
    anime.remove(parca);
    parca.style.transform = '';
    parca.style.opacity = '';
    parca.querySelectorAll('.hk-kalem').forEach(function (k) { anime.remove(k); k.remove(); });
  }

  /* Devre kapanış anı: akımın İLK turu tek seferlik bir iz olarak
     D5 → kırmızı kablo → LED (parlar) → siyah kablo → GND. Sürekli dönen
     kıvılcımlar (wd-flow) yerinde kalır; bu yalnızca "devre şimdi
     tamamlandı" anını gösterir. */
  function akimIzi(svg) {
    if (!animeAcik || !svg) return null;
    const kirmizi = svg.querySelector('#wd-path-red');
    const siyah = svg.querySelector('#wd-path-black');
    const led = svg.querySelector('.wd-led-glow');
    if (!kirmizi || !siyah) return null;
    const iz = function (yol) {
      const c = yol.cloneNode(false);
      c.removeAttribute('id');
      c.removeAttribute('stroke');
      c.setAttribute('class', 'hk-iz');
      yol.parentNode.appendChild(c);
      return c;
    };
    const a = iz(kirmizi), b = iz(siyah);
    const kuyruk = ['0 0', '0 0.28', '0.72 1', '1 1'];
    const tl = anime.createTimeline({
      onComplete: function () { a.remove(); b.remove(); },
    });
    tl.add(anime.createDrawable(a), { draw: kuyruk, duration: 950, ease: 'inOutSine' });
    if (led) {
      led.style.transformBox = 'fill-box';
      led.style.transformOrigin = '50% 50%';
      tl.add(led, { scale: [1, 1.6, 1], duration: 520, ease: 'outQuad' }, '-=180');
    }
    tl.add(anime.createDrawable(b), { draw: kuyruk, duration: 1050, ease: 'inOutSine' }, '-=260');
    return tl;
  }

  /* Portal kod önizlemesi daktiloyla yazılır. Renklendirme <span>'ları
     korunur: yalnızca metin düğümleri harf harf sarılır. İmleç son
     yazılan harfin arkasından gelir. */
  function daktilo(kod, harfMs) {
    if (!animeAcik || !kod) return null;
    harfMs = harfMs || 16;
    const harfler = [];
    (function yuru(el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        if (n.nodeType !== 3) { yuru(n); return; }
        const frag = document.createDocumentFragment();
        Array.from(n.textContent).forEach(function (ch) {
          const s = document.createElement('span');
          s.className = 'hk-harf';
          s.textContent = ch;
          frag.appendChild(s);
          harfler.push(s);
        });
        n.replaceWith(frag);
      });
    })(kod);
    const imlec = document.createElement('span');
    imlec.className = 'hk-imlec';
    imlec.setAttribute('aria-hidden', 'true');
    kod.appendChild(imlec);
    kod.classList.add('hk-yaziliyor');
    let gorunen = 0;
    return anime.createTimer({
      delay: 450,
      duration: harfler.length * harfMs,
      onUpdate: function (t) {
        const hedef = Math.min(harfler.length, Math.ceil(t.currentTime / harfMs));
        while (gorunen < hedef) harfler[gorunen++].classList.add('hk-gorundu');
        if (gorunen) harfler[gorunen - 1].after(imlec);
      },
      onComplete: function () {
        harfler.forEach(function (h) { h.classList.add('hk-gorundu'); });
        kod.classList.remove('hk-yaziliyor');
        kod.appendChild(imlec);
      },
    });
  }

  // ================= three.js: portal 3B kartı =================
  function scriptYukle(src) {
    return new Promise(function (ok, hata) {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = hata;
      document.head.appendChild(s);
    });
  }

  /* Koddaki hangi satırlar o an çalışıyor: LED yanıkken "yak + bekle"
     (satır 4-5), sönükken "söndür + bekle" (satır 6-7). Vurgu şeridi
     satır yüksekliğinden hesaplanır — kod metnine dokunulmaz (daktilo
     harf harf sardığı için metni satırlara bölmek onunla çakışırdı). */
  function kodVurgu(pre) {
    if (!pre) return function () {};
    const serit = document.createElement('div');
    serit.className = 'hk-satir-vurgu';
    serit.setAttribute('aria-hidden', 'true');
    pre.prepend(serit);
    pre.classList.add('hk-vurgulu');
    return function (yanik) {
      const cs = getComputedStyle(pre);
      const satir = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.9;
      const ilk = yanik ? 4 : 6;
      serit.style.top = (parseFloat(cs.paddingTop) + ilk * satir) + 'px';
      serit.style.height = (2 * satir) + 'px';
      serit.classList.toggle('is-yanik', yanik);
    };
  }

  /* Hero görünüme girince three.js + kart çizimi yüklenir, kart kurulur.
     Hareket kapalıysa hiçbir şey yüklenmez; WebGL yoksa kap boş kalır ve
     hero bugünkü gibi durur. */
  function kart3b(kap, kodPre, durumNokta) {
    if (!aktif || !kap) return;
    const baslat = function () {
      const yukle = [];
      if (!window.THREE) yukle.push(scriptYukle('assets/vendor/three.min.js'));
      if (!window.BoardSVG) yukle.push(scriptYukle('assets/js/board-svg.js'));
      // Kart gövdesi render'ı data: adresiyle (file:// tuvali kirletmesin, bkz. kart3b.js).
      if (!window.KART_GOVDE_URI) yukle.push(scriptYukle('assets/img/kart/deneyap-kart-uri.js'));
      Promise.all(yukle).then(function () {
        const vurgu = kodVurgu(kodPre);
        const kuruldu = window.Kart3B && Kart3B.kur(kap, {
          onFaz: function (yanik) {
            vurgu(yanik);
            if (durumNokta) durumNokta.classList.toggle('is-yanik', yanik);
          },
        });
        if (!kuruldu) return;
        kap.classList.add('is-kurulu');
        if (durumNokta) durumNokta.classList.add('hk-senkron');
        const hero = kap.closest('.portal-hero');
        if (hero) hero.classList.add('hk-3b-acik');
        Motion.animate(kap, { opacity: [0, 1], y: [30, 0], scale: [0.9, 1] },
          { type: 'spring', stiffness: 160, damping: 20, delay: 0.25 });
      }, function () { /* yüklenemedi: hero olduğu gibi kalır */ });
    };
    /* Kap kurulana kadar display:none — görünüme hiç girmez; ebeveyni izle. */
    Motion.inView(kap.parentElement || kap, function () { baslat(); }, { amount: 0.1 });
  }

  /* Ders 1.1 — "3B çevir": sahne (laptop, kablo, fiş, keşif bölgeleri)
     piksel hizalı kaldığı için kart YERİNDE 3B olmuyor; düğmeyle aynı
     kartın 3B hali açılır, çocuk çevirip arkasındaki pinlere bakar, parça
     adlarını görür. Sahnedeki LED ve güç ışığıyla AYNI anda yanar.
     Çocuğun eliyle açtığı bir araç olduğu için reduced-motion'da da var
     (yalnızca kendi kendine salınmaz); otomasyonda (eski süitler) yok. */
  const ucBoyut = !!window.Motion && q.get('motion') !== 'off' &&
    (q.get('motion') === 'on' || !navigator.webdriver);

  function kartIncele(kutu, secenek) {
    if (!ucBoyut || !kutu) return;
    const tc = document.createElement('canvas');
    let webgl = false;
    try { webgl = !!(tc.getContext('webgl') || tc.getContext('experimental-webgl')); } catch (e) {}
    if (!webgl) return;

    const dugme = document.createElement('button');
    dugme.type = 'button';
    dugme.className = 'hk-3b-ac';
    dugme.innerHTML = '<span aria-hidden="true">⟳</span> 3B çevir';
    dugme.setAttribute('aria-label', 'Kartı 3B incele: çevir, arkasına bak');
    kutu.appendChild(dugme);

    let pano = null, kart = null;
    function kapat() {
      if (kart) { kart.yoket(); kart = null; }
      if (pano) { pano.remove(); pano = null; }
      dugme.hidden = false;
      dugme.focus();
    }
    dugme.addEventListener('click', function () {
      const yukle = [];
      if (!window.THREE) yukle.push(scriptYukle('assets/vendor/three.min.js'));
      if (!window.BoardSVG) yukle.push(scriptYukle('assets/js/board-svg.js'));
      if (!window.Kart3B) yukle.push(scriptYukle('assets/js/kart3b.js'));
      if (!window.KART_GOVDE_URI) yukle.push(scriptYukle('assets/img/kart/deneyap-kart-uri.js'));
      dugme.disabled = true;
      Promise.all(yukle).then(function () {
        dugme.disabled = false;
        pano = document.createElement('div');
        pano.className = 'hk-3b-incele';
        pano.innerHTML = '<div class="hk-3b-sahne"></div>' +
          '<p class="hk-3b-ipucu">Sürükle: kartı çevir. Ters çevir: pinleri gör.</p>' +
          '<button type="button" class="hk-3b-kapat">✕ Kapat</button>';
        kutu.appendChild(pano);
        pano.querySelector('.hk-3b-kapat').addEventListener('click', kapat);
        kart = Kart3B.kur(pano.querySelector('.hk-3b-sahne'), Object.assign({
          mod: 'incele', salinimYok: azHareket,
        }, secenek || {}));
        if (!kart) { kapat(); return; }
        dugme.hidden = true;
        if (aktif) Motion.animate(pano, { opacity: [0, 1], scale: [0.96, 1] }, { type: 'spring', stiffness: 300, damping: 26 });
      }, function () { dugme.disabled = false; });
    });
  }

  // ================= Cüzdan anları (2026-09-30) =================
  /* Pul uçuşu: ödül noktasından başlıktaki Altın göstergesine yay.
     En çok 5 pul, 60 ms arayla; hedefte gösterge bir kez "tık"lar.
     Tam transform dizesi (x/y kısaltması yükte kare düşürüyor). */
  function pulUcur(kaynak, hedef, adet) {
    if (!aktif || !kaynak || !hedef || !window.Ikon) return Promise.resolve();
    const a = kaynak.getBoundingClientRect(), b = hedef.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const isler = [];
    /* 2026-10-05 (plan Aşama 3): pul Blender'da kendi ekseninde dönen 3B
       altın (blender/efekt3b.py pul-don). Yol motion design: kaynaktan
       fırlar, yere düşüp iki kez seker, sonra göstergeye akar. */
    const n = Math.min(adet || 3, 5);
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'pul-ucan';
      el.innerHTML = '<img src="assets/img/fx/pul-don.webp" width="26" height="26" alt="" draggable="false" style="display:block">';
      el.style.cssText = 'position:fixed;left:' + (a.left + a.width / 2 - 13) + 'px;top:' +
        (a.top + a.height / 2 - 13) + 'px;z-index:9300;pointer-events:none;';
      document.body.appendChild(el);
      const yan = (i - (n - 1) / 2) * 34 + (Math.random() - 0.5) * 10;   // yelpaze gibi açılır
      const zemin = 46 + (i % 2) * 8;                                     // düştüğü yer (kaynağın altı)
      const t = (x, y, s) => 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s + ')';
      const an = el.animate([
        { transform: t(0, 0, 0.5), opacity: 0, offset: 0 },
        { transform: t(yan * 0.6, -58, 1.05), opacity: 1, offset: 0.16, easing: 'cubic-bezier(.3,0,.7,1)' },
        { transform: t(yan, zemin, 1), offset: 0.34, easing: 'cubic-bezier(.2,.6,.4,1)' },
        { transform: t(yan * 1.1, zemin - 22, 1), offset: 0.42, easing: 'cubic-bezier(.6,0,.8,.6)' },
        { transform: t(yan * 1.18, zemin, 1), offset: 0.5, easing: 'cubic-bezier(.2,.6,.4,1)' },
        { transform: t(yan * 1.22, zemin - 7, 1), offset: 0.55, easing: 'cubic-bezier(.6,0,.8,.6)' },
        { transform: t(yan * 1.24, zemin, 1), offset: 0.6, easing: 'cubic-bezier(.55,0,.25,1)' },
        { transform: t(dx, dy, 0.7), opacity: 1, offset: 1 }
      ], { duration: 1500, delay: i * 70, fill: 'both' });
      isler.push(an.finished.then(() => el.remove(), () => el.remove()));
    }
    return Promise.all(isler).then(() => {
      Motion.animate(hedef, { transform: ['scale(1)', 'scale(1.14)', 'scale(1)'] }, { duration: 0.28 });
    });
  }

  /* Seri anı: kutu gelir, alev büyür, sayı yukarıdan döner, bonus belirir.
     Nadir (haftada bir) bir ödül anı: gecikme bütçesi burada. */
  function seriAni(kutu) {
    if (!animeAcik || !kutu) return;
    const tl = anime.createTimeline({ defaults: { ease: 'outCubic' } });
    tl.add(kutu, { opacity: [0, 1], translateY: [16, 0], duration: 260 })
      .add(kutu.querySelector('.ikon-alev'), { scale: [0.7, 1.25, 1], duration: 520, ease: 'outBack' }, '-=120')
      .add(kutu.querySelector('.seri-sayi'), { translateY: [18, 0], opacity: [0, 1], duration: 300 }, '-=260')
      .add(kutu.querySelector('.seri-bonus'), { opacity: [0, 1], scale: [0.9, 1], duration: 240 }, '-=80');
  }

  return {
    pulUcur: pulUcur,
    seriAni: seriAni,
    get aktif() { return aktif; },
    get animeAcik() { return animeAcik; },
    kart3b: kart3b,
    kartIncele: kartIncele,
    adim: adim,
    rayKur: rayKur,
    rayGit: rayGit,
    belir: belir,
    pencere: pencere,
    cikis: cikis,
    kalemUcu: kalemUcu,
    tak: tak,
    birak: birak,
    tik: tik,
    sutunDalgasi: sutunDalgasi,
    akimIzi: akimIzi,
    daktilo: daktilo,
    kodSatiri: kodSatiri,
    kodBitti: kodBitti,
    kodSahne: kodSahne,
    merakYazi: merakYazi,
    hataGecis: hataGecis,
  };
})();
