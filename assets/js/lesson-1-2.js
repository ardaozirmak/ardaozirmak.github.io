/* ============================================================
   DERS 1.2 — HARİCİ LED DEVRESİ
   ============================================================
   dk0020_hariciLed_ArdayaVerilecekler_ders1.2 klasöründeki resmi
   içerikten (ders.md) alınmıştır — artık taslak değil. Veri
   assets/data/lesson-1-2.js'ten gelir, ortak mantık (quiz,
   malzeme kontrolü, koda-tıkla, AI promptları, modal, toast) için
   assets/js/lesson-engine.js kullanılır. Bu dosyada sadece Ders
   1.2'ye özgü kısımlar kalır: statik devre şeması adımları ve
   "SEN YAP" pratik görevleri.
   ============================================================ */

let currentStep = 1;
let lessonData = null;
let wiring = null;   // sol paneldeki etkileşimli devre şeması

function renderStepContent() {
  const interactiveArea = document.getElementById('interactiveArea');
  interactiveArea.innerHTML = '';

  if (currentStep === 2) {
    interactiveArea.innerHTML = LessonEngine.renderMaterials();
  } else if (currentStep === 3) {
    /* Eskiden burada tek paragraflık bir metin duvarı vardı ve içinde
       "anot/katot" geçiyordu. Arda: "parçaları bilmeyecek öğrenci" +
       "anot katot anlamaz öğrenci". Artık her parça kendi kartında,
       görseliyle; derinlik "Yakından bak" katmanında duruyor.
       İçerik ve sözcük seçimi: assets/js/parts-gallery.js */
    interactiveArea.innerHTML = PartsGallery.html() + UsbLink.html();
    UsbLink.paint();
  } else if (currentStep === 4) {
    /* Arda: "bağlantı adımları kısmı kalksın, alttaki animasyon büyüsün,
       1.1'deki video yeri gibi olsun alanı."
       Metin listesi kalktı: dört maddeyi zaten şemanın kendi adım şeridi
       (wd-chip) gösteriyordu, aynı şey iki kez ekrandaydı ve üstteki kutu
       animasyonu aşağı itiyordu. Artık ekranın ana işi TEK: kurulumun
       kendisi. Ders 1.1'de Adım 4'ün tamamı nasıl video sahnesiyse,
       burada da tamamı şema sahnesi. */
    interactiveArea.innerHTML = `
      <div class="wiring-hero" id="wiringHero" aria-label="Devre kurma şeması"></div>
      ${pinHaritasiHtml()}
      <div class="quiz-box" style="margin-top:14px;">
        <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-bolt"/></svg>Karta yükleyeceğin kod</strong>
        <p class="step-card-desc" style="margin-top:6px;">Bu kod LED'i bir saniye yakıp bir saniye söndürür.</p>
        ${kodOnizlemeHtml()}
        <button class="ai-prompt-btn" style="margin-top:10px;" onclick="LessonEngine.copyUserCode()"><svg class="icon"><use href="#icon-clipboard"/></svg>Kodu Kopyala</button>
      </div>
      ${yuklemeAdimlariHtml()}
      ${errorGalleryHtml()}`;
    mountMainWiring();
  } else if (currentStep === 5) {
    /* Arda: "1.2'de hangi kodu yükleyecek ve yine Arduino yükleme kısmı
       olması lazım" + "5. adımdaki 'kendi devrenle karşılaştır' saçma
       sapan, hiçbir şey anlaşılmıyor, onu da kaldır."

       Eskiden bu adımda çocuk hiç görmediği bir kodu kopyalayıp nereye
       koyacağını bilmeden ilerliyordu: kod ilk kez Adım 6'da açılıyor,
       Arduino IDE tarafı ise yalnızca Ders 1.1'in videolarında anlatılmış.
       Artık kod EKRANDA duruyor ve yükleme altı kısa maddede.
       Karşılaştırma kutusu kaldırıldı — yerini asıl iş aldı. */
    /* Kod ve Arduino adımları Adım 4'e taşındı (Arda: "5. adımda da LED
       kodunu ve Arduino IDE'de yükle kısmını kaldır"). Adım 4 YAPMA,
       Adım 5 KONTROL ETME adımı: burada tek soru var. */
    interactiveArea.innerHTML = `
      <div class="quiz-box">
        ${LessonEngine.ledCheckHtml()}
      </div>`;
    LessonEngine.restoreLedCheck();
  } else if (currentStep === 6) {
    interactiveArea.innerHTML = ohmCardHtml() + LessonEngine.clickToLearnHtml({
      extraButtonHtml: `<button class="ai-prompt-btn" style="margin-top:12px;" onclick="LessonEngine.copyUserCode()"><svg class="icon"><use href="#icon-clipboard"/></svg>Kodu Panoya Kopyala</button>`
    }) + `
      <div class="quiz-box" style="margin-top:14px;">
        <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-bolt"/></svg>SEN YAP</strong>
        <p class="step-card-desc" style="margin-top:6px;">Devren çalışıyor. Şimdi aşağıdaki 3 görevi kendi başına dene — cevabı sana söylemiyoruz, denemen ve gözlemlemen bekleniyor.</p>
        <ol style="margin:10px 0 0 18px; font-size:13px; color:var(--color-text-2); line-height:1.8;">
          ${lessonData.senYap.map(s => `<li>${s}</li>`).join('')}
        </ol>
      </div>`;
    LessonEngine.initAccordions(false);
  } else if (currentStep === 7) {
    LessonEngine.renderQuiz();
  } else if (currentStep === 8) {
    interactiveArea.innerHTML = `
      <div class="quiz-box">
        <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-robot"/></svg>AI Yoldaşına Sor</strong>
        <p class="step-card-desc" style="margin-top:8px;">Öğrendiklerini pekiştirmek için aşağıdaki <strong>AI Yoldaşına Sor</strong> butonuna bas ve Sokratik sorulardan birini seç: AI yardımcın burada, sana sorular sorarak cevaplar.</p>
        <div class="callout"><svg class="icon callout-icon"><use href="#icon-brain"/></svg><span>Hazır olduğunda <strong>İleri</strong> butonuyla rozetini almaya geç.</span></div>
      </div>`;
  } else if (currentStep === 9) {
    interactiveArea.innerHTML = `
      <div class="badge-card">
        <img class="badge-medal" src="assets/img/rozet/ders-1-2.webp" alt="" draggable="false">
        <h3 style="color: var(--color-primary);">İkinci Kıvılcım Rozeti</h3>
        <p style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">Deneyap Atölyem - Harici LED Devresi Modülünü Başarıyla Tamamladın!</p>
      </div>
      <a class="next-teaser" href="lesson-1-3.html" style="display:block; margin-top:14px; padding:14px 16px; border:2px dashed var(--color-primary); border-radius:var(--radius-md); text-decoration:none; color:inherit;">
        <strong>▶ Sıradaki: Ders 1.3 — LED'i Hızlandır</strong><br>
        Devren aynen kalıyor. LED'i hızlandırıp söndüğünü artık göremediğin hızı bulacaksın.
      </a>`;
    const firstTime = Store.get('badge_lesson_1_2') !== 'earned';
    Store.set('badge_lesson_1_2', 'earned');

    if (window.FX) {
      FX.awardOnce('l12_badge', 100, 'XP', document.querySelector('.badge-medal'));
      FX.celebrate({
        emoji: '🏅',
        nesne: 'rozet/ders-1-2',   // derse özel rozet (blender/ders-rozet.py)
        title: 'İkinci Kıvılcım Rozeti!',
        sub: firstTime
          ? 'Ders 1.2 tamamlandı — kendi devreni kurdun ve çalıştırdın!'
          : 'Rozetin cebinde. Modül 1 yolculuğun sürüyor!',
        confetti: 160,
        duration: 3800
      });
    } else {
      LessonEngine.burstConfetti();
    }
  }

  if (currentStep === 4 && wiring) highlightWiringLine(wiring.step());
  syncLeftPanel();
  syncUsbSahne();
}

