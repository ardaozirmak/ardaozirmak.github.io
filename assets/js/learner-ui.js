/* ============================================================
   learner-ui.js — Giriş ekranı ve köşedeki profil rozeti
   ============================================================
   Öğrenci KULLANICI ADI + ŞİFRE ile girer (karar:
   docs/superpowers/specs/2026-09-16-kullanici-adi-sifre.md).
   Bu dosya iki şey üretir:

   1. window.LearnerUI.requireAccount() — hesabı olmayan çocuğa
      KİLİTLİ giriş ekranı açar: ✕ yok, Esc yok, dışarı tık yok.
      Üç sayfada da çağrılır; "hesabı olmayan erişemez" kuralı
      bir uyarı metni değil, arayüz kısıtıdır.

   2. window.LearnerUI.mountBadge() — her üç sayfada da otomatik
      kendini ekler (fx.js'in HUD'u gibi). Oturum varsa öğrencinin
      adını ve kullanıcı adını gösterir.

   Ekran dili SEVİYEYE göre değişir (yaştan hesaplanıyor): küçükte
   "kutu", 14 yaş ve üzerinde "hesap". Aynı siteyi 9. sınıf da
   kullanıyor; akış ve alanlar aynı, yalnızca sözcükler değişir.

   Bağımlılıklar: window.Learner (learner.js), window.FX (fx.js,
   ses/kutlama için), varsa window.LessonEngine (index.html ve
   lesson-1-2.html'de kopyalama toast'ı için — portal.html'de yok,
   o yüzden burada KENDİ pano yedek zinciri de var).
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Ekran dili: seviyeye göre ----------
     level sunucuda yaştan hesaplanıyor (1: ≤13, 2: 14-15, 3: 16+).
     Arda: "9. sınıf aynı siteyi kullanabilir." Çocuk dili büyüğü
     iter, büyük dili çocuğu yabancılaştırır; ikisini de tek akışta
     tutmanın yolu sözcükleri ayırmak. */
  function sozluk(level) {
    var kucuk = !level || level <= 1;
    return {
      kucuk: kucuk,
      yer: kucuk ? 'kutun' : 'hesabın',
      acBaslik: kucuk ? 'Kutunu açalım' : 'Hesabını oluşturalım',
      hazirBaslik: kucuk ? 'Kutun hazır!' : 'Hesabın hazır!',
      eyebrowIkon: kucuk ? 'konfeti' : '', eyebrow: kucuk ? 'Kutun Hazır' : 'Hesap oluşturuldu',
      girisBaslik: kucuk ? 'Kutuna gir' : 'Giriş yap'
    };
  }

  /* Yaştan seviye — supabase/functions/learner-register içindeki
     computeLevel ile AYNI eşikler. İkisi ayrışırsa çocuk kayıt
     ekranında bir dil, girişte başka bir dil görür. */
  function seviyeTahmin(age) {
    if (!age || age <= 13) return 1;
    if (age <= 15) return 2;
    return 3;
  }

  /* Kullanıcı adı indirgemesi — supabase/functions/_shared/username.ts
     ile aynı kural. Çocuk "Ayşe" yazar, sunucu "ayse" arar; iki taraf
     ayrışırsa çocuk kendi adını doğru yazdığı hâlde giremez. */
  function normalizeUsername(raw) {
    return String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/ı/g, 'i')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function usernameError(name) {
    if (!name) return 'Kullanıcı adı yazmalısın.';
    if (name.length < 3) return 'Kullanıcı adı en az 3 harf olmalı.';
    if (name.length > 16) return 'Kullanıcı adı en fazla 16 harf olabilir.';
    return null;
  }

  function passwordError(pw) {
    if (!pw) return 'Şifre yazmalısın.';
    if (pw.length < 4) return 'Şifre en az 4 karakter olmalı.';
    return null;
  }

  /* Kurtarma kelimesi kuralı — supabase/functions/_shared/recovery.ts ile
     AYNI liste ve eşik. Neden var, orada yazıyor (kısaca: "kedi" yazan
     çocuğun hesabı sınıfta tahminle açılıyordu). Girdi indirgenmiş olmalı. */
  var KURTARMA_MIN = 5;
  var YAYGIN_KELIME = ('kedi kopek kus balik aslan kaplan tavsan zurafa maymun ayi kurt tilki inek ' +
    'koyun keci tavuk ordek kelebek yilan kaplumbaga penguen panda yunus hamster papagan kanarya ' +
    'sincap baykus kartal ejderha dinozor unicorn kirmizi mavi yesil sari mor pembe siyah beyaz ' +
    'turuncu pizza cikolata dondurma elma cilek karpuz makarna hamburger futbol basketbol voleybol ' +
    'galatasaray fenerbahce besiktas trabzonspor anne anneanne babaanne baba abla kardes deneyap ' +
    'sifre sifrem parola robot araba minecraft roblox fortnite oyun okul ogretmen istanbul ankara ' +
    'izmir turkiye ataturk 12345 123456 1234567 12345678 abcde qwerty').split(' ');

  function kurtarmaHatasi(rec, username) {
    if (!rec) return 'Kurtarma kelimesi yazmalısın.';
    if (rec.length < KURTARMA_MIN) return 'Kurtarma kelimen en az ' + KURTARMA_MIN + ' harf olsun.';
    if (rec === username) return 'Kurtarma kelimen kullanıcı adınla aynı olmasın.';
    if (YAYGIN_KELIME.indexOf(rec) !== -1 || YAYGIN_KELIME.indexOf(rec.replace(/[0-9-]+$/, '')) !== -1) {
      return 'Bu kelimeyi herkes tahmin eder. İki kelimeyi birleştir, örneğin uçan-patates.';
    }
    return null;
  }

  /* Adından kullanıcı adı önerilir. Beş alanlı bir formu 10 yaşındaki
     çocuk dolduramaz; öneri yazma yükünü alır, karar çocukta kalır
     (alan düzenlenebilir). */
  function onerilenKullaniciAdi(name) {
    var kok = normalizeUsername(name).slice(0, 12) || 'mucit';
    return kok + String(Math.floor(Math.random() * 90) + 10);
  }

  /* Rozet avatarı: hayvan emojisi gitti (giriş kodu ile birlikte),
     yerine çocuğun kendi baş harfi. */
  function basHarf(name) {
    var ch = String(name || '?').trim().charAt(0);
    return ch ? ch.toLocaleUpperCase('tr') : '?';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ============================================================
  // PANO KOPYALAMA — LessonEngine varsa onu kullan (index.html,
  // lesson-1-2.html), yoksa (portal.html) aynı yedek zinciri burada
  // tekrar kurulur: clipboard API -> gizli textarea -> prompt().
  // navigator.clipboard hiçbir yerde DOĞRUDAN çağrılmıyor.
  // ============================================================
  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var okExec = document.execCommand('copy');
      document.body.removeChild(ta);
      if (okExec) return true;
    } catch (e) { /* aşağıdaki prompt'a düşülür */ }
    window.prompt('Kopyalamak için Ctrl+C, sonra Enter:', text);
    return 'manual';
  }

  function copyTextFallback(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; })
        .catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  /* btn: geri bildirimin göründüğü buton elemanı. Döner: Promise<boolean> (gerçekten kopyalandı mı). */
  function copyCode(text, btn) {
    var promise = (window.LessonEngine && typeof LessonEngine.copyWithToast === 'function')
      ? LessonEngine.copyWithToast(text, 'Kod kopyalandı!', function () { if (window.FX) FX.copied(btn); })
      : copyTextFallback(text).then(function (res) {
          if (res === 'manual') return false;
          if (window.FX) FX.copied(btn);
          return true;
        });

    return promise.then(function (copied) {
      if (!btn) return copied;
      var original = btn.getAttribute('data-label') || btn.textContent;
      btn.setAttribute('data-label', original);
      if (copied) {
        btn.classList.add('copied');
        btn.textContent = 'Kopyalandı! ✓';
      } else {
        btn.textContent = 'Kopyalama kutusu açıldı — Ctrl+C ile kopyala';
      }
      clearTimeout(btn._resetTimer);
      btn._resetTimer = setTimeout(function () {
        btn.classList.remove('copied');
        btn.textContent = original;
      }, 1800);
      return copied;
    });
  }

  // ============================================================
  // HATA METİNLERİ — sunucu kodu + kendi mesajını döndürüyor
  // (bkz. supabase/functions/learner-*). Cloud.call reddettiğinde
  // err.context bir Response'tur (FunctionsHttpError).
  // Sunucu bir "message" verdiyse O kullanılır: kural sunucuda
  // yazılı, iki yerde iki ayrı metin tutulmasın.
  // ============================================================
  function reasonFromError(err) {
    if (err && err.message === 'bulut-kapali') {
      return Promise.resolve('Şu an bağlanamıyorum. Birazdan tekrar dene.');
    }
    /* Sunucuya HİÇ ulaşılamadı: ağ yok, ya da çağrılan uç dağıtılmamış
       (olmayan bir Edge Function'a giden istek CORS'ta ölüyor, tarayıcı
       da bunu "Failed to fetch" diye bildiriyor — gövde okunamıyor).
       Eskiden ikisi de "Bir şeyler ters gitti"ye düşüyordu ve bu, uçlar
       dağıtılmadan denendiğinde ekranda gerçekten göründü. Çocuğa ne
       yapacağını söyleyen bir cümle, geliştiriciye konsolda ham hata. */
    var ag = err && (err.name === 'FunctionsFetchError' ||
      /failed to (send|fetch)|networkerror|load failed/i.test(String(err.message || '')));
    if (ag && !(err.context && typeof err.context.json === 'function')) {
      try { console.error('[learner] sunucuya ulaşılamadı:', err); } catch (e) {}
      return Promise.resolve('Sunucuya ulaşamadım. İnternetini kontrol edip tekrar dene.');
    }
    if (err && err.context && typeof err.context.json === 'function') {
      return err.context.json().then(function (body) {
        var code = body && body.error;
        /* Engel artık doğru şifreyi de durduruyor (deneme sınırı doğrulamadan
           önce, kullanıcı adı başına): çocuk "şifrem doğru ama giremiyorum"
           diye kalmasın, ne olduğunu bilsin. */
        if (code === 'cok-deneme') return 'Bu hesapta çok fazla yanlış deneme oldu, bir süre kilitli. Biraz sonra tekrar dene.';
        if (body && body.message) return body.message;
        if (code === 'kullanici-adi-dolu') return 'Bu kullanıcı adı kullanılıyor.';
        if (code === 'hatali-giris') return 'Kullanıcı adı ya da şifre yanlış.';
        if (code === 'hatali-kurtarma') return 'Kullanıcı adı ya da kurtarma kelimesi yanlış.';
        if (code === 'isim-gerekli') return 'Adını yazar mısın?';
        return 'Bir şeyler ters gitti. Tekrar dener misin?';
      }).catch(function () { return 'Bir şeyler ters gitti. Tekrar dener misin?'; });
    }
    return Promise.resolve('Bir şeyler ters gitti. Tekrar dener misin?');
  }

  // ============================================================
  // GATE — .learner-gate kabuğu, tek DOM elemanı; ekranlar arası
  // geçiş içeriğini değiştirerek olur (yeniden açılıp kapanmaz).
  // ============================================================
  var gateEl = null;
  var lockedScreen = false;
  var lastFocus = null;

  function onGateKeydown(e) {
    if (e.key === 'Escape' && !lockedScreen) closeGate();
    /* Odak tuzağı: Tab giriş kartının dışına çıkmasın. Denetim bulgusu
       (2026-10-16): kilitli kapı fareyle aşılamıyordu ama Tab ile arkadaki
       dersin düğmelerine gidilip Enter'la ders ilerletilebiliyordu.
       Asıl kilit arkaya konan inert (arkayiKapat); bu, inert'i
       desteklemeyen tarayıcı için yedek. */
    if (e.key === 'Tab' && gateEl) {
      var odaklar = [].filter.call(
        gateEl.querySelectorAll('button, input, a[href], [tabindex]:not([tabindex="-1"])'),
        function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!odaklar.length) { e.preventDefault(); return; }
      var ilk = odaklar[0], son = odaklar[odaklar.length - 1];
      var icinde = gateEl.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === ilk || !icinde)) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && (document.activeElement === son || !icinde)) { e.preventDefault(); ilk.focus(); }
    }
  }

  /* Kapı açıkken arkadaki sayfa klavyeye, fareye ve ekran okuyucuya kapalı. */
  var inertEdilen = [];
  function arkayiKapat() {
    var cocuklar = document.body.children;
    for (var i = 0; i < cocuklar.length; i++) {
      var el = cocuklar[i];
      if (el === gateEl || el.hasAttribute('inert') || el.tagName === 'SCRIPT') continue;
      el.setAttribute('inert', '');
      inertEdilen.push(el);
    }
  }
  function arkayiAc() {
    for (var i = 0; i < inertEdilen.length; i++) inertEdilen[i].removeAttribute('inert');
    inertEdilen = [];
  }

  var bodyStyle = null;

  function ensureGate() {
    if (gateEl) return gateEl;
    gateEl = document.createElement('div');
    gateEl.className = 'learner-gate';
    gateEl.setAttribute('role', 'dialog');
    gateEl.setAttribute('aria-modal', 'true');
    // Erişilebilir ad: her ekranın başlığı aynı id'yi taşır.
    gateEl.setAttribute('aria-labelledby', 'learnerGateTitle');
    gateEl.addEventListener('mousedown', function (e) {
      if (e.target === gateEl && !lockedScreen) closeGate();
    });
    document.addEventListener('keydown', onGateKeydown);
    document.body.appendChild(gateEl);
    kilitle();
    arkayiKapat();
    return gateEl;
  }

  /* Giriş ekranı açıkken arkadaki sayfa kaydırılamaz. Kaydırma
     çubuğu kaybolunca sayfa yana sıçramasın diye genişliği kadar
     dolgu bırakılır. */
  function kilitle() {
    if (bodyStyle !== null) return;
    var bar = window.innerWidth - document.documentElement.clientWidth;
    // Kaydıran eleman tarayıcıya göre <html> ya da <body> olabilir;
    // sadece birine kilit koymak yetmiyor.
    var kok = document.documentElement;
    bodyStyle = {
      overflow: document.body.style.overflow,
      padding: document.body.style.paddingRight,
      kokOverflow: kok.style.overflow
    };
    document.body.style.overflow = 'hidden';
    kok.style.overflow = 'hidden';
    if (bar > 0) document.body.style.paddingRight = bar + 'px';
  }

  function kilidiAc() {
    if (bodyStyle === null) return;
    document.body.style.overflow = bodyStyle.overflow;
    document.body.style.paddingRight = bodyStyle.padding;
    document.documentElement.style.overflow = bodyStyle.kokOverflow;
    bodyStyle = null;
  }

  function closeGate() {
    if (!gateEl) return;
    document.body.classList.remove('learner-gate-locked');
    document.removeEventListener('keydown', onGateKeydown);
    gateEl.parentNode.removeChild(gateEl);
    gateEl = null;
    kilidiAc();
    arkayiAc();
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus(); } catch (e) { /* eleman kalkmış olabilir */ }
    }
  }

  /* html: kartın İÇİ. locked true ise kapatma (X, dış tık, Esc) devre dışı —
     kod kartı ekranı bunu kullanır, kodun kaybolmaması bir tasarım kararı. */
  function setScreen(html, locked) {
    var gate = ensureGate();
    lockedScreen = !!locked;
    /* Kilitli ekranda köşedeki rozet gizlenir: "Giriş yap" düğmesini
       zaten kapatılamayan bir giriş ekranının üstünde göstermenin
       anlamı yok, çocuğa iki ayrı kapı varmış gibi duruyor. */
    document.body.classList.toggle('learner-gate-locked', lockedScreen);
    gate.innerHTML = '<div class="learner-gate-card">' +
      (lockedScreen ? '' : '<button type="button" class="learner-gate-close" aria-label="Kapat">✕</button>') +
      html +
      '</div>';
    if (!lockedScreen) {
      gate.querySelector('.learner-gate-close').addEventListener('click', closeGate);
    }
    var firstField = gate.querySelector('input');
    if (firstField) firstField.focus();
  }

  function onEnter(el, handler) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); handler(); }
    });
  }

  /* Sunucuyu ISIT. Ölçüldü (2026-09-16): bu projede Edge Function çağrımı
     300 ms ile 14 sn arasında oynuyor ve bu, fonksiyonun İÇİNDEKİ işle
     ilgili değil — hiçbir import'u olmayan boş bir fonksiyon da aynı
     şekilde yavaş, aynı anda REST yolu 68 ms. Kodla düzeltilecek bir şey
     yok; ama çocuk ad/yaş/kullanıcı adı/şifre/kurtarma kelimesi yazarken
     10+ saniye geçiyor. Ekran açılır açılmaz boş bir istek göndermek o
     süreyi bekleme yerine kullanıyor. Hata umursanmaz: istek zaten
     "eksik-giris" ile dönecek, amacı sunucuyu ayağa kaldırmak. */
  function isit() {
    if (!window.Cloud || !window.Cloud.enabled()) return;
    ['learner-register', 'learner-login'].forEach(function (uc) {
      try { Cloud.call(uc, {}).catch(function () {}); } catch (e) {}
    });
  }

  /* Bekleme uzarsa çocuk "bozuldu" sanıp üst üste basıyor. Üç buçuk
     saniyeden sonra ne olduğunu söyleyen bir satır çıkıyor. */
  function sabirNotu(ac) {
    var gate = gateEl;
    if (!gate) return;
    var not = gate.querySelector('.learner-gate-wait');
    if (ac && !not) {
      not = document.createElement('p');
      not.className = 'learner-gate-wait';
      not.textContent = 'Sunucu uyanıyor, birkaç saniye sürebilir…';
      var yer = gate.querySelector('.learner-gate-actions');
      if (yer) yer.parentNode.insertBefore(not, yer.nextSibling);
    } else if (!ac && not) {
      not.parentNode.removeChild(not);
    }
  }

  var sabirZaman = null;

  function setBusy(btn, busy, busyLabel, idleLabel) {
    btn.disabled = busy;
    btn.innerHTML = busy
      ? '<span class="learner-gate-spin" aria-hidden="true"></span> ' + esc(busyLabel)
      : esc(idleLabel);
    clearTimeout(sabirZaman);
    if (busy) {
      sabirZaman = setTimeout(function () { sabirNotu(true); }, 3500);
    } else {
      sabirNotu(false);
    }
  }

  function showError(gate, msg) {
    var el = gate.querySelector('.learner-gate-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
  }
  function hideError(gate) {
    var el = gate.querySelector('.learner-gate-error');
    if (el) el.classList.remove('show');
  }

  // ---------- Ekran 1: Seçim ----------
  /* Cihazda gerçekten ilerleme var mı? profile_v1 tek başına
     ilerleme değildir (sadece ad/yaş), sıfır XP de öyle — yoksa
     hiç ders yapmamış çocuğa da göç sorusu sorulur. */
  function yerelIlerlemeVar() {
    if (!window.Store) return false;
    var snap = window.Store.snapshot();
    for (var k in snap) {
      if (!Object.prototype.hasOwnProperty.call(snap, k)) continue;
      if (k === 'profile_v1') continue;
      if (k === 'fx_xp_v1' && !(parseInt(snap[k], 10) > 0)) continue;
      if (k === 'fx_claims_v1' && (!snap[k] || snap[k] === '{}')) continue;
      return true;
    }
    return false;
  }

  /* Kapı zorunlu mu? requireAccount ile açıldıysa evet: bütün
     ekranlar kilitli çizilir (✕ yok, Esc yok, dış tık yok). Rozetten
     elle açıldıysa (hesapsız modda) kapatılabilir kalır. */
  var kapiZorunlu = false;

  function kilitliMi() { return kapiZorunlu; }

  /* Şifre alanı: maskeli ama 👁 ile gösterilebilir. Çocuk yazdığını
     göremeyince yanlış yazıp nedenini anlamıyor; "tekrar yaz" alanı
     eklemek ise bir alan daha demek (kurtarma kelimesi zaten yanlış
     yazımı kurtarıyor). */
  function sifreAlani(id, label, placeholder) {
    return '<div class="learner-gate-field text">' +
      '<label for="' + id + '">' + esc(label) + '</label>' +
      '<div class="learner-gate-pass">' +
        '<input type="password" id="' + id + '" class="learner-gate-input" ' +
          'maxlength="72" placeholder="' + esc(placeholder || '') + '" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="learner-gate-eye" data-eye="' + id + '" ' +
          'aria-label="Şifreyi göster">👁</button>' +
      '</div>' +
    '</div>';
  }

  function goziBagla(gate) {
    var eyes = gate.querySelectorAll('.learner-gate-eye');
    for (var i = 0; i < eyes.length; i++) {
      eyes[i].addEventListener('click', function () {
        var input = gate.querySelector('#' + this.getAttribute('data-eye'));
        if (!input) return;
        var gizli = input.type === 'password';
        input.type = gizli ? 'text' : 'password';
        this.setAttribute('aria-label', gizli ? 'Şifreyi gizle' : 'Şifreyi göster');
        input.focus();
      });
    }
  }

  // ---------- Ekran 1: Ad + yaş ----------
  /* Bu ekranda "kutu"/"hesap" sözcüğü GEÇMEZ: seviye henüz bilinmiyor
     (yaş bu ekranda soruluyor). Açıklama kutusu ikisine de uyan bir
     dille yazıldı, doğru sözcük ikinci ekrandan itibaren geliyor. */
  function renderStart() {
    var html =
      '<span class="learner-gate-eyebrow">Deneyap Atölyem</span>' +
      '<h2 class="learner-gate-title" id="learnerGateTitle">Başlayalım</h2>' +
      '<div class="learner-gate-what">' +
        '<span class="learner-gate-what-icon">🎒</span>' +
        '<p class="learner-gate-what-text">' +
          '<strong>Burası senin kendi yerin.</strong> ' +
          'Rozetlerin ve puanların burada durur. ' +
          'Başka bir bilgisayarda da kullanıcı adınla girersin.' +
        '</p>' +
      '</div>' +
      '<p class="learner-gate-sub">Önce adını ve yaşını öğrenelim.</p>' +
      '<div class="learner-gate-error" role="alert"></div>' +
      '<div class="learner-gate-row">' +
        '<div class="learner-gate-field text">' +
          '<label for="gateNameInput">Adın</label>' +
          '<input type="text" id="gateNameInput" class="learner-gate-input" maxlength="40" placeholder="Adın" autocomplete="off">' +
        '</div>' +
        '<div class="learner-gate-field text">' +
          '<label for="gateAgeInput">Yaşın</label>' +
          '<input type="number" id="gateAgeInput" class="learner-gate-input" min="5" max="19" placeholder="Yaşın" autocomplete="off">' +
        '</div>' +
      '</div>' +
      '<div class="learner-gate-actions">' +
        '<button type="button" class="portal-btn primary learner-gate-cta" id="gateNextBtn">Devam</button>' +
      '</div>' +
      '<div class="learner-gate-alt">' +
        '<button type="button" class="learner-gate-altlink" data-action="have-account">Hesabım var, giriş yapacağım</button>' +
      '</div>';
    setScreen(html, kilitliMi());
    var gate = gateEl;
    gate.querySelector('[data-action="have-account"]').addEventListener('click', renderLogin);
    var nameInput = gate.querySelector('#gateNameInput');
    var ageInput = gate.querySelector('#gateAgeInput');
    var btn = gate.querySelector('#gateNextBtn');

    function submit() {
      hideError(gate);
      var name = nameInput.value.trim();
      var age = parseInt(ageInput.value, 10);
      if (!name) { showError(gate, 'Adını yazar mısın?'); nameInput.focus(); return; }
      if (!age || age < 5 || age > 19) { showError(gate, 'Yaşını da yazar mısın?'); ageInput.focus(); return; }
      renderCredentials({ name: name, age: age, username: onerilenKullaniciAdi(name) });
    }
    btn.addEventListener('click', submit);
    onEnter(nameInput, submit);
    onEnter(ageInput, submit);
  }

  // ---------- Ekran 2: Kullanıcı adı + şifre ----------
  function renderCredentials(bilgi) {
    var d = sozluk(seviyeTahmin(bilgi.age));
    var html =
      '<button type="button" class="learner-gate-back">← Geri</button>' +
      '<h2 class="learner-gate-title" id="learnerGateTitle">' + esc(d.acBaslik) + '</h2>' +
      '<p class="learner-gate-sub">Her girişte bu ikisini yazacaksın.</p>' +
      '<div class="learner-gate-error" role="alert"></div>' +
      '<div class="learner-gate-field text">' +
        '<label for="gateUserInput">Kullanıcı adın</label>' +
        '<input type="text" id="gateUserInput" class="learner-gate-input" maxlength="16" ' +
          'value="' + esc(bilgi.username || '') + '" autocomplete="off" autocapitalize="off" ' +
          'spellcheck="false" style="text-transform:lowercase;">' +
        '<span class="learner-gate-hint">Küçük harf ve rakam. İstersen değiştir.</span>' +
      '</div>' +
      sifreAlani('gatePassInput', 'Şifren', 'en az 4 karakter') +
      '<div class="learner-gate-actions">' +
        '<button type="button" class="portal-btn primary learner-gate-cta" id="gateCredBtn">Devam</button>' +
      '</div>';
    setScreen(html, kilitliMi());
    var gate = gateEl;
    goziBagla(gate);
    gate.querySelector('.learner-gate-back').addEventListener('click', renderStart);
    var userInput = gate.querySelector('#gateUserInput');
    var passInput = gate.querySelector('#gatePassInput');
    var btn = gate.querySelector('#gateCredBtn');

    function submit() {
      hideError(gate);
      var username = normalizeUsername(userInput.value);
      var uErr = usernameError(username);
      if (uErr) { showError(gate, uErr); userInput.focus(); return; }
      var pErr = passwordError(passInput.value);
      if (pErr) { showError(gate, pErr); passInput.focus(); return; }
      renderRecovery({ name: bilgi.name, age: bilgi.age, username: username, password: passInput.value });
    }
    btn.addEventListener('click', submit);
    onEnter(userInput, submit);
    onEnter(passInput, submit);
  }

  // ---------- Ekran 3: Kurtarma kelimesi ----------
  /* Arda'nın kararı: çocuk şifresini unutunca öğretmene bağımlı
     kalmadan kendini kurtarabilmeli. REDDEDİLEN seçenek "kullanıcı
     adını bilen şifreyi değiştirsin"di — sınıfta kullanıcı adları
     birbirine görünür, o hâlde şifre hiçbir şeyi korumaz. */
  function renderRecovery(bilgi) {
    var html =
      '<button type="button" class="learner-gate-back">← Geri</button>' +
      '<h2 class="learner-gate-title" id="learnerGateTitle">Şifreni unutursan</h2>' +
      '<div class="learner-gate-what">' +
        '<span class="learner-gate-what-icon">🔑</span>' +
        '<p class="learner-gate-what-text">' +
          /* <b>, <strong> değil: learner.css'te .learner-gate-what-text strong
             blok (ilk ekranın başlığı); cümle içinde üç satıra bölüyordu. */
          'Bir <b>kurtarma kelimesi</b> seç. Şifreni unutursan ' +
          'bu kelimeyle yeni şifre koyabilirsin. Kimseye söyleme. ' +
          'Arkadaşın tahmin edemesin: <b>iki kelimeyi birleştir</b>.' +
        '</p>' +
      '</div>' +
      '<div class="learner-gate-error" role="alert"></div>' +
      '<div class="learner-gate-field text">' +
        '<label for="gateRecInput">Kurtarma kelimen</label>' +
        '<input type="text" id="gateRecInput" class="learner-gate-input" maxlength="32" ' +
          'placeholder="örn. uçan patates" autocomplete="off" spellcheck="false">' +
      '</div>' +
      '<div class="learner-gate-actions">' +
        '<button type="button" class="portal-btn primary learner-gate-cta" id="gateRecBtn">Hazırım</button>' +
      '</div>';
    setScreen(html, kilitliMi());
    var gate = gateEl;
    gate.querySelector('.learner-gate-back').addEventListener('click', function () { renderCredentials(bilgi); });
    var recInput = gate.querySelector('#gateRecInput');
    var btn = gate.querySelector('#gateRecBtn');

    function submit() {
      hideError(gate);
      var rec = normalizeUsername(recInput.value);
      var rErr = kurtarmaHatasi(rec, bilgi.username);
      if (rErr) { showError(gate, rErr); recInput.focus(); return; }
      var tam = { name: bilgi.name, age: bilgi.age, username: bilgi.username, password: bilgi.password, recovery: rec };
      // Cihazda ilerleme varsa kime ait olduğu sorulur; sormadan taşımak
      // başkasının rozetini, sormadan silmek çocuğun emeğini kaybettirir.
      if (yerelIlerlemeVar()) { renderAdoptAsk(tam); return; }
      acHesap(tam, false, btn, gate);
    }
    btn.addEventListener('click', submit);
    onEnter(recInput, submit);
  }

  // ---------- Ekran 3b: Göç sorusu (cihazda ilerleme varsa) ----------
  function renderAdoptAsk(bilgi) {
    var html =
      '<button type="button" class="learner-gate-back">← Geri</button>' +
      '<h2 class="learner-gate-title" id="learnerGateTitle">Burada bir ilerleme var</h2>' +
      '<p class="learner-gate-sub">Bu bilgisayarda rozetler duruyor. Senin mi?</p>' +
      '<div class="learner-gate-error" role="alert"></div>' +
      '<div class="learner-gate-actions column">' +
        '<button type="button" class="portal-btn primary learner-gate-cta" data-action="adopt-yes">Evet, benim</button>' +
        '<button type="button" class="portal-btn ghost learner-gate-cta" data-action="adopt-no">Hayır, sıfırdan başla</button>' +
      '</div>';
    setScreen(html, kilitliMi());
    var gate = gateEl;
    gate.querySelector('.learner-gate-back').addEventListener('click', function () { renderRecovery(bilgi); });
    var yes = gate.querySelector('[data-action="adopt-yes"]');
    var no = gate.querySelector('[data-action="adopt-no"]');
    yes.addEventListener('click', function () { acHesap(bilgi, true, yes, gate); });
    no.addEventListener('click', function () { acHesap(bilgi, false, no, gate); });
  }

  /* Hesabı açan tek yol: kurtarma ekranı ya da göç sorusu buraya düşer. */
  function acHesap(bilgi, adoptLocal, btn, gate) {
    var etiket = btn.textContent;
    setBusy(btn, true, 'Hazırlanıyor…', etiket);
    window.Learner.register(bilgi, { adoptLocal: adoptLocal }).then(function (learner) {
      paintBadge();
      renderDone(learner);
    }).catch(function (err) {
      setBusy(btn, false, '', etiket);
      reasonFromError(err).then(function (msg) {
        showError(gate, msg);
        // Kullanıcı adı doluysa çocuk oraya dönebilmeli: hata mesajını
        // okuyup "ne yapacağım" diye kalmasın.
        if (/kullanılıyor/i.test(msg)) {
          setTimeout(function () { renderCredentials(bilgi); showError(gateEl, msg); }, 900);
        }
      });
    });
  }

  // ---------- Ekran 4: Özet (imza öğesi) ----------
  function renderDone(learner) {
    var d = sozluk(learner && learner.level);
    var kadi = (learner && learner.username) || '';
    var html =
      '<span class="learner-gate-eyebrow">' + (d.eyebrowIkon ? '<img class="fx-ikon" src="assets/img/fx/fx-' + d.eyebrowIkon + '.webp" alt="" aria-hidden="true" draggable="false"> ' : '') + esc(d.eyebrow) + '</span>' +
      '<h2 class="learner-gate-title" id="learnerGateTitle">' + esc(d.hazirBaslik) + '</h2>' +
      '<p class="learner-gate-sub">Kullanıcı adını bir yere yaz, unutma.</p>' +
      '<div class="learner-code-card">' +
        '<div class="learner-code-avatar">' + esc(basHarf(learner && learner.display_name)) + '</div>' +
        '<div class="learner-code-value"><span class="learner-code-seg">' + esc(kadi) + '</span></div>' +
        '<button type="button" class="portal-btn ghost learner-code-copy" id="gateCopyBtn">📋 Kullanıcı adımı kopyala</button>' +
        '<div class="learner-code-note">🔒 Şifreni kimseye söyleme.</div>' +
      '</div>' +
      '<div class="learner-gate-actions">' +
        '<button type="button" class="portal-btn primary learner-gate-cta" id="gateStartBtn">Başlayalım</button>' +
      '</div>';
    setScreen(html, true); // her hâlükârda kilitli: kullanıcı adı ekrandan kazara kaybolmasın
    var gate = gateEl;
    var copyBtn = gate.querySelector('#gateCopyBtn');
    copyBtn.addEventListener('click', function () { copyCode(kadi, copyBtn); });
    gate.querySelector('#gateStartBtn').addEventListener('click', function () {
      if (ilkDerseGonder()) return;
      kapiZorunlu = false;
      closeGate();
      if (window.FX) FX.unlocked(null, { flash: false });
      paintBadge();
    });
  }

  /* Hesap değişince Ders 1.2/1.3'te kalınmaz: yeni (ya da 1.1'i bitirmemiş)
     çocuk Ders 1.1'den başlar. Arda (2026-09-23): "sıfır ilerlemeli
     hesap ders 1.1'de başlaması lazım". Portal 1.2'yi kilitlemiyor, o
     yüzden bu yalnızca HESAP DEĞİŞİMİNDE devreye girer. Yönlendirdiyse
     true döner (sayfa zaten yenileniyor). */
  function ilkDerseGonder() {
    if (!/lesson-1-[234]\.html/.test(window.location.pathname)) return false;
    if (window.Store && window.Store.get('badge_lesson_1_1') === 'earned') return false;
    window.location.href = 'index.html';
    return true;
  }

  function hesapDegisti() {
    if (!ilkDerseGonder()) window.location.reload();
  }

  // ---------- Giriş ekranı ----------
  /* biten: süresi dolan oturumun izi ({ username, name }, learner.js
     expiredSession). Varsa ekran neden açıldığını söyler ve kullanıcı adı
     hazır gelir — çocuk "beni attı" sanmasın, ilerlemesinin durduğunu bilsin. */
  function renderLogin(biten) {
    biten = (biten && biten.username) ? biten : null;
    var html =
      '<button type="button" class="learner-gate-back">← Geri</button>' +
      '<h2 class="learner-gate-title" id="learnerGateTitle">' + (biten ? 'Tekrar hoş geldin' + (biten.name ? ', ' + esc(biten.name) : '') : 'Giriş yap') + '</h2>' +
      (biten
        ? '<p class="learner-gate-sub learner-gate-biten">Güvenlik için oturumun kapandı. Şifreni yaz, rozetlerin ve puanların yerinde.</p>'
        : '<p class="learner-gate-sub">Kullanıcı adın ve şifrenle gir.</p>') +
      '<div class="learner-gate-error" role="alert"></div>' +
      '<div class="learner-gate-field text">' +
        '<label for="gateLoginUser">Kullanıcı adın</label>' +
        '<input type="text" id="gateLoginUser" class="learner-gate-input" maxlength="16" ' +
          'value="' + esc(biten ? biten.username : '') + '" ' +
          'autocomplete="off" autocapitalize="off" spellcheck="false" style="text-transform:lowercase;">' +
      '</div>' +
      sifreAlani('gateLoginPass', 'Şifren', '') +
      '<div class="learner-gate-actions">' +
        '<button type="button" class="portal-btn primary learner-gate-cta" id="gateLoginBtn">Gir</button>' +
      '</div>' +
      '<div class="learner-gate-alt">' +
        '<button type="button" class="learner-gate-altlink" data-action="forgot">Şifremi unuttum</button>' +
      '</div>';
    setScreen(html, kilitliMi());
    var gate = gateEl;
    goziBagla(gate);
    gate.querySelector('.learner-gate-back').addEventListener('click', renderStart);
    gate.querySelector('[data-action="forgot"]').addEventListener('click', renderForgot);
    var userInput = gate.querySelector('#gateLoginUser');
    var passInput = gate.querySelector('#gateLoginPass');
    var btn = gate.querySelector('#gateLoginBtn');
    if (biten) passInput.focus();

    function submit() {
      hideError(gate);
      var username = normalizeUsername(userInput.value);
      if (!username) { showError(gate, 'Kullanıcı adını yazmalısın.'); userInput.focus(); return; }
      if (!passInput.value) { showError(gate, 'Şifreni yazmalısın.'); passInput.focus(); return; }
      setBusy(btn, true, 'Giriliyor…', 'Gir');
      window.Learner.login(username, passInput.value).then(function () {
        if (window.FX) FX.sound('unlock');
        paintBadge();
        kapiZorunlu = false;
        closeGate();
        /* Giriş yapan çocuk BAŞKA bir çocuk olabilir: bellekteki XP
           eski hesabınki. Yeniden yükleme bütün modüllere yeniden
           okutur (bkz. learner.js switchBox yorumu). */
        hesapDegisti();
      }).catch(function (err) {
        setBusy(btn, false, '', 'Gir');
        reasonFromError(err).then(function (msg) { showError(gate, msg); });
      });
    }
    btn.addEventListener('click', submit);
    onEnter(userInput, submit);
    onEnter(passInput, submit);
  }

  // ---------- Şifremi unuttum ----------
  function renderForgot() {
    var html =
      '<button type="button" class="learner-gate-back">← Geri</button>' +
      '<h2 class="learner-gate-title" id="learnerGateTitle">Yeni şifre koyalım</h2>' +
      '<p class="learner-gate-sub">Kurtarma kelimeni hatırlıyor musun?</p>' +
      '<div class="learner-gate-error" role="alert"></div>' +
      '<div class="learner-gate-field text">' +
        '<label for="gateForgotUser">Kullanıcı adın</label>' +
        '<input type="text" id="gateForgotUser" class="learner-gate-input" maxlength="16" ' +
          'autocomplete="off" autocapitalize="off" spellcheck="false" style="text-transform:lowercase;">' +
      '</div>' +
      '<div class="learner-gate-field text">' +
        '<label for="gateForgotRec">Kurtarma kelimen</label>' +
        '<input type="text" id="gateForgotRec" class="learner-gate-input" maxlength="32" autocomplete="off" spellcheck="false">' +
      '</div>' +
      sifreAlani('gateForgotPass', 'Yeni şifren', 'en az 4 karakter') +
      '<div class="learner-gate-actions">' +
        '<button type="button" class="portal-btn primary learner-gate-cta" id="gateForgotBtn">Şifremi değiştir</button>' +
      '</div>';
    setScreen(html, kilitliMi());
    var gate = gateEl;
    goziBagla(gate);
    gate.querySelector('.learner-gate-back').addEventListener('click', renderLogin);
    var userInput = gate.querySelector('#gateForgotUser');
    var recInput = gate.querySelector('#gateForgotRec');
    var passInput = gate.querySelector('#gateForgotPass');
    var btn = gate.querySelector('#gateForgotBtn');

    function submit() {
      hideError(gate);
      var username = normalizeUsername(userInput.value);
      var rec = normalizeUsername(recInput.value);
      if (!username) { showError(gate, 'Kullanıcı adını yazmalısın.'); userInput.focus(); return; }
      if (!rec) { showError(gate, 'Kurtarma kelimeni yazmalısın.'); recInput.focus(); return; }
      var pErr = passwordError(passInput.value);
      if (pErr) { showError(gate, pErr); passInput.focus(); return; }
      setBusy(btn, true, 'Değiştiriliyor…', 'Şifremi değiştir');
      window.Learner.recover(username, rec, passInput.value).then(function () {
        if (window.FX) FX.sound('unlock');
        paintBadge();
        kapiZorunlu = false;
        closeGate();
        hesapDegisti();
      }).catch(function (err) {
        setBusy(btn, false, '', 'Şifremi değiştir');
        reasonFromError(err).then(function (msg) { showError(gate, msg); });
      });
    }
    btn.addEventListener('click', submit);
    onEnter(userInput, submit);
    onEnter(recInput, submit);
    onEnter(passInput, submit);
  }

  function openGate() {
    lastFocus = document.activeElement;
    ensureGate();
    var biten = window.Learner && window.Learner.expiredSession && window.Learner.expiredSession();
    if (biten && biten.username) renderLogin(biten); else renderStart();
    isit();
  }

  /* Hesabı olmayan siteyi kullanamaz (Arda: "siteyi açınca hesabı
     olmayan erişim sağlayamaz"). Üç sayfa da açılışta bunu çağırır.

     Bulut kapalıyken kilit KURULMAZ: cloud-config.js yoksa ya da
     ?cloud=off verilmişse hesap açmak fiziken mümkün değil, kilit
     siteyi kullanılamaz hâle getirirdi. O kaçış kapısı cloud.js'te
     yalnızca file:// altında dinlenir — yayındaki sitede hesapsız
     giriş yolu yok. */
  function requireAccount() {
    if (window.Learner && window.Learner.isActive()) return false;
    if (!window.Cloud || !window.Cloud.enabled()) return false;
    kapiZorunlu = true;
    /* Ders ortasında oturum biterse (learner.js expire) kapı zaten açık
       olabilir; ikinci kez çizip çocuğun yazdığını silme. */
    if (gateEl) { paintBadge(); return true; }
    openGate();
    paintBadge();
    return true;
  }

  // ============================================================
  // ROZET — her sayfada köşede (fx.js'in HUD'u ile aynı desende:
  // header-bar bulunursa içine, yoksa sabit konumlu bir yedeğe eklenir).
  // ============================================================
  var badgeHost = null;
  var popOpen = false;

  function closePop() {
    popOpen = false;
    var pop = badgeHost && badgeHost.querySelector('.learner-badge-pop');
    if (pop) pop.hidden = true;
    var chip = badgeHost && badgeHost.querySelector('.learner-badge-chip');
    if (chip) chip.setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('click', function (e) {
    if (!popOpen || !badgeHost) return;
    if (!badgeHost.contains(e.target)) closePop();
  });

  function paintBadge() {
    if (!badgeHost) return;
    var learner = (window.Learner && window.Learner.isActive()) ? window.Learner.current() : null;
    popOpen = false;

    if (!learner) {
      badgeHost.innerHTML =
        /* Oturum yokken yaş bilinmiyor, yani hangi dilin doğru olduğu
           da bilinmiyor: "Giriş yap" ikisine de uyar. Kapı zorunlu
           olduğu için bu hâl zaten yalnızca hesapsız modda görünür. */
        '<button type="button" class="learner-badge-open" id="learnerOpenBtn" aria-label="Giriş yap: ilerlemen kaydolsun" title="Giriş yap: ilerlemen kaydolsun">' +
          '<span class="learner-badge-open-icon">🔑</span>' +
          '<span class="learner-badge-open-text">' +
            '<span class="learner-badge-open-title">Giriş yap</span>' +
            '<span class="learner-badge-open-sub">İlerlemen kaydolsun</span>' +
          '</span>' +
        '</button>';
      badgeHost.querySelector('#learnerOpenBtn').addEventListener('click', openGate);
      return;
    }

    var name = learner.display_name || 'Sen';
    var avatar = basHarf(name);
    var kadi = learner.username ? '@' + learner.username : '';
    var d = sozluk(learner.level);

    badgeHost.innerHTML =
      '<button type="button" class="learner-badge-chip" id="learnerChipBtn" aria-haspopup="true" aria-expanded="false">' +
        '<span class="learner-badge-avatar">' + esc(avatar) + '</span>' +
        '<span class="learner-badge-meta">' +
          '<span class="learner-badge-name">' + esc(name) + '</span>' +
          '<span class="learner-badge-code">' + esc(kadi) + '</span>' +
        '</span>' +
      '</button>' +
      '<div class="learner-badge-pop" id="learnerPop" hidden>' +
        '<div class="learner-badge-pop-name">' + esc(name) + '</div>' +
        '<div class="learner-badge-pop-code">' + esc(kadi) + '</div>' +
        '<button type="button" class="portal-btn ghost learner-badge-pop-switch" id="learnerSwitchBtn">Ben başkasıyım</button>' +
        '<div class="learner-badge-pop-confirm" id="learnerSwitchConfirm">' +
          '<p>' + esc(d.kucuk ? 'Bu kutuyu bırakıyorsun. Emin misin?' : 'Çıkış yapıyorsun. Emin misin?') + '</p>' +
          '<div class="learner-badge-pop-confirm-row">' +
            '<button type="button" class="portal-btn ghost" id="learnerSwitchCancel">Vazgeç</button>' +
            '<button type="button" class="portal-btn primary" id="learnerSwitchConfirmBtn">Evet, çık</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var chip = badgeHost.querySelector('#learnerChipBtn');
    var pop = badgeHost.querySelector('#learnerPop');
    var confirmBox = badgeHost.querySelector('#learnerSwitchConfirm');

    chip.addEventListener('click', function (e) {
      e.stopPropagation();
      popOpen = !pop.hidden ? false : true;
      pop.hidden = !popOpen;
      chip.setAttribute('aria-expanded', String(popOpen));
      confirmBox.classList.remove('show');
    });
    badgeHost.querySelector('#learnerSwitchBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      confirmBox.classList.add('show');
    });
    badgeHost.querySelector('#learnerSwitchCancel').addEventListener('click', function (e) {
      e.stopPropagation();
      confirmBox.classList.remove('show');
    });
    badgeHost.querySelector('#learnerSwitchConfirmBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      var dugme = this;
      /* Buluta gitmemiş ilerleme varsa çıkış onu siliyordu (2026-10-16
         denetimi: rozet + 640 XP uyarısız gitti). Önce bir kez gönder;
         gidemezse söyle, çocuk ya da yetişkin karar versin. */
      if (dugme.getAttribute('data-yine-de') !== '1' && window.Sync && Sync.bekleyenVar && Sync.bekleyenVar()) {
        dugme.disabled = true;
        dugme.textContent = 'Kaydediliyor…';
        Sync.flush().then(function (tamam) {
          if (tamam && !Sync.bekleyenVar()) { cik(); return; }
          dugme.disabled = false;
          dugme.textContent = 'Yine de çık';
          dugme.setAttribute('data-yine-de', '1');
          var p = confirmBox.querySelector('p');
          if (p) p.textContent = 'Son ilerlemen henüz hesabına kaydedilmedi (internet yok gibi). Çıkarsan bu bilgisayardaki son kısmı kaybolur.';
        });
        return;
      }
      cik();
    });
    function cik() {
      window.Learner.switchBox();
      /* Yeniden yükleme ŞART: fx.js XP'yi açılışta okuyup bellekte
         tutuyor, clearProgress belleği temizlemiyor. Ölçüldü: 60 XP'li
         çocuk çıkınca yeni çocuğun ilk 10 puanı depoya 70 olarak
         yazılıyordu. Sayfa yeniden yüklenince kilitli giriş ekranı
         zaten requireAccount ile geri geliyor. */
      hesapDegisti();
    }
  }

  /* Rozet header-bar'ın İÇİNE eklenmiyor: o kutu her sayfada ayrı
     genişlikte doluyor (fx.js HUD'u ekliyor, portal.html'de ayrıca
     bir "Modül 1..." bloğu var) ve dar ekranda zaten kendi
     taşma sınırında. fx.css'in ".header-bar > div:not(.fx-hud)"
     kuralı da dar ekranda HUD dışındaki her div'i gizliyor. Rozet
     bunların hiçbirine karışmasın diye sabit konumlu, bağımsız bir
     köşe elemanı: her sayfada aynı yerde, hep görünür. */
  /* Rozet sayfaya sabit duruyor; ders sayfalarında üst sekme şeridi
     tam oraya denk gelip dersi tıklanamaz hale getiriyordu. Şeridin
     gerçek alt kenarı ölçülüp altına iniliyor — şerit yüksekliği
     ekran genişliğiyle değiştiği için sabit bir değer yetmiyor. */
  function konumla() {
    if (!badgeHost) return;
    var serit = document.querySelector('.sidebar-panel');
    var altCubuk = document.querySelector('.bottom-nav');
    /* Ders sayfasında (Arda 2026-09-28: "çocuk sayfada basacağı 3-4
       şey olsun") rozet dersin ortasında büyük bir kırmızı düğme değil,
       başlıktaki ses düğmesinin yanında küçük bir anahtar (odak.css).
       Dar ekranda başlıkta yer yok: eskisi gibi alt köşe. */
    var hud = document.querySelector('.header-bar .fx-hud');
    /* Portal da (2026-10-05, site düzeni): eskiden başlığın altında havada büyük kırmızı
       düğmeydi, hero başlığının üstüne biniyordu. Artık başlıkta, ama yazısıyla (is-portal). */
    var portal = !altCubuk;
    var baslikta = !!(hud && window.innerWidth > 768);
    badgeHost.classList.toggle('is-baslikta', baslikta);
    badgeHost.classList.toggle('is-portal', portal);
    if (baslikta) {
      if (badgeHost.parentNode !== hud) hud.appendChild(badgeHost);
      badgeHost.style.top = badgeHost.style.bottom = '';
      return;
    }
    if (badgeHost.parentNode !== document.body) document.body.appendChild(badgeHost);
    // Dar ekranda şeridin altı ders başlığının tam üstüne düşüyor;
    // orada alt gezinme çubuğunun hemen üstüne demirlemek hem sekmeyi
    // hem başlığı serbest bırakıyor.
    if (window.innerWidth <= 768 && portal) {
      badgeHost.style.top = 'auto'; badgeHost.style.bottom = '16px';
      return;
    }
    if (window.innerWidth <= 768 && altCubuk) {
      var ustu = altCubuk.getBoundingClientRect().top;
      badgeHost.style.top = 'auto';
      badgeHost.style.bottom = Math.round(window.innerHeight - ustu + 10) + 'px';
      return;
    }
    badgeHost.style.bottom = 'auto';
    badgeHost.style.top = serit ? Math.round(serit.getBoundingClientRect().bottom + 10) + 'px' : '';
  }

  function mountBadge() {
    if (!badgeHost) {
      badgeHost = document.createElement('aside');
      badgeHost.className = 'learner-badge';
      badgeHost.id = 'learnerBadge';
      document.body.appendChild(badgeHost);
      window.addEventListener('resize', konumla);
    }
    paintBadge();
    konumla();
  }

  window.LearnerUI = {
    openGate: openGate,
    requireAccount: requireAccount,
    mountBadge: mountBadge
  };

  function autoMount() { mountBadge(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }
})();
