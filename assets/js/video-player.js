/* ============================================================
   ADIM 4 — VİDEO PLAYER MODÜLÜ
   ============================================================
   Ders 1.1 IDE Kurulum Sihirbazı için bağımsız modül.
   Eski fake-cursor/IDE DOM simülasyonunun yerini alır.

   KULLANIM:
   - <script src="assets/js/video-player.js"></script> script.js'ten SONRA yüklenir
   - <link rel="stylesheet" href="assets/css/video-player.css"> head'de
   - Videolar videos/ klasörüne step01.mp4 ... stepNN.mp4 olarak bırakılır
   - changeStep() currentStep === 4 olduğunda #ideSimWrapper'a .show class'ı ekler
   - Son video bittiğinde window.simComplete = true yapar (mevcut davranışla uyumlu)
   ============================================================ */

(function () {
  'use strict';

  // === VİDEO LİSTESİ ============================================
  // Arda videoları bu sırayla videos/ klasörüne bırakacak.
  // src boş olanlar placeholder'da gösterilir, atlanmaz.
  // ===============================================================
  /* Motion design sahnesi (kurulum-sahne.js, 2026-10-05) yüklüyse ekran
     kayıtları yerine o oynar; script satırı kaldırılınca mp4'lere döner. */
  const SAHNE = !!window.KurulumSahne;
  const STEPS = [
    { src: 'videos/adım1.mp4', poster: 'videos/posters/adım1.jpg', title: "Arduino İndir butonuna tıklayıp kurulum dosyasını indiriyoruz ve programı kuruyoruz" },
    { src: 'videos/adım2.mp4', poster: 'videos/posters/adım2.jpg', title: "Kart Yöneticisi adresi otomatik kopyalandı. Tercihler'de dili Türkçe yapıp adresi yapıştırıyoruz" },
    { src: 'videos/adım3.mp4', poster: 'videos/posters/adım3.jpg', title: "Kart Yöneticisi'nden 'deneyap' paketini kurup Deneyap Mini v2'yi kart olarak seçiyoruz" },
    { src: 'videos/adım4.mp4', poster: 'videos/posters/adım4.jpg', title: "Kodu karta yapıştırıp yüklüyoruz. Kodunuz otomatik kopyalandı." },
  ];
  if (SAHNE) STEPS.forEach((st, i) => { st.src = 'sahne:' + KurulumSahne.adlar[i]; st.poster = ''; });
  // ===============================================================

  const wrapper = document.getElementById('ideSimWrapper');
  if (!wrapper) {
    console.warn('[video-player] #ideSimWrapper bulunamadı, modül yüklenmedi.');
    return;
  }

  // === PLAYER UI İNŞA ET ========================================
  wrapper.innerHTML = `
    <div class="vp-stage">
      <!-- Videolarda ses kanalı YOK (ffprobe: soun/mp4a bulunmuyor), ekran kaydı +
           göme altyazı. muted bu yüzden bilinçli ve zararsız; ses kontrolü eklemek
           anlamsız olurdu. -->
      ${SAHNE ? '<div class="vp-video" role="img" aria-label="Kurulum adımlarını gösteren animasyon"></div>' : '<video class="vp-video" preload="metadata" playsinline muted></video>'}
      <div class="vp-placeholder">
        <svg class="icon vp-placeholder-icon" viewBox="0 0 24 24"><use href="#icon-film"/></svg>
        <div class="vp-placeholder-title">Videolar Henüz Yüklenmedi</div>
        <div class="vp-placeholder-desc">
          Bu adımdaki ekran kayıtları Arda tarafından <code>videos/</code> klasörüne eklenecek.
        </div>
        <div class="vp-progress-row">
          <span class="vp-missing-count">0</span> / <span class="vp-total-count">${STEPS.length}</span> video hazır
        </div>
        <div class="vp-progress-track"><div class="vp-progress-fill"></div></div>
      </div>
      <!-- Ortadaki büyük oynat düğmesi kalktı (Arda, 2026-10-06: "dondurunca
           gözükmüyor"; düğme takılan kareyi kapatıyordu). Durduğu yine "bir tık
           belli olsun": köşede küçük "Durdu" etiketi + hafif karartma
           (video-player.css .vp-durdu). Başlamak için sarı "Video Oynat" parlar. -->
      <div class="vp-durdu" aria-hidden="true"><svg viewBox="0 0 12 12"><rect x="2" y="1.5" width="2.8" height="9" rx="0.8" fill="currentColor"/><rect x="7.2" y="1.5" width="2.8" height="9" rx="0.8" fill="currentColor"/></svg>Durdu</div>
      <button type="button" class="vp-next-hint" data-vp="next-hint">
        <span class="vp-next-hint-icon"><img class="fx-ikon" src="assets/img/fx/fx-tik.webp" alt="" aria-hidden="true" draggable="false"></span>
        <span class="vp-next-hint-text"></span>
        <span class="vp-next-hint-arrow">▶</span>
      </button>
      <button type="button" class="vp-fullscreen-btn" data-vp="fullscreen" title="Videoyu büyüt">
        <svg class="icon" data-vp="fullscreen-icon"><use href="#icon-expand"/></svg>
      </button>
    </div>

    <div class="vp-seek">
      <span class="vp-seek-time" data-vp="seek-current">0:00</span>
      <input type="range" class="vp-seek-range" data-vp="seek" min="0" max="100" step="0.1" value="0">
      <span class="vp-seek-time" data-vp="seek-duration">0:00</span>
    </div>

    <div class="vp-caption">
      <span class="vp-caption-badge"></span>
      <span class="vp-caption-text"></span>
    </div>

    <div class="vp-toolbar">
      <button class="vp-btn" data-vp="prev" title="Önceki adım">◀ Önceki</button>
      <button class="vp-btn" data-vp="back5" title="5 saniye geri sar">⏪ 5sn</button>
      <button class="vp-btn vp-btn-pill" data-vp="play" title="Videoyu oynat/durdur"><span class="vp-btn-icon" data-vp="playpause-icon">▶</span><span data-vp="playpause-label">Video Oynat</span></button>
      <button class="vp-btn" data-vp="fwd5" title="5 saniye ileri sar">5sn ⏩</button>
      <button class="vp-btn" data-vp="replay" title="Videoyu başa sar"><svg class="icon"><use href="#icon-repeat"/></svg>Tekrar İzle</button>
      <button class="vp-btn" data-vp="next" title="Sonraki adım">Sonraki ▶</button>
      <button class="vp-btn" data-vp="board-url" title="Deneyap Kart Yöneticisi URL'sini kopyala"><svg class="icon"><use href="#icon-clipboard"/></svg>Kart Yöneticisi URL</button>
      <span class="vp-counter">Adım 0 / ${STEPS.length}</span>
    </div>
  `;

  const video = wrapper.querySelector('.vp-video');
  if (SAHNE) KurulumSahne.bagla(video);
  const placeholder = wrapper.querySelector('.vp-placeholder');
  const captionBadge = wrapper.querySelector('.vp-caption-badge');
  const captionText = wrapper.querySelector('.vp-caption-text');
  const counter = wrapper.querySelector('.vp-counter');
  const progressFill = wrapper.querySelector('.vp-progress-fill');
  const missingCount = wrapper.querySelector('.vp-missing-count');
  const totalCount = wrapper.querySelector('.vp-total-count');
  const btnPrev = wrapper.querySelector('[data-vp="prev"]');
  const btnReplay = wrapper.querySelector('[data-vp="replay"]');
  const btnNext = wrapper.querySelector('[data-vp="next"]');
  const btnPlay = wrapper.querySelector('[data-vp="play"]');
  const btnBoardUrl = wrapper.querySelector('[data-vp="board-url"]');
  const btnBack5 = wrapper.querySelector('[data-vp="back5"]');
  const btnFwd5 = wrapper.querySelector('[data-vp="fwd5"]');
  const btnFullscreen = wrapper.querySelector('[data-vp="fullscreen"]');
  const fullscreenIconUse = wrapper.querySelector('[data-vp="fullscreen-icon"] use');
  const nextHint = wrapper.querySelector('.vp-next-hint');
  const nextHintText = wrapper.querySelector('.vp-next-hint-text');
  const seekRange = wrapper.querySelector('[data-vp="seek"]');
  const seekCurrent = wrapper.querySelector('[data-vp="seek-current"]');
  const seekDuration = wrapper.querySelector('[data-vp="seek-duration"]');
  const BOARD_MANAGER_URL = 'https://raw.githubusercontent.com/deneyapkart/deneyapkart-arduino-core/master/package_deneyapkart_index.json';

  let index = 0;
  let completedSteps = new Set();

  function updateCounter() {
    counter.textContent = `Adım ${index + 1} / ${STEPS.length}`;
  }

  function updateButtons() {
    // Hangi videodayız: "Kart Yöneticisi URL" yalnızca onun anlatıldığı
    // 2. videoda görünür (odak.css) — diğerlerinde basılacak bir şey değil.
    wrapper.dataset.vpIndex = String(index);
    btnPrev.disabled = index === 0;
    btnNext.disabled = index === STEPS.length - 1 || !completedSteps.has(index);
  }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function setTitle(text) {
    captionBadge.textContent = index + 1;
    captionText.textContent = text || '';
    /* Altyazı bir videoda tek, diğerinde iki satır olabiliyor (başlıklar
       farklı uzunlukta) — sahnenin dikey bütçesi o satırdan artan/eksilen
       yeri kullanmalı. Ölçü satır sayısına bakmıyor, sonucu ölçüyor;
       bu yüzden yazıyı DEĞİŞTİRDİKTEN sonra tazeleniyor. */
    sahneOlcuTazele();
  }

  // Son video bitince başlık "İşlem tamam! Dahili LED yanıp sönüyor."
  // olarak değişiyor (bkz. 'ended' olayı). Öğrenci "Tekrar İzle"ye
  // bastığında o bitiş yazısı ekranda kalıyor ve 5. adımın kendi
  // açıklaması ("Deneyap Mini v2'yi seçip kodu karta yüklüyoruz...")
  // bir daha hiç görünmüyordu. Oynatma yeniden başlarken adımın
  // kendi başlığı geri konur.
  function restoreStepTitle() {
    const step = STEPS[index];
    setTitle(step ? step.title : '');
  }

  function showPlaceholder() {
    placeholder.classList.add('show');
    video.style.display = 'none';
  }

  function hidePlaceholder() {
    placeholder.classList.remove('show');
    video.style.display = 'block';
  }

  // file:// altında fetch HEAD her zaman başarısız oluyor (CORS), oysa
  // <video> aynı dosyayı sorunsuz oynatıyordu — sayaç "0 / 4 video hazır"
  // diyip öğrenciyi yanıltıyordu. Sunucusuz açılışta yoklamayı atlıyoruz.
  const CAN_PROBE = location.protocol !== 'file:';

  function checkAvailability(src) {
    if (!src) return Promise.resolve(false);
    if (src.indexOf('sahne:') === 0) return Promise.resolve(true);
    if (!CAN_PROBE) return Promise.resolve(true);
    return fetch(src, { method: 'HEAD' })
      .then(r => r.ok)
      .catch(() => false);
  }

  function probeAll() {
    const promises = STEPS.map(step => checkAvailability(step.src));
    return Promise.all(promises).then(results => {
      const readyCount = results.filter(Boolean).length;
      missingCount.textContent = readyCount;
      totalCount.textContent = STEPS.length;
      if (progressFill) progressFill.style.width = (readyCount / STEPS.length * 100) + '%';
    });
  }

  function loadStep(i, autoPlay) {
    index = Math.max(0, Math.min(i, STEPS.length - 1));
    const step = STEPS[index];
    updateCounter();
    updateButtons();
    setTitle(step ? step.title : '');
    btnNext.classList.remove('vp-btn-pulse');
    nextHint.classList.remove('show');
    wrapper.classList.remove('vp-bitti');
    setPlayPauseUI(false);
    if (seekRange) { seekRange.value = 0; seekRange.style.setProperty('--vp-seek-pct', '0%'); }
    if (seekCurrent) seekCurrent.textContent = '0:00';
    if (seekDuration) seekDuration.textContent = '0:00';

    if (!step || !step.src) {
      showPlaceholder();
      return;
    }

    // Son videoya gelince kod otomatik panoya. Kod tek kaynaktan
    // (LessonEngine.lessonCode = 'Koda Tıkla' satırları) gelir ve
    // kopyalama file:// altında da çalışsın diye motorun fallback'li
    // yolunu kullanır — eskiden clipboard reddedilince sessizce kaybediliyordu.
    if (index === STEPS.length - 1 && window.LessonEngine) {
      LessonEngine.copyText(LessonEngine.lessonCode()).then((res) => {
        if (res === true && window.showToast) {
          window.showToast('LED kodu otomatik olarak panoya kopyalandı! Kopyalanan kodu eskize yapıştırın ve Deneyap Kart\'a yükleyin.', undefined, 6000);
        }
      });
    }

    /* 2. videoda Kart Yöneticisi adresi de kendiliğinden panoya gider
       (Arda, 2026-10-05: "2. adıma gelince oto kopyalasın ve belirtsin").
       Düğme yedek olarak kalıyor: pano reddedilirse ya da öğrenci bu
       arada başka bir şey kopyalarsa tekrar basar. Toast yalnızca
       gerçekten kopyalandıysa çıkar (kod kopyalamasıyla aynı kural). */
    if (index === 1 && window.LessonEngine) {
      LessonEngine.copyText(BOARD_MANAGER_URL).then((res) => {
        if (res === true && window.showToast) {
          window.showToast('Kart Yöneticisi adresi otomatik olarak panoya kopyalandı! Tercihler’deki kutuya yapıştır.', undefined, 6000);
        }
      });
    }

    video.poster = step.poster || '';
    video.src = step.src;
    video.load();
    /* Video kendiliğinden oynamaz: sayfa ilk açılınca ve ders adımı
       sıfırlanınca (resetIdeSim) başlamaz, Arda'nın isteği (2026-09-20).
       AMA öğrenci "Sonraki"ye basıp bir sonraki videoya GEÇTİĞİNDE oynar
       (2026-09-21, Arda: "diğer video geçince oynatmıyor, oynat tuşuna
       basmak zorunda kalıyorum"). Ayrım niyette: sayfanın kendiliğinden
       başlatması istenmiyordu, öğrencinin "sıradakini göster" demesi zaten
       oynatma isteği — iki kez tıklatmak boşuna.
       play() tıklamanın kendi görev adımında çağrılıyor, yani tarayıcının
       otomatik oynatma kısıtı devreye girmiyor; yine de reddedilirse
       sessizce düğmeye düşülür (UI zaten "Video Oynat"ta duruyor). */
    if (autoPlay) {
      var oynat = video.play();
      if (oynat && oynat.catch) oynat.catch(function () {});
    }
  }

  const playPauseIcon = wrapper.querySelector('[data-vp="playpause-icon"]');
  const playPauseLabel = wrapper.querySelector('[data-vp="playpause-label"]');

  function setPlayPauseUI(isPlaying) {
    // "Durdu" etiketi yalnız bir kez oynamış ve şimdi duran videoda (video-player.css).
    wrapper.classList.toggle('vp-oynuyor', !!isPlaying);
    if (isPlaying) wrapper.classList.add('vp-basladi');
    if (isPlaying) wrapper.classList.remove('vp-bitti');
    if (playPauseIcon) playPauseIcon.textContent = isPlaying ? '⏸' : '▶';
    if (playPauseLabel) playPauseLabel.textContent = isPlaying ? 'Videoyu Durdur' : 'Video Oynat';
  }

  // Arduino İndir butonu, öğrenci "Video Oynat" butonuna GERÇEKTEN basana
  // kadar kilitli kalır (script.js'teki paylaşılan arduinoDownloadUnlocked
  // flag'i). Video modülü sayfa yüklenir yüklenmez ilk videoyu otomatik
  // oynattığı için (bkz. probeAll().then(() => loadStep(0, true)) aşağıda)
  // kilit video'nun 'playing' olayına DEĞİL, doğrudan bu butona tıklanma
  // olayına bağlanmalı — yoksa öğrenci hiç tıklamadan buton açılıveriyordu.
  function unlockArduinoDownload() {
    if (typeof arduinoDownloadUnlocked === 'undefined' || arduinoDownloadUnlocked) return;
    arduinoDownloadUnlocked = true;
    const dlBtn = document.getElementById('arduinoDownloadBtn');
    if (dlBtn) {
      dlBtn.classList.remove('is-disabled');
      dlBtn.removeAttribute('aria-disabled');
      // Kilit açıldığı an görülsün: buton bir kez zıplar ve altın kıvılcım saçar.
      if (window.FX) {
        FX.unlocked(dlBtn, { flash: false });
        if (window.showToast) window.showToast('Kilit açıldı! Artık Arduino IDE\'yi indirebilirsin.');
      }
    }
  }

  btnPrev.addEventListener('click', () => loadStep(index - 1, true));

  /* Oynat/durdur TEK yerde duruyor, çünkü iki giriş yolu var: alttaki
     "Video Oynat" düğmesi ve videonun kendi ekranı. Çocuk önce ekrana
     basıyor — her oynatıcıda öyle çalışıyor — ve hiçbir şey olmayınca
     video bozuk sanıyordu. Düğme kalkmadı: ekrana basmayı denemeyen
     çocuk için görünür giriş yolu o. */
  function togglePlayback() {
    unlockArduinoDownload();
    if (video.ended) {
      // Bitmiş videoda "Video Oynat" baştan başlatır — başlık ve
      // altyazı ipuçları da baştan alınmalı (Tekrar İzle ile aynı).
      restoreStepTitle();
    }
    if (video.paused || video.ended) {
      video.play().catch(() => {
        if (typeof window.showToast === 'function') {
          window.showToast('▶ Oynatmak için Tekrar İzle butonuna tıkla');
        }
      });
    } else {
      video.pause();
    }
  }

  if (btnPlay) btnPlay.addEventListener('click', togglePlayback);
  /* Videonun kendisi tıklanabilir. `controls` yok, yani tarayıcının
     kendi bir davranışı devreye girmiyor; çakışma riski taşımıyor.
     Videosu olmayan adımda placeholder video'nun ÜSTÜNDE duruyor,
     tıklama oraya düşmüyor. */
  video.addEventListener('click', togglePlayback);
  video.style.cursor = 'pointer';
  // 'play' olayı video.play() çağrılır çağrılmaz (gerçek kare üretmeden ÖNCE)
  // ateşleniyor — kaynak bulunamayınca bile buton hemen "Durdur" yazıyordu.
  // 'playing' olayı sadece video GERÇEKTEN kare üretmeye başladığında ateşlenir.
  video.addEventListener('playing', () => {
    setPlayPauseUI(true);
    // Video yeniden oynamaya başladığında "adım tamamlandı" sarı ipucu ve
    // Sonraki butonundaki pulse hâlâ ekranda kalmasın — video bitince zaten
    // 'ended' olayı bunları tekrar gösterecek.
    btnNext.classList.remove('vp-btn-pulse');
    nextHint.classList.remove('show');
  });
  video.addEventListener('pause', () => setPlayPauseUI(false));
  // NOT: 'waiting' olayını buton durumuna BAĞLAMA. 'waiting' sadece anlık
  // buffer tıkanması demek, oynatma NİYETİ değişmedi — bunu dinleyip
  // setPlayPauseUI(false) çağırmak, 5sn ileri/geri sarma sonrası (veya her
  // ufak buffer takılmasında) 'waiting'⇄'playing' art arda ateşlenince
  // Oynat/Durdur ikonunun gözle görülür şekilde hızlı hızlı titremesine yol
  // açıyordu. Buton durumu sadece gerçek play/pause/ended niyetini yansıtsın.
  video.addEventListener('timeupdate', () => {
    if (!isScrubbing) updateSeekUI();
  });

  // İlerleme çubuğu (seek bar). Sürüklerken video kesintisiz yeniden
  // sarmasın diye 'input' sırasında sadece görsel/etiket güncellenir,
  // gerçek video.currentTime ataması sadece bırakınca ('change') yapılır.
  let isScrubbing = false;
  function updateSeekUI() {
    if (seekRange && !isNaN(video.duration) && video.duration > 0) {
      seekRange.max = video.duration;
      seekRange.value = video.currentTime;
      seekRange.style.setProperty('--vp-seek-pct', (video.currentTime / video.duration * 100) + '%');
    }
    if (seekCurrent) seekCurrent.textContent = formatTime(video.currentTime);
  }
  video.addEventListener('loadedmetadata', () => {
    if (seekRange) seekRange.max = video.duration || 0;
    if (seekDuration) seekDuration.textContent = formatTime(video.duration);
  });
  if (seekRange) {
    seekRange.addEventListener('input', () => {
      isScrubbing = true;
      if (seekCurrent) seekCurrent.textContent = formatTime(parseFloat(seekRange.value));
      seekRange.style.setProperty('--vp-seek-pct', (parseFloat(seekRange.value) / (video.duration || 1) * 100) + '%');
    });
    seekRange.addEventListener('change', () => {
      video.currentTime = parseFloat(seekRange.value);
      isScrubbing = false;
    });
  }
  btnReplay.addEventListener('click', () => {
    // Sadece başa sarar, OYNATMAZ — başlatmak için öğrenci "Video Oynat"a basmalı.
    video.currentTime = 0;
    restoreStepTitle();
    btnNext.classList.remove('vp-btn-pulse');
    nextHint.classList.remove('show');
    video.pause();
    setPlayPauseUI(false);
  });
  btnNext.addEventListener('click', () => loadStep(index + 1, true));
  nextHint.addEventListener('click', () => loadStep(index + 1, true));
  if (btnBoardUrl) {
    btnBoardUrl.addEventListener('click', () => {
      if (window.LessonEngine) LessonEngine.copyWithToast(BOARD_MANAGER_URL, 'URL kopyalandı!');
    });
  }

  // 5 saniye ileri/geri sarma. Video "bitti" durumundayken geri sarılırsa
  // (öğrenci sonu kaçırıp biraz öncesine dönmek istiyorsa) 'ended' UI'ı
  // (sarı ipucu, biten başlık) hâlâ ekranda kalmasın diye normal oynatan
  // hâle döner — Tekrar İzle'nin yaptığı reset'in aynısı, sadece baştan değil.
  function skip(deltaSeconds) {
    if (!video.duration || isNaN(video.duration)) return;
    const wasEnded = video.ended;
    video.currentTime = Math.min(Math.max(video.currentTime + deltaSeconds, 0), video.duration);
    if (wasEnded && deltaSeconds < 0) {
      btnNext.classList.remove('vp-btn-pulse');
      nextHint.classList.remove('show');
      restoreStepTitle();
      // Otomatik oynatmaz — devam etmek için öğrenci "Video Oynat"a basmalı.
    }
  }
  if (btnBack5) btnBack5.addEventListener('click', () => skip(-5));
  if (btnFwd5) btnFwd5.addEventListener('click', () => skip(5));

  // Videonun/oynatıcının büyütülüp küçültülmesi (Fullscreen API).
  // Sadece video karesi değil, tüm sarmalayıcı (.ide-sim-wrapper) tam
  // ekrana alınır — öğrenci tam ekranda da Oynat/5sn/Sonraki gibi
  // kontrolleri kaybetmesin diye.
  function isFullscreen() {
    return document.fullscreenElement === wrapper || document.webkitFullscreenElement === wrapper;
  }
  function updateFullscreenUI() {
    const active = isFullscreen();
    if (fullscreenIconUse) fullscreenIconUse.setAttribute('href', active ? '#icon-collapse' : '#icon-expand');
    if (btnFullscreen) btnFullscreen.title = active ? 'Videoyu küçült' : 'Videoyu büyüt';
  }
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!isFullscreen()) {
        const req = wrapper.requestFullscreen || wrapper.webkitRequestFullscreen;
        if (req) req.call(wrapper);
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
      }
    });
  }
  document.addEventListener('fullscreenchange', updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUI);

  video.addEventListener('ended', () => {
    wrapper.classList.add('vp-bitti');
    completedSteps.add(index);
    updateButtons();
    if (index === STEPS.length - 1) {
      window.simComplete = true;
      setTitle('İşlem tamam! Dahili LED yanıp sönüyor.');
      const simBox = document.getElementById('simulationBox');
      if (simBox) simBox.classList.add('code-uploaded');
      if (typeof startLEDSimulation === 'function') startLEDSimulation(currentDelayMs);
      if (window.showToast) window.showToast('Kurulum tamamlandı! Dahili LED yanıp sönüyor.');

      // Adım 4 kapısı açıldı: "İleri" parıltısı ve nokta kilitleri tazelensin.
      // (Eskiden script.js'te 1200ms'lik sonsuz bir setInterval bunu yokluyordu.)
      if (typeof window.updateReadyGlow === 'function') window.updateReadyGlow();

      // --- DOPAMİN: kurulum videolarının tamamı bitti ---
      if (window.FX) {
        FX.awardOnce('l11_video_all', 40, 'XP bonus', wrapper);
        FX.celebrate({
          emoji: '🛠️',
          title: 'Kurulum Tamamlandı!',
          sub: 'Arduino IDE hazır. Artık kendi kodunu yükleyebilirsin.',
          confetti: 100,
          duration: 2800
        });
      }
    } else {
      btnNext.classList.add('vp-btn-pulse');
      nextHintText.textContent = `Adım ${index + 1} tamamlandı! Sonraki adım videosuna geçmek için tıkla`;
      nextHint.classList.add('show');

      // --- DOPAMİN: her video adımı kendi başına küçük bir zafer ---
      if (window.FX) {
        FX.sound('unlock');
        FX.vibrate(20);
        FX.awardOnce('l11_video_' + index, 10, 'XP', btnNext);
        FX.pop(btnNext, 1.2);
        FX.burst(btnNext, { count: 12, power: 130, emojis: ['✨', '🎬'] });
      }
    }
  });

  video.addEventListener('error', () => {
    showPlaceholder();
    setPlayPauseUI(false);
  });

  /* === SAHNE YÜKSEKLİĞİ (Adım 4: video + kontroller birlikte) =======
     Ders 1.2'deki `heroYuksekligiAyarla` ile AYNI desen: CSS'te ölçü
     `clamp(var(--vp-taban), calc(100vh - var(--vp-ust)), 820px)`,
     buradaki iş yalnızca --vp-ust'u ölçmek.

     --vp-ust = max(sahnenin sayfa tepesine uzaklığı,
                    sahnenin ALTINDA kalan her şey)
              + sabit gezinme çubuğu
              + küçük bir pay.

     İki şartın DARI seçiliyor: (A) kaydırmadan video tam görünsün,
     (B) kaydırınca video + düğmeler birlikte görünsün. Ayrıntı ve
     neden üçüncü şartın (hiç kaydırmadan hepsi) bırakıldığı
     fonksiyonun içindeki notta.

     "Altta kalan her şey" tek tek toplanmıyor, SAĞ PANELİN dibi ile
     sahnenin dibi arasındaki fark ölçülüyor — araç çubuğu dar ekranda
     iki satıra düştüğünde ölçü kendini düzeltiyor.

     Fonksiyon ETKİSİZ TEKRARLI (idempotent) olmak zorunda: iki kez
     çağrılınca aynı değeri vermeli (test-video.mjs bunu kontrol ediyor). */
  function sahneYuksekligiAyarla() {
    const stage = wrapper.querySelector('.vp-stage');
    const panel = wrapper.closest('.right-panel');
    const fen = document.querySelector('.fentop-container');
    if (!stage || !panel || !fen || !wrapper.classList.contains('show')) return;
    // Tam ekranda sahne kendi kuralıyla ölçülüyor (bkz. video-player.css),
    // buradaki sayfa ölçüsü orada anlamsız.
    if (document.fullscreenElement || document.webkitFullscreenElement) return;

    let ust = 0, el = stage;
    while (el) { ust += el.offsetTop; el = el.offsetParent; }

    const sahne = stage.getBoundingClientRect();
    const altBlok = Math.round(panel.getBoundingClientRect().bottom - sahne.bottom);
    const kapDolgu = Math.round(parseFloat(getComputedStyle(fen).paddingBottom) || 0);

    const nav = document.querySelector('.bottom-nav');
    const navH = nav ? Math.round(nav.getBoundingClientRect().height) : 0;

    /* ---------- IKI SART, HANGISI DARSA O ----------
       Arda (2026-09-22): "butonlari yine alt tarafa koy, ekran yine buyuk
       kalsin ama scrollbar cok assagi inmeden; butonlara basarken videoda
       bir ani takip etmesi lazim, gorus acisi oyle olmali."

       A) KAYDIRMADAN VIDEO TAM GORUNSUN: sahnenin sayfa tepesine
          uzakligi (ust bar + ders seridi + baslik + aciklama) + alt
          gezinme cubugu. Sayfa ilk acildiginda videonun alti KESIK
          gorunmesin diye.
       B) KAYDIRINCA VIDEO + SERIT BIRLIKTE GORUNSUN: sahnenin ALTINDA
          kalan her sey (ilerleme cubugu, altyazi, dugmeler, dolgular) +
          alt gezinme cubugu. Dugmeye basarken videoda ne oldugu
          gorulebilsin diye - Adim 4'un butun isi bu.

       Ikisinin DARI secilir (max(ust, alt)): oyle bir yukseklik ki hem
       sayfa tepesindeyken video tam, hem de dibe kaydirildiginda video
       VE dugmeler ayni anda ekranda. Aradaki kaydirma ~100px, yani
       "scrollbar cok assagi inmeden".

       Ucuncu bir sart (hic kaydirmadan HEPSI gorunsun) denendi ve
       birakildi: 730px'lik ekranda sahneyi 347px'e indiriyor, ekran
       kaydi o boyda okunmuyor.

       Geri besleme dongusu yok: ne `ust` ne `altBlok` sahnenin KENDI
       boyuna bagli (sahne uzayinca sahnenin dibi de sag panelin dibi de
       birlikte kayiyor, fark sabit). Olcu neden `.right-panel`,
       `.fentop-container` DEGIL: kabin `min-height` kurali var, dibi
       yerinde kaliyor ve sahne her cagrida bir daha eriyordu
       (1920x1080'de 517 -> 459 -> 401 olculmustu).

       Pay 8: seridin dibi ile gezinme cubugu arasinda gorulur bir nefes
       kalsin, dugmeler cubuga yapismasin. */
    const dar = Math.max(ust, altBlok + kapDolgu);
    wrapper.style.setProperty('--vp-ust', (dar + navH + 8) + 'px');

    /* TABAN = okunabilirlik tabani. Artik "video kontrolleri ezerek
       buyusun" DEGIL (o kural kalkti: kontroller gorunur kalmak zorunda),
       yalnizca cok basik pencerelerde sahnenin kullanilamaz boya inmesini
       engelliyor. 300: 456/300 karsilastirmasi, 2026-09-21. */
    wrapper.style.setProperty('--vp-taban', '300px');
  }
  window.sahneYuksekligiAyarla = sahneYuksekligiAyarla;

  /* ÖLÇÜ ÜÇ KEZ ALINIYOR — girdisi kendi sonucuna bağlı olduğu için.
     İlk ölçü sahne HÂLÂ ESKİ BOYUNDAYKEN düşüyor: sayfa o anda ekrandan
     uzun olduğu için KAYDIRMA ÇUBUĞU duruyor, içerik 15px dar kalıyor ve
     araç çubuğu iki satıra düşüyor (67 → 91px). Sahne kısalınca sayfa
     sığıyor, çubuk kayboluyor, çubuk tek satıra dönüyor — yani ölçünün
     girdisi ölçünün SONUCUNA bağlı. Ölçüldü: ilk turda --vp-ust 469px,
     yerleşme bitince 455px; aradaki 14px sahneden boşuna gidiyordu.

     "Değişmeyene kadar döngü" denendi ve YETMEDİ: art arda iki kare
     aynı (henüz oturmamış) değeri verip döngüyü erken bitiriyor.
     Bu yüzden ölçü kare + 150ms + 500ms olmak üzere üç kez alınıyor;
     fonksiyon girdiler sabitken etkisiz tekrarlı olduğu için fazladan
     tur zararsız (test-video.mjs bunu kontrol ediyor). */
  function sahneOlcuTazele() {
    requestAnimationFrame(sahneYuksekligiAyarla);
    setTimeout(sahneYuksekligiAyarla, 150);
    setTimeout(sahneYuksekligiAyarla, 500);
  }
  window.sahneOlcuTazele = sahneOlcuTazele;

  /* Pencere boyu değişince ölçü bayatlar (araç çubuğu satır sayısı,
     açıklama satır sayısı). Adım 4 dışında zararsız: .show yoksa çıkıyor. */
  window.addEventListener('resize', sahneYuksekligiAyarla);

  // İlk yükleme
  probeAll().then(() => loadStep(0));

  // changeStep()'in reset için çağırdığı hook
  window.resetIdeSim = () => { loadStep(0); sahneYuksekligiAyarla(); };
})();
