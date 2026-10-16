/* Ders 1.5 — Kara Şimşek.
   Kaynak: github.com/ozgur79/01_deneyapGiris_dk → dk0140_karaSimsek/ders.md + .ino
   (haritada portal_ders 1.5, ✅). Numara Portal-Ders-Haritasi.md'den.
   Devre: Arda (2026-10-05) "yeniden diz, tek sıra" — 1.4'ün devresi sökülür, dört LED
   üst blokta yan yana (wiring-diagram.js ledSirasi). Doğrulanmış sapmalar (Özgür'e bildirildi):
   - ders.md §4 "1.4'ün D5/D6 devresi duruyorsa sökme"; ışığın gidip geldiği tek sırada
     görünsün diye yeniden diziliyor (Arda'nın kararı).
   - ders.md §4 "her direncin diğer ucunu GND'ye bağla" ve malzeme 8 jumper; kart breadboard'a
     takılıyken GND sütunlarında tek boş delik var. Her LED'in kısa bacağı kendi direnciyle
     − rayına (dk'daki gibi kısa bacak → direnç → GND), ray kartın üst GND pinine tek
     kabloyla: 5 jumper. Yerleşim standart breadboard düzeni (2026-10-06): LED'in iki bacağı
     da üst blokta yan yana, direnç kısa bacağın sütunundan raya, kablo uzun bacağın sütununa.
   - Kartta D5'in yanında MI, D6'nın yanında MC yazar (1.2/1.4 ile aynı); D9 ve D10 kendi
     adlarıyla yazar. */
