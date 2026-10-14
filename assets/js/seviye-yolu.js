/* ============================================================
   KUPA YOLU — seviyeler ve unvanlar (2026-09-30)
   ============================================================
   Arda: "XP / Sv.'ye basınca pencere açılsın: kaçıncı seviye, hangi
   unvanı alacak, kupa yolu gibi."
   Her seviye düğümünde unvan (fx.js LEVEL_NAMES) ve XP eşiği.
   2026-10-06: mağaza ve Altın kalktı (Arda: "kupa yolu kalsın");
   düğümlerdeki Altın ödülü ve mağaza eşyaları onlarla gitti.
   Sayfa kaydırma kilidi de burada (KaydirmaKilidi): yönetici paneli de kullanır.
   ============================================================ */
(function () {
  'use strict';
  var kok = null, onceki = null;
  var KUPA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M17 5h3v2a4 4 0 0 1-4 4M7 5H4v2a4 4 0 0 0 4 4"/></svg>';
  var TIK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  function hareket() { return !!(window.Hareket && Hareket.aktif && window.Motion); }

  /* Pencere açıkken <html>/<body> kaydırılamaz; iç içe açılışlar sayılır. */
  var kilitSayisi = 0, eskiStil = null;
  function kaydirmaKilidi(ac) {
    var html = document.documentElement, body = document.body;
    if (ac) {
      if (kilitSayisi++ > 0) return;
      var bar = window.innerWidth - html.clientWidth;
      eskiStil = { h: html.style.overflow, b: body.style.overflow, p: body.style.paddingRight };
      html.style.overflow = 'hidden'; body.style.overflow = 'hidden';
      // Kaydırma çubuğu kaybolunca sayfa yana sıçramasın.
      if (bar > 0) body.style.paddingRight = bar + 'px';
    } else {
      if (kilitSayisi === 0 || --kilitSayisi > 0) return;
      html.style.overflow = eskiStil.h; body.style.overflow = eskiStil.b; body.style.paddingRight = eskiStil.p;
    }
  }

  /* Madalyon kademesi (Blender render'ı, blender/rozet.py): yol ilerledikçe metal değişir. */
  function kademe(lv) { return lv >= 10 ? 'efsane' : lv >= 7 ? 'altin' : lv >= 4 ? 'gumus' : 'bronz'; }

  function dugum(lv, simdi) {
    var durum = lv < simdi ? 'gecti' : lv === simdi ? 'simdi' : 'gelecek';
    var xpEsik = (lv - 1) * FX.XP_PER_LEVEL;
    return '<li class="yol-dugum" data-durum="' + durum + '" data-sv="' + lv + '">' +
      '<span class="yol-rozet" data-kademe="' + kademe(lv) + '">' + (durum === 'gecti' ? TIK : lv) + '</span>' +
      '<div class="yol-kart"><div class="yol-kart-ust"><h3>' + FX.levelNameOf(lv) + '</h3>' +
        '<span class="yol-esik">Sv.' + lv + ' · ' + xpEsik + ' XP</span></div>' +
        (durum === 'simdi' ? '<span class="yol-buradasin">Buradasın</span>' : '') +
      '</div></li>';
  }

  function ciz() {
    var xp = FX.xp(), lv = FX.level(), n = FX.LEVEL_COUNT, per = FX.XP_PER_LEVEL;
    var son = lv >= n;
    var ici = xp % per;
    kok.querySelector('.yol-durum').innerHTML =
      '<div class="yol-sv"><span>Sv.</span><b>' + lv + '</b></div>' +
      '<div class="yol-sv-sag"><strong>' + FX.levelNameOf(lv) + '</strong>' +
        (son ? '<span>Yolun sonuna geldin. Sen bir efsanesin!</span>'
             : '<span><b>' + (per - ici) + ' XP</b> sonra Sv.' + (lv + 1) + ': ' + FX.levelNameOf(lv + 1) + '</span>') +
        '<span class="yol-cubuk"><i style="width:' + (son ? 100 : Math.round(ici / per * 100)) + '%"></i></span>' +
      '</div>';
    var liste = [];
    for (var l = 1; l <= Math.max(n, lv); l++) liste.push(dugum(l, lv));
    kok.querySelector('.yol-liste').innerHTML = liste.join('');
  }

  function ac() {
    if (!window.FX) return;
    if (!kok) {
      kok = document.createElement('div');
      kok.id = 'seviyeYolu'; kok.className = 'yol'; kok.hidden = true;
      kok.innerHTML = '<div class="yol-pencere" role="dialog" aria-modal="true" aria-labelledby="yolBaslik">' +
        '<div class="yol-vitrin"><div class="yol-vitrin-ust"><h2 id="yolBaslik">' + KUPA + 'Kupa Yolu</h2>' +
        '<button type="button" class="yol-kapat" aria-label="Kapat">×</button></div><div class="yol-durum"></div></div>' +
        '<div class="yol-icerik"><ol class="yol-liste"></ol>' +
        '<p class="yol-dip">XP’yi ders adımları, doğru cevaplar ve rozetler kazandırır.</p></div></div>';
      kok.addEventListener('click', function (e) {
        if (e.target === kok || e.target.closest('.yol-kapat')) return kapat();
      });
      document.body.appendChild(kok);
    }
    onceki = document.activeElement;
    ciz();
    kok.hidden = false;
    kaydirmaKilidi(true);
    document.addEventListener('keydown', tus);
    // Şu anki seviye görünür yerde açılsın (ilerisi altında, geçmiş üstünde).
    var icerik = kok.querySelector('.yol-icerik'), simdi = kok.querySelector('[data-durum="simdi"]');
    if (simdi) icerik.scrollTop = Math.max(0, simdi.offsetTop - 24);
    if (hareket()) {
      var pen = kok.querySelector('.yol-pencere');
      Motion.animate(pen, { opacity: [0, 1], transform: ['translateY(24px) scale(0.97)', 'translateY(0px) scale(1)'] },
        { type: 'spring', bounce: 0.22, duration: 0.45 }).finished.then(function () { pen.style.transform = ''; }, function () {});
      var dugumler = [].slice.call(kok.querySelectorAll('.yol-dugum'));
      Motion.animate(dugumler, { opacity: [0, 1], transform: ['translateX(-14px)', 'translateX(0px)'] },
        { delay: Motion.stagger(0.04), duration: 0.35, ease: [0.23, 1, 0.32, 1] })
        .finished.then(function () { dugumler.forEach(function (d) { d.style.transform = ''; d.style.opacity = ''; }); }, function () {});
    }
    kok.querySelector('.yol-kapat').focus();
  }
  function kapat() {
    if (!kok || kok.hidden) return;
    kok.hidden = true;
    kaydirmaKilidi(false);
    document.removeEventListener('keydown', tus);
    if (onceki && onceki.focus) try { onceki.focus(); } catch (e) {}
  }
  function tus(e) { if (e.key === 'Escape') kapat(); }

  window.SeviyeYolu = { ac: ac, kapat: kapat };
  window.KaydirmaKilidi = kaydirmaKilidi;
})();
