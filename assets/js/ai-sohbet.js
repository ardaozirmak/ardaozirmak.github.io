/* ai-sohbet.js — site içi AI yardımcısı paneli (window.AiSohbet)
   ==================================================================
   Arda (2026-10-14): "chatgpt'ye yönlendirmeyi bırak, site içinde kendi AI
   yardımcımız olacak" + "öğrenci kafasına göre sohbet edemez, sadece AI
   Yoldaşına Sor ve AI yardımcıdaki hazır promptlar".
   Plan: docs/superpowers/plans/2026-10-14-ai-sohbet.md

   NE YAPAR: robotun "Evet, takıldım"ı, "AI Yoldaşına Sor" kartları ve LED
   kontrolündeki "Hâlâ olmadı" bu paneli açar. Panel Supabase Edge Function
   `ai-sohbet`e İSTEK KİMLİĞİ gönderir — metin değil: { token, dersId, adim,
   istek, yanitlar, gecmis }. Sorunun metnini sunucu kendi kopyasından kurar
   (supabase/functions/ai-sohbet/promptlar.ts), modelin cevabı akarak gelir.

   YAZI KUTUSU YOK. AI soru sorarsa çocuk dört hazır düğmeyle cevaplar:
   Evet / Hayır / Bilmiyorum / Anlamadım. Sorusuz cevapta yalnız "Anlamadım".
   Modelin metni önce HTML kaçışlanır, sonra yalnız **kalın**, `kod` ve
   "- " / "1. " listeleri biçimlenir.

   Hesap şart (çocuk başına günde 10 mesaj, sunucuda sayılır); bulut kapalıysa
   (file://?cloud=off, CDN yok) ya da giriş yoksa panel açıklama gösterir,
   hiçbir yere yönlendirmez. Konuşma sunucuda SAKLANMAZ.
   ================================================================== */

