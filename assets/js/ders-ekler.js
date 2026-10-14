/* ============================================================
   DERS EKLERİ — çocuğu nazikçe tutan küçük anlar (plan Aşama 4, 2026-10-05)
   ============================================================
   Dört ders sayfasında, motorun (lesson-engine.js) dışından, yalnız
   OKUYARAK çalışır; ders mantığına ve kapılara dokunmaz.
   1. Yakın hedef: adım değişince XP kutusunun altında kısa bir pil:
      "Sv.3'e 40 XP · sonraki adım +10". Hedef uzakta değil, hemen önünde.
   2. (Mola noktası 2026-10-06'da kalktı — Arda: "mola ver sistemi de kalksın".)
   3. Merak kancası: son adımdaki "Sıradaki ders" kartına bir merak
      sorusu ve "ilk adımı şimdi gör (1 dk)" çağrısı eklenir.
   4. Gerçek mucit fotoğrafı: son adımda "kartında LED yanarken bir
      fotoğraf çek" — küçültülüp YALNIZ bu tarayıcıya kaydedilir
      (mucit_foto_v1; hesaba/senkrona gitmez), portalda rozetin yanında.
   Karanlık desen yok: geri sayım, kayıp korkusu, kapatılamayan pencere yok.
   ============================================================ */
