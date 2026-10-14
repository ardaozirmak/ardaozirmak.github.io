/* Ders 1.3 — LED'i Hızlandır.
   Kaynak: github.com/ozgur79/01_deneyapGiris_dk → dk0130_hizliLed/ders.md + .ino
   (Özgür kartta test etti, 2026-09-25; haritada portal_ders 1.3, ✅).
   Numara Portal-Ders-Haritasi.md'den. Devre Ders 1.2 ile birebir aynı, bu
   yüzden wiringSteps/wiringGuide 1.2'nin DOĞRULANMIŞ metninden geliyor:
   ders.md §4 "kart üzerinde D5 yazan pin" diyor, oysa kartta o pinin yanında
   MI yazıyor (resmi pin diyagramı, 1.2'de ölçüldü) — Özgür'e soruldu. */
window.LESSON_DATA_1_3 = {
  "xpPrefix": "l13",
  "quizStorageKey": "quiz_lesson_1_3_passed",
  "materials": {
    "icon": "icon-box",
    "items": [
      "Deneyap Mini v2 Kartı",
      "Type-C USB Kablosu",
      "1 LED",
      "1 adet 220 ohm Direnç",
      "Breadboard",
      "2 Adet Jumper Kablo"
    ],
    "note": "Hepsi Ders 1.2'deki malzemeler. Devren hâlâ kuruluysa hiç sökme.",
    "readyMessage": "Harika! Malzemelerin hazır."
  },
  "helpPrompt": "Deneyap Mini v2 kartıyla breadboard üzerinde bir LED devrem var: LED'in uzun bacağı (+) jumper kabloyla D5 pinine, kısa bacağı (−) 220 ohm direnç üzerinden GND pinine bağlı. Kartın mantık gerilimi 3.3V. Bu derste devreyi değiştirmiyorum, sadece koddaki iki delay() sayısını değiştiriyorum: LED yarım saniye yanık, yarım saniye sönük kalmalı. Ama LED beklediğim gibi davranmıyor. Bana yardım et ama hepsini birden anlatma: her seferinde TEK bir soru sor, cevabımı bekle, sonra bir sonraki adıma geç. Bana pin numarası, direnç değeri ya da bağlantı tarifi verme — devrem Ders 1.2'de çalıştı. Kontrol edilecekler şunlar olabilir: LED ters takılmış olabilir mi, koddaki iki delay() satırının ikisini de değiştirdim mi, değişikliği karta yeniden yükledim mi (dosyayı kaydetmek yetmez), Arduino IDE'de Araçlar > Kart menüsünde 'Deneyap Mini v2' seçili mi, Araçlar > Port menüsünde bir port görünüyor mu, USB kablosu veri kablosu mu yoksa sadece şarj kablosu mu. Ayrıca ekranda 'stray ... in program' veya 'was not declared in this scope' gibi bir hata görüyorsam bunun ne demek olduğunu sor ve bana açıkla. Bana kısa cümlelerle, yaşıma uygun ve sabırlı bir dille anlat.",
  "ledCheck": {
    "question": "LED yarım saniye yanıp yarım saniye sönüyor mu?",
    "yesLabel": "Evet, yanıp sönüyor!",
    "noLabel": "Hayır, olmadı",
    "successText": "<strong>Güzel!</strong> Bu, Ders 1.2'deki ritmin iki katı hızı. Şimdi İleri'ye bas: önce bu sayıların ne demek olduğunu keşfedeceksin, sonra LED'i gözünün yetişemediği hıza kadar hızlandıracaksın.",
    "fixesIntro": "<strong>Olur böyle, hiç sorun değil.</strong> Sırayla şunlara bak:",
    "fixes": [
      {
        "icon": "bulb",
        "title": "LED'in yönü.",
        "text": "Uzun bacak D5 kablosunun tarafında mı, kısa bacak direncin tarafında mı? LED yönlü bir parçadır, ters takılırsa yanmaz."
      },
      {
        "icon": "breadboard",
        "title": "Devre yerinde mi?",
        "text": "Adım 3'teki şemayla karşılaştır. Ders 1.2'den beri bir kablo yerinden çıkmış olabilir."
      },
      {
        "icon": "wrench",
        "title": "Kod gerçekten yüklendi mi?",
        "text": "<strong>Araçlar &gt; Kart</strong>'ta Deneyap Mini v2, <strong>Araçlar &gt; Port</strong>'ta bir port seçili mi? USB kablosu yalnızca şarj kablosu olmasın, veri de taşımalı."
      }
    ]
  },
  "quizCelebrateSub": "5 sorunun hepsini doğru bildin. Rozet çok yakın!",
  "stepsData": [
    {
      "title": "Adım 1: Hedefi Gör",
      "desc": "Ders 1.2'de kurduğun devre aynen duruyor. Bu sefer devreye değil, koddaki <strong>bekleme süresine</strong> dokunacaksın: LED'i saniyede 1, 5, 10, 25 ve 50 kez yakıp söndürecek, <strong>söndüğünü artık göremediğin hızı</strong> kendin bulacaksın. O hızı sana biz söylemeyeceğiz — sen bulacaksın."
    },
    {
      "title": "Adım 2: Malzemeleri Topla",
      "desc": "Bu derste yeni parça yok: Deneyap Mini v2 kartı, Type-C USB kablosu, 1 LED, 1 adet 220 ohm direnç, breadboard ve 2 jumper kablo. Malzemelerin hazırsa 'Malzemeleri Hazırladım!' butonuna bas."
    },
    {
      "title": "Adım 3: Devreni Kontrol Et",
      "desc": "Kartını bilgisayara tak, sonra breadboard'undaki devreyi aşağıdaki şemayla karşılaştır. Devreni söktüysen <strong>Hadi kuralım</strong> ile parça parça yeniden kur."
    },
    {
      "title": "Adım 4: Kodu Yükle",
      "desc": "Bu kod LED'i yarım saniye yakıp yarım saniye söndürür. Kopyala, Arduino IDE'de karta yükle."
    },
    {
      "title": "Adım 5: Kodu Çalıştır",
      "desc": "Kodu yükledin. Şimdi LED'ine bak: Ders 1.2'dekinden daha hızlı, yarım saniyede bir yanıp sönüyor mu?"
    },
    {
      "title": "Adım 6: Kodu Keşfet",
      "desc": "Bu kodu Ders 1.2'den tanıyorsun. Değişen tek şey <code>delay()</code> içindeki sayılar. Koda satır satır tıklayarak her satırın ne yaptığını gör; bir tam turun neden <strong>iki</strong> <code>delay()</code> sürdüğüne dikkat et."
    },
    {
      "title": "Adım 7: Hızı Artır",
      "desc": "Dersin asıl işi burada. Her basamakta iki <code>delay()</code> sayısını <strong>ikisini birden</strong> değiştir, karta yükle ve LED'ine bak. Ne gördüğünü işaretle."
    },
    {
      "title": "Adım 8: Sınavı Geç",
      "desc": "5 soru. Dersi tamamlamak için hepsini doğru bilmen gerekiyor; yanlış cevapta tekrar deneyebilirsin."
    },
    {
      "title": "Adım 9: Rozetini Al",
      "desc": "Tebrikler! Ders 1.3'ü tamamladın. Merak ettiklerini <strong>AI Yoldaşına Sor</strong> butonuyla düşünerek keşfedebilirsin."
    }
  ],
  "wiringSteps": [
    "LED'i breadboard'a tak.",
    "LED'in uzun bacağından (+) bir jumper kabloyla kartın <strong>D5</strong> pinine bağlan — kartta o pinin yanında <strong>MI</strong> yazar.",
    "LED'in kısa bacağını (−) 220 ohm dirence bağla.",
    "Direncin diğer ucundan bir jumper kabloyla kartın <strong>GND</strong> pinine bağlan."
  ],
  "//wiringGuide": "Ders 1.2 ile ayni devre (ders.md §4). Metin 1.2'nin dogrulanmis rehberi; yalnizca son kontrol cumlesi degisti, cunku bu derste kod bir SONRAKI adimda.",
  "wiringGuide": [
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
      "kontrol": "Devre tamam. Kodu bir sonraki adımda yükleyeceksin."
    }
  ],
  "//hizMerdiveni": "ders.md §9 madde 1'deki tablo. Sayilar yalnizca ekranda; kodu cocuk KENDI degistiriyor (dersin ogrettigi is bu), hazir kod verilmiyor.",
  "hizMerdiveni": [
    { "hiz": 1,  "delay": 500 },
    { "hiz": 5,  "delay": 100 },
    { "hiz": 10, "delay": 50 },
    { "hiz": 25, "delay": 20 },
    { "hiz": 50, "delay": 10 }
  ],
  "//merdivenSorun": "ders.md §6 Sorun giderme'nin hiz merdiveniyle ilgili uc maddesi (digerleri Adim 5'teki ledCheck.fixes'te).",
  "merdivenSorun": [
    { "title": "LED hızlanmıyor mu?", "text": "İki <code>delay()</code> satırından yalnız birini değiştirmiş olabilirsin. İkisi de aynı sayı olmalı." },
    { "title": "Kodu değiştirdin ama LED aynı mı?", "text": "Değişikliği karta <strong>yeniden yüklemen</strong> gerekir. Dosyayı kaydetmek yetmez." },
    { "title": "\"Sürekli mi yanıyor, hâlâ sönüyor mu\" emin değil misin?", "text": "Gözünü LED'den ayır, başını yavaşça sağa sola salla. Sönme varsa ışık kesik kesik bir iz bırakır." }
  ],
  "senYap": [
    "Hangi hızdan sonra LED'in söndüğünü artık göremiyorsun, sürekli yanıyor gibi görünüyor? O hızı defterine yaz.",
    "Bulduğun hızı bir aile bireyinle karşılaştır, ya da aynı denemeyi kendin gündüz ve akşam tekrarla. Aynı hızı mı buldunuz?"
  ],
  "yetiskinKarti": [
    "LED'in ışığı sence artık kesik kesik mi, yoksa sürekli mi yanıyor?",
    "Bu iki durumu ayırt edebilmek için gözünü ışıktan ayırıp başını yavaşça sağa sola sallamayı denedin mi?",
    "Bulduğun hızı bir kez daha, farklı bir saatte (örneğin akşam) tekrar dener misin — aynı hızı mı buluyorsun?"
  ],
  "merakKosesi": {
    "baslik": "Merak Köşesi: <code>void</code> ne demek?",
    "sahne": [{"tip": "kod", "kod": "void setup() {", "vurgu": "setup", "yazi": "<code>setup</code>, bir iş listesinin adı."}, {"tip": "kod", "kod": "void setup() {", "vurgu": "void", "not": "sonuç: yok", "yazi": "<code>void</code> der ki: \"Bu liste bitince geriye bir sonuç vermeyecek.\""}, {"tip": "kod", "kod": "void loop() {", "vurgu": "loop", "yazi": "<code>loop</code> da öyle: işini yapar, sonuç döndürmez, baştan başlar."}],
    "metin": "<code>setup</code> ve <code>loop</code> birer iş listesi. <code>void</code>, listenin adının önünde durur ve \"bu liste bitince geriye bir sonuç vermeyecek\" der. Bu derste listelerin <em>içindeki</em> sayıları değiştirdin, adlarına hiç dokunmadın. <code>void</code>'in tam olarak ne işe yaradığını ileride \"fonksiyon\" dersinde açacağız — bu sadece ilk turdu."
  },
  "ctlLines": [
    {
      "code": "/* BU KOD NE YAPAR?",
      "desc": "Kodun en üstündeki not: kart okumaz, ne yaptığını bize anlatır."
    },
    {
      "code": "  Bu kod, D5 pinine bağlı LED'i 500 ms yakıp 500 ms söndürür; yani LED saniyede 1 kez",
      "desc": "LED yarım saniye yanar, yarım saniye söner: saniyede 1 kez yanıp söner."
    },
    {
      "code": "  yanıp söner. delay değerleri küçültülerek yanıp sönme hızlandırılır.",
      "desc": "<code>delay</code> sayıları küçülünce yanıp sönme hızlanır."
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
      "code": "// delay() içindeki sayı milisaniye cinsindendir: 1000 bir saniye, 500 yarım saniyedir",
      "desc": "<code>delay()</code> içindeki sayı milisaniye cinsindendir: 1000 bir saniye, 500 yarım saniyedir."
    },
    {
      "code": "// delay() içindeki sayı küçüldükçe LED daha sık yanıp söner",
      "desc": "<code>delay()</code> içindeki sayı küçüldükçe LED daha sık yanıp söner."
    },
    {
      "code": "// Bir tam tur (bir yanma + bir sönme) iki delay() sürer: 500 + 500 = bir saniye,",
      "desc": "Bir tam tur (bir yanma + bir sönme) iki <code>delay()</code> sürer: 500 + 500 = bir saniye."
    },
    {
      "code": "// yani LED saniyede 1 kez yanıp sönüyor",
      "desc": "Yani LED saniyede 1 kez yanıp sönüyor."
    },
    {
      "code": "void setup() {",
      "desc": "<code>{</code> ve <code>}</code> arasındaki satırlar o fonksiyona ait koddur; bu blok \"başlangıç\" bloğudur."
    },
    {
      "code": "  pinMode(D5, OUTPUT); // D5 pinini, açıp kapatabileceğimiz bir pin yap",
      "desc": "D5 pinini, açıp kapatabileceğimiz bir pin yap."
    },
    {
      "code": "}",
      "desc": "<code>;</code> işareti bir komutun bittiğini, <code>}</code> bloğun bittiğini gösterir."
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
      "code": "  digitalWrite(D5, HIGH); // D5 pinine gerilim gönder -> LED yanar",
      "desc": "D5 pinine gerilim gönder → LED yanar."
    },
    {
      "code": "  delay(500);             // yarım saniye yanık kal",
      "desc": "Yarım saniye boyunca hiçbir şey yapma, LED yanık kalsın. <strong>Hız merdiveninde değiştireceğin birinci sayı bu.</strong>"
    },
    {
      "code": "  digitalWrite(D5, LOW);  // D5 pininin gerilimini kes -> LED söner",
      "desc": "D5 pininin gerilimini kes → LED söner."
    },
    {
      "code": "  delay(500);             // yarım saniye sönük kal",
      "desc": "Yarım saniye boyunca hiçbir şey yapma, LED sönük kalsın. <strong>İkinci sayı bu — birinciyle hep aynı olmalı.</strong>"
    },
    {
      "code": "}",
      "desc": "<code>loop()</code> bitti. Döngü buradan en başa döner ve tekrar başlar."
    }
  ],
  "quizQuestions": [
    {
      "q": "<code>delay(250)</code> kaç saniyelik bekleme yapar?",
      "options": ["250 saniye", "25 saniye", "Çeyrek saniye", "2,5 saniye"],
      "answer": "53f70882",
      "hint": "1000 milisaniye 1 saniyeye eşit; 250 onun dörtte biri.",
      "ipucu": "<code>delay()</code> milisaniye ile çalışır: 1000 ms = 1 saniye. 250'yi 1000'e göre düşün: 1000'in içinde kaç tane 250 var?"
    },
    {
      "q": "<code>delay()</code> sayısını küçültürsen LED ne yapar?",
      "options": ["Daha sık yanıp söner", "Daha seyrek yanıp söner", "Hiç yanmaz", "Rengi değişir"],
      "answer": "d1274407",
      "hint": "Koddaki ikinci yorum satırı tam bunu söylüyor.",
      "ipucu": "<code>delay()</code>, LED'in yanık ve sönük kalma süresidir. Bekleme kısalırsa bir sonraki yanma daha erken mi gelir, daha geç mi? Deneyde sayıyı küçültünce ne gördüğünü hatırla."
    },
    {
      "q": "LED çok hızlandığında sürekli yanıyormuş gibi görünüyor. Gerçekte ne oluyor?",
      "options": ["LED artık sönmüyor", "LED hâlâ sönüyor ama göz bunu ayırt edemiyor", "Kart komutları atlıyor", "Direnç ısınıp LED'i açık tutuyor"],
      "answer": "d23e2853",
      "hint": "Değişen LED değil, gözün. Bu sınıra görme eşiği denir.",
      "ipucu": "Kod hiç değişmedi: LED'e hâlâ \"sön\" komutu gidiyor. O zaman değişen ne olabilir? Çizgi filmleri düşün: aslında tek tek resimler hızla değişir, ama biz hareket görürüz."
    },
    {
      "q": "<code>delay</code> 20 ms iken LED saniyede kaç kez yanıp söner?",
      "options": ["20", "25", "50", "100"],
      "answer": "80cd43f2",
      "hint": "Bir tur iki <code>delay()</code> sürer: 20 + 20 = 40 ms. 1000 ÷ 40 = 25.",
      "ipucu": "Bir kez yanıp sönmek = bir yanma + bir sönme. Kodda bunun için kaç tane <code>delay()</code> var? Önce bir turun kaç ms sürdüğünü bul, sonra 1 saniyeye (1000 ms) kaç tur sığdığını hesapla."
    },
    {
      "q": "Aynı devrede iki kişi farklı eşik değerleri buldu. Bu neyi gösterir?",
      "options": ["Biri kodu yanlış yazmıştır", "Kartlardan biri bozuktur", "Görme eşiği kişiden kişiye değişir, tek doğru sayı yoktur", "Direnç değerleri farklıdır"],
      "answer": "cb09db35",
      "hint": "Sınırı koyan LED değil, göz — ve her gözün sınırı biraz farklı.",
      "ipucu": "İkisinin kodu da devresi de aynı. Farklı olan tek şey LED'e bakan kişi. Bir önceki soruları hatırla: eşiği belirleyen LED miydi, göz mü?"
    }
  ],
  "aiPrompts": [
    {
      "level": 1,
      "cat": "Kavramsal Anlama",
      "catColor": "green",
      "title": "LED mi Değişti, Gözün mü?",
      "prompt": "Sen sabırlı bir öğretmensin. Deneyap Mini v2 kartında, 3.3V mantık gerilimiyle D5 pinine bağlı bir LED'i çok hızlı yakıp söndürüyorum, artık sönmesini göremiyorum. Bana 'LED mi değişti, gözün mü?' diye sor ve sinema/çizgi film karelerinin nasıl hareket gibi göründüğünü hatırlatarak cevabı kendim bulayım. Cevabı sen söyleme. Bana pin numarası, direnç değeri ya da bağlantı tarifi verme."
    },
    {
      "level": 1,
      "cat": "Hata Giderme",
      "catColor": "amber",
      "title": "LED Hızlanmıyor",
      "prompt": "Sen bir hata ayıklama koçusun. Deneyap Mini v2'de D5 pinine bağlı LED'imin delay() sayısını küçülttüm ama hızı değişmedi. Bana pin numarası, direnç değeri ya da bağlantı tarifi verme — devrem zaten kurulu ve doğru. Bunun yerine bana iki soru sor: koddaki kaç tane delay() satırı var, hepsini değiştirdim mi; ve değişikliği karta yeniden yükledim mi. Cevabı doğrudan verme."
    },
    {
      "level": 2,
      "cat": "Pekiştirme",
      "catColor": "blue",
      "title": "Frekans Formülünü Kendin Kur",
      "prompt": "Sen ileri seviye bir mentorsun. Bana bir tam turun neden iki delay() sürdüğünü sorarak frekans formülünü (1000 / (2 × delay)) kendi cümlelerimle kurdurmaya çalış. Formülü sen yazma, önce 'bir tur ne kadar sürüyor' diye sor. Pin numarası ya da direnç değeri verme, gerekmiyor zaten."
    },
    {
      "level": 2,
      "cat": "Tartışma",
      "catColor": "blue",
      "title": "Neden Daha Sönük?",
      "prompt": "Sen meraklı bir tartışma arkadaşısın. Bana şunu sor: eşiği geçtikten sonra LED biraz daha sönük görünüyor, neden? Cevabı verme; 'zamanın ne kadarında açık, ne kadarında kapalı' diye düşündür."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "void Nedir?",
      "prompt": "Sen meraklı bir öğretmensin. Öğrenci kodda void setup() ve void loop() yazdığını görüyor ama void kelimesinin ne işe yaradığını bilmiyor. Cevabı verme; öğrenciye 'bu kelime bir şeyin olmadığını mı, yoksa bir şeyin nasıl davranacağını mı anlatıyor olabilir?' gibi bir soruyla merak uyandır. Bu konu ileride ayrı bir derste tam açılacak, şimdilik sadece merak bırak, tam açıklama verme."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "OUTPUT Nedir?",
      "prompt": "Sen meraklı bir öğretmensin. Öğrenci pinMode(D5, OUTPUT) yazdığını görüyor ama OUTPUT kelimesinin tam olarak neyi ayarladığını bilmiyor. Cevabı verme; öğrenciye 'bir pin hem bilgi gönderebilir hem bilgi alabilir olsaydı, bu ikisini birbirinden ayırmak için kartın bir şey bilmesi gerekmez miydi?' gibi bir soruyla düşündür. Bu konu ileride buton dersinde INPUT ile birlikte tam açılacak, şimdilik sadece merak bırak, tam açıklama verme."
    }
  ]
};
