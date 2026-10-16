/* ============================================================
   TEMA — açık / siyah (2026-09-30)
   ============================================================
   Arda: "siteye siyah tema gelsin kullanıcı için."

   Bu dosya <head> içinde, stil dosyalarından ÖNCE ve senkron yüklenir:
   seçili tema sayfa boyanmadan <html data-theme> olarak yazılır, yoksa
   siyah temayı seçen çocuk her sayfa açılışında bir an beyaz ekran görür.

   Seçim yoksa işletim sisteminin tercihine uyulur (prefers-color-scheme).
   Çocuk düğmeye bir kez basınca seçimi saklanır ve sistem tercihini ezer.
   Renklerin kendisi styles.css'te: :root[data-theme="dark"].

   Düğme başlıktaki ses düğmesinin yanına fx.js tarafından konur
   (Tema.dugme()); fx.js yoksa sağ üstte kendi başına durur.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'tema_v1';
  var kok = document.documentElement;

  function oku() {
    try { var t = localStorage.getItem(KEY); if (t === 'dark' || t === 'light') return t; } catch (e) {}
    return null;
  }
  function sistem() {
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; }
  }
  function simdiki() { return kok.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }

  /* Mobil tarayıcının adres çubuğu da temayı izlesin (2026-10-16 denetimi:
     koyu temada krem kalıyordu). Renkler --color-bg ile aynı. Meta, tema.js
     çalışırken henüz okunmamış olabilir: DOMContentLoaded'da bir kez daha. */
  var CUBUK = { dark: '#17120D', light: '#FFF8F0' };
  function cubuk(t) {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', CUBUK[t === 'dark' ? 'dark' : 'light']);
  }

  function uygula(t) {
    if (t === 'dark') kok.setAttribute('data-theme', 'dark');
    else kok.setAttribute('data-theme', 'light');
    cubuk(t);
    boya();
  }

  // Sayfa boyanmadan önce.
  uygula(oku() || sistem());

  // Seçim yapılmadıysa sistem değişince (ör. akşam otomatik koyu) takip et.
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!oku()) uygula(e.matches ? 'dark' : 'light');
    });
  } catch (e) {}

  var AY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>';
  var GUNES = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

  var btn = null;
  function boya() {
    if (!btn) return;
    var koyu = simdiki() === 'dark';
    // Düğme GİDİLECEK temayı gösterir: koyudayken güneş, açıktayken ay.
    btn.innerHTML = koyu ? GUNES : AY;
    btn.title = koyu ? 'Açık temaya geç' : 'Siyah temaya geç';
    btn.setAttribute('aria-label', btn.title);
    btn.setAttribute('aria-pressed', koyu ? 'true' : 'false');
  }

  function degistir() {
    var yeni = simdiki() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, yeni); } catch (e) {}
    uygula(yeni);
  }

  /* Düğmeyi üretir; nereye konacağına çağıran karar verir. */
  function dugme() {
    if (btn) return btn;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'temaBtn';
    btn.className = 'fx-hud-sound tema-btn';
    btn.addEventListener('click', function (e) { e.stopPropagation(); degistir(); });
    boya();
    return btn;
  }

  /* fx.js yüklenmeyen bir sayfada düğme yine de bulunsun. */
  document.addEventListener('DOMContentLoaded', function () {
    cubuk(simdiki());
    setTimeout(function () {
      if (btn && btn.isConnected) return;
      var b = dugme();
      b.style.cssText = 'position:fixed;top:10px;right:14px;z-index:9100;';
      document.body.appendChild(b);
    }, 0);
  });

  window.Tema = { dugme: dugme, degistir: degistir, get koyu() { return simdiki() === 'dark'; } };
})();