(function () {
  'use strict';
  var L = window.LessonEngine;
  if (!L || !document.getElementById('stepTitle')) return;

  var MERAK = {
    l11: 'Kartın içindeki LED yerine, masana kendi taktığın bir LED’i yakabilir misin?',
    l12: 'LED’i hızlandırırsan bir yerden sonra gözün sönmeyi göremez. O hız ne kadar?',
    l13: 'İki LED’i aynı anda, biri yanarken öteki sönecek şekilde çalıştırabilir misin?',
    l14: 'Dört LED’in arasında ışığı bir uçtan öbür uca koşturabilir misin?',
    l15: 'Bir trafik lambası modülüyle kavşaktaki ışıkları sen yönetebilir misin?',
    l16: 'Kartın sana ne yaptığını bilgisayar ekranına yazabilir mi?',
    l21: 'Trafik lambası hangi renkte olduğunu ekrana kendisi yazabilir mi?',
    l22: 'Kart seni dinleyebilir mi? Butona basınca LED’i sen yak.'
  };

  // Ders kimliği (l11…l14): her sayfa yalnız kendi veri dosyasını yükler.
  function dersOn() {
    var v = window.LESSON_DATA_3_1 || window.LESSON_DATA_2_2 || window.LESSON_DATA_2_1 || window.LESSON_DATA_1_6 || window.LESSON_DATA_1_5 || window.LESSON_DATA_1_4 || window.LESSON_DATA_1_3 ||
      window.LESSON_DATA_1_2 || window.LESSON_DATA_1_1;
    return v && v.xpPrefix;
  }
  var ON = dersOn();

  // ---------- 1. Yakın hedef ----------
  var pil = null, pilZaman = null;
  function yakinHedef(adim) {
    if (!window.FX || !FX.xp) return;
    var hud = document.getElementById('fxXpChip');
    if (!hud) return;
    var per = FX.XP_PER_LEVEL || 100, xp = FX.xp(), lv = FX.level();
    var kalan = per - (xp % per);
    // Adım XP'si o adıma VARINCA verilir: gösterilen, bir sonrakinin ödülü.
    var bu = adim < L.totalSteps && !(FX.claimed && FX.claimed(ON + '_step_' + (adim + 1))) ? 10 : 0;
    if (!pil) {
      pil = document.createElement('div');
      pil.className = 'yakin-hedef'; pil.setAttribute('role', 'status');
      document.body.appendChild(pil);
    }
    pil.innerHTML = 'Sv.' + (lv + 1) + '’e <b>' + kalan + ' XP</b>' + (bu ? ' · sonraki adım <b>+' + bu + '</b>' : '');
    var r = hud.getBoundingClientRect();
    pil.style.left = Math.max(8, Math.min(window.innerWidth - 220, r.left)) + 'px';
    pil.style.top = (r.bottom + 6) + 'px';
    pil.classList.remove('is-gorunur'); void pil.offsetWidth; pil.classList.add('is-gorunur');
    clearTimeout(pilZaman);
    pilZaman = setTimeout(function () { pil.classList.remove('is-gorunur'); }, 3200);
  }

  // ---------- 3. Merak kancası + 4. Mucit fotoğrafı (son adım) ----------
  function sonAdim() {
    var alan = document.getElementById('interactiveArea');
    if (!alan) return;
    var teaser = alan.querySelector('a.next-teaser');
    if (teaser && MERAK[ON] && !alan.querySelector('.merak-kanca')) {
      teaser.insertAdjacentHTML('afterbegin', '<span class="merak-kanca"><img class="fx-ikon" src="assets/img/fx/fx-ampul.webp" alt="" aria-hidden="true" draggable="false"> ' + MERAK[ON] + '</span>');
      teaser.insertAdjacentHTML('beforeend', '<span class="merak-cagri">İlk adımı şimdi gör (1 dk) →</span>');
    }
    if (alan.querySelector('.mucit-foto')) return;
    var foto = {};
    try { foto = JSON.parse(localStorage.getItem('mucit_foto_v1') || '{}') || {}; } catch (e) {}
    var kutu = document.createElement('div');
    kutu.className = 'mucit-foto';
    kutu.innerHTML = '<div class="mucit-onizleme">' + (foto[ON] ? '<img src="' + foto[ON] + '" alt="Mucit fotoğrafın">' : '<img src="assets/img/fx/fx-yildiz.webp" alt="" class="mucit-bos">') + '</div>' +
      '<div><b>Gerçek mucit fotoğrafı</b><span>' + (foto[ON] ? 'Fotoğrafın rozetinin yanında, Atölyem’de.' : 'Kartında LED yanarken bir fotoğraf çek; rozetinin yanında dursun.') +
      '</span><small>Fotoğraf yalnız bu bilgisayarda saklanır.</small>' +
      '<label class="mucit-dugme">' + (foto[ON] ? 'Yeniden çek' : 'Fotoğraf çek') + '<input type="file" accept="image/*" capture="environment" hidden></label></div>';
    alan.appendChild(kutu);
    kutu.querySelector('input').addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var oku = new FileReader();
      oku.onload = function () {
        var img = new Image();
        img.onload = function () {
          // Küçült: en uzun kenar 240 px, JPEG — localStorage'a sığsın.
          var s = Math.min(1, 240 / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          var veri = c.toDataURL('image/jpeg', 0.72);
          try {
            var t = JSON.parse(localStorage.getItem('mucit_foto_v1') || '{}') || {};
            t[ON] = veri; localStorage.setItem('mucit_foto_v1', JSON.stringify(t));
          } catch (e) { if (window.showToast) showToast('Fotoğraf kaydedilemedi (tarayıcı izin vermedi).', 'warn'); return; }
          kutu.remove(); sonAdim();
          if (window.FX) { FX.awardOnce(ON + '_mucit_foto', 15, 'XP', document.querySelector('.mucit-onizleme')); }
          if (window.showToast) showToast('Mucit fotoğrafın rozetinin yanına eklendi!');
        };
        img.src = oku.result;
      };
      oku.readAsDataURL(f);
    });
  }

  // ---------- adım izleme ----------
  var sonAdimNo = 0;
  function bak() {
    var a = L.step;
    if (!a || a === sonAdimNo) return;
    sonAdimNo = a;
    yakinHedef(a);
    if (a === L.totalSteps) setTimeout(sonAdim, 60);
  }
  var alan = document.getElementById('interactiveArea');
  if (alan && window.MutationObserver) new MutationObserver(function () { bak(); if (L.step === L.totalSteps) sonAdim(); }).observe(alan, { childList: true });
  setInterval(bak, 600);
  window.DersEkler = { yakinHedef: yakinHedef, sonAdim: sonAdim };
})();
