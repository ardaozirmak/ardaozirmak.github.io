/* ============================================================
   storage.js — İlerlemenin tek kapısı (window.Store)
   ============================================================
   Rozet/quiz/XP durumu bugüne kadar 25'ten fazla yerden doğrudan
   localStorage'a yazılıyordu. Bulut senkronu (sync.js) tek bir
   yazma noktası olmadan güvenilir kurulamaz; bu modül o noktayı
   kurar ve her yazmayı dinleyicilere duyurur.

   localStorage TEK GERÇEK KAYNAKTIR. Bulut sadece kopya tutar,
   bu yüzden burada ağ, söz (promise) veya hata yolu yoktur —
   çağıranlar bugünkü gibi senkron çalışmaya devam eder.
   ============================================================ */

(function () {
  'use strict';

  /* Öğrenciye ait, kutudan kutuya taşınan anahtarlar. Yeni ders
     eklendiğinde buraya bir satır eklenir (hesap senkronu bu listeyi
     taşır; eski yedek kodu, progress-backup.js, 2026-09-28'de kalktı). */
  var PROGRESS_KEYS = [
    'badge_lesson_1_1', 'badge_lesson_1_2', 'badge_lesson_1_3', 'badge_lesson_1_4', 'badge_lesson_1_5', 'badge_lesson_1_6', 'badge_lesson_2_1', 'badge_lesson_2_2', 'badge_lesson_3_1',
    'quiz_lesson_1_1_passed', 'quiz_lesson_1_2_passed', 'quiz_lesson_1_3_passed', 'quiz_lesson_1_4_passed',
    'quiz_lesson_1_5_passed', 'quiz_lesson_1_6_passed', 'quiz_lesson_2_1_passed', 'quiz_lesson_2_2_passed', 'quiz_lesson_3_1_passed',
    'fx_xp_v1', 'fx_claims_v1',
    // Cüzdan (2026-09-30, cuzdan.js): bakiye saklanmaz, bu kümelerden hesaplanır.
    'cuzdan_esya_v1', 'cuzdan_hafta_v1', 'cuzdan_kalkan_v1', 'cuzdan_takili_v1',
    'profile_v1',
    // Kaldığın yerden devam (2026-10-04, lesson-engine.js): ders başına adım + en ileri adım.
    'devam_v1'
  ];

  var listeners = [];

  function emit(key, value) {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](key, value); } catch (e) { /* dinleyici hatası yazmayı bozmasın */ }
    }
  }

  function get(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? (fallback === undefined ? null : fallback) : v;
    } catch (e) { return fallback === undefined ? null : fallback; }
  }

  function set(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) { /* gizli sekme, kota */ }
    emit(key, String(value));
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* yok sayılır */ }
    emit(key, null);
  }

  function getJSON(key, fallback) {
    var raw = get(key, null);
    if (raw === null) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }

  function setJSON(key, value) {
    var raw;
    try { raw = JSON.stringify(value); } catch (e) { return; }
    set(key, raw);
  }

  /* Bilinen ilerleme anahtarlarının o anki hâli — buluta gönderilen
     ve yedek koduna paketlenen şey budur. */
  function snapshot() {
    var out = {};
    for (var i = 0; i < PROGRESS_KEYS.length; i++) {
      var v = get(PROGRESS_KEYS[i], null);
      if (v !== null) out[PROGRESS_KEYS[i]] = v;
    }
    return out;
  }

  function applySnapshot(data) {
    if (!data) return 0;
    var count = 0;
    for (var key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      if (PROGRESS_KEYS.indexOf(key) === -1) continue;
      set(key, data[key]);
      count++;
    }
    return count;
  }

  /* Kutu değiştirirken çağrılır: sadece öğrenciye ait anahtarlar
     silinir, ses tercihi (fx_prefs_v1) gibi cihaza ait ayarlar kalır. */
  function clearProgress() {
    for (var i = 0; i < PROGRESS_KEYS.length; i++) remove(PROGRESS_KEYS[i]);
  }

  function subscribe(fn) {
    if (typeof fn === 'function') listeners.push(fn);
    return function () {
      var i = listeners.indexOf(fn);
      if (i !== -1) listeners.splice(i, 1);
    };
  }

  window.Store = {
    PROGRESS_KEYS: PROGRESS_KEYS,
    get: get, set: set, remove: remove,
    getJSON: getJSON, setJSON: setJSON,
    snapshot: snapshot, applySnapshot: applySnapshot,
    clearProgress: clearProgress,
    subscribe: subscribe
  };
})();
