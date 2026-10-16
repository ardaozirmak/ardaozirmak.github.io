/* Ders 2.1 — LED Durumunu Seri Monitör'e Yaz.
   Kaynak: github.com/ozgur79/01_deneyapGiris_dk → dk0040_ledDurumunuYaz/ders.md + .ino
   (haritada portal_ders 2.1, ✅; Ortak 2026-10-06 Issue #1: "kartta test edildi"). Modül 2'nin
   ilk dersi; 3.1'in (buton) önkoşulu.
   Devre: tek LED, 1.5/1.6'nın standart düzeni (wiring-diagram.js ledSirasi, bir LED): kısa bacak
   direnç üzerinden − rayına, ray kartın üst GND'sine, uzun bacak D5'e (MI). dk'daki malzemeyle
   birebir: 1 LED, 1 direnç, 2 jumper. dk "dk0020 devren duruyorsa sökme" der; 1.6'dan gelen
   çocuğun trafik lambası modülü bağlıysa onunla da olur (kırmızı ışığı R → D5).
   Adım 5: Seri Monitör'ü açmayı motion design sahnesi gösterir (kurulum-sahne.js SAHNELER.seri);
   etkileşimli monitör paneli YOK (Arda 2026-10-05: ders içi alet paneli istemiyor). */
