/* Ders 1.4 — İki LED.
   Kaynak: github.com/ozgur79/01_deneyapGiris_dk → dk0030_ikiLed/ders.md + .ino
   (Özgür kartta test etti; haritada portal_ders 1.4, ✅). Numara
   Portal-Ders-Haritasi.md'den, iş emri 2 (Issue #1, 2026-09-29).
   Devre: 1.2'nin D5 zinciri SÖKÜLMEDEN kalır, ikinci zincir D6'ya eklenir.
   İki doğrulanmış sapma (Özgür'e bildirildi):
   - ders.md §4 "kart üzerinde D6 yazan pin" diyor; kartta o pinin yanında
     MC yazar (resmî genişletilmiş pin diyagramı; 1.2'deki MI = D5 ile aynı durum).
   - ders.md §4 "direncin öbür ucunu GND'ye bağla" diyor; kart breadboard'a
     takılıyken alt GND sütununda tek boş delik var ve orada birinci siyah
     kablo duruyor. İkinci direncin ucu, birinci direncin GND'ye giden
     sütununa kısa bir kabloyla bağlanır — aynı sütun bağlıdır (1.2). Kablo
     sayısı yine 4 (dk malzeme listesi). */
window.LESSON_DATA_1_4 = {
  "xpPrefix": "l14",
  "quizStorageKey": "quiz_lesson_1_4_passed",
  "materials": {
    "icon": "icon-box",
    "items": [
      "Deneyap Mini v2 Kartı",
      "Type-C USB Kablosu",
      "2 LED",
      "2 adet 220 ohm Direnç",
      "Breadboard",
      "4 Adet Jumper Kablo"
    ],
    "note": "Birinci LED, direnci ve iki kablosu Ders 1.2'den beri tezgahında duruyor, sökme. Yeni gelenler: 1 LED, 1 direnç, 2 kablo.",
    "readyMessage": "Harika! Malzemelerin hazır."
  },
  "helpPrompt": "Deneyap Mini v2 kartıyla breadboard üzerinde iki LED'li bir devre kurdum. Birinci LED'in uzun bacağı (+) D5 pinine, ikinci LED'in uzun bacağı D6 pinine bağlı; her LED'in kısa bacağı (−) kendi 220 ohm direnciyle GND'ye gidiyor. Kartın mantık gerilimi 3.3V. Kodda pinlere const int ile isim veriyorum: birinciLed = D5, ikinciLed = D6. Biri yanarken öteki sönmeli, 300 milisaniyede bir yer değiştirmeli. Ama LED'ler beklediğim gibi davranmıyor. Bana yardım et ama hepsini birden anlatma: her seferinde TEK bir soru sor, cevabımı bekle, sonra bir sonraki adıma geç. Bana pin numarası, direnç değeri ya da bağlantı tarifi verme — bunları dersimdeki devre şeması belirliyor. Kontrol edilecekler şunlar olabilir: yalnız bir LED yanıyorsa o LED'in kendi pinMode satırı var mı; iki LED aynı anda yanıyorsa aynı beklemeden önceki iki digitalWrite satırından biri HIGH öteki LOW mu; LED ters takılmış olabilir mi; her LED'in kendi direnci var mı; değişikliği karta yeniden yükledim mi; Arduino IDE'de Araçlar > Kart menüsünde 'Deneyap Mini v2' seçili mi, Araçlar > Port menüsünde bir port görünüyor mu. Ekranda 'was not declared in this scope' hatası görüyorsam isim satırının setup ve loop'un dışında, en üstte olup olmadığını ve adı harf harfine aynı yazıp yazmadığımı sor. Şunu da bil: kartın üzerinde D5 ve D6 yazmaz, D5'in yanında MI, D6'nın yanında MC yazar. Bana kısa cümlelerle, yaşıma uygun ve sabırlı bir dille anlat.",
  "ledCheck": {
    "question": "Biri yanarken öteki sönüyor mu? İki LED sırayla yer değiştiriyor mu?",
    "yesLabel": "Evet, sırayla yanıyorlar!",
    "noLabel": "Hayır, olmadı",
    "successText": "<strong>Harika!</strong> Buna <strong>zıt durum</strong> denir: biri <code>HIGH</code> iken öteki <code>LOW</code>. Şimdi İleri'ye bas ve pinlere verdiğimiz isimlerin ne işe yaradığını keşfet.",
    "fixesIntro": "<strong>Olur böyle, hiç sorun değil.</strong> Ne gördüğüne göre sırayla bak:",
    "fixes": [
      {
        "icon": "bulb",
        "title": "Yalnız bir LED mi yanıyor?",
        "text": "Yanmayan LED'in uzun bacağı kendi kablosunun sütununda mı, kısa bacağı kendi direncinde mi? Kodda o LED'in kendi <code>pinMode</code> satırı var mı?"
      },
      {
        "icon": "breadboard",
        "title": "İkinci LED hiç tepki vermiyor mu?",
        "text": "Sarı kablonun kart ucu <strong>MC</strong> yazan pinin altında mı? Kodda D6 bu pin. Yanındaki MI birinci LED'in pini."
      },
      {
        "icon": "alert",
        "title": "İki LED aynı anda mı yanıyor?",
        "text": "Aynı beklemeden önceki iki <code>digitalWrite</code> satırında biri <code>HIGH</code>, öteki <code>LOW</code> olmalı."
      },
      {
        "icon": "wrench",
        "title": "Hiçbiri yanmıyor mu?",
        "text": "Kod gerçekten yüklendi mi? <strong>Araçlar &gt; Kart</strong>'ta Deneyap Mini v2, <strong>Araçlar &gt; Port</strong>'ta bir port seçili mi? Sonra iki direncin de GND'ye ulaştığını kontrol et."
      }
    ]
  },
  "quizCelebrateSub": "6 sorunun hepsini doğru bildin. Rozet çok yakın!",
  "stepsData": [
    {
      "title": "Adım 1: Hedefi Gör",
      "desc": "Ders 1.2'de kurduğun LED devresi yerinde kalıyor. Yanına <strong>ikinci bir LED</strong> ekleyeceksin ve iki LED'i birbirinin <strong>zıttı</strong> çalıştıracaksın: biri yanarken öteki sönecek. Bir de pinlere sayı yerine <strong>isim</strong> vereceksin."
    },
    {
      "title": "Adım 2: Malzemeleri Topla",
      "desc": "Birinci LED devren tezgahında duruyor. Yeni gelenler: 1 LED, 1 adet 220 ohm direnç ve 2 jumper kablo. Malzemelerin hazırsa 'Malzemeleri Hazırladım!' butonuna bas."
    },
    {
      "title": "Adım 3: İkinci LED'i Ekle",
      "desc": "Kartını bilgisayara tak. Birinci devren şemadaki gibi duruyor; <strong>Hadi kuralım</strong>'a bas ve ikinci LED'in parçalarını birlikte, tek tek tak."
    },
    {
      "title": "Adım 4: Kodu Yükle",
      "desc": "Bu kod iki LED'i sırayla yakar. Kopyala, Arduino IDE'de karta yükle."
    },
    {
      "title": "Adım 5: Kodu Çalıştır",
      "desc": "Kodu yükledin. Şimdi LED'lerine bak: biri yanarken öteki sönüyor mu?"
    },
    {
      "title": "Adım 6: Kodu Keşfet",
      "desc": "Bu kodda iki yenilik var: en üstteki <code>const int</code> satırları ve her beklemeden önce <strong>iki</strong> <code>digitalWrite</code>. Koda satır satır tıklayarak her satırın ne yaptığını gör."
    },
    {
      "title": "Adım 7: Sen Yap",
      "desc": "Şimdi kodu sen değiştireceksin. Üç görev var; her birini Arduino IDE'de dene, karta yükle ve LED'lerine bak."
    },
    {
      "title": "Adım 8: Sınavı Geç",
      "desc": "6 soru. Dersi tamamlamak için hepsini doğru bilmen gerekiyor; yanlış cevapta tekrar deneyebilirsin."
    },
    {
      "title": "Adım 9: Rozetini Al",
      "desc": "Tebrikler! Ders 1.4'ü tamamladın. Merak ettiklerini <strong>AI Yoldaşına Sor</strong> butonuyla düşünerek keşfedebilirsin."
    }
  ],
  "wiringSteps": [
    "İkinci LED'i orta kanalın altındaki bloğa tak.",
    "Kartın <strong>D6</strong> pininden (kartta <strong>MC</strong> yazar) ikinci LED'in uzun bacağına kablo çek.",
    "İkinci LED'in kısa bacağını (−) ikinci 220 ohm dirence bağla.",
    "İkinci direncin boştaki ucunu, birinci direncin GND'ye giden sütununa kısa bir kabloyla bağla."
  ],
  "//wiringGuide": "ders.md §4'ün dort maddesi, kartin breadboard'a takili haline gore (bkz. dosya basi). Birinci zincir sahnede hep kurulu.",
  "wiringGuide": [
    {
      "ad": "İkinci LED",
      "adim3": ["led", "breadboard"],
      "xray": true,
      "neden": "İkinci ışık bu. Üst blokta yer kalmadı, o yüzden orta kanalın <b>altındaki</b> bloğa takılıyor.",
      "nereye": "Kanalın hemen altındaki sıraya. İki bacağı <b>yan yana iki ayrı</b> sütuna, <b>UZUN</b> bacak solda.",
      "kontrol": "Bacaklar iki ayrı sütunda mı? Uzun olan solda mı?"
    },
    {
      "ad": "Sarı kablo (D6)",
      "adim3": ["jumper", "kart"],
      "xray": true,
      "neden": "Elektriği karttan ikinci LED'e bu kablo taşır. Kodda bu pinin adı <b>D6</b>.",
      "nereye": "Bir ucu kartın <b>MC</b> yazan pininin altındaki boş deliğe (kodda D6). Öbür ucu ikinci LED'in <b>UZUN</b> bacağının sütununa.",
      "kontrol": "Kart ucu MC'de mi? Yanındaki MI birinci LED'in pini. Öbür uç ikinci LED'in uzun bacağıyla aynı sütunda mı?"
    },
    {
      "ad": "İkinci direnç",
      "adim3": ["direnc"],
      "xray": true,
      "neden": "Her LED'in <b>kendi</b> direnci olmalı. İki LED'i tek dirençle bağlarsan ikisi de sönük ve kararsız yanar.",
      "nereye": "Bir ucu ikinci LED'in <b>KISA</b> bacağının sütununa. Öbür ucu sağdaki boş bir sütuna.",
      "kontrol": "Direncin bir ucu ikinci LED'in kısa bacağıyla aynı sütunda mı?"
    },
    {
      "ad": "Kısa siyah kablo",
      "adim3": ["jumper"],
      "xray": true,
      "neden": "Elektriğin geri dönüş yolu. Kartın GND pininde boş delik kalmadı, orada birinci siyah kablo var. Ama birinci direncin sağ ucunun sütunu zaten GND'ye gidiyor: <b>aynı sütundaki delikler bağlıdır</b>.",
      "nereye": "Bir ucu ikinci direncin <b>boştaki</b> ucunun sütununa. Öbür ucu kanalın üstüne, birinci direncin sağ ucuyla <b>aynı sütundaki</b> boş bir deliğe.",
      "kontrol": "Devre tamam. Kodu bir sonraki adımda yükleyeceksin."
    }
  ],
  "senYap": [
    {
      "id": "birlikte",
      "gorev": "İki LED'i zıt değil, <strong>birlikte</strong> çalıştır: ikisi aynı anda yansın, aynı anda sönsün.",
      "ipucu": "Hangi satırlara dokunman gerekiyor? Aynı beklemeden önceki iki <code>digitalWrite</code> satırı bu kez <strong>aynı</strong> değeri almalı.",
      "tip": "yaptim",
      "etiket": "Yaptım, ikisi birlikte yanıp sönüyor"
    },
    {
      "id": "esik",
      "gorev": "İki <code>delay(300)</code> satırını, 1.3'te bulduğun eşik değerine yaklaşana kadar küçült. Sönmeyi hâlâ görebiliyor musun?",
      "ipucu": "İki <code>delay()</code> satırını da değiştir, karta yeniden yükle. Doğru ya da yanlış cevap yok; senin gözün ne görüyorsa o.",
      "tip": "gozlem",
      "secenekler": ["Hâlâ yanıp söndüklerini görüyorum", "İkisi de sürekli yanıyor gibi"]
    },
    {
      "id": "isim",
      "gorev": "LED'lerine rengine göre isim ver: kodda <code>birinciLed</code> yazan her yeri değiştir (ör. <code>kirmiziLed</code>).",
      "soru": "Kodda <code>birinciLed</code> kelimesi kaç kez geçiyordu?",
      "ipucu": "Kodu yukarıdan aşağı oku. <code>birinciLed</code> kelimesini her gördüğünde bir say. <code>ikinciLed</code>'i sayma.",
      "tip": "sayi",
      "cevap": 4,
      "dogru": "Evet, <strong>4</strong> kez. İsmi değiştirirken dördünü de değiştirmelisin; birini unutursan kod çalışmaz."
    }
  ],
  "yetiskinKarti": [
    "İki LED'in de uzun bacağı kendi kablosuna, kısa bacağı kendi direncine mi gidiyor?",
    "Her LED'in ayrı direnci ve GND'ye giden bir yolu var mı?",
    "Kodda iki LED için ayrı <code>pinMode</code> satırı ve her beklemede zıt <code>HIGH</code>/<code>LOW</code> durumu var mı?"
  ],
  "merakKosesi": {
    "baslik": "Merak Köşesi: pine neden isim verdik?",
    "sahne": [{"tip": "isim", "ad": "birinciLed", "pin": "D5", "renk": "kirmizi", "yazi": "İsim en üstte bir kez verilir."}, {"tip": "yaz", "ad": "birinciLed", "pin": "D5", "yuksek": true, "renk": "kirmizi", "yazi": "Kodun geri kalanı yalnız ismi kullanır."}, {"tip": "isim", "ad": "birinciLed", "pin": "D6", "renk": "kirmizi", "yazi": "Kabloyu D6'ya taşırsan yalnız isim satırını değiştirirsin."}, {"tip": "yaz", "ad": "birinciLed", "pin": "D6", "yuksek": true, "renk": "kirmizi", "yazi": "Gerisi kendiliğinden doğru kalır."}],
    "metin": "Pin numarasını her satırda yazmak yerine en üstte bir kez isim verdik. Kabloyu başka bir pine taşırsan yalnız o isim satırını değiştirirsin, gerisi kendiliğinden doğru kalır. İsimler kartı yavaşlatmaz: kod karta giderken isimlerin yerine pin karşılıkları yazılır. <code>delay()</code> ise programı bekletir; bu yüzden bu derste iki LED'e birbirinden bağımsız, farklı ritimler veremiyoruz — o iş ileride."
  },
  "ctlLines": [
    {
      "code": "/* BU KOD NE YAPAR?",
      "desc": "Kodun en üstündeki not: kart okumaz, ne yaptığını bize anlatır."
    },
    {
      "code": "  Bu kod, D5 ve D6 pinlerine bağlı iki LED'i 300 ms aralıkla sırayla yakar:",
      "desc": "D5 ve D6'daki iki LED 300 ms aralıkla sırayla yanar."
    },
    {
      "code": "  biri yanarken öbürü söner, sonra roller değişir ve bu sürekli tekrarlanır.",
      "desc": "Biri yanarken öbürü söner, sonra yer değiştirirler."
    },
    {
      "code": "*/",
      "desc": "Not burada biter."
    },
    {
      "code": "",
      "desc": "Boş satır; kodun okunabilirliği için boşluk bırakılır."
    },
    {
      "code": "// Her pine, kartın D-etiketiyle bir isim veriyoruz.",
      "desc": "Bu bir yorum satırı: kart onu okumaz, bizim için not."
    },
    {
      "code": "const int birinciLed = D5;",
      "desc": "D5 pinine <code>birinciLed</code> adı verilir. <code>const</code>, bu adın karşılığındaki pinin değişmeyeceğini söyler. Kartta bu pinin yanında <strong>MI</strong> yazar."
    },
    {
      "code": "const int ikinciLed = D6;",
      "desc": "D6 pinine <code>ikinciLed</code> adı verilir. Kartta bu pinin yanında <strong>MC</strong> yazar."
    },
    {
      "code": "",
      "desc": "Boş satır; kodun okunabilirliği için boşluk bırakılır."
    },
    {
      "code": "void setup() {",
      "desc": "<strong>Kara kutu:</strong> <code>void</code>, bu kod bölümünün sonunda bir değer vermediğini anlatır. Şimdilik <code>setup</code> ve <code>loop</code> adlarının önünde durduğunu bilmen yeterli."
    },
    {
      "code": "  pinMode(birinciLed, OUTPUT);",
      "desc": "Birinci LED'in pinini elektrik gönderen çıkış yapar. <strong>Kara kutu:</strong> <code>OUTPUT</code>, pinin bilgi almak yerine dışarıya elektrik vereceğini işaretler."
    },
    {
      "code": "  pinMode(ikinciLed, OUTPUT);",
      "desc": "İkinci pin için de <strong>ayrı</strong> ayar gerekir; iki çıkış birbirinden bağımsızdır."
    },
    {
      "code": "}",
      "desc": "<code>setup</code> bitti. Bu bölüm kart açılınca bir kez çalışır."
    },
    {
      "code": "",
      "desc": "Boş satır; kodun okunabilirliği için boşluk bırakılır."
    },
    {
      "code": "void loop() {",
      "desc": "<code>loop()</code> içindeki satırlar <code>setup</code> bitince sürekli baştan tekrar eder."
    },
    {
      "code": "  digitalWrite(birinciLed, HIGH); // Birinci LED yanar.",
      "desc": "Birinci LED yanar."
    },
    {
      "code": "  digitalWrite(ikinciLed, LOW);   // İkinci LED söner.",
      "desc": "Aynı anda ikinci LED söner. Biri yanarken öteki sönüyor: buna <strong>zıt durum</strong> denir."
    },
    {
      "code": "  delay(300);",
      "desc": "Bu zıt durumu 300 milisaniye korur. Sayı küçüldükçe yer değiştirme hızlanır."
    },
    {
      "code": "",
      "desc": "Boş satır; iki yarıyı gözle ayırmak için."
    },
    {
      "code": "  digitalWrite(birinciLed, LOW);  // Birinci LED söner.",
      "desc": "Durumlar yer değiştirir: birinci LED söner..."
    },
    {
      "code": "  digitalWrite(ikinciLed, HIGH);  // İkinci LED yanar.",
      "desc": "...ve ikinci LED yanar."
    },
    {
      "code": "  delay(300);",
      "desc": "Yine 300 milisaniye bekle. Bir tam tur iki bekleme sürer: 300 + 300 = 600 milisaniye."
    },
    {
      "code": "}",
      "desc": "<code>loop()</code> bitti. Döngü buradan en başa döner ve tekrar başlar."
    }
  ],
  "quizQuestions": [
    {
      "q": "İki LED kullanırken neden iki <code>pinMode</code> satırı gerekir?",
      "options": ["Kart iki satır istemeden çalışmaz", "Her LED ayrı bir pin kullandığı için", "Her LED'in iki bacağı olduğu için", "<code>delay()</code> iki kez yazıldığı için"],
      "answer": "078ea851",
      "hint": "Her pinin ayarı kendine aittir: D5'i çıkış yapmak D6'yı çıkış yapmaz.",
      "ipucu": "Her pinin ayarı kendine aittir. Kodda iki LED kaç farklı pine bağlı?"
    },
    {
      "q": "Zıt durum ne demektir?",
      "options": ["İki LED aynı anda yanar", "İki LED aynı anda söner", "Biri yanarken diğeri söner", "LED'ler ters takılır"],
      "answer": "f97764c9",
      "hint": "Birine <code>HIGH</code> yazılırken ötekine <code>LOW</code> yazılıyor.",
      "ipucu": "Kodda birine <code>HIGH</code> yazılırken ötekine ne yazılıyor?"
    },
    {
      "q": "<code>const int ikinciLed = D6;</code> satırının görevi nedir?",
      "options": ["D6'ya ikinci LED adını verir", "İkinci LED'i hemen yakar", "D6'yı GND yapar", "6 saniye bekler"],
      "answer": "19010301",
      "hint": "Bu satır bir isim verir; LED'i yakan <code>digitalWrite</code>'tır.",
      "ipucu": "Bu satır <code>digitalWrite</code> değil. Eşittir işaretinin solunda ne var, sağında ne var?"
    },
    {
      "q": "<code>delay()</code> sayısını küçülttüğünde ne olur?",
      "options": ["LED'ler daha seyrek yanar", "LED'ler daha sık durum değiştirir", "İkinci LED devreden çıkar", "Direncin değeri değişir"],
      "answer": "6e7e484b",
      "hint": "Bekleme kısalınca yer değiştirme daha sık olur.",
      "ipucu": "Bekleme süresi kısalıyor. Bir sonraki yer değiştirme daha erken mi gelir, daha geç mi?"
    },
    {
      "q": "LED'ler çok hızlıyken sürekli yanıyor gibi görünüyorsa gerçekte ne olabilir?",
      "options": ["LED hiç sönmüyordur", "Gözün sönmeleri ayırt edemiyordur", "Kart <code>delay</code> satırlarını atlıyordur", "Direnç LED'i açık tutuyordur"],
      "answer": "5acef4c5",
      "hint": "1.3'teki görme eşiği: sınırı koyan LED değil, göz.",
      "ipucu": "1.3'te bulduğun görme eşiğini hatırla: sınırı koyan parça LED mi, göz mü?"
    },
    {
      "q": "Birinci LED'in kablosunu D5'ten başka bir pine taşırsan, isim kullanan kodda hangi satırı değiştirmek yeterlidir?",
      "options": ["<code>const int birinciLed = D5;</code> satırı", "İki <code>digitalWrite</code> satırı", "İki <code>delay</code> satırı", "Hiçbir satır"],
      "answer": "53e44ffb",
      "hint": "D5 bilgisi kodda yalnız bir kez, isim satırında yazıyor.",
      "ipucu": "D5 bilgisi kodda nerede yazıyor? Kaç kez yazıyor?"
    }
  ],
  "aiPrompts": [
    {
      "level": 1,
      "cat": "Kavramsal Anlama",
      "catColor": "green",
      "title": "Zıt Durum Nedir?",
      "prompt": "Sen sabırlı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, iki LED ve her biri için 220 ohm direnç kullanıyorum. Kodumda iki LED sırayla yanıyor. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. Cevabı doğrudan söylemeden, tahterevalli benzetmesiyle zıt durumun ne olduğunu bulduracak tek bir soru sor."
    },
    {
      "level": 1,
      "cat": "Kavramsal Anlama",
      "catColor": "green",
      "title": "Pine Neden İsim Verdik?",
      "prompt": "Sen sabırlı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, iki LED ve her biri için 220 ohm direnç kullanıyorum. Kodumda const int ile isim veriyorum. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. Cevabı söylemeden, telefon rehberi benzetmesiyle sayıya isim vermenin neden işime yarayacağını düşündürecek bir soru sor."
    },
    {
      "level": 2,
      "cat": "Tartışma",
      "catColor": "blue",
      "title": "Görme Eşiği Geri Döndü",
      "prompt": "Sen meraklı bir rehbersin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, iki LED ve her biri için 220 ohm direnç kullanıyorum; 1.3'te (LED'i hızlandır dersinde) bir görme eşiği bulmuştum. Şimdi iki LED'i hızlandırınca ikisi de sürekli yanıyor gibi görünüyor. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. Cevabı söylemeden, bu durumun 1.3'teki bulgumla nasıl bağlantılı olduğunu bana sorduracak tek bir soru sor."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "void Nedir?",
      "prompt": "Sen meraklı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, iki LED ve her biri için 220 ohm direnç kullanıyorum. Kodumda void setup() yazıyor. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. Cevabı vermeden, void kelimesinin kod bölümünün sonunda bir şey verip vermemesiyle ilgili olabileceğini düşündürecek bir soru sor; konu ileride açılacak."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "OUTPUT Nedir?",
      "prompt": "Sen meraklı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, iki LED ve her biri için 220 ohm direnç kullanıyorum. Kodumda OUTPUT yazıyor. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. Cevabı vermeden, bir pinin dışarıya elektrik verme veya dışarıdan bilgi alma görevi olabileceğini düşündürecek bir soru sor; konu buton dersinde açılacak."
    }
  ]
};
