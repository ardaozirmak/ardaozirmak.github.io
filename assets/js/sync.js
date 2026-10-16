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
    'profile_v1', 'devam_v1'
  ];

  function parseObj(raw) {
    try { var v = JSON.parse(raw); return (v && typeof v === 'object') ? v : {}; }
    catch (e) { return {}; }
  }

  /* JSON tutan anahtarlar: buluttaki değer bozuksa (learner-sync eskiden
     4000 karakterde KESİYORDU, fx_claims_v1 Ders 1.6'dan sonra geçersiz JSON
     oluyordu — 2026-10-16 denetimi) cihaza yazılmaz; yerel varsa yerel
     kazanır, yerel yoksa hiç yazılmaz. */
  var JSON_ANAHTAR = ['fx_claims_v1', 'cuzdan_esya_v1', 'cuzdan_hafta_v1', 'cuzdan_kalkan_v1', 'devam_v1', 'profile_v1'];
  function gecerliJson(raw) {
    try { var v = JSON.parse(raw); return !!v && typeof v === 'object'; } catch (e) { return false; }
  }

  /* devam_v1: { l15: { adim, enIleri, t, ilerledi? }, ... }. Ders bazında:
     enIleri hiç küçülmez (geçilmiş kapı geri kapanmasın), "kaldığın yer"
     (adim) en son yazılan taraftan gelir. Eskiden bulut topluca kazanıyordu:
     yavaş ilk çekimde ya da çevrimdışı ilerlemede ders geri gidiyordu. */
  function devamBirlestir(local, remote) {
    var a = parseObj(local), b = parseObj(remote), out = {};
    var k, x, y;
    for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = a[k];
    for (k in b) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) continue;
      x = out[k]; y = b[k];
      if (!x || typeof x !== 'object') { out[k] = y; continue; }
      if (!y || typeof y !== 'object') continue;
      var yeni = (y.t || 0) > (x.t || 0) ? y : x;
      var birlesik = {};
      for (var p in yeni) if (Object.prototype.hasOwnProperty.call(yeni, p)) birlesik[p] = yeni[p];
      birlesik.enIleri = Math.max(x.enIleri || 0, y.enIleri || 0, x.adim || 0, y.adim || 0);
      var il = Math.max(x.ilerledi || 0, y.ilerledi || 0);
      if (il) birlesik.ilerledi = il;
      out[k] = birlesik;
    }
    return JSON.stringify(out);
  }

  function mergeKey(key, local, remote) {
    if (remote !== undefined && JSON_ANAHTAR.indexOf(key) !== -1 && !gecerliJson(remote)) remote = undefined;
    if (local === undefined) return remote;
    if (remote === undefined) return local;
    if (key === 'devam_v1') return devamBirlestir(local, remote);

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

  /* Sunucu cevabı iki şey taşıyabilir (2026-10-16):
     - token: süresi azalan belirtecin yenisi (kayan süre, learner-sync).
       learner.js oturuma yazar; çocuk ayda bir girse bile düşmez.
     - 401 belirtec-gecersiz: belirteç gerçekten bitmiş. Eskiden bu da "ağ
       yok" sayılıp sessizce yutuluyordu, ilerleme buluta hiç gitmiyordu.
       Artık learner.js'e haber verilir, o da giriş ekranını açıklamayla açar.
     Çağıran bu kancaları API.onToken / API.onExpired ile bağlar. */
  function cevabiIsle(res) {
    if (res && typeof res.token === 'string' && res.token) {
      token = res.token;
      if (typeof API.onToken === 'function') { try { API.onToken(res.token); } catch (e) {} }
    }
    return res;
  }

  function bittiMi(err) {
    return !!(err && err.context && err.context.status === 401);
  }

  function bitti() {
    var cagir = API.onExpired;
    stop();
    if (typeof cagir === 'function') { try { cagir(); } catch (e) {} }
  }

  /* Yolda olan gönderim: "Ben başkasıyım" bunun bitmesini bekleyebilsin. */
  var yolda = 0;

  /* Döner: söz — true = bekleyen her şey buluta ulaştı. */
  function flush() {
    if (timer) { clearTimeout(timer); }
    timer = null;
    if (!token || !window.Cloud || !window.Cloud.enabled()) return Promise.resolve(false);
    var changes = pending; pending = {};
    if (!Object.keys(changes).length) return Promise.resolve(true);
    yolda++;
    return window.Cloud.call('learner-sync', { token: token, changes: changes })
      .then(cevabiIsle)
      .then(function () { yolda--; return Object.keys(pending).length === 0; })
      .catch(function (err) {
        yolda--;
        /* Belirteç bitmişse yeniden denemenin anlamı yok; değişiklikler
           zaten localStorage'da (tek gerçek kaynak), yeniden girişte ilk
           çekim hepsini buluta taşır. */
        if (bittiMi(err)) { bitti(); return false; }
        /* Ağ yoksa kayıp olmasın: değişiklikler sıraya geri konur,
           bir sonraki yazmada yeniden denenir. Ders akışı beklemez. */
        for (var k in changes) if (!(k in pending)) pending[k] = changes[k];
        return false;
      });
  }

  /* Gönderilmemiş değişiklik var mı? ("Ben başkasıyım" uyarısı için.) */
  function bekleyenVar() { return Object.keys(pending).length > 0 || yolda > 0; }

  /* Sekme kapanırken 1,5 sn'lik gecikme dolmamış olabilir: bekleyenler
     keepalive ile gönderilir (sayfa kapansa da tarayıcı isteği bitirir).
     Gitmezse de kayıp yok — localStorage'da duruyor, sonraki açılışta ilk
     çekim hepsini buluta taşır; bu yalnızca başka cihaza geçen çocuk için. */
  function sonGonderim() {
    if (!token || !Object.keys(pending).length) return;
    var cfg = window.CLOUD_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey || typeof fetch !== 'function') return;
    try {
      fetch(cfg.url.replace(/\/$/, '') + '/functions/v1/learner-sync', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey },
        body: JSON.stringify({ token: token, changes: pending })
      }).catch(function () {});
      pending = {};
    } catch (e) { /* keepalive gövde sınırı (64 KB) ya da eski tarayıcı */ }
  }
  // test-merge.mjs sync.js'i tarayıcısız (vm) koşuyor: orada olay yok.
  if (typeof window.addEventListener === 'function') window.addEventListener('pagehide', sonGonderim);

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
        .then(cevabiIsle)
        .then(function (res) {
          var merged = mergeProgress(window.Store.snapshot(), (res && res.progress) || {});
          window.Store.applySnapshot(merged);
          return true;
        })
        .catch(function (err) {
          if (bittiMi(err)) bitti();
          return false;   /* çevrimdışı: yerel veriyle devam */
        });
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
  var API = {
    mergeProgress: mergeProgress, start: start, stop: stop, ready: Promise.resolve(false),
    flush: flush, bekleyenVar: bekleyenVar,
    onToken: null, onExpired: null
  };
  window.Sync = API;
})();
