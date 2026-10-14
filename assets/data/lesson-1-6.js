/* Ders 1.6 — Trafik Lambası.
   Kaynak: github.com/ozgur79/01_deneyapGiris_dk → dk0150_trafikLambasi/ders.md + .ino
   (haritada portal_ders 1.6, ✅). Numara Portal-Ders-Haritasi.md'den.
   Devre: TRAFİK LAMBASI MODÜLÜ (Arda, 2026-10-06: "trafik ışığı dersi var ya, oradaki ışık bundan
   bahsediliyor"). LED'leri ve dirençleri hazır, 4 pinli yatay başlık R, Y, G, GND (Arda doğruladı).
   2026-10-07, Arda: "trafik ışığını breadboard'a tak, erkek erkek kablo verilecek." Modül dik,
   pinleri üst blokta kartın sağında (soldan GND G Y R); 4 erkek-erkek kablo modül pininin
   sütununa, modülün önündeki deliğe: R→D5 (MI), Y→D6 (MC), G→D9, GND→üst GND.
   wiring-diagram.js trafikModulu düzeni, görünüm Blender (blender/trafik-modul.py DIK=1).
   dk0150 hâlâ "3 LED + 3 direnç + breadboard" diyor: Özgür'e bildirilecek (sapma).
   */
window.LESSON_DATA_1_6 = {
  "xpPrefix": "l16",
  "quizStorageKey": "quiz_lesson_1_6_passed",
  "ders": {
    "no": "1.6",
    "ad": "Trafik Lambası",
    "rozet": "Altıncı Kıvılcım",
    "rozetAlt": "Deneyap Atölyem - Trafik Lambası dersini başarıyla tamamladın! Modül 1 bitti.",
    "kutlamaAlt": "Ders 1.6 tamamlandı — Modül 1'in sonu: üç LED, gerçek bir trafik lambası!",
    "sonraki": { "href": "lesson-2-1.html", "label": "Ders 2.1", "baslik": "Modül 1 tamam! Sıradaki: Ders 2.1", "metin": "Altı dersin hepsini bitirdin. Modül 2'de kartın sana ne yaptığını bilgisayar ekranına yazacak: Seri Monitör." },
    "trafikModulu": true,
    "ledSirasi": [
      { "pin": "D5", "renk": { "kapali": "#7A2A24", "yanik": "#FF3B26", "isik": "#FF5A45" } },
      { "pin": "D6", "renk": { "kapali": "#7D6A22", "yanik": "#FFD23F", "isik": "#FFE066" } },
      { "pin": "D9", "renk": { "kapali": "#2A5E37", "yanik": "#3BE36B", "isik": "#5CFF8A" } }
    ],
    "desen": [
      { "yanik": [0], "ms": 4000 }, { "yanik": [2], "ms": 3000 }, { "yanik": [1], "ms": 1000 }
    ],
    "kodNotu": "Pinlerin adları bu kez renkler: <code>kirmizi</code>, <code>sari</code>, <code>yesil</code>. Üç ışığın süreleri farklı: 4, 3 ve 1 saniye.",
    "pinBaslik": "Pinleri kartta bulamıyor musun?",
    "pinAciklama": "Kartın alt kenarında <code>D5</code>'in yanında <strong>MI</strong>, <code>D6</code>'nın yanında <strong>MC</strong> yazar. Üst kenarda <strong>D9</strong> kendi adıyla yazar; hemen solunda <strong>GND</strong> var. Modülde pinlerin yanında <strong>R</strong>, <strong>Y</strong>, <strong>G</strong>, <strong>GND</strong> yazar.",
    "kurKapisi": "Trafik lambası modülünü bağla: <strong>Hadi kuralım</strong>'a bas ve dört kabloyu tak.",
    "bosBaslik": "Trafik lambası modülü: üç ışık ve dirençleri hazır.",
    "bosIpucu": "▶ <strong>Hadi kuralım</strong>’a bas: önce modülü breadboard’a tak, sonra dört kablo (GND, R, Y, G).",
    "bosNot": " Ders 1.5’in LED’lerini ve dirençlerini breadboard’dan çıkar; bu derste ışıklar modülde.",
    "bitisKontrol": "Kartında 1.5'in kodu duruyorsa ışıklar karışık yanar. Trafik lambası kodunu bir sonraki adımda yükleyeceksin."
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
    "note": "Modülün üstünde üç ışık ve dirençleri hazır: ayrı LED ve direnç gerekmez. Modülün dört pini breadboard'a takılır, kabloların iki ucu da breadboard'a. Ders 1.5'in LED'lerini ve dirençlerini breadboard'dan çıkar.",
    "readyMessage": "Harika! Malzemelerin hazır."
  },
  "helpPrompt": "Deneyap Mini v2 kartıyla bir trafik lambası modülü kullanıyorum. Modülde kırmızı, sarı ve yeşil LED ile dirençleri hazır; 4 pini var: R, Y, G, GND. Modül breadboard'a dik takılı; R pini D5'e, Y pini D6'ya, G pini D9'a, GND pini kartın GND pinine erkek-erkek kablolarla bağlı. Her kablo, modül pininin takılı olduğu sütundaki başka bir deliğe takılı. Kartın mantık gerilimi 3.3V. Kodda pinlere const int ile kirmizi, sari, yesil adlarını veriyorum. loop() içinde üç adım var: kırmızı 4 saniye, yeşil 3 saniye, sarı 1 saniye; her adımda üç LED'in de durumu yazılıyor. Ama beklediğim gibi olmuyor. Bana yardım et ama hepsini birden anlatma: her seferinde TEK bir soru sor, cevabımı bekle, sonra bir sonraki adıma geç. Bana pin numarası ya da bağlantı tarifi verme — bunları dersimdeki devre şeması belirliyor. Kontrol edilecekler şunlar olabilir: hiçbir ışık yanmıyorsa kod gerçekten yüklendi mi, modülün GND pini kartın GND'sine bağlı mı; bir renk hiç yanmıyorsa o rengin kablosu modülün doğru harfinin sütununda mı, modülün pinleri deliğe tam oturmuş mu; renkler yanlış sırada yanıyorsa R, Y, G kabloları D5, D6, D9 sırasıyla koddaki isimlerle uyuşuyor mu; bir renk çok kısa ya da uzun yanıyorsa o adımın delay sayısı ne; Arduino IDE'de Araçlar > Kart menüsünde 'Deneyap Mini v2' seçili mi, Araçlar > Port menüsünde bir port görünüyor mu. Şunu da bil: kartın üzerinde D5 ve D6 yazmaz, D5'in yanında MI, D6'nın yanında MC yazar; D9 kendi adıyla yazar. Bana kısa cümlelerle, yaşıma uygun ve sabırlı bir dille anlat.",
  "ledCheck": {
    "question": "Trafik lamban çalışıyor mu? Kırmızı uzun, yeşil orta, sarı kısa yanıyor mu?",
    "yesLabel": "Evet, trafik lambası gibi!",
    "noLabel": "Hayır, olmadı",
    "successText": "<strong>Harika!</strong> Üç sürenin eşit olmadığını gördün: kırmızı 4, yeşil 3, sarı 1 saniye. Bu sayılar elektronik bir zorunluluk değil, <strong>projenin kararı</strong>. Şimdi İleri'ye bas ve kodu keşfet.",
    "fixesIntro": "<strong>Olur böyle, hiç sorun değil.</strong> Ne gördüğüne göre sırayla bak:",
    "fixes": [
      {
        "icon": "wrench",
        "title": "Hiçbir LED yanmıyor mu?",
        "text": "Kod gerçekten yüklendi mi: <strong>Araçlar &gt; Kart</strong>'ta Deneyap Mini v2, <strong>Araçlar &gt; Port</strong>'ta bir port seçili mi? Siyah kablo üstteki <strong>GND</strong>'den modülün <strong>GND</strong> pininin sütununa gidiyor mu?"
      },
      {
        "icon": "bulb",
        "title": "Yalnız bir renk hiç yanmıyor mu?",
        "text": "O rengin kablosu modülde doğru harfin sütununda mı? Kırmızı <strong>R</strong>, sarı <strong>Y</strong>, yeşil <strong>G</strong>. Kablo, pinin hemen önündeki delikte olmalı: aynı sütun birbirine bağlı, yan sütun değil."
      },
      {
        "icon": "breadboard",
        "title": "Renkler yanlış sırada mı yanıyor?",
        "text": "Kabloları kodla karşılaştır: modülün <strong>R</strong> pini <strong>D5 (MI)</strong>, <strong>Y</strong> pini <strong>D6 (MC)</strong>, <strong>G</strong> pini <strong>D9</strong>."
      },
      {
        "icon": "alert",
        "title": "Bir renk çok kısa ya da çok uzun mu yanıyor?",
        "text": "O rengin hemen altındaki <code>delay</code> sayısına bak."
      }
    ]
  },
  "quizCelebrateSub": "5 sorunun hepsini doğru bildin. Modül 1'in son rozeti çok yakın!",
  "stepsData": [
    {
      "title": "Adım 1: Hedefi Gör",
      "desc": "Bu derste üç LED'i <strong>kırmızı, sarı, yeşil</strong> rolleriyle gerçek bir trafik lambası gibi çalıştıracaksın: kırmızı 4 saniye, yeşil 3 saniye, sarı 1 saniye. Yeni komut yok; öğrendiklerini tek işte birleştireceksin."
    },
    {
      "title": "Adım 2: Malzemeleri Topla",
      "desc": "Trafik lambası modülü ve 4 erkek-erkek jumper kablo. Modülde ışıklar ve dirençleri hazır. Hazırsan 'Malzemeleri Hazırladım!' butonuna bas."
    },
    {
      "title": "Adım 3: Devreyi Kur",
      "desc": "Kartını bilgisayara tak. <strong>Hadi kuralım</strong>'a bas: modülü breadboard'a takacağız, sonra dört kablo: GND, R (D5), Y (D6), G (D9)."
    },
    {
      "title": "Adım 4: Kodu Yükle",
      "desc": "Bu kod üç LED'i trafik lambası gibi yakar. Kopyala, Arduino IDE'de karta yükle."
    },
    {
      "title": "Adım 5: Kodu Çalıştır",
      "desc": "Kodu yükledin. Şimdi lambana bak: kırmızı uzun, yeşil orta, sarı kısa yanıyor mu?"
    },
    {
      "title": "Adım 6: Kodu Keşfet",
      "desc": "Bir adımda yalnız bir LED yansa bile üç <code>digitalWrite</code> satırı var. Koda satır satır tıklayarak nedenini gör."
    },
    {
      "title": "Adım 7: Sen Yap",
      "desc": "Şimdi kodu sen değiştireceksin. İki görev var; her birini Arduino IDE'de dene, karta yükle ve lambana bak."
    },
    {
      "title": "Adım 8: Sınavı Geç",
      "desc": "5 soru. Dersi tamamlamak için hepsini doğru bilmen gerekiyor; yanlış cevapta tekrar deneyebilirsin."
    },
    {
      "title": "Adım 9: Rozetini Al",
      "desc": "Tebrikler! Ders 1.6'yı ve Modül 1'i tamamladın. Merak ettiklerini <strong>AI Yoldaşına Sor</strong> butonuyla düşünerek keşfedebilirsin."
    }
  ],
  "wiringSteps": [
    "Trafik lambası modülünü breadboard'a, kartın sağına dik tak: LED'ler sana baksın.",
    "Kartın üstteki <strong>GND</strong> pininden modülün <strong>GND</strong> sütununa siyah kablo.",
    "<strong>D5</strong> (kartta MI) → modülün <strong>R</strong> sütunu.",
    "<strong>D6</strong> (kartta MC) → modülün <strong>Y</strong> sütunu.",
    "<strong>D9</strong> → modülün <strong>G</strong> sütunu."
  ],
  "//wiringGuide": "Adım sırası wiring-diagram.js modulAdimlari ile aynı: modül, GND, D5 (R), D6 (Y), D9 (G).",
  "wiringGuide": [
    {
      "ad": "Trafik lambası modülü",
      "adim3": ["led", "kart"],
      "xray": false,
      "neden": "Gerçek bir trafik lambası gibi: üç ışık tek parçada, dirençleri de üstünde hazır. Soldan sağa <b>kırmızı</b> (dur), <b>sarı</b> (hazırlan), <b>yeşil</b> (geç).",
      "nereye": "Kartın sağındaki boş sütunlara, <b>dik</b> tak: dört pin yan yana dört sütunda, <b>i</b> satırında. LED'ler sana baksın, kırmızı en üstte. Soldan sağa <b>GND</b>, <b>G</b>, <b>Y</b>, <b>R</b> yazar.",
      "kontrol": "Dört pin dört ayrı sütunda mı? Soldan sağa GND, G, Y, R okuyor musun?"
    },
    {
      "ad": "GND kablosu",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "Üç ışığın da elektriği bu yoldan karta geri döner. Modülün tek <b>GND</b> pini üç ışığa da yeter.",
      "nereye": "Bir ucu kartın <b>üst</b> kenarındaki <b>GND</b> pininin hemen üstündeki boş deliğe. Öbür ucu modülün <b>GND</b> pininin sütununa, modülün önündeki <b>g</b> deliğine. Aynı sütunun delikleri birbirine bağlı: kablo pine dokunmasa da bağlanır.",
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
      "id": "sure",
      "gorev": "Süreleri değiştir: kırmızı daha uzun, sarı daha kısa, yeşil ortada kalacak başka üç sayı seç ve karta yükle.",
      "ipucu": "Süreleri <code>delay</code> satırları belirliyor. Hangi <code>delay</code> hangi rengin altında? Doğru ya da yanlış cevap yok; lambana bak.",
      "tip": "gozlem",
      "secenekler": ["Lamba daha aceleci görünüyor", "Lamba daha sakin görünüyor"]
    },
    {
      "id": "turkiye",
      "gorev": "Türkiye'deki sırayı kur: kırmızı → <strong>kırmızı+sarı</strong> → yeşil → sarı. Kırmızı+sarı adımında iki LED'i aynı anda <code>HIGH</code> yap; her adımda üç LED'in de durumunu yaz.",
      "soru": "Yeni sırada <code>loop()</code> içinde kaç adım oldu?",
      "ipucu": "Sırayı parmağınla say: kırmızı, kırmızı+sarı, yeşil, sarı. Her biri ayrı bir adım; her adımın sonunda bir <code>delay</code> var.",
      "tip": "sayi",
      "cevap": 4,
      "dogru": "Evet, <strong>4</strong> adım. Kırmızı+sarı adımında iki <code>HIGH</code> var: bir adımda birden çok LED'in yanabildiğini de görmüş oldun."
    }
  ],
  "yetiskinKarti": [
    "Modülün GND pini kartın GND'sine bağlı mı?",
    "Koddaki renk adıyla (kirmizi/sari/yesil) kablonun bağlı olduğu pin (D5/D6/D9) ve modüldeki harf (R/Y/G) uyuşuyor mu?",
    "Modülün dört pini breadboard'a tam oturmuş mu, her kablo doğru pinin sütununda mı?"
  ],
  "merakKosesi": {
    "baslik": "Merak Köşesi: OUTPUT (2. tur)",
    "sahne": [{"tip": "sira", "ledler": ["kirmizi", "sari", "yesil"], "yanik": [0], "yazi": "Kırmızı <code>HIGH</code>, sarı <code>LOW</code>, yeşil <code>LOW</code>."}, {"tip": "sira", "ledler": ["kirmizi", "sari", "yesil"], "yanik": [2], "yazi": "Her adımda üç <code>digitalWrite</code>: resim baştan çizilir."}, {"tip": "sira", "ledler": ["kirmizi", "sari", "yesil"], "yanik": [1], "yazi": "Bir önceki adımdan yanık LED kalmaz."}],
    "metin": "Ders 1.4'te ikinci bir pin için de <code>OUTPUT</code> yazmıştın: her pin kendi görevini kendi <code>pinMode</code> satırında alır. Bu derste üç pine de <code>OUTPUT</code> yazıyoruz, çünkü üçünde de yakıp söndürebileceğimiz birer LED var. Bir adımda yalnız bir LED yansa bile üç <code>digitalWrite</code> satırı yazılır: bu satırlar önceki adımdan kalan durumu temizler, yeni adımın resmini baştan çizer. <code>OUTPUT</code>'un ayrıntısı buton dersinde, <code>INPUT</code> ile birlikte gelecek."
  },
  "ctlLines": [
    { "code": "/* BU KOD NE YAPAR?", "desc": "Kodun en üstündeki not: kart okumaz, ne yaptığını bize anlatır." },
    { "code": "  Bu kod, D5 (kırmızı), D6 (sarı), D9 (yeşil) pinlerindeki 3 LED ile trafik lambası çalıştırır:", "desc": "Üç pin, üç renk." },
    { "code": "  kırmızı 4 sn, yeşil 3 sn, sarı 1 sn yanar; her adımda diğer ikisi söner. Sürekli tekrarlanır.", "desc": "Üç sürenin eşit olmadığına dikkat: kırmızı en uzun, sarı en kısa." },
    { "code": "*/", "desc": "Not burada biter." },
    { "code": "", "desc": "Boş satır; kodun okunabilirliği için boşluk bırakılır." },
    { "code": "// Her LED'e adıyla sesleniyoruz; sayı yerine renk adını yazmak kodu okumayı kolaylaştırır", "desc": "Pin numarası yerine renk adı: <code>kirmizi</code> yazınca hangi LED'den söz ettiğin hemen belli." },
    { "code": "// Her adımda üç LED'in de durumunu yazıyoruz: kırmızı uzun, yeşil orta, sarı kısa bekler", "desc": "Her adımda üç <code>digitalWrite</code>: önceki adımdan kalan durum temizlenir." },
    { "code": "const int kirmizi = D5;", "desc": "D5 pinine <code>kirmizi</code> adı verilir. İsim verme (<code>const int</code>) kavramını Ders 1.4'te görmüştün. Kartta bu pinin yanında <strong>MI</strong> yazar." },
    { "code": "const int sari = D6;", "desc": "D6 pinine <code>sari</code> adı verilir. Kartta <strong>MC</strong> yazar." },
    { "code": "const int yesil = D9;", "desc": "D9 pinine <code>yesil</code> adı verilir. Kartın üst kenarında <strong>D9</strong> yazar." },
    { "code": "", "desc": "Boş satır." },
    { "code": "void setup() {", "desc": "<strong>Kara kutu:</strong> <code>void</code>, bu kod bölümünün sonunda bir değer vermediğini anlatır. Konu ileride açılacak." },
    { "code": "  pinMode(kirmizi, OUTPUT);", "desc": "Kırmızı LED'in pini açılıp kapatılacak çıkış olur. <strong>Kara kutu:</strong> <code>OUTPUT</code> buton dersinde açılacak." },
    { "code": "  pinMode(sari, OUTPUT);", "desc": "Sarı LED'in pini de çıkış; her pinin kendi satırı var." },
    { "code": "  pinMode(yesil, OUTPUT);", "desc": "Yeşil LED'in pini de çıkış." },
    { "code": "}", "desc": "<code>setup</code> bitti. Bu bölüm kart açılınca bir kez çalışır." },
    { "code": "", "desc": "Boş satır." },
    { "code": "void loop() {", "desc": "<code>loop()</code> içindeki üç adım sürekli baştan tekrar eder." },
    { "code": "  // Dur: kırmızı yanar, diğer iki LED söner", "desc": "Birinci adım: <strong>dur</strong>." },
    { "code": "  digitalWrite(kirmizi, HIGH);", "desc": "Kırmızı LED'in pini açılır; kırmızı yanar." },
    { "code": "  digitalWrite(sari, LOW);", "desc": "Sarı söner." },
    { "code": "  digitalWrite(yesil, LOW);", "desc": "Yeşil söner." },
    { "code": "  delay(4000);", "desc": "Kırmızı ışık 4000 milisaniye, yani <strong>4 saniye</strong> sürer." },
    { "code": "", "desc": "Boş satır; adımları gözle ayırmak için." },
    { "code": "  // Geç: yeşil yanar, diğer iki LED söner", "desc": "İkinci adım: <strong>geç</strong>." },
    { "code": "  digitalWrite(kirmizi, LOW);", "desc": "Kırmızı söner." },
    { "code": "  digitalWrite(sari, LOW);", "desc": "Sarı sönük kalır. Zaten sönüktü ama yine yazılır: adımın resmi baştan çizilir." },
    { "code": "  digitalWrite(yesil, HIGH);", "desc": "Yeşil yanar." },
    { "code": "  delay(3000);", "desc": "Yeşil ışık <strong>3 saniye</strong> sürer." },
    { "code": "", "desc": "Boş satır." },
    { "code": "  // Hazırlan: sarı yanar, diğer iki LED söner", "desc": "Üçüncü adım: <strong>hazırlan</strong>." },
    { "code": "  digitalWrite(kirmizi, LOW);", "desc": "Kırmızı sönük." },
    { "code": "  digitalWrite(sari, HIGH);", "desc": "Sarı yanar." },
    { "code": "  digitalWrite(yesil, LOW);", "desc": "Yeşil söner." },
    { "code": "  delay(1000);", "desc": "Sarı ışık en kısası: <strong>1 saniye</strong>." },
    { "code": "}", "desc": "<code>loop()</code> bitti, en başa döner: yeniden kırmızı." }
  ],
  "quizQuestions": [
    {
      "q": "<code>const int sari = D6;</code> satırı ne yapar?",
      "options": ["Sarı LED'i 6 saniye yakar", "D6 pinine <code>sari</code> adını verir", "6 LED'i aynı anda yakar", "Sarı LED'i kapatır"],
      "answer": "dde5d3d5",
      "hint": "Bu satırdaki isim bir süre değil, pin adıdır.",
      "ipucu": "Bu satırdaki isim bir süre değil, pin adıdır."
    },
    {
      "q": "Kırmızı ışık yanarken sarı ve yeşil LED'e ne yazılır?",
      "options": ["İkisine de <code>LOW</code>", "İkisine de <code>HIGH</code>", "Birine <code>HIGH</code>, birine <code>LOW</code>", "Hiçbir şey yazılmaz"],
      "answer": "b0d1dfab",
      "hint": "Kırmızı yanarken diğer ikisi söner: ikisine de <code>LOW</code>.",
      "ipucu": "Her adımda üç LED'in de durumu yazılır."
    },
    {
      "q": "<code>delay(1000);</code> kaç saniye bekletir?",
      "options": ["10 saniye", "100 saniye", "1 saniye", "Hiç bekletmez"],
      "answer": "61b4bfe7",
      "hint": "1000 milisaniye 1 saniyedir.",
      "ipucu": "1000 milisaniye kaç saniye?"
    },
    {
      "q": "Kırmızı ışığın 4 saniye yerine 6 saniye yanması için hangi satırı değiştirmelisin?",
      "options": ["<code>delay(4000);</code> satırını <code>delay(6000);</code> yapmalısın", "<code>pinMode(kirmizi, OUTPUT);</code> satırını silmelisin", "<code>digitalWrite(sari, LOW);</code> satırını <code>HIGH</code> yapmalısın", "<code>const int kirmizi = D5;</code> satırını değiştirmelisin"],
      "answer": "abfa549c",
      "hint": "Süreyi belirleyen satır <code>delay</code> ile başlar.",
      "ipucu": "Süreyi belirleyen satır hangi kelimeyle başlar?"
    },
    {
      "q": "Kırmızı+sarı adımından sonra yeşile geçerken kaç <code>digitalWrite</code> satırının değeri değişir?",
      "options": ["1", "2", "3", "Hiçbiri"],
      "answer": "ee4853ac",
      "hint": "Kırmızı HIGH→LOW, sarı HIGH→LOW, yeşil LOW→HIGH: üçü de değişir.",
      "ipucu": "Her adımda üç LED'in de durumu yazılır; hangilerinin durumu gerçekten farklı?"
    }
  ],
  "aiPrompts": [
    {
      "level": 1,
      "cat": "Kavramsal Anlama",
      "catColor": "green",
      "title": "Süreler",
      "prompt": "Sen sabırlı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, D5'te kırmızı, D6'da sarı, D9'da yeşil LED'i olan bir trafik lambası modülü (dirençleri modülün üstünde) kullanıyorum. Süreleri değiştirmek istiyorum. Bana pin numarası veya bağlantı tarifi verme; sayı da verme. Kırmızının uzun, sarının kısa kalması için hangi delay satırlarını karşılaştırmam gerektiğini sorularla buldur."
    },
    {
      "level": 1,
      "cat": "Kod Okuma",
      "catColor": "blue",
      "title": "Üç digitalWrite Neden?",
      "prompt": "Sen bir kod okuma koçusun. Deneyap Mini v2'de D5, D6 ve D9'a bağlı üç LED'im var; kodumda her adımda üç digitalWrite satırı yazıyorum. Bana pin numarası veya bağlantı tarifi verme. Önceki adımdan kalan bir LED durumunun sonraki adımı neden etkileyebileceğini sorularla fark ettir."
    },
    {
      "level": 2,
      "cat": "Pekiştirme",
      "catColor": "blue",
      "title": "Kırmızı+Sarı Adımı",
      "prompt": "Sen ileri seviye bir mentorsun. Deneyap Mini v2'de kırmızı, sarı ve yeşil LED'li trafik lambama kırmızı+sarı adımını eklemek istiyorum. Pin numarası, direnç değeri veya bağlantı tarifi verme. Her LED'in o adımdaki durumunu kendim bulmam için 'hangileri yanacak, hangisi sönecek' diye sorular sor."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "void Nedir?",
      "prompt": "Sen meraklı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında üç LED'le bir trafik lambası yazdım, void setup() ve void loop() görüyorum. Bana pin numarası, direnç değeri veya bağlantı tarifi verme. Cevabı vermeden, void'in bir şeyin olup olmadığını mı yoksa bir şeyin nasıl davranacağını mı anlattığını düşündürecek bir soru sor; konu ileride tam açılacak."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "OUTPUT Nedir?",
      "prompt": "Sen meraklı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında üç pine de pinMode(..., OUTPUT) yazdım. Bana pin numarası, direnç değeri veya bağlantı tarifi verme. Cevabı vermeden, bir pinin dışarı elektrik verme ya da dışarıdan bilgi alma görevi olabileceğini düşündürecek bir soru sor; konu buton dersinde açılacak."
    }
  ]
};
