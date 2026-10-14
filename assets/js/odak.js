/* ============================================================
   ODAK — "yolu biz gösteririz" katmanı
   ============================================================
   Arda (2026-09-28): "sitedeki elementleri azalt, çocuk sayfada
   basacağı 3-4 tane basması gerekenler olsun, yolu biz göstereceğiz."
   Sayım: her adımda 15-36 tıklanabilir şey vardı.

   Ders verisi her adım için üç liste verir (hepsi isteğe bağlı):

     odak: {
       3: {
         sira:   [{ s: '#usbTak', bitti: '.is-on' },
                  { s: '#yuklemeOnayBtn', kutu: '#yuklemeKart' }],
         rehber: ['.pg-more'],
         daha:   ['#usbDetect', '.pin-map-toggle']
       }
     }

   - sira: yapılması GEREKEN işler, sırayla. Sıradaki işin düğmesi
     parlar; ondan SONRAKİLER gizli kalır, sırası gelince açılır.
     Bir iş, `bitti` verilmişse o seçiciye uyunca (durum), verilmemişse
     çocuk ona bir kez basınca (ya da `onceden()` doğruysa) bitmiş sayılır. Aynı seçiciye uyan birden
     çok düğme (Evet / Hayır) tek iş sayılır, birlikte açılır.
   - rehber: isteğe bağlı keşif (kod satırları, "Yakından bak"). Hiçbiri
     gizlenmez ve kapı değildir; sıra bitince sıradaki basılmamış olan
     parlar ki çocuk nereden devam edeceğini arasın diye kalmasın.
   - daha: ikincil şeyler (sorun giderme, merak köşesi, ileri/geri sar).
     Silinmez: adımın sonundaki tek bir "Daha fazlası" düğmesinin
     altına katlanır, isteyen açar.

   Hiçbir iş kalmadıysa ve kapı açıksa İleri parlar. Aynı anda yalnızca
   TEK şey parlar: sıra > rehber > İleri.

   Durumu değiştirmez, kilit koymaz: kilitler hâlâ motorun gates'inde.
   Burada yalnızca GÖRÜNÜM var — kapatılırsa (Odak yüklenmezse) ders
   eskisi gibi çalışır.
   ============================================================ */
