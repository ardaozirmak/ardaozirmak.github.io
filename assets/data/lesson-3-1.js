/* Ders 3.1 — Butona Basınca LED Yansın.
   Kaynak: github.com/ozgur79/01_deneyapGiris_dk → dk0050_butonLed/ders.md + .ino
   (haritada portal_ders 3.1, ✅; Ortak 2026-10-06 Issue #1: "kartta test edildi"; önkoşulu 2.1,
   yayın sırası 2.1 → 3.1). Modül 3'ün (Buton) ilk dersi.
   Devre: LED D9'da, 1.5/1.6'nın standart düzeni (kısa bacak → 220 ohm → − rayı → GND).
   Buton orta kanalın üstünde (sütun 23/25), bir ucu 3V3'e, öbür ucu D10'a ve 10K pull-down
   direnciyle − rayına (wiring-diagram.js buton düzeni). dk §4 ile aynı zincir; GND'ye giden
   iki direnç kartın tek GND kablosunu − rayı üzerinden paylaşır. */
window.LESSON_DATA_3_1 = {
  "xpPrefix": "l31",
  "quizStorageKey": "quiz_lesson_3_1_passed",
  "ders": {
    "no": "3.1",
    "modul": 3,
    "ad": "Butona Basınca LED Yansın",
    "rozet": "Dokuzuncu Kıvılcım",
    "rozetAlt": "Deneyap Atölyem - Buton dersini başarıyla tamamladın! Kartın artık seni dinliyor.",
    "kutlamaAlt": "Ders 3.1 tamamlandı: kart ilk kez dışarıdan bilgi okudu!",
    "sonraki": { "href": "portal.html#modul3", "label": "Müfredata dön", "baslik": "Modül 3 sürüyor", "metin": "Kartın artık butonu dinliyor. Sıradaki derslerde iki buton, sayaç ve daha fazlası gelecek." },
    "buton": true,
    "ledSirasi": [
      { "pin": "D9", "renk": { "kapali": "#7A2A24", "yanik": "#FF3B26", "isik": "#FF5A45" } }
    ],
    "//desen": "Şemada buton kendiliğinden basılıp bırakılır; LED butonla birlikte yanar (kodun if/else'i).",
    "desen": [
      { "yanik": [], "basili": false, "ms": 1400 }, { "yanik": [0], "basili": true, "ms": 1400 }
    ],
    "kodNotu": "Yeni olan iki şey var: <code>digitalRead</code> pinin durumunu okur, <code>if / else</code> o duruma göre karar verir.",
    "pinBaslik": "Pinleri kartta bulamıyor musun?",
    "pinAciklama": "Kartın üst kenarında soldan: <strong>5V</strong>, <strong>3V3</strong>, <strong>GND</strong>, <strong>D9</strong>, <strong>D10</strong>. Bu derste dördünü de kullanıyorsun.",
    "kurKapisi": "LED'i ve butonu kur: <strong>Hadi kuralım</strong>'a bas ve parçaları tak.",
    "bosBaslik": "Bir LED ve bir buton: butona basınca LED yanacak.",
    "bosIpucu": "▶ <strong>Hadi kuralım</strong>’a bas: önce LED tarafı, sonra buton tarafı.",
    "bosNot": " Önceki derslerin devresini breadboard’dan çıkar; bu derste LED D9’da.",
    "bitisKontrol": "Kartında eski kod duruyorsa buton bir şey yapmaz. Yeni kodu bir sonraki adımda yükleyeceksin."
  },
  "materials": {
    "icon": "icon-box",
    "items": [
      "Deneyap Mini v2 Kartı",
      "Type-C USB Kablosu",
      "1 LED",
      "1 adet 220 ohm Direnç (kırmızı-kırmızı-kahverengi)",
      "1 Buton",
      "1 adet 10K ohm Direnç (kahverengi-siyah-turuncu)",
      "Breadboard",
      "4 Adet Jumper Kablo"
    ],
    "note": "İki direnç birbirine benzer: bantlarına bak. <strong>220 ohm</strong> LED'i korur, <strong>10K ohm</strong> butonun pinini sakin tutar.",
    "readyMessage": "Harika! Malzemelerin hazır."
  },
  "helpPrompt": "Deneyap Mini v2 kartıyla breadboard üzerinde bir buton ve bir LED devresi kurdum. LED'in uzun bacağı (+) D9'a, kısa bacağı (−) 220 ohm direnç üzerinden breadboard'un eksi rayına bağlı; ray kartın GND pinine bağlı. Butonun bir ucu kartın 3V3 pinine, öbür ucu D10'a bağlı; D10 tarafı ayrıca 10K ohm dirençle eksi rayına gidiyor (pull-down). Kartın mantık gerilimi 3.3V. Kodda const int led = D9; ve const int buton = D10; yazıyor; setup()'ta pinMode(led, OUTPUT) ve pinMode(buton, INPUT) var. loop() içinde if (digitalRead(buton) == 1) ise LED yanıyor, else ise sönüyor. Ama beklediğim gibi olmuyor. Bana yardım et ama hepsini birden anlatma: her seferinde TEK bir soru sor, cevabımı bekle, sonra bir sonraki adıma geç. Bana pin numarası, direnç değeri ya da bağlantı tarifi verme — bunları dersimdeki devre şeması belirliyor. Kontrol edilecekler şunlar olabilir: LED hiç yanmıyorsa LED tarafı doğru mu (uzun bacak D9, kısa bacak direnç); LED sürekli yanıyorsa pull-down direnç yanlışlıkla 3V3'e mi bağlanmış; butona basınca değişmiyorsa 10K direnç GND'ye ulaşıyor mu, butonun bacakları kanalın iki yanında mı; LED titriyorsa 10K direnç eksik mi; buton hep basılıymış gibiyse buton yanlış yönde mi takılmış (bazı bacaklar içeriden zaten bağlı); Arduino IDE'de Araçlar > Kart menüsünde 'Deneyap Mini v2' seçili mi, Araçlar > Port menüsünde bir port görünüyor mu. Bana kısa cümlelerle, yaşıma uygun ve sabırlı bir dille anlat.",
  "ledCheck": {
    "question": "Butona <strong>basılı tuttuğunda</strong> LED yanıyor, <strong>bıraktığında</strong> sönüyor mu?",
    "yesLabel": "Evet, butonu dinliyor!",
    "noLabel": "Hayır, olmadı",
    "successText": "<strong>Harika!</strong> Kart ilk kez dışarıdan bir bilgi okudu: senin parmağını. Karar artık kodun içinde değil, butonda. Şimdi İleri'ye bas ve kodu keşfet.",
    "fixesIntro": "<strong>Olur böyle, hiç sorun değil.</strong> Ne gördüğüne göre sırayla bak:",
    "fixes": [
      {
        "icon": "bulb",
        "title": "LED hiç yanmıyor mu (butona basınca da)?",
        "text": "Önce LED tarafı: kısa bacak 220 ohm direncin sütununda, uzun bacak D9 kablosunun sütununda mı? Siyah kablo üstteki <strong>GND</strong>'den − rayına gidiyor mu?"
      },
      {
        "icon": "alert",
        "title": "LED hep yanık mı, butona basmak fark etmiyor mu?",
        "text": "Butonu 90 derece çevirip yeniden tak: bacakları kanalın iki yanında olmalı. Bazı bacaklar içeriden zaten bağlıdır, yanlış yönde takılınca buton hep basılı gibi davranır."
      },
      {
        "icon": "search",
        "title": "LED titriyor ya da kararsız mı?",
        "text": "10K direnci kontrol et: butonun sağ sütunundan − rayına gitmeli. O olmadan pin ne okuyacağını bilemez."
      },
      {
        "icon": "wrench",
        "title": "Kod yüklenmiyor mu?",
        "text": "<strong>Araçlar &gt; Kart</strong>'ta Deneyap Mini v2, <strong>Araçlar &gt; Port</strong>'ta bir port seçili mi? Kablon veri aktaran bir kablo mu?"
      }
    ]
  },
  "quizCelebrateSub": "6 sorunun hepsini doğru bildin. Rozetin çok yakın!",
  "stepsData": [
    {
      "title": "Adım 1: Hedefi Gör",
      "desc": "Şimdiye kadar kart hep senin kodunun dediğini yaptı. Bu derste kart ilk kez <strong>dışarıdan bir bilgi okuyor</strong>: butona basıp basmadığını. Bastığında LED yanacak, bıraktığında sönecek."
    },
    {
      "title": "Adım 2: Malzemeleri Topla",
      "desc": "1 LED, 1 buton, iki direnç (220 ohm ve 10K ohm) ve 4 jumper kablo. Yeni parçalar: <strong>buton</strong> ve <strong>10K direnç</strong>. Hazırsan 'Malzemeleri Hazırladım!' butonuna bas."
    },
    {
      "title": "Adım 3: Devreyi Kur",
      "desc": "Kartını bilgisayara tak. <strong>Hadi kuralım</strong>'a bas: önce LED tarafını (D9), sonra buton tarafını (3V3, D10 ve 10K direnç) kuracağız."
    },
    {
      "title": "Adım 4: Kodu Yükle",
      "desc": "Bu kod butonu sürekli okur ve karara göre LED'i yakar ya da söndürür. Kopyala, Arduino IDE'de karta yükle."
    },
    {
      "title": "Adım 5: Butona Bas",
      "desc": "Kodu yükledin. Şimdi butona basılı tut, sonra bırak. LED parmağını takip ediyor mu?"
    },
    {
      "title": "Adım 6: Kodu Keşfet",
      "desc": "<code>INPUT</code>, <code>digitalRead</code> ve <code>if / else</code> bu dersin yenileri. Koda satır satır tıklayarak gör."
    },
    {
      "title": "Adım 7: Sen Yap",
      "desc": "Şimdi kodu sen değiştireceksin. Üç görev var; her birini Arduino IDE'de dene, karta yükle ve butona bas."
    },
    {
      "title": "Adım 8: Sınavı Geç",
      "desc": "6 soru. Dersi tamamlamak için hepsini doğru bilmen gerekiyor; yanlış cevapta tekrar deneyebilirsin."
    },
    {
      "title": "Adım 9: Rozetini Al",
      "desc": "Tebrikler! Ders 3.1'i tamamladın. Merak ettiklerini <strong>AI Yoldaşına Sor</strong> butonuyla düşünerek keşfedebilirsin."
    }
  ],
  "wiringSteps": [
    "Kartın üstteki <strong>GND</strong> pininden − rayına siyah kablo.",
    "LED'i tak: iki bacak da g satırında, kısa bacak solda.",
    "LED'in kısa bacağının sütunundan − rayına 220 ohm direnç.",
    "<strong>D9</strong> → LED'in uzun bacağı.",
    "Butonu orta kanalın üstüne bastır.",
    "Butonun sağ sütunundan − rayına 10K direnç.",
    "<strong>3V3</strong> → butonun sol sütunu.",
    "<strong>D10</strong> → butonun sağ sütunu."
  ],
  "//wiringGuide": "Adım sırası wiring-diagram.js siraAdimlari + butonAdimlari ile aynı: GND, LED, 220, D9, buton, 10K, 3V3, D10.",
  "wiringGuide": [
    {
      "ad": "GND kablosu",
      "adim3": ["jumper", "breadboard"],
      "xray": false,
      "neden": "LED'in ve butonun elektriği bu yoldan karta geri döner. Breadboard'un kenarındaki <b>− rayı</b> boydan boya bağlıdır.",
      "nereye": "Bir ucu kartın <b>üst</b> kenarındaki <b>GND</b> pininin hemen üstündeki boş deliğe. Öbür ucu hemen yukarıdaki <b>−</b> (mavi çizgili) raya.",
      "kontrol": "Siyah kablo üstteki GND'den − rayına mı gidiyor?"
    },
    {
      "ad": "LED",
      "adim3": ["led", "breadboard"],
      "xray": false,
      "neden": "Butona basınca yanacak LED bu.",
      "nereye": "Kartın sağındaki boş sütunlara. İki bacak da <b>g</b> satırında: <b>KISA</b> bacak (−) solda, <b>UZUN</b> bacak (+) hemen sağında.",
      "kontrol": "Kısa bacak solda mı? İki bacak iki ayrı sütunda mı?"
    },
    {
      "ad": "220 ohm direnç",
      "adim3": ["direnc"],
      "xray": false,
      "neden": "LED'i korur: çok fazla akım gitmesini engeller. Bantları kırmızı-kırmızı-kahverengi.",
      "nereye": "LED'in <b>kısa bacağının sütununda</b>: bir ucu yukarıdaki <b>−</b> (mavi çizgili) raya, öbür ucu aynı sütunda <b>j</b> satırına.",
      "kontrol": "Direnç, LED'in kısa bacağıyla aynı sütunda mı? Üst ucu − rayında mı?"
    },
    {
      "ad": "D9 kablosu",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "LED'e karttan elektrik bu kablo taşır. Kodda bu pinin adı <b>D9</b>, isim olarak <b>led</b>.",
      "nereye": "Bir ucu üst kenarda <b>D9</b> yazan pinin üstündeki boş deliğe. Öbür ucu LED'in uzun bacağının sütununa, LED'in arkasındaki <b>j</b> deliğine.",
      "kontrol": "Kart ucu D9'da mı? Öbür uç LED'in uzun bacağıyla aynı sütunda mı?"
    },
    {
      "ad": "Buton",
      "adim3": ["breadboard"],
      "xray": false,
      "neden": "Basınca içindeki iki bacak çiftini birbirine bağlar; basılı değilken ayrıdır. Kart onun durumunu okuyacak.",
      "nereye": "Orta kanalın <b>üstüne</b> bastır: iki bacak kanalın üstünde, iki bacak altında. Bacaklar <b>23</b> ve <b>25</b>. sütunlarda; ortada bir boş sütun kalır.",
      "kontrol": "Buton kanalın iki yanında mı? Dört bacak da delikte mi?"
    },
    {
      "ad": "10K ohm direnç",
      "adim3": ["direnc"],
      "xray": false,
      "neden": "Bu direnç LED'i korumuyor: buton basılı değilken D10 pinini sakin tutar (<b>LOW</b>). O olmazsa pin ne okuyacağını bilemez. Bantları kahverengi-siyah-turuncu.",
      "nereye": "Butonun <b>sağ</b> sütununda (<b>25</b>): bir ucu yukarıdaki <b>−</b> raya, öbür ucu aynı sütunda <b>j</b> satırına.",
      "kontrol": "Bantlar kahverengi-siyah-turuncu mu? Üst ucu − rayında mı?"
    },
    {
      "ad": "3V3 kablosu",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "Butona basınca D10'a giden elektrik buradan gelir: kartın <b>3V3</b> pini.",
      "nereye": "Bir ucu üst kenarda <b>3V3</b> yazan pinin üstündeki boş deliğe (GND'nin hemen solunda). Öbür ucu butonun <b>sol</b> sütununa (<b>23</b>), <b>j</b> satırına.",
      "kontrol": "Kart ucu 3V3'te mi? Dikkat: 5V değil, 3V3."
    },
    {
      "ad": "D10 kablosu",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "Kart butonun durumunu bu kablodan okur. Kodda <b>D10</b>, isim olarak <b>buton</b>.",
      "nereye": "Bir ucu üst kenarda <b>D10</b> yazan pinin üstündeki boş deliğe. Öbür ucu butonun <b>sağ</b> sütununa (<b>25</b>), <b>i</b> satırına; 10K direncin hemen altına.",
      "kontrol": "Devre tamam. Kodu bir sonraki adımda yükleyeceksin."
    }
  ],
  "senYap": [
    {
      "id": "ters",
      "gorev": "Mantığı tersine çevir: buton basılı <strong>değilken</strong> LED yansın, basılınca sönsün. Karta yükle ve butona bas.",
      "ipucu": "Değişen şey \"ne zaman\" değil, \"ne yapılacağı\". <code>if</code> ve <code>else</code> bloklarının içindeki iki <code>digitalWrite</code> satırına bak.",
      "tip": "sayi",
      "soru": "Kaç satır değiştirdin?",
      "cevap": 2,
      "dogru": "Evet, <strong>2</strong> satır: <code>if</code> bloğundaki <code>HIGH</code> <code>LOW</code> oldu, <code>else</code> bloğundaki <code>LOW</code> <code>HIGH</code> oldu."
    },
    {
      "id": "seri",
      "gorev": "Ders 2.1'de öğrendiğin <code>Serial.println</code> ile buton basılıyken Seri Monitör'e <code>BASILI</code>, basılı değilken <code>BASILI DEGIL</code> yazdır. <code>Serial.begin(115200);</code> eklemeyi unutma.",
      "ipucu": "<code>Serial.begin</code> bir kez gerekir: <code>setup()</code>'a. Her mesaj kendi bloğuna: biri <code>if</code>'in, biri <code>else</code>'in içine.",
      "tip": "yaptim",
      "etiket": "Seri Monitör'de gördüm"
    },
    {
      "id": "yanip",
      "gorev": "Buton basılı tutulduğu sürece LED <strong>200 milisaniye</strong> aralıklarla yanıp sönsün; buton bırakılınca sönük kalsın.",
      "ipucu": "<code>if</code> bloğunun içine Ders 1.2'deki yakıp söndürmeyi yaz: <code>HIGH</code>, <code>delay(200)</code>, <code>LOW</code>, <code>delay(200)</code>.",
      "tip": "gozlem",
      "secenekler": ["Basılıyken yanıp sönüyor", "Hâlâ sürekli yanıyor"]
    }
  ],
  "yetiskinKarti": [
    "Butona bastığınızda gerçekten LED yanıyor mu, yoksa hiç tepki yok mu?",
    "Butonun bir ucu 3V3'e, diğer ucu hem D10'a hem de 10K dirence mi bağlı?",
    "10K ohm direncin diğer ucu GND'ye (− rayına) ulaşıyor mu?"
  ],
  "merakKosesi": {
    "baslik": "Merak Köşesi: 10K direnç neden var? (pull-down)",
    "sahne": [{"tip": "okuma", "pin": "D10", "deger": "?", "direnc": false, "basili": false, "ms": 3600, "yazi": "Direnç yoksa pin havada kalır: rastgele 0 ya da 1 okur, LED titrer."}, {"tip": "okuma", "pin": "D10", "deger": 0, "direnc": true, "basili": false, "yazi": "10K direnç pini GND'ye <strong>çeker</strong>: buton bırakılmışken hep 0."}, {"tip": "okuma", "pin": "D10", "deger": 1, "direnc": true, "basili": true, "yazi": "Butona basınca 3.3V gelir: 1 okunur, LED yanar."}],
    "metin": "<code>INPUT</code> yapılan bir pin hiçbir şeye bağlı değilse \"havada asılı\" kalır: çevredeki elektrik gürültüsünü rastgele <code>HIGH</code> ya da <code>LOW</code> okuyabilir. 10K direnç, buton basılı değilken pini GND'ye <strong>çeker</strong>, yani <code>LOW</code>'da tutar. Buna <strong>pull-down</strong> direnç denir. Buton basılınca pin doğrudan 3.3V'a bağlanır ve <code>HIGH</code> okunur; direncin değeri büyük olduğu için GND'ye çok az akım kaçar. Bazı devrelerde bunun tersi kurulur (<strong>pull-up</strong>): pin varsayılan <code>HIGH</code>, basılınca <code>LOW</code>. Bu ders pull-down'ı seçti, çünkü kod <code>digitalRead(...) == 1</code>'i \"basılı\" kabul ediyor."
  },
  "ctlLines": [
    { "code": "/* BU KOD NE YAPAR?", "desc": "Kodun en üstündeki not: kart okumaz, ne yaptığını bize anlatır." },
    { "code": "  Bu kod, D10 pinindeki butonu sürekli okur. Buton basılıyken D9 pinine bağlı LED'i yakar,", "desc": "Kart butonu sürekli okur." },
    { "code": "  basılı değilken söndürür.", "desc": "Basılıyken LED yanar, bırakınca söner." },
    { "code": "*/", "desc": "Not burada biter." },
    { "code": "", "desc": "Boş satır; kodun okunabilirliği için boşluk bırakılır." },
    { "code": "// pinMode(pin, INPUT) o pini \"okuma\" pini yapar -- OUTPUT'un tam tersi. OUTPUT bir pine", "desc": "<code>INPUT</code> yeni: pin artık dinler. <code>OUTPUT</code> konuşur, <code>INPUT</code> dinler." },
    { "code": "// elektrik gönderir (LED'i yakmak gibi); INPUT bir pinden elektrik OKUR (buton basılı mı diye).", "desc": "LED'e elektrik gönderilir, butondan elektrik okunur." },
    { "code": "// digitalRead(pin) o pinin o an HIGH mi LOW mu olduğunu söyler; sonuç 1 (HIGH) ya da 0 (LOW) olur.", "desc": "<code>digitalRead</code> pinin o anki durumunu söyler: 1 ya da 0." },
    { "code": "// if (...) { } içindeki kod parantez içindeki koşul doğruysa çalışır; else { } içindeki kod", "desc": "<code>if</code>: koşul doğruysa çalışır." },
    { "code": "// koşul yanlışsa çalışır -- ikisinden yalnız biri çalışır, asla ikisi birden değil.", "desc": "<code>else</code>: koşul yanlışsa çalışır. İkisi asla birlikte çalışmaz." },
    { "code": "const int led = D9;", "desc": "Kart üzerinde D9 yazan pine <code>led</code> adı verilir. Kartın üst kenarında." },
    { "code": "const int buton = D10;", "desc": "Kart üzerinde D10 yazan pine <code>buton</code> adı verilir. D9'un hemen sağında." },
    { "code": "", "desc": "Boş satır." },
    { "code": "void setup() {", "desc": "<strong>Kara kutu:</strong> <code>void</code>, bu kod bölümünün sonunda değer verilmediğini belirtir; fonksiyon konusunda tam açılacak." },
    { "code": "  pinMode(led, OUTPUT);   // led pinini çıkış yap -- dışarıya elektrik gönderecek", "desc": "LED'in pini <strong>çıkış</strong>: dışarıya elektrik gönderecek." },
    { "code": "  pinMode(buton, INPUT);  // buton pinini giriş yap -- dışarıdan elektrik okuyacak", "desc": "<strong>Yeni:</strong> butonun pini <strong>giriş</strong>. Pin artık veri göndermiyor, okuyor. Ders 1.2'den beri bekleyen söz: <code>OUTPUT</code>'un yanında artık <code>INPUT</code> de var." },
    { "code": "}", "desc": "<code>setup</code> bitti. Bu bölüm kart açılınca bir kez çalışır." },
    { "code": "", "desc": "Boş satır." },
    { "code": "void loop() {", "desc": "<code>loop()</code> sürekli baştan tekrar eder: kart butonu saniyede binlerce kez okur." },
    { "code": "  if (digitalRead(buton) == 1) {", "desc": "<strong>Yeni:</strong> butonun pinini oku. Basılıysa pin 3.3V'a bağlanır ve <code>1</code> döner; koşul doğru olur, <code>{</code> ile başlayan blok çalışır." },
    { "code": "    digitalWrite(led, HIGH); // buton basılı (1) -> LED yansın", "desc": "Koşul doğruysa (buton basılı): LED yanar." },
    { "code": "  } else {", "desc": "Koşul yanlışsa (buton basılı değil) bu satırdan sonraki blok çalışır." },
    { "code": "    digitalWrite(led, LOW);  // buton basılı değil (0) -> LED sönsün", "desc": "Buton basılı değilken: LED söner." },
    { "code": "  }", "desc": "Bu <code>}</code> <code>else</code> bloğunu kapatır." },
    { "code": "}", "desc": "<code>loop()</code> bitti, en başa döner: butonu yeniden oku." }
  ],
  "quizQuestions": [
    {
      "q": "<code>digitalRead(buton)</code> ne yapar?",
      "options": ["buton pinine elektrik gönderir", "buton pininin o anki durumunu (HIGH/LOW) okur", "LED'i yakar", "1 saniye bekler"],
      "answer": "ac910569",
      "hint": "<code>digitalWrite</code> \"yazar\", bunun adı \"read\": okur.",
      "ipucu": "<code>digitalWrite</code> \"yazar\", bunun adı \"read\": okur."
    },
    {
      "q": "<code>if (...) { } else { }</code> yapısında ne olur?",
      "options": ["İki blok da her zaman çalışır", "Koşul doğruysa yalnız <code>if</code> bloğu, yanlışsa yalnız <code>else</code> bloğu çalışır", "<code>else</code> bloğu hiç çalışmaz", "Koşul her zaman yok sayılır"],
      "answer": "15f58bf8",
      "hint": "Koddaki açıklamada \"ikisinden yalnız biri\" yazıyor.",
      "ipucu": "Koddaki açıklamada \"ikisinden yalnız biri\" yazıyor."
    },
    {
      "q": "<code>INPUT</code> ile <code>OUTPUT</code> arasındaki fark nedir?",
      "options": ["İkisi de aynı şeydir", "<code>OUTPUT</code> pin elektrik gönderir, <code>INPUT</code> pin elektrik okur", "<code>INPUT</code> yalnız LED'lerde kullanılır", "<code>OUTPUT</code> yalnız butonlarda kullanılır"],
      "answer": "eb210c21",
      "hint": "<code>pinMode(led, OUTPUT)</code> ile <code>pinMode(buton, INPUT)</code> satırlarını karşılaştır.",
      "ipucu": "<code>pinMode(led, OUTPUT)</code> ile <code>pinMode(buton, INPUT)</code> satırlarını karşılaştır."
    },
    {
      "q": "Bu derste buton hangi pine bağlıdır?",
      "options": ["D5", "D9", "D10", "D13"],
      "answer": "26005778",
      "hint": "<code>const int buton = ...</code> satırına bak.",
      "ipucu": "<code>const int buton = ...</code> satırına bak."
    },
    {
      "q": "10K ohm direnç bu devrede olmasaydı ne olurdu?",
      "options": ["LED daha parlak yanardı", "Buton basılı değilken pin kararsız (havada asılı) okuma yapabilirdi", "Buton hiç çalışmazdı, kart açılmazdı", "Kod derlenmezdi"],
      "answer": "f56cf786",
      "hint": "Merak Köşesi'ndeki \"havada asılı\" sözüne bak.",
      "ipucu": "Merak Köşesi'ndeki \"havada asılı\" sözüne bak."
    },
    {
      "q": "\"Buton basılı değilken LED yansın\" istesen hangi iki satırı değiştirirdin?",
      "options": ["<code>pinMode</code> satırlarını", "<code>if</code> ve <code>else</code> bloklarındaki <code>digitalWrite(led, HIGH/LOW)</code> satırlarını", "<code>const int</code> satırlarını", "<code>digitalRead</code> satırını silerdin"],
      "answer": "ab47c81a",
      "hint": "Değişen şey \"ne zaman\" değil \"ne yapılacağı\".",
      "ipucu": "Değişen şey \"ne zaman\" değil \"ne yapılacağı\"."
    }
  ],
  "aiPrompts": [
    {
      "level": 1,
      "cat": "Kavramsal Anlama",
      "catColor": "green",
      "title": "INPUT ve OUTPUT",
      "prompt": "Sen sabırlı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, D9 pininde 220 ohm dirençli bir LED ve D10 pininde 10K ohm pull-down dirençli bir buton kullanıyorum. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. Bir pinin hem 'konuşan' hem 'dinleyen' taraf olabileceğini, kartın bu ikisini birbirinden nasıl ayırt etmesi gerektiğini düşündüren bir soru sor; cevabı söyleme."
    },
    {
      "level": 1,
      "cat": "Kod Okuma",
      "catColor": "blue",
      "title": "if / else Akışı",
      "prompt": "Sen sabırlı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında D10 pininde bir butonum, D9 pininde bir LED'im var. Kodda if (...) { } else { } kullanıyorum. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. İki bloktan aynı anda ikisinin de çalışıp çalışamayacağını düşündüren bir soru sor; cevabı söyleme, kendim keşfedeyim."
    },
    {
      "level": 1,
      "cat": "Hata Giderme",
      "catColor": "blue",
      "title": "Buton Tepki Vermiyor",
      "prompt": "Sen bir hata ayıklama koçusun. Bağlam: Deneyap Mini v2 kartında D10 pininde 10K ohm pull-down dirençli bir butonum, D9 pininde 220 ohm dirençli bir LED'im var ama LED butona basınca da tepki vermiyor. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. Devreyi (LED, buton, pull-down direnç) hangi sırayla kontrol etmem gerektiğini soru sorarak buldur."
    },
    {
      "level": 2,
      "cat": "Pekiştirme",
      "catColor": "blue",
      "title": "Pull-down Mantığı",
      "prompt": "Sen ileri seviye bir mentorsun. Bağlam: Deneyap Mini v2'de D10 pinine bağlı bir butonum var, pull-down direnç kullanıyorum. Bana pin numarası veya direnç değeri verme. Buton basılı değilken pinin GND'ye 'çekilmesi' gerekmeseydi ne olabileceğini, 'havada asılı kalmak' fikrinden yola çıkarak düşündüren bir soru sor; cevabı sen verme, ben kendi cümlemle ifade edeyim."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "void Nedir?",
      "prompt": "Sen meraklı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında D9 pininde bir LED, D10 pininde bir buton kullanıyorum. Kodumda void setup() yazıyor. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. void kelimesinin kod bölümünün sonunda değer verip vermemesiyle ilgili olabileceğini düşündüren bir soru sor; cevabı verme, konu fonksiyonlarda tam açılacak."
    }
  ]
};