window.LESSON_DATA_1_5 = {
  "xpPrefix": "l15",
  "quizStorageKey": "quiz_lesson_1_5_passed",
  "ders": {
    "no": "1.5",
    "ad": "Kara Şimşek",
    "rozet": "Beşinci Kıvılcım",
    "rozetAlt": "Deneyap Atölyem - Kara Şimşek dersini başarıyla tamamladın!",
    "kutlamaAlt": "Ders 1.5 tamamlandı — dört LED, gidip gelen ışık!",
    "sonraki": { "href": "lesson-1-6.html", "label": "Sıradaki derse geç: Ders 1.6", "baslik": "Sıradaki: Ders 1.6 — Trafik Lambası", "metin": "Trafik lambası modülünün kırmızı, sarı ve yeşil ışığı gerçek bir trafik lambası gibi çalışacak." },
    "ledSirasi": [{ "pin": "D5" }, { "pin": "D6" }, { "pin": "D9" }, { "pin": "D10" }],
    "desen": [
      { "yanik": [0], "ms": 300 }, { "yanik": [1], "ms": 300 }, { "yanik": [2], "ms": 300 },
      { "yanik": [3], "ms": 300 }, { "yanik": [2], "ms": 300 }, { "yanik": [1], "ms": 300 }
    ],
    "kodNotu": "Pinlerin adları <code>led1</code>…<code>led4</code>. Her adımda dört LED'in de durumu tek tek yazılıyor; kod bu yüzden uzun.",
    "pinBaslik": "Pinleri kartta bulamıyor musun?",
    "pinAciklama": "Kartın alt kenarında <code>D5</code>'in yanında <strong>MI</strong>, <code>D6</code>'nın yanında <strong>MC</strong> yazar. Üst kenarda <strong>D9</strong> ve <strong>D10</strong> kendi adlarıyla yazar; hemen sollarında <strong>GND</strong> var.",
    "kurKapisi": "Dört LED'i tek sıraya diz: <strong>Hadi kuralım</strong>'a bas ve parçaları tak.",
    "bosBaslik": "Bu derste devre yeniden diziliyor: dört LED tek sırada.",
    "bosIpucu": "▶ <strong>Hadi kuralım</strong>’a bas: önce kart, sonra GND, LED’ler, dirençler ve dört kablo.",
    "bosNot": " Ders 1.4’teki devreni sök; LED’ler ve dirençler yine işine yarayacak.",
    "bitisKontrol": "Kartında eski kod duruyorsa LED'ler sırayla yanmaz. Yeni kodu bir sonraki adımda yükleyeceksin."
  },
  "materials": {
    "icon": "icon-box",
    "items": [
      "Deneyap Mini v2 Kartı",
      "Type-C USB Kablosu",
      "4 LED",
      "4 adet 220 ohm Direnç",
      "Breadboard",
      "5 Adet Jumper Kablo"
    ],
    "note": "Ders 1.4'teki devreni sök: bu derste dört LED tek sırada duracak. LED'lerin ve dirençlerin yine işine yarayacak.",
    "readyMessage": "Harika! Malzemelerin hazır."
  },
  "helpPrompt": "Deneyap Mini v2 kartıyla breadboard üzerinde dört LED'li bir kara şimşek devresi kurdum. LED'ler soldan sağa D5, D6, D9 ve D10 pinlerine bağlı; her LED'in uzun bacağı (+) kendi pinine, kısa bacağı (−) kendi 220 ohm direnci üzerinden breadboard'un eksi rayına bağlı; ray kartın GND pinine bağlı. Kartın mantık gerilimi 3.3V. Kodda pinlere const int ile led1, led2, led3, led4 adlarını veriyorum. loop() içinde 6 adım var: her adımda biri HIGH, üçü LOW, sonra delay(300). Işık 1-2-3-4-3-2 sırasıyla gidip gelmeli. Ama beklediğim gibi olmuyor. Bana yardım et ama hepsini birden anlatma: her seferinde TEK bir soru sor, cevabımı bekle, sonra bir sonraki adıma geç. Bana pin numarası, direnç değeri ya da bağlantı tarifi verme — bunları dersimdeki devre şeması belirliyor. Kontrol edilecekler şunlar olabilir: bir LED hiç yanmıyorsa o LED'in pinMode satırı var mı, LED ters mi takılmış, kablo doğru pinde mi; ışığın sırası karışıksa LED'lerin breadboard'daki dizilişi kodun sırasıyla aynı mı; uçtaki LED uzun yanıyorsa desende fazladan bir adım var mı; hepsi aynı anda yanıyorsa bir adımda birden fazla HIGH kalmış mı; hiçbiri yanmıyorsa eksi rayı kartın GND'sine bağlı mı, kod gerçekten yüklendi mi; Arduino IDE'de Araçlar > Kart menüsünde 'Deneyap Mini v2' seçili mi, Araçlar > Port menüsünde bir port görünüyor mu. Şunu da bil: kartın üzerinde D5 ve D6 yazmaz, D5'in yanında MI, D6'nın yanında MC yazar; D9 ve D10 kendi adlarıyla yazar. Bana kısa cümlelerle, yaşıma uygun ve sabırlı bir dille anlat.",
  "ledCheck": {
    "question": "Işık dört LED arasında gidip geliyor mu? Soldan sağa yürüyüp geri dönüyor mu?",
    "yesLabel": "Evet, gidip geliyor!",
    "noLabel": "Hayır, olmadı",
    "successText": "<strong>Harika!</strong> Buna <strong>kara şimşek</strong> denir. Uçtaki LED'ler de diğerleri kadar yanıyorsa desenin doğru. Şimdi İleri'ye bas ve kodun neden bu kadar uzun olduğunu keşfet.",
    "fixesIntro": "<strong>Olur böyle, hiç sorun değil.</strong> Ne gördüğüne göre sırayla bak:",
    "fixes": [
      {
        "icon": "bulb",
        "title": "Bir LED hiç yanmıyor, üçü çalışıyor mu?",
        "text": "Sırayla üç şey: kodda o LED'in kendi <code>pinMode</code> satırı var mı, LED ters takılmış mı (kısa bacak solda, direncin olduğu sütunda olmalı), kablo doğru pinde mi?"
      },
      {
        "icon": "breadboard",
        "title": "Işığın sırası karışık mı?",
        "text": "LED'lerin breadboard'daki dizilişi kodun sırasıyla aynı olmalı: soldan sağa <strong>D5 (MI) · D6 (MC) · D9 · D10</strong>."
      },
      {
        "icon": "alert",
        "title": "Hepsi aynı anda mı yanıyor, ya da uçtaki daha uzun mu?",
        "text": "Her adımda tam <strong>bir</strong> <code>digitalWrite</code> <code>HIGH</code> olmalı. Desen 1-2-3-4-3-2: uçlar tekrar edilmez."
      },
      {
        "icon": "wrench",
        "title": "Hiçbiri yanmıyor mu?",
        "text": "Siyah kablo üstteki <strong>GND</strong> pininden − rayına gidiyor mu? Kod gerçekten yüklendi mi: <strong>Araçlar &gt; Kart</strong>'ta Deneyap Mini v2, <strong>Araçlar &gt; Port</strong>'ta bir port seçili mi?"
      }
    ]
  },
  "quizCelebrateSub": "6 sorunun hepsini doğru bildin. Rozet çok yakın!",
  "stepsData": [
    {
      "title": "Adım 1: Hedefi Gör",
      "desc": "Bu derste <strong>dört LED</strong>'i yan yana dizip aralarında gidip gelen bir ışık yapacaksın: eski dizilerdeki <strong>kara şimşek</strong>. Devre kolay, asıl olay kodda: kod uzayacak ve bu uzunluk dersin konusu."
    },
    {
      "title": "Adım 2: Malzemeleri Topla",
      "desc": "4 LED, 4 adet 220 ohm direnç ve 5 jumper kablo. Ders 1.4'teki devreni sök; parçalar yine işine yarayacak. Hazırsan 'Malzemeleri Hazırladım!' butonuna bas."
    },
    {
      "title": "Adım 3: Devreyi Kur",
      "desc": "Kartını bilgisayara tak. <strong>Hadi kuralım</strong>'a bas: dört LED'i tek sıraya, soldan sağa D5-D6-D9-D10 sırasıyla tek tek takacağız."
    },
    {
      "title": "Adım 4: Kodu Yükle",
      "desc": "Bu kod dört LED'i sırayla yakar. Kopyala, Arduino IDE'de karta yükle."
    },
    {
      "title": "Adım 5: Kodu Çalıştır",
      "desc": "Kodu yükledin. Şimdi LED'lerine bak: ışık soldan sağa yürüyüp geri dönüyor mu?"
    },
    {
      "title": "Adım 6: Kodu Keşfet",
      "desc": "<code>loop()</code> içinde <strong>6 adım</strong> var; her adımda dört LED'in de ne yapacağı tek tek yazılıyor. Koda satır satır tıklayarak gör."
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
      "desc": "Tebrikler! Ders 1.5'i tamamladın. Merak ettiklerini <strong>AI Yoldaşına Sor</strong> butonuyla düşünerek keşfedebilirsin."
    }
  ],
  "wiringSteps": [
    "Deneyap kartı breadboard'a tak: USB-C girişi solda, pin sıraları orta kanalın iki yanında.",
    "Kartın üstteki <strong>GND</strong> pininden − rayına siyah kablo.",
    "Dört LED'i yan yana tak: iki bacak da g satırında, kısa bacak solda.",
    "Her LED'in kısa bacağının sütunundan − rayına bir direnç.",
    "<strong>D5</strong> (kartta MI) → 1. LED'in uzun bacağı.",
    "<strong>D6</strong> (kartta MC) → 2. LED'in uzun bacağı.",
    "<strong>D9</strong> → 3. LED'in uzun bacağı.",
    "<strong>D10</strong> → 4. LED'in uzun bacağı."
  ],
  "//wiringGuide": "Adım sırası wiring-diagram.js siraAdimlari ile aynı: kart, GND, LED'ler, dirençler, sonra her pinin kablosu.",
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
      "neden": "Dört LED'in de elektriği bu yoldan karta geri döner. Breadboard'un kenarındaki <b>− rayı</b> boydan boya bağlıdır: rayı bir kez GND'ye bağlarsan dört LED birden kullanır.",
      "nereye": "Bir ucu kartın <b>üst</b> kenarındaki <b>GND</b> pininin hemen üstündeki boş deliğe. Öbür ucu hemen yukarıdaki <b>−</b> (mavi çizgili) raya.",
      "kontrol": "Siyah kablo üstteki GND'den − rayına mı gidiyor? Alttaki GND değil, üstteki."
    },
    {
      "ad": "Dört LED",
      "adim3": ["led", "breadboard"],
      "xray": false,
      "neden": "Işığın gidip geldiğini görmek için LED'ler <b>yan yana</b> ve aralarında eşit boşlukla durmalı.",
      "nereye": "Kartın sağındaki boş sütunlara, LED'lerin arasında birer sütun boşluk. İki bacak da <b>g</b> satırında: <b>KISA</b> bacak (−) solda, <b>UZUN</b> bacak (+) hemen sağında.",
      "kontrol": "Dört LED'in de kısa bacağı solda mı? LED'lerin arasında birer boş sütun var mı?"
    },
    {
      "ad": "Dört direnç",
      "adim3": ["direnc"],
      "xray": false,
      "neden": "Her LED'in <b>kendi</b> direnci olmalı. Dört LED tek dirence bağlanırsa hepsi sönük yanar ve desen zor görünür.",
      "nereye": "Her direnç kendi LED'inin <b>kısa bacağının sütununda</b>: bir ucu yukarıdaki <b>−</b> (mavi çizgili) raya, öbür ucu aynı sütunda <b>j</b> satırına. Kısa bacaktan çıkan elektrik direnç üzerinden − rayına, oradan GND'ye döner.",
      "kontrol": "Her direnç, LED'inin kısa bacağıyla aynı sütunda mı? Üst ucu − rayında mı? Dört direnç dört ayrı sütunda mı?"
    },
    {
      "ad": "D5 kablosu (MI)",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "Birinci LED'e karttan elektrik bu kablo taşır. Kodda bu pinin adı <b>D5</b>, isim olarak <b>led1</b>.",
      "nereye": "Bir ucu kartın alt kenarında <b>MI</b> yazan pinin altındaki boş deliğe. Öbür ucu <b>1. LED'in</b> uzun bacağının sütununa, LED'in hemen önündeki <b>f</b> deliğine.",
      "kontrol": "Kart ucu MI'da mı? Öbür uç en soldaki LED'in uzun bacağıyla aynı sütunda mı?"
    },
    {
      "ad": "D6 kablosu (MC)",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "İkinci LED'in kablosu. Kodda <b>D6</b>, isim olarak <b>led2</b>.",
      "nereye": "Bir ucu <b>MC</b> yazan pinin altındaki boş deliğe (MI'nın hemen solunda). Öbür ucu <b>2. LED'in</b> uzun bacağının sütununa, LED'in önündeki <b>f</b> deliğine.",
      "kontrol": "Kart ucu MC'de mi? Öbür uç soldan ikinci LED'in uzun bacağıyla aynı sütunda mı?"
    },
    {
      "ad": "D9 kablosu",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "Üçüncü LED'in kablosu. Bu pin kartın <b>üst</b> kenarında ve kartta adı yazıyor: <b>D9</b>.",
      "nereye": "Bir ucu üst kenarda <b>D9</b> yazan pinin üstündeki boş deliğe. Öbür ucu <b>3. LED'in</b> uzun bacağının sütununa, LED'in arkasındaki <b>j</b> deliğine.",
      "kontrol": "Kart ucu D9'da mı? Öbür uç soldan üçüncü LED'in uzun bacağıyla aynı sütunda mı?"
    },
    {
      "ad": "D10 kablosu",
      "adim3": ["jumper", "kart"],
      "xray": false,
      "neden": "Dördüncü ve son LED'in kablosu: kartta <b>D10</b> yazar, D9'un hemen sağında.",
      "nereye": "Bir ucu üst kenarda <b>D10</b> yazan pinin üstündeki boş deliğe. Öbür ucu <b>4. LED'in</b> uzun bacağının sütununa, LED'in arkasındaki <b>j</b> deliğine.",
      "kontrol": "Devre tamam. Kodu bir sonraki adımda yükleyeceksin."
    }
  ],
  "senYap": [
    {
      "id": "ters",
      "gorev": "Deseni ters yönde başlat: ışık soldan değil <strong>sağdan</strong> başlasın (led4'ten led1'e gidip geri dönsün).",
      "ipucu": "Her adımda hangi LED'in <code>HIGH</code> olduğuna bak. Adımları değiştirmek yerine hangi LED'in yanacağını değiştirmen yeter mi?",
      "tip": "yaptim",
      "etiket": "Yaptım, ışık sağdan başlıyor"
    },
    {
      "id": "besinci",
      "gorev": "Beşinci bir LED eklesen kod ne kadar uzardı? Önce tahmin et, defterine yaz; sonra say. (Devreyi kurmana gerek yok, bu bir sayma görevi.)",
      "soru": "Beşinci LED için <code>loop()</code> içine kaç satır eklemen gerekirdi?",
      "ipucu": "Beş LED'le desen 1-2-3-4-5-4-3-2: kaç adım? Her adımda kaç <code>digitalWrite</code> ve kaç <code>delay</code> olur? Bugünkü 30 satırla karşılaştır.",
      "tip": "sayi",
      "cevap": 18,
      "dogru": "Evet, <strong>18</strong>. 8 adım × 6 satır = 48 satır olur, bugün 30. Tek bir LED eklemek 18 satır getiriyor: ileride öğreneceğin döngüler tam bu yüzden var."
    },
    {
      "id": "hiz",
      "gorev": "Bekleme süresini 300'den 100'e düşür ve karta yükle.",
      "soru": "Kaç satıra dokunman gerekti?",
      "ipucu": "<code>delay(300)</code> satırlarını yukarıdan aşağı say. Her adımın sonunda bir tane var.",
      "tip": "sayi",
      "cevap": 6,
      "dogru": "Evet, <strong>6</strong> satır. Ders 1.4'teki gibi bekleme süresine de isim verseydin (<code>const int bekle = 100;</code>) tek satırı değiştirmen yeterdi."
    }
  ],
  "yetiskinKarti": [
    "Çalışmayan LED'in kısa bacağı direncin sütununda, uzun bacağı kablonun sütununda mı?",
    "Koddaki pin adıyla (D5/D6/D9/D10) kablonun takılı olduğu pin aynı mı?",
    "O LED'in direncinin iki ucu da breadboard'a tam oturmuş mu?"
  ],
  "merakKosesi": {
    "baslik": "Merak Köşesi: bu kod neden bu kadar uzun?",
    "sahne": [{"tip": "sira", "ledler": ["kirmizi", "kirmizi", "kirmizi", "kirmizi"], "yanik": [0], "ms": 900, "yazi": "Adım 1: 1. LED yanar. Desen: 1-2-3-4-3-2"}, {"tip": "sira", "ledler": ["kirmizi", "kirmizi", "kirmizi", "kirmizi"], "yanik": [1], "ms": 900, "yazi": "Adım 2: 2. LED yanar. Desen: 1-2-3-4-3-2"}, {"tip": "sira", "ledler": ["kirmizi", "kirmizi", "kirmizi", "kirmizi"], "yanik": [2], "ms": 900, "yazi": "Adım 3: 3. LED yanar. Desen: 1-2-3-4-3-2"}, {"tip": "sira", "ledler": ["kirmizi", "kirmizi", "kirmizi", "kirmizi"], "yanik": [3], "ms": 900, "yazi": "Adım 4: 4. LED yanar. Desen: 1-2-3-4-3-2"}, {"tip": "sira", "ledler": ["kirmizi", "kirmizi", "kirmizi", "kirmizi"], "yanik": [2], "ms": 900, "yazi": "Adım 5: 3. LED yanar. Desen: 1-2-3-4-3-2"}, {"tip": "sira", "ledler": ["kirmizi", "kirmizi", "kirmizi", "kirmizi"], "yanik": [1], "ms": 900, "yazi": "Adım 6: 2. LED yanar. Desen: 1-2-3-4-3-2"}, {"tip": "sira", "ledler": ["kirmizi", "kirmizi", "kirmizi", "kirmizi"], "yanik": [0], "ms": 2600, "yazi": "Uçlar tekrar edilmez: 2'den sonra <code>loop()</code> başa döner, yine 1 yanar."}],
    "metin": "<code>loop()</code> içinde 6 adım var, her adım 4 <code>digitalWrite</code> + 1 <code>delay</code> = 5 satır. Toplam 30 satır ve bunların 24'ü birbirinin neredeyse aynısı; değişen tek şey hangi LED'in <code>HIGH</code> olduğu. Desen neden 6 adım, 8 değil? Gidip gelirken uçlar tekrar edilmez: 1-2-3-4-3-2'den sonra <code>loop()</code> başa döner ve 1 yanar. Yazarken hissettiğin o rahatsızlık haklı: aynı deseni çok daha kısa yazmanın bir yolu var. Onu Modül 2'de öğreneceksin ve bu devreye geri dönüp aynı işi birkaç satırda yapacaksın."
  },
  "ctlLines": [
    { "code": "/* BU KOD NE YAPAR?", "desc": "Kodun en üstündeki not: kart okumaz, ne yaptığını bize anlatır." },
    { "code": "  Bu kod, D5, D6, D9, D10 pinlerindeki 4 LED'de her adımda yalnız birini yakarak", "desc": "Dört pin, dört LED; her adımda yalnız biri yanar." },
    { "code": "  300 ms aralıkla 1-2-3-4-3-2 sırasında gidip gelen kara şimşek efekti verir ve tekrarlar.", "desc": "Desen 1-2-3-4-3-2: ışık sağ uca gidip geri döner." },
    { "code": "*/", "desc": "Not burada biter." },
    { "code": "", "desc": "Boş satır; kodun okunabilirliği için boşluk bırakılır." },
    { "code": "// Dört LED'i dört ayrı pine bağlarsan dördünü de ayrı ayrı yönetebilirsin", "desc": "Dört LED dört ayrı pine bağlanırsa dördü de ayrı ayrı yönetilebilir." },
    { "code": "// Her adımda dört LED'in de ne yapacağını tek tek yazıyoruz: biri HIGH, üçü LOW", "desc": "Her adımda dört LED'in de durumu tek tek yazılır: biri <code>HIGH</code>, üçü <code>LOW</code>." },
    { "code": "// Desen gidip geliyor: 1-2-3-4-3-2, sonra baştan", "desc": "Desen gidip gelir: 1-2-3-4-3-2, sonra başa döner." },
    { "code": "const int led1 = D5;", "desc": "D5 pinine <code>led1</code> adı verilir. İsim verme (<code>const int</code>) kavramını Ders 1.4'te görmüştün. Kartta bu pinin yanında <strong>MI</strong> yazar." },
    { "code": "const int led2 = D6;", "desc": "D6 pinine <code>led2</code> adı verilir. Kartta <strong>MC</strong> yazar." },
    { "code": "const int led3 = D9;", "desc": "D9 pinine <code>led3</code> adı verilir. Kartın üst kenarında <strong>D9</strong> yazar." },
    { "code": "const int led4 = D10;", "desc": "D10 pinine <code>led4</code> adı verilir. Kartın üst kenarında <strong>D10</strong> yazar." },
    { "code": "", "desc": "Boş satır." },
    { "code": "void setup() {", "desc": "<strong>Kara kutu:</strong> <code>void</code>, bu kod bölümünün sonunda bir değer vermediğini anlatır. Konu ileride açılacak." },
    { "code": "  pinMode(led1, OUTPUT);", "desc": "Birinci LED'in pinini çıkış yapar. <strong>Kara kutu:</strong> <code>OUTPUT</code>, pinin dışarıya elektrik vereceğini işaretler; buton dersinde açılacak." },
    { "code": "  pinMode(led2, OUTPUT);", "desc": "Dört pinin her birinin kendi satırı var: biri ötekini çıkış yapmaz." },
    { "code": "  pinMode(led3, OUTPUT);", "desc": "Üçüncü pin de çıkış." },
    { "code": "  pinMode(led4, OUTPUT);", "desc": "Dördüncü pin de çıkış." },
    { "code": "}", "desc": "<code>setup</code> bitti. Bu bölüm kart açılınca bir kez çalışır." },
    { "code": "", "desc": "Boş satır." },
    { "code": "void loop() {", "desc": "<code>loop()</code> içindeki satırlar <code>setup</code> bitince sürekli baştan tekrar eder." },
    { "code": "  // 1. adım: sadece led1 yanık", "desc": "Altı adımın ilki. Her adım aynı biçimde: dört <code>digitalWrite</code>, bir <code>delay</code>." },
    { "code": "  digitalWrite(led1, HIGH);", "desc": "O adımda yanacak LED'in pini açılır." },
    { "code": "  digitalWrite(led2, LOW);", "desc": "O adımda yanmayacak LED'lerin pinleri kapatılır." },
    { "code": "  digitalWrite(led3, LOW);", "desc": "Üçüncü LED sönük." },
    { "code": "  digitalWrite(led4, LOW);", "desc": "Dördüncü LED sönük." },
    { "code": "  delay(300);", "desc": "Bu görüntü 300 milisaniye ekranda kalır." },
    { "code": "", "desc": "Boş satır; adımları gözle ayırmak için." },
    { "code": "  // 2. adım: sadece led2 yanık", "desc": "Işık bir sağa kayar." },
    { "code": "  digitalWrite(led1, LOW);", "desc": "Birinci LED söner." },
    { "code": "  digitalWrite(led2, HIGH);", "desc": "İkinci LED yanar." },
    { "code": "  digitalWrite(led3, LOW);", "desc": "Üçüncü sönük kalır." },
    { "code": "  digitalWrite(led4, LOW);", "desc": "Dördüncü sönük kalır." },
    { "code": "  delay(300);", "desc": "300 milisaniye bekle." },
    { "code": "", "desc": "Boş satır." },
    { "code": "  // 3. adım: sadece led3 yanık", "desc": "Işık bir sağa daha kayar." },
    { "code": "  digitalWrite(led1, LOW);", "desc": "Birinci sönük." },
    { "code": "  digitalWrite(led2, LOW);", "desc": "İkinci söner." },
    { "code": "  digitalWrite(led3, HIGH);", "desc": "Üçüncü yanar." },
    { "code": "  digitalWrite(led4, LOW);", "desc": "Dördüncü sönük." },
    { "code": "  delay(300);", "desc": "300 milisaniye bekle." },
    { "code": "", "desc": "Boş satır." },
    { "code": "  // 4. adım: sadece led4 yanık (sağ uca vardık)", "desc": "Işık sağ uca vardı." },
    { "code": "  digitalWrite(led1, LOW);", "desc": "Birinci sönük." },
    { "code": "  digitalWrite(led2, LOW);", "desc": "İkinci sönük." },
    { "code": "  digitalWrite(led3, LOW);", "desc": "Üçüncü söner." },
    { "code": "  digitalWrite(led4, HIGH);", "desc": "Dördüncü yanar." },
    { "code": "  delay(300);", "desc": "300 milisaniye bekle." },
    { "code": "", "desc": "Boş satır." },
    { "code": "  // 5. adım: geri dönüyoruz, sadece led3 yanık", "desc": "Dönüş başlar: ışık sola kayar." },
    { "code": "  digitalWrite(led1, LOW);", "desc": "Birinci sönük." },
    { "code": "  digitalWrite(led2, LOW);", "desc": "İkinci sönük." },
    { "code": "  digitalWrite(led3, HIGH);", "desc": "Üçüncü yeniden yanar." },
    { "code": "  digitalWrite(led4, LOW);", "desc": "Dördüncü söner." },
    { "code": "  delay(300);", "desc": "300 milisaniye bekle." },
    { "code": "", "desc": "Boş satır." },
    { "code": "  // 6. adım: sadece led2 yanık; buradan sonra loop başa döner ve led1 yanar", "desc": "Son adım. Uçlar tekrar edilmez: led1 yeniden yazılsaydı her turda iki kat uzun yanardı." },
    { "code": "  digitalWrite(led1, LOW);", "desc": "Birinci sönük." },
    { "code": "  digitalWrite(led2, HIGH);", "desc": "İkinci yeniden yanar." },
    { "code": "  digitalWrite(led3, LOW);", "desc": "Üçüncü söner." },
    { "code": "  digitalWrite(led4, LOW);", "desc": "Dördüncü sönük." },
    { "code": "  delay(300);", "desc": "300 milisaniye bekle." },
    { "code": "}", "desc": "<code>loop()</code> bitti, en başa döner: 1. adım, led1 yanar." }
  ],
  "quizQuestions": [
    {
      "q": "<code>loop()</code> içinde kaç adım var?",
      "options": ["4", "6", "8", "30"],
      "answer": "44763d48",
      "hint": "Yorum satırlarındaki \"1. adım\", \"2. adım\" ifadelerini say.",
      "ipucu": "Yorum satırlarındaki \"1. adım\", \"2. adım\" ifadelerini say."
    },
    {
      "q": "Her adımda neden dört tane <code>digitalWrite</code> satırı var?",
      "options": ["Dört LED'in de o adımdaki durumu tek tek yazılıyor", "Her LED dört kez yakılıyor", "Dört farklı renk için", "Kart dört satır ister"],
      "answer": "bed0801c",
      "hint": "Bir LED yanarken diğer üçüne de ne olacağı yazılıyor.",
      "ipucu": "Bir LED yanarken diğer üçüne ne oluyor?"
    },
    {
      "q": "Işık sağ uca vardıktan sonra ne olur?",
      "options": ["Söner ve program durur", "Baştan sağ uca atlar", "Geri döner, soldan devam eder", "Dördü birden yanar"],
      "answer": "4d7a345c",
      "hint": "Desen 1-2-3-4-3-2: sağ uçtan sonra 3 ve 2 gelir.",
      "ipucu": "Desen 1-2-3-4-3-2."
    },
    {
      "q": "<code>const int led3 = D9;</code> satırı ne yapar?",
      "options": ["D9 pinine <code>led3</code> adını verir", "3 numaralı LED'i 9 kez yakar", "9 milisaniye bekler", "Üçüncü LED'i açar"],
      "answer": "fc3ee5f5",
      "hint": "Ders 1.4'te öğrendiğin satır: isim verir, LED'i yakmaz.",
      "ipucu": "Ders 1.4'te öğrendiğin satır. Eşittir işaretinin solunda ne var, sağında ne var?"
    },
    {
      "q": "Desende sondan bir kez daha 1. adım eklenseydi ne olurdu?",
      "options": ["Hiçbir sorun olmaz", "Kod derlenmez", "1. LED her turda iki kat uzun yanar, desen aksar", "4. LED hiç yanmaz"],
      "answer": "e4dd264c",
      "hint": "<code>loop()</code> bitince zaten 1. adım geliyor; bir tane daha eklenirse 1. LED arka arkaya iki adım yanar.",
      "ipucu": "<code>loop()</code> bittikten sonra hangi adım gelir?"
    },
    {
      "q": "Beş LED'lik bir kara şimşekte <code>loop()</code> içinde kaç <code>digitalWrite</code> satırı olur?",
      "options": ["20", "24", "40", "48"],
      "answer": "24761a97",
      "hint": "Desen 1-2-3-4-5-4-3-2: 8 adım, her adımda 5 LED'in durumu = 40 satır.",
      "ipucu": "8 adım × her adımda 5 LED'in durumu."
    }
  ],
  "aiPrompts": [
    {
      "level": 1,
      "cat": "Kavramsal Anlama",
      "catColor": "green",
      "title": "Hangi Satırlar Gerçekten Farklı?",
      "prompt": "Sen sabırlı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında, 3.3V mantık seviyesinde, D5/D6/D9/D10 pinlerine bağlı dört LED ve her biri için 220 ohm direnç kullanıyorum. Gidip gelen bir ışık deseni yazdım ve kodum çok uzadı. Bana pin numarası, direnç değeri, menü yolu veya bağlantı tarifi verme. Daha kısa yazmanın yolunu söyleme; bunun yerine 'bu satırların hangileri gerçekten birbirinden farklı?' diye sorarak farkı kendim görmemi sağla."
    },
    {
      "level": 1,
      "cat": "Hata Giderme",
      "catColor": "blue",
      "title": "Bir LED Yanmıyor",
      "prompt": "Sen bir hata ayıklama koçusun. Deneyap Mini v2'de D5/D6/D9/D10 pinlerine 220 ohm dirençlerle bağlı dört LED'im var; üçü çalışıyor, biri hiç yanmıyor. Bana pin numarası, direnç değeri veya bağlantı tarifi verme. Bunun yerine hangi üç şeyi sırayla kontrol etmem gerektiğini soru sorarak buldur."
    },
    {
      "level": 2,
      "cat": "Pekiştirme",
      "catColor": "blue",
      "title": "Beşinci LED Hesabı",
      "prompt": "Sen ileri seviye bir mentorsun. Deneyap Mini v2'de dört LED'lik bir desenim var; her adım 4 digitalWrite + 1 delay = 5 satır, 6 adım = 30 satır. Beşinci LED eklersem kaç satır olacağını sen hesaplama; 'adım sayısı nasıl değişir, her adımda kaç satır olur' diye sorarak bana hesaplattır. Pin numarası ya da direnç değeri verme, gerekmiyor zaten."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "void Nedir?",
      "prompt": "Sen meraklı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında dört LED yakıp söndüren bir kod yazdım, void setup() ve void loop() görüyorum. Bana pin numarası, direnç değeri veya bağlantı tarifi verme. Cevabı vermeden, void'in bir şeyin olup olmadığını mı yoksa bir şeyin nasıl davranacağını mı anlattığını düşündürecek bir soru sor; konu ileride tam açılacak."
    },
    {
      "level": 1,
      "cat": "Kara Kutu",
      "catColor": "red",
      "title": "OUTPUT Nedir?",
      "prompt": "Sen meraklı bir öğretmensin. Bağlam: Deneyap Mini v2 kartında dört LED'in dördüne de pinMode(..., OUTPUT) yazdım. Bana pin numarası, direnç değeri veya bağlantı tarifi verme. Cevabı vermeden, bir pinin dışarı elektrik verme ya da dışarıdan bilgi alma görevi olabileceğini düşündürecek bir soru sor; konu buton dersinde açılacak."
    }
  ]
};