/* Arda: "solda sürekli duran Deneyap ve laptop sadece 1 ve 3. adımlarda
   gelecek." Sahne Adım 1'de hedefi (kart + bilgisayar), Adım 3'te de
   parçaları tanıtırken işe yarıyor; geri kalan adımlarda ekranda yer
   kaplayıp ana içeriği daraltıyordu. Panel kapanınca sağ panel tüm
   genişliği alıyor — Adım 4'teki kurulum sahnesi de büyüyor. */
/* Ders 1.1'deki kablo sistemi burada da geçerli (Arda: "aynı sistem
   1.2'de de olsun"). Sahne Adım 3'ten itibaren kabloyu gösteriyor; fişin
   oturması ve gücün gelmesi çocuğun iki ucu da takmasına bağlı. */
/* Kablo takılıysa sahne HER adımda takılı görünür; takılı değilken
   kablo yalnızca Adım 3'ten itibaren sahnededir (orada tanıtılıyor).
   Ders 1.1 ile aynı kural — iki dersin sahnesi aynı mantığa bakıyor.
   Bkz. script.js'teki syncUsbSahne notu (Arda'nın bildirdiği tutarsızlık). */
/* syncUsbSahne / usbDurumDegisti iskeleti lesson-page.js'te (iki derste
   de harfi harfine aynıydı). Burada kalan, yalnızca Ders 1.2'ye özgü iş:
   kablo çıkınca devre de ölmeli — karta güç gitmiyorsa yüklenmiş kod
   çalışmıyor, LED yanıp sönemez; Adım 4 sahnesindeki kablo da takılı /
   takılı değil görünsün (Arda). */
function usbEkIs() {
  if (wiring && wiring.setPlugged) wiring.setPlugged(UsbLink.connected());
  if (wiring && wiring.setCodeUploaded) wiring.setCodeUploaded(kodYuklendi);
}

function syncLeftPanel() {
  const panel = document.getElementById('leftPanel');
  const kart = document.getElementById('layer-kart');
  if (!panel) return;
  const goster = (currentStep === 1 || currentStep === 3);
  panel.classList.toggle('is-off', !goster);

  /* ÖLÇÜLDÜ, tahmin değil: kart çizimi sayfada İKİ kez var (sol paneldeki
     sahne ve Adım 4'ün şeması) ve ikisi de aynı gradyan id'lerini
     (bsvg-pcb, bsvg-gold, bsvg-shield...) getiriyor. Belgede ilk gelen
     kazanıyor; o da sol paneldeki. Panel `display:none` olunca Chrome o
     gradyanları çözemiyor ve ŞEMADAKİ kart rengini kaybediyor — kırmızı
     PCB, altın pinler, hepsi soluyor (Arda: "deneyap kırmızı rengi yok").
     Çözüm: panel kapalıyken karttaki çizimi DOM'dan çıkar, şema kendi
     defs'ini kullansın. Panel açılınca aynı işaretleme geri konuyor. */
  if (kart && window.BoardSVG) {
    if (goster && !kart.innerHTML) kart.innerHTML = BoardSVG.groupMarkup({ ids: true });
    else if (!goster && kart.innerHTML) kart.innerHTML = '';
  }
}

