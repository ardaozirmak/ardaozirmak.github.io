/* ============================================================
   ATÖLYEM — portalda çocuğu tutan küçük kartlar (plan Aşama 4, 2026-10-05)
   ============================================================
   1. (Robotun kartı 2026-10-06'da kalktı — Arda: "portaldaki robot kalkmalı".)
   2. Rozet albümü: açık derslerin rozet çerçeveleri. Kazanılan = 3B
      madalya (blender/efekt3b.py), kazanılmayan = boş çerçeve. Varsa
      "gerçek mucit" fotoğrafı rozetin yanında (derste çekilir, yalnız bu
      tarayıcıda: mucit_foto_v1 senkrona girmez).
   3. Günlük görev: bugün bir adım ilerle (~3 dk). Bitince +5 XP
      (FX.awardOnce 'gunluk_YYYYMMDD'). Kaçırmanın cezası yok.
      (2026-10-06: Altın ve mağaza kalktı; ödül yalnız XP.)
   4. Veli özeti: bu hafta ne yapıldı, tek kart; "Kopyala" ile aileye.
   Karanlık desen yok: geri sayım, kayıp korkusu, zorlama yok.
   ============================================================ */
(function () {
  'use strict';
  var DERSLER = [
    { id: '1_1', on: 'l11', ad: '1.1', rozet: 'İlk Kıvılcım' },
    { id: '1_2', on: 'l12', ad: '1.2', rozet: 'İkinci Kıvılcım' },
    { id: '1_3', on: 'l13', ad: '1.3', rozet: 'Üçüncü Kıvılcım' },
    { id: '1_4', on: 'l14', ad: '1.4', rozet: 'Dördüncü Kıvılcım' },
    { id: '1_5', on: 'l15', ad: '1.5', rozet: 'Beşinci Kıvılcım' },
    { id: '1_6', on: 'l16', ad: '1.6', rozet: 'Altıncı Kıvılcım' },
    { id: '2_1', on: 'l21', ad: '2.1', rozet: 'Yedinci Kıvılcım', modul: 2 },
    { id: '2_2', on: 'l22', ad: '2.2', rozet: 'Sekizinci Kıvılcım', modul: 2 },
    { id: '3_1', on: 'l31', ad: '3.1', rozet: 'Dokuzuncu Kıvılcım', modul: 3 }
  ];

  function bitti(d) { return window.Store && Store.get('badge_lesson_' + d.id) === 'earned'; }
  function json(k) { try { var v = JSON.parse(Store.get(k) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
  function gunAnahtari(t) { var d = t || new Date(); return '' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2); }
  function ayniGun(ms) { return ms && gunAnahtari(new Date(ms)) === gunAnahtari(); }
  /* Fotoğraf HESAP BAŞINA saklanır (2026-10-16 denetim bulgusu: ortak
     bilgisayarda önceki çocuğun fotoğrafı sonrakinin albümünde çıkıyordu).
     Anahtar ders-ekler.js fotoAnahtari ile AYNI. Eski ortak anahtar
     (mucit_foto_v1) kimin olduğu bilinmediği için okunmaz, silinir. */
  function fotoAnahtari() {
    var l = window.Learner && Learner.isActive && Learner.isActive() ? Learner.current() : null;
    return 'mucit_foto_v1:' + (l && l.id ? l.id : 'yerel');
  }
  try { localStorage.removeItem('mucit_foto_v1'); } catch (e) {}
  function fotolar() { try { return JSON.parse(localStorage.getItem(fotoAnahtari()) || '{}') || {}; } catch (e) { return {}; } }
  /* Buluttan gelen ad ve yerelden gelen veri innerHTML'e kaçışsız girmesin. */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /* Fotoğraf yalnız kendi ürettiğimiz JPEG data: adresi olabilir. */
  function fotoMu(f) { return typeof f === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(f); }

  // ---------- 2. Rozet albümü ----------
  function albumHtml() {
    var foto = fotolar();
    return '<article class="atl-kart atl-album">' +
      '<h3>Rozet albümü</h3>' +
      '<ol class="atl-rozetler">' + DERSLER.map(function (d) {
        var var_ = bitti(d), f = fotoMu(foto[d.on]) ? foto[d.on] : null;
        return '<li class="atl-rozet' + (var_ ? ' is-var' : '') + '">' +
          '<span class="atl-cerceve">' + (var_ ? '<img src="assets/img/rozet/ders-' + d.ad.replace('.', '-') + '.webp" alt="" draggable="false">' : '<b aria-hidden="true">?</b>') +
          (f ? '<img class="atl-foto" src="' + f + '" alt="Ders ' + d.ad + ' mucit fotoğrafın">' : '') + '</span>' +
          '<span class="atl-rozet-ad">' + (var_ ? d.rozet : 'Ders ' + d.ad) + '</span></li>';
      }).join('') + '</ol>' +
    '</article>';
  }

  // ---------- 3. Günlük görev ----------
  function bugunIlerledi() {
    var devam = json('devam_v1');
    // ilerledi: en ileri adım arttığında yazılır (lesson-engine devamYaz).
    // t değil: t geri gidişte de yazılıyor.
    return Object.keys(devam).some(function (k) { return ayniGun(devam[k] && devam[k].ilerledi); });
  }
  function gorevHtml() {
    var anahtar = 'gunluk_' + gunAnahtari();
    var alindi = window.FX && FX.claimed && FX.claimed(anahtar);
    var tamam = bugunIlerledi();
    var durum = alindi ? '<span class="atl-gorev-tik">Bugünün görevi tamam. Yarın yenisi var.</span>'
      : tamam ? '<button type="button" class="atl-gorev-al">+5 XP al</button>'
      : '<span class="atl-gorev-not">Bir derse gir, bir adım ilerle. Yaklaşık 3 dakika.</span>';
    return '<article class="atl-kart atl-gorev' + (alindi ? ' is-bitti' : tamam ? ' is-hazir' : '') + '">' +
      '<h3>Günlük görev</h3>' +
      '<p class="atl-gorev-metin">Bugün bir adım ilerle.</p>' + durum +
    '</article>';
  }

  // ---------- 4. Veli özeti ----------
  function haftaBasi() {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    var g = (d.getDay() + 6) % 7; d.setDate(d.getDate() - g);
    return d.getTime();
  }
  function ozetMetni() {
    var devam = json('devam_v1'), bas = haftaBasi();
    var buHafta = Object.keys(devam).filter(function (k) { return devam[k] && devam[k].t >= bas; });
    var bitmis = DERSLER.filter(bitti).map(function (d) { return d.ad; });
    var lv = window.FX && FX.level ? FX.level() : 1;
    var ad = (window.Profile && Profile.get && (Profile.get() || {}).name) || 'Öğrencimiz';
    var satir = [];
    satir.push(ad + ' — Deneyap Atölyem haftalık özet');
    satir.push('Bu hafta çalıştığı dersler: ' + (buHafta.length ? buHafta.map(function (k) { return k.replace(/^l(\d)(\d)$/, '$1.$2'); }).join(', ') : 'henüz yok'));
    satir.push('Bitirdiği dersler: ' + (bitmis.length ? bitmis.join(', ') : 'henüz yok') + ' (' + bitmis.length + '/' + DERSLER.length + ')');
    satir.push('Seviye: ' + lv);
    satir.push('Her ders gerçek bir Deneyap kartıyla yapılır; bir sonraki derste kartta yanan LED’i birlikte görmeyi deneyin.');
    return satir;
  }
  function veliHtml() {
    var s = ozetMetni();
    return '<details class="atl-kart atl-veli"><summary><h3>Veli özeti</h3><span>Bu haftayı ailene göster</span></summary>' +
      '<ul>' + s.slice(1).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<button type="button" class="atl-veli-kopyala">Özeti kopyala</button></details>';
  }

  function kopyala(metin) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(metin).then(function () { return true; }, function () { return false; });
    return Promise.resolve(false);
  }

  var kok = null;
  function ciz() {
    // Atölyem son modül kartının altında (Modül 2 açıksa onun altında).
    var kartlar = [].slice.call(document.querySelectorAll('.module-card:not([hidden])'));
    var yer = kartlar[kartlar.length - 1] || document.getElementById('modul1');
    if (!yer || !window.Store) return;
    if (!kok) {
      kok = document.createElement('section');
      kok.id = 'atolyem'; kok.className = 'atolyem'; kok.setAttribute('aria-labelledby', 'atolyemBaslik');
      yer.insertAdjacentElement('afterend', kok);
      kok.addEventListener('click', tikla);
    }
    var acikVeli = kok.querySelector('.atl-veli[open]');
    kok.innerHTML = '<h2 id="atolyemBaslik">Atölyem</h2><div class="atl-izgara">' + albumHtml() + gorevHtml() + veliHtml() + '</div>';
    if (acikVeli) kok.querySelector('.atl-veli').open = true;
  }
  function tikla(e) {
    if (e.target.closest('.atl-gorev-al')) {
      var anahtar = 'gunluk_' + gunAnahtari();
      if (window.FX && bugunIlerledi()) FX.awardOnce(anahtar, 5, 'XP', e.target.closest('.atl-gorev-al'));
      ciz();
      return;
    }
    var k = e.target.closest('.atl-veli-kopyala');
    if (k) kopyala(ozetMetni().join('\n')).then(function (ok) {
      k.textContent = ok ? 'Kopyalandı ✓' : 'Kopyalanamadı — metni seçip kopyala';
    });
  }

  if (window.Store && Store.subscribe) Store.subscribe(function (k) {
    if (/^badge_lesson_|^devam_v1$|^fx_claims_v1$/.test(k)) ciz();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ciz); else ciz();
  window.Atolyem = { ciz: ciz, gunAnahtari: gunAnahtari };
})();
