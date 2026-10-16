/* ============================================================
   profile.js — Öğrenci Profili (window.Profile)
   ============================================================
   Portala girişte yaş + "sana nasıl hitap edeyim" bilgisini alır,
   localStorage'da saklar. Üç sayfa da (portal, Ders 1.1, Ders 1.2)
   bu tek modülü paylaşır — AI prompt kartlarındaki "kopyala"
   davranışı sabit metin kopyalamak yerine bu profille birleştirilmiş
   kişiselleştirilmiş bir metin üretir, ve prompt listesi öğrencinin
   yaş seviyesine göre yeniden sıralanır (hiçbir prompt gizlenmez,
   sadece seviyeye uygun olanlar öne alınır).

   fx.js'teki desene uyar: dosya yok, sunucu yok, veri storage.js'teki
   Store üzerinden localStorage'da tutulur.
   ============================================================ */

(function () {
  'use strict';

  var KEY = 'profile_v1'; // { name, age, level }

  function readJSON(key, fallback) {
    return window.Store ? Store.getJSON(key, fallback) : fallback;
  }
  function writeJSON(key, value) {
    if (window.Store) Store.setJSON(key, value);
  }

  function computeLevel(age) {
    age = parseInt(age, 10);
    if (!age || age <= 13) return 1;
    if (age <= 15) return 2;
    return 3;
  }

  var LEVEL_LABELS = { 1: 'Ortaokul', 2: 'Lise (Başlangıç)', 3: 'Lise (İleri)' };

  function get() {
    return readJSON(KEY, null);
  }

  function isSet() {
    var p = get();
    return !!(p && p.name && p.age);
  }

  function save(name, age) {
    var profile = {
      name: (name || '').trim().slice(0, 40),
      age: parseInt(age, 10) || null,
      level: computeLevel(age)
    };
    writeJSON(KEY, profile);
    return profile;
  }

  /* Sabit prompt metnini profille birleştirir: öğrencinin adı ve
     yaşı en başa eklenir, böylece kopyalanan metin dış AI aracına
     "kiminle konuştuğunu" söyler ve cevabın seviyesi buna göre
     ayarlanır. Profil yoksa metni değiştirmeden döndürür. */
  function personalize(promptText) {
    var p = get();
    if (!p || !p.name || !p.age) return promptText;
    var intro = 'Ben ' + p.name + ', ' + p.age + ' yaşındayım. Bana bu yaşıma ve seviyeme uygun, ' +
      'anlayacağım kelimelerle, gerekirse basit benzetmelerle cevap ver.\n\n';
    return intro + promptText;
  }

  /* prompts: [{ level: 1|2|3, ... }]. Profil varsa öğrencinin
     seviyesine eşit olanlar öne alınır (stabil sıralama — hiçbir
     öğe listeden çıkmaz, sadece sırası değişir). */
  function sortByLevel(prompts) {
    var p = get();
    if (!p || !p.level) return prompts.slice();
    var mine = [], others = [];
    prompts.forEach(function (item) {
      (item.level === p.level ? mine : others).push(item);
    });
    return mine.concat(others);
  }

  // ============================================================
  // Modal — üç sayfada da aynı görünür, kendi CSS'ini kendi taşır
  // ============================================================
  var STYLE_ID = 'profile-modal-style';
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '.profile-modal-overlay{position:fixed;inset:0;background:rgba(20,14,8,.55);' +
      'display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;}' +
      '.profile-modal{background:var(--color-surface,#fff);border-radius:16px;padding:28px;' +
      'max-width:380px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.35);' +
      'font-family:inherit;color:var(--color-text,#23180F);}' +
      '.profile-modal h3{margin:0 0 6px;font-size:19px;}' +
      '.profile-modal p{margin:0 0 18px;font-size:13px;color:var(--color-text-muted,#7C6552);line-height:1.5;}' +
      '.profile-modal label{display:block;font-size:12px;font-weight:700;margin:0 0 6px;color:var(--color-text-2,#5C4B3A);}' +
      '.profile-modal input{width:100%;box-sizing:border-box;padding:10px 12px;margin-bottom:16px;' +
      'border-radius:10px;border:1px solid var(--color-border,#EAD3AE);font-size:14px;font-family:inherit;' +
      'background:var(--color-bg,#FFF8F0);color:inherit;}' +
      '.profile-modal input:focus{border-color:var(--color-primary,#D6273A);}' +
      '.profile-modal-btn:focus-visible,.profile-modal input:focus-visible{outline:2px solid var(--color-primary,#D6273A);outline-offset:2px;}' +
      '.profile-modal-actions{display:flex;gap:10px;justify-content:flex-end;}' +
      '.profile-modal-btn{padding:10px 18px;border-radius:10px;border:none;font-weight:700;' +
      'font-size:13px;cursor:pointer;font-family:inherit;}' +
      '.profile-modal-btn.primary{background:var(--color-primary,#D6273A);color:#fff;}' +
      '.profile-modal-btn.ghost{background:transparent;color:var(--color-text-muted,#7C6552);}' +
      '.profile-modal-error{color:var(--color-danger-2,#C23616);font-size:12px;margin:-10px 0 12px;min-height:1.2em;}';
    document.head.appendChild(style);
  }

  /* onSaved(profile) kaydedilince çağrılır. dismissible=false ise
     ("İptal" yok) kullanıcı bir isim+yaş girmeden kapatamaz —
     portalda ilk girişte kullanılır. */
  function openModal(onSaved, dismissible) {
    ensureStyle();
    var overlay = document.createElement('div');
    overlay.className = 'profile-modal-overlay';
    var current = get() || {};
    overlay.innerHTML =
      '<div class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle">' +
      '<h3 id="profileModalTitle">Seni Tanıyalım!</h3>' +
      /* Eski metin "sadece bu tarayıcıda saklanır" diyordu; oysa profile_v1
         hesap senkronuna giriyor (sync.js), ad ve yaş buluta gidiyor
         (2026-10-16 denetim bulgusu). AI'ya ad gitmiyor (ai-sohbet). */
      '<p>Derslerin yaşına uygun seviyede açılması için birkaç bilgi alalım. Bu bilgisayarda saklanır; giriş yaptıysan hesabına da kaydedilir. AI yardımcısına adın gönderilmez.</p>' +
      '<label for="profileNameInput">Sana nasıl hitap edelim?</label>' +
      '<input type="text" id="profileNameInput" maxlength="40" placeholder="Adın veya lakabın" value="' + (current.name || '').replace(/"/g, '&quot;') + '">' +
      '<label for="profileAgeInput">Yaşın</label>' +
      '<input type="number" id="profileAgeInput" min="8" max="99" placeholder="Örn. 14" value="' + (current.age || '') + '">' +
      '<div class="profile-modal-error" id="profileModalError"></div>' +
      '<div class="profile-modal-actions">' +
      (dismissible ? '<button type="button" class="profile-modal-btn ghost" id="profileModalCancel">Vazgeç</button>' : '') +
      '<button type="button" class="profile-modal-btn primary" id="profileModalSave">Kaydet</button>' +
      '</div></div>';
    document.body.appendChild(overlay);

    var nameInput = overlay.querySelector('#profileNameInput');
    var ageInput = overlay.querySelector('#profileAgeInput');
    var errorEl = overlay.querySelector('#profileModalError');
    nameInput.focus();

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    overlay.querySelector('#profileModalSave').addEventListener('click', function () {
      var name = nameInput.value.trim();
      var age = parseInt(ageInput.value, 10);
      if (!name) { errorEl.textContent = 'Bir isim ya da lakap yazmalısın.'; nameInput.focus(); return; }
      if (!age || age < 8 || age > 99) { errorEl.textContent = 'Geçerli bir yaş gir.'; ageInput.focus(); return; }
      var profile = save(name, age);
      close();
      if (typeof onSaved === 'function') onSaved(profile);
    });

    var cancelBtn = overlay.querySelector('#profileModalCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', close);

    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') overlay.querySelector('#profileModalSave').click();
      if (e.key === 'Escape' && dismissible) close();
    });
  }

  window.Profile = {
    get: get,
    isSet: isSet,
    save: save,
    computeLevel: computeLevel,
    levelLabel: function (level) { return LEVEL_LABELS[level] || ''; },
    personalize: personalize,
    sortByLevel: sortByLevel,
    openModal: openModal
  };
})();