/* ---- Kurulum şeması -------------------------------------------------
   Eskiden sol panelde küçük durup her adımda görünürdü. Artık TEK yeri
   var: Adım 4, ana içerik alanında büyük (spec §1). Widget burada bir
   kez mount edilir (DOM'a hiç eklenmeden, bellekte) ve Adım 4/5'e her
   girişte aynı örnek (wiring.element) ilgili konteynere taşınır — bu
   sayede çocuğun kurduğu devre adımlar arası gidip gelirken KORUNUR,
   her girişte sıfırlanmaz. */
function mountWiringDiagram() {
  if (!window.WiringDiagram) return;
  const host = document.createElement('div');
  /* Testler icin disa aciliyor: tiklanabilir adim seridi kaldirilinca
     (2026-09-22) suitelerin "su adima git" yolu kalmadi. UI'da programatik
     bir kisayol YOK - bu yalnizca olcum icin. */
  wiring = window.wiring = WiringDiagram.mount({
    container: host,
    steps: lessonData.wiringSteps,
    guide: lessonData.wiringGuide,
    /* Adım 4 rehberi, Adım 3'te tanıtılan parça kartlarını geri çağırır
       (Arda: "3. adımı da dikkate almalarını istiyorum"). Metin
       kopyalanmaz: veride yalnızca id var, cümleler buradan okunur. */
    partInfo: (id) => (window.PartsGallery ? PartsGallery.get(id) : null),
    onStepChange: function (index) {
      highlightWiringLine(index);
      // Kilit durumu (gates[4]) devre tamamlanınca değişir — noktaların/
      // "İleri" butonunun kilit görünümü tazelensin.
      LessonEngine.refreshGates();
    }
  });
}

// Adım 4/5'in ana alanındaki büyük şema kutusuna aynı wiring örneğini taşır.
function mountMainWiring() {
  if (!wiring) return;
  const host = document.getElementById('wiringHero');
  if (host && wiring.element.parentElement !== host) host.appendChild(wiring.element);
  heroYuksekligiAyarla();
}

/* Şema kutusunun yüksekliği CSS'te
   `clamp(470px, calc(100vh - var(--wd-ust)), 720px)`.
   --wd-ust = kutunun sayfa tepesine olan uzaklığı + alttaki sabit gezinme
   çubuğu + küçük bir pay. Neden elle 238px yazılmadı: o sayı üst bar
   (153px) + adım başlığı toplamı ve ders/ekran değiştikçe değişiyor;
   sabitlenirse bir gün sessizce yanlış olur. Ölçüm güvenli, çünkü kutunun
   KENDİ yüksekliği offsetTop'unu etkilemez — geri besleme döngüsü yok.

   Amaç (Arda, 2026-09-19): çocuk "İleri"ye basarken animasyonu da
   görsün. Önceden rehber kartı + adım şeridi + Geri/İleri çubuğu ekranın
   altında kalıyordu. */
function heroYuksekligiAyarla() {
  const hero = document.getElementById('wiringHero');
  if (!hero) return;
  let ust = 0, el = hero;
  while (el) { ust += el.offsetTop; el = el.offsetParent; }
  /* Sayfanın ALTINDA 48px'lik sabit gezinme çubuğu var (.bottom-nav,
     position:fixed). Yalnızca üstü düşmek yetmiyordu: ölçüldü, şemadaki
     "Taktım" çubuğu tam o barın ALTINDA kalıyor — ekranda ama görünmez
     oluyordu. Yükseklik dinamik ölçümden gelir, 48 elle yazılmaz. */
  const altNav = document.querySelector('.bottom-nav');
  const alt = altNav ? Math.round(altNav.getBoundingClientRect().height) : 0;
  /* Pay: kutunun alt kenarı gezinme çubuğuna yapışmasın. 12 iken
     1536x730'da sahne 302px kalıyordu — kendi koyduğumuz 300px
     tabanının yalnızca 2px üstünde. Çubuk tester için büyütülünce
     (48 -> 54) o pay tabanı deldi; çubuğun kendisi zaten görsel bir
     ayırıcı olduğu için pay 6'ya indirildi ve taban korundu. */
  hero.style.setProperty('--wd-ust', (ust + alt + 6) + 'px');
}

/* Pencere boyu değişince ölçü bayatlar (satır sayısı değişir, başlık
   iki satıra düşer). Tek dinleyici, adım 4/5 dışında zararsız. */
window.addEventListener('resize', heroYuksekligiAyarla);

/* Adım 4'teki metin listesi kaldırıldı (Arda'nın isteği): hangi adımda
   olunduğunu şemanın kendi adım şeridi gösteriyor. Bu fonksiyon dışarıdan
   çağrılmaya devam ediyor ama artık boyayacak bir liste yok — çağrıları
   tek tek ayıklamak yerine burada duruyor ki ileride bir liste geri
   gelirse tek yerden bağlansın. */
function highlightWiringLine(index) {
  const list = document.querySelectorAll('#interactiveArea .wiring-list li');
  if (!list.length) return;
  list.forEach(li => li.classList.toggle('is-active', Number(li.dataset.wire) === index));
}

/* Kod karta yüklendi mi? Site bunu göremez; en yakın gerçek sinyal
   çocuğun yükleme işini bitirip Adım 5'e geçmiş olması. Yapışkan:
   bir kez açılınca geri kapanmaz, yoksa Adım 4'e dönen çocuk kendi
   çalışan devresini sönmüş görürdü. */
let kodYuklendi = false;