(function () {
  'use strict';

  var CEVAPLAR = [['evet', 'Evet'], ['hayir', 'Hayır'], ['bilmiyorum', 'Bilmiyorum'], ['anlamadim', 'Anlamadım']];
  var MAKS_TUR = 6;            // sunucu (mesajlar.ts MAKS_TUR) ile aynı
  var MAKS_GECMIS = 1500;      // sunucuya geri giden her AI cevabının üst sınırı
  /* Model "düşünen" türden (Nemotron 3.5): ilk parça gecikebilir. Sunucunun kendi
     sınırı 25 sn; istemci biraz daha bekler ki sunucunun hata cevabını görsün. */
  var ZAMAN_ASIMI_MS = 30000;

  var MESAJ = {
    bulut: 'AI yardımcısı için internet bağlantısı ve giriş gerekli.',
    giris: 'AI yardımcısıyla konuşmak için önce giriş yap.',
    'belirtec-gecersiz': 'Oturumun bitmiş. Yeniden giriş yapınca devam edebilirsin.',
    'gunluk-hak-bitti': 'Bugünlük 10 hakkın bitti. Yarın yine sorabilirsin.',
    'genel-hak-bitti': 'AI yardımcısı bugün çok soru cevapladı. Yarın tekrar dene.',
    'gecersiz-istek': 'Bu soruyu şu an gönderemedim. Sayfayı yenileyip tekrar dene.',
    'ai-hata': 'Şu an cevap veremiyorum. Biraz sonra tekrar dene.'
  };

  var kok = null, liste = null, cevapKutu = null, hakEl = null;
  var oturum = null;          // { dersId, adim, istek, baslik, yanitlar: [], gecmis: [] }
  var istekte = false, iptal = null, kapatildi = false;
  var son = null;             // en son hazırlanan istek (belirteçsiz), teşhis/test için

  /* ---------- nerede? ---------- */
  function dersKimligi() {
    var ad = (location.pathname || '').split('/').pop() || 'index.html';
    if (/^portal\.html$/i.test(ad)) return 'portal';
    var m = /^lesson-(\d+-\d+)\.html$/i.exec(ad);
    return m ? m[1] : '1-1';   // index.html (ya da kök "/") = Ders 1.1
  }
  function adimNo(dersId) {
    if (dersId === 'portal') return 0;
    return (window.LessonEngine && LessonEngine.step) || 1;
  }

  /* ---------- biçim: önce kaçış, sonra izinli üç biçim ---------- */
  function kacis(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function satirIci(s) {
    return s.replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  }
  function bicimle(metin) {
    var html = '', acik = null;
    function kapat() { if (acik) { html += '</' + acik + '>'; acik = null; } }
    kacis(metin).split('\n').forEach(function (sat) {
      var m;
      if ((m = /^\s*[-*•]\s+(.*)$/.exec(sat))) {
        if (acik !== 'ul') { kapat(); html += '<ul>'; acik = 'ul'; }
        html += '<li>' + satirIci(m[1]) + '</li>';
      } else if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(sat))) {
        if (acik !== 'ol') { kapat(); html += '<ol>'; acik = 'ol'; }
        html += '<li>' + satirIci(m[1]) + '</li>';
      } else {
        kapat();
        if (sat.trim()) html += '<p>' + satirIci(sat) + '</p>';
      }
    });
    kapat();
    return html;
  }

  /* ---------- DOM ---------- */
  function kur() {
    if (kok) return;
    kok = document.createElement('section');
    kok.className = 'ai-sohbet';
    kok.setAttribute('role', 'dialog');
    kok.setAttribute('aria-label', 'AI yardımcın');
    kok.hidden = true;
    kok.innerHTML =
      '<header class="ai-sohbet-bas">' +
        '<img class="ai-sohbet-kure" src="assets/img/esya/ai-kure.webp" width="32" height="32" alt="" draggable="false">' +
        '<div class="ai-sohbet-ad"><strong>AI Yardımcın</strong><span class="ai-sohbet-hak"></span></div>' +
        '<button type="button" class="ai-sohbet-kapat" aria-label="Kapat">✕</button>' +
      '</header>' +
      '<div class="ai-sohbet-liste" aria-live="polite"></div>' +
      '<div class="ai-sohbet-cevaplar"></div>';
    document.body.appendChild(kok);
    liste = kok.querySelector('.ai-sohbet-liste');
    cevapKutu = kok.querySelector('.ai-sohbet-cevaplar');
    hakEl = kok.querySelector('.ai-sohbet-hak');
    kok.querySelector('.ai-sohbet-kapat').addEventListener('click', kapatPanel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !kok.hidden) kapatPanel(); });
  }

  function asagi() { liste.scrollTop = liste.scrollHeight; }

  function balon(kim, icerik) {
    var b = document.createElement('div');
    b.className = 'ai-sohbet-balon ' + kim;
    if (kim === 'cocuk') b.textContent = icerik; else b.innerHTML = icerik;
    liste.appendChild(b);
    asagi();
    return b;
  }

  function yaziyor(b) {
    b.innerHTML = '<span class="ai-sohbet-yaziyor" aria-label="AI yardımcın düşünüyor">' +
      '<i></i><i></i><i></i><em>düşünüyor…</em></span>';
  }

  function cevaplariGoster(metin) {
    cevapKutu.innerHTML = '';
    if (!oturum || oturum.gecmis.length > MAKS_TUR) return;
    if (oturum.yanitlar.length >= MAKS_TUR) {
      var p = document.createElement('p');
      p.className = 'ai-sohbet-not';
      p.textContent = 'Bu sohbet burada bitti. Başka bir soru için AI Yoldaşına Sor\'u ya da robotu kullan.';
      cevapKutu.appendChild(p);
      return;
    }
    // Soru sorduysa dört düğme; sormadıysa (tebrik, açıklama) yalnız "Anlamadım".
    var soruVar = /\?/.test(metin);
    CEVAPLAR.forEach(function (c) {
      if (!soruVar && c[0] !== 'anlamadim') return;
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'ai-sohbet-cevap';
      d.dataset.kod = c[0];
      d.textContent = c[1];
      d.addEventListener('click', function () { yanitla(c[0], c[1]); });
      cevapKutu.appendChild(d);
    });
    // Klavyeyle gelen çocuk cevaba doğrudan ulaşsın (2026-10-16 denetimi: 21 Tab).
    var ilk = cevapKutu.querySelector('.ai-sohbet-cevap');
    if (ilk && !kok.hidden) { try { ilk.focus({ preventScroll: true }); } catch (e) {} }
  }

  function hataGoster(kod) {
    cevapKutu.innerHTML = '';
    var k = document.createElement('div');
    k.className = 'ai-sohbet-hata';
    var p = document.createElement('p');
    p.textContent = MESAJ[kod] || MESAJ['ai-hata'];
    k.appendChild(p);
    var eylem = null;
    if ((kod === 'giris' || kod === 'belirtec-gecersiz') && window.LearnerUI && LearnerUI.openGate) {
      eylem = document.createElement('button');
      eylem.className = 'ai-sohbet-giris';
      eylem.textContent = 'Giriş yap';
      eylem.addEventListener('click', function () {
        kapatPanel();
        /* Belirteç bitmişse oturumu düzgün kapat (learner.js expire): giriş
           ekranı "oturumun kapandı" der ve kullanıcı adı hazır gelir. */
        if (kod === 'belirtec-gecersiz' && window.Learner && Learner.expire && Learner.isActive()) Learner.expire();
        else LearnerUI.openGate();
      });
    } else if (kod === 'ai-hata' || kod === 'gecersiz-istek') {
      eylem = document.createElement('button');
      eylem.className = 'ai-sohbet-tekrar';
      eylem.textContent = 'Tekrar dene';
      eylem.addEventListener('click', function () { k.remove(); gonder(); });
    }
    if (eylem) { eylem.type = 'button'; k.appendChild(eylem); }
    liste.appendChild(k);
    asagi();
  }

  function hakYaz(kalan) {
    if (typeof kalan !== 'number') return;
    hakEl.textContent = kalan > 0 ? 'Bugün ' + kalan + ' hakkın kaldı' : 'Bugünlük hakkın bitti';
  }

  /* ---------- istek ---------- */
  function bulutHazir() {
    var c = window.CLOUD_CONFIG;
    return !!(window.Cloud && Cloud.enabled && Cloud.enabled() && c && c.url && c.anonKey);
  }
  function belirtec() {
    return (window.Learner && Learner.isActive && Learner.isActive() && Learner.token) ? Learner.token() : null;
  }

  /* SSE gövdesini okur: { t } parçaları birleşir, { son, kalan } bitiş, { hata } hata. */
  function akisOku(govde, parcaGeldi) {
    var okuyucu = govde.getReader(), dec = new TextDecoder(), tampon = '', metin = '', bitis = null;
    function isle(sonParca) {
      var satirlar = tampon.split('\n');
      tampon = sonParca ? '' : satirlar.pop();
      satirlar.forEach(function (s) {
        s = s.trim();
        if (s.indexOf('data:') !== 0) return;
        var o;
        try { o = JSON.parse(s.slice(5).trim()); } catch (e) { return; }
        if (o && typeof o.t === 'string') { metin += o.t; parcaGeldi(metin); }
        else if (o && o.son) bitis = o;
        else if (o && o.hata) { var h = new Error(o.hata); h.kod = o.hata; throw h; }
      });
    }
    function oku() {
      return okuyucu.read().then(function (r) {
        if (r.done) { isle(true); return; }
        tampon += dec.decode(r.value, { stream: true });
        isle(false);
        if (bitis) return;
        return oku();
      });
    }
    return oku().then(function () { return { metin: metin, bitis: bitis }; });
  }

  function gonder() {
    if (!oturum || istekte) return;
    var govde = {
      dersId: oturum.dersId, adim: oturum.adim, istek: oturum.istek,
      yanitlar: oturum.yanitlar.slice(), gecmis: oturum.gecmis.slice()
    };
    son = JSON.parse(JSON.stringify(govde));
    cevapKutu.innerHTML = '';
    if (!bulutHazir()) { son.durum = 'bulut'; hataGoster('bulut'); return; }
    var t = belirtec();
    if (!t) { son.durum = 'giris'; hataGoster('giris'); return; }
    son.durum = 'gonderildi';

    istekte = true; kapatildi = false;
    var aiBalon = balon('ai', '');
    yaziyor(aiBalon);
    iptal = (typeof AbortController === 'function') ? new AbortController() : null;
    var zaman = setTimeout(function () { if (iptal) iptal.abort(); }, ZAMAN_ASIMI_MS);
    var c = window.CLOUD_CONFIG;
    fetch(String(c.url).replace(/\/+$/, '') + '/functions/v1/ai-sohbet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + c.anonKey, apikey: c.anonKey },
      body: JSON.stringify({ token: t, dersId: govde.dersId, adim: govde.adim, istek: govde.istek,
                             yanitlar: govde.yanitlar, gecmis: govde.gecmis }),
      signal: iptal ? iptal.signal : undefined
    }).then(function (res) {
      if (!res.ok || !res.body) {
        return res.json().catch(function () { return {}; }).then(function (j) {
          var h = new Error('http'); h.kod = (j && j.error) || (res.status === 401 ? 'belirtec-gecersiz' : 'ai-hata'); throw h;
        });
      }
      return akisOku(res.body, function (metin) { aiBalon.innerHTML = bicimle(metin); asagi(); });
    }).then(function (r) {
      if (!r.metin.trim()) { var h = new Error('bos'); h.kod = 'ai-hata'; throw h; }
      aiBalon.innerHTML = bicimle(r.metin);
      oturum.gecmis.push(r.metin.slice(0, MAKS_GECMIS));
      if (r.bitis) hakYaz(r.bitis.kalan);
      cevaplariGoster(r.metin);
      asagi();
    }).catch(function (e) {
      aiBalon.remove();
      if (kapatildi) return;   // çocuk paneli kapattı: iptal hata değil
      /* Basılan cevap GERİ ALINMAZ: sunucu yanitlar ile gecmis'in aynı uzunlukta olmasını
         ister; "Tekrar dene" aynı gövdeyi yeniden gönderir. */
      hataGoster((e && e.kod) || 'ai-hata');
    }).then(function () {
      clearTimeout(zaman);
      istekte = false; iptal = null;
    });
  }

  function yanitla(kod, etiket) {
    if (istekte || !oturum) return;
    if (oturum.yanitlar.length >= MAKS_TUR || oturum.yanitlar.length >= oturum.gecmis.length) return;
    oturum.yanitlar.push(kod);
    balon('cocuk', etiket);
    gonder();
  }

  /* ---------- dış sözleşme ---------- */
  function baslat(o) {
    o = o || {};
    kur();
    if (istekte) { ac(); return; }   // çift tıklama / ikinci çağrı: yeni istek yok
    var dersId = dersKimligi();
    oturum = { dersId: dersId, adim: adimNo(dersId), istek: String(o.istek || 'takildim'),
               baslik: String(o.baslik || 'Takıldım'), yanitlar: [], gecmis: [] };
    liste.innerHTML = '';
    cevapKutu.innerHTML = '';
    hakEl.textContent = '';
    ac();
    balon('cocuk', oturum.baslik);
    gonder();
  }

  /* Açılış hareketi CSS'te (ai-sohbet.css, reduced-motion'da kapalı): durum gecikmez. */
  /* Panel açılınca odak panele, kapanınca onu açan öğeye döner. */
  var oncekiOdak = null;
  function ac() {
    if (kok.hidden) oncekiOdak = document.activeElement;
    kok.hidden = false;
    var kapat = kok.querySelector('.ai-sohbet-kapat');
    if (kapat && !kok.contains(document.activeElement)) { try { kapat.focus({ preventScroll: true }); } catch (e) {} }
    if (window.AiHelper && AiHelper.kapat) AiHelper.kapat();   // robotun balonu panelin üstüne binmesin
  }

  function kapatPanel() {
    if (!kok) return;
    kapatildi = true;
    if (iptal) { try { iptal.abort(); } catch (e) { /* zaten bitti */ } }
    kok.hidden = true;
    if (oncekiOdak && oncekiOdak.isConnected && typeof oncekiOdak.focus === 'function') {
      try { oncekiOdak.focus({ preventScroll: true }); } catch (e) {}
    }
    oncekiOdak = null;
  }

  window.AiSohbet = {
    baslat: baslat,
    kapat: kapatPanel,
    get acik() { return !!kok && !kok.hidden; },
    /* Son hazırlanan isteğin belirteçsiz kopyası + durum ('gonderildi' | 'bulut' | 'giris'):
       testler ?cloud=off'ta da hangi sorunun seçildiğini görebilsin. */
    get sonIstek() { return son ? JSON.parse(JSON.stringify(son)) : null; }
  };
})();
