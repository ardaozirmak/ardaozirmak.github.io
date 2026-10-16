/* ============================================================
   learner.js — Aktif öğrenci oturumu (window.Learner)
   ============================================================
   Öğrenci hesabına KULLANICI ADI + ŞİFRE ile girer. Şifresini
   unutursa kurtarma kelimesiyle yenisini koyar — öğretmene
   bağımlı kalmaz. Karar ve gerekçe:
   docs/superpowers/specs/2026-09-16-kullanici-adi-sifre.md
   (Giriş kodu düzeni — hayvan-renk-NN — kaldırıldı.)

   Oturum bilgisi CİHAZA aittir (learner_session_v1), ilerleme
   anahtarları ise aktif öğrencinin çalışma alanıdır. Hesap
   değişince çalışma alanı temizlenir, cihaz ayarları (ses
   tercihi gibi) kalır.
   ============================================================ */

(function () {
  'use strict';

  var SESSION_KEY = 'learner_session_v1';
  /* Çalışma alanındaki ilerleme KİMİN? Cihaza ait bir işaret, ilerleme
     anahtarı değil (PROGRESS_KEYS'e girmez, buluta gitmez). */
  var OWNER_KEY = 'learner_workspace_v1';
  /* Buluttaki ilerlemenin inmesi için en fazla bu kadar beklenir. Bu
     projede Edge Function gecikmesi 300 ms – 14 sn arasında oynuyor;
     çocuğu 14 sn "Giriliyor…" ekranında tutmak yerine, geç gelen veri
     indiğinde fx.js kendi sayacını tazeliyor (bkz. fx.js Store aboneliği). */
  var PULL_TIMEOUT = 5000;
  /* Süresi biten oturumun izi: kimin oturumuydu (ad + kullanıcı adı).
     Giriş ekranı bunu okuyup "Oturumun bitti, şifreni yaz" der ve kullanıcı
     adını hazır yazar. Cihaza ait, buluta gitmez. */
  var EXPIRED_KEY = 'learner_expired_v1';
  var session = null;

  try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { session = null; }

  function persist() {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) { /* gizli sekme */ }
  }

  /* Belirtecin süresi (exp, saniye) — imzayı istemci doğrulayamaz, ama
     süreyi okuyabilir: bitmiş belirteçle sunucuya gidip 401 beklemek
     yerine açılışta anlaşılır. Okunamazsa null (sunucu karar verir). */
  function belirtecSonu(t) {
    try {
      var p = String(t || '').split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
      var data = JSON.parse(atob(p + '==='.slice((p.length + 3) % 4)));
      return typeof data.exp === 'number' ? data.exp : null;
    } catch (e) { return null; }
  }

  function bitenOturum() {
    try { return JSON.parse(localStorage.getItem(EXPIRED_KEY) || 'null'); } catch (e) { return null; }
  }
  function bitenOturumuUnut() {
    try { localStorage.removeItem(EXPIRED_KEY); } catch (e) { /* gizli sekme */ }
  }

  /* Oturum bitti (2026-10-16): belirteç 30 günü doldurdu ya da sunucu
     reddetti. Eskiden bu sessizdi: çocuk girişli görünüyor, ilerlemesi
     buluta gitmiyordu. Şimdi oturum kapanır, ama ÇALIŞMA ALANI ve sahibi
     KALIR — aynı çocuk yeniden girince adopt() hiçbir şeyi silmez, aradaki
     ilerleme ilk çekimle buluta gider. */
  function expire() {
    if (!session) return;
    var l = session.learner || {};
    try {
      localStorage.setItem(EXPIRED_KEY, JSON.stringify({ username: l.username || '', name: l.display_name || '' }));
    } catch (e) { /* gizli sekme */ }
    if (window.Sync) window.Sync.stop();
    session = null;
    persist();
    if (window.LearnerUI && typeof window.LearnerUI.requireAccount === 'function') {
      try { window.LearnerUI.requireAccount(); } catch (e) { /* ekran yoksa sorun değil */ }
    }
  }

  if (session && session.token) {
    var son = belirtecSonu(session.token);
    if (son !== null && son < Math.floor(Date.now() / 1000)) {
      // Sayfa açılırken: henüz ekran yok, yalnız iz bırak ve oturumu kapat.
      var l0 = session.learner || {};
      try {
        localStorage.setItem(EXPIRED_KEY, JSON.stringify({ username: l0.username || '', name: l0.display_name || '' }));
      } catch (e) { /* gizli sekme */ }
      session = null;
      persist();
    }
  }

  /* Başka sekmede hesap değişti (2026-10-16 denetim bulgusu): localStorage
     bütün sekmelerde ortak, ama fx.js XP'yi açılışta belleğe alıyor. Okulda
     önceki çocuğun açık kalan sekmesinde tıklanınca onun XP'si ve "kaldığın
     yer"i yeni çocuğun hesabına yazılıyordu. Bu sekme bayatladıysa senkron
     durur ve sayfa yeniden yüklenir (yeni hesapla ya da giriş ekranıyla).
     Aynı çocuğun belirteci yenilendiyse yalnız bellekteki oturum güncellenir. */
  window.addEventListener('storage', function (e) {
    if (e.key !== null && e.key !== SESSION_KEY && e.key !== OWNER_KEY) return;
    var yeni = null;
    try { yeni = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (err) { yeni = null; }
    var buId = session && session.learner ? String(session.learner.id) : null;
    var yeniId = yeni && yeni.token && yeni.learner ? String(yeni.learner.id) : null;
    if (buId === yeniId) {
      if (session && yeni && yeni.token) session.token = yeni.token;
      return;
    }
    if (window.Sync) window.Sync.stop();
    session = null;   // depoya YAZMA: depo artık öbür sekmenin
    window.location.reload();
  });

  if (window.Sync) {
    window.Sync.onToken = function (t) {
      if (!session) return;
      session.token = t;
      persist();
    };
    window.Sync.onExpired = expire;
  }

  function current() { return session ? session.learner : null; }
  function isActive() { return !!(session && session.token); }

  function owner() {
    try { return localStorage.getItem(OWNER_KEY); } catch (e) { return null; }
  }
  function setOwner(id) {
    try { if (id) localStorage.setItem(OWNER_KEY, String(id)); } catch (e) { /* gizli sekme */ }
  }

  /* Söz en fazla PULL_TIMEOUT bekletir; süre dolarsa akış devam eder. */
  function enCok(sozu) {
    return new Promise(function (resolve) {
      var bitti = false;
      var t = setTimeout(function () { if (!bitti) { bitti = true; resolve(false); } }, PULL_TIMEOUT);
      Promise.resolve(sozu).then(function (v) {
        if (bitti) return;
        bitti = true; clearTimeout(t); resolve(v);
      }, function () {
        if (bitti) return;
        bitti = true; clearTimeout(t); resolve(false);
      });
    });
  }

  /* Oturumu kur ve buluttaki ilerleme CİHAZA İNENE KADAR bekle.
     Beklemek şart: çağıran (learner-ui) hemen ardından sayfayı
     yeniliyor ve yenileme yoldaki isteği iptal ediyordu — çocuk kendi
     hesabını XP'siz, rozetsiz görüyordu (Arda, 2026-09-21).

     Çalışma alanı başka bir öğrenciye aitse ÖNCE temizlenir: birleştirme
     kuralı ("hiçbir kazanım kaybolmaz") aynı öğrencinin iki cihazı için
     doğru, iki ayrı öğrenci arasında uygulanırsa A'nın XP'si B'ye geçer.
     Aynı öğrenci yeniden giriyorsa temizlik YOK — çevrimdışı kazanılmış
     ama henüz buluta gidememiş ilerleme silinmesin. */
  function adopt(data) {
    var yeni = (data.learner && data.learner.id) ? String(data.learner.id) : null;
    var onceki = owner();
    if (onceki && yeni && onceki !== yeni) window.Store.clearProgress();

    session = { token: data.token, learner: data.learner };
    persist();
    setOwner(yeni);
    bitenOturumuUnut();
    // Profil bilgisini mevcut Profile modülünün beklediği biçime yaz
    if (data.learner && data.learner.display_name) {
      window.Store.setJSON('profile_v1', {
        name: data.learner.display_name,
        age: data.learner.age,
        level: data.learner.level || 1
      });
    }
    if (!(session.token && window.Sync)) return Promise.resolve(session.learner);
    return enCok(window.Sync.start(session.token)).then(function () { return session.learner; });
  }

  /* Yeni hesap. opts.adoptLocal: cihazdaki ilerleme bu çocuğa mı ait?
     Karar hesap açılmadan ÖNCE verilir — clearProgress adopt()'tan önce
     çağrılmalı, yoksa adopt()'un yazdığı profile_v1 silinir (o da
     PROGRESS_KEYS içinde). */
  function register(bilgi, opts) {
    if (!window.Cloud || !window.Cloud.enabled()) return Promise.reject(new Error('bulut-kapali'));
    var adoptLocal = !!(opts && opts.adoptLocal === true);
    var localSnapshot = null;
    if (adoptLocal) {
      localSnapshot = window.Store.snapshot();
      // Taşınan şey İLERLEME, kimlik değil: profile_v1 de snapshot'ta
      // geliyor ve geri yazıldığında çocuğun az önce yazdığı ad/yaşı
      // eski profille eziyordu.
      delete localSnapshot.profile_v1;
    } else {
      window.Store.clearProgress();
    }
    return window.Cloud.call('learner-register', {
      display_name: bilgi.name,
      age: bilgi.age,
      username: bilgi.username,
      password: bilgi.password,
      recovery: bilgi.recovery
    }).then(adopt).then(function (learner) {
      // Snapshot en son geri yazılır: ilk learner-sync bunu buluta taşır.
      if (adoptLocal) window.Store.applySnapshot(localSnapshot);
      return learner;
    });
  }

  function login(username, password) {
    if (!window.Cloud || !window.Cloud.enabled()) return Promise.reject(new Error('bulut-kapali'));
    return window.Cloud.call('learner-login', { username: username, password: password }).then(adopt);
  }

  /* Şifremi unuttum: kullanıcı adı + kurtarma kelimesi → yeni şifre.
     Sunucu aynı istekte belirteç de döner, çocuk bir de giriş yapmak
     zorunda kalmasın. */
  function recover(username, recovery, password) {
    if (!window.Cloud || !window.Cloud.enabled()) return Promise.reject(new Error('bulut-kapali'));
    return window.Cloud.call('learner-recover', {
      username: username, recovery: recovery, password: password
    }).then(adopt);
  }

  /* Ortak bilgisayar: "Ben başkasıyım". Oturumu ve çalışma alanını
     temizler; buluttaki veri olduğu gibi kalır.

     Çağıran sayfayı YENİDEN YÜKLEMELİ. Sebep ölçüldü: fx.js XP'yi
     açılışta bir kez okuyup bellekte tutuyor ve Store'u dinlemiyor —
     temizlikten sonra bellekteki eski değer duruyor ve bir sonraki
     puanda geri yazılıyor (60 XP + yeni çocuğun 10'u = 70). Tek tek
     modüllere yama yazmak yerine yeniden yükleme hepsini garanti eder. */
  function switchBox() {
    if (window.Sync) window.Sync.stop();
    session = null;
    persist();
    window.Store.clearProgress();
    /* Çalışma alanı artık kimsenin değil: bir sonraki giriş "sahip
       değişti mi" sorusunu temiz bir sayfadan sorsun. */
    try { localStorage.removeItem(OWNER_KEY); } catch (e) { /* gizli sekme */ }
    bitenOturumuUnut();
  }

  if (isActive() && window.Sync) window.Sync.start(session.token);

  window.Learner = {
    current: current, isActive: isActive,
    /* Site içi AI yardımcısı (ai-sohbet.js) belirteci istek GÖVDESİNDE gönderir —
       learner-sync ile aynı desen (Authorization başlığında anon anahtar). */
    token: function () { return session ? session.token : null; },
    register: register, login: login, recover: recover,
    switchBox: switchBox,
    /* Süresi biten oturumun izi ({ username, name }) ya da null. */
    expiredSession: bitenOturum,
    expire: expire
  };
})();