function syncWiringToStep() {
  if (!wiring) return;
  if (currentStep >= 5) kodYuklendi = true;
  if (wiring.setCodeUploaded) wiring.setCodeUploaded(kodYuklendi);
  // "Hadi kuralım" yalnızca Adım 4'te (Bağlantı Adımları) anlamlı —
  // diğer adımlarda kurulacak bir devre ekranda yok.
  wiring.setGuideVisible(currentStep === 4);
  /* LED ancak kod yüklendikten sonra yanıp söner (Arda: "devre
     kurulumundan sonra Arduino açıp LED kodunu yazması lazım, onu
     yazdıktan sonra LED yanıp sönecek"). Sitenin karta erişimi yok; en
     yakın gerçek sinyal, çocuğun yükleme adımına (Adım 5) geçmiş olması.
     Bayrak YAPIŞKAN: bir kez yüklendikten sonra Adım 4'e geri dönünce
     devre canlı görünür, yoksa çocuk kendi çalışan devresini sönmüş
     görürdü. */
  if (wiring.setPlugged) wiring.setPlugged(UsbLink.connected());
  if (currentStep === 5) {
    // Adım 5 "Çalıştır ve Gözlemle": devre TAM görünmeli, çünkü çocuk
    // kendi kurduğu devreyle karşılaştırıyor ve LED kodla aynı ritimde
    // yanıp sönüyor. Gates[4] bu adıma çoktan devre tamamsa geçirdiği
    // için burada zaten son adımdayız — bu çağrı güvenlik ağı.
    wiring.setStep(WiringDiagram.STEP_COUNT - 1);
  }
}

function jumpWiring(index) {
  if (wiring) wiring.setStep(index);
}

/* Kurulum bitince ekranı kaydırmak artık bu dosyanın işi değil: odak
   katmanı (odak.js) sıradaki iş rahat görünmüyorsa oraya götürüyor —
   devre bitti → kod kutusu, kod kopyalandı → yükleme kutusu (Arda,
   2026-09-30: "site kendisi yönlendirecek", 1.3 ve 1.4 de aynı yoldan).
   2026-09-17'deki "animasyon bitince olduğu yerde kalsın" kararını bilerek
   çeviriyor: o gün kaydırma sürprizdi, bugün sıradaki kutu parlıyor ve
   kaydırmanın nereye ve neden olduğu ekranda belli.
   Kapalı kapıya toslayınca yuklemeKartinaGotur() ayrıca kaydırıyor. */

/* Kapı önce "LED'i yaktım" düğmesiydi, sonra GÖRME şartına çevrildi
   (kart ekranda göründüyse geç). İkisi de yetmedi — Arda: "scrollbar
   indi yine görmedi, geçmeye çalışıyor; geçmeyecek, Arduino kodunu
   yükleyecek, öyle 'uyguladım' diyecek. LED'in yanıp yanmaması önemli
   değil, çünkü hata var ama çocuk uyguladı; 5. adımda zaten soruyor."
   Yani kapı ne göze ne LED'e bakıyor: ÇOCUĞUN SÖZÜNE bakıyor. Aynı
   desen kablo kutularında ve "LED yandı mı?" sorusunda da var —
   site tezgahı göremez, tek kaynak çocuktur. */
let yuklemeUygulandi = false;

/* Kurulum animasyonu bitip ekran buraya kaydığında kutu kendini
   belli etsin; çocuk kaydırmanın NEDEN olduğunu görmeli. */
function yuklemeKartiVurgula() {
  const kart = document.getElementById('yuklemeKart');
  if (!kart) return false;
  kart.classList.remove('is-calling');
  void kart.offsetWidth;
  kart.classList.add('is-calling');
  clearTimeout(kart._vurguZaman);
  kart._vurguZaman = setTimeout(function () { kart.classList.remove('is-calling'); }, 1800);
  return true;
}

/* Adım 4'ün İLK şartı devrenin kendisi. Arda: "4. adımda devreyi
   tamamlamadan ilerleyemezsin diyor; onu dediğinde de devreyi kur kısmı
   vurgulansın." Gerekçe yükleme kutusundakiyle aynı: toast ekranın
   üstünde çıkıyor, şema sayfanın başka yerinde kalabiliyor — çocuk ne
   yapması gerektiğini okuyor ama nereye bakacağını bilmiyor. */
function devreyeGotur() {
  const hero = document.getElementById('wiringHero');
  if (!hero) return false;
  const yumusak = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  hero.scrollIntoView({ behavior: yumusak ? 'smooth' : 'auto', block: 'center' });
  /* Vurgu kaydırma BİTİNCE başlasın (kurulumIzlendi ile aynı gecikme):
     sahne yolun yarısındayken vuran halkanın ilk vuruşu ekran dışında
     kalıyor, çocuk sadece sönüşünü görüyor. */
  setTimeout(devreyiVurgula, yumusak ? 450 : 0);
  return true;
}

/* Sahne kutusu üç kez vurup susuyor (kablo kutusu ve yükleme kutusuyla
   AYNI dil: usbBoxCall). Üstüne şeritteki sıradaki adım da kendini bir
   kez gösteriyor: çocuk "nereye bakacağım" ile birlikte "hangi parça
   sırada" sorusunun da cevabını alsın. */
function devreyiVurgula() {
  const sahne = document.getElementById('wd-stage');
  if (!sahne) return false;
  sahne.classList.remove('is-calling');
  void sahne.offsetWidth;
  sahne.classList.add('is-calling');
  clearTimeout(sahne._vurguZaman);
  sahne._vurguZaman = setTimeout(function () { sahne.classList.remove('is-calling'); }, 1800);
  /* Şeritte .is-active = SON TAKILAN parça; çocuğun yapacağı bir
     sonrakidir, o yüzden step()+1. Boş tezgahta step() = -1, yani ilk
     çip. */
  const cipler = document.querySelectorAll('#wiringHero .wd-chip');
  const sirada = cipler[Math.min((wiring ? wiring.step() : -1) + 1, cipler.length - 1)];
  if (sirada && window.FX) { try { FX.pop(sirada, 1.18); } catch (e) {} }
  return true;
}

