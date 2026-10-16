/* Ders 2.2 — Trafik Lambası Rengini Yazsın.
   Kaynak: github.com/ozgur79/01_deneyapGiris_dk → dk0160_trafikLambasiYazsin/ders.md + .ino
   (haritada portal_ders 2.2, ✅). Numara Portal-Ders-Haritasi.md'den. Modül 2'nin ikinci dersi.
   Devre: 1.6'nın aynısı (dk §4: "Ders 1.6'nın devresi duruyorsa hiçbir şeye dokunma"). Portalda 1.6
   trafik lambası MODÜLÜYLE kuruluyor (Arda, 2026-10-06/07): modül breadboard'da dik, 4 erkek-erkek
   kablo R→D5 (MI), Y→D6 (MC), G→D9, GND→üst GND. dk hâlâ "3 LED + 3 direnç + 6 jumper" diyor:
   1.6 ile aynı sapma, Özgür'e Issue #1'de soruldu (2026-10-07).
   Kod dk .ino ile satır satır aynı (BU KOD NE YAPAR bloğu + KAVRAM yorumları + kod; dk'nin uzun
   başlık bloğu ve SEN YAP yorumları 1.6/2.1'deki gibi ekranda yok).
   Adım 5: Seri Monitör sahnesi kurulum-sahne.js SAHNELER.seriTrafik (KIRMIZI/YESIL/SARI, 4/3/1 sn). */
