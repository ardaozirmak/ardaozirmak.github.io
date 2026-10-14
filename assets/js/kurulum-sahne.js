/* ============================================================
   KURULUM SAHNESİ — Ders 1.1 Adım 4'ün video yerine motion design hali
   ============================================================
   Arda (2026-10-05): "videoları motion design ile yapıp video yerine
   o tasarımı kullansak". Ekran kaydı 1280x720'de küçülünce okunmuyordu;
   burada her şey HTML olduğu için kamera ilgili yere YAKINLAŞIYOR,
   yazı her boyda keskin kalıyor.

   NASIL ÇALIŞIR
   - KurulumSahne.bagla(div) div'e <video>'nun kullandığımız kadar
     API'sini takar: play/pause/load, paused, ended, currentTime,
     duration, readyState, src/currentSrc ve aynı olaylar (play,
     playing, pause, timeupdate, loadedmetadata, ended). Böylece
     video-player.js'in düğmeleri, ilerleme çubuğu, 5sn sarma ve
     testler hiç değişmeden çalışıyor.
   - src = 'sahne:<ad>' → SAHNELER[ad] kurulur.
   - Her kare render(t) ile SIFIRDAN hesaplanır (t'ye bağlı, geçmişe
     bağlı değil): ileri/geri sarma, çubuğu sürükleme kendiliğinden
     doğru kareyi verir.
   - Hareket katmanından (hareket.js) bağımsız: bu bir süs değil,
     dersin içeriği — otomasyonda da oynamalı. reduced-motion'da
     kamera kayarak değil kesmeyle geçer.

   GERİ ALMAK: index.html'deki kurulum-sahne.js satırını sil →
   video-player.js eski mp4'lere döner.
   ============================================================ */