window.LESSON_DATA_2_1 = {
  "xpPrefix": "l21",
  "quizStorageKey": "quiz_lesson_2_1_passed",
  "ders": {
    "no": "2.1",
    "modul": 2,
    "ad": "LED Durumunu Seri Monitör'e Yaz",
    "rozet": "Yedinci Kıvılcım",
    "rozetAlt": "Deneyap Atölyem - Seri Monitör dersini başarıyla tamamladın! Kartın artık sana ne yaptığını söylüyor.",
    "kutlamaAlt": "Ders 2.1 tamamlandı: kartın bilgisayara yazı gönderdi!",
    "sonraki": { "href": "lesson-2-2.html", "label": "Ders 2.2", "baslik": "Sıradaki: Ders 2.2, Trafik Lambası Rengini Yazsın", "metin": "Kartın konuşmayı öğrendi. Şimdi trafik lambası hangi renkte olduğunu ekrana yazacak." },
    "seriSahne": true,
    "ledSirasi": [
      { "pin": "D5", "renk": { "kapali": "#7A2A24", "yanik": "#FF3B26", "isik": "#FF5A45" } }
    ],
    "desen": [
      { "yanik": [0], "ms": 1000 }, { "yanik": [], "ms": 1000 }
    ],
    "kodNotu": "Yeni olan iki satır var: <code>Serial.begin(115200);</code> bağlantıyı başlatır, <code>Serial.println(...)</code> bilgisayara yazı gönderir.",
    "pinBaslik": "Pini kartta bulamıyor musun?",
    "pinAciklama": "Kartın alt kenarında <code>D5</code>'in yanında <strong>MI</strong> yazar. Üst kenarda <strong>GND</strong>, <strong>D9</strong>'un hemen solunda.",
    "kurKapisi": "Tek LED'li devreyi kur: <strong>Hadi kuralım</strong>'a bas ve parçaları tak.",
    "bosBaslik": "Tek LED, D5'te. Yeni parça yok.",
    "bosIpucu": "▶ <strong>Hadi kuralım</strong>’a bas: kart, GND kablosu, LED, direnç ve D5 kablosu.",
    "bosNot": " Ders 1.6’daki trafik lambası modülü bağlıysa onunla da olur: kırmızı ışığı (R) D5’te, bu ders yalnız onu yakıp söndürür.",
    "bitisKontrol": "Kartında eski kod duruyorsa LED başka türlü yanar. Yeni kodu bir sonraki adımda yükleyeceksin."
  },
  "materials": {
    "icon": "icon-box",
    "items": [
      "Deneyap Mini v2 Kartı",
      "Type-C USB Kablosu",
      "1 LED (kırmızı)",
      "1 adet 220 ohm Direnç",
      "Breadboard",
      "2 Adet Jumper Kablo"
    ],
    "note": "Yeni parça yok. Ders 1.6'daki trafik lambası modülü bağlıysa sökme, onunla da olur: kırmızı ışığı (R) D5'te. <strong>Seri Monitör</strong> bir parça değil, Arduino IDE'nin bir penceresi.",
    "readyMessage": "Harika! Malzemelerin hazır."
  },
  "helpPrompt": "Deneyap Mini v2 kartıyla breadboard üzerinde tek LED'li bir devre kurdum. LED'in uzun bacağı (+) D5'e, kısa bacağı (−) 220 ohm direnç üzerinden breadboard'un eksi rayına, ray de kartın GND pinine bağlı. Kartın mantık gerilimi 3.3V. Kodda const int led = D5; yazıyor; setup() içinde pinMode ve Serial.begin(115200) var. loop() içinde LED yanınca Serial.println(\"YANDI\"), sönünce Serial.println(\"SONDU\") yazıyor, aralarda delay(1000). Arduino IDE'de Seri Port Ekranı'nı (Seri Monitör) açıyorum. Ama beklediğim gibi olmuyor. Bana yardım et ama hepsini birden anlatma: her seferinde TEK bir soru sor, cevabımı bekle, sonra bir sonraki adıma geç. Bana pin numarası, direnç değeri, menü yolu ya da bağlantı tarifi verme — bunları dersimdeki devre şeması belirliyor. Kontrol edilecekler şunlar olabilir: LED hiç yanmıyorsa uzun bacak D5 tarafında mı, direnç GND'ye ulaşıyor mu; LED yanıyor ama ekran boşsa kod gerçekten yüklendi mi, doğru port ve doğru pencere açık mı; ekranda anlamsız işaretler varsa koddaki hızla ekrandaki hız aynı mı; YANDISONDU aynı satırda uzuyorsa iki satırda da println mi yazıyor; ışık ile yazı aynı anda değişmiyorsa her println satırı ilgili digitalWrite satırının hemen altında mı; Türkçe harfler bozuksa Türkçe karaktersiz mesaj mı kullanılıyor. Şunu da bil: kartın üzerinde D5 yazmaz, D5'in yanında MI yazar. Bana kısa cümlelerle, yaşıma uygun ve sabırlı bir dille anlat.",
  "ledCheck": {
    "question": "Seri Port Ekranı'nda LED yanınca <strong>YANDI</strong>, sönünce <strong>SONDU</strong> görüyor musun?",
    "yesLabel": "Evet, yazı ışıkla birlikte geliyor!",
    "noLabel": "Hayır, olmadı",
    "successText": "<strong>Harika!</strong> Kartın artık sana ne yaptığını söylüyor. LED'e bakamadığın bir anda bile ekrandaki yazıdan ne olduğunu bilirsin. Şimdi İleri'ye bas ve kodu keşfet.",
    "fixesIntro": "<strong>Olur böyle, hiç sorun değil.</strong> Ne gördüğüne göre sırayla bak:",
    "fixes": [
      {
        "icon": "wrench",
        "title": "LED yanıyor ama ekran boş mu?",
        "text": "Önce kodun karta yüklendiğine bak. Sonra <strong>Araçlar &gt; Port</strong>'ta kartın portu seçili mi, açtığın pencere <strong>Seri Port Ekranı</strong> mı?"
      },
      {
        "icon": "alert",
        "title": "Ekranda anlamsız işaretler mi var?",
        "text": "Ekranın sağındaki hız kutusunda <strong>115200 baud</strong> seçili olmalı: koddaki <code>Serial.begin(115200)</code> ile aynı."
      },
      {
        "icon": "search",
        "title": "YANDISONDU aynı satırda mı uzuyor?",
        "text": "İki mesaj satırında da <code>Serial.println</code> yazmalı. <code>Serial.print</code> kalmışsa yeni satıra geçmez."
      },
      {
        "icon": "bulb",
        "title": "LED hiç yanmıyor mu?",
        "text": "LED'in kısa bacağı direncin sütununda, uzun bacağı D5 kablosunun sütununda mı? Siyah kablo üstteki <strong>GND</strong>'den − rayına gidiyor mu?"
      }
    ]
  },
  "quizCelebrateSub": "6 sorunun hepsini doğru bildin. Rozetin çok yakın!",
  "stepsData": [
    {
      "title": "Adım 1: Hedefi Gör",
      "desc": "LED yanıp sönerken kartın ne yaptığını bilgisayarda da göreceksin: LED yanınca ekranda <strong>YANDI</strong>, sönünce <strong>SONDU</strong> yazacak. Bu dersin yeni fikri: çalışan kart bilgisayara yazı gönderebilir."
    },
    {
      "title": "Adım 2: Malzemeleri Topla",
      "desc": "1 LED, 1 adet 220 ohm direnç ve 2 jumper kablo. Yeni parça yok; Ders 1.6'daki trafik lambası modülü bağlıysa onunla da olur. Hazırsan 'Malzemeleri Hazırladım!' butonuna bas."
    },
    {
      "title": "Adım 3: Devreyi Kur",
      "desc": "Kartını bilgisayara tak. <strong>Hadi kuralım</strong>'a bas: tek LED, kısa bacağı direnç üzerinden − rayına, uzun bacağı D5'e."
    },
    {
      "title": "Adım 4: Kodu Yükle",
      "desc": "Bu kod LED'i yakıp söndürür ve her seferinde bilgisayara ne yaptığını yazar. Kopyala, Arduino IDE'de karta yükle."
    },
    {
      "title": "Adım 5: Seri Monitör'ü Aç",
      "desc": "Kodu yükledin. Şimdi Arduino IDE'de <strong>Seri Port Ekranı</strong>'nı aç ve hızı <strong>115200</strong> seç. Nasıl yapılacağını aşağıda izle."
    },
    {
      "title": "Adım 6: Kodu Keşfet",
      "desc": "<code>Serial.begin</code> neden <code>setup()</code>'ta, <code>Serial.println</code> neden <code>loop()</code>'ta? Koda satır satır tıklayarak gör."
    },
    {
      "title": "Adım 7: Sen Yap",
      "desc": "Şimdi kodu sen değiştireceksin. Üç görev var; her birini Arduino IDE'de dene, karta yükle, LED'ine ve Seri Monitör'e bak."
    },
    {
      "title": "Adım 8: Sınavı Geç",
      "desc": "6 soru. Dersi tamamlamak için hepsini doğru bilmen gerekiyor; yanlış cevapta tekrar deneyebilirsin."
    },
    {
      "title": "Adım 9: Rozetini Al",
      "desc": "Tebrikler! Ders 2.1'i tamamladın. Merak ettiklerini <strong>AI Yoldaşına Sor</strong> butonuyla düşünerek keşfedebilirsin."
    }
  ],
  "wiringSteps": [
    "Deneyap kartı breadboard'a tak: USB-C girişi solda, pin sıraları orta kanalın iki yanında.",
    "Kartın üstteki <strong>GND</strong> pininden − rayına siyah kablo.",
    "LED'i tak: iki bacak da g satırında, kısa bacak solda.",
    "LED'in kısa bacağının sütunundan − rayına bir direnç.",
    "<strong>D5</strong> (kartta MI) → LED'in uzun bacağı."
  ],
  "//wiringGuide": "Adım sırası wiring-diagram.js siraAdimlari ile aynı: kart, GND, LED, direnç, D5 kablosu.",
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
      "ad": "GND kablosu",
      "adim3": ["jumper", "breadboard"],
      "xray": false,
      "neden": "LED'in elektriği bu yoldan karta geri döner. Breadboard'un kenarındaki <b>− rayı</b> boydan boya bağlıdır.",
      "nereye": "Bir ucu kartın <b>üst</b> kenarındaki <b>GND</b> pininin hemen üstündeki boş deliğe. Öbür ucu hemen yukarıdaki <b>−</b> (mavi çizgili) raya.",
      "kontrol": "Siyah kablo üstteki GND'den − rayına mı gidiyor? (1.6'da bu kablo modüle gidiyordu; LED'le kuruyorsan − rayına al.)"
    },
    {
      "ad": "LED",
      "adim3": ["led", "breadboard"],
      "xray": false,
      "neden": "Bu derste yanıp sönen tek LED bu. Kart onun durumunu bilgisayara da yazacak.",
      "nereye": "Kartın sağındaki boş sütunlara. İki bacak da <b>g</b> satırında: <b>KISA</b> bacak (−) solda, <b>UZUN</b> bacak (+) hemen sağında.",
      "kontrol": "Kısa bacak solda mı? İki bacak iki ayrı sütunda mı?"
    },
    {
      "ad": "Direnç",
      "adim3": ["direnc"],
      "xray": false,
      "neden": "Direnç LED'e çok fazla akım gitmesini engeller ve LED'i korur.",
      "nereye": "LED'in <b>kısa bacağının sütununda</b>: bir ucu yukarıdaki <b>−</b> (mavi çizgili) raya, öbür ucu aynı sütunda <b>j</b> satırına.",
      "kontrol": "Direnç, LED'in kısa bacağıyla aynı sütunda mı? Üst ucu − rayında mı?"
    },
    {
      "ad": "D5 kablosu (MI)",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "LED'e karttan elektrik bu kablo taşır. Kodda bu pinin adı <b>D5</b>, isim olarak <b>led</b>.",
      "nereye": "Bir ucu kartın alt kenarında <b>MI</b> yazan pinin altındaki boş deliğe. Öbür ucu LED'in uzun bacağının sütununa, LED'in hemen önündeki <b>f</b> deliğine.",
      "kontrol": "Devre tamam. Kodu bir sonraki adımda yükleyeceksin."
    }
  ],
  "senYap": [
    {
      "id": "sure",
      "gorev": "LED'i <strong>2 saniye yanık</strong>, <strong>yarım saniye sönük</strong> bırak: iki <code>delay</code> sayısını ayrı ayrı değiştir ve karta yükle.",
      "soru": "Yarım saniyelik bekleme için <code>delay</code>'in içine hangi sayıyı yazdın?",
      "ipucu": "1000 milisaniye 1 saniye. Yarım saniye bunun yarısı.",
      "tip": "sayi",
      "cevap": 500,
      "dogru": "Evet, <strong>500</strong> milisaniye yarım saniye. Seri Monitör'de SONDU'dan sonra YANDI artık çok çabuk geliyor, değil mi?"
    },
    {
      "id": "mesaj",
      "gorev": "<code>YANDI</code> ve <code>SONDU</code> yerine kendi iki kısa durum mesajını yazdır (örneğin <code>ISIK VAR</code> / <code>ISIK YOK</code>). Karta yükle, Seri Monitör'e bak.",
      "ipucu": "Değiştireceğin şey tırnak işaretlerinin arasındaki yazı. Tırnakları silme. Türkçe harf kullanmazsan ekranda bozulmaz.",
      "tip": "yaptim",
      "etiket": "Kendi mesajlarımı gördüm"
    },
    {
      "id": "zaman",
      "gorev": "<code>Serial.println(\"YANDI\");</code> satırını kesip <code>delay(1000);</code> satırının altına taşı. Karta yükle: ışık ile yazı hâlâ aynı anda mı değişiyor? Sonra satırı eski yerine getir.",
      "ipucu": "Kod satırları yukarıdan aşağıya sırayla çalışır. Yazı satırı beklemenin arkasına geçerse ne zaman çalışır?",
      "tip": "gozlem",
      "secenekler": ["Yazı ışıktan 1 saniye sonra geldi", "Bir fark göremedim"],
      "beklenen": 0
    }
  ],
  "yetiskinKarti": [
    "LED gerçekten yanıp sönüyor mu; yani sorun ışıkta mı, yalnız yazıda mı?",
    "Kod ile Seri Monitör aynı hızı mı gösteriyor?",
    "Her mesaj satırı ilgili ışık değişiminin hemen altında mı?"
  ],
  "merakKosesi": {
    "baslik": "Merak Köşesi: Serial ve nokta",
    "sahne": [{"tip": "baslat", "hiz": 115200, "yazi": "<code>Serial.begin</code>: bağlantıyı başlatır."}, {"tip": "seri", "metin": "YANDI", "yazi": "<code>Serial.println</code>: yazı gönderir."}, {"tip": "seri", "metin": "SONDU", "yazi": "<code>SONDU</code> bilerek Türkçe harfsiz yazıldı."}, {"tip": "seri", "metin": "SÃ¶NDÃ¼", "yazi": "<code>SÖNDÜ</code> yazsaydık bazı ekranlarda böyle görünebilirdi. Kod bozuk değil, harfler uyuşmamış."}],
    "metin": "<code>Serial</code>, kartın bilgisayarla konuşmasını sağlayan hazır bir araç. Noktadan sonraki ad bu araca hangi işi yaptıracağını seçer: <code>Serial.begin</code> bağlantıyı başlatır, <code>Serial.println</code> yazı gönderir. Bu yapının nasıl kurulduğu fonksiyon konusunda tam açılacak. <code>SONDU</code> bilerek Türkçe harfsiz yazıldı: <code>SÖNDÜ</code> bazı ekranlarda bozuk görünebilir. Bu, kodun bozulduğu anlamına gelmez; yalnız harfler uyuşmamıştır."
  },
  "ctlLines": [
    { "code": "/* BU KOD NE YAPAR?", "desc": "Kodun en üstündeki not: kart okumaz, ne yaptığını bize anlatır." },
    { "code": "  Bu kod, D5 pinine bağlı LED'i 1 saniye yakıp 1 saniye söndürür. LED yanınca Seri Monitör'e", "desc": "D5'teki LED 1 saniye yanar, 1 saniye söner." },
    { "code": "  (115200) \"YANDI\", sönünce \"SONDU\" yazar ve bunu sürekli tekrarlar.", "desc": "Işık her değiştiğinde bilgisayara da yazı gider." },
    { "code": "*/", "desc": "Not burada biter." },
    { "code": "", "desc": "Boş satır; kodun okunabilirliği için boşluk bırakılır." },
    { "code": "// Kart çalışırken bilgisayara yazı gönderebilir; gönderilen yazıları Seri Monitör gösterir.", "desc": "Bu dersin yeni fikri: kart bilgisayara yazı gönderebilir. <strong>Seri Monitör</strong> o yazıları gösteren Arduino IDE penceresi." },
    { "code": "// 115200, kart ile Seri Monitör'ün ortak konuşma hızıdır; iki tarafta da aynı olmalıdır.", "desc": "Hız iki tarafta aynı değilse ekranda anlamsız işaretler çıkar." },
    { "code": "// Serial.println, tırnak içindeki yazıyı gönderir ve sonraki yazı için yeni satıra geçer.", "desc": "<code>println</code>'deki <code>ln</code>: yazıdan sonra yeni satıra geç." },
    { "code": "const int led = D5;", "desc": "Kart üzerinde D5 yazan pine <code>led</code> adı verilir. Pin adı bir kez yazıldığı için kod daha kolay okunur. Kartta bu pinin yanında <strong>MI</strong> yazar." },
    { "code": "", "desc": "Boş satır." },
    { "code": "void setup() {", "desc": "<strong>Kara kutu:</strong> <code>void</code>, bu kod bölümünün sonunda değer verilmediğini belirtir; fonksiyon konusunda tam açılacak." },
    { "code": "  pinMode(led, OUTPUT);", "desc": "<strong>Kara kutu:</strong> <code>OUTPUT</code>, pinin dışarıya elektrik göndereceğini belirtir; buton dersinde <code>INPUT</code> ile birlikte tam açılacak." },
    { "code": "  Serial.begin(115200);", "desc": "Kartın bilgisayara yazı göndereceği seri bağlantıyı <strong>115200</strong> hızında başlatır. Yalnız bir kez gereken bir başlangıç ayarı olduğu için <code>setup()</code> içinde." },
    { "code": "}", "desc": "<code>setup</code> bitti. Bu bölüm kart açılınca bir kez çalışır." },
    { "code": "", "desc": "Boş satır." },
    { "code": "void loop() {", "desc": "<code>loop()</code> içindeki satırlar sürekli baştan tekrar eder." },
    { "code": "  digitalWrite(led, HIGH);", "desc": "D5 çıkışını açık yapar; LED yanar." },
    { "code": "  Serial.println(\"YANDI\");", "desc": "Seri Monitör'e <code>YANDI</code> gönderir ve yeni satıra geçer. LED'i yakan satırın hemen altında: ışık ve yazı birlikte değişir." },
    { "code": "  delay(1000);", "desc": "LED ve yazının bu durumunu 1000 milisaniye, yani <strong>1 saniye</strong> korur." },
    { "code": "", "desc": "Boş satır; iki durumu gözle ayırmak için." },
    { "code": "  digitalWrite(led, LOW);", "desc": "D5 çıkışını kapatır; LED söner." },
    { "code": "  Serial.println(\"SONDU\");", "desc": "Seri Monitör'e <code>SONDU</code> gönderir ve yeni satıra geçer. Türkçe harf yok: bazı ekranlarda <code>SÖNDÜ</code> bozuk görünebilir." },
    { "code": "  delay(1000);", "desc": "Sönük durum da <strong>1 saniye</strong> sürer." },
    { "code": "}", "desc": "<code>loop()</code> bitti, en başa döner: yeniden YANDI." }
  ],
  "quizQuestions": [
    {
      "q": "Kartın gönderdiği <code>YANDI</code> ve <code>SONDU</code> yazıları nerede görülür?",
      "options": ["Breadboard üzerinde", "Seri Monitör'de", "LED'in içinde", "Direncin üzerinde"],
      "answer": "e24aae41",
      "hint": "Arduino IDE'de açtığın pencerenin adını düşün.",
      "ipucu": "Arduino IDE'de açtığın pencerenin adını düşün."
    },
    {
      "q": "<code>Serial.println(\"YANDI\");</code> ne yapar?",
      "options": ["LED'i yakar", "<code>YANDI</code> yazıp yeni satıra geçer", "Bir saniye bekler", "D5 pinini çıkış yapar"],
      "answer": "2d7eb52c",
      "hint": "LED'i yakan satır <code>digitalWrite</code> ile başlar.",
      "ipucu": "LED'i yakan satır <code>digitalWrite</code> ile başlar."
    },
    {
      "q": "Seri Monitör'de hangi hız seçilmelidir?",
      "options": ["220", "1000", "9600", "115200"],
      "answer": "f6cfd1b0",
      "hint": "<code>Serial.begin(...)</code> parantezinin içine bak.",
      "ipucu": "<code>Serial.begin(...)</code> parantezinin içine bak."
    },
    {
      "q": "<code>Serial.begin(115200)</code> neden <code>setup()</code> içindedir?",
      "options": ["Bağlantıyı bir kez başlatmak yeterli olduğu için", "LED'i sürekli yakmak için", "Her saniye hızı değiştirmek için", "Direnci korumak için"],
      "answer": "eb87a9f8",
      "hint": "<code>setup()</code> kaç kez çalışır?",
      "ipucu": "<code>setup()</code> kaç kez çalışır?"
    },
    {
      "q": "Neden <code>Serial.print</code> yerine <code>Serial.println</code> kullanıldı?",
      "options": ["LED daha parlak yansın diye", "Mesajlar ayrı satırlarda kolay izlensin diye", "Pin değişsin diye", "Bekleme kısalsın diye"],
      "answer": "bd8f59b9",
      "hint": "<code>ln</code>, yazıdan sonra yeni satıra geçilmesini sağlar.",
      "ipucu": "<code>ln</code>, yazıdan sonra yeni satıra geçilmesini sağlar."
    },
    {
      "q": "Mesaj satırı <code>digitalWrite</code> satırından çok sonra çalışırsa ne olur?",
      "options": ["Direnç değeri değişir", "LED ile ekrandaki bilgi farklı zamanlarda değişir", "D5, D6 olur", "LED'in yönü değişir"],
      "answer": "fc946443",
      "hint": "Kod satırları yukarıdan aşağıya çalışır.",
      "ipucu": "Kod satırları yukarıdan aşağıya çalışır."
    }
  ],
  "aiPrompts": [
    {
      "level": 1,
      "cat": "Kavramsal Anlama",
      "catColor": "green",
      "title": "Durumu Görünür Yapma",
      "prompt": "Sen sabırlı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, D5 pininde 220 ohm dirençli bir LED kullanıyorum ve seri hız 115200. Kart LED'in durumunu Seri Monitör'e yazıyor. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. LED'e bakamadığım bir anda yazının ne işe yarayacağını düşündüren tek bir soru sor; cevabı söyleme."
    },
    {
      "level": 1,
      "cat": "Hata Giderme",
      "catColor": "blue",
      "title": "Seri Monitör Boş",
      "prompt": "Sen bir hata ayıklama koçusun. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, D5 pininde 220 ohm dirençli LED yanıp sönüyor; seri hız 115200 olduğu hâlde Seri Monitör boş. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. Yükleme, port ve monitör durumlarını sırayla kontrol etmemi sağlayan sorular sor; cevabı doğrudan verme."
    },
    {
      "level": 2,
      "cat": "Pekiştirme",
      "catColor": "blue",
      "title": "Zamanlama",
      "prompt": "Sen meraklı bir rehbersin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, D5 pininde 220 ohm dirençli LED kullanıyorum ve seri hız 115200. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. digitalWrite, Serial.println ve delay satırlarının sırasının ışıkla yazıyı nasıl eşleştirdiğini bulduracak bir deney sorusu sor; cevabı söyleme."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "void Nedir?",
      "prompt": "Sen meraklı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, D5 pininde 220 ohm dirençli LED kullanıyorum ve seri hız 115200. Kodumda void setup() yazıyor. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. void kelimesinin kod bölümünün sonunda değer verip vermemesiyle ilgili olabileceğini düşündüren bir soru sor; cevabı verme, konu fonksiyonlarda açılacak."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "OUTPUT Nedir?",
      "prompt": "Sen meraklı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, D5 pininde 220 ohm dirençli LED kullanıyorum ve seri hız 115200. Kodumda OUTPUT yazıyor. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. Pinin dışarıya elektrik vermesiyle dışarıdan bilgi alması arasındaki farkı düşündüren bir soru sor; cevabı verme, konu buton dersinde INPUT ile açılacak."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "Serial ve Nokta",
      "prompt": "Sen meraklı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, D5 pininde 220 ohm dirençli LED kullanıyorum ve seri hız 115200. Kodumda Serial.begin ve Serial.println yazıyor. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. Noktadan önceki adın araç, sonraki adın o araca verilen iş olabileceğini düşündüren bir soru sor; cevabı verme, yapı fonksiyonlarda tam açılacak."
    }
  ]
};