(function () {
  'use strict';

  var ayar = {};            // { adımNo: { sira, rehber, daha } }
  var adim = 0;
  var basildi = new Set();  // "adım|liste|i|j" — tıklamayla biten işler
  var dahaAcik = false;
  var gozcu = null;
  var bekleyen = 0;
  var oncekiSimdi = null;
  var tiklamaSonrasi = false;

  function norm(x) { return typeof x === 'string' ? { s: x } : x; }
  function liste(ad) { var a = ayar[adim]; return (a && a[ad]) || []; }

  function bul(sel) {
    var kok = document.querySelector('.step-content') || document;
    // Bazı dersler sahneyi (USB kutusu, devre) sağ paneli aşan yere de
    // koyuyor; önce adım içeriğinde, bulamazsa bütün sayfada ara.
    var l = kok.querySelectorAll(sel);
    if (!l.length && kok !== document) l = document.querySelectorAll(sel);
    return Array.prototype.slice.call(l);
  }

  /* Ders kendi mantığıyla gizlediyse (display:none, hidden) o iş henüz
     "ortada yok" — ne parlatılır ne atlanır. Bizim gizlememiz sayılmaz. */
  function dersGizledi(el) {
    if (el.closest('[hidden]')) return true;
    var e = el;
    while (e && e !== document.body) {
      if (!e.classList.contains('odak-sonra') && !e.classList.contains('odak-daha-gizli') &&
          getComputedStyle(e).display === 'none') return true;
      e = e.parentElement;
    }
    return false;
  }

  function isBitti(it, i, els) {
    if (it.bitti) {
      if (typeof it.bitti === 'function') return !!it.bitti(els);
      return els.some(function (el) { return el.matches(it.bitti) || !!el.querySelector(it.bitti); });
    }
    // `onceden`: bu iş daha önceki bir ziyarette yapıldı mı (ör. kod
    // kopyalandı — XP kaydı kalıcı). Sayfa yenilenince tekrar bastırmayalım.
    if (typeof it.onceden === 'function') { try { if (it.onceden()) return true; } catch (e) {} }
    return basildi.has(adim + '|sira|' + i);
  }

  /* Yapışkan başlık (üst bar + ders sekmeleri) ile alttaki sabit gezinme
     çubuğu arasında kalan, gerçekten görülen şerit. */
  function serit() {
    var ust = 0;
    document.querySelectorAll('header, .lesson-tabs').forEach(function (h) {
      var p = getComputedStyle(h).position;
      if (p === 'sticky' || p === 'fixed') ust = Math.max(ust, h.getBoundingClientRect().bottom);
    });
    var nav = document.querySelector('.bottom-nav');
    return { ust: ust, alt: nav ? nav.getBoundingClientRect().top : innerHeight };
  }

  function rahatGorunuyor(el) {
    var r = el.getBoundingClientRect(), s = serit();
    return r.top >= s.ust && r.bottom <= s.alt;
  }

  /* Kutu şeride sığıyorsa kutuyu (başlığıyla), sığmıyorsa düğmenin
     kendisini ortala. */
  function gotur(hedef, kutu, gecikme) {
    setTimeout(function () {
      if (!hedef.isConnected || !hedef.classList.contains('odak-simdi')) return;
      var s = serit();
      var el = (kutu !== hedef && kutu.getBoundingClientRect().height <= s.alt - s.ust - 16) ? kutu : hedef;
      if (rahatGorunuyor(el)) return;
      try { el.scrollIntoView({ block: 'center', behavior: (window.Hareket && Hareket.aktif) ? 'smooth' : 'auto' }); } catch (e) {}
    }, gecikme);
  }

  function temizle() {
    ['odak-sonra', 'odak-simdi', 'odak-daha-gizli'].forEach(function (c) {
      document.querySelectorAll('.' + c).forEach(function (el) { el.classList.remove(c); });
    });
  }

  function kapiAcik() {
    try {
      var E = window.LessonEngine;
      if (!E) return false;
      if (E.step >= E.totalSteps) return !!E.nextLesson;
      return E.maxAllowedStep() > E.step;
    } catch (e) { return false; }
  }

  function dahaDugmesi(varMi) {
    /* `dahaYeri`: katlanan şeyler bir şeridin parçasıysa (video düğmeleri)
       düğme de o şeridin sonunda durur — adımın dibine ayrı bir satır
       eklenmez (video boyu sağ panelin dibinden ölçülüyor). */
    var yer = ayar[adim] && ayar[adim].dahaYeri;
    var kap = (yer && document.querySelector(yer)) || document.querySelector('.step-content');
    var btn = document.getElementById('odakDaha');
    if (!varMi) { if (btn) btn.hidden = true; return; }
    if (!btn && kap) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'odakDaha';
      btn.className = 'odak-daha';
      btn.addEventListener('click', function () {
        dahaAcik = !dahaAcik;
        boya();
      });
    }
    if (!btn) return;
    // Her zaman adımın en sonunda dursun (ders içeriği yeniden çizince de).
    if (kap && (btn.parentNode !== kap || btn.nextElementSibling)) kap.appendChild(btn);
    btn.hidden = false;
    btn.classList.toggle('is-seritte', !!yer);
    btn.setAttribute('aria-expanded', String(dahaAcik));
    btn.innerHTML = dahaAcik ? 'Daha azı <span aria-hidden="true">▴</span>'
                             : 'Daha fazlası <span aria-hidden="true">▾</span>';
  }

  function boya() {
    clearTimeout(bekleyen);
    bekleyen = 0;
    if (gozcu) gozcu.disconnect();
    temizle();

    var simdi = null;
    var simdiSiradan = false;   // parlayan şey zorunlu bir iş mi (rehber değil)
    var simdiKutu = null;       // o işin `kutu`su: kaydırırken başlığı da görünsün

    // 1) SIRA — ilk bitmemiş iş parlar, sonrakiler gizli.
    var sira = liste('sira').map(norm);
    var kilitli = false;
    sira.forEach(function (it, i) {
      var els = bul(it.s);
      if (!els.length) return;
      // Bitmiş iş asla gizlenmez: önceki iş geri alınsa bile (ör. kablo
      // çıktı) sonraki işin işareti görünür kalsın, çocuk onu da geri alabilsin.
      if (kilitli && isBitti(it, i, els)) return;
      if (kilitli) {
        // `kutu`: düğmeyle birlikte başlığı ve açıklaması da beklesin.
        els.forEach(function (el) { ((it.kutu && el.closest(it.kutu)) || el).classList.add('odak-sonra'); });
        return;
      }
      if (isBitti(it, i, els)) return;
      var gorunen = els.filter(function (el) { return !dersGizledi(el); });
      if (gorunen.length && !simdi) { simdi = gorunen; simdiSiradan = true; simdiKutu = it.kutu || null; }
      kilitli = true;   // bitmemiş iş: ondan sonrakiler beklesin
    });

    // 2) REHBER — sıra bittiyse, sıradaki basılmamış keşif.
    if (!simdi && !kilitli) {
      liste('rehber').map(norm).some(function (it, i) {
        var els = bul(it.s).filter(function (el) { return !dersGizledi(el); });
        for (var j = 0; j < els.length; j++) {
          if (!basildi.has(adim + '|rehber|' + i + '|' + j)) { simdi = [els[j]]; return true; }
        }
        return false;
      });
    }

    // 3) İLERİ — yapılacak iş kalmadı ve kapı açık.
    if (!simdi && !kilitli && kapiAcik()) {
      var ileri = document.getElementById('nextBtn');
      if (ileri) simdi = [ileri];
    }

    if (simdi) simdi.forEach(function (el) { el.classList.add('odak-simdi'); });

    /* Bir iş bitip sıradaki iş parlayınca ekran ORAYA gider — çocuk
       "şimdi ne yapacağım?" diye aramasın. Arda (2026-09-30): "devreyi
       tamamladıktan sonra kodu kopyala kısmına gidecek, onu kopyaladıktan
       sonra kodu uyguladım kısmına gidecek oto" + "1.3'te 1.4'te de aynı
       sistem olacak, site kendisi yönlendirecek."
       Eskiden yalnızca tıklamadan 60 ms sonraki boyamada ve hedef TAMAMEN
       ekran dışındaysa kaydırıyordu. İki açık vardı: (1) bazı işler
       tıklamadan sonra, kendi animasyonuyla biter (son "Taktım" → devre
       kuruldu) ve o boyamada tıklama bayrağı çoktan düşmüş olur; (2)
       yarısı yapışkan başlığın altında ya da alt çubuğun arkasında kalan
       kutu "ekranda" sayılıyordu. Artık sıradaki iş hangi yolla gelirse
       gelsin, rahat görünmüyorsa gidilir; tıklamasız geçişte kutlama
       görülsün diye biraz beklenir. Adıma ilk girişte kaydırma yok
       (başlık ve açıklama önce okunsun) — oncekiSimdi o an boş. */
    var hedef = simdi && simdi[0];
    if (hedef && oncekiSimdi && hedef !== oncekiSimdi && hedef.id !== 'nextBtn' &&
        (tiklamaSonrasi || simdiSiradan)) {
      var kutu = (simdiKutu && hedef.closest(simdiKutu)) || hedef;
      gotur(hedef, kutu, tiklamaSonrasi ? 0 : 700);
    }
    oncekiSimdi = hedef || null;
    tiklamaSonrasi = false;

    // 4) DAHA — ikincil şeyler katlanır.
    var dahaVar = false;
    liste('daha').forEach(function (sel) {
      bul(sel).forEach(function (el) {
        if (dersGizledi(el)) return;
        dahaVar = true;
        if (!dahaAcik) el.classList.add('odak-daha-gizli');
      });
    });
    dahaDugmesi(dahaVar);

    if (gozcu) gozcu.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style', 'aria-pressed', 'disabled'] });
  }

  function sonra() {
    if (bekleyen) return;
    bekleyen = setTimeout(boya, 60);
  }

  /* Hareket katmanı ve video her karede stil yazıyor (SVG çizimi,
     ilerleme çubuğu, XP sayacı). Onlar sırayı değiştirmez; her karede
     yeniden boyamayalım. */
  function onemli(kayitlar) {
    for (var k = 0; k < kayitlar.length; k++) {
      var r = kayitlar[k], t = r.target;
      if (r.type === 'childList') {
        if (t.nodeType === 1 && t.closest && t.closest('svg, .fx-hud, #toast, .confetti-layer')) continue;
        return true;
      }
      if (t instanceof SVGElement) continue;
      if (t.closest && t.closest('.vp-seek, .fx-hud, #stepDots, .lesson-progress-track, #toast, .confetti-layer')) continue;
      return true;
    }
    return false;
  }

  /* Tıklama önce dersin kendi işleyicisine gider (durum değişir), sonra
     buraya: hangi işe basıldığını kaydedip yeniden boyarız. */
  function tik(e) {
    var hedef = e.target;
    if (!hedef || !hedef.closest) return;
    liste('sira').map(norm).forEach(function (it, i) {
      if (bul(it.s).some(function (el) { return el === hedef || el.contains(hedef); })) basildi.add(adim + '|sira|' + i);
    });
    liste('rehber').map(norm).forEach(function (it, i) {
      bul(it.s).forEach(function (el, j) {
        if (el === hedef || el.contains(hedef)) basildi.add(adim + '|rehber|' + i + '|' + j);
      });
    });
    tiklamaSonrasi = true;
    sonra();
  }

  window.Odak = {
    /* Motor her adım değişiminde, ders DOM'unu çizdikten SONRA çağırır. */
    adim: function (n, dersAyari) {
      ayar = dersAyari || {};
      var yeniAdim = n !== adim;
      if (yeniAdim) { dahaAcik = false; oncekiSimdi = null; }
      adim = n;
      /* Adıma girişte ilk iş ekranın altındaysa (1.3/1.4 Adım 4: "Kodu
         Kopyala" katlamanın altında kalıyordu) önce başlık okunsun, sonra
         sayfa işi alt kenara getirecek kadar — en AZ — kaysın: başlık
         mümkün olduğunca ekranda kalır. */
      if (yeniAdim) {
        var girisAdimi = n;
        setTimeout(function () {
          if (adim !== girisAdimi) return;
          var el = document.querySelector('.odak-simdi:not(#nextBtn)');
          if (!el || rahatGorunuyor(el)) return;
          var s = serit();
          var eski = el.style.scrollMarginBottom;
          el.style.scrollMarginBottom = Math.max(0, innerHeight - s.alt + 12) + 'px';
          try { el.scrollIntoView({ block: 'end', behavior: (window.Hareket && Hareket.aktif) ? 'smooth' : 'auto' }); } catch (e) {}
          el.style.scrollMarginBottom = eski;
        }, 900);
      }
      // Adım noktaları yine basılır (2026-09-30, odak.css): Tab sırasında da kalır.
      if (!gozcu && window.MutationObserver) {
        gozcu = new MutationObserver(function (k) { if (onemli(k)) sonra(); });
        document.addEventListener('click', tik);
      }
      boya();
    },
    tazele: sonra,
    /* Kapı kapandı: sıradaki iş ekranda değilse oraya götür. Sıra bittiyse
       (iş kapının kendi şartıysa) dersin onBlocked'ı zaten götürdü. */
    goster: function () {
      var el = document.querySelector('.odak-simdi:not(#nextBtn)');
      if (!el) return;
      var r = el.getBoundingClientRect();
      if (r.top >= 60 && r.bottom <= innerHeight - 90) return;
      try { el.scrollIntoView({ block: 'center', behavior: (window.Hareket && Hareket.aktif) ? 'smooth' : 'auto' }); } catch (e) {}
    },
    get dahaAcik() { return dahaAcik; }
  };
})();
