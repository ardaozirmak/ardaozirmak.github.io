      let currentStep = 1;
      let ledInterval = null;
      let currentDelayMs = 1000;
      let arduinoDownloadUnlocked = false;
      let stepsData = null;
      let parcaAyari = null;   // Adım 3 parça kartları (LESSON_DATA_1_1.parcalar)

      function startLEDSimulation(delayMs) {
        if (ledInterval) clearInterval(ledInterval);

        const ledImg = document.getElementById('layer-led');
        const glowImg = document.getElementById('layer-glow');
        const simBox = document.getElementById('simulationBox');

        /* Kart bilgisayara BAĞLI DEĞİLSE dahili LED yanmaz — karta güç
           gitmiyorsa yüklenmiş kod da çalışmıyor demektir. Arda: "portu
           çıkarttım ama yine yanıyordu, yanmaması gerek." */
        const kartBagli = !window.UsbLink || UsbLink.connected();
        if (!simBox || !kartBagli || (!simBox.classList.contains('code-uploaded') && currentStep < 5)) {
          if (ledImg) ledImg.classList.remove('active');
          if (glowImg) glowImg.classList.remove('active');
          return;
        }

        // CSS'teki opacity/glow geçişi sabit 0.15s'ydi. Slider 10ms'e kadar
        // indiğinde 150ms'lik geçiş hiç tamamlanamıyor, LED sönükte takılı
        // kalıyordu ("sapıtıyor"). Alt sınır (eskiden 15ms) 10ms'lik interval'dan
        // BÜYÜKTÜ; geçiş bir sonraki toggle'dan önce hiç bitmiyor, LED tam
        // görünmüyordu. Alt sınırı interval'ın açıkça altına (delayMs*0.35, en
        // az 3ms) çekip geçişin her toggle'da rahatça tamamlanmasını sağlıyoruz.
        const transitionMs = Math.max(3, Math.min(120, delayMs * 0.35));
        if (ledImg) ledImg.style.transitionDuration = transitionMs + 'ms';
        if (glowImg) glowImg.style.transitionDuration = transitionMs + 'ms';

        let isOn = false;

        ledInterval = setInterval(() => {
          isOn = !isOn;
          if (ledImg) ledImg.classList.toggle('active', isOn);
          if (glowImg) glowImg.classList.toggle('active', isOn);
        }, delayMs);
      }

      /* Eskiden burada "Periyot: T = ... / Frekans: f = 1000 ÷ 2000 = 0.50 Hz"
         yazıyordu. Ondalıklı bölme + periyot/frekans kavramı + Hz birimi
         5. sınıf seviyesinin çok üstünde (fen müfredatında 8. sınıf konusu).
         Aynı fikir formülsüz anlatılıyor; hızlandıkça ortaya çıkan
         "sürekli yanık görünme" illüzyonu da korunuyor. */
      function blinkText(delayMs) {
        const periodMs = delayMs * 2;
        if (periodMs >= 200) {
          return `Bir kez yanıp sönmesi <strong>${(periodMs / 1000).toFixed(1)} saniye</strong> sürüyor.`;
        }
        const kez = Math.round(1000 / periodMs);
        return `Saniyede <strong>${kez} kez</strong> yanıp sönüyor — o kadar hızlı ki gözün ayırt edemiyor, sürekli yanık görüyorsun!`;
      }

      function delayControlsHtml() {
        return `
          <div class="sim-controls" id="simControls">
            <label for="delayRange">
              <span>Gecikme (<em>delay</em>):</span>
              <span style="color: var(--color-accent); font-weight: 700;"><span id="delayVal">${currentDelayMs}</span> ms</span>
            </label>
            <input type="range" id="delayRange" min="10" max="1000" value="${currentDelayMs}" step="10">
            <div class="math-card">
              <div><strong>Ne oluyor?</strong></div>
              <div id="mathBlink">${blinkText(currentDelayMs)}</div>
            </div>
          </div>`;
      }

      function bindDelayControls() {
        const delayRange = document.getElementById('delayRange');
        const delayVal = document.getElementById('delayVal');
        if (!delayRange) return;

        delayRange.addEventListener('input', (e) => {
          currentDelayMs = parseInt(e.target.value);
          if (delayVal) delayVal.innerText = currentDelayMs;

          // Slider'ı kaydırırken her adımda minik bir "tık" sesi — değeri
          // değiştirmek fiziksel bir düğme çevirmek gibi hissettiriyor.
          // Çok sık tetiklenmemesi için 55ms'lik bir kısıt var.
          if (window.FX) {
            const now = Date.now();
            if (now - (bindDelayControls._lastTick || 0) > 55) {
              bindDelayControls._lastTick = now;
              FX.sound('tick');
            }
          }

          document.getElementById('mathBlink').innerHTML = blinkText(currentDelayMs);

          startLEDSimulation(currentDelayMs);
        });
      }

      // Kilit kontrolleri ve ortak adım DOM'u (başlık, açıklama, sayaç,
      // ilerleme çubuğu, noktalar, XP) artık lesson-engine.js'te.
      // Burada SADECE Ders 1.1'e özgü DOM kaldı. Global changeStep()
      // HTML'deki inline onclick'ler için ince bir sarmalayıcı.
      function onStepChange(step, prevStep) {
        currentStep = step;

        // Ortak adım DOM'u (step1-hero, step4-ide, #codeContainer) lesson-page.js'te.
        LessonPage.paintStepDom();
        syncUsbSahne();
        const simBox = document.getElementById('simulationBox');
        if (currentStep < 3) simBox.classList.remove('code-uploaded');

        if (currentStep >= 5) {
          simBox.classList.add('code-uploaded');
        } else if (currentStep < 4) {
          simBox.classList.remove('code-uploaded');
        }

        startLEDSimulation(currentDelayMs);
        guncelleGucUyarisi();

        const ideSimWrapper = document.getElementById('ideSimWrapper');

        if (currentStep === 4) {
          ideSimWrapper.classList.add('show');
          if (window.resetIdeSim && !window.simComplete) window.resetIdeSim();
        } else {
          ideSimWrapper.classList.remove('show');
        }

        renderStepContent();
        guncelleGucUyarisi();

        /* Adım 4'te sahne yüksekliği görünümden türetiliyor (bkz.
           video-player.js sahneYuksekligiAyarla). Ölçü renderStepContent'
           ten SONRA alınmalı: açıklama satır sayısı sahnenin offsetTop'unu
           değiştiriyor. Ölçü iki kare sonra alınıyor — sebebi
           video-player.js'teki sahneOlcuTazele notunda. */
        if (currentStep === 4 && window.sahneOlcuTazele) window.sahneOlcuTazele();
      }

      const READY_WHEN = {
        2: () => LessonEngine.materialsReadyFlag,
        3: () => UsbLink.connected(),
        4: () => !!window.simComplete,
        /* Adim 5: kodu karta yukleyip "LED yaniyor mu?" sorusuna cevap
           vermeden ileri yok. Evet de olur hayir da - olculen sey cocugun
           YUKLEMEYI DENEMIS olmasi, LED'in yanmasi degil (yanmadiysa
           zaten yardim akisi devreye giriyor). */
        5: () => LessonEngine.ledCheckAnswer !== null,
        7: () => LessonEngine.quizPassed
      };


      function renderStepContent() {
        const interactiveArea = document.getElementById('interactiveArea');
        interactiveArea.innerHTML = '';

        if (currentStep === 2) {
          interactiveArea.innerHTML = LessonEngine.renderMaterials();
        } else if (currentStep === 3) {
          /* Parça tanıtımı Ders 1.2'deki gibi: görsel + tek cümle, gerisi
             "Yakından bak" ile (Arda, 2026-09-28: "sarı bölgeye tıkla kısmını
             komple kaldır ... kablo ve deneyapı tanıt görselli, isterse
             okur"). Eskiden kartın üstündeki iki sarı bölgeye tıklatılıyordu. */
          interactiveArea.innerHTML = (window.PartsGallery ? PartsGallery.html(parcaAyari || {}) : '') + UsbLink.html();
          UsbLink.paint();
        } else if (currentStep === 5) {
          interactiveArea.innerHTML = `
            <div class="quiz-box">
              <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-bolt"/></svg>Kodu Karta Yükle</strong>
              ${LessonEngine.ledCheckHtml()}
            </div>`;
          LessonEngine.restoreLedCheck();
        } else if (currentStep === 6) {
          // Pin haritası Adım 3'te DEĞİL burada: çocuk "ışık hangi pinde"
          // sorusunu ancak pinMode satırını okuyunca soruyor. Adım 3'te
          // göstermek, sorulmamış bir soruyu cevaplamak olurdu.
          const pm = (window.LESSON_DATA_1_1 || {}).pinMap;
          interactiveArea.innerHTML = delayControlsHtml()
            + LessonEngine.clickToLearnHtml()
            + (pm ? LessonEngine.pinMapHtml({ id: 'pinMapBody', icon: 'icon-bulb', title: pm.title, body: pm.body, alt: pm.alt }) : '');
          bindDelayControls();
          LessonEngine.initAccordions(true);
        } else if (currentStep === 7) {
          LessonEngine.renderQuiz();
        } else if (currentStep === 8) {
          interactiveArea.innerHTML = `
            <div class="quiz-box">
              <strong style="display:flex; align-items:center; gap:8px;"><svg class="icon"><use href="#icon-robot"/></svg>AI Yoldaşına Sor</strong>
              <p class="step-card-desc" style="margin-top:8px;">Öğrendiklerini pekiştirmek için aşağıdaki <strong>AI Yoldaşına Sor</strong> butonuna bas. Düşünmeni sağlayan, cevabı doğrudan söylemeyen sorulardan birini seç. Kopyaladığında AI yeni sekmede açılır, oraya yapıştırman yeterli.</p>
              <div class="callout"><svg class="icon callout-icon"><use href="#icon-brain"/></svg><span>Bir prompt seçtikten ve AI ile konuştuktan sonra <strong>İleri</strong> butonuyla rozetini almaya geçebilirsin.</span></div>
            </div>`;
        } else if (currentStep === 9) {
          interactiveArea.innerHTML = `
            <div class="badge-card">
              <img class="badge-medal" src="assets/img/rozet/ders-1-1.webp" alt="" draggable="false">
              <h3 style="color: var(--color-primary);">İlk Kıvılcım Rozeti</h3>
              <p style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">Deneyap Atölyem - Dahili LED Modülünü Başarıyla Tamamladın!</p>
            </div>
            <a class="next-teaser" href="lesson-1-2.html" style="display:block; margin-top:14px; padding:14px 16px; border:2px dashed var(--color-primary); border-radius:var(--radius-md); text-decoration:none; color:inherit;">
              <strong style="color: var(--color-primary);"><img class="fx-ikon" src="assets/img/fx/fx-kilit.webp" alt="" aria-hidden="true" draggable="false"> Sıradaki: Ders 1.2</strong><br>
              Kendi LED'ini devreye bağlayıp yakacaksın. Hazır mısın? →
            </a>
          `;
          const firstTime = Store.get('badge_lesson_1_1') !== 'earned';
          Store.set('badge_lesson_1_1', 'earned');
          unlockLesson12(true);

          if (window.FX) {
            // Dersin finali: tam ekran kutlama + fanfar + 100 XP.
            FX.awardOnce('l11_badge', 100, 'XP', document.querySelector('.badge-medal'));
            FX.celebrate({
              emoji: '🏅',
              nesne: 'rozet/ders-1-1',   // derse özel rozet (blender/ders-rozet.py)
              title: 'İlk Kıvılcım Rozeti!',
              sub: firstTime
                ? 'Ders 1.1 tamamlandı. <strong>Ders 1.2</strong> kilidi açıldı!'
                : 'Rozetin cebinde. Ders 1.2 seni bekliyor!',
              confetti: 160,
              duration: 3800
            });
          } else {
            LessonEngine.burstConfetti();
          }
        }
      }

      /* ---- Adım 3: kabloyu GERÇEKTEN takma ----
         Tüm mantık `assets/js/usb-link.js` içinde; Ders 1.2 de aynısını
         kullanıyor (Arda: "aynı sistem 1.2'de de olsun"). Burada yalnızca
         sahneyi bağlıyoruz. */
      /* Sahnenin kablo durumu TEK yerden hesaplanır — hem adım değişince
         hem kutu işaretlenince burası çağrılır.

         Arda'nın bildirdiği tutarsızlık: "USB taktım, bilgisayar geldi;
         2. adıma geçtim, orada yoktu; çıkar-tak yapınca geldi; 1. adıma
         döndüğümde takılı olmasına rağmen yine gelmemişti."
         Sebebi iki ayrı yerde iki ayrı kural olmasıydı: adım geçişi
         "yalnızca Adım 3+" diyordu, kutu işaretlemesi ise adıma hiç
         bakmadan `connected` ekliyordu. Aynı durum, hangi yoldan
         geldiğine göre farklı görünüyordu.

         Yeni kural tek cümle: **kablo takılıysa sahne her adımda takılı
         görünür.** Gerçekte de öyle — çocuk kabloyu Adım 1'e döndüğünde
         çıkarmıyor. Takılı değilken kablo yalnızca Adım 3'ten itibaren
         sahnede (orada tanıtılıyor). */
      /* Ders 1.1, Adim 4: videolar bitince dahili LED yanar. Port takili
         degilse yanmaz ve SEBEBI yazılır — sessiz kalmak, çocuğa videoyu
         yanlış izlediğini sandırır (Arda). */
      function guncelleGucUyarisi() {
        const alan = document.getElementById('interactiveArea');
        if (!alan) return;
        const gerek = (currentStep >= 4) && !!window.simComplete && !UsbLink.connected();
        let kutu = document.getElementById('usbNoPower');
        if (!gerek) { if (kutu) kutu.remove(); return; }
        if (!kutu) {
          kutu = document.createElement('div');
          kutu.id = 'usbNoPower';
          kutu.className = 'callout';
          kutu.style.marginTop = '14px';
          kutu.innerHTML = '<svg class="icon callout-icon"><use href="#icon-alert"/></svg><span></span>';
          alan.appendChild(kutu);
        } else if (kutu.parentElement !== alan) {
          alan.appendChild(kutu);
        }
        kutu.querySelector('span').innerHTML = UsbLink.noPowerMessage();
      }
      window.guncelleGucUyarisi = guncelleGucUyarisi;

      /* Ortak tesisat lesson-page.js'te: sahneyi eşitle → BURADAKİ ek iş →
         kapıları tazele → "İleri" parıltısını tazele. Burada yalnızca
         Ders 1.1'e özgü olan kalıyor. */
      LessonPage.setup({
        readyWhen: READY_WHEN,
        ideStep: 4,
        onUsbChange: function () {
          guncelleGucUyarisi();
          // Kablo çıkınca dahili LED de SÖNMELİ (Arda: "portu çıkartım,
          // yine yanıyordu"). Kartta güç yoksa hiçbir kod çalışmıyor demektir.
          startLEDSimulation(currentDelayMs);
        }
      });

      // "LED yanıyor mu?" akışı ve yardım promptu artık motorda
      // (lesson-engine.js); metinleri LESSON_DATA_1_1.ledCheck taşıyor.

      // celebrateIt: sadece dersin 9. adımına GERÇEKTEN ulaşıldığında true.
      // Sayfa yenilendiğinde (rozet zaten kazanılmışken) sessizce açılır.
      function unlockLesson12(celebrateIt) {
        // Sekme kilidi artık ortak kuralda (lesson-page.js sekmeleriBoya,
        // rozet yazılınca kendiliğinden yeniden boyanır). Burada yalnızca
        // kilidin ilk açılış kutlaması kaldı.
        const wasLocked = !!document.querySelector('#lessonList .lesson-item.locked[data-step="2"]');
        if (window.LessonPage) LessonPage.sekmeleriBoya();
        const item = document.querySelector('#lessonList .lesson-item[data-step="2"]');
        if (item && celebrateIt && wasLocked && window.FX) {
          setTimeout(() => FX.unlocked(item, { flash: false }), 900);
        }
      }

      // Arduino İndir butonu, alttaki video oynatılana kadar kilitli kalır
      // (video-player.js 'playing' olayında arduinoDownloadUnlocked'ı açar).
      // Kilitliyken tıklanırsa sayfa açılmasın, öğrenciye ne yapması
      // gerektiği söylensin.
      document.addEventListener('click', (e) => {
        const dlBtn = e.target.closest('#arduinoDownloadBtn');
        if (dlBtn && dlBtn.classList.contains('is-disabled')) {
          e.preventDefault();
          showToast('İlk önce videoyu başlatıp izlemelisin!', 'warn');
        }
      });

      // Veri assets/data/lesson-1-1.js'ten <script> ile senkron yükleniyor
      // (fetch() DEĞİL — dosyayı sunucusuz, çift tıklayıp file:// ile açınca
      // da çalışsın istiyoruz; fetch() file:// altında sessizce başarısız olur).
      (function initLesson11() {
        // Kart artık TEK kaynaktan geliyor: assets/js/board-svg.js (BoardSVG).
        // Ders 1.1'e özgü seçenek: dahili LED + GÜÇ ledi için id'ler (ids).
        // Adım 3'ün sarı keşif bölgeleri (hotspots) 2026-09-28'de kalktı,
        // yerine parça kartları geldi. startLEDSimulation() birazdan
        // #layer-led/#layer-glow arayacağı için kart LessonEngine.start()'tan
        // (dolayısıyla ilk onStepChange çağrısından) ÖNCE enjekte edilmeli.
        const kartSvg = document.getElementById('layer-kart');
        if (kartSvg && window.BoardSVG) {
          kartSvg.innerHTML = BoardSVG.groupMarkup({ ids: true });
        }

        /* "3B çevir" düğmesi 2026-10-04'te kalktı: sahnenin kendisi 3B
           (assets/js/kart-sahne3b.js), "Hareket ettir" ile çevriliyor. */

        const data = window.LESSON_DATA_1_1;
        stepsData = data.stepsData;
        parcaAyari = data.parcalar || null;
        /* Adım 4'ün açıklaması Arduino indirme kilidine göre CANLI
           değişiyor — bu yüzden düz metin değil fonksiyon.
           METİN KISALDI (2026-09-21): eski cümle 18 kelimeydi ve panelde
           İKİ SATIR tutuyordu; o iki satır doğrudan videonun boyundan
           gidiyordu (Arda: "video çok küçülmüş" + "yazı aynı yerinde
           kalsın"). Kısaltma 5. sınıf kuralıyla da uyumlu: cümle başına
           8-9 kelime. Anlam kaybı yok — "inen dosyayı çalıştır" ile
           "dosyayı çalıştır" aynı şeyi söylüyor, videodaki adımlar zaten
           videoda. */
        stepsData[3].desc = () => `Önce <a class="sim-btn arduino-download-btn${arduinoDownloadUnlocked ? '' : ' is-disabled'}" id="arduinoDownloadBtn" href="https://downloads.arduino.cc/arduino-ide/arduino-ide_2.3.10_Windows_64bit.exe" download rel="noopener"${arduinoDownloadUnlocked ? '' : ' aria-disabled="true"'}><svg class="icon"><use href="#icon-download"/></svg>Arduino İndir</a> butonuna tıkla, dosyayı çalıştır. Sonra videoyu adım adım izle.`;

        LessonEngine.init({
          // Son adımda İleri → sıradaki ders (lesson-engine.js changeStep).
          nextLesson: { href: 'lesson-1-2.html', label: "Sıradaki derse geç: Ders 1.2" },
          xpPrefix: data.xpPrefix,
          /* Kaldığın yerden devam (lesson-engine devam_v1): kablo takılı, video
             izlenmiş, kod yüklü sahne geri gelir. */
          devamHazirla: function (enIleri) {
            if (enIleri > 3) UsbLink.geriYukle();
            if (enIleri > 4) { window.simComplete = true; const sb = document.getElementById('simulationBox'); if (sb) sb.classList.add('code-uploaded'); }
          },
          quizStorageKey: data.quizStorageKey,
          materials: data.materials,
          ctlLines: data.ctlLines,
          stepsData: stepsData,
          totalSteps: 9,
          quizQuestions: data.quizQuestions,
          aiPrompts: data.aiPrompts,
          quizCelebrateSub: data.quizCelebrateSub,
          ledCheck: data.ledCheck,
          helpPrompt: data.helpPrompt,
          // Malzemeler hazır deyince kendiliğinden Adım 3'e geçmez (Arda, 2026-09-28).
          malzemeOtoIleri: false,
          /* Yol gösterme (assets/js/odak.js). Arda: "çocuk sayfada
             basacağı 3-4 tane basması gerekenler olsun, yolu biz
             göstereceğiz." sira = sırayla açılan zorunlu işler, rehber =
             sırayla parlayan isteğe bağlı keşif, daha = "Daha fazlası"
             altına katlanan ikincil şeyler. */
          odak: {
            3: {
              sira: [{ s: '#usbTak', bitti: '.is-on' }],
              rehber: ['.pg-more']
            },
            // Video önce (Arduino İndir video başlayınca açılıyor).
            4: {
              // Ortadaki büyük düğme kalktı (2026-10-06): önce sarı "Video Oynat" parlar.
              rehber: ['[data-vp="play"]', '#arduinoDownloadBtn'],
              // "Önceki" görünür kalır: Sonraki varsa geri de olsun (Arda, 2026-09-28).
              daha: ['[data-vp="back5"]', '[data-vp="fwd5"]', '[data-vp="replay"]'],
              dahaYeri: '.vp-toolbar'
            },
            6: {
              rehber: ['.ctl-line'],
              daha: ['[data-step-card]', '.pin-map']
            }
          },
          // Kapılar: bir adımdan İLERİ çıkmak için sağlanması gereken şart.
          // "İleri" butonu da, adım noktasına tıklamak da buradan geçer.
          gates: {
            2: () => LessonEngine.materialsReadyFlag ||
                 "Önce malzemelerini hazırlayıp 'Malzemeleri Hazırladım!' butonuna basmalısın!",
            /* Arda: "3. adımdan itibaren port takılı değilse diğer adıma
               geçemesin, illa takması gerek." Kablo şartı Adım 3'ten sonuna
               kadar HER adımda geçerli; adımın kendi şartı (video, sınav)
               ondan sonra bakılır. */
            3: () => UsbLink.connected() || UsbLink.gateMessage(),
            4: () => UsbLink.connected() ? (!!window.simComplete || "Önce video adımlarını tamamlayın!")
                 : UsbLink.gateMessage(),
            5: () => UsbLink.connected() || UsbLink.gateMessage(),
            6: () => UsbLink.connected() || UsbLink.gateMessage(),
            7: () => UsbLink.connected() ? (LessonEngine.quizPassed || "Lütfen önce mini sınavı doğru cevaplayın!")
                 : UsbLink.gateMessage(),
            8: () => UsbLink.connected() || UsbLink.gateMessage(),
          },
          /* Kapı kapandığında: sebep kablo ise çocuğu kablo kutusuna
             kaydır ve "kartı bul" düğmesini parlat (Arda: "usb takmadan
             geçmeye çalışınca oto scroll kabloyu tak kısmına gitsin").
             Diğer kapılar kendi bölümlerinin yanında zaten duruyor. */
          onBlocked: function () {
            if (window.UsbLink && !UsbLink.connected()) UsbLink.focusGate();
          },
          onStepChange: onStepChange,
          onReadyGlowChange: updateReadyGlow,
        });

        LessonEngine.start();

        // Rozet daha önceki bir oturumda kazanılmış olabilir — sayfa her
        // yenilendiğinde currentStep 1'e döndüğü için unlockLesson12() bu
        // oturumda hiç çağrılmayabilir. localStorage'a bakıp kilidi baştan aç.
        if (Store.get('badge_lesson_1_1') === 'earned') {
          unlockLesson12();
        }

        // Adım noktalarının bağlanması, boyanması ve kilit görünümü
        // LessonEngine.start() içinde. Videonun bitişini yoklamak için
        // eskiden 1200ms'lik sonsuz bir setInterval vardı; artık
        // video-player.js bittiğinde doğrudan window.updateReadyGlow()
        // çağırıyor, yoklamaya gerek kalmadı.

        // Sol panel collapse toggle (mobile/tablet)
        const leftToggle = document.getElementById('leftPanelToggle');
        const leftPanel  = document.getElementById('leftPanel');
        if (leftToggle && leftPanel) {
          leftToggle.addEventListener('click', () => {
            const collapsed = leftPanel.classList.toggle('collapsed');
            leftToggle.setAttribute('aria-expanded', String(!collapsed));
            const label = leftToggle.querySelector('.panel-toggle-label');
            if (label) label.textContent = collapsed ? 'Büyüt' : 'Küçült';
          });
        }
      })();

// ============================================================
// ADIM 4 — VİDEO PLAYER
// ============================================================
// Eski fake-cursor/IDE DOM simülasyonu (18 alt adım) söküldü.
// Yerine assets/js/video-player.js modülü bağlandı.
// Modül kendi içinde STEPS dizisi, kontroller ve simComplete yönetimini yapıyor.
// changeStep() içinde currentStep === 4 olduğunda #ideSimWrapper.show tetiklenir
// ve changeStep(1) ile Adım 5'e geçmek için simComplete true beklenir.
// ============================================================
