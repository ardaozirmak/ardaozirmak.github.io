/* ============================================================
   PORTAL (ANASAYFA) MANTIĞI
   ============================================================
   Ders sayfaları tamamlanınca script.js içindeki renderStepContent()
   'badge_lesson_X_Y' anahtarıyla Store'a (localStorage'ın tek kapısı)
   rozet yazıyor (bkz. index.html -> Store.set('badge_lesson_1_1', 'earned')).
   Portal bu anahtarları okuyarak ilerleme çubuğunu ve ders
   kartlarının durumunu günceller. Henüz sayfası yapılmamış dersler
   ("open: false") listede durur ama EKRANA GELMEZ ve sayılmaz (Arda,
   2026-09-28: "yakında falan demesin, direkt orada olmasın").
   ============================================================ */

(function () {
  'use strict';

  const LESSONS = [
    {
      id: '1_1', num: '1.1', icon: 'icon-bulb',
      title: "Deneyap Mini'nin Dahili LED'i",
      desc: 'Dahili LED kontrolü, HIGH/LOW mantığı, gecikme hesabı ve frekans illüzyonu.',
      hw: 'Web\'den kodu kopyala → Arduino IDE\'ye yapıştır → Mavi LED\'in yanıp sönmesini gözle.',
      href: 'index.html', open: true
    },
    {
      id: '1_2', num: '1.2', icon: 'icon-breadboard',
      title: 'Harici LED Devresi',
      desc: 'Breadboard yapısı, anot/katot kutupları, koruyucu direnç mantığı.',
      hw: 'Animasyonlu rehberle devreyi kur → Kodu yapıştır → Harici LED\'i çalıştır.',
      href: 'lesson-1-2.html', open: true
    },
    /* 1.3 ve sonrası: numara ve sıra dk deposundaki Portal-Ders-Haritasi.md'den
       (Özgür, 2026-09-24 — 12 modüllü yapı). Modül 1 artık yalnızca LED; seri
       port Modül 2'ye taşındı. Numara burada uydurulmaz, haritadan alınır. */
    {
      id: '1_3', num: '1.3', icon: 'icon-zap',
      title: "LED'i Hızlandır",
      desc: "delay() ile hız merdiveni: LED'in söndüğünü artık göremediğin hızı (görme eşiği) kendin bul.",
      hw: "Ders 1.2'nin devresi aynen kalır → delay sayısını küçült → eşiği defterine yaz.",
      href: 'lesson-1-3.html', open: true
    },
    {
      id: '1_4', num: '1.4', icon: 'icon-repeat',
      title: 'İki LED',
      desc: "İkinci LED D6'ya; iki LED birbirinin zıttı çalışır, pinlere sayı yerine isim verilir.",
      hw: "İkinci LED'i D6'ya ekle → biri yanarken öteki sönsün → pinlere isim ver.",
      href: 'lesson-1-4.html', open: true
    },
    {
      id: '1_5', num: '1.5', icon: 'icon-broadcast',
      title: 'Kara Şimşek',
      desc: 'Dört LED arasında gidip gelen ışık; kodun neden uzadığını görmek (kod tekrarı).',
      hw: "Dört LED'i tek sıraya diz (D5/D6/D9/D10) → ışığı sağa sola koştur.",
      href: 'lesson-1-5.html', open: true
    },
    {
      id: '1_6', num: '1.6', icon: 'icon-dice',
      title: 'Trafik Lambası',
      desc: 'Kırmızı, sarı ve yeşil rolleriyle gerçek bir trafik lambası; öğrendiklerini tek işte birleştir.',
      hw: "Trafik lambası modülünü breadboard'a tak, R/Y/G'yi D5/D6/D9'a bağla → 4 sn kırmızı, 3 sn yeşil, 1 sn sarı.",
      href: 'lesson-1-6.html', open: true
    },
    /* Modül 2: LED + Seri Port (haritada 2.1 dk0040, 2.2 dk0160). 2.1, 3.1'in (buton) önkoşulu. */
    {
      id: '2_1', num: '2.1', icon: 'icon-search', modul: 2,
      title: "LED Durumunu Seri Monitör'e Yaz",
      desc: 'Kart bilgisayara yazı gönderir: LED yanınca YANDI, sönünce SONDU. Seri Monitör ve 115200 hızı.',
      hw: "Tek LED D5'te (1.6'nın devresi duruyorsa sökme) → kodu yükle → Seri Port Ekranı'nı aç.",
      href: 'lesson-2-1.html', open: true
    },
    {
      id: '2_2', num: '2.2', icon: 'icon-dice', modul: 2,
      title: 'Trafik Lambası Rengini Yazsın',
      desc: "Trafik lambası çalışırken yanan rengin adı Seri Monitör'e gelir: KIRMIZI, YESIL, SARI.",
      hw: "1.6'nın trafik lambası modülü duruyorsa dokunma → kodu yükle → Seri Port Ekranı'nı 115200'de aç.",
      href: 'lesson-2-2.html', open: true
    },
    /* Modül 3: Buton (haritada 3.1 dk0050). İçerik önkoşulu 2.1 (Ortak, 2026-10-06); sekme kilidi
       sıralı olduğu için portalda 2.2'den sonra açılır. */
    {
      id: '3_1', num: '3.1', icon: 'icon-bulb', modul: 3,
      title: 'Butona Basınca LED Yansın',
      desc: 'Kart ilk kez dışarıdan bilgi okur: digitalRead, INPUT ve if / else. 10K pull-down direnç.',
      hw: "LED D9'da, buton D10'da → butona basılı tut → LED parmağını takip etsin.",
      href: 'lesson-3-1.html', open: true
    }
  ];
  /* Her modülün kendi kartı (portal.html #modul1, #modul2). Dersin `modul` alanı yoksa 1. */
  const MODULLER = [
    { no: 1, kart: 'modul1', grid: 'lessonGrid', pill: 'modulePill', fill: 'moduleProgressFill' },
    { no: 2, kart: 'modul2', grid: 'lessonGrid2', pill: 'modulePill2', fill: 'moduleProgressFill2' },
    { no: 3, kart: 'modul3', grid: 'lessonGrid3', pill: 'modulePill3', fill: 'moduleProgressFill3' }
  ];
  const modulu = (l) => l.modul || 1;

  function isDone(lesson) {
    return Store.get('badge_lesson_' + lesson.id) === 'earned';
  }

  function renderLessons() {
    const activeId = (LESSONS.find((l) => l.open && !isDone(l)) || {}).id;
    MODULLER.forEach((m) => {
      const grid = document.getElementById(m.grid);
      const kart = document.getElementById(m.kart);
      if (!grid) return;
      const dersler = LESSONS.filter((l) => l.open && modulu(l) === m.no);
      if (kart) {
        kart.hidden = !dersler.length;
        // Modül rengi (styles.css [data-modul]): 1 kırmızı, 2 mavi, 3 turuncu.
        kart.dataset.modul = String(m.no);
      }
      grid.innerHTML = kartlar(dersler, activeId);
    });
  }

  // Yalnızca açık dersler (bkz. dosya başı): "Yakında" kartı yok.
  function kartlar(dersler, activeId) {
    return dersler.map((l) => {
      const done = isDone(l);
      const clickable = l.open;
      const featured = l.id === activeId;
      const tag = clickable ? 'a' : 'div';
      const hrefAttr = clickable ? ` href="${l.href}"` : '';

      let statusHtml;
      if (done) statusHtml = '<span class="lesson-card-status done"><svg class="icon"><use href="#icon-check"/></svg>Tamamlandı</span>';
      else if (clickable) statusHtml = '<span class="lesson-card-status open"><svg class="icon"><use href="#icon-play"/></svg>Başla</span>';
      else statusHtml = '<span class="lesson-card-status soon"><svg class="icon"><use href="#icon-lock"/></svg>Yakında</span>';

      const classes = ['lesson-card', clickable ? 'is-open' : 'is-locked', featured ? 'is-featured' : ''].join(' ').trim();

      return `
        <${tag} class="${classes}"${hrefAttr}>
          <div class="lesson-card-top">
            <span class="lesson-card-num">${l.num}</span>
            <svg class="icon lesson-card-icon"><use href="#${l.icon}"/></svg>
          </div>
          <div class="lesson-card-title">${l.title}</div>
          <p class="lesson-card-desc">${l.desc}</p>
          <div class="lesson-card-hw"><strong>Donanım:</strong> ${l.hw}</div>
          ${statusHtml}
        </${tag}>`;
    }).join('');
  }

  function renderProgress() {
    // Yalnızca açık dersler sayılır: ekranda olmayan ders "0 / 6" gibi
    // bir eksik hissi vermesin.
    const acik = LESSONS.filter((l) => l.open);
    const toplamEl = document.getElementById('statToplam');
    if (toplamEl) toplamEl.textContent = String(acik.length);

    MODULLER.forEach((m) => {
      const dersler = acik.filter((l) => modulu(l) === m.no);
      if (!dersler.length) return;
      const total = dersler.length;
      const completed = dersler.filter(isDone).length;
      const pill = document.getElementById(m.pill);
      const fill = document.getElementById(m.fill);
      if (pill) pill.textContent = `${completed} / ${total} Ders Tamamlandı`;

      // İlerleme çubuğu 0'dan hedefe doğru dolsun — sayfa her açıldığında
      // öğrenci "buraya kadar geldim" hissini yeniden yaşasın (fx.css'teki
      // .module-progress-fill geçişi bunu yumuşatıyor).
      if (fill) {
        const target = (completed / total * 100) + '%';
        if (window.FX && !FX.reduced && completed > 0) {
          fill.style.width = '0%';
          setTimeout(() => { fill.style.width = target; }, 260);
        } else {
          fill.style.width = target;
        }
      }
    });

    const startedCount = document.getElementById('statStarted');
    if (startedCount) startedCount.textContent = String(acik.filter(isDone).length);
  }

  /* Tamamlanmış ders kartlarını sırayla "damgala": küçük yıldız patlaması
     + kısa zafer sesi. Portal'a her dönüşte ilerleme görünür/duyulur olur. */
  function celebrateCompleted() {
    if (!window.FX || FX.reduced) return;
    const doneCards = document.querySelectorAll('.lesson-card-status.done');
    doneCards.forEach((badge, i) => {
      setTimeout(() => {
        FX.burst(badge, { count: 10, power: 110, emojis: ['⭐', '✨'] });
        FX.sound('discover');
      }, 600 + i * 260);
    });
  }

  function initHeroCta() {
    const cta = document.getElementById('heroCta');
    if (!cta) return;
    const anyDone = LESSONS.some(isDone);
    /* "Kaldığın yerden devam" eskiden hep Ders 1.1'e gidiyordu. Artık
       bitmemiş ilk açık derse gider; sayfadaki TEK parlayan şey bu
       (odak.css), çocuk nereye basacağını aramaz. */
    /* Mola verip dönen çocuk EN SON çalıştığı derse ve adıma dönmeli (Arda,
       2026-10-05: "mola verdikten sonra devam et dediğimde kaldığım yerden
       devam etmiyor" — düğme bitmemiş ilk dersi açıyordu, son çalışılanı değil).
       Önce: yarıda kalmış en son ders (devam_v1 t). Yoksa: bitmemiş ilk ders. */
    let devam = {};
    try { devam = JSON.parse(Store.get('devam_v1') || '{}') || {}; } catch (e) {}
    const kayit = (l) => devam['l' + l.id.replace('_', '')];
    const yarida = LESSONS.filter(l => l.open && kayit(l) && kayit(l).adim > 1 && kayit(l).adim < 9)
      .sort((a, b) => (kayit(b).t || 0) - (kayit(a).t || 0))[0];
    const sirada = yarida || LESSONS.find(l => l.open && !isDone(l));
    if (sirada) {
      cta.href = sirada.href;
      /* Kaldığı ADIM da yazsın (lesson-engine devam_v1, 2026-10-04): ders
         açılınca çocuk zaten o adıma götürülüyor; düğme bunu önceden söyler. */
      const d = kayit(sirada);
      const adim = d && d.adim > 1 ? d.adim : 0;
      cta.textContent = adim ? `Devam Et: Ders ${sirada.num} · Adım ${adim} →`
        : (anyDone ? `Devam Et: Ders ${sirada.num} →` : `Ders ${sirada.num}'e Başla →`);
    } else {
      cta.textContent = "Dersleri Tekrar Et →";
    }
    cta.classList.add('odak-simdi');
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderLessons();
    renderProgress();
    initHeroCta();
    celebrateCompleted();
    // Bilgi şeridi, modül kartları ve ders kartları görünüme girdikçe sırayla.
    if (window.Hareket) Hareket.belir('.portal-info-item, .module-card, .lesson-card');
    // Hero'daki kod önizlemesi daktiloyla yazılır (anime.js).
    if (window.Hareket) Hareket.daktilo(document.querySelector('.code-preview-body code'));
    // 3B kart: LED'i koddaki delay(1000) ritmiyle yanar, o an çalışan satır vurgulanır.
    if (window.Hareket) Hareket.kart3b(document.getElementById('hero3b'),
      document.querySelector('.code-preview-body'), document.querySelector('.code-preview-status .led-dot'));

    // Kilitli ("Yakında") kartlara tıklayınca sessizce hiçbir şey olmuyordu.
    // Artık kart hafifçe sallanıyor ve kısa bir uyarı sesi çıkıyor.
    document.getElementById('lessonGrid').addEventListener('click', (e) => {
      const card = e.target.closest('.lesson-card.is-locked');
      if (!card || !window.FX) return;
      FX.sound('warn');
      FX.shake(card);
      FX.vibrate([14, 36, 14]);
    });
  });
})();