/* Kapalı kapıya takıldıysa: çocuğu kutunun yanına götür + vurgula. */
function yuklemeKartinaGotur() {
  const kart = document.getElementById('yuklemeKart');
  if (!kart) return false;
  const yumusak = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  kart.scrollIntoView({ behavior: yumusak ? 'smooth' : 'auto', block: 'center' });
  yuklemeKartiVurgula();
  return true;
}

function yuklemeyiUyguladim(btn) {
  yuklemeUygulandi = true;
  const kart = document.getElementById('yuklemeKart');
  if (kart) kart.classList.add('is-done');
  if (btn) {
    btn.classList.add('is-done');
    btn.disabled = true;
    btn.innerHTML = '<svg class="icon"><use href="#icon-check"/></svg>Uyguladım';
  }
  /* Ödül anı: adımın şartı tamamlandı (bkz. Kurallar.md — ses ödül
     anına saklanır, gezinme sessizdir). */
  if (window.FX) {
    try { FX.sound('unlock'); FX.pop(btn, 1.18); } catch (e) {}
  }
  LessonEngine.refreshGates();
  updateReadyGlow();
}

/* Adım 5'te ekranda duran kod. Kaynak, "Koda Tıkla" kartıyla AYNI dizi
   (LessonEngine.lessonCode) — ekranda gösterilen kod ile panoya kopyalanan
   kodun ayrışması imkânsız olsun diye. */
