/* ============================================================
   sync.js — Bulut ile yerel ilerlemeyi birleştirir (window.Sync)
   ============================================================
   Kural: hiçbir kazanım kaybolmaz. Aynı öğrenci iki cihazda
   ilerlemişse iki tarafın da kazandığı korunur; çakışmada "daha
   ilerlemiş olan" kazanır, "daha yeni yazan" değil. Zaman damgası
   yerine bu kuralı seçtik çünkü cihaz saatleri güvenilmez ve
   öğrenciye rozet kaybettirmek en kötü sonuç.
   ============================================================ */

(function () {
  'use strict';

  /* Store yüklüyse onun sözlüğü tek kaynaktır; buradaki liste yalnızca
     saf birleştirme testinin (test-merge.mjs, tarayıcısız) yedeğidir. */
  var PROGRESS_KEYS = (window.Store && window.Store.PROGRESS_KEYS) || [
    'badge_lesson_1_1', 'badge_lesson_1_2', 'badge_lesson_1_3', 'badge_lesson_1_4', 'badge_lesson_1_5', 'badge_lesson_1_6', 'badge_lesson_2_1', 'badge_lesson_2_2', 'badge_lesson_3_1',
    'quiz_lesson_1_1_passed', 'quiz_lesson_1_2_passed', 'quiz_lesson_1_3_passed', 'quiz_lesson_1_4_passed',
    'quiz_lesson_1_5_passed', 'quiz_lesson_1_6_passed', 'quiz_lesson_2_1_passed', 'quiz_lesson_2_2_passed', 'quiz_lesson_3_1_passed',
    'fx_xp_v1', 'fx_claims_v1',
    'cuzdan_esya_v1', 'cuzdan_hafta_v1', 'cuzdan_kalkan_v1', 'cuzdan_takili_v1',
    'profile_v1'
  ];

  function parseObj(raw) {
    try { var v = JSON.parse(raw); return (v && typeof v === 'object') ? v : {}; }
    catch (e) { return {}; }
  }

  function mergeKey(key, local, remote) {
    if (local === undefined) return remote;
    if (remote === undefined) return local;

    if (key.indexOf('badge_lesson_') === 0) {
      return (local === 'earned' || remote === 'earned') ? 'earned' : local;
    }
    if (key.indexOf('quiz_lesson_') === 0) {
      return (local === '1' || remote === '1') ? '1' : local;
    }
    if (key === 'fx_xp_v1') {
      return String(Math.max(parseInt(local, 10) || 0, parseInt(remote, 10) || 0));
    }
    // Yalnız büyüyen kümeler: birleşim. Cüzdanın bakiyesi bunlardan
    // hesaplandığı için (cuzdan.js) harcama ne geri gelir ne çiftlenir.
    if (key === 'fx_claims_v1' || key === 'cuzdan_esya_v1' ||
        key === 'cuzdan_hafta_v1' || key === 'cuzdan_kalkan_v1') {
      var merged = parseObj(local), r = parseObj(remote);
      for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) merged[k] = r[k];
      return JSON.stringify(merged);
    }
    if (key === 'cuzdan_takili_v1') return remote;   // tercih: son yazan
    if (key === 'profile_v1') return remote; // profil öğrenciye bağlı, kutuya değil
    return remote;
  }

  function mergeProgress(local, remote) {
    local = local || {}; remote = remote || {};
    var out = {};
    for (var i = 0; i < PROGRESS_KEYS.length; i++) {
      var key = PROGRESS_KEYS[i];
      var value = mergeKey(key, local[key], remote[key]);
      if (value !== undefined) out[key] = value;
    }
    return out;
  }

  // ---------- Gecikmeli gönderim ----------
  var token = null, pending = {}, timer = null, unsubscribe = null;

  function flush() {
    timer = null;
    if (!token || !window.Cloud || !window.Cloud.enabled()) return;
    var changes = pending; pending = {};
    if (!Object.keys(changes).length) return;
    window.Cloud.call('learner-sync', { token: token, changes: changes })
      .catch(function () {
        /* Ağ yoksa kayıp olmasın: değişiklikler sıraya geri konur,
           bir sonraki yazmada yeniden denenir. Ders akışı beklemez. */
        for (var k in changes) if (!(k in pending)) pending[k] = changes[k];
      });
  }

  function start(activeToken) {
    token = activeToken;
    if (unsubscribe) unsubscribe();
    unsubscribe = window.Store.subscribe(function (key, value) {
      if (PROGRESS_KEYS.indexOf(key) === -1) return;
      pending[key] = value;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, 1500);
    });
    /* İlk açılışta bulutu çek ve birleştir.
       Bu istek bir SÖZ döndürür ve Sync.ready'de de durur; çağıran
       (learner.js) ilerlemenin cihaza inmesini bekleyebilsin diye.
       Arda'nın 2026-09-21 bulgusu tam buradaydı: giriş çözülür çözülmez
       sayfa yenileniyordu, bu istek daha yoldaydı ve çocuk kendi
       hesabını XP'siz, rozetsiz görüyordu (bkz. test-learner.mjs
       "Hesaplar arasi gezinme"). */
    var ilkCekim = Promise.resolve(false);
    if (window.Cloud && window.Cloud.enabled()) {
      ilkCekim = window.Cloud.call('learner-sync', { token: token, changes: {} })
        .then(function (res) {
          var merged = mergeProgress(window.Store.snapshot(), (res && res.progress) || {});
          window.Store.applySnapshot(merged);
          return true;
        })
        .catch(function () { return false; });   /* çevrimdışı: yerel veriyle devam */
    }
    API.ready = ilkCekim;
    return ilkCekim;
  }

  function stop() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    if (timer) { clearTimeout(timer); timer = null; }
    token = null; pending = {};
  }

  /* ready: son start()'in ilk çekimi. Hiç başlatılmadıysa çözülmüş
     bir söz — bekleyen taraf hesapsız modda da takılı kalmasın. */
  var API = { mergeProgress: mergeProgress, start: start, stop: stop, ready: Promise.resolve(false) };
  window.Sync = API;
})();
