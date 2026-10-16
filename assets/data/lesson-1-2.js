window.LESSON_DATA_1_2 = {
  "xpPrefix": "l12",
  "quizStorageKey": "quiz_lesson_1_2_passed",
  "materials": {
    "icon": "icon-box",
    "items": [
      "Deneyap Mini v2 Kartı",
      "Type-C USB Kablosu",
      "1 LED",
      "1 adet 220 ohm Direnç",
      "Breadboard",
      "2 Adet Erkek-Erkek Jumper Kablo"
    ],
    "note": "",
    "readyMessage": "Harika! Malzemelerin hazır."
  },
  "//wiringVideo": "Devre kurma videosu cekilince burasi doldurulacak: { src, poster, title, desc }. null/eksikken Adim 4'te video kutusu hic cizilmez.",
  "wiringVideo": null,
  "helpPrompt": "Deneyap Mini v2 kartıyla breadboard üzerinde harici bir LED devresi kurdum: LED'in uzun bacağı (+) jumper kabloyla D5 pinine, kısa bacağı (−) 220 ohm direnç üzerinden GND pinine bağlı. Arduino IDE'de digitalWrite ile yazdığım kodu karta yükledim ama LED yanmıyor. Bana yardım et ama hepsini birden anlatma: her seferinde TEK bir soru sor, cevabımı bekle, sonra bir sonraki adıma geç. Kontrol edilecekler şunlar olabilir: LED ters takılmış olabilir mi, breadboard'da aynı sütundaki delikler birbirine bağlı olduğu için LED bacağı, direnç ucu ve jumper kablo doğru sütunlarda mı, koddaki pin adı (D5) ile kablonun takılı olduğu pin aynı mı, direnç gerçekten 220 ohm mu, USB kablosu veri kablosu mu yoksa sadece şarj kablosu mu, Arduino IDE'de Araçlar > Kart menüsünde 'Deneyap Mini v2' seçili mi, Araçlar > Port menüsünde bir port görünüyor mu, bilgisayarda CP210x USB sürücüsü kurulu mu, yükleme sırasında karttaki BOOT düğmesini basılı tutmak gerekiyor mu, Araçlar menüsündeki Upload Mode ve USB CDC On Boot ayarları doğru mu. Ayrıca ekranda 'stray ... in program' veya 'was not declared in this scope' gibi bir hata görüyorsam bunun ne demek olduğunu sor ve bana açıkla. Bana kısa cümlelerle, yaşıma uygun ve sabırlı bir dille anlat.",
  "ledCheck": {
    "question": "Kurduğun devredeki LED yanıp sönüyor mu?",
    "yesLabel": "Evet, yanıp sönüyor!",
    "noLabel": "Hayır, bir şey olmadı",
    "successText": "<strong>İşte bu!</strong> Devreyi sen kurdun, kodu sen yazdın ve ikisi birlikte çalıştı. Şimdi İleri'ye basıp kodun her satırının ne yaptığını keşfet.",
    "fixesIntro": "<strong>Olur böyle, hiç sorun değil.</strong> Sırayla şunlara bak:",
    "fixes": [
      {
        "icon": "bulb",
        "title": "LED'in yönü.",
        "text": "Uzun bacak (+) D5 kablosunun geldiği tarafta mı? Ters taktıysan LED yanmaz — bacakları yer değiştirip tekrar dene."
      },
      {
        "icon": "breadboard",
        "title": "Aynı sütun.",
        "text": "Breadboard'da aynı sütundaki delikler birbirine bağlıdır. LED'in bacağı, direncin ucu ve jumper kablo aynı sütunda mı?"
      },
      {
        "icon": "box",
        "title": "Pin adı.",
        "text": "Kabloyu taktığın pin ile kodda yazan pin aynı mı? Kodda <code>D5</code> yazıyorsa kablo da kartın <strong>D5</strong> pininde olmalı."
      }
    ]
  },
  "quizCelebrateSub": "Harici LED devresini çözdün. Rozet çok yakın!",
  "stepsData": [
    {
      "title": "Adım 1: Hedefi Gör",
      "desc": "Ders 1.1'de kartın üzerindeki hazır LED'i yaktın. Bu sefer LED kartın üzerinde değil, senin kurduğun bir devrenin üzerinde. Bir LED'i, bir direnci ve birkaç kabloyu doğru sırayla bağlayıp aynı yakıp-söndürme işini kendi devrende çalıştıracaksın — ve bunu Ders 1.1'de görmediğin yeni bir komutla, <strong>digitalWrite</strong> ile yapacaksın."
    },
    {
      "title": "Adım 2: Malzemeleri Topla",
      "desc": "Bu derste ihtiyacımız olanlar: 1 adet Deneyap Mini v2 Kartı, 1 adet Type-C USB Kablosu, 1 LED, 1 adet 220 ohm Direnç, 1 Breadboard ve 2 adet Erkek-Erkek Jumper Kablo. Malzemelerini masana koyduktan sonra 'Malzemeleri Hazırladım!' butonuna bas."
    },
    {
      "title": "Adım 3: Parçaları Tanı",
      "desc": "Masandaki parçaları tek tek tanıyalım. Her kartta bir parça var: ne işe yaradığı ve nereye takılacağı. Merak ettiğini <strong>Yakından bak</strong> ile aç."
    },
    {
      "//desc-adim4": "BOŞ BIRAKILDI (2026-09-19). Bu paragraf iki satır tutuyordu ve rehber kartının söylediğini tekrarlıyordu; 57px'lik yeri yüzünden Geri/İleri çubuğu ekranın altında kalıyordu. Taşıdığı iki bilgi kaybolmadı: 'devreyi kur' -> başlık + rehber kartı, 'kod aşağıda çıkacak' -> boş tezgahta rehber kartının ikinci satırı (wiring-diagram.js paintGuide).",
      "title": "Adım 4: Devreyi Kur",
      "desc": ""
    },
    {
      "title": "Adım 5: Kodu Çalıştır",
      "desc": "Kodu yükledin. Şimdi kendi devrendeki LED'e bak: saniyede bir yanıp sönüyor mu?"
    },
    {
      "title": "Adım 6: Kodu Keşfet",
      "desc": "Kod, Ders 1.1'deki mantıkla neredeyse aynı — tek fark, <code>neopixelWrite</code> yerine daha basit bir komut olan <code>digitalWrite</code> kullanmamız ve ışığın kartın içinde değil, senin kurduğun devrede <strong>D5</strong> pinine bağlı olması. Koda satır satır tıklayarak her satırın ne işe yaradığını öğren, sonra alttaki 3 görevi dene."
    },
    {
      "title": "Adım 7: Sınavı Geç",
      "desc": "Harici LED devresi mantığını ne kadar kavradın? 3 soruluk teste katıl, dersi tamamlamak için hepsini doğru bilmen gerekiyor."
    },
    {
      "title": "Adım 8: AI'a Sor",
      "desc": "Mini sınavı geçtin, tebrikler! Şimdi öğrendiklerini pekiştirmek için aşağıdaki <strong>AI Yoldaşına Sor</strong> butonuna bas ve Sokratik sorulardan birini seç: AI yardımcın burada, sana sorular sorarak düşündürür. Hazır olduğunda rozetini almak için İleri'ye bas."
    },
    {
      "title": "Adım 9: Rozetini Al",
      "desc": "Tebrikler! Ders 1.2'yi başarıyla tamamladın. 'İkinci Kıvılcım Rozeti' Deneyap Atölyem profil yerel hafızana eklendi."
    }
  ],
  "wiringSteps": [
    "Deneyap kartı breadboard'a tak: USB-C girişi solda, pin sıraları orta kanalın iki yanında.",
    "LED'i breadboard'a tak.",
    "LED'in uzun bacağından (+) bir jumper kabloyla kartın <strong>D5</strong> pinine bağlan — kartta o pinin yanında <strong>MI</strong> yazar.",
    "LED'in kısa bacağını (−) 220 ohm dirence bağla.",
    "Direncin diğer ucundan bir jumper kabloyla kartın <strong>GND</strong> pinine bağlan."
  ],
  "//wiringGuide": "Adim 4 rehberli kurulum: her parcanin NEDEN/NEREYE/KONTROL metni. Sira wiringSteps ile AYNI: kart, LED, kirmizi kablo, direnc, siyah kablo. Hedef kitle 5. sinif: ~8-9 kelimelik cumleler, 'anot'/'katot' YASAK.",
  "//wiringGuide-adim3": "adim3 = o parcanin Adim 3 (Parcalari Tani) kartlarindan hangileri rehberde geri cagrilacak. METIN BURAYA YAZILMAZ, yalnizca id verilir; cumleler PartsGallery.get(id) ile tek kaynaktan okunur. xray:true = o adimda soru 'ayni sutunda mi' oldugu icin cocuk tahtanin icini gormeli, 'Icini gor' dugmesi nabiz atar.",
  "wiringGuide": [
    {
      "ad": "Deneyap kart",
      "adim3": ["kart", "breadboard"],
      "xray": true,
      "neden": "Devrenin beyni bu kart. Önce onu yerine oturt.",
      "nereye": "Kitten çıkardığın kartı tak: USB-C girişi <b>solda</b>, pinlerin bir sırası orta kanalın <b>üstünde</b>, öbürü <b>altında</b>. İki ucundan eşit bastır.",
      "kontrol": "Bütün pinler delikte mi? Kartın üstünde ve altında birer sıra boş delik kaldı mı? Kablolar oraya takılacak."
    },
    {
      "ad": "LED",
      "adim3": ["led", "breadboard"],
      "xray": true,
      "neden": "Yakacağımız ışık bu.",
      "nereye": "İki bacağı <b>yan yana iki ayrı</b> sütuna girsin. Aynı sütuna takarsan yanmaz. <b>UZUN</b> bacak solda, <b>KISA</b> bacak sağda.",
      "kontrol": "Bacaklar iki ayrı sütunda mı? Uzun olan solda mı? Kenardaki + ve − sıraları bu derste boş kalacak."
    },
    {
      "ad": "Kırmızı kablo",
      "adim3": ["jumper", "kart"],
      "xray": true,
      "neden": "Elektriği karttan LED'e bu kablo taşır.",
      "nereye": "Bir ucu kartın <b>D5</b> yazan pinine — kartta <b>MI</b> yazar. Öbür ucu LED'in <b>UZUN</b> bacağının sütununa.",
      "kontrol": "Kablo ile LED'in uzun bacağı aynı sütunda mı?"
    },
    {
      "ad": "Direnç",
      "adim3": ["direnc"],
      "xray": true,
      "neden": "Karttan gelen elektrik LED için fazla. Direnç onu kısar. Direnç takmazsan LED bir kez parlar, sonra bozulur.",
      "nereye": "Bir ucu LED'in <b>KISA</b> bacağının sütununa. Öbür ucu sağdaki boş bir sütuna.",
      "kontrol": "Direncin bir ucu LED'in kısa bacağıyla aynı sütunda mı? Yönü yoktur, ters takamazsın."
    },
    {
      "ad": "Siyah kablo",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "Elektriğin karta <b>geri dönme</b> yolu. Bu kablo olmadan devre kapanmaz, LED yanmaz.",
      "nereye": "Bir ucu direncin <b>boştaki</b> ucunun sütununa. Öbür ucu kartın <b>GND</b> pinine.",
      "kontrol": "Devre tamam. LED henüz <b>yanmaz</b> — karta kod yüklemedin. Kod hemen aşağıda."
    }
  ],
  "senYap": [
    "LED'in bacaklarını yer değiştirerek tak (ters bağla). Ne oluyor, gözlemle.",
    "LED'in kablosunu D5'ten (kartta MI) D6'ya (kartta MC) taşı. Kodda da neyi değiştirmen gerekiyor? Değiştir ve çalıştır.",
    "LED'i 3 saniye yanık, 1 saniye sönük kalacak şekilde çalıştır. Hangi satırları, nasıl değiştirmen gerekiyor?"
  ],
  "ctlLines": [
    {
      "code": "/* BU KOD NE YAPAR?",
      "desc": "Kodun en üstündeki not: kart okumaz, ne yaptığını bize anlatır."
    },
    {
      "code": "  Bu kod, D5 pinine bağlı harici LED'i 1 saniye yakar, 1 saniye söndürür",
      "desc": "D5 pinine bağladığın LED 1 saniye yanar, 1 saniye söner."
    },
    {
      "code": "  ve bunu sürekli tekrarlar.",
      "desc": "Bu hiç durmadan tekrar eder."
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
      "code": "// LED'in iki bacağı var: uzun bacak (+) ve kısa bacak (-) - yönü önemlidir, ters takarsan LED yanmaz",
      "desc": "LED'in iki bacağı var: uzun bacak (+) ve kısa bacak (−) — yönü önemlidir, ters takarsan LED yanmaz."
    },
    {
      "code": "// Direnç, LED'e çok fazla akım gitmesini engeller ve LED'i korur",
      "desc": "Direnç, LED'e çok fazla akım gitmesini engeller ve LED'i korur."
    },
    {
      "code": "void setup() {",
      "desc": "{ ve } arasındaki satırlar o fonksiyona ait koddur; bu blok \"başlangıç\" bloğudur."
    },
    {
      "code": "  pinMode(D5, OUTPUT);",
      "desc": "D5 pinini, açıp kapatabileceğimiz bir pin yap. Ders 1.1'de böyle bir satır yoktu: oradaki ışık kartın içindeydi, hazırlanacak bir pin yoktu. Burada ışığı sen bir pine bağladın, o yüzden önce o pini hazırlıyoruz. <strong>D5 kartın üzerinde yazan pin adıdır — düz 5 yazsaydık kart bunu farklı bir pin sanırdı, bu yüzden Deneyap'ta pin isimleri hep D ile başlar.</strong>"
    },
    {
      "code": "}",
      "desc": "; işareti bir komutun bittiğini gösterir; } bloğun bittiğini gösterir."
    },
    {
      "code": "",
      "desc": "Boş satır; kodun okunabilirliği için boşluk bırakılır."
    },
    {
      "code": "void loop() {",
      "desc": "loop() içindeki satırlar setup bitince sürekli baştan tekrar eder."
    },
    {
      "code": "  digitalWrite(D5, HIGH);",
      "desc": "<strong>Yeni komut.</strong> digitalWrite(pin, HIGH) o pine gerilim gönderir, pin \"açık\" olur → LED yanar. Ders 1.1'de dahili LED'i neopixelWrite ile yakmıştın; o üç kanala (kırmızı/yeşil/mavi) 0-255 arası sayı gönderip renk ayarlıyordu. digitalWrite bundan daha basit: pini sadece iki durumda tutar, açık ya da kapalı — renk yok."
    },
    {
      "code": "  delay(1000);",
      "desc": "1000 milisaniye (1 saniye) bekle."
    },
    {
      "code": "  digitalWrite(D5, LOW);",
      "desc": "digitalWrite(pin, LOW) pinin gerilimini keser, pin \"kapalı\" olur → LED söner."
    },
    {
      "code": "  delay(1000);",
      "desc": "1 saniye bekle."
    },
    {
      "code": "}",
      "desc": "loop() fonksiyonunun kapanış süslü parantezi. Döngü buradan tekrar başlar."
    }
  ],
  "quizQuestions": [
    {
      "q": "LED'in hangi bacağı karta, hangisi dirence bağlanır?",
      "options": [
        "Uzun bacak karta, kısa bacak dirence",
        "Kısa bacak karta, uzun bacak dirence",
        "İkisi de karta bağlanır",
        "İkisi de dirence bağlanır"
      ],
      "answer": "c2917fc2",
      "hint": "Uzun bacak anot (+), kısa bacak katot (−) ucudur — LED'ler yöne duyarlıdır.",
      "ipucu": "LED'in uzun bacağı <strong>artı (+)</strong> ucudur. Elektrik karttaki pinden çıkıp LED'e geliyor. Artı uç, elektriğin <em>geldiği</em> yere mi bağlanır, yoksa geri döndüğü yola mı? Devre çizimine bir daha bak."
    },
    {
      "q": "Bu derste direncin görevi nedir?",
      "options": [
        "LED'i daha parlak yapmak",
        "LED'e giden akımı sınırlayıp LED'i korumak",
        "Pin numarasını değiştirmek",
        "delay() süresini kısaltmak"
      ],
      "answer": "caa7a71c",
      "hint": "Direnç, Ohm Kanunu'na göre (V = I × R) akımı sınırlayarak LED'in yanmasını engeller.",
      "ipucu": "Direnç adını <em>direnmek</em>ten alır. Neye direniyor olabilir? Bir de şunu düşün: direnç olmasaydı LED'e giden elektrik ne olurdu, LED buna dayanabilir miydi?"
    },
    {
      "q": "digitalWrite(D5, HIGH); satırı ne yapar?",
      "options": [
        "D5 pinine gerilim gönderir, LED yanar",
        "D5 pininin modunu ayarlar",
        "5 saniye bekler",
        "LED'e renk gönderir"
      ],
      "answer": "897dd373",
      "hint": "Ders 1.1'deki neopixelWrite ile karıştırma — bu komut daha basit, sadece açık/kapalı.",
      "ipucu": "Komutu parçalara ayır: <em>digitalWrite</em> = yaz, <em>D5</em> = hangi pin, <em>HIGH</em> = yüksek (açık). Pinin modunu ayarlayan komut başkaydı, hatırla: <code>pinMode</code>. Bekleme yapan komut da <code>delay</code>."
    }
  ],
  "aiPrompts": [
    {
      "level": 1,
      "cat": "Kavramsal Anlama",
      "catColor": "green",
      "title": "LED'in İki Bacağı",
      "prompt": "LED'in uzun bacağı ile kısa bacağı arasındaki fark nedir?"
    },
    {
      "level": 1,
      "cat": "Kavramsal Anlama",
      "catColor": "green",
      "title": "digitalWrite Ne Yapar?",
      "prompt": "digitalWrite(D5, HIGH) satırı ne yapar?"
    },
    {
      "level": 1,
      "cat": "Devre",
      "catColor": "amber",
      "title": "Direnç Olmasaydı",
      "prompt": "Devredeki 220 ohm direnç olmasaydı ne olurdu?"
    }
  ]
};