function kodOnizlemeHtml() {
  const kod = LessonEngine.lessonCode();
  const kacis = kod.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<pre class="kod-onizleme" aria-label="Karta yüklenecek kod"><code>${kacis}</code></pre>`;
}

/* Arduino IDE tarafı. Ders 1.1'de bu iş dört videoyla anlatılıyor
   (kurulum + yükleme); 1.2'de video yok, o yüzden yükleme burada altı
   kısa maddede duruyor. Maddeler kısa: bu bir kontrol listesi, ders
   değil — çocuk ekrandan çok Arduino penceresine bakacak. */
function yuklemeAdimlariHtml() {
  const adimlar = [
    'Arduino IDE\u2019yi aç, yeni dosyaya kodu yapıştır.',
    '<b>Araçlar &gt; Kart</b>: <b>Deneyap Mini v2</b>\u2019yi seç.',
    '<b>Araçlar &gt; Port</b>: listede görünen portu seç.',
    'Sol üstteki <b>\u2192 Yükle</b> düğmesine bas.'
  ];
  return `
    <div class="quiz-box${yuklemeUygulandi ? ' is-done' : ''}" id="yuklemeKart" style="margin-top:14px;">
      <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-wrench"/></svg>Arduino IDE\u2019de yükle</strong>
      <ol class="yukleme-adimlari">
        ${adimlar.map(a => `<li>${a}</li>`).join('')}
      </ol>
      <div class="callout" style="margin-top:10px;"><svg class="icon callout-icon"><use href="#icon-alert"/></svg><span>Bu adımları <strong>Ders 1.1\u2019de</strong> yapmıştın. Hatırlamıyorsan oraya dön — burada yalnızca kodu değiştirip yeniden yüklemen yeter.</span></div>
      <button type="button" class="ai-prompt-btn yukleme-onay" id="yuklemeOnayBtn"
              onclick="yuklemeyiUyguladim(this)"${yuklemeUygulandi ? ' disabled' : ''}>
        <svg class="icon"><use href="#icon-${yuklemeUygulandi ? 'check' : 'bolt'}"/></svg>${yuklemeUygulandi ? 'Uyguladım' : 'Yükledim, uyguladım'}
      </button>
      <p class="step-card-desc yukleme-onay-not">LED yanmasa bile bas — yanıp yanmadığına <strong>Adım 5</strong>\u2019te birlikte bakacağız.</p>
    </div>`;
}

/* Pin haritası: kartta "D5" diye bir yazı YOK — o pin MI olarak basılı.
   Çocuk "D5'i bul" deyince karta bakıp bulamıyordu, resmi diyagram bu
   yüzden dersin içinde duruyor. Kapalı başlar, merak eden açar. */
function pinHaritasiHtml() {
  return LessonEngine.pinMapHtml({
    id: 'pinMapBody',
    icon: 'icon-box',
    title: 'Pini kartta bulamıyor musun?',
    body: 'Kartın üzerinde <code>D5</code> yazmaz. O pinin yanında <strong>MI</strong> yazar — ikisi aynı pindir. Kodda <code>D5</code>, kartta <strong>MI</strong>.',
    alt: 'Deneyap Mini v2 genişletilmiş pin diyagramı: sol sırada A0-A7, DA0, DA1, D10, D9, GND, 3V3, 5V; sağ sırada EN, RX, TX, D2, D3, MO, MI, MC, SC, SD, 3V3, GND. MI pini Arduino tarafında D5, MO pini D4, MC pini D6 adıyla kullanılır.'
  });
}

/* Faz A: yaygın hata galerisi. Metin listesi değil, çizim — dört yanlış
   kurulum yan yana. Kapalı başlar ("Bende olmadı"), zafer anına engel
   koymaz: çocuk daha denemeden sorun giderme listesi görmez (spec §Faz A). */
/* "Bende olmadı" — LED yanmayınca açılan bölüm.
   ------------------------------------------------------------------
   Arda iki kez "kafa karıştırıcı" dedi. Önceki hâli bir GALERİydi:
   dört yanlış çizim yan yana, üstlerinde kırmızı çarpı, başlık
   "Seninki hangisine benziyor?". Sorun şuydu: LED'i yanmayan çocuk
   zaten hangi hatayı yaptığını BİLMİYOR — dört yanlış resme bakıp
   kendi tezgahını teşhis etmesi isteniyordu. Bu, çocuktan cevabı
   baştan bilmesini istemek demek.

   Yeni hâli SIRALI KONTROL LİSTESİ: dört madde, en sık yapılandan
   başlayarak. Her maddede DOĞRU çizim var ve tek bir soru: "seninki
   böyle mi?" Çocuk teşhis etmiyor, sadece karşılaştırıyor.
   Yanlış hâli merak eden için tek dokunuş uzakta (derinlik isteğe
   bağlı açılır — bkz. Kurallar.md), varsayılan olarak ekranda değil. */
function errorGalleryHtml() {
  if (!window.WiringDiagram || !WiringDiagram.ERROR_ITEMS) return '';
  const items = WiringDiagram.ERROR_ITEMS;
  return `
    <div class="quiz-box error-gallery">
      <button type="button" class="pin-map-toggle" aria-expanded="false" aria-controls="errorGalleryBody"
              onclick="toggleErrorGallery(this)">
        <span style="display:flex; align-items:center; gap:8px;">
          <svg class="icon"><use href="#icon-search"/></svg><strong>LED yanmadı mı?</strong>
        </span>
        <span class="pin-map-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="pin-map-body" id="errorGalleryBody" hidden>
        <p class="step-card-desc">Dördünü sırayla kontrol et. Tezgahın her maddede aşağıdaki gibi olmalı.</p>
        <ol class="err-list">
          ${items.map((it, i) => `
            <li class="err-item">
              <div class="err-head"><span class="err-no">${i + 1}</span>
                <span class="err-title">${it.check}</span></div>
              <div class="err-pic" id="errPic${i}">${it.correct}</div>
              <p class="err-fix">${it.fix}</p>
              <button type="button" class="err-toggle" aria-pressed="false"
                      onclick="toggleErrorWrong(this, ${i})">Yanlışı göster</button>
            </li>`).join('')}
        </ol>
      </div>
    </div>`;
}

function toggleErrorGallery(btn) {
  const body = document.getElementById('errorGalleryBody');
  if (!body) return;
  const acik = !body.hidden;
  body.hidden = acik;
  btn.setAttribute('aria-expanded', String(!acik));
  btn.classList.toggle('is-open', !acik);
  if (!acik && window.FX) { try { FX.sound('step'); } catch (e) {} }
}

/* Aynı maddenin yanlış/doğru hâli arasında gidip gelir. Ekranda hep TEK
   çizim durur: iki resmi yan yana koymak, "hangisi benimki" sorusunu
   geri getiriyordu. */
function toggleErrorWrong(btn, index) {
  const it = WiringDiagram.ERROR_ITEMS[index];
  const kutu = document.getElementById('errPic' + index);
  if (!it || !kutu) return;
  const yanlis = btn.getAttribute('aria-pressed') === 'true';
  kutu.innerHTML = yanlis ? it.correct : it.wrong;
  kutu.classList.toggle('is-wrong', !yanlis);
  btn.setAttribute('aria-pressed', String(!yanlis));
  btn.textContent = yanlis ? 'Yanlışı göster' : 'Doğrusunu göster';
}

/* Devre kurma videosu. Dosyanin VAR OLUP OLMADIGI veriden okunur
   (lessonData.wiringVideo); tarayiciya sordurmak yanlis yoldu — olmayan
   dosyayi <video src> ile yoklamak konsola 404 dusuruyor ve "sayfa
   hatasi yok" kontrolunu hakli olarak kizartiyor. Video cekilince
   assets/data/lesson-1-2.js icindeki wiringVideo alani doldurulacak. */
function kurulumVideosuHtml() {
  const v = lessonData.wiringVideo;
  if (!v || !v.src) return '';
  const poster = v.poster ? ` poster="${v.poster}"` : '';
  return `
    <div class="quiz-box">
      <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-bolt"/></svg>${v.title || 'Kurulum Videosu'}</strong>
      <p class="step-card-desc" style="margin-top:8px;">${v.desc || "Devreyi adım adım kurarken izle, sonra kendi breadboard'unda aynısını yap."}</p>
      <video class="kurulum-video" controls preload="none"${poster}>
        <source src="${v.src}" type="video/mp4">
      </video>
    </div>`;
}

function ohmCardHtml() {
  return `
    <div class="math-card">
      <div><strong>Ohm Kanunu ile Örnek Hesap:</strong></div>
      <div><em>V</em> = <em>I</em> × <em>R</em></div>
      <div>Kart 3.3V verirse ve direnç 220Ω ise, LED üzerinden geçen yaklaşık akım: <em>I</em> = 3.3 ÷ 220 ≈ <strong>15 mA</strong></div>
      <div style="margin-top:6px; font-size:11px; color:var(--color-text-muted);">Bu hesap board'un mantık gerilimine (3.3V) ve devredeki direnç değerine (220Ω) bağlıdır — farklı bir kartta gerilim farklıysa aynı akım için direnç değeri de değişir.</div>
    </div>`;
}

// Kilitli adımda şart yerine gelince "İleri" butonu nefes alsın (fx.css).
/* "İleri" parıltısının iskeleti lesson-page.js'te; burada yalnızca BU
   dersin şartları duruyor. */
const READY_WHEN = {
  2: () => LessonEngine.materialsReadyFlag,
  3: () => UsbLink.connected(),
  /* Adim 4: devre bitti + kod yuklendi. Iki sart da saglaninca "Ileri"
     nefes almaya basliyor; cocuk kapinin acildigini gormeden once
     dugmeye basip uyari yemesin. */
  4: () => UsbLink.connected() && yuklemeUygulandi && !!(wiring && wiring.isBuilt()),
  7: () => LessonEngine.quizPassed
};

// Kilit kontrolleri ve ortak adım DOM'u (başlık, açıklama, sayaç,
// ilerleme çubuğu, noktalar, XP) lesson-engine.js'te; inline onclick'in
// çağırdığı changeStep/showToast/closeModal sarmalayıcıları
// lesson-page.js'te. Burada sadece Ders 1.2'ye özgü DOM kalır.

function onStepChange(step, prevStep) {
  currentStep = step;

  /* Ortak adım DOM'u (step1-hero + #codeContainer) lesson-page.js'te.
     Kod kartları ("Pin Tanımlama", "Çıkış Modu & Yakma") HTML'de duruyordu
     ama hiçbir adımda görünmüyordu: .steps-cards-container CSS'te
     display:none, burada da her adımda tekrar none yapılıyordu, hiçbir
     yerde flex'e çekilmiyordu. Kartların yeri Ders 1.1'deki gibi
     "kodu keşfet" adımı — Ders 1.2'de 5 ile 6 yer değiştikten sonra Adım 6. */
  LessonPage.paintStepDom();

  syncWiringToStep();
  renderStepContent();

  /* Adım 4'e GİRERKEN sayfa başa döner. Arda: "3. adımdan 4. adıma
     geçtikten sonra devreyi görmek istiyorum."
     Ölçüldü (1536x730): Adım 3'te çocuk kablo uçlarını işaretlemek için
     aşağı kayıyor; Adım 4'e geçince o konum korunuyordu (scrollY 400) ve
     sahnenin tepesi ekranın 209px YUKARISINDA kalıyordu — kutu görünüyor
     ama kesik. Sahne 19 Eylül'de "sayfa en üstteyken sığsın" diye
     ölçülmüştü (`--wd-ust` = üst bar + alt gezinme çubuğu); o tasarım
     yalnızca scrollY=0'da geçerli, yani düzeltme sahneyi küçültmek değil
     sayfayı başa almak.
     Yalnızca adıma GİRİŞTE: çocuk Adım 4'te kendi kaydırırsa geri
     çekilmiyor. `devreyeGotur()` ayrı bir yol — o, kapı ilerlemeyi
     engellediğinde vurguyla birlikte çalışıyor. */
  if (currentStep === 4 && prevStep !== 4) basaDon();
}

function basaDon() {
  const yumusak = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hedef = document.scrollingElement || document.documentElement;
  hedef.scrollTo({ top: 0, behavior: yumusak ? 'smooth' : 'auto' });
}

// Veri assets/data/lesson-1-2.js'ten <script> ile senkron yükleniyor
// (fetch() DEĞİL — dosyayı sunucusuz, çift tıklayıp file:// ile açınca da
// çalışsın istiyoruz; fetch() file:// altında sessizce başarısız olur).
(function initLesson12() {
  lessonData = window.LESSON_DATA_1_2;

  /* Adım 4'te sayfa ÖNCE "Kodu Kopyala"ya, kopyalanınca "Yükledim"e gider —
     her ziyarette (Arda, 2026-09-30: "ilk önce kodu kopyala sonra yükle").
     Eskiden kod bir kez kopyalandıysa (kalıcı XP kaydı) bu adım atlanıyor,
     odak doğrudan Yükledim'e atlıyordu; dersi tekrar eden bunu görüyordu. */
  LessonEngine.init({
    // Son adımda İleri → sıradaki ders (lesson-engine.js changeStep).
    nextLesson: { href: 'lesson-1-3.html', label: "Sıradaki derse geç: Ders 1.3" },
    xpPrefix: lessonData.xpPrefix,
    /* Kaldığın yerden devam (lesson-engine devam_v1): önceki oturumda geçilen
       adımların sahnesi geri kurulur — kablo takılı, devre kurulu, kod yüklü. */
    devamHazirla: function (enIleri) {
      if (enIleri > 3) UsbLink.geriYukle();
      if (enIleri > 4) { if (wiring) wiring.setStep(WiringDiagram.STEP_COUNT - 1); yuklemeUygulandi = true; }
    },
    quizStorageKey: lessonData.quizStorageKey,
    materials: lessonData.materials,
    ctlLines: lessonData.ctlLines,
    hataSahneleri: ['reversed', 'short', 'noresistor', 'wrongpin'],   // "olmadı" deyince hata kartları
    stepsData: lessonData.stepsData,
    totalSteps: 9,
    quizQuestions: lessonData.quizQuestions,
    aiPrompts: lessonData.aiPrompts,
    quizCelebrateSub: lessonData.quizCelebrateSub,
    ledCheck: lessonData.ledCheck,
    helpPrompt: lessonData.helpPrompt,
    /* Yol gösterme (assets/js/odak.js): sira = sırayla açılan zorunlu
       işler, rehber = sırayla parlayan keşif, daha = "Daha fazlası". */
    odak: {
      3: {
        sira: [{ s: '#usbTak', bitti: '.is-on' }],
        rehber: ['.pg-more']
      },
      // Devre → kod → yükle. Kod kutusu devre bitmeden görünmez.
      4: {
        sira: [
          { s: '#wd-guide, #wd-done', bitti: () => !!(wiring && wiring.isBuilt()) },
          { s: '#interactiveArea .ai-prompt-btn:not(.yukleme-onay)', kutu: '.quiz-box' },
          { s: '#yuklemeOnayBtn', kutu: '#yuklemeKart', bitti: '[disabled]' }
        ],
        daha: ['.pin-map', '.error-gallery', '#wd-prev', '#wd-next']
      },
      6: {
        rehber: ['.ctl-line'],
        daha: ['[data-step-card]', '#interactiveArea .ai-prompt-btn', '.pin-map']
      }
    },
    // Kapılar: bir adımdan İLERİ çıkmak için sağlanması gereken şart.
    gates: {
      2: () => LessonEngine.materialsReadyFlag ||
           "Önce malzemelerini hazırlayıp 'Malzemeleri Hazırladım!' butonuna basmalısın!",
      // Beş kurulum adımının (kart, LED, D5 kablosu, direnç, GND kablosu) beşi
      // de yerine gelmeden İleri açılmaz — spec §1 madde 4, Ders 1.1'deki
      // video kilidinin (video-player.js, "Sonraki" ended'e kadar disabled)
      // birebir karşılığı: burada da aynı gates{} mekanizması kullanılıyor,
      // yeni bir kilit icat edilmedi.
      /* Arda: "3. adımdan itibaren port takılı değilse diğer adıma
         geçemesin." Kablo şartı Adım 3'ten sonuna kadar her adımda
         geçerli; adımın kendi şartı ondan sonra bakılır. */
      3: () => UsbLink.connected() || UsbLink.gateMessage(),
      4: () => {
        if (!UsbLink.connected()) return UsbLink.gateMessage();
        if (!(wiring && wiring.isBuilt()))
          return "Devreyi tamamlamadan ilerleyemezsin! Beş adımı da bitir.";
        /* Arda: "illa o Arduino kod yükleme kısmını görmesi lazım."
           Devreyi kurmak yetmez — kodu nasıl yükleyeceğini görmeden
           Adım 5'teki "LED yandı mı?" sorusunun bir anlamı yok. */
        if (!yuklemeUygulandi)
          return "Kodu Arduino IDE'de karta yükle, sonra aşağıdaki <strong>Uyguladım</strong> düğmesine bas. LED yanmasa da olur — ona Adım 5'te bakacağız.";
        return true;
      },
      5: () => UsbLink.connected() || UsbLink.gateMessage(),
      6: () => UsbLink.connected() || UsbLink.gateMessage(),
      7: () => !UsbLink.connected() ? UsbLink.gateMessage()
           : (LessonEngine.quizPassed || "Lütfen önce mini sınavı doğru cevaplayın!"),
      8: () => UsbLink.connected() || UsbLink.gateMessage(),
    },
      /* Kapı kapandığında: sebep kablo ise çocuğu kablo kutusuna
         kaydır ve "kartı bul" düğmesini parlat (Arda: "usb takmadan
         geçmeye çalışınca oto scroll kabloyu tak kısmına gitsin").
         Diğer kapılar kendi bölümlerinin yanında zaten duruyor. */
      onBlocked: function (adim) {
        if (window.UsbLink && !UsbLink.connected()) { UsbLink.focusGate(); return; }
        if (adim !== 4) return;
        /* Adım 4'ün iki şartı var ve kapı mesajı hangisiyse çocuk ORAYA
           götürülüyor: önce devre, sonra kod yükleme. Sıra gates[4] ile
           birebir aynı, yoksa mesaj bir yeri gösterip ekran başka yere
           kayar. */
        if (!(wiring && wiring.isBuilt())) {
          devreyeGotur();
          return;
        }
        /* Kutu ekranin altinda kaliyor, cocuk uyariyi okuyup nereye
           bakacagini bilemiyordu. */
        if (!yuklemeUygulandi) yuklemeKartinaGotur();
      },
    onStepChange: onStepChange,
    onReadyGlowChange: updateReadyGlow,
  });

  // Sol paneldeki ortak kart sahnesi (Ders 1.1 ile aynı desen). rings/hotspots
  // burada anlamsız (o seçenekler yalnızca wiring şemasının kendi kartı ve
  // 1.1'in Adım 3 keşfi için) — sadece ids:true, kart bağlıyken PWR ledi ve
  // veri akışı topu çalışsın diye.
  const leftKart = document.getElementById('layer-kart');
  if (leftKart && window.BoardSVG) leftKart.innerHTML = BoardSVG.groupMarkup({ ids: true });

  // İlk adımın boyanması, adım noktalarının bağlanması ve kilit görünümü
  // LessonEngine.start() içinde.
  /* "Ileri" sarti saglanmadan GORUNMEZ. 4: devre + kod yuklendi,
   7: mini sinav. USB kapisi bilerek disarida - orada dugmeye BASMAK
   gerekiyor, yoksa "kabloyu tak" yardimi hic tetiklenmiyor. */
LessonPage.setup({
  readyWhen: READY_WHEN,
  onUsbChange: usbEkIs
});
  mountWiringDiagram();

  LessonEngine.start();

  const leftToggle = document.getElementById('leftPanelToggle');
  const leftPanel = document.getElementById('leftPanel');
  if (leftToggle && leftPanel) {
    leftToggle.addEventListener('click', () => {
      const collapsed = leftPanel.classList.toggle('collapsed');
      leftToggle.setAttribute('aria-expanded', String(!collapsed));
      const label = leftToggle.querySelector('.panel-toggle-label');
      if (label) label.textContent = collapsed ? 'Büyüt' : 'Küçült';
    });
  }
})();
