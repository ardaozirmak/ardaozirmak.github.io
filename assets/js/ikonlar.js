/* ============================================================
   İKONLAR — alev (seri), pul (Altın), kalkan (2026-09-30)
   ============================================================
   Arda: "emoji değil, hareket eden alev işareti gibi"; sonra (aynı gün)
   "her şeyi Blender ile yap". Üçü de Blender render'ı (blender/), <img>
   ile gelir (file:// çalışır). Hareket YALNIZ window.Hareket açıkken;
   otomasyonda ve "hareketi azalt"ta durağan ilk kare.
   ============================================================ */
(function () {
  'use strict';

  /* Seri alevi: Blender render'ı, 16 karelik dikişsiz döngü (blender/alev.py).
     Hareket kapalıysa (otomasyon, "hareketi azalt") ilk karesi, durağan. */
  function alev(px, seviye) {
    seviye = Math.max(0, Math.min(3, seviye | 0));
    var canli = !!(window.Hareket && Hareket.aktif);
    return '<img class="ikon ikon-alev" data-seviye="' + seviye + '" src="assets/img/esya/alev-' + seviye + (canli ? '' : '-0') +
      '.webp" width="' + px + '" height="' + px + '" alt="" aria-hidden="true" draggable="false">';
  }

  /* Pul ve kalkan Blender render'ı (blender/esyalar.py → assets/img/esya).
     Kural 2026-09-30: çizimler Blender'dan. */
  function resim(sinif, dosya, px) {
    return '<img class="ikon ' + sinif + '" src="assets/img/esya/' + dosya + '" width="' + px + '" height="' + px +
      '" alt="" aria-hidden="true" draggable="false">';
  }
  function pul(px) { return resim('ikon-pul', 'pul.webp', px); }
  function kalkan(px) { return resim('ikon-kalkan', 'kalkan.webp', px); }

  var acik = function () { return !!(window.Hareket && Hareket.aktif && window.anime); };

  /* Alev artık kendi kendine oynayan bir resim; eski morph çağrıları zararsız kalsın. */
  function canlandir() {}

  /* Kalkan belirir (bir kez): küçükten büyüyüp yerine oturur. */
  function kalkanCiz(el) {
    if (!acik() || !el) return;
    anime.animate(el, { scale: [0.3, 1.18, 1], opacity: [0, 1], rotate: [-14, 4, 0], duration: 620, ease: 'outBack' });
  }

  window.Ikon = { alev: alev, pul: pul, kalkan: kalkan, canlandir: canlandir, kalkanCiz: kalkanCiz,
    alevSeviyesi: function (seri) { return seri >= 10 ? 3 : seri >= 6 ? 2 : seri >= 3 ? 1 : 0; } };
})();
