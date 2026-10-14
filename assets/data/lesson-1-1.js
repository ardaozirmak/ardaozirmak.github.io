window.LESSON_DATA_1_1 = {
  "xpPrefix": "l11",
  "quizStorageKey": "quiz_lesson_1_1_passed",
  "materials": {
    "icon": "icon-box",
    "items": [
      "Deneyap Mini v2 Kartı",
      "Type-C USB Veri Kablosu"
    ],
    "note": "Başka hiçbir harici elemana (direnç, breadboard) ihtiyacımız yok!",
    "readyMessage": "Harika! Deneyap Mini v2 ve Type-C kablosu hazır."
  },
  "//parcalar": "Adim 3 parca tanitimi. Arda (2026-09-28): 'sari bolgeye tikla kismini komple kaldir, 1.2'deki gibi kablo ve deneyapi tanit, gorselli, isterse okur.' Gorsel ve ad parts-gallery.js'ten (tek kaynak); kartin metni bu derse ozel, cunku 1.2'deki D5/GND burada yok.",
  "parcalar": {
    "sadece": ["kart", "usb"],
    "ozel": {
      "kart": {
        "short": "Devrenin beynidir. Kodu buna yükleyeceksin.",
        "lines": [
          "Kenarındaki küçük oval yuva <b>Type-C girişi</b>: kablo buraya takılır.",
          "Bu derste yakacağın ışık kartın üstünde duruyor: <b>Dahili LED</b>.",
          "Ona kablo takmana gerek yok, kodla yanar.",
          "Kablo takılınca kartın kırmızı güç ışığı yanar."
        ]
      }
    }
  },
  "pinMap": {
    "title": "Işık hangi pinde?",
    "body": "Yaktığın ışık kartın <strong>içinde</strong> duruyor. Diyagramda en solda alta bak: <strong>RGBLED</strong> yazan kutu. Yanındaki yıldız “bu pin dışarı çıkarılmamış” demek — yani ona kablo takacağın bir delik yok. Kod onu deliğinden değil, adından bulur.",
    "alt": "Deneyap Mini v2 genişletilmiş pin diyagramı. Sol altta RGBLED pini D14, GPKEY pini D13 olarak gösteriliyor; yıldız dipnotu bu iki pinin kart kenarındaki deliklere çıkarılmadığını söylüyor."
  },
  "helpPrompt": "Deneyap Mini v2 kartıyla ilk kez kod yazan bir öğrenciyim. Arduino IDE'de kodu karta yükledim ama kartın üzerindeki LED yanmıyor. Bana yardım et ama hepsini birden anlatma: her seferinde TEK bir soru sor, cevabımı bekle, sonra bir sonraki adıma geç. Kontrol edilecekler şunlar olabilir: USB kablosu veri kablosu mu yoksa sadece şarj kablosu mu, Arduino IDE'de Araçlar > Kart menüsünde 'Deneyap Mini v2' seçili mi, Araçlar > Port menüsünde bir port görünüyor mu, bilgisayarda CP210x USB sürücüsü kurulu mu, yükleme sırasında karttaki BOOT düğmesini basılı tutmak gerekiyor mu, Araçlar menüsündeki Upload Mode ve USB CDC On Boot ayarları doğru mu. Ayrıca ekranda 'stray ... in program' veya 'was not declared in this scope' gibi bir hata görüyorsam bunun ne demek olduğunu sor ve bana açıkla. Şunu da bil ve gerekirse bana sade bir dille açıkla: bu karttaki renkli dahili LED RGBLED adıyla çağrılır ve resmî genişletilmiş pin diyagramında D14 olarak görünür, ama bu pin kartın kenarındaki deliklere çıkarılmamıştır, yani ona kablo bağlanamaz. Bu yüzden kodumuzda pinMode satırı YOKTUR: pinMode bir pini giriş ya da çıkış yapmak için kullanılır, ama neopixelWrite komutu dahili RGB LED'i kendisi sürer, hazırlanacak bir pin yoktur. Başka örneklerde setup içinde pinMode(LED_BUILTIN, OUTPUT); satırını görebilirim; o satır bu kodda hiçbir işe yaramaz, çünkü LED_BUILTIN farklı bir pindir. Deneyap Mini v2 için iki farklı resmî pin diyagramı dolaşıyor ve bunlar çelişebiliyor; doğru olan GENİŞLETİLMİŞ pin diyagramıdır. Bana kısa cümlelerle, yaşıma uygun ve sabırlı bir dille anlat.",
  "ledCheck": {
    "question": "Kartındaki LED yanıp sönüyor mu?",
    "yesLabel": "Evet, yanıp sönüyor!",
    "noLabel": "Hayır, bir şey olmadı",
    "successText": "<strong>İşte bu!</strong> Kendi yazdığın kod gerçek bir donanımı çalıştırdı. Şimdi İleri'ye basıp hızını sen ayarlamayı öğren.",
    "fixesIntro": "<strong>Olur böyle, hiç sorun değil.</strong> Sırayla şunlara bak:",
    "fixes": [
      { "icon": "plug", "title": "Kablo.", "text": "Kartın üzerindeki kırmızı ışık yanıyor mu? Yanmıyorsa kablo sadece şarj kablosu olabilir — başka bir kablo dene." },
      { "icon": "box", "title": "Kart ve port.", "text": "Arduino'da <code>Araçlar &gt; Kart</code> \"Deneyap Mini v2\" mi? <code>Araçlar &gt; Port</code>'ta bir seçenek var mı?" },
      { "icon": "clipboard", "title": "Kodu tekrar yükle.", "text": "Kodu yeniden kopyala, yapıştır ve <strong>Yükle</strong>'ye bir daha bas." }
    ]
  },
  "quizCelebrateSub": "3 sorunun hepsini doğru bildin. Rozet çok yakın!",
  "stepsData": [
    {
      "title": "Adım 1: Hedefi Gör",
      "desc": "Merhaba Genç Mucit! Deneyap Atölyem'e hoş geldin. Bugün, alt tarafta gördüğün Deneyap Mini v2 kartımızın tam kalbinde yer alan o minik mavi ışığı (dahili LED) Arduino IDE ortamında kendi yazdığımız kodla canlandıracağız. Hazırsan başlayalım!"
    },
    {
      "title": "Adım 2: Malzemeleri Topla",
      "desc": "İhtiyacımız olanlar çok basit: 1 adet Deneyap Mini v2 Kartı ve 1 adet Type-C USB Veri Kablosu. Başka hiçbir harici elemana (direnç, breadboard) ihtiyacımız yok! Aşağıdaki listeden malzemelerini masana koyduktan sonra 'Malzemeleri Hazırladım!' butonuna bas."
    },
    {
      "title": "Adım 3: Kartı Bağla",
      "desc": "Bu derste iki parçan var: Deneyap kartı ve Type-C kablosu. Sonra <strong class=\"desc-emphasis\">kablonun küçük ucunu karta, diğer ucunu bilgisayarına tak.</strong> Kırmızı güç ledi yanınca bağlantı tamamdır."
    },
    {
      "title": "Adım 4: Arduino'yu Kur",
      "desc": "Aşağıdaki öğretim videosunu adım adım izleyerek Arduino IDE kurulumunu tamamla."
    },
    {
      "title": "Adım 5: Kodu Çalıştır",
      "desc": "Kodu kopyala, Arduino IDE'ye yapıştır. Kart ve Port'u seçip 'Yükle'ye bas. Kartta mavi LED yanıp sönüyorsa başardın!"
    },
    {
      "title": "Adım 6: Kodu Keşfet",
      "desc": "Alttaki çubuğu kaydır ve LED'in yanıp sönme hızının nasıl değiştiğine bak. Sonra koda satır satır tıkla, her satırın ne yaptığını öğren."
    },
    {
      "title": "Adım 7: Sınavı Geç",
      "desc": "Bakalım kodun mantığını ne kadar kavradın? 3 soruluk teste katıl, dersi tamamlamak için hepsini doğru bilmen gerekiyor."
    },
    {
      "title": "Adım 8: AI'a Sor",
      "desc": "Tebrikler, sınavı geçtin! Aşağıdaki <strong>AI Yoldaşına Sor</strong> butonuna bas, bir prompt seç ve kendi AI aracına yapıştır. Hazır olunca rozetin için İleri'ye bas."
    },
    {
      "title": "Adım 9: Rozetini Al",
      "desc": "Tebrikler! Ders 1.1'i tamamladın. 'İlk Kıvılcım Rozeti' profiline eklendi, 'Ders 1.2: Harici LED Devresi' kilidi açıldı."
    }
  ],
  "ctlLines": [
    {
      "code": "/* BU KOD NE YAPAR?",
      "desc": "Kodun en üstündeki not: kart okumaz, ne yaptığını bize anlatır."
    },
    {
      "code": "  Bu kod, kartın üzerindeki renkli (RGB) LED'i (RGBLED) 1 saniye mavi yakar (0, 0, 40),",
      "desc": "Kartın üzerindeki renkli LED 1 saniye mavi yanar."
    },
    {
      "code": "  1 saniye söndürür ve bunu sürekli tekrarlar.",
      "desc": "Sonra 1 saniye söner ve bu hiç durmadan tekrar eder."
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
      "code": "// Deneyap Mini v2 Dahili LED Yakıp Söndürme Kodu",
      "desc": "Bu satır bir yorumdur (açıklama). Yorumlar kart tarafından çalıştırılmaz; kodu okuyan kişiye bilgi verir."
    },
    {
      "code": "void setup() {",
      "desc": "setup() fonksiyonu kart açıldığında SADECE BİR KEZ çalışır. Hazırlık işlemleri buraya yazılır. <strong>Bu derste hazırlanacak bir şey yok</strong>, o yüzden içi boş: yakacağımız ışık kartın içinde, onu kabloyla bir pine bağlamadık."
    },
    {
      "code": "}",
      "desc": "setup() fonksiyonunun kapanış süslü parantezi."
    },
    {
      "code": "",
      "desc": "Boş satır; kodun okunabilirliği için boşluk bırakılır."
    },
    {
      "code": "void loop() {",
      "desc": "loop() fonksiyonu kart çalıştığı sürece SONSUZA KADAR tekrar tekrar çalışan ana döngüdür."
    },
    {
      "code": "  neopixelWrite(RGBLED, 0, 0, 40);",
      "desc": "loop() döngüsü başladığında neopixelWrite(RGBLED, 0, 0, <strong>40</strong>) komutu dahili RG<strong>B</strong> LED'in Mavi kanalına değer gönderir. Böylece kart üzerindeki dahili LED mavi ışık vermeye başlar."
    },
    {
      "code": "  delay(1000);",
      "desc": "Sistemi 1000 milisaniye (1 saniye) bekletir. LED bu süre boyunca yanık kalır."
    },
    {
      "code": "  neopixelWrite(RGBLED, 0, 0, 0);",
      "desc": "Üç rengi de 0 yapar → LED SÖNER."
    },
    {
      "code": "  delay(1000);",
      "desc": "Sistemi 1 saniye daha bekletir; ardından döngü başa döner ve LED yeniden yanar."
    },
    {
      "code": "}",
      "desc": "loop() fonksiyonunun kapanış süslü parantezi. Döngü buradan tekrar başlar."
    }
  ],
  "quizQuestions": [
    {
      "q": "Kodumuzda delay(500); satırını kullandığımızda Deneyap Kartımız ne kadar süre bekler?",
      "options": [
        "5 saniye",
        "Yarım saniye",
        "50 saniye",
        "Bekleme yapmadan geçer."
      ],
      "answer": "d8fcbe5f",
      "hint": "",
      "ipucu": "<code>delay()</code> içindeki sayı <strong>milisaniye</strong>dir. 1000 milisaniye = 1 saniye. Şimdi düşün: 500, 1000'in ne kadarı?"
    },
    {
      "q": "Deneyap Kartımızın dahili (RGB) LED'ine enerji verip onu mavi yakmak için hangi komut kullanılır?",
      "options": [
        "digitalRead(RGBLED, HIGH);",
        "neopixelWrite(RGBLED, 0, 0, 40);",
        "pinMode(RGBLED, OUTPUT);",
        "analogWrite(RGBLED, 255);"
      ],
      "answer": "68cd54ac",
      "hint": "pinMode bir ayar (portu hazırlamak), neopixelWrite ise eylemdir: RGB LED'in Kırmızı/Yeşil/Mavi kanallarına değer göndererek onu istenen renkte yakmak.",
      "ipucu": "Komutların adına bak: <em>Read</em> okumak, <em>Write</em> yazmak demek. LED'i yakmak için ona bir şey göndermen gerekir. Renk gönderen komutta üç sayı vardır ve sırası <strong>Kırmızı, Yeşil, Mavi</strong>'dir. Mavi yanacaksa hangi sıradaki sayı dolu olmalı?"
    },
    {
      "q": "Deneyap Kartımızın dahili (RGB) LED'ine enerji verip onu <strong>kırmızı</strong> yakmak için hangi komut kullanılır?",
      "options": [
        "digitalRead(RGBLED, HIGH);",
        "neopixelWrite(RGBLED, 40, 0, 0);",
        "pinMode(RGBLED, OUTPUT);",
        "analogWrite(RGBLED, 255);"
      ],
      "answer": "1e8affeb",
      "hint": "neopixelWrite(pin, Kırmızı, Yeşil, Mavi) sıralamasında ilk sayı Kırmızı kanalına gider. Kırmızıyı yakmak için o kanala değer (40) verilir, diğer ikisi 0 kalır.",
      "ipucu": "Bir önceki soruyu hatırla: renk komutundaki üç sayının sırası <strong>Kırmızı, Yeşil, Mavi</strong>. Kırmızı istiyorsan kaçıncı sayı 0'dan büyük olmalı?"
    }
  ],
  "aiPrompts": [
    {
      "level": 1,
      "cat": "Kavramsal Anlama",
      "catColor": "green",
      "title": "setup() ve loop() Farkı",
      "prompt": "setup() fonksiyonu ile loop() fonksiyonu arasındaki fark nedir?"
    },
    {
      "level": 1,
      "cat": "Kavramsal Anlama",
      "catColor": "green",
      "title": "neopixelWrite Nasıl Çalışır?",
      "prompt": "neopixelWrite(RGBLED, 0, 0, 40) satırındaki sayılar ne anlama geliyor?"
    },
    {
      "level": 1,
      "cat": "Zamanlama",
      "catColor": "amber",
      "title": "delay() Süresini Değiştirmek",
      "prompt": "delay(1000) satırındaki sayı azaldıkça ne değişir?"
    }
  ]
};