window.LESSON_DATA_2_2 = {
  "xpPrefix": "l22",
  "quizStorageKey": "quiz_lesson_2_2_passed",
  "ders": {
    "no": "2.2",
    "modul": 2,
    "ad": "Trafik Lambası Rengini Yazsın",
    "rozet": "Sekizinci Kıvılcım",
    "rozetAlt": "Deneyap Atölyem - Trafik Lambası Rengini Yazsın dersini başarıyla tamamladın! Lamban artık rengini söylüyor.",
    "kutlamaAlt": "Ders 2.2 tamamlandı: trafik lamban hangi renkte olduğunu ekrana yazıyor!",
    "sonraki": { "href": "lesson-3-1.html", "label": "Ders 3.1", "baslik": "Modül 2 tamam! Sıradaki: Ders 3.1, Buton", "metin": "Kartın konuşmayı öğrendi. Şimdi dinlemeyi öğrenecek: butona basınca LED yansın." },
    "trafikModulu": true,
    "seriSahne": "seriTrafik",
    "ledSirasi": [
      { "pin": "D5", "renk": { "kapali": "#7A2A24", "yanik": "#FF3B26", "isik": "#FF5A45" } },
      { "pin": "D6", "renk": { "kapali": "#7D6A22", "yanik": "#FFD23F", "isik": "#FFE066" } },
      { "pin": "D9", "renk": { "kapali": "#2A5E37", "yanik": "#3BE36B", "isik": "#5CFF8A" } }
    ],
    "desen": [
      { "yanik": [0], "ms": 4000 }, { "yanik": [2], "ms": 3000 }, { "yanik": [1], "ms": 1000 }
    ],
    "kodNotu": "Ders 1.6'nın kodu aynen duruyor. Yeni olan dört satır: <code>Serial.begin(115200);</code> ve her rengin altındaki <code>Serial.println(...)</code>.",
    "pinBaslik": "Pinleri kartta bulamıyor musun?",
    "pinAciklama": "Kartın alt kenarında <code>D5</code>'in yanında <strong>MI</strong>, <code>D6</code>'nın yanında <strong>MC</strong> yazar. Üst kenarda <strong>D9</strong> kendi adıyla yazar; hemen solunda <strong>GND</strong> var. Modülde pinlerin yanında <strong>R</strong>, <strong>Y</strong>, <strong>G</strong>, <strong>GND</strong> yazar.",
    "kurKapisi": "Ders 1.6'nın devresini kur: <strong>Hadi kuralım</strong>'a bas. Devren duruyorsa yalnız kontrol et.",
    "bosBaslik": "Ders 1.6'nın trafik lambası devresi. Yeni parça yok.",
    "bosIpucu": "▶ <strong>Hadi kuralım</strong>’a bas: kart ve modül breadboard’da, sonra dört kablo (GND, R, Y, G).",
    "bosNot": " Ders 1.6’nın devresi duruyorsa hiçbir şeye dokunma: bu ders yalnız koda yazı satırları ekliyor.",
    "bitisKontrol": "Kartında 1.6'nın kodu duruyorsa lamba yanar ama ekrana yazı gelmez. Yeni kodu bir sonraki adımda yükleyeceksin."
  },
  "materials": {
    "icon": "icon-box",
    "items": [
      "Deneyap Mini v2 Kartı",
      "Type-C USB Kablosu",
      "Breadboard",
      "Trafik Lambası Modülü (kırmızı, sarı, yeşil)",
      "4 Adet Erkek-Erkek Jumper Kablo"
    ],
    "note": "Yeni parça yok: Ders 1.6'daki trafik lambası devresi aynen kullanılır. Devren duruyorsa dokunma. <strong>Seri Monitör</strong> bir parça değil, Arduino IDE'nin Ders 2.1'de açtığın penceresi.",
    "readyMessage": "Harika! Malzemelerin hazır."
  },
  "helpPrompt": "Deneyap Mini v2 kartıyla bir trafik lambası modülü kullanıyorum. Modülde kırmızı, sarı ve yeşil LED ile dirençleri hazır; 4 pini var: R, Y, G, GND. Modül breadboard'a dik takılı; R pini D5'e, Y pini D6'ya, G pini D9'a, GND pini kartın GND pinine erkek-erkek kablolarla bağlı. Kartın mantık gerilimi 3.3V. Kodda pinlere const int ile kirmizi, sari, yesil adlarını veriyorum; setup() içinde Serial.begin(115200) var. loop() içinde kırmızı 4 saniye, yeşil 3 saniye, sarı 1 saniye yanıyor ve her rengin altında Serial.println ile KIRMIZI, YESIL, SARI yazılıyor. Arduino IDE'de Seri Port Ekranı'nı (Seri Monitör) açıyorum. Ama beklediğim gibi olmuyor. Bana yardım et ama hepsini birden anlatma: her seferinde TEK bir soru sor, cevabımı bekle, sonra bir sonraki adıma geç. Bana pin numarası, menü yolu ya da bağlantı tarifi verme — bunları dersimdeki devre şeması belirliyor. Kontrol edilecekler şunlar olabilir: hiçbir ışık yanmıyorsa kod gerçekten yüklendi mi, modülün GND'si kartın GND'sine bağlı mı; ışıklar yanıyor ama ekran boşsa doğru port ve doğru pencere açık mı; ekranda anlamsız işaretler varsa koddaki hızla ekrandaki hız aynı mı; yanan renk ile ekrandaki ad farklıysa her println satırı kendi renginin üç digitalWrite satırının hemen altında mı; Türkçe harfler bozuksa Türkçe karaktersiz yazı mı kullanılıyor. Şunu da bil: kartın üzerinde D5 ve D6 yazmaz, D5'in yanında MI, D6'nın yanında MC yazar; D9 kendi adıyla yazar. Bana kısa cümlelerle, yaşıma uygun ve sabırlı bir dille anlat.",
  "ledCheck": {
    "question": "Seri Port Ekranı'nda kırmızı yanınca <strong>KIRMIZI</strong>, yeşil yanınca <strong>YESIL</strong>, sarı yanınca <strong>SARI</strong> görüyor musun?",
    "yesLabel": "Evet, lamba rengini söylüyor!",
    "noLabel": "Hayır, olmadı",
    "successText": "<strong>Harika!</strong> Tanıdığın trafik lambasına yeni bir katman ekledin: artık hangi renkte olduğunu ekrana kendisi yazıyor. Şimdi İleri'ye bas ve kodu keşfet.",
    "fixesIntro": "<strong>Olur böyle, hiç sorun değil.</strong> Ne gördüğüne göre sırayla bak:",
    "fixes": [
      {
        "icon": "wrench",
        "title": "Işıklar yanıyor ama ekran boş mu?",
        "text": "Seri Port Ekranı açık mı? <strong>Araçlar &gt; Port</strong>'ta kodu yüklediğin port seçili mi?"
      },
      {
        "icon": "alert",
        "title": "Ekranda anlamsız işaretler mi var?",
        "text": "Ekranın sağındaki hız kutusunda <strong>115200 baud</strong> seçili olmalı: koddaki <code>Serial.begin(115200)</code> ile aynı."
      },
      {
        "icon": "search",
        "title": "Yanan renk ile ekrandaki ad farklı mı?",
        "text": "<code>Serial.println</code> satırı yanlış renk adımına konmuş olabilir. Her yazı satırını hemen üstündeki üç <code>digitalWrite</code> ile karşılaştır."
      },
      {
        "icon": "bulb",
        "title": "Hiçbir ışık yanmıyor mu?",
        "text": "Kod yüklendi mi: <strong>Araçlar &gt; Kart</strong>'ta Deneyap Mini v2 seçili mi? Siyah kablo üstteki <strong>GND</strong>'den modülün <strong>GND</strong> sütununa gidiyor mu?"
      }
    ]
  },
  "quizCelebrateSub": "6 sorunun hepsini doğru bildin. Modül 2'nin rozeti çok yakın!",
  "stepsData": [
    {
      "title": "Adım 1: Hedefi Gör",
      "desc": "Ders 1.6'da kurduğun trafik lambasını değiştirmeden ona bir katman ekleyeceksin: kırmızı yanarken Seri Monitör'de <strong>KIRMIZI</strong>, yeşil yanarken <strong>YESIL</strong>, sarı yanarken <strong>SARI</strong> yazacak. Yeni komut yok; Ders 2.1'de öğrendiğin seri yazıyı tanıdığın bir devrede kullanacaksın."
    },
    {
      "title": "Adım 2: Malzemeleri Topla",
      "desc": "Ders 1.6'daki trafik lambası modülü ve 4 erkek-erkek jumper kablo. Yeni parça yok; devren duruyorsa dokunma. Hazırsan 'Malzemeleri Hazırladım!' butonuna bas."
    },
    {
      "title": "Adım 3: Devreyi Kur",
      "desc": "Kartını bilgisayara tak. <strong>Hadi kuralım</strong>'a bas: Ders 1.6'nın devresi. Devren duruyorsa her adımda yalnız kontrol et."
    },
    {
      "title": "Adım 4: Kodu Yükle",
      "desc": "Bu kod trafik lambasını çalıştırır ve yanan rengin adını bilgisayara yazar. Kopyala, Arduino IDE'de karta yükle."
    },
    {
      "title": "Adım 5: Seri Monitör'ü Aç",
      "desc": "Kodu yükledin. Şimdi Arduino IDE'de <strong>Seri Port Ekranı</strong>'nı aç; hız <strong>115200</strong> olmalı. Lambana ve ekrana birlikte bak."
    },
    {
      "title": "Adım 6: Kodu Keşfet",
      "desc": "Her <code>Serial.println</code> neden kendi renginin üç <code>digitalWrite</code> satırının hemen altında? Koda satır satır tıklayarak gör."
    },
    {
      "title": "Adım 7: Sen Yap",
      "desc": "Şimdi kodu sen değiştireceksin. İki görev var; her birini Arduino IDE'de dene, karta yükle, lambana ve Seri Monitör'e bak."
    },
    {
      "title": "Adım 8: Sınavı Geç",
      "desc": "6 soru. Dersi tamamlamak için hepsini doğru bilmen gerekiyor; yanlış cevapta tekrar deneyebilirsin."
    },
    {
      "title": "Adım 9: Rozetini Al",
      "desc": "Tebrikler! Ders 2.2'yi ve Modül 2'yi tamamladın. Merak ettiklerini <strong>AI Yoldaşına Sor</strong> butonuyla düşünerek keşfedebilirsin."
    }
  ],
  "wiringSteps": [
    "Deneyap kartı breadboard'a tak: USB-C girişi solda, pin sıraları orta kanalın iki yanında.",
    "Trafik lambası modülünü breadboard'a, kartın sağına dik tak: LED'ler sana baksın.",
    "Kartın üstteki <strong>GND</strong> pininden modülün <strong>GND</strong> sütununa siyah kablo.",
    "<strong>D5</strong> (kartta MI) → modülün <strong>R</strong> sütunu.",
    "<strong>D6</strong> (kartta MC) → modülün <strong>Y</strong> sütunu.",
    "<strong>D9</strong> → modülün <strong>G</strong> sütunu."
  ],
  "//wiringGuide": "Adım sırası wiring-diagram.js modulAdimlari ile aynı: kart, modül, GND, D5 (R), D6 (Y), D9 (G). Metin 1.6 ile aynı.",
  "wiringGuide": [
    {
      "ad": "Deneyap kart",
      "adim3": ["breadboard"],
      "xray": false,
      "neden": "Her şey karta bağlanacak, önce o yerinde olmalı.",
      "nereye": "Kart breadboard'da değilse kitten çıkar ve tak: USB-C girişi <b>solda</b>, pin sıraları orta kanalın <b>iki yanında</b>. Takılıysa yerinde bırak.",
      "kontrol": "Bütün pinler delikte mi? Kartın üstünde ve altında birer sıra boş delik var mı?"
    },
    {
      "ad": "Trafik lambası modülü",
      "adim3": ["led", "kart"],
      "xray": false,
      "neden": "Ders 1.6'daki lamba: üç ışık tek parçada, dirençleri de üstünde hazır. Yukarıdan aşağı <b>kırmızı</b>, <b>sarı</b>, <b>yeşil</b>.",
      "nereye": "Kartın sağındaki boş sütunlara, <b>dik</b> tak: dört pin yan yana dört sütunda, <b>i</b> satırında. LED'ler sana baksın, kırmızı en üstte. Soldan sağa <b>GND</b>, <b>G</b>, <b>Y</b>, <b>R</b> yazar.",
      "kontrol": "1.6'dan geliyorsan modül zaten takılı. Dört pin dört ayrı sütunda mı?"
    },
    {
      "ad": "GND kablosu",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "Üç ışığın da elektriği bu yoldan karta geri döner. Modülün tek <b>GND</b> pini üç ışığa da yeter.",
      "nereye": "Bir ucu kartın <b>üst</b> kenarındaki <b>GND</b> pininin hemen üstündeki boş deliğe. Öbür ucu modülün <b>GND</b> pininin sütununa, modülün önündeki <b>g</b> deliğine.",
      "kontrol": "Siyah kablo üstteki GND'den modülün GND sütununa mı gidiyor?"
    },
    {
      "ad": "D5 kablosu: kırmızı (R)",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "Kırmızı ışığa elektrik bu kablodan gider. Kodda <b>D5</b>, isim olarak <b>kirmizi</b>.",
      "nereye": "Bir ucu kartın alt kenarında <b>MI</b> yazan pinin altındaki boş deliğe. Öbür ucu modülün <b>R</b> pininin sütununa (en sağdaki), <b>f</b> deliğine.",
      "kontrol": "Kart ucu MI'da mı? Öbür uç modülün R sütununda mı?"
    },
    {
      "ad": "D6 kablosu: sarı (Y)",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "Sarı ışığın kablosu. Kodda <b>D6</b>, isim olarak <b>sari</b>.",
      "nereye": "Bir ucu <b>MC</b> yazan pinin altındaki boş deliğe (MI'nın hemen solunda). Öbür ucu modülün <b>Y</b> pininin sütununa, <b>f</b> deliğine (kırmızı kablonun hemen solu).",
      "kontrol": "Kart ucu MC'de mi? Öbür uç modülün Y sütununda mı?"
    },
    {
      "ad": "D9 kablosu: yeşil (G)",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "Yeşil ışığın kablosu. Bu pin kartın <b>üst</b> kenarında: <b>D9</b>.",
      "nereye": "Bir ucu üst kenarda <b>D9</b> yazan pinin üstündeki boş deliğe. Öbür ucu modülün <b>G</b> pininin sütununa, modülün önündeki <b>h</b> deliğine.",
      "kontrol": "Devre tamam. Kodu bir sonraki adımda yükleyeceksin."
    }
  ],
  "senYap": [
    {
      "id": "sari",
      "gorev": "Sarı ışığın 1 saniye yerine <strong>2 saniye</strong> yanmasını sağla ve karta yükle.",
      "soru": "Sarı adımının <code>delay</code>'ine hangi sayıyı yazdın?",
      "ipucu": "Sarı adımı, <code>Serial.println(\"SARI\");</code> satırının hemen altındaki <code>delay</code>. 1000 milisaniye 1 saniye.",
      "tip": "sayi",
      "cevap": 2000,
      "dogru": "Evet, <strong>2000</strong> milisaniye 2 saniye. Sarı ışık artık iki kat uzun yanıyor."
    },
    {
      "id": "esleme",
      "gorev": "Seri Monitör'deki <code>SARI</code> yazısının da sarı ışıkla aynı anda göründüğünü gözlemle.",
      "ipucu": "Gözünü bir lambaya, bir ekrana çevir. <code>SARI</code> satırı sarıyı yakan üç <code>digitalWrite</code>'ın hemen altında.",
      "tip": "gozlem",
      "secenekler": ["Yazı ışıkla aynı anda geldi", "Yazı ışıktan sonra geldi"],
      "beklenen": 0
    }
  ],
  "yetiskinKarti": [
    "Fiziksel olarak hangi renk yanıyor?",
    "Seri Monitör'de hangi ad görünüyor?",
    "O yazı satırının hemen üstünde hangi LED durumları ayarlanmış?"
  ],
  "merakKosesi": {
    "baslik": "Merak Köşesi: Neden YESIL, YEŞİL değil?",
    "sahne": [{"tip": "seri", "metin": "YESIL", "yazi": "<code>YESIL</code>: her ekranda düzgün görünür."}, {"tip": "seri", "metin": "YEÅžIL", "yazi": "<code>YEŞİL</code> bazı ekranlarda böyle bozulur. LED de kod da sağlam."}, {"tip": "seri", "metin": "KIRMIZI", "yazi": "<code>KIRMIZI</code> ve <code>SARI</code>'da zaten Türkçe harf yok."}],
    "metin": "<code>YESIL</code> Türkçe karakter kullanmadan yazıldı. <code>KIRMIZI</code> ve <code>SARI</code>'da zaten Türkçe harf yok. Bazı bilgisayarlarda <code>YEŞİL</code> içindeki <code>Ş</code> bozuk görünebilir; bu, LED'in ya da kodun bozuk olduğu anlamına gelmez, yalnız harfler uyuşmamıştır. Bir de şuna bak: Ders 1.6'nın <code>const int</code>, <code>pinMode</code>, <code>digitalWrite</code> ve <code>delay</code> satırları aynı sırada duruyor. Yeni katman yalnız bir <code>Serial.begin</code> ve üç <code>Serial.println</code>. Değişikliği küçük tutunca neyi eklediğin hemen görünür."
  },
  "ctlLines": [
    { "code": "/* BU KOD NE YAPAR?", "desc": "Kodun en üstündeki not: kart okumaz, ne yaptığını bize anlatır." },
    { "code": "  Bu kod, D5 (kırmızı), D6 (sarı), D9 (yeşil) pinlerindeki 3 LED ile trafik lambası çalıştırır:", "desc": "Ders 1.6'nın trafik lambası." },
    { "code": "  kırmızı 4 sn, yeşil 3 sn, sarı 1 sn. Her renk yanınca Seri Monitör'e (115200) rengin adını", "desc": "Süreler 1.6 ile aynı. Yeni olan: her renk yanınca bilgisayara yazı gider." },
    { "code": "  (KIRMIZI, YESIL, SARI) yazar.", "desc": "Üç renk adı, Türkçe harfsiz." },
    { "code": "*/", "desc": "Not burada biter." },
    { "code": "", "desc": "Boş satır; kodun okunabilirliği için boşluk bırakılır." },
    { "code": "// Trafik lambasının bildiğimiz koduna (Ders 1.6), yanan rengi yazan Serial.println satırları ekliyoruz", "desc": "Ders 1.6'nın kodu korunur; her renk adımına bir yazı satırı eklenir." },
    { "code": "// Her renk yazısı, o rengin LED durumları ayarlandıktan hemen sonra gönderilir", "desc": "Ekrandaki ad ile yanan LED aynı rengi gösterir." },
    { "code": "// Seri Monitör 115200 hızında açılır; LED ile ekrandaki renk adı aynı anda değişir", "desc": "Hız Ders 2.1'deki gibi iki tarafta da aynı olmalı." },
    { "code": "const int kirmizi = D5;", "desc": "D5 pinine <code>kirmizi</code> adı verilir (Ders 1.4'te öğrendiğin isim verme). Kartta bu pinin yanında <strong>MI</strong> yazar." },
    { "code": "const int sari = D6;", "desc": "D6 pinine <code>sari</code> adı verilir. Kartta <strong>MC</strong> yazar." },
    { "code": "const int yesil = D9;", "desc": "D9 pinine <code>yesil</code> adı verilir. Kartın üst kenarında <strong>D9</strong> yazar." },
    { "code": "", "desc": "Boş satır." },
    { "code": "void setup() {", "desc": "<strong>Kara kutu:</strong> <code>void</code>, bu kod bölümünün sonunda değer verilmediğini belirtir; fonksiyon konusunda tam açılacak." },
    { "code": "  pinMode(kirmizi, OUTPUT);", "desc": "Kırmızı LED'in pini çıkış olur. <strong>Kara kutu:</strong> <code>OUTPUT</code> buton dersinde açılacak." },
    { "code": "  pinMode(sari, OUTPUT);", "desc": "Sarı LED'in pini de çıkış." },
    { "code": "  pinMode(yesil, OUTPUT);", "desc": "Yeşil LED'in pini de çıkış." },
    { "code": "  Serial.begin(115200);", "desc": "Kartın bilgisayara <strong>115200</strong> hızında yazı göndermesini başlatır: Ders 2.1'deki aynı hız. Bu dersin koduna eklenen ilk yeni satır." },
    { "code": "}", "desc": "<code>setup</code> bitti. Bu bölüm kart açılınca bir kez çalışır." },
    { "code": "", "desc": "Boş satır." },
    { "code": "void loop() {", "desc": "<code>loop()</code> içindeki üç adım sürekli baştan tekrar eder." },
    { "code": "  // Dur: kırmızı yanar, diğer iki LED söner", "desc": "Birinci adım: <strong>dur</strong>." },
    { "code": "  digitalWrite(kirmizi, HIGH);", "desc": "Kırmızı yanar." },
    { "code": "  digitalWrite(sari, LOW);", "desc": "Sarı söner." },
    { "code": "  digitalWrite(yesil, LOW);", "desc": "Yeşil söner." },
    { "code": "  Serial.println(\"KIRMIZI\");", "desc": "Kırmızı LED ayarlandıktan sonra ekrana <code>KIRMIZI</code> yazar ve yeni satıra geçer. Üç <code>digitalWrite</code>'ın altında: ışık ve yazı birlikte değişir." },
    { "code": "  delay(4000);", "desc": "Kırmızı ışık ve <code>KIRMIZI</code> yazısı <strong>4 saniye</strong> kalır." },
    { "code": "", "desc": "Boş satır; adımları gözle ayırmak için." },
    { "code": "  // Geç: yeşil yanar, diğer iki LED söner", "desc": "İkinci adım: <strong>geç</strong>." },
    { "code": "  digitalWrite(kirmizi, LOW);", "desc": "Kırmızı söner." },
    { "code": "  digitalWrite(sari, LOW);", "desc": "Sarı sönük kalır; adımın resmi baştan çizilir." },
    { "code": "  digitalWrite(yesil, HIGH);", "desc": "Yeşil yanar." },
    { "code": "  Serial.println(\"YESIL\");", "desc": "Ekrana <code>YESIL</code> yazar. Türkçe harf yok: <code>YEŞİL</code>'deki <code>Ş</code> bazı ekranlarda bozuk görünebilir." },
    { "code": "  delay(3000);", "desc": "Yeşil <strong>3 saniye</strong> sürer." },
    { "code": "", "desc": "Boş satır." },
    { "code": "  // Hazırlan: sarı yanar, diğer iki LED söner", "desc": "Üçüncü adım: <strong>hazırlan</strong>." },
    { "code": "  digitalWrite(kirmizi, LOW);", "desc": "Kırmızı sönük." },
    { "code": "  digitalWrite(sari, HIGH);", "desc": "Sarı yanar." },
    { "code": "  digitalWrite(yesil, LOW);", "desc": "Yeşil söner." },
    { "code": "  Serial.println(\"SARI\");", "desc": "Ekrana <code>SARI</code> yazar. SEN YAP'taki ilk görevin bu satırın altındaki beklemeyle ilgili." },
    { "code": "  delay(1000);", "desc": "Sarı en kısası: <strong>1 saniye</strong>." },
    { "code": "}", "desc": "<code>loop()</code> bitti, en başa döner: yeniden kırmızı, yeniden <code>KIRMIZI</code>." }
  ],
  "quizQuestions": [
    {
      "q": "Kırmızı LED yanarken Seri Monitör'de ne yazmalıdır?",
      "options": ["SARI", "YESIL", "KIRMIZI", "SONDU"],
      "answer": "2c7854bb",
      "hint": "Yazı, yanan LED'in renk adıdır.",
      "ipucu": "Yazı, yanan LED'in renk adıdır."
    },
    {
      "q": "<code>Serial.println(\"SARI\");</code> satırı kodda nereye yerleştirilir?",
      "options": ["Sarı LED'in durumları ayarlandıktan hemen sonra", "<code>const int</code> satırlarının arasına", "Kırmızı adımının başına", "Kodun dışına"],
      "answer": "fa063663",
      "hint": "Ekrandaki ad ile yanan LED aynı anda değişmeli.",
      "ipucu": "Ekrandaki ad ile yanan LED aynı anda değişmeli."
    },
    {
      "q": "Seri Monitör hangi hızda açılmalıdır?",
      "options": ["220", "1000", "9600", "115200"],
      "answer": "24f620b5",
      "hint": "<code>Serial.begin(...)</code> parantezinin içine bak.",
      "ipucu": "<code>Serial.begin(...)</code> parantezinin içine bak."
    },
    {
      "q": "Bu dersin devresi hangi eski dersle aynıdır?",
      "options": ["Dahili LED (1.1)", "Trafik lambası (1.6)", "Hız merdiveni (1.3)", "Kara şimşek (1.5)"],
      "answer": "e1225ad5",
      "hint": "Üç renkli devreyi daha önce nerede kurdun?",
      "ipucu": "Üç renkli devreyi daha önce nerede kurdun?"
    },
    {
      "q": "Bu derste Ders 1.6'nın koduna eklenen satırlar hangileridir?",
      "options": ["Üç yeni <code>const int</code>", "Altı yeni <code>digitalWrite</code>", "Bir <code>Serial.begin</code> ve üç <code>Serial.println</code>", "Üç yeni <code>pinMode</code>"],
      "answer": "21946305",
      "hint": "Eski kod ile yeni kodu yan yana karşılaştır.",
      "ipucu": "Eski kod ile yeni kodu yan yana karşılaştır."
    },
    {
      "q": "<code>Serial.println(\"YESIL\");</code> satırı LED durumlarından önce yazılırsa hangi uyumsuzluk görülebilir?",
      "options": ["Direnç değeri değişir", "Yazı yeni rengi gösterirken lamba çok kısa süre önceki renkte kalabilir", "Seri hız kendiliğinden artar", "D9 kaybolur"],
      "answer": "74e5eb14",
      "hint": "Kod satırları yukarıdan aşağıya çalışır.",
      "ipucu": "Kod satırları yukarıdan aşağıya çalışır."
    }
  ],
  "aiPrompts": [
    {
      "level": 1,
      "cat": "Kavramsal Anlama",
      "catColor": "green",
      "title": "Eşleştirme",
      "prompt": "Sen sabırlı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, D5'te kırmızı, D6'da sarı, D9'da yeşil LED'i olan bir trafik lambası modülüm (dirençleri modülün üstünde) var ve seri hız 115200. Bana pin numarası, direnç değeri veya bağlantı tarifi verme. Yanan LED ile Seri Monitör'deki renk adını eşleştirmeme yardım et; bir tam turu adım adım gözlemleten sorular sor, cevabı söyleme."
    },
    {
      "level": 1,
      "cat": "Hata Giderme",
      "catColor": "blue",
      "title": "Adlar Yanlış Sırada",
      "prompt": "Sen bir hata ayıklama koçusun. Bağlam: Deneyap Mini v2 kartında, D5/D6/D9'a bağlı üç ışıklı bir trafik lambası modülüm var, seri hız 115200. Işıkların renkleri doğru ama ekrandaki adlar yanlış sırada. Bana pin, direnç veya bağlantı tarifi verme. Cevabı söylemeden her Serial.println satırının çevresindeki kodu karşılaştırmamı sağlayan sorular sor."
    },
    {
      "level": 2,
      "cat": "Pekiştirme",
      "catColor": "blue",
      "title": "Kod Karşılaştırma",
      "prompt": "Sen ileri seviye bir mentorsun. Bağlam: Deneyap Mini v2 kartında D5/D6/D9'a bağlı üç ışıklı trafik lambası modülüm var, seri hız 115200. Ders 1.6'daki eski kodla bu yeni kod arasındaki tek katmanı bulmama yardım et. Pin, direnç veya bağlantı tarifi verme, cevabı da verme; aynı kalan ve eklenen satırları kendim ayırmam için sorular sor."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "void Nedir?",
      "prompt": "Sen meraklı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında üç ışıklı bir trafik lambası kodu yazdım, void setup() ve void loop() görüyorum. Bana pin numarası, direnç değeri veya bağlantı tarifi verme. void kelimesinin kod bölümünün sonunda değer verip vermemesiyle ilgili olabileceğini düşündüren bir soru sor; cevabı verme, konu fonksiyonlarda açılacak."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "Serial ve Nokta",
      "prompt": "Sen meraklı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında trafik lambası kodumda Serial.begin ve Serial.println yazıyor, seri hız 115200. Bana pin numarası, direnç değeri veya bağlantı tarifi verme. Noktadan önceki adın araç, sonraki adın o araca verilen iş olabileceğini düşündüren bir soru sor; cevabı verme, yapı fonksiyonlarda tam açılacak."
    }
  ]
};