(function () {
  'use strict';

  var W = 1280, H = 720;
  var AZ_HAREKET = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function kis(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function yumusak(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function ara(a, b, p) { return a + (b - a) * p; }
  function kacis(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- simgeler (arayüz taklidi, sahne içi) ---------- */
  var SVG = {
    dogrula: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    yukle: '<svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    hata: '<svg viewBox="0 0 24 24"><path d="M9 6l9 6-9 6z" fill="currentColor"/></svg>',
    klasor: '<svg viewBox="0 0 24 24"><path d="M3 7h7l2 2h9v10H3z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    kart: '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" stroke="currentColor" stroke-width="1.8"/></svg>',
    kitap: '<svg viewBox="0 0 24 24"><path d="M5 4h6v16H5zM13 4h6v16h-6z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    hata2: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 17L17 7" stroke="currentColor" stroke-width="1.8"/></svg>',
    ara: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    indir: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    exe: '<svg viewBox="0 0 24 24"><path d="M6 2h9l4 4v16H6z" fill="#e8f4f5" stroke="#00878f" stroke-width="1.5"/><circle cx="12.5" cy="14" r="3.6" fill="none" stroke="#00878f" stroke-width="1.6"/></svg>',
    tik: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    seri: '<svg viewBox="0 0 24 24"><path d="M3 15l4-6 4 4 4-8 6 10" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    arduino: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#00878f"/><path d="M15.5 18.5a5.5 5.5 0 1 0 0 11c3.6 0 5.4-3 8.5-5.5 3.1-2.5 4.9-5.5 8.5-5.5a5.5 5.5 0 1 1 0 11c-3.6 0-5.4-3-8.5-5.5-3.1-2.5-4.9-5.5-8.5-5.5z" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M12.5 24h6M29.5 24h6M32.5 21v6" stroke="#fff" stroke-width="2.2"/></svg>'
  };

  /* ---------- ortak IDE iskeleti ---------- */
  function ide(o) {
    var menu = o.tr
      ? ['Dosya', 'Düzenle', 'Taslak', 'Araçlar', 'Yardım']
      : ['File', 'Edit', 'Sketch', 'Tools', 'Help'];
    var menuHtml = menu.map(function (m, i) {
      return '<span class="ks-ide-menu-o" id="' + o.p + '-m' + i + '">' + m + '</span>';
    }).join('');
    return '' +
      '<div class="ks-ide">' +
        '<div class="ks-ide-baslik"><span class="ks-ide-logo">' + SVG.arduino + '</span>' + (o.baslik || 'sketch_oct5a | Arduino IDE 2.3.10') +
          '<span class="ks-pen-dugme">&#8212;</span><span class="ks-pen-dugme">&#9744;</span><span class="ks-pen-dugme">&#10005;</span></div>' +
        '<div class="ks-ide-menu">' + menuHtml + '</div>' +
        '<div class="ks-ide-arac">' +
          '<span class="ks-yuvarlak" id="' + o.p + '-dogrula">' + SVG.dogrula + '</span>' +
          '<span class="ks-yuvarlak" id="' + o.p + '-yukle">' + SVG.yukle + '</span>' +
          '<span class="ks-yuvarlak ks-soluk">' + SVG.hata + '</span>' +
          '<span class="ks-kartsec" id="' + o.p + '-kart"><span class="ks-kartsec-ad" id="' + o.p + '-kartAd">' + o.kart + '</span><span class="ks-ok">&#9662;</span></span>' +
          '<span class="ks-ide-sag" id="' + o.p + '-seriIkon">' + SVG.seri + '</span>' +
        '</div>' +
        '<div class="ks-ide-govde">' +
          '<div class="ks-ide-yan">' +
            '<span>' + SVG.klasor + '</span>' +
            '<span id="' + o.p + '-ikonKart">' + SVG.kart + '</span>' +
            '<span>' + SVG.kitap + '</span>' +
            '<span>' + SVG.hata2 + '</span>' +
            '<span>' + SVG.ara + '</span>' +
          '</div>' +
          (o.panel || '') +
          '<div class="ks-ide-edit">' +
            '<div class="ks-ide-sekme"><span>sketch_oct5a.ino</span></div>' +
            '<div class="ks-kod" id="' + o.p + '-editor">' + (o.kod || '') + '</div>' +
            (o.cikti || '') +
          '</div>' +
        '</div>' +
        '<div class="ks-ide-durum"><span id="' + o.p + '-durum">' + (o.durum || 'Satır 1, Sütun 1') + '</span><span class="ks-durum-sag" id="' + o.p + '-durumSag">' + (o.durumSag || (o.tr ? 'Kart seçilmedi' : 'No board selected')) + '</span></div>' +
        (o.ek || '') +
      '</div>';
  }

  // Basit renklendirme: yorum, anahtar kelime, sayı, fonksiyon adı.
  function renklendir(satir) {
    var h = kacis(satir);
    var yorum = '';
    var yi = h.indexOf('//');
    if (yi !== -1) { yorum = '<span class="ks-k-yorum">' + h.slice(yi) + '</span>'; h = h.slice(0, yi); }
    h = h.replace(/\b(void)\b/g, '<span class="ks-k-tur">$1</span>')
         .replace(/\b(setup|loop|neopixelWrite|delay|pinMode|digitalWrite|Serial|begin|println)\b/g, '<span class="ks-k-fn">$1</span>')
         .replace(/\b(RGBLED|LED_BUILTIN|OUTPUT|HIGH|LOW|D5|D6|D9|D10)\b/g, '<span class="ks-k-sabit">$1</span>')
         .replace(/\b(\d+)\b/g, '<span class="ks-k-sayi">$1</span>');
    return h + yorum;
  }
  function kodHtml(satirlar) {
    return satirlar.map(function (s, i) {
      return '<div class="ks-satir"><span class="ks-no">' + (i + 1) + '</span><span class="ks-kodmetin">' + (renklendir(s) || '&nbsp;') + '</span></div>';
    }).join('');
  }
  var VARSAYILAN_KOD = ['void setup() {', '  // put your setup code here, to run once:', '', '}', '', 'void loop() {', '  // put your main code here, to run repeatedly:', '', '}'];

  function dersKodu() {
    try {
      if (window.LessonEngine && LessonEngine.lessonCode) {
        var k = LessonEngine.lessonCode();
        if (k && k.trim()) return k.replace(/\s+$/, '').split('\n');
      }
    } catch (e) { /* yedeğe düş */ }
    return ['void setup() {', '}', '', 'void loop() {', '  neopixelWrite(RGBLED, 0, 0, 40);', '  delay(1000);', '  neopixelWrite(RGBLED, 0, 0, 0);', '  delay(1000);', '}'];
  }

  /* ============================================================
     SAHNELER
     Olay dili (t = saniye):
       {t, imlec:'#id' | [x,y], d}   imleç t anında hedefte (d sn önce yola çıkar)
       {t, tik:'sol'|'sag'|'cift'}   tıklama halkası; imlecin son hedefi basılır
       {t, kam:'#id'|null, z, d}     kamera yakınlaşması (null = tüm ekran)
       {t, ac:'#id'} / {t, kapa:'#id'}   görünürlük (.on)
       {t, sinif:'#id', ad, var}     herhangi bir sınıf
       {t, yaz:'#id', metin, hiz}    harf harf yazma
       {t, metin:'#id', deger}       yazıyı birden değiştir
       {t, dolum:'#id', bitis}       ilerleme çubuğu 0→%100
       {t, satirlar:'#id', liste, bitis}   çıktı satırları akar
       {t, alt:'yazı', bitis}        sahne içi altyazı
       {t, tus:'Ctrl + A', bitis}    klavye kısayolu rozeti
       {t, vurgu:'#id', bitis}       hedefin çevresinde nabız halkası
       {t, yanip:'#id', periyot}     periyodun ilk yarısı .on (LED ritmi)
       {t, bolum:'Başlık', no, bitis} bölüm kartı (anime.js zaman çizelgesi, t'ye seek edilir)
       {t, kare:'#id', adet, bitis}  Blender kare şeridi (assets/img/kurulum/*.webp) t'ye bağlı oynar
     Sahne parçaları `parca(bas, liste)` ile yerel zamanla yazılır: araya
     yeni adım girince arkasındakiler tek sayıyla kayar.
     ============================================================ */
  function parca(bas, liste) {
    return liste.map(function (x) {
      var y = Object.assign({}, x); y.t = x.t + bas;
      if ('bitis' in x) y.bitis = x.bitis + bas;
      return y;
    });
  }
  var SAHNELER = {};

  /* ---------- 1) İndir ve kur ---------- */
  SAHNELER.indir = {
    sure: 41.4,
    imlecBas: [900, 600],
    html: function () {
      return '' +
      '<div class="ks-masaustu">' +
        '<div class="ks-tarayici">' +
          '<div class="ks-tb-sekmeler"><span class="ks-tb-nokta"></span><span class="ks-tb-nokta"></span><span class="ks-tb-nokta"></span><span class="ks-tb-sekme">Deneyap Atölyem</span></div>' +
          '<div class="ks-tb-adres"><span class="ks-tb-git">&#8592;</span><span class="ks-tb-git">&#8594;</span><span class="ks-tb-git">&#10227;</span>' +
            '<span class="ks-tb-url">deneyap-atolyem / Ders 1.1</span>' +
            '<span class="ks-tb-indir" id="s1-indirIkon">' + SVG.indir + '</span></div>' +
          '<div class="ks-sayfa">' +
            '<div class="ks-sayfa-ust"><b>Deneyap Atölyem</b><span>Ders 1.1 · Dahili LED</span></div>' +
            '<div class="ks-sayfa-govde">' +
              '<div class="ks-sayfa-sol"><div class="ks-sayfa-kart"></div></div>' +
              '<div class="ks-sayfa-sag">' +
                '<h3>Adım 4: Kurulum &amp; IDE Altyapısı</h3>' +
                '<p>Önce <span class="ks-indir-btn" id="s1-btn">' + SVG.indir + 'Arduino İndir</span> butonuna tıkla, dosyayı çalıştır.</p>' +
                '<div class="ks-sayfa-video"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="ks-indirmeler" id="s1-panel">' +
            '<div class="ks-indirmeler-bas">Son indirmeler</div>' +
            '<div class="ks-dosya" id="s1-dosya">' +
              '<span class="ks-dosya-ikon">' + SVG.exe + '</span>' +
              '<span class="ks-dosya-yazi"><b>arduino-ide_2.3.10_Windows_64bit.exe</b>' +
                '<span class="ks-cubuk"><span class="ks-cubuk-dolu" id="s1-dolum"></span></span>' +
                '<small id="s1-durum">İndiriliyor…</small></span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="ks-win ks-kurulum" id="s1-kur">' +
          '<div class="ks-win-bas">' + SVG.arduino + 'Arduino IDE Kurulumu<span class="ks-pen-dugme">&#10005;</span></div>' +
          '<div class="ks-sayfalar">' +
            '<div class="ks-k-sayfa" id="s1-p1">' +
              '<h4>Lisans Sözleşmesi</h4><p class="ks-k-alt">Lütfen kurmadan önce sözleşmeyi oku.</p>' +
              '<div class="ks-lisans">Terms of Service<br>The Arduino software is provided to you "as is" and we make no express or implied warranties whatsoever with respect to its functionality, operability, or use…</div>' +
              '<div class="ks-k-dugmeler"><span class="ks-k-btn ks-k-ana" id="s1-kabul">Kabul Ediyorum</span><span class="ks-k-btn">Vazgeç</span></div>' +
            '</div>' +
            '<div class="ks-k-sayfa" id="s1-p2">' +
              '<h4>Kurulum Seçenekleri</h4><p class="ks-k-alt">Bu uygulama kimler için kurulsun?</p>' +
              '<div class="ks-radyo"><span class="ks-radyo-d"></span>Bu bilgisayarı kullanan herkes</div>' +
              '<div class="ks-radyo ks-radyo-sec"><span class="ks-radyo-d"></span>Yalnızca benim için</div>' +
              '<div class="ks-k-dugmeler"><span class="ks-k-btn">&lt; Geri</span><span class="ks-k-btn ks-k-ana" id="s1-ileri">İleri &gt;</span><span class="ks-k-btn">Vazgeç</span></div>' +
            '</div>' +
            '<div class="ks-k-sayfa" id="s1-p3">' +
              '<h4>Hedef Klasör</h4><p class="ks-k-alt">Arduino IDE bu klasöre kurulacak.</p>' +
              '<div class="ks-yol">C:\\Users\\Öğrenci\\AppData\\Local\\Programs\\Arduino IDE</div>' +
              '<p class="ks-k-alt">Gereken alan: 527.9 MB</p>' +
              '<div class="ks-k-dugmeler"><span class="ks-k-btn">&lt; Geri</span><span class="ks-k-btn ks-k-ana" id="s1-kurBtn">Kur</span><span class="ks-k-btn">Vazgeç</span></div>' +
            '</div>' +
            '<div class="ks-k-sayfa" id="s1-p4">' +
              '<h4>Kuruluyor</h4><p class="ks-k-alt">Arduino IDE kurulurken lütfen bekle.</p>' +
              '<div class="ks-cubuk ks-cubuk-buyuk"><span class="ks-cubuk-dolu" id="s1-kdolum"></span></div>' +
              '<p class="ks-k-alt ks-k-dosyalar">Dosyalar çıkarılıyor…</p>' +
            '</div>' +
            '<div class="ks-k-sayfa" id="s1-p5">' +
              '<div class="ks-bitti-ikon">' + SVG.tik + '</div>' +
              '<h4>Kurulum tamamlandı</h4>' +
              '<div class="ks-onay"><span class="ks-onay-kutu">' + SVG.tik + '</span>Arduino IDE\'yi çalıştır</div>' +
              '<div class="ks-k-dugmeler"><span class="ks-k-btn ks-k-ana" id="s1-bitir">Bitir</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="ks-acilis" id="s1-acilis">' + SVG.arduino + '<span>Arduino IDE açılıyor…</span></div>' +

        /* Çocuğun en çok donduğu yer (Arda, 2026-10-05: "takılınca yardım"): Windows'un
           kendi izin pencereleri. Gerçeğindeki gibi ekran kararır, pencere ortada. */
        '<div class="ks-perde ks-perde-koyu" id="s1-uacPerde"></div>' +
        '<div class="ks-win ks-uac" id="s1-uac">' +
          '<div class="ks-uac-bas">Kullanıcı Hesabı Denetimi</div>' +
          '<div class="ks-uac-soru">Bu uygulamanın cihazınızda değişiklik yapmasına izin vermek istiyor musunuz?</div>' +
          '<div class="ks-uac-uyg">' + SVG.arduino + '<div><b>Arduino IDE</b><small>Doğrulanmış yayımcı: Arduino SA</small></div></div>' +
          '<div class="ks-uac-dugmeler"><span class="ks-uac-btn ks-uac-ana" id="s1-evet">Evet</span><span class="ks-uac-btn">Hayır</span></div>' +
        '</div>' +
        '<div class="ks-win ks-winguv" id="s1-surucu">' +
          '<div class="ks-winguv-bas">Windows Güvenliği<span class="ks-pen-dugme">&#10005;</span></div>' +
          '<div class="ks-winguv-govde">' +
            '<p class="ks-winguv-soru">Bu aygıt yazılımını yüklemek istiyor musunuz?</p>' +
            '<div class="ks-winguv-ad"><span class="ks-winguv-ikon">' + SVG.kart + '</span><div>Ad: Arduino USB Driver<br>Yayımcı: Arduino srl</div></div>' +
            '<div class="ks-ayar-kutucuk ks-winguv-cb"><span class="ks-cb ks-cb-on"></span>“Arduino srl” yazılımına her zaman güven</div>' +
            '<div class="ks-winguv-dugmeler"><span class="ks-uac-btn ks-uac-ana" id="s1-yukleS">Yükle</span><span class="ks-uac-btn">Yükleme</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="ks-win ks-winguv ks-duvar" id="s1-duvar">' +
          '<div class="ks-winguv-bas">Windows Güvenliği Uyarısı<span class="ks-pen-dugme">&#10005;</span></div>' +
          '<div class="ks-winguv-govde">' +
            '<p class="ks-winguv-soru">Windows Defender Güvenlik Duvarı bu uygulamanın bazı özelliklerini engelledi</p>' +
            '<div class="ks-winguv-ad"><span class="ks-winguv-ikon">' + SVG.arduino + '</span><div>Ad: Arduino IDE<br>Yayımcı: Arduino SA</div></div>' +
            '<div class="ks-winguv-dugmeler"><span class="ks-uac-btn ks-uac-ana" id="s1-izin">Erişime izin ver</span><span class="ks-uac-btn">İptal</span></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    },
    olaylar: [].concat(
      [{ t: 0, bolum: 'Arduino IDE\'yi indir ve kur', no: '1 / 4', bitis: 2.6 }],
      parca(2.4, [
        { t: 0.4, alt: '“Arduino İndir” butonuna tıkla', bitis: 3.6 },
        { t: 0.3, kam: '#s1-btn', z: 1.7, d: 1.1 },
        { t: 1.8, imlec: '#s1-btn', d: 1.2 },
        { t: 2.6, tik: 'sol' },
        { t: 2.9, ac: '#s1-panel' },
        { t: 3.0, kam: '#s1-panel', z: 1.8, d: 1.0 },
        { t: 3.2, dolum: '#s1-dolum', bitis: 5.6 },
        { t: 5.7, metin: '#s1-durum', deger: '158 MB · Tamamlandı' },
        { t: 4.0, alt: 'İndirilen dosyaya çift tıkla', bitis: 7.4 },
        { t: 5.9, imlec: '#s1-dosya', d: 1.0 },
        { t: 6.6, tik: 'cift' },
        { t: 7.2, kapa: '#s1-panel' },
        { t: 7.3, kam: null, d: 0.9 }
      ]),
      // Windows izni (UAC): ekran kararır, "Evet"
      parca(9.9, [
        { t: 0, ac: '#s1-uacPerde' }, { t: 0, ac: '#s1-uac' },
        { t: 0.1, alt: 'Windows izin ister: “Evet”e bas', bitis: 3.2 },
        { t: 0.2, kam: '#s1-uac', z: 1.55, d: 0.8 },
        { t: 1.6, imlec: '#s1-evet', d: 1.0 },
        { t: 2.3, tik: 'sol' },
        { t: 2.6, kapa: '#s1-uac' }, { t: 2.6, kapa: '#s1-uacPerde' },
        { t: 2.7, kam: null, d: 0.6 }
      ]),
      parca(5.8, [
        { t: 7.5, ac: '#s1-kur' }, { t: 7.5, ac: '#s1-p1' },
        { t: 8.3, kam: '#s1-kur', z: 1.55, d: 0.9 },
        { t: 8.2, alt: 'Şartları kabul et', bitis: 11.2 },
        { t: 9.9, imlec: '#s1-kabul', d: 1.1 },
        { t: 10.6, tik: 'sol' },
        { t: 10.9, kapa: '#s1-p1' }, { t: 10.9, ac: '#s1-p2' },
        { t: 11.3, alt: '“Yalnızca benim için” seçili kalsın, İleri\'ye bas', bitis: 14.6 },
        { t: 13.2, imlec: '#s1-ileri', d: 1.1 },
        { t: 13.9, tik: 'sol' },
        { t: 14.2, kapa: '#s1-p2' }, { t: 14.2, ac: '#s1-p3' },
        { t: 14.7, alt: 'Kur\'a bas, kurulum başlasın', bitis: 17.6 },
        { t: 16.2, imlec: '#s1-kurBtn', d: 1.0 },
        { t: 16.9, tik: 'sol' },
        { t: 17.2, kapa: '#s1-p3' }, { t: 17.2, ac: '#s1-p4' },
        { t: 17.4, dolum: '#s1-kdolum', bitis: 21.2 },
        { t: 17.7, alt: 'Kurulum biraz sürer, bekle (hızlandırıldı)', bitis: 21.3 },
        { t: 17.6, imlec: [940, 610], d: 0.9 },
        { t: 21.4, kapa: '#s1-p4' }, { t: 21.4, ac: '#s1-p5' },
        { t: 21.6, alt: 'Bitir\'e bas, Arduino IDE açılsın', bitis: 24.6 },
        { t: 22.9, imlec: '#s1-bitir', d: 1.0 },
        { t: 23.6, tik: 'sol' },
        { t: 23.9, kapa: '#s1-kur' },
        { t: 24.0, kam: null, d: 1.0 },
        { t: 24.4, ac: '#s1-acilis' }
      ]),
      // İlk açılışta iki pencere daha: kart sürücüsü ve güvenlik duvarı
      parca(31.4, [
        { t: 0, ac: '#s1-uacPerde' }, { t: 0, ac: '#s1-surucu' },
        { t: 0.1, alt: 'Kart sürücüsünü soracak: “Yükle”ye bas', bitis: 3.2 },
        { t: 0.2, kam: '#s1-surucu', z: 1.5, d: 0.8 },
        { t: 1.6, imlec: '#s1-yukleS', d: 1.0 },
        { t: 2.3, tik: 'sol' },
        { t: 2.6, kapa: '#s1-surucu' },
        { t: 2.9, ac: '#s1-duvar' },
        { t: 3.0, kam: '#s1-duvar', z: 1.5, d: 0.8 },
        { t: 3.3, alt: 'Güvenlik Duvarı sorarsa: “Erişime izin ver”', bitis: 6.4 },
        { t: 4.6, imlec: '#s1-izin', d: 1.0 },
        { t: 5.3, tik: 'sol' },
        { t: 5.6, kapa: '#s1-duvar' }, { t: 5.6, kapa: '#s1-uacPerde' },
        { t: 5.7, kam: null, d: 0.8 },
        { t: 6.5, alt: 'Bu pencereler yalnız ilk sefer çıkar. Hazır! Sıradaki: ayarlar', bitis: 10.0 }
      ])
    )
  };

  /* ---------- 2) Tercihler: dil + Kart Yöneticisi adresi ---------- */
  var URL_KART = 'https://raw.githubusercontent.com/deneyapkart/deneyapkart-arduino-core/master/package_deneyapkart_index.json';
  SAHNELER.tercih = {
    sure: 31.4,
    imlecBas: [700, 420],
    html: function () {
      return ide({
        p: 's2', kart: 'Select Board', kod: kodHtml(VARSAYILAN_KOD), durum: 'Ln 1, Col 1',
        ek:
          '<div class="ks-acilir" id="s2-dosyaMenu">' +
            '<div>New Sketch<i>Ctrl+N</i></div><div>Open…<i>Ctrl+O</i></div><div>Sketchbook</div><div>Examples</div>' +
            '<hr><div>Close<i>Ctrl+W</i></div><div>Save<i>Ctrl+S</i></div><div>Save As…</div><hr>' +
            '<div id="s2-tercih">Preferences…<i>Ctrl+,</i></div><hr><div>Quit<i>Ctrl+Q</i></div>' +
          '</div>' +
          '<div class="ks-perde" id="s2-perde"></div>' +
          '<div class="ks-dlg" id="s2-dlg">' +
            '<div class="ks-dlg-bas"><span id="s2-dlgBas">Preferences</span><span>&#10005;</span></div>' +
            '<div class="ks-dlg-sekmeler"><span class="ks-sekme-on">Settings</span><span>Network</span></div>' +
            '<div class="ks-ayar"><label>Sketchbook location:</label></div>' +
            '<div class="ks-ayar"><span class="ks-kutu ks-genis">c:\\Users\\Öğrenci\\Documents\\Arduino</span><span class="ks-teal-btn">BROWSE</span></div>' +
            '<div class="ks-ayar"><label>Editor font size:</label><span class="ks-kutu ks-dar">14</span></div>' +
            '<div class="ks-ayar"><label>Theme:</label><span class="ks-secim">Dark<b>&#9662;</b></span></div>' +
            '<div class="ks-ayar"><label>Language:</label><span class="ks-secim" id="s2-dil"><span id="s2-dilAd">English</span><b>&#9662;</b></span><small>(Reload required)</small>' +
              '<div class="ks-liste" id="s2-dilListe">' +
                '<div>English</div><div>Deutsch</div><div>Español</div><div>Français</div><div>Italiano</div><div id="s2-tr">Türkçe</div>' +
              '</div>' +
            '</div>' +
            '<div class="ks-ayar"><label>Compiler warnings:</label><span class="ks-secim">None<b>&#9662;</b></span></div>' +
            '<div class="ks-ayar ks-ayar-kutucuk"><span class="ks-cb"></span>Verify code after upload</div>' +
            '<div class="ks-ayar ks-ayar-kutucuk"><span class="ks-cb ks-cb-on"></span>Auto save</div>' +
            '<div class="ks-ayar ks-ayar-url"><label>Additional boards manager URLs:</label><span class="ks-kutu ks-url" id="s2-url"><span id="s2-urlMetin"></span></span>' +
              '<div class="ks-acilir ks-bag" id="s2-bag">' +
                '<div>Undo<i>Ctrl+Z</i></div><div>Redo<i>Ctrl+Y</i></div><hr><div>Cut<i>Ctrl+X</i></div><div>Copy<i>Ctrl+C</i></div>' +
                '<div id="s2-yapistir">Paste<i>Ctrl+V</i></div><hr><div>Select All<i>Ctrl+A</i></div>' +
              '</div>' +
            '</div>' +
            '<div class="ks-dlg-alt"><span class="ks-hayalet-btn">CANCEL</span><span class="ks-teal-btn" id="s2-ok">OK</span></div>' +
          '</div>' +
          '<div class="ks-yenile" id="s2-yenile">' + SVG.arduino + '<span>Arduino IDE Türkçe açılıyor…</span></div>'
      });
    },
    olaylar: [].concat(
      [{ t: 0, bolum: 'Türkçe yap, kart adresini ekle', no: '2 / 4', bitis: 2.6 }],
      parca(2.4, [
      { t: 0.3, alt: 'Üstteki menüden File\'a tıkla', bitis: 3.2 },
      { t: 0.2, kam: '#s2-m0', z: 1.9, d: 1.0 },
      { t: 1.4, imlec: '#s2-m0', d: 1.1 },
      { t: 2.0, tik: 'sol' },
      { t: 2.2, ac: '#s2-dosyaMenu' }, { t: 2.2, sinif: '#s2-m0', ad: 'ks-secili', var: true },
      { t: 2.4, kam: '#s2-dosyaMenu', z: 1.7, d: 0.8 },
      { t: 3.3, alt: '“Preferences…” (Tercihler) seç', bitis: 5.6 },
      { t: 4.2, imlec: '#s2-tercih', d: 1.0 },
      { t: 4.3, sinif: '#s2-tercih', ad: 'ks-uzerinde', var: true },
      { t: 4.8, tik: 'sol' },
      { t: 5.0, kapa: '#s2-dosyaMenu' }, { t: 5.0, sinif: '#s2-m0', ad: 'ks-secili', var: false },
      { t: 5.1, ac: '#s2-perde' }, { t: 5.1, ac: '#s2-dlg' },
      { t: 5.3, kam: '#s2-dil', z: 1.9, d: 1.0 },
      { t: 5.8, alt: 'Language kutusundan Türkçe\'yi seç', bitis: 10.0 },
      { t: 7.0, imlec: '#s2-dil', d: 1.1 },
      { t: 7.4, tik: 'sol' },
      { t: 7.6, ac: '#s2-dilListe' },
      { t: 8.6, imlec: '#s2-tr', d: 0.8 },
      { t: 8.65, sinif: '#s2-tr', ad: 'ks-uzerinde', var: true },
      { t: 9.1, tik: 'sol' },
      { t: 9.3, kapa: '#s2-dilListe' }, { t: 9.3, metin: '#s2-dilAd', deger: 'Türkçe' },
      { t: 9.3, vurgu: '#s2-dil', bitis: 10.6 },
      { t: 10.3, kam: '#s2-url', z: 1.75, d: 1.0 },
      { t: 10.4, alt: 'Kart Yöneticisi adresi senin için otomatik kopyalandı…', bitis: 13.6 },
      { t: 13.7, alt: '…sonra bu kutuya sağ tıkla, Paste (Yapıştır) seç', bitis: 17.8 },
      { t: 12.0, imlec: '#s2-url', d: 1.2 },
      { t: 13.8, tik: 'sag' },
      { t: 14.0, ac: '#s2-bag' },
      { t: 15.2, imlec: '#s2-yapistir', d: 0.9 },
      { t: 15.25, sinif: '#s2-yapistir', ad: 'ks-uzerinde', var: true },
      { t: 15.8, tik: 'sol' },
      { t: 16.0, kapa: '#s2-bag' },
      { t: 16.0, metin: '#s2-urlMetin', deger: URL_KART },
      { t: 16.0, sinif: '#s2-url', ad: 'ks-yeni', var: true },
      { t: 16.1, vurgu: '#s2-url', bitis: 17.8 },
      { t: 18.0, alt: 'OK\'ye bas', bitis: 21.0 },
      { t: 18.0, kam: '#s2-ok', z: 1.8, d: 0.9 },
      { t: 19.5, imlec: '#s2-ok', d: 1.0 },
      { t: 20.2, tik: 'sol' },
      { t: 20.5, kapa: '#s2-dlg' }, { t: 20.5, kapa: '#s2-perde' },
      { t: 20.5, kam: null, d: 1.0 },
      { t: 20.9, ac: '#s2-yenile' },
      { t: 22.3, kapa: '#s2-yenile' },
      { t: 22.3, metin: '#s2-m0', deger: 'Dosya' }, { t: 22.3, metin: '#s2-m1', deger: 'Düzenle' },
      { t: 22.3, metin: '#s2-m2', deger: 'Taslak' }, { t: 22.3, metin: '#s2-m3', deger: 'Araçlar' },
      { t: 22.3, metin: '#s2-m4', deger: 'Yardım' }, { t: 22.3, metin: '#s2-kartAd', deger: 'Kart Seç' },
      { t: 22.3, metin: '#s2-durumSag', deger: 'Kart seçilmedi' },
      { t: 22.4, vurgu: '#s2-m0', bitis: 24.6 },
      { t: 22.4, alt: 'Menüler artık Türkçe!', bitis: 25 }
      ]),
      parca(27.4, [
        { t: 0, alt: 'Neden bu adres? Arduino, Deneyap kartının paketini buradan indirecek', bitis: 4.0 }
      ])
    )
  };

  /* ---------- 3) Kart paketi + kart ve port seçimi ---------- */
  var KURULUM_SATIRLARI = [
    'Paketler indiriliyor',
    'deneyap:xtensa-esp32-elf-gcc@esp-2021r2-patch5-8.4.0',
    'deneyap:esptool_py@4.5.1',
    'deneyap:mkspiffs@0.2.3',
    'Installing deneyap:xtensa-esp32-elf-gcc… installed',
    'Installing deneyap:esptool_py@4.5.1 installed',
    'Installing deneyap:mklittlefs@3.0.0 installed',
    'Installing platform deneyap:esp32',
    'Platform deneyap:esp32 kuruldu'
  ];
  SAHNELER.kart = {
    sure: 43.6,
    imlecBas: [640, 380],
    html: function () {
      return ide({
        p: 's3', tr: true, kart: 'Kart Seç', kod: kodHtml(VARSAYILAN_KOD),
        panel:
          '<div class="ks-yanpanel" id="s3-panel">' +
            '<div class="ks-yanpanel-bas">KART YÖNETİCİSİ</div>' +
            '<div class="ks-kutu ks-ara" id="s3-ara"><span id="s3-araMetin"></span><span class="ks-ara-ipucu on" id="s3-araIpucu">Filtrele…</span></div>' +
            '<div class="ks-tur">Tür: <span class="ks-secim">Tümü<b>&#9662;</b></span></div>' +
            '<div class="ks-paketler">' +
              '<div class="ks-paket ks-eski on" id="s3-p1"><b>Arduino AVR Boards</b><small>Arduino</small><p>Uno, Mega, Nano…</p><span class="ks-teal-btn ks-kucuk">KUR</span></div>' +
              '<div class="ks-paket ks-eski on" id="s3-p2"><b>Arduino ESP32 Boards</b><small>Arduino</small><p>Nano ESP32</p><span class="ks-teal-btn ks-kucuk">KUR</span></div>' +
              '<div class="ks-paket ks-eski on" id="s3-p3"><b>Arduino Mbed OS Boards</b><small>Arduino</small><p>Portenta, Nicla…</p><span class="ks-teal-btn ks-kucuk">KUR</span></div>' +
              '<div class="ks-paket ks-deneyap" id="s3-pd"><b>Deneyap Geliştirme Kartları</b><small>Turkish Technology Team Foundation</small>' +
                '<p>Deneyap Kart, Deneyap Mini, Deneyap Mini v2…</p>' +
                '<span class="ks-surum">1.1.4 <b>&#9662;</b></span><span class="ks-teal-btn ks-kucuk" id="s3-kurBtn"><span id="s3-kurYazi">KUR</span></span>' +
                '<span class="ks-yuklu" id="s3-yuklu">1.1.4 yüklü</span>' +
              '</div>' +
            '</div>' +
          '</div>',
        cikti:
          '<div class="ks-cikti" id="s3-cikti"><div class="ks-cikti-bas">Çıkış</div><div class="ks-cikti-govde" id="s3-satirlar"></div></div>',
        ek:
          '<div class="ks-acilir ks-kartmenu" id="s3-kartMenu">' +
            '<div class="ks-gri">Bilinmeyen<i>COM4</i></div><hr><div id="s3-baska">Başka Kart ve Port Seç…</div>' +
          '</div>' +
          '<div class="ks-perde" id="s3-perde"></div>' +
          '<div class="ks-dlg ks-dlg-kart" id="s3-dlg">' +
            '<div class="ks-dlg-bas"><span>Başka Kart ve Port Seç</span><span>&#10005;</span></div>' +
            '<p class="ks-dlg-acik">Bir eskiz yüklemek istiyorsan hem Kart hem Port seçmelisin.</p>' +
            '<div class="ks-iki">' +
              '<div><div class="ks-baslikcik">KARTLAR</div>' +
                '<div class="ks-kutu ks-ara" id="s3-kara"><span id="s3-karaMetin"></span><span class="ks-ara-ipucu on" id="s3-karaIpucu">Kart ara</span></div>' +
                '<div class="ks-sonuc">' +
                  '<div class="ks-sonuc-o ks-gri on" id="s3-yok">Kart bulunamadı</div>' +
                  '<div class="ks-sonuc-o" id="s3-r1">Deneyap Kart</div>' +
                  '<div class="ks-sonuc-o" id="s3-r2">Deneyap Kart 1A v2</div>' +
                  '<div class="ks-sonuc-o" id="s3-r3">Deneyap Mini</div>' +
                  '<div class="ks-sonuc-o" id="s3-mini2">Deneyap Mini v2</div>' +
                '</div></div>' +
              '<div><div class="ks-baslikcik">PORTLAR</div>' +
                '<div class="ks-sonuc ks-portlar">' +
                  '<div class="ks-sonuc-o on" id="s3-port">COM4 Serial Port (USB)<span class="ks-port-tik">' + SVG.tik + '</span></div>' +
                '</div></div>' +
            '</div>' +
            '<div class="ks-dlg-alt"><span class="ks-hayalet-btn">İPTAL</span><span class="ks-teal-btn" id="s3-tamam">TAMAM</span></div>' +
          '</div>' +
          /* Blender anı (blender/kurulum-tak.py): fiş karta girer, GÜÇ ledi yanar — 16 kare t'ye bağlı. */
          '<div class="ks-blender" id="s3-tak"><div class="ks-blender-kare" id="s3-takKare"></div>' +
            '<span class="ks-guc-halka" id="s3-gucHalka"></span></div>' +
          '<div class="ks-yardim" id="s3-yardim">' +
            '<div class="ks-yardim-bas"><span class="ks-yardim-ikon">?</span>Port listesi boş mu?</div>' +
            '<ol><li>Kabloyu karttan çıkar, <b>yeniden tak</b>. Liste birkaç saniyede yenilenir.</li>' +
            '<li>Hâlâ yoksa <b>başka bir kablo</b> dene: bazı kablolar yalnızca şarj eder, veri taşımaz.</li></ol>' +
          '</div>'
      });
    },
    olaylar: [].concat(
      [{ t: 0, bolum: 'Kart paketini kur, kartını tak', no: '3 / 4', bitis: 2.6 }],
      parca(2.4, [
        { t: 0.3, alt: 'Soldaki Kart Yöneticisi simgesine tıkla', bitis: 3.0 },
        { t: 0.2, kam: '#s3-ikonKart', z: 1.9, d: 1.0 },
        { t: 1.5, imlec: '#s3-ikonKart', d: 1.1 },
        { t: 2.1, tik: 'sol' },
        { t: 2.3, ac: '#s3-panel' }, { t: 2.3, sinif: '#s3-ikonKart', ad: 'ks-secili', var: true },
        { t: 2.6, kam: '#s3-ara', z: 1.8, d: 0.9 },
        { t: 3.1, alt: 'Arama kutusuna “deneyap” yaz', bitis: 6.6 },
        { t: 3.9, imlec: '#s3-ara', d: 0.9 },
        { t: 4.2, tik: 'sol' },
        { t: 4.5, kapa: '#s3-araIpucu' },
        { t: 4.5, yaz: '#s3-araMetin', metin: 'deneyap', hiz: 0.13 },
        { t: 5.5, kapa: '#s3-p1' }, { t: 5.5, kapa: '#s3-p2' }, { t: 5.5, kapa: '#s3-p3' },
        { t: 5.6, ac: '#s3-pd' },
        { t: 5.9, kam: '#s3-pd', z: 1.75, d: 0.9 },
        { t: 6.7, alt: '“Deneyap Geliştirme Kartları”nda KUR\'a bas', bitis: 9.4 },
        { t: 7.9, imlec: '#s3-kurBtn', d: 1.0 },
        { t: 8.5, tik: 'sol' },
        { t: 8.7, ac: '#s3-cikti' },
        { t: 8.8, kam: [720, 560], z: 1.45, d: 1.0 },
        { t: 8.8, satirlar: '#s3-satirlar', liste: KURULUM_SATIRLARI, bitis: 13.4 },
        { t: 9.5, alt: 'Paket kuruluyor, bekle (hızlandırıldı)', bitis: 13.6 },
        { t: 9.2, imlec: [760, 300], d: 0.9 },
        { t: 13.5, metin: '#s3-kurYazi', deger: 'KALDIR' }, { t: 13.5, ac: '#s3-yuklu' },
        { t: 13.5, vurgu: '#s3-yuklu', bitis: 14.8 },
        { t: 13.6, kam: '#s3-pd', z: 1.75, d: 0.8 }
      ]),
      // Blender: kartı USB kablosuyla bilgisayara tak, GÜÇ ışığı yansın
      parca(17.3, [
        { t: 0, ac: '#s3-perde' }, { t: 0, ac: '#s3-tak' },
        { t: 0, kam: null, d: 0.7 },
        { t: 0.2, alt: 'Şimdi kartını USB kablosuyla bilgisayara tak', bitis: 3.8 },
        { t: 0.6, kare: '#s3-takKare', adet: 16, bitis: 3.6 },
        { t: 3.7, ac: '#s3-gucHalka' },
        { t: 3.8, alt: 'GÜÇ ışığı yandı mı? Yandıysa kart elektrik alıyor', bitis: 6.8 },
        { t: 6.9, kapa: '#s3-tak' }, { t: 6.9, kapa: '#s3-perde' }, { t: 6.9, kapa: '#s3-gucHalka' }
      ]),
      parca(9.6, [
        { t: 15.0, kam: '#s3-kart', z: 1.9, d: 1.0 },
        { t: 15.0, alt: 'Üstte “Kart Seç”e tıkla', bitis: 17.8 },
        { t: 16.4, imlec: '#s3-kart', d: 1.1 },
        { t: 17.0, tik: 'sol' },
        { t: 17.2, ac: '#s3-kartMenu' },
        { t: 17.9, alt: '“Başka Kart ve Port Seç…”e tıkla', bitis: 19.9 },
        { t: 18.7, imlec: '#s3-baska', d: 0.9 },
        { t: 18.75, sinif: '#s3-baska', ad: 'ks-uzerinde', var: true },
        { t: 19.2, tik: 'sol' },
        { t: 19.4, kapa: '#s3-kartMenu' },
        { t: 19.4, ac: '#s3-perde' }, { t: 19.4, ac: '#s3-dlg' },
        { t: 19.5, kam: '#s3-dlg', z: 1.45, d: 1.0 },
        { t: 20.0, alt: '“Deneyap Mini v2” yaz ve seç', bitis: 23.8 },
        { t: 20.6, imlec: '#s3-kara', d: 0.9 },
        { t: 20.9, tik: 'sol' },
        { t: 21.1, kapa: '#s3-karaIpucu' },
        { t: 21.1, yaz: '#s3-karaMetin', metin: 'Deneyap Mini v2', hiz: 0.09 },
        { t: 21.5, kapa: '#s3-yok' },
        { t: 21.5, ac: '#s3-r1' }, { t: 21.5, ac: '#s3-r2' }, { t: 21.5, ac: '#s3-r3' }, { t: 21.5, ac: '#s3-mini2' },
        { t: 22.2, kapa: '#s3-r1' }, { t: 22.2, kapa: '#s3-r2' },
        { t: 23.3, imlec: '#s3-mini2', d: 0.9 },
        { t: 23.8, tik: 'sol' },
        { t: 23.9, sinif: '#s3-mini2', ad: 'ks-secili', var: true },
        { t: 24.0, alt: 'Sağda portu seç, TAMAM\'a bas', bitis: 27.0 },
        { t: 24.9, imlec: '#s3-port', d: 0.9 },
        { t: 25.4, tik: 'sol' },
        { t: 25.5, sinif: '#s3-port', ad: 'ks-secili', var: true },
        { t: 26.2, imlec: '#s3-tamam', d: 0.8 },
        { t: 26.7, tik: 'sol' },
        { t: 26.9, kapa: '#s3-dlg' }, { t: 26.9, kapa: '#s3-perde' },
        { t: 26.9, metin: '#s3-kartAd', deger: 'Deneyap Mini v2' },
        { t: 26.9, metin: '#s3-durumSag', deger: 'Deneyap Mini v2 · COM4' },
        { t: 26.9, vurgu: '#s3-kart', bitis: 28 },
        { t: 26.9, kam: '#s3-kart', z: 1.6, d: 0.8 }
      ]),
      // Takılınca yardım: port görünmüyorsa
      parca(37.6, [
        { t: 0, ac: '#s3-yardim' },
        { t: 0, kam: '#s3-yardim', z: 1.35, d: 0.8 },
        { t: 5.4, kapa: '#s3-yardim' },
        { t: 5.4, kam: null, d: 0.6 }
      ])
    )
  };

  /* ---------- 4) Kodu yapıştır ve yükle ---------- */
  SAHNELER.yukle = {
    sure: 39.2,
    imlecBas: [900, 500],
    html: function () {
      var cikti = [
        'Taslak derleniyor…',
        'Taslak 287540 bayt (%21) program alanı kullanıyor.',
        'esptool.py v4.5.1 · Seri port COM4',
        'Bağlanılıyor....',
        'Writing at 0x00010000... (100 %)',
        'Hard resetting via RTS pin...'
      ];
      return ide({
        p: 's4', tr: true, kart: 'Deneyap Mini v2', durumSag: 'Deneyap Mini v2 · COM4',
        kod: '<div class="ks-kodblok on" id="s4-eski">' + kodHtml(VARSAYILAN_KOD) + '</div>' +
             '<div class="ks-kodblok" id="s4-yeni">' + kodHtml(dersKodu()) + '</div>',
        cikti:
          '<div class="ks-cikti on" id="s4-cikti"><div class="ks-cikti-bas">Çıkış</div><div class="ks-cikti-govde" id="s4-satirlar"></div></div>',
        ek:
          '<div class="ks-acilir ks-bag" id="s4-bag">' +
            '<div>Tanıma Git<i>Ctrl+F12</i></div><div>Sembolü Yeniden Adlandır<i>F2</i></div><div>Belgeyi Biçimlendir</div><hr>' +
            '<div>Kes<i>Ctrl+X</i></div><div>Kopyala<i>Ctrl+C</i></div><div id="s4-yapistir">Yapıştır<i>Ctrl+V</i></div>' +
          '</div>' +
          '<div class="ks-ipucu-balon" id="s4-yukleIpucu">Yükle</div>' +
          '<div class="ks-kartpanel" id="s4-kartPanel">' +
            '<div class="ks-kartpanel-bas">Masandaki kart</div>' +
            '<div class="ks-kartpanel-resim' + (document.documentElement.getAttribute('data-masa') ? ' masa-' + document.documentElement.getAttribute('data-masa') : '') + '">' +
              '<img src="assets/img/kart/kart-led-kapali.webp" alt="">' +
              '<img class="ks-led-acik" id="s4-ledAcik" src="assets/img/kart/kart-led-acik.webp" alt="">' +
            '</div>' +
            '<div class="ks-kartpanel-alt">1 sn yanık · 1 sn sönük</div>' +
          '</div>' +
          '<div class="ks-yardim ks-yardim-kart" id="s4-yardim">' +
            '<div class="ks-yardim-bas"><span class="ks-yardim-ikon">?</span>Yükleme olmadıysa</div>' +
            '<div class="ks-dugme-resim">' +
              '<img id="s4-d0" class="ks-dugme-k" src="assets/img/kurulum/dugme-normal.webp" alt="">' +
              '<img id="s4-d1" class="ks-dugme-k" src="assets/img/kurulum/dugme-buton.webp" alt="">' +
              '<img id="s4-d2" class="ks-dugme-k" src="assets/img/kurulum/dugme-ikisi.webp" alt="">' +
              '<span class="ks-parmak ks-parmak-b" id="s4-parmakB"><i></i><b>BUTON</b></span>' +
              '<span class="ks-parmak ks-parmak-r" id="s4-parmakR"><i></i><b>RESET</b></span>' +
            '</div>' +
          '</div>' +
          '<div class="ks-bildirim" id="s4-bildirim"><span class="ks-bildirim-tik">' + SVG.tik + '</span>Yükleme tamamlandı.</div>' +
          '<div class="ks-gizli-veri" data-cikti="' + kacis(JSON.stringify(cikti)) + '"></div>'
      });
    },
    olaylar: [].concat(
      [{ t: 0, bolum: 'Kodu karta yükle', no: '4 / 4', bitis: 2.6 }],
      parca(2.4, [
      { t: 0.3, alt: 'Kodun içine tıkla, tümünü seç (Ctrl + A)', bitis: 4.0 },
      { t: 0.2, kam: [520, 330], z: 1.45, d: 1.0 },
      { t: 1.5, imlec: [430, 300], d: 1.1 },
      { t: 2.0, tik: 'sol' },
      { t: 2.6, tus: 'Ctrl + A', bitis: 3.9 },
      { t: 2.8, sinif: '#s4-eski', ad: 'ks-secim-on', var: true },
      { t: 4.1, alt: 'Sağ tıkla, Yapıştır\'a bas. Kod zaten kopyalandı!', bitis: 7.6 },
      { t: 4.8, tik: 'sag' },
      { t: 5.0, ac: '#s4-bag' },
      { t: 6.1, imlec: '#s4-yapistir', d: 0.9 },
      { t: 6.15, sinif: '#s4-yapistir', ad: 'ks-uzerinde', var: true },
      { t: 6.7, tik: 'sol' },
      { t: 6.9, kapa: '#s4-bag' },
      { t: 6.9, kapa: '#s4-eski' }, { t: 6.9, ac: '#s4-yeni' },
      { t: 6.9, sinif: '#s4-yeni', ad: 'ks-yeni', var: true },
      { t: 7.7, alt: 'Yükle (→) düğmesine bas', bitis: 10.6 },
      { t: 7.7, kam: '#s4-yukle', z: 2.0, d: 1.0 },
      { t: 9.2, imlec: '#s4-yukle', d: 1.1 },
      { t: 9.3, ac: '#s4-yukleIpucu' },
      { t: 9.9, tik: 'sol' },
      { t: 10.1, kapa: '#s4-yukleIpucu' },
      { t: 10.2, kam: [560, 560], z: 1.5, d: 1.0 },
      { t: 10.3, satirlar: '#s4-satirlar', liste: 'veri', bitis: 13.8 },
      { t: 10.4, tus: 'İlk yükleme 1-2 dakika sürebilir', bitis: 13.8 },
      { t: 10.3, imlec: [760, 420], d: 0.9 },
      { t: 10.7, alt: 'Kart koda yükleniyor…', bitis: 14.0 },
      { t: 14.0, ac: '#s4-bildirim' },
      { t: 14.0, kam: null, d: 1.0 },
      { t: 14.2, alt: '“Yükleme tamamlandı” yazısını gördün mü?', bitis: 15.9 },
      { t: 15.9, ac: '#s4-kartPanel' }, { t: 15.9, kapa: '#s4-bildirim' },
      { t: 16.0, yanip: '#s4-ledAcik', periyot: 2 },
      { t: 16.1, alt: 'Kartındaki mavi LED yanıp sönmeye başladı!', bitis: 20 }
      ]),
      // Takılınca yardım: kart yükleme moduna elle alınır (BUTON basılıyken RESET)
      parca(24.6, [
        { t: 0, kapa: '#s4-kartPanel' }, { t: 0, ac: '#s4-yardim' }, { t: 0, ac: '#s4-d0' },
        { t: 0.2, alt: 'LED yanmadı, kırmızı hata mı çıktı? Şöyle dene:', bitis: 3.0 },
        { t: 3.0, alt: '1) Kartın üstündeki BUTON\'a basılı tut', bitis: 5.8 },
        { t: 3.2, kapa: '#s4-d0' }, { t: 3.2, ac: '#s4-d1' }, { t: 3.2, ac: '#s4-parmakB' },
        { t: 5.8, alt: '2) BUTON basılıyken RESET\'e bas ve bırak', bitis: 8.6 },
        { t: 6.4, kapa: '#s4-d1' }, { t: 6.4, ac: '#s4-d2' }, { t: 6.4, ac: '#s4-parmakR' },
        { t: 7.4, kapa: '#s4-d2' }, { t: 7.4, ac: '#s4-d1' }, { t: 7.4, kapa: '#s4-parmakR' },
        { t: 8.6, alt: '3) BUTON\'u bırak, sonra tekrar Yükle\'ye bas', bitis: 11.4 },
        { t: 9.0, kapa: '#s4-d1' }, { t: 9.0, ac: '#s4-d0' }, { t: 9.0, kapa: '#s4-parmakB' },
        { t: 11.4, alt: 'Yükleme bitti ama LED hâlâ sönük mü? RESET\'e bir kez bas', bitis: 14.6 },
        { t: 11.6, ac: '#s4-parmakR' }, { t: 13.2, kapa: '#s4-parmakR' }
      ])
    )
  };

  /* ------------------------------------------------------------
     Ders 2.1 (dk0040) Adım 5: Seri Monitör'ü aç, hızı seç, yazıyı ışıkla birlikte gör.
     Etkileşimli bir "seri monitör aleti" DEĞİL (Arda 2026-10-05: ders içi alet paneli yok):
     çocuk kendi Arduino IDE'sinde yapacağını burada izler. Önce yanlış hız (9600) →
     anlamsız işaretler; 115200 seçilince YANDI/SONDU, LED'le aynı saniyede.
     LED görselleri Blender (blender/seri-led.py → assets/img/kurulum/seri-led-*.webp).
     ------------------------------------------------------------ */
  var SERI_SATIR = [];
  for (var si = 0; si < 6; si++) SERI_SATIR.push('YANDI', 'SONDU');
  SAHNELER.seri = {
    sure: 24.4,
    imlecBas: [700, 420],
    html: function () {
      return ide({
        p: 's5', tr: true, kart: 'Deneyap Mini v2', durumSag: 'Deneyap Mini v2 · COM4',
        kod: '<div class="ks-kodblok on">' + kodHtml(dersKodu()) + '</div>',
        cikti:
          '<div class="ks-cikti ks-seri" id="s5-seri">' +
            '<div class="ks-cikti-bas ks-seri-bas"><span class="ks-seri-sekme">Çıkış</span><span class="ks-seri-sekme on">Seri Port Ekranı</span>' +
              '<span class="ks-seri-hiz" id="s5-hiz"><span id="s5-hizAd">9600 baud</span><span class="ks-ok">&#9662;</span></span></div>' +
            '<div class="ks-cikti-govde" id="s5-satirlar"></div>' +
          '</div>',
        ek:
          '<div class="ks-ipucu-balon ks-seri-ipucu" id="s5-seriIpucu">Seri Port Ekranı</div>' +
          '<div class="ks-acilir ks-hiz-liste" id="s5-hizListe">' +
            '<div>9600 baud</div><div>57600 baud</div><div id="s5-hiz115">115200 baud</div>' +
          '</div>' +
          '<div class="ks-kartpanel ks-seri-led" id="s5-ledPanel">' +
            '<div class="ks-kartpanel-bas">D5’teki LED</div>' +
            '<div class="ks-kartpanel-resim">' +
              '<img src="assets/img/kurulum/seri-led-sonuk.webp" alt="">' +
              '<img class="ks-led-acik" id="s5-ledAcik" src="assets/img/kurulum/seri-led-yanik.webp" alt="">' +
            '</div>' +
            '<div class="ks-kartpanel-alt">1 sn yanık · 1 sn sönük</div>' +
          '</div>'
      });
    },
    olaylar: [].concat(
      [{ t: 0, bolum: 'Kartın yazdıklarını gör', no: 'Seri Monitör', bitis: 2.6 }],
      parca(2.4, [
        { t: 0.3, alt: 'Kod karta yüklendi. Sağ üstteki düğme: Seri Port Ekranı', bitis: 3.6 },
        { t: 0.2, kam: '#s5-seriIkon', z: 2.2, d: 1.0 },
        { t: 1.6, imlec: '#s5-seriIkon', d: 1.1 },
        { t: 1.7, ac: '#s5-seriIpucu' },
        { t: 2.3, tik: 'sol' },
        { t: 2.5, kapa: '#s5-seriIpucu' },
        { t: 2.6, ac: '#s5-seri' },
        // Tam görünüm: hız kutusu sağda, satırlar solda; ikisi birden kadrajda kalsın
        // (yakınlaşınca hız kutusu dışarıda, altyazı satırların üstündeydi).
        { t: 2.7, kam: null, d: 1.0 },
        { t: 3.0, satirlar: '#s5-satirlar', liste: ['⸮⸮x⸮⸮⸮⸮', '⸮⸮⸮⸮⸮', '⸮x⸮⸮⸮⸮⸮'], bitis: 6.0 },
        { t: 3.4, alt: 'Anlamsız işaretler mi? Ekranın hızı koddakiyle aynı değil.', bitis: 6.6 },
        { t: 4.0, vurgu: '#s5-hiz', bitis: 6.4 },
        { t: 5.6, imlec: '#s5-hiz', d: 1.0 },
        { t: 6.6, tik: 'sol' },
        { t: 6.7, ac: '#s5-hizListe' },
        { t: 6.8, alt: 'Kodda Serial.begin(115200) yazıyor: 115200’ü seç', bitis: 9.4 },
        { t: 7.8, imlec: '#s5-hiz115', d: 0.9 },
        { t: 7.85, sinif: '#s5-hiz115', ad: 'ks-uzerinde', var: true },
        { t: 8.6, tik: 'sol' },
        { t: 8.7, kapa: '#s5-hizListe' },
        { t: 8.7, metin: '#s5-hizAd', deger: '115200 baud' },
        // 12 satır 12 saniyeye: her satır LED'in değiştiği saniyede düşer (yanip ile aynı başlangıç).
        { t: 9.0, satirlar: '#s5-satirlar', liste: SERI_SATIR, bitis: 21.0 },
        { t: 9.0, ac: '#s5-ledPanel' },
        { t: 9.0, yanip: '#s5-ledAcik', periyot: 2 },
        { t: 9.0, kam: null, d: 1.0 },
        { t: 9.3, alt: 'LED yanınca YANDI, sönünce SONDU', bitis: 13.0 },
        { t: 13.2, alt: 'Işık ve yazı aynı anda değişiyor: kart sana ne yaptığını söylüyor', bitis: 17.0 },
        { t: 17.2, alt: 'Sen de kendi Seri Port Ekranı’nda 115200’ü seç', bitis: 21.6 }
      ])
    )
  };

  /* ------------------------------------------------------------
     Ders 2.2 (dk0160) Adım 5: trafik lambası çalışırken yanan rengin adı Seri Monitör'e gelir.
     2.1'in sahnesinin kardeşi: hız 115200'ü çocuk 2.1'de öğrendi, burada yalnız gösterilir.
     Süreler kodla aynı: kırmızı 4 sn, yeşil 3 sn, sarı 1 sn; her satır ışığın değiştiği anda
     düşer (satırlar eşit aralıklı akmasın diye her satır ayrı olay). Modül görseli 1.6'nın
     dik modülü (blender/trafik-modul.py DIK=1); ışıklar üstünde CSS (kurulum-sahne.css .ks-tl-*).
     ------------------------------------------------------------ */
  var TRAFIK_ADIM = [['KIRMIZI', 'k', 4], ['YESIL', 'y', 3], ['SARI', 's', 1]];
  function trafikOlaylari(bas, tur) {
    var olay = [], satir = [], t = bas;
    for (var n = 0; n < tur; n++) {
      TRAFIK_ADIM.forEach(function (a) {
        satir = satir.concat(a[0]);
        olay.push({ t: t, satirlar: '#s6-satirlar', liste: satir.slice(), bitis: t + 0.05 });
        ['k', 'y', 's'].forEach(function (r) { olay.push({ t: t, sinif: '#s6-' + r, ad: 'on', var: r === a[1] }); });
        t += a[2];
      });
    }
    // Son turdan sonra lamba kırmızıyla yeniden başlar gibi kalmasın: son ışık sönük biter.
    ['k', 'y', 's'].forEach(function (r) { olay.push({ t: t, sinif: '#s6-' + r, ad: 'on', var: false }); });
    return olay;
  }
  SAHNELER.seriTrafik = {
    sure: 24.4,
    imlecBas: [700, 420],
    html: function () {
      return ide({
        p: 's6', tr: true, kart: 'Deneyap Mini v2', durumSag: 'Deneyap Mini v2 · COM4',
        kod: '<div class="ks-kodblok on">' + kodHtml(dersKodu()) + '</div>',
        cikti:
          '<div class="ks-cikti ks-seri" id="s6-seri">' +
            '<div class="ks-cikti-bas ks-seri-bas"><span class="ks-seri-sekme">Çıkış</span><span class="ks-seri-sekme on">Seri Port Ekranı</span>' +
              '<span class="ks-seri-hiz" id="s6-hiz"><span>115200 baud</span><span class="ks-ok">&#9662;</span></span></div>' +
            '<div class="ks-cikti-govde" id="s6-satirlar"></div>' +
          '</div>',
        ek:
          '<div class="ks-ipucu-balon ks-seri-ipucu" id="s6-seriIpucu">Seri Port Ekranı</div>' +
          '<div class="ks-kartpanel ks-seri-led ks-seri-trafik" id="s6-ledPanel">' +
            '<div class="ks-kartpanel-bas">Trafik lambası modülü</div>' +
            '<div class="ks-kartpanel-resim"><div class="ks-tl">' +
              '<img src="assets/img/kart/trafik-modul-dik.webp" alt="">' +
              '<i class="ks-tl-led ks-tl-k" id="s6-k"></i><i class="ks-tl-led ks-tl-s" id="s6-s"></i><i class="ks-tl-led ks-tl-y" id="s6-y"></i>' +
            '</div></div>' +
            '<div class="ks-kartpanel-alt">kırmızı 4 sn · yeşil 3 sn · sarı 1 sn</div>' +
          '</div>'
      });
    },
    olaylar: [].concat(
      [{ t: 0, bolum: 'Yanan rengi ekranda gör', no: 'Seri Monitör', bitis: 2.6 }],
      parca(2.4, [
        { t: 0.3, alt: 'Kod karta yüklendi. Sağ üstteki düğme: Seri Port Ekranı', bitis: 3.4 },
        { t: 0.2, kam: '#s6-seriIkon', z: 2.2, d: 1.0 },
        { t: 1.6, imlec: '#s6-seriIkon', d: 1.1 },
        { t: 1.7, ac: '#s6-seriIpucu' },
        { t: 2.3, tik: 'sol' },
        { t: 2.5, kapa: '#s6-seriIpucu' },
        { t: 2.6, ac: '#s6-seri' },
        { t: 2.7, kam: null, d: 1.0 },
        { t: 3.0, vurgu: '#s6-hiz', bitis: 4.8 },
        { t: 3.0, alt: 'Hız 115200: Ders 2.1’deki gibi, koddaki Serial.begin(115200) ile aynı', bitis: 5.0 },
        { t: 5.2, ac: '#s6-ledPanel' },
        { t: 5.4, alt: 'Kırmızı yanarken ekrana KIRMIZI geliyor', bitis: 9.0 },
        { t: 9.3, alt: 'Yeşil yanınca YESIL', bitis: 12.0 },
        { t: 12.25, alt: 'Sarı yanınca SARI: yalnız 1 saniye', bitis: 13.2 },
        { t: 13.4, alt: 'Işık ve yazı aynı anda değişiyor: her println kendi renginin altında', bitis: 17.4 },
        { t: 17.6, alt: 'Sen de kendi Seri Port Ekranı’nda izle', bitis: 21.4 }
      ]),
      trafikOlaylari(7.6, 2)
    )
  };

  /* ============================================================
     MOTOR
     ============================================================ */
  function bagla(el) {
    el.classList.add('ks');
    el.innerHTML =
      '<div class="ks-tuval"><div class="ks-dunya">' +
        '<div class="ks-icerik"></div>' +
        '<div class="ks-vurgu"></div>' +
        '<div class="ks-halka"></div><div class="ks-halka"></div>' +
        '<div class="ks-imlec"><svg viewBox="0 0 24 24"><path d="M4 2.5l15 9.2-6.6 1.3 3.9 7.4-3 1.6-3.9-7.5L4.8 19z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg><span class="ks-imlec-not">sağ tık</span></div>' +
      '</div>' +
      '<div class="ks-vinyet"></div>' +
      '<div class="ks-ust"><div class="ks-tus"></div><div class="ks-alt"><span></span></div>' +
        '<div class="ks-bolum"><i class="ks-bolum-isik"></i><span class="ks-bolum-no"></span><b class="ks-bolum-ad"></b><i class="ks-bolum-cizgi"></i></div>' +
      '</div>' +
      '</div>';

    var tuval = el.querySelector('.ks-tuval');
    var dunya = el.querySelector('.ks-dunya');
    var icerik = el.querySelector('.ks-icerik');
    var imlec = el.querySelector('.ks-imlec');
    var halkalar = el.querySelectorAll('.ks-halka');
    var vurguEl = el.querySelector('.ks-vurgu');
    var altEl = el.querySelector('.ks-alt');
    var altYazi = altEl.querySelector('span');
    var tusEl = el.querySelector('.ks-tus');
    var vinyet = el.querySelector('.ks-vinyet');
    var bolumEl = el.querySelector('.ks-bolum');
    var bolumParca = {
      isik: bolumEl.querySelector('.ks-bolum-isik'), no: bolumEl.querySelector('.ks-bolum-no'),
      ad: bolumEl.querySelector('.ks-bolum-ad'), cizgi: bolumEl.querySelector('.ks-bolum-cizgi')
    };
    var bolumAktif = null, bolumTl = null;

    var st = { src: '', sahne: null, t: 0, paused: true, ended: false, raf: 0, son: 0, sonTU: 0 };
    var hazir = null; // sahneye özel hazırlanmış olay tabloları

    function olay(ad) { el.dispatchEvent(new Event(ad)); }

    /* --- ölçek: 1280x720 tuval sahneye sığar, ortalanır --- */
    function olcekle() {
      var w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      var s = Math.min(w / W, h / H);
      tuval.style.transform = 'translate(' + ((w - W * s) / 2) + 'px,' + ((h - H * s) / 2) + 'px) scale(' + s + ')';
    }
    if (window.ResizeObserver) new ResizeObserver(olcekle).observe(el);
    window.addEventListener('resize', olcekle);

    /* --- öğe konumu (dönüşümsüz, tuval koordinatında) --- */
    var bulCache = {};
    function bul(sec) {
      if (!bulCache[sec]) bulCache[sec] = icerik.querySelector(sec);
      return bulCache[sec];
    }
    function kutu(sec) {
      var e = bul(sec);
      if (!e) return { x: W / 2, y: H / 2, w: 0, h: 0 };
      var x = 0, y = 0, n = e;
      while (n && n !== dunya) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x: x, y: y, w: e.offsetWidth, h: e.offsetHeight };
    }
    function merkez(hedef) {
      if (Array.isArray(hedef)) return { x: hedef[0], y: hedef[1] };
      var k = kutu(hedef);
      return { x: k.x + k.w / 2, y: k.y + k.h / 2 };
    }

    /* --- sahneyi kur: olayları türlerine ayır --- */
    function kur(sahne) {
      bulCache = {};
      icerik.innerHTML = sahne.html();
      var o = sahne.olaylar.slice().sort(function (a, b) { return a.t - b.t; });
      var veri = icerik.querySelector('.ks-gizli-veri');
      hazir = {
        imlec: o.filter(function (x) { return x.imlec; }).map(function (x) {
          var d = x.d || 0.8; return { bas: x.t - d, t: x.t, d: d, hedef: x.imlec };
        }).sort(function (a, b) { return a.bas - b.bas; }),
        kam: o.filter(function (x) { return 'kam' in x; }).map(function (x) {
          return { bas: x.t, d: AZ_HAREKET ? 0.001 : (x.d || 0.9), hedef: x.kam, z: x.kam ? (x.z || 1.6) : 1 };
        }),
        tik: o.filter(function (x) { return x.tik; }),
        sinif: [], metin: {}, dolum: {}, satirlar: {},
        alt: o.filter(function (x) { return x.alt; }).map(function (x) { return Object.assign({}, x); }),
        tus: o.filter(function (x) { return x.tus; }),
        vurgu: o.filter(function (x) { return x.vurgu; }),
        yanip: o.filter(function (x) { return x.yanip; }),
        bolum: o.filter(function (x) { return x.bolum; }),
        kare: o.filter(function (x) { return x.kare; }),
        ilkSinif: {}, ilkMetin: {}
      };
      o.forEach(function (x) {
        var sec, ad, deger;
        if (x.ac || x.kapa) { sec = x.ac || x.kapa; ad = 'on'; deger = !!x.ac; }
        else if (x.sinif) { sec = x.sinif; ad = x.ad; deger = !!x.var; }
        if (sec) {
          hazir.sinif.push({ t: x.t, sec: sec, ad: ad, var: deger });
          var key = sec + '|' + ad;
          if (!(key in hazir.ilkSinif)) { var e = bul(sec); hazir.ilkSinif[key] = !!(e && e.classList.contains(ad)); }
        }
        if (x.yaz || x.metin) {
          var s = x.yaz || x.metin;
          (hazir.metin[s] = hazir.metin[s] || []).push(x);
          if (!(s in hazir.ilkMetin)) { var m = bul(s); hazir.ilkMetin[s] = m ? m.textContent : ''; }
        }
        if (x.dolum) (hazir.dolum[x.dolum] = hazir.dolum[x.dolum] || []).push(x);
        if (x.satirlar) {
          if (x.liste === 'veri' && veri) x = Object.assign({}, x, { liste: JSON.parse(veri.getAttribute('data-cikti')) });
          (hazir.satirlar[x.satirlar] = hazir.satirlar[x.satirlar] || []).push(x);
        }
      });
      hazir.sonSatir = {};
      bolumAktif = null; bolumTl = null;
      st.sahne = sahne;
      olcekle();
    }

    /* --- bir anahtar kare dizisinde t anındaki değer --- */
    function izle(liste, t, bas, coz) {
      var from = bas, to = bas, t0 = -1, d = 0.001;
      for (var i = 0; i < liste.length; i++) {
        var k = liste[i];
        if (k.bas > t) break;
        var p0 = yumusak(kis((k.bas - t0) / d));
        from = { x: ara(from.x, to.x, p0), y: ara(from.y, to.y, p0), z: ara(from.z, to.z, p0) };
        to = coz(k);
        t0 = k.bas; d = k.d;
      }
      var p = yumusak(kis((t - t0) / d));
      return { x: ara(from.x, to.x, p), y: ara(from.y, to.y, p), z: ara(from.z, to.z, p), p: p, from: from, to: to };
    }

    function kamera(t) {
      var kam = izle(hazir.kam, t, { x: W / 2, y: H / 2, z: 1 }, function (k) {
        if (!k.hedef) return { x: W / 2, y: H / 2, z: 1 };
        var m = merkez(k.hedef); return { x: m.x, y: m.y, z: k.z };
      });
      var z = kam.z, yW = W / (2 * z), yH = H / (2 * z);
      return { z: z, cx: Math.min(Math.max(kam.x, yW), W - yW), cy: Math.min(Math.max(kam.y, yH), H - yH) };
    }
    function imlecKonum(t) {
      var bas = { x: st.sahne.imlecBas[0], y: st.sahne.imlecBas[1], z: 0 };
      return izle(hazir.imlec, t, bas, function (k) { var m = merkez(k.hedef); return { x: m.x, y: m.y, z: 0 }; });
    }
    /* Altyazı ekranın altında durur; o altyazı boyunca imleç (yani
       tıklanacak yer) ekranın alt kısmına düşüyorsa üste çıkar. Karar
       altyazı başına BİR KEZ verilir — kare kare verilse yazı oynarken
       yer değiştirip zıplardı. */
    function altUstteMi(x) {
      if ('ust' in x) return x.ust;
      var ust = false;
      for (var T = x.t; T < x.bitis; T += 0.25) {
        var k = kamera(T), im = imlecKonum(T);
        var sy = (im.y - k.cy) * k.z + H / 2;
        if (sy > H * 0.6) { ust = true; break; }
      }
      x.ust = ust;
      return ust;
    }

    /* Bölüm kartının zaman çizelgesi (anime.js v4): ışık süpürmesi, numara, başlık, çizgi
       sırayla gelir, sonda birlikte söner. autoplay kapalı — render(t) seek eder. anime.js
       yoksa (dosya yüklenmediyse) aynı eğrilerle elle hesaplanır. */
    function bolumZaman(sure) {
      var P = bolumParca, cik = Math.max(600, sure - 450);
      if (window.anime && anime.createTimeline) {
        var tl = anime.createTimeline({ autoplay: false, defaults: { ease: 'outExpo' } });
        tl.add(bolumEl, { opacity: [0, 1], duration: 260, ease: 'linear' }, 0)
          .add(P.isik, { translateX: ['-120%', '220%'], duration: 1100, ease: 'inOutQuad' }, 0)
          .add(P.no, { opacity: [0, 1], translateY: [18, 0], duration: 700 }, 120)
          .add(P.ad, { opacity: [0, 1], translateY: [26, 0], letterSpacing: ['6px', '0.5px'], duration: 900 }, 240)
          .add(P.cizgi, { scaleX: [0, 1], duration: 900, ease: 'inOutCubic' }, 380)
          .add(bolumEl, { opacity: [1, 0], scale: [1, 1.04], duration: 420, ease: 'inQuad' }, cik);
        return function (ms) { tl.seek(Math.min(ms, cik + 420)); };
      }
      return function (ms) {
        var g = kis(ms / 260) * (1 - kis((ms - cik) / 420));
        bolumEl.style.opacity = g.toFixed(3);
        P.cizgi.style.transform = 'scaleX(' + yumusak(kis((ms - 380) / 900)).toFixed(3) + ')';
      };
    }

    function render(t) {
      if (!hazir) return;

      // 1) sınıflar (görünürlük, seçili, üzerinde…)
      var durum = {};
      for (var key in hazir.ilkSinif) durum[key] = hazir.ilkSinif[key];
      hazir.sinif.forEach(function (x) { if (x.t <= t) durum[x.sec + '|' + x.ad] = x.var; });
      for (key in durum) {
        var parca = key.split('|'), e = bul(parca[0]);
        if (e && e.classList.contains(parca[1]) !== durum[key]) e.classList.toggle(parca[1], durum[key]);
      }

      // 2) yazılar
      for (var sec in hazir.metin) {
        var deger = hazir.ilkMetin[sec], yaziyor = false;
        hazir.metin[sec].forEach(function (x) {
          if (x.t > t) return;
          if (x.yaz) {
            var n = Math.min(x.metin.length, Math.floor((t - x.t) / (x.hiz || 0.1)) + 1);
            deger = x.metin.slice(0, n); yaziyor = n < x.metin.length;
          } else { deger = x.deger; yaziyor = false; }
        });
        var me = bul(sec);
        if (me) { if (me.textContent !== deger) me.textContent = deger; me.classList.toggle('ks-yaziyor', yaziyor); }
      }

      // 3) ilerleme çubukları
      for (sec in hazir.dolum) {
        var yuzde = 0;
        hazir.dolum[sec].forEach(function (x) { if (x.t <= t) yuzde = kis((t - x.t) / (x.bitis - x.t)) * 100; });
        var de = bul(sec); if (de) de.style.width = yuzde.toFixed(1) + '%';
      }

      // 4) akan çıktı satırları
      for (sec in hazir.satirlar) {
        var adet = 0, liste = [];
        hazir.satirlar[sec].forEach(function (x) {
          if (x.t <= t) { liste = x.liste; adet = Math.ceil(kis((t - x.t) / (x.bitis - x.t)) * liste.length); }
        });
        if (hazir.sonSatir[sec] !== adet) {
          hazir.sonSatir[sec] = adet;
          var se = bul(sec);
          if (se) se.innerHTML = liste.slice(0, adet).map(function (s, i) {
            return '<div' + (i === adet - 1 ? ' class="ks-satir-yeni"' : '') + '>' + kacis(s) + '</div>';
          }).join('');
        }
      }

      // 4b) yanıp sönen (delay(1000) ritmi: periyodun ilk yarısı yanık)
      hazir.yanip.forEach(function (x) {
        var ye = bul(x.yanip);
        if (ye) ye.classList.toggle('on', t >= x.t && ((t - x.t) % x.periyot) < x.periyot / 2);
      });

      // 4c) Blender kare şeridi: N kare alt alta tek webp; t'ye göre kare seçilir
      hazir.kare.forEach(function (x) {
        var ke = bul(x.kare); if (!ke) return;
        var n = Math.round(kis((t - x.t) / (x.bitis - x.t)) * (x.adet - 1));
        var y = (n / (x.adet - 1) * 100).toFixed(4) + '%';
        if (ke.style.backgroundPositionY !== y) ke.style.backgroundPositionY = y;
      });

      // 5) kamera — hızla kayarken hafif hareket bulanıklığı, yakınken kenar karartma (sinematik)
      var kam = kamera(t), z = kam.z, cx = kam.cx, cy = kam.cy;
      dunya.style.transform = 'translate(' + (W / 2 - cx * z).toFixed(2) + 'px,' + (H / 2 - cy * z).toFixed(2) + 'px) scale(' + z.toFixed(4) + ')';
      var bulanik = 0;
      if (!AZ_HAREKET && t > 0.05) {
        var on = kamera(t - 0.05);
        var hiz = (Math.hypot((cx - on.cx) * z, (cy - on.cy) * z) + Math.abs(z - on.z) * 420) / 0.05;   // px/sn
        bulanik = Math.min(2.2, Math.max(0, (hiz - 260) / 700));
      }
      var filtre = bulanik > 0.15 ? 'blur(' + bulanik.toFixed(2) + 'px)' : '';
      if (dunya.style.filter !== filtre) dunya.style.filter = filtre;
      vinyet.style.opacity = kis((z - 1) / 0.9).toFixed(3);

      // 5b) bölüm kartı: anime.js zaman çizelgesi oynatılmaz, t'ye SEEK edilir (sarma doğru kalır)
      var bo = null;
      hazir.bolum.forEach(function (x) { if (x.t <= t && t < x.bitis) bo = x; });
      if (bo !== bolumAktif) {
        bolumAktif = bo; bolumTl = null;
        bolumEl.classList.toggle('on', !!bo);
        if (bo) {
          bolumParca.no.textContent = bo.no || ''; bolumParca.ad.textContent = bo.bolum;
          bolumTl = bolumZaman((bo.bitis - bo.t) * 1000);
        }
      }
      if (bo && bolumTl) bolumTl((t - bo.t) * 1000);

      // 6) imleç (hafif yay çizerek gider)
      var im = imlecKonum(t);
      var dx = im.to.x - im.from.x, dy = im.to.y - im.from.y;
      var yay = Math.sin(Math.PI * im.p) * 0.12;
      var ix = im.x - dy * yay, iy = im.y + dx * yay;
      // basılı hissi: tıklama anında imleç bir an küçülür
      var bs = 1;
      hazir.tik.forEach(function (x) { var g = t - x.t; if (g >= 0 && g < 0.2) bs = 1 - 0.18 * Math.sin(Math.PI * g / 0.2); });
      imlec.style.transform = 'translate(' + ix.toFixed(1) + 'px,' + iy.toFixed(1) + 'px) scale(' + (bs / Math.sqrt(z)).toFixed(3) + ')';

      // 7) tıklama halkaları + hedefin basılması
      var hi = 0, sagNot = false;
      halkalar.forEach(function (h) { h.style.opacity = 0; });
      hazir.tik.forEach(function (x) {
        var anlar = x.tik === 'cift' ? [x.t, x.t + 0.2] : [x.t];
        anlar.forEach(function (a) {
          var g = t - a;
          if (g < 0 || g > 0.55 || hi >= halkalar.length) return;
          var h = halkalar[hi++], p = g / 0.55;
          h.classList.toggle('ks-halka-sag', x.tik === 'sag');
          h.style.opacity = (1 - p).toFixed(2);
          h.style.transform = 'translate(' + ix.toFixed(1) + 'px,' + iy.toFixed(1) + 'px) scale(' + (0.3 + p * 1.1).toFixed(3) + ')';
        });
        if (x.tik === 'sag' && t - x.t >= 0 && t - x.t < 1.1) sagNot = true;
      });
      imlec.classList.toggle('ks-sag-not', sagNot);
      var basili = null;
      hazir.tik.forEach(function (x) {
        var g = t - x.t; if (g < 0 || g > 0.22) return;
        var son = null;
        hazir.imlec.forEach(function (k) { if (k.t <= x.t + 0.05 && typeof k.hedef === 'string') son = k.hedef; });
        basili = son;
      });
      icerik.querySelectorAll('.ks-bas').forEach(function (e) { if (!basili || e !== bul(basili)) e.classList.remove('ks-bas'); });
      if (basili && bul(basili)) bul(basili).classList.add('ks-bas');

      // 8) vurgu halkası
      var vu = null;
      hazir.vurgu.forEach(function (x) { if (x.t <= t && t < x.bitis) vu = x; });
      if (vu) {
        var vk = kutu(vu.vurgu);
        vurguEl.style.left = (vk.x - 6) + 'px'; vurguEl.style.top = (vk.y - 6) + 'px';
        vurguEl.style.width = (vk.w + 12) + 'px'; vurguEl.style.height = (vk.h + 12) + 'px';
        vurguEl.classList.add('on');
      } else vurguEl.classList.remove('on');

      // 9) altyazı ve kısayol rozeti (yakınlaşmadan etkilenmez)
      var aktifAlt = null;
      hazir.alt.forEach(function (x) { if (x.t <= t && t < x.bitis) aktifAlt = x; });
      if (aktifAlt) {
        if (altYazi.textContent !== aktifAlt.alt) altYazi.textContent = aktifAlt.alt;
        altEl.classList.add('on');
        altEl.classList.toggle('ks-alt-ust', altUstteMi(aktifAlt));
      }
      else altEl.classList.remove('on');
      altEl.classList.toggle('ks-tus-var', hazir.tus.some(function (x) { return x.t <= t && t < x.bitis; }));
      var aktifTus = null;
      hazir.tus.forEach(function (x) { if (x.t <= t && t < x.bitis) aktifTus = x; });
      if (aktifTus) {
        var html = aktifTus.tus.split(' + ').map(function (k) { return '<kbd>' + kacis(k) + '</kbd>'; }).join('<span>+</span>');
        if (tusEl.innerHTML !== html) tusEl.innerHTML = html;
        tusEl.classList.add('on');
      } else tusEl.classList.remove('on');
    }

    /* --- saat --- */
    function kare(simdi) {
      if (st.paused) { st.raf = 0; return; }
      var dt = Math.min(0.1, Math.max(0, (simdi - st.son) / 1000));
      st.son = simdi;
      st.t = Math.min(st.sahne.sure, st.t + dt);
      render(st.t);
      if (simdi - st.sonTU > 200) { st.sonTU = simdi; olay('timeupdate'); }
      if (st.t >= st.sahne.sure) {
        st.paused = true; st.ended = true; st.raf = 0;
        olay('timeupdate'); olay('pause'); olay('ended');
        return;
      }
      st.raf = requestAnimationFrame(kare);
    }

    Object.defineProperties(el, {
      paused: { get: function () { return st.paused; } },
      ended: { get: function () { return st.ended; } },
      duration: { get: function () { return st.sahne ? st.sahne.sure : NaN; } },
      readyState: { get: function () { return st.sahne ? 4 : 0; } },
      currentTime: {
        get: function () { return st.t; },
        set: function (v) {
          if (!st.sahne) return;
          st.t = Math.min(Math.max(+v || 0, 0), st.sahne.sure);
          if (st.t < st.sahne.sure) st.ended = false;
          render(st.t);
          olay('timeupdate'); olay('seeked');
        }
      },
      src: { get: function () { return st.src; }, set: function (v) { st.src = String(v || ''); } },
      currentSrc: { get: function () { return st.src; } },
      poster: { get: function () { return ''; }, set: function () {} }
    });

    el.load = function () {
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = 0; st.paused = true; st.ended = false; st.t = 0;
      var ad = st.src.indexOf('sahne:') === 0 ? st.src.slice(6) : '';
      var sahne = SAHNELER[ad];
      if (!sahne) { hazir = null; icerik.innerHTML = ''; setTimeout(function () { olay('error'); }); return; }
      kur(sahne);
      render(0);
      setTimeout(function () { olay('loadedmetadata'); olay('loadeddata'); olay('canplay'); }, 0);
    };
    el.play = function () {
      if (!st.sahne) return Promise.reject(new Error('sahne yok'));
      if (st.ended || st.t >= st.sahne.sure) { st.t = 0; st.ended = false; }
      if (st.paused) {
        st.paused = false;
        olay('play');
        st.son = performance.now();
        st.raf = requestAnimationFrame(function (s) { olay('playing'); st.son = s; kare(s); });
      }
      return Promise.resolve();
    };
    el.pause = function () {
      if (st.paused) return;
      st.paused = true;
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = 0;
      olay('pause');
    };
    return el;
  }

  window.KurulumSahne = {
    bagla: bagla,
    sahneler: SAHNELER,
    // video-player.js'teki adımların sırası
    adlar: ['indir', 'tercih', 'kart', 'yukle']
  };
})();
