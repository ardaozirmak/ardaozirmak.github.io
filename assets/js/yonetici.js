/* ============================================================
   YÖNETİCİ — Arda'nın kendi hesabı için ayrıcalıklar (2026-09-30)
   ============================================================
   Arda: "ardaozirmak benim hesabım, ona admin panel gibi bir şey:
   sınırsız para, dersler sınırsız açık." (2026-10-06: mağaza ve Altın
   kalktı, "Sınırsız Altın" anahtarı da onlarla gitti.)

   Kim: giriş yapılmış oturumun kullanıcı adı ADMIN listesinde.
   Güven düzeyi: istemci tarafı. Kilitler zaten tarayıcıda
   hesaplanıyor (lesson-engine.js), yani bu da çocuğun
   devtools ile yapabileceğinden fazlasını açmıyor. Sunucuda bir yetki
   yok; ileride gerçek bir öğretmen/yönetici paneli olursa bayrak
   sunucudan (learners tablosu) gelmeli.

   Anahtarlar AÇILIP KAPATILABİLİR: Arda çocuğun gördüğü kilitli
   akışı da denetleyebilsin. Tercih cihaza ait (yonetici_v1), ilerleme
   anahtarı değil — buluta gitmez, "Ben başkasıyım"da silinmez.

   Kancalar:
     lesson-engine gateFor         → 'kilit' açıkken adım kapıları açık
     lesson-page   sekmeleriBoya   → 'kilit' açıkken tüm ders sekmeleri açık
   ============================================================ */
(function () {
  'use strict';
  var ADMIN = ['ardaozirmak'];
  var TERCIH = 'yonetici_v1';
  var OZELLIK = [
    ['kilit', 'Tüm kilitler açık', 'Ders sekmeleri ve adım kapıları açık; istediğin adıma atla.']
  ];
  var DERSLER = [['1.1', 'index.html'], ['1.2', 'lesson-1-2.html'], ['1.3', 'lesson-1-3.html'], ['1.4', 'lesson-1-4.html'], ['1.5', 'lesson-1-5.html'], ['1.6', 'lesson-1-6.html'], ['2.1', 'lesson-2-1.html'], ['2.2', 'lesson-2-2.html'], ['3.1', 'lesson-3-1.html']];

  function hesap() {
    try {
      var L = window.Learner;
      if (!L || !L.isActive()) return false;
      var u = String((L.current() || {}).username || '').toLowerCase();
      return ADMIN.indexOf(u) !== -1;
    } catch (e) { return false; }
  }
  function tercih() {
    try { var v = JSON.parse(localStorage.getItem(TERCIH) || '{}'); return (v && typeof v === 'object') ? v : {}; } catch (e) { return {}; }
  }
  /* Varsayılan AÇIK: hesap yöneticiyse ilk girişte her şey açık gelir. */
  function aktif(ad) { return hesap() && tercih()[ad] !== false; }

  function ayarla(ad, acik) {
    var t = tercih(); t[ad] = !!acik;
    try { localStorage.setItem(TERCIH, JSON.stringify(t)); } catch (e) {}
  }

  // ---------- başlık düğmesi ----------
  var KALKAN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5 19.5 5.5V11.5C19.5 16.2 16.4 19.8 12 21.5 7.6 19.8 4.5 16.2 4.5 11.5V5.5Z"/><path d="m9 12 2 2 4-4"/></svg>';
  function dugme() {
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'yoneticiBtn'; b.className = 'yonetici-btn';
    b.setAttribute('aria-label', 'Yönetici paneli');
    b.title = 'Yönetici paneli';
    b.innerHTML = KALKAN;
    b.addEventListener('click', function (e) { e.stopPropagation(); ac(); });
    return b;
  }

  // ---------- panel ----------
  var kok = null, onceki = null;
  function ciz() {
    var t = tercih();
    var anahtarlar = OZELLIK.map(function (o) {
      var on = t[o[0]] !== false;
      return '<label class="yon-satir"><span class="yon-metin"><b>' + o[1] + '</b><small>' + o[2] + '</small></span>' +
        '<input type="checkbox" role="switch" data-ozellik="' + o[0] + '"' + (on ? ' checked' : '') + '>' +
        '<span class="yon-anahtar" aria-hidden="true"></span></label>';
    }).join('');
    var dersler = DERSLER.map(function (d) {
      return '<a class="yon-ders" href="' + d[1] + '">Ders ' + d[0] + '</a>';
    }).join('');
    kok.querySelector('.yon-govde').innerHTML =
      '<div class="yon-grup">' + anahtarlar + '</div>' +
      '<p class="yon-not">Değişiklik sayfa yenilenince her yere yansır.</p>' +
      '<h3 class="yon-alt">Derse git</h3><div class="yon-dersler">' + dersler + '</div>';
  }
  function ac() {
    if (!hesap()) return;
    if (!kok) {
      kok = document.createElement('div');
      kok.id = 'yonetici'; kok.className = 'yonetici'; kok.hidden = true;
      kok.innerHTML = '<div class="yon-pencere" role="dialog" aria-modal="true" aria-labelledby="yonBaslik">' +
        '<div class="yon-baslik">' + KALKAN + '<div><h2 id="yonBaslik">Yönetici</h2><span>@' +
        String(window.Learner.current().username) + '</span></div>' +
        '<button type="button" class="yon-kapat" aria-label="Kapat">×</button></div>' +
        '<div class="yon-govde"></div></div>';
      kok.addEventListener('click', function (e) {
        if (e.target === kok || e.target.closest('.yon-kapat')) return kapat();
      });
      kok.addEventListener('change', function (e) {
        var k = e.target.closest('[data-ozellik]');
        if (!k) return;
        ayarla(k.dataset.ozellik, k.checked);
        // Kilitler motorun ve sekmelerin açılış durumuna gömülü; yeniden
        // yüklemek her modülü tek hamlede tutarlı yapar (learner.js'teki
        // switchBox gerekçesiyle aynı).
        setTimeout(function () { location.reload(); }, 180);
      });
      document.body.appendChild(kok);
    }
    onceki = document.activeElement;
    ciz();
    kok.hidden = false;
    if (window.KaydirmaKilidi) KaydirmaKilidi(true);
    document.addEventListener('keydown', tus);
    var pen = kok.querySelector('.yon-pencere');
    if (window.Hareket && Hareket.aktif && window.Motion) Motion.animate(pen, { opacity: [0, 1], transform: ['scale(0.96)', 'scale(1)'] }, { type: 'spring', bounce: 0.2, duration: 0.35 });
    var ilk = kok.querySelector('input'); if (ilk) ilk.focus();
  }
  function kapat() {
    if (!kok || kok.hidden) return;
    kok.hidden = true;
    if (window.KaydirmaKilidi) KaydirmaKilidi(false);
    document.removeEventListener('keydown', tus);
    if (onceki && onceki.focus) try { onceki.focus(); } catch (e) {}
  }
  function tus(e) { if (e.key === 'Escape') kapat(); }

  window.Yonetici = { ADMIN: ADMIN, hesap: hesap, aktif: aktif, ayarla: ayarla, dugme: dugme, ac: ac, kapat: kapat };
})();
