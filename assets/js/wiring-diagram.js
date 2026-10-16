/* ============================================================
   DEVRE KURMA ŞEMASI — adım adım etkileşimli SVG
   ============================================================
   Ders 1.2'nin sol panelindeki statik PNG'nin yerini alır.
   Çocuk her adımda parçanın YERLEŞTİĞİNİ ve kablonun ÇİZİLDİĞİNİ
   görür; devre tamamlanınca akım D5'ten çıkıp GND'ye döner.

   Kullanım:
     var wd = WiringDiagram.mount({
       container: document.getElementById('simulationBox'),
       steps: LESSON_DATA_1_2.wiringSteps   // 4 madde
     });
     wd.setStep(0);   // dışarıdan senkron (ders adımına bağlamak için)

   Bağımlılık yok. fx.js varsa kutlama/ses için kullanılır, yoksa sessizce
   atlanır. file:// ile çalışır, build gerekmez.

   ÖLÇÜ NOTU (viewBox -172 -16 730 302):
     breadboard x 44..546, y 14..272; orta kanal y 135..151
     güç rayları y 30/42 (üst) ve 244/256 (alt) — bu derste BOŞ
     sütunlar   x = 70 + i*15.4  (i = 0..29) — adım kartın pin adımıyla AYNI
     üst satırlar y = 66, 81.4, 96.8, 112.2, 127.6
     kart       breadboard'a TAKILI: x 84.2..352.2, y 69.1..209.1
     satır harfleri: ROW_UP j i h g f (j en üstte), ROW_DOWN e d c b a
     KART 180 DERECE DÖNÜK (port solda, D5 aşağıda), bu yüzden pinleri
     ALT blokta: satır b'yi (y 204.6) DOLDURUYOR — o sütunlarda tek boş
     delik a (y 220). Kartın DIŞINDAKİ sütunlarda beş satır da boş.
     LED ve direnç ÜST blokta kaldı; kablolar kartın SAĞINDAN dolaşıyor.
   Devrenin kurulduğu satırlar:
     y 66   (SIRA_DIS / SIRA_KART) — LED bacakları, siyah kablonun direnç
            ucu, ve İKİ kablonun da KART ucu
     y 81.4 (SIRA_IC / SIRA_PIN)   — direnç, kabloların LED/direnç ucu
            (kartın dışındaki sütunlarda); kartın altında ise pin sırası
   Aynı sütundaki delikler bağlıdır; kartın pinleri de aynı sütunlarda:
     D5 (kartta Mİ) COL[11] ; GND COL[6] — ÖLÇÜLDÜ; pin b'de, kablo a'da
     (GND artık Mİ'nın SOLUNDA: kart dönünce alt sıra ters çevrildi)
     LED anot COL[20] ; LED katot COL[22] ; direnç sağ ucu COL[26]
   ============================================================ */

(function (global) {
  'use strict';

  /* ---- IZGARA ----
     Kart artık breadboard'a TAKILI (Arda: "Deneyap kart breadboard'a da
     takılı olmalı"; dersin kendi devre görseli de böyle:
     assets/img/ders1-2-devre.png). Bunun bir zorunluluğu var: breadboard'un
     sütun adımı kartın PİN ADIMIYLA aynı olmalı, yoksa kart delikere
     oturmaz. Kartın pin adımı 15.4 birim (bkz. board-svg.js), o yüzden
     sütunlar da 15.4 adımla dizildi — eski 27 birimlik keyfi adım gitti.
     30 sütun: gerçek orta boy breadboard'da da 30 var. */
  var P = 15.4;
  var COL = (function () { var a = [], i; for (i = 0; i < 30; i++) a.push(+(70 + i * P).toFixed(1)); return a; })();
  var ROW_UP = [66, 81.4, 96.8, 112.2, 127.6];
  var ROW_DOWN = [158.4, 173.8, 189.2, 204.6, 220];
  var KANAL_Y = 135, KANAL_H = 16;

  /* Güç rayları: gerçek breadboard'un iki kenarındaki + / − sıraları.
     BU DERSTE KULLANILMIYOR — sadece ekrandaki tahta masadakine benzesin
     diye çiziliyor (Arda, 2026-09-17). Devre bugünkü gibi direnç ucundan
     doğrudan kartın GND pinine gidiyor; rayları devreye sokmak 5. bir adım
     ve 3. bir jumper getirirdi, "her adımda tek iş" kuralını bozardı. */
  var RAIL_UP = [30, 42];     // üst blok: + sırası, − sırası
  var RAIL_DOWN = [244, 256]; // alt blok

  /* Kartın yerleşimi: rotate(-90) sonrası kart -48..220 / 90..230
     aralığında; aşağıdaki kaydırma ilk pin sütununu COL[3]'e, kartın
     gövdesini de kanalın üstüne oturtuyor. Kart üst bloğun alt üç
     sırasını ve alt bloğun tamamını KAPATIYOR — gerçekte de öyle;
     serbest kalan iki üst sıra (66 ve 81.4) devrenin kurulduğu yer. */
  /* KART_DY: kartin pin pedleri TAM bir delik sirasina otursun diye
     OLCULEREK turetilir, asla tahminle yazilmaz.
     2026-09-22 olcumu: kart 180 derece cevrildikten (port solda, D5
     asagida) sonra pedin kart-yerel merkezi y=225.5 — yani pinler artik
     kartin ALT kenarinda. `225.5 + KART_DY = 204.6` (SIRA_PIN, 'b')
     -> KART_DY = -20.9. Govde boylece 69.1..209.1'de ve tek bos delik
     'a' (220) govdenin 10.9 ALTINDA kaliyor.
     Iki eski deger de bir delige OTURMUYORDU: -1.6 -> ped 92.9,
     -13.1 -> ped 212.4. Ikisi de iki sira ARASINDA kaldi ve tester
     dogru deligi bulamadi (Arda, 2026-09-20/21/22). */
  var KART_DX = 132.2, KART_DY = -20.9;
  var SIRA_DIS = ROW_UP[0];      // 66   — LED bacakları, siyah kablo
  var SIRA_IC  = ROW_UP[1];      // 81.4 — kırmızı kablo, direnç

  /* Breadboard harfleri (Arda, 2026-09-21): j üstte, a altta. Üst blok
     yukarıdan aşağı J I H G F. Yani ROW_UP[0]=j, ROW_UP[1]=i.
       SIRA_PIN  — kartın pinlerinin DOLDURDUĞU sıra (i). Buraya kablo
                   takılamaz, delik zaten dolu.
       SIRA_KART — kabloların kart ucunun gittiği sıra (j). Kartın
                   kapattığı sütunlarda çocuğun elinde kalan TEK boş delik.
     Kabloların öbür ucu (LED/direnç sütunları) kartın DIŞINDA kalıyor,
     orada beş sıra da boş — o uçlar SIRA_IC'te kalmaya devam ediyor. */
  /* 2026-09-22: kart 180 derece dönünce D5/GND pinleri kartın ALT
     kenarına indi. Pin sırası artık üst bloktaki i değil, alt bloktaki b.
     Kabloların kart ucu da pinin hemen ALTINDAKİ tek boş delik: a.
     LED ve direnç ÜST BLOKTA, olduğu yerde ve DİK kalıyor (aynalamak
     gövdeleri baş aşağı çevirdi, Arda: "led direnç falan ters") —
     bunun yerine kablolar kartın SAĞ kenarından dolaşıp yukarı çıkıyor. */
  var SIRA_PIN  = ROW_DOWN[3];   // 204.6 (b) — D5/GND pinleri burada
  var SIRA_KART = ROW_DOWN[4];   // 220   (a) — kabloların kart ucu

  /* Devrede kullanılan sütunlar. Kartın pinleri de aynı sütunlarda:
     D5 (kartta Mİ) COL[9], GND COL[14] — "aynı sütun birbirine bağlı"
     dersinin kalbi artık gözün önünde. */
  /* ÖLÇÜLDÜ (2026-09-22), tahmin edilmedi. Kart 180 derece dönünce alt
     sıra soldan sağa GND, 3V3, SD, SC, MC, MI, ... oldu; yani GND artık
     MI'nın SOLUNDA. Eski değerler (D5=9, GND=14) dönüşten önceki düzenin
     kalıntısıydı ve kabloları yanlış pine takıyordu: sütun 9 = SC pini,
     sütun 14 = D2 pini (Arda: "kablolar başka pine takılı").
     Doğrulama: #wd-ring-d5 sahne x'i sütun 11'e, #wd-ring-gnd sütun 6'ya
     denk geliyor. */
  var C_D5 = 11, C_GND = 6, C_ANOT = 20, C_KATOT = 22, C_DIRENC = 26;

  /* Kartı breadboard'a takma (Arda, 2026-10-14: "devre kurulumunda Deneyap'ı da breadboard'a takma
     kısmı gelsin; 1. adım eğitim kitinden çıkan kart breadboard'a takılsın"). Sıfırdan kurulan her
     dersin İLK adımı (1.2, 1.3, 1.5, 1.6, 2.1, 2.2, 3.1). 1.4'te yok: o ders 1.2'nin kurulu devresine
     ekleme yapıyor (STEPS2). Kart bu derslerde bir parça gibi davranır (#wd-part-kart): boş tezgahta
     yok, adımında yukarıdan inip oturur; USB kablosu ve fiş kartla birlikte gelir. */
  var KART_ADIMI = {
    part: 'kart',
    chip: 'Kart',
    ring: null,
    col: null,
    hint: 'Kartın pinleri orta kanalın iki yanına otursun.',
    checkpoint: 'Bütün pinler delikte, USB-C girişi solda; kartın üstünde ve altında birer sıra boş delik kaldı.'
  };

  /* Adım tanımları: hangi parça açılır, hangi pin/sütun vurgulanır. */
  var STEPS = [
    KART_ADIMI,
    {
      part: 'led',
      chip: 'LED',
      ring: null,
      col: 'a',
      hint: 'LED’in uzun bacağı artı (+), kısa bacağı eksi (−).',
      checkpoint: 'Uzun bacak solda, kısa bacak sağda durmalı. Değilse LED’i çıkar, çevirip tekrar tak.'
    },
    {
      part: 'jumper-red',
      chip: 'D5 kablosu',
      ring: 'd5',
      col: 'a',
      hint: 'Aynı sütundaki delikler birbirine bağlıdır.',
      checkpoint: 'Kırmızı kablo LED’in bacağıyla AYNI sütunda olmalı. Kartın ucu D5’te (MI yazan pin) olmalı.'
    },
    {
      part: 'resistor',
      chip: 'Direnç',
      ring: null,
      col: 'k',
      hint: 'Direnç, LED’e giden akımı azaltır.',
      checkpoint: 'Direncin bir ucu LED’in kısa bacağıyla aynı sütunda olmalı. Değilse sütunu kontrol et.'
    },
    {
      part: 'jumper-black',
      chip: 'GND kablosu',
      ring: 'gnd',
      col: 'r',
      hint: 'Devre tamam. Şimdi aşağıdaki kodu karta yükle.',
      checkpoint: 'Siyah kablo direncin diğer ucundan kartın GND pinine gitmeli. LED henüz YANMAZ — karta kod yüklemedin. Kod hemen aşağıda.'
    },
    /* Kurulum dizisi burada biter. Arduino tarafı (kodu yapıştır, kartı
       ve portu seç, yükle) ANIMASYON DEĞİL: Arda "öyle istememiştim" dedi.
       O iş Adım 4'ün altında, gerçek kodla ve gerçek adımlarla anlatılıyor
       (bkz. lesson-1-2.js → kodOnizlemeHtml / yuklemeAdimlariHtml). */
  ];

  /* Sütun -> ring id eşlemesi: yalnızca 3 sütun devrede kullanılıyor
     (LED anot=2, LED katot/direnç sol=4, direnç sağ/GND=8 — bkz. dosya
     başındaki ÖLÇÜ NOTU). Faz C1'de metal şerit vurgusu bu üçü için. */
  var COL_KEY = { 20: 'a', 22: 'k', 26: 'r' };

  /* Her parçanın tahtaya girdiği delikler (sahne koordinatı). Takma
     hareketi "tık" halkasını buralarda çiziyor. Kablolarda sıra önemli:
     [başlangıç, bitiş] — yolun çizildiği yönle aynı. */
  var TAK_DELIK = {
    /* Kart: iki pin sırasının uç pinleri — üstte 5V..A0 (sütun 3..17, y 73.6 ölçüldü, bkz.
       SIRA_UST_PIN), altta GND..EN (sütun 6..17, satır b). 3B kamera da buraya yaklaşır. */
    'kart':         [[COL[3], 73.6], [COL[17], 73.6], [COL[6], ROW_DOWN[3]], [COL[17], ROW_DOWN[3]]],
    'led':          [[COL[C_ANOT], SIRA_DIS], [COL[C_KATOT], SIRA_DIS]],
    'resistor':     [[COL[C_KATOT], SIRA_IC], [COL[C_DIRENC], SIRA_IC]],
    'jumper-red':   [[COL[C_D5], SIRA_KART], [COL[C_ANOT], SIRA_IC]],
    'jumper-black': [[COL[C_DIRENC], SIRA_DIS], [COL[C_GND], SIRA_KART]]
  };

  /* ============================================================
     DERS 1.4 — İKİNCİ LED ZİNCİRİ (mount({ ikinciLed: true }))
     ============================================================
     Birinci zincir (D5 → LED → direnç → GND) Ders 1.2'den beri tezgahta
     duruyor ve bu derste SÖKÜLMÜYOR (dk0030 §4). İkinci zincir birincinin
     kopyası, ALT BLOKTA: üst blokta kartın sağında yalnızca 11 sütun var,
     birinci zincir 7'sini kullanıyor.
       LED2 bacakları   satır e (158.4)  sütun 22 (+) / 24 (−)
       direnç 2         satır d (173.8)  sütun 24 → 28
       D6 kablosu       kartın MC pini (sütun 10, alttaki boş delik a)
                        → sütun 22, satır d
       GND köprüsü      sütun 28 satır e → sütun 26 ÜST blok satır f
     GND KÖPRÜSÜ NEDEN KARTA GİTMİYOR: kartın alt GND sütununda (6) boş
     delik yalnızca bir tane (a) ve orada birinci siyah kablo var. Üstteki
     GND pini ise breadboard'un bir sırasına oturmuyor (kartın iki pin
     sırası 8.5 adım arayla çizili). Direncin ucu, zaten GND'ye giden
     sütun 26'ya kısa bir kabloyla bağlanıyor: 1.2'nin "aynı sütun
     bağlıdır" kuralı. Toplam kablo 4 — dk0030 malzeme listesiyle aynı.
     Zincirin geometrisi birincinin (DX2, DY2) kaydırılmışı; LED ve direnç
     çizimi TEK kaynaktan (ledIc/direncIc) geliyor. */
  var C2_D6 = 10, C2_ANOT = 22, C2_KATOT = 24, C2_DIRENC = 28;
  var DX2 = +(COL[C2_ANOT] - COL[C_ANOT]).toFixed(1);  // 30.8
  var DY2 = +(ROW_DOWN[0] - ROW_UP[0]).toFixed(1);   // 92.4: j → e, i → d
  var SIRA2_DIS = ROW_DOWN[0], SIRA2_IC = ROW_DOWN[1];
  var SIRA_KOPRU = ROW_UP[4];                         // f (127.6), sütun 26'nın boş deliği

  var STEPS2 = [
    {
      part: 'led2', chip: '2. LED', ring: null, col: ['a2'],
      hint: 'İkinci LED’in de uzun bacağı artı (+), kısa bacağı eksi (−).',
      checkpoint: 'İkinci LED kanalın ALTINDAKİ blokta. Uzun bacak solda, kısa bacak sağda.'
    },
    {
      part: 'jumper-d6', chip: 'D6 kablosu', ring: 'd6', col: ['a2'],
      hint: 'Aynı sütundaki delikler birbirine bağlıdır.',
      checkpoint: 'Kablonun kart ucu MC yazan pinin altında (kodda D6). Öbür ucu ikinci LED’in uzun bacağının sütununda.'
    },
    {
      part: 'resistor2', chip: '2. direnç', ring: null, col: ['k2'],
      hint: 'Her LED’in kendi direnci olmalı.',
      checkpoint: 'Direncin bir ucu ikinci LED’in kısa bacağıyla aynı sütunda.'
    },
    {
      part: 'jumper-gnd2', chip: 'GND köprüsü', ring: null, col: ['r2', 'g2'],
      hint: 'Birinci direncin sütunu zaten GND’ye gidiyor.',
      checkpoint: 'Kısa kablo ikinci direncin boş ucundan, birinci direncin GND’ye giden sütununa gidiyor.'
    }
  ];
  /* Nabız eşlemesi: üst blok (data-col) ve alt blok (data-col2) ayrı. */
  var COL_KEY2_UST = { 26: 'g2' };
  var COL_KEY2_ALT = { 22: 'a2', 24: 'k2', 28: 'r2' };

  function d6WirePath() {
    var a = COL[C2_D6], b = COL[C2_ANOT];
    return 'M' + a + ' ' + SIRA_KART +
      ' C ' + (a + 8) + ' 247 ' + (a + 76) + ' 244 ' + (a + 126) + ' 243' +
      ' C ' + (b - 17) + ' 242 ' + b + ' 222 ' + b + ' ' + SIRA2_IC;
  }
  function kopruPath() {
    var a = COL[C2_DIRENC], b = COL[C_DIRENC];
    return 'M' + a + ' ' + SIRA2_DIS +
      ' C ' + (a + 6) + ' ' + (SIRA2_DIS - 24) + ' ' + (b + 4) + ' ' + (SIRA_KOPRU + 26) + ' ' + b + ' ' + SIRA_KOPRU;
  }
  /* Birinci siyah kablo bu derste tahtanın SAĞ kenarından iner: 1.2'deki
     yolu ikinci direncin ve köprünün tam üstünden geçiyordu. Gerçekte
     kablo aynı kablo, yalnızca kıvrımı farklı; çocuk sökmüyor. */
  function blackWirePath2() {
    var x = COL[C_DIRENC];
    return 'M' + x + ' ' + SIRA_DIS +
      ' C ' + (x + 36) + ' 56 ' + (x + 68) + ' 86 ' + (x + 68) + ' 140' +
      ' C ' + (x + 68) + ' 214 ' + (x + 56) + ' 254 ' + (x - 4) + ' 256' +
      ' C ' + (COL[C_D5] + 60) + ' 260 ' + (COL[C_GND] + 24) + ' 262 ' + COL[C_GND] + ' ' + SIRA_KART;
  }

  TAK_DELIK['led2'] = [[COL[C2_ANOT], SIRA2_DIS], [COL[C2_KATOT], SIRA2_DIS]];
  TAK_DELIK['resistor2'] = [[COL[C2_KATOT], SIRA2_IC], [COL[C2_DIRENC], SIRA2_IC]];
  TAK_DELIK['jumper-d6'] = [[COL[C2_D6], SIRA_KART], [COL[C2_ANOT], SIRA2_IC]];
  TAK_DELIK['jumper-gnd2'] = [[COL[C2_DIRENC], SIRA2_DIS], [COL[C_DIRENC], SIRA_KOPRU]];

  /* ============================================================
     DERS 1.5 / 1.6 — LED SIRASI (mount({ ledSirasi: [...] }))
     ============================================================
     Arda (2026-10-05): "yeniden diz, tek sıra". 1.4'ün devresi sökülür;
     LED'ler üst blokta soldan sağa D5-D6-D9-D10 sırasıyla yan yana durur,
     ışığın gidip geldiği (1.5) ya da lambanın rengi (1.6) net görünür.
     Kartın sağında yalnız 11 boş sütun var (19..29), bu yüzden düzen sıkı.
     Standart breadboard düzeni (Arda, 2026-10-06: "internetten araştırarak öğren";
     Knight Rider / trafik lambası anlatımlarının ortak düzeni): LED'in İKİ bacağı da
     üst blokta yan yana iki sütunda, kısa bacağın sütunundan direnç − rayına, pinin
     kablosu uzun bacağın sütununa. dk'nın devresinin aynısı (kısa bacak → 220 Ω → GND).
       LED k        KISA bacak (−) sütun K = 19 + 3k, UZUN bacak (+) K+1; ikisi de
                    satır g (112.2). Kısa bacak solda: − rayında 18/24. delik yok
                    (beşerli gruplar) ve ray 28'de biter; K = 19/22/25/28'in hepsinde
                    ray deliği var, dirençler dümdüz iner. Aradaki K+2 sütunu boş.
       direnç k     K sütununda, − rayından (42) j satırına (66). Üst blokta aynı
                    sütun bağlı: j ile g, yani direnç kısa bacağa bağlanır. Kısa
                    aralık: 3B'de gerçek kitlerdeki gibi dik durur (sahne3b.js).
       kablo k      kartın pininden K+1 sütununa, LED'in KENDİ TARAFINDAN (aynı sütunun
                    bütün delikleri bağlı; 3B'de kablo LED'in arkasına dolanmasın,
                    Arda 2026-10-06 "estetik dursun"). D9 / D10 kartın ÜST kenarında
                    (ölçüldü: sütun 6 / 7, pin y 73.6): pinin üstündeki boş delikten
                    (j) çıkar, rayların üstünden geçip LED'in arkasındaki j deliğine
                    iner. D5 (MI) / D6 (MC) kartın ALT kenarında: alttaki boş delikten
                    (a) çıkar, kartın altından sağa, K+1 sütunundan dümdüz yukarı
                    çıkıp LED'in önündeki f deliğine girer.
       GND kablosu  kartın ÜST GND pini (sütun 5) j deliğinden − rayına.
     Toplam kablo: LED sayısı + 1. dk malzeme listesi 8 diyor (her direnç ayrı GND
     kablosu); kart takılıyken GND sütunlarında tek boş delik var, ray bunu çözüyor. */
  var SIRA_RAY = RAIL_UP[1];                 // 42: üst − rayı
  var SIRA_LED = ROW_UP[3];                  // 112.2 (g): LED'in iki bacağı
  var SIRA_DIR_UC = ROW_UP[0];               // 66 (j): direncin alt ucu
  function siraUc(pin) { return SIRA_PINLER[pin].ust ? ROW_UP[0] : ROW_UP[4]; }   // kablonun LED ucu: j / f
  var SIRA_UST_PIN = 73.6;                   // kartın üst pin sırası (ölçüldü)
  var C_GND_UST = 5;
  var SIRA_PINLER = {                        // sütun, kartın hangi kenarında, kartta ne yazar
    D5: { s: 11, ust: false, etiket: 'MI' }, D6: { s: 10, ust: false, etiket: 'MC' },
    D9: { s: 6, ust: true, etiket: 'D9' }, D10: { s: 7, ust: true, etiket: 'D10' },
    '3V3': { s: 4, ust: true, etiket: '3V3' }                       // Ders 3.1: butonun beslemesi
  };
  function siraKatot(k) { return 19 + 3 * k; }        // kısa bacak + direnç sütunu
  function siraAnot(k) { return siraKatot(k) + 1; }   // uzun bacak + kablo sütunu
  function siraKartUcu(pin) {
    var p = SIRA_PINLER[pin];
    return [COL[p.s], p.ust ? SIRA_DIS : SIRA_KART];
  }
  function siraTelYolu(pin, k) {
    var a = siraKartUcu(pin), xA = COL[siraAnot(k)], u = siraUc(pin);
    if (!SIRA_PINLER[pin].ust) {
      /* Kartın altındaki koridordan (y 236..250) sağa, uzun bacağın sütunundan dümdüz
         yukarı, kanalın üstünden LED'in önündeki f deliğine. */
      var y = 236 + 6 * k;
      return 'M' + a[0] + ' ' + a[1] + ' C ' + (a[0] + 30) + ' ' + y + ' ' + (xA - 30) + ' ' + y + ' ' + xA + ' ' + (y - 40) +
        ' L ' + xA + ' ' + u;
    }
    /* Üst kenar: yukarı çık, rayların üstünden sağa, LED'in arkasındaki j deliğine in. */
    var yu = 12 - 5 * (k - 2);
    return 'M' + a[0] + ' ' + a[1] + ' C ' + a[0] + ' ' + yu + ' ' + xA + ' ' + yu + ' ' + xA + ' ' + u;
  }
  function siraGndYolu() {
    var x = COL[C_GND_UST];
    // Kısa kablo: iki delik arası 24 birim; hafif sola şişen yay (kanca görüntüsü vermesin).
    return 'M' + x + ' ' + SIRA_DIS + ' C ' + (x - 7) + ' ' + (SIRA_DIS - 9) + ' ' + (x - 7) + ' ' + (SIRA_RAY + 9) + ' ' + x + ' ' + SIRA_RAY;
  }
  /* Bir adımlık LED: iki bacak da f satırında (kısa sol K, uzun sağ K+1), gövde bacakların
     üstünde ayakta. Renkler grup üstündeki CSS değişkenlerinden (.is-sira, wiring-diagram.css). */
  function ledSiraIc(K) {
    var xk = COL[K], xa = COL[K + 1], xm = (xa + xk) / 2, y = SIRA_LED, t = y - 40;   // t: gövdenin tepesi
    return '' +
'    <circle class="wd-led-glow" cx="' + xm + '" cy="' + (t + 11) + '" r="22" filter="url(#wd-blur)"/>' +
'    <path d="M' + (xa - 2) + ' ' + (t + 32) + ' L' + xa + ' ' + y + '" stroke="url(#wd-leg-metal)" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
'    <path d="M' + (xk + 2) + ' ' + (t + 32) + ' L' + xk + ' ' + y + '" stroke="url(#wd-leg-metal)" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
'    <ellipse class="wd-leg-land" cx="' + xa + '" cy="' + y + '" rx="3" ry="1.8"/>' +
'    <ellipse class="wd-leg-land" cx="' + xk + '" cy="' + y + '" rx="3" ry="1.8"/>' +
'    <path class="wd-led-bulb" d="M' + (xk - 5) + ' ' + (t + 28) + ' L' + (xk - 5) + ' ' + (t + 13) + ' A12.7 12.7 0 0 1 ' + (xa + 5) + ' ' + (t + 13) + ' L' + (xa + 5) + ' ' + (t + 28) + ' Z"/>' +
'    <rect class="wd-led-bulb" x="' + (xk - 8) + '" y="' + (t + 26) + '" width="' + (xa - xk + 16) + '" height="6" rx="3"/>' +
'    <path class="wd-led-glass" d="M' + (xk - 5) + ' ' + (t + 28) + ' L' + (xk - 5) + ' ' + (t + 13) + ' A12.7 12.7 0 0 1 ' + (xa + 5) + ' ' + (t + 13) + ' L' + (xa + 5) + ' ' + (t + 28) + ' Z" fill="url(#wd-led-shade)"/>' +
'    <rect class="wd-led-glass" x="' + (xk - 8) + '" y="' + (t + 26) + '" width="' + (xa - xk + 16) + '" height="6" rx="3" fill="url(#wd-led-rim)"/>' +
'    <ellipse class="wd-led-glass" cx="' + (xk + 1) + '" cy="' + (t + 10) + '" rx="2.6" ry="5.5" fill="#fff" opacity="0.55" transform="rotate(18 ' + (xk + 1) + ' ' + (t + 10) + ')"/>';
  }
  /* − rayından j satırına inen dikey direnç (220 Ω: kırmızı-kırmızı-kahve + altın). */
  function direncDikIc(A, bant) {
    bant = bant || ['#C0392B', '#C0392B', '#6E4B23'];   // varsayılan 220 Ω; 10K: kahverengi-siyah-turuncu
    var x = COL[A], y0 = SIRA_RAY, y1 = SIRA_DIR_UC, b0 = y0 + 4, bh = y1 - y0 - 8;
    return '' +
'    <path d="M' + x + ' ' + y0 + ' V' + y1 + '" stroke="#A9B0BA" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
'    <rect x="' + (x - 6) + '" y="' + b0 + '" width="12" height="' + bh + '" rx="5" fill="#E7CF9C" stroke="#BC9C5E" stroke-width="0.8"/>' +
'    <rect x="' + (x - 6) + '" y="' + (b0 + 3) + '" width="12" height="2.6" fill="' + bant[0] + '"/>' +
'    <rect x="' + (x - 6) + '" y="' + (b0 + 7.5) + '" width="12" height="2.6" fill="' + bant[1] + '"/>' +
'    <rect x="' + (x - 6) + '" y="' + (b0 + 12) + '" width="12" height="2.6" fill="' + bant[2] + '"/>' +
'    <rect x="' + (x - 6) + '" y="' + (b0 + bh - 5.5) + '" width="12" height="2.4" fill="#C9A227"/>' +
'    <rect x="' + (x - 6) + '" y="' + b0 + '" width="12" height="' + bh + '" rx="5" fill="url(#wd-res-shade)" pointer-events="none"/>' +
'    <circle cx="' + x + '" cy="' + y0 + '" r="2.6" fill="#8E969F"/><circle cx="' + x + '" cy="' + y1 + '" r="2.6" fill="#8E969F"/>';
  }
  /* Üst kenardaki pin için kılavuz: pinden yukarı, j'deki boş deliğe. */
  function guideUstMarkup(id, sut) {
    var x = COL[sut];
    return '<g class="wd-guide" id="wd-guide-' + id + '">' +
      '<path d="M' + x + ' ' + (SIRA_UST_PIN + 4) + ' V' + (SIRA_DIS + 7) + '" fill="none"/>' +
      '<circle cx="' + x + '" cy="' + SIRA_DIS + '" r="6.4" fill="none"/>' +
    '</g>';
  }
  /* Ledler: [{ pin: 'D5', renk: { kapali, yanik, isik } | null }, ...] — renk yoksa
     mağazanın LED renkleri (--led1-*). */
  var SIRA_KABLO_RENK = { D5: ['#D6273A', '#FF8A86'], D6: ['#E8A317', '#FFE08A'], D9: ['#2F7DE1', '#9CC6FF'], D10: ['#8E44AD', '#D2A6E8'] };
  function siraMarkup(ledler) {
    var out = '', yGnd = siraGndYolu();
    // Kablolar parçalardan ÖNCE: LED'ler ve dirençler üstlerinde kalsın.
    out += '<g class="wd-part" id="wd-part-kablo-gnd" data-part="kablo-gnd">' +
      wireMarkup('wd-path-sira-gnd', yGnd, '#33383F', '#6E7682') +
      pinMarkup(COL[C_GND_UST], SIRA_DIS, '#33383F') + pinMarkup(COL[C_GND_UST], SIRA_RAY, '#33383F') + '</g>';
    ledler.forEach(function (l, k) {
      var ad = 'kablo-' + l.pin.toLowerCase(), uc = siraKartUcu(l.pin), r = SIRA_KABLO_RENK[l.pin] || ['#D6273A', '#FF8A86'];
      out += '<g class="wd-part" id="wd-part-' + ad + '" data-part="' + ad + '">' +
        wireMarkup('wd-path-' + ad, siraTelYolu(l.pin, k), r[0], r[1]) +
        pinMarkup(uc[0], uc[1], r[0], SIRA_PINLER[l.pin].ust ? undefined : 'alt') +
        pinMarkup(COL[siraAnot(k)], siraUc(l.pin), r[0]) + '</g>';
    });
    ledler.forEach(function (l, k) {
      out += '<g class="wd-part wd-drop" id="wd-part-direnc-' + (k + 1) + '" data-part="direnc-' + (k + 1) + '">' + direncDikIc(siraKatot(k)) + '</g>';
    });
    ledler.forEach(function (l, k) {
      var stil = l.renk ? ' style="--sira-kapali:' + l.renk.kapali + ';--sira-yanik:' + l.renk.yanik + ';--sira-isik:' + l.renk.isik + '"' : '';
      out += '<g class="wd-part wd-drop wd-led-sira" id="wd-part-led-' + (k + 1) + '" data-part="led-' + (k + 1) + '"' + stil + '>' +
        ledSiraIc(siraKatot(k)) + '</g>';
    });
    return out + siraHalkalar(ledler);
  }
  /* Pin halkaları + kılavuzlar (kartın grubunun dışında, mutlak: bkz. guideMarkup). */
  function siraHalkalar(ledler) {
    var out = '<circle class="wd-ring" id="wd-ring-gndu" cx="' + COL[C_GND_UST] + '" cy="' + SIRA_UST_PIN + '" r="8.5"/>' + guideUstMarkup('gndu', C_GND_UST);
    ledler.forEach(function (l) {
      var p = SIRA_PINLER[l.pin], id = l.pin.toLowerCase();
      out += '<circle class="wd-ring" id="wd-ring-' + id + '" cx="' + COL[p.s] + '" cy="' + (p.ust ? SIRA_UST_PIN : SIRA_PIN) + '" r="8.5"/>' +
        (p.ust ? guideUstMarkup(id, p.s) : guideMarkup(id, p.s));
    });
    return out;
  }
  /* ============================================================
     BUTON (Ders 3.1, dk0050, 2026-10-06) — mount({ ledSirasi: [{ pin: 'D9' }], buton: true })
     ============================================================
     LED kısmı LED sırasının aynısı (D9, standart düzen). Buton orta kanalın üstüne oturur:
     sol bacakları sütun 23, sağ bacakları sütun 25 (f ve e satırları). Kanalın iki yanındaki
     bacaklar içeriden hep bağlı; basınca 23 ile 25 birleşir.
       3V3 kablosu   kartın üst 3V3 pini (sütun 4, j) → sütun 23, j       (butonun bir ucu)
       D10 kablosu   kartın üst D10 pini (sütun 7, j) → sütun 25, i       (butonun öbür ucu)
       10K direnç    sütun 25: − rayından j'ye (pull-down: basılı değilken D10 = LOW)
     Görünüm Blender (blender/buton.py → assets/img/kart/buton-ust.webp, 3B buton.glb).
     Kod yüklüyken desen butonu kendiliğinden basıp bırakır (desen[].basili), LED onunla yanar. */
  var BUTON_SOL = 23, BUTON_SAG = 25;
  var BUTON_X = COL[24], BUTON_Y = (ROW_UP[4] + ROW_DOWN[0]) / 2;
  function butonTelYolu(pin, sut, yUc, yu) {
    var a = siraKartUcu(pin), x = COL[sut];
    return 'M' + a[0] + ' ' + a[1] + ' C ' + a[0] + ' ' + yu + ' ' + x + ' ' + yu + ' ' + x + ' ' + yUc;
  }
  function butonMarkup() {
    var out = '';
    // 10K direnç: kahverengi-siyah-turuncu + altın.
    out += '<g class="wd-part wd-drop" id="wd-part-direnc-10k" data-part="direnc-10k">' +
      direncDikIc(BUTON_SAG, ['#6E4B23', '#1A1A1A', '#E67E22']) + '</g>';
    out += '<g class="wd-part wd-drop wd-buton" id="wd-part-buton" data-part="buton">' +
      '<image href="assets/img/kart/buton-ust.webp" x="' + (BUTON_X - 24) + '" y="' + (BUTON_Y - 24) + '" width="48" height="48"/>' +
      '<circle class="wd-buton-kapak" cx="' + BUTON_X + '" cy="' + BUTON_Y + '" r="10.5"/></g>';
    out += '<g class="wd-part" id="wd-part-kablo-3v3" data-part="kablo-3v3">' +
      wireMarkup('wd-path-kablo-3v3', butonTelYolu('3V3', BUTON_SOL, ROW_UP[0], 2), '#D6273A', '#FF8A86') +
      pinMarkup(COL[SIRA_PINLER['3V3'].s], SIRA_DIS, '#D6273A') + pinMarkup(COL[BUTON_SOL], ROW_UP[0], '#D6273A') + '</g>';
    out += '<g class="wd-part" id="wd-part-kablo-d10" data-part="kablo-d10">' +
      wireMarkup('wd-path-kablo-d10', butonTelYolu('D10', BUTON_SAG, ROW_UP[1], -8), '#8E44AD', '#D2A6E8') +
      pinMarkup(COL[SIRA_PINLER.D10.s], SIRA_DIS, '#8E44AD') + pinMarkup(COL[BUTON_SAG], ROW_UP[1], '#8E44AD') + '</g>';
    ['3v3', 'd10'].forEach(function (id) {
      var p = SIRA_PINLER[id.toUpperCase()];
      out += '<circle class="wd-ring" id="wd-ring-' + id + '" cx="' + COL[p.s] + '" cy="' + SIRA_UST_PIN + '" r="8.5"/>' + guideUstMarkup(id, p.s);
    });
    return out;
  }
  function butonTakDelik() {
    TAK_DELIK['buton'] = [[COL[BUTON_SOL], ROW_UP[4]], [COL[BUTON_SAG], ROW_DOWN[0]]];
    TAK_DELIK['direnc-10k'] = [[COL[BUTON_SAG], SIRA_RAY], [COL[BUTON_SAG], SIRA_DIR_UC]];
    TAK_DELIK['kablo-3v3'] = [siraKartUcu('3V3'), [COL[BUTON_SOL], ROW_UP[0]]];
    TAK_DELIK['kablo-d10'] = [siraKartUcu('D10'), [COL[BUTON_SAG], ROW_UP[1]]];
  }
  function butonAdimlari() {
    return [
      { part: ['buton'], chip: 'Buton', ring: null, col: [],
        hint: 'Butonu orta kanalın üstüne bastır: bacaklar 23 ve 25. sütunlarda.',
        checkpoint: 'Buton kanalın iki yanında; dört bacağı da delikte.' },
      { part: ['direnc-10k'], chip: '10K direnç', ring: null, col: [],
        hint: 'Kahverengi-siyah-turuncu bantlı direnç: 25. sütundan − rayına.',
        checkpoint: '10K direnç butonun sağ sütunundan − rayına iniyor.' },
      { part: ['kablo-3v3'], chip: '3V3 kablosu', ring: '3v3', col: [],
        hint: 'Kartın üstteki 3V3 pininden butonun sol sütununa.',
        checkpoint: 'Kablo 3V3 pininden butonun sol sütununa gidiyor.' },
      { part: ['kablo-d10'], chip: 'D10 kablosu', ring: 'd10', col: [],
        hint: 'Kartta D10 yazan pinden butonun sağ sütununa.',
        checkpoint: 'Kablo D10 pininden butonun sağ sütununa, direncin yanına gidiyor.' }
    ];
  }
  /* ============================================================
     TRAFİK LAMBASI MODÜLÜ (Ders 1.6, 2026-10-06) — mount({ ledSirasi, trafikModulu: true })
     ============================================================
     Arda: "trafik ışığı dersi var ya, oradaki ışık bundan bahsediliyor" — LED'leri ve
     dirençleri hazır, T biçimli modül; 4 pinli yatay başlık R, Y, G, GND (Arda doğruladı).
     2026-10-07, Arda: "trafik ışığını breadboard'a tak, erkek erkek kablo verilecek."
     Yatay başlıkla takılınca modül DİK durur, LED'ler çocuğa bakar, kırmızı en üstte.
     Pinler üst blokta i satırında, soldan sağa GND G Y R = sütun 23..26 (kart sütun
     18'de biter). Gerçek boy (pin adımı = breadboard adımı); görünüm Blender, önden-yukarıdan
     75° (blender/trafik-modul.py DIK=1 → assets/img/kart/trafik-modul-dik.webp, 3B'de
     trafik.glb sahne3b.js'te ayağa kaldırılır). Dört ERKEK-ERKEK kablo, ikinci uçlar aynı
     sütunun modülün ÖNÜNDEKİ deliklerinde (aynı sütunun beş deliği bağlı):
       GND  üst kenar GND (sütun 5, j)  → sütun 23, g     D9  üst kenar (sütun 6, j) → sütun 24, h
       D6   alt kenar MC (sütun 10, a)  → sütun 25, f     D5  alt kenar MI (sütun 11, a) → sütun 26, f
     LED'ler .wd-led-sira grupları: desen, testler ve 3B ışığı 1.5'teki gibi çalışır. */
  var MODUL_PIN_SATIR = ROW_UP[1];                                  // i (81.4)
  var MODUL_SUTUN = { GND: 23, D9: 24, D6: 25, D5: 26 };            // modülde GND G Y R
  /* Kablonun modül tarafı. Üstten gelen iki kablo birbirini kesmesin: dıştan gelen GND aşağıdaki
     deliğe (g), içten gelen D9 yukarıdakine (h). */
  var MODUL_UC = { GND: ROW_UP[3], D9: ROW_UP[2], D6: ROW_UP[4], D5: ROW_UP[4] };   // g, h, f, f
  var MODUL_INIS = [360, 372];   // GND / D9 kablosunun kartla modül arasındaki iniş x'i
  // LED'ler (Blender kadrajından hesaplandı): tek sütunda, gövdenin ortasında; y kırmızı → yeşil.
  var MODUL_LED_X = 447.3, MODUL_LED_Y = [7.7, 28.4, 49.0];
  var MODUL_HARF = { D5: 'R', D6: 'Y', D9: 'G' };
  function modulUc(pin) { return [COL[MODUL_SUTUN[pin]], MODUL_UC[pin]]; }
  function modulTelYolu(pin, k) {
    var a = siraKartUcu(pin), u = modulUc(pin);
    if (SIRA_PINLER[pin].ust) {
      /* Üst kenar: yukarı çık, rayların üstünden sağa, kartla modül arasındaki boşluktan
         in, deliğe soldan gir (modülün gövdesinin üstünden geçmesin). */
      /* Rayların üstünden sağa, kartla modülün kolu arasındaki boşluktan (x 352..384) in,
         başlığın altından deliğe soldan gir. GND kablosu bunun DIŞINDAN geçer (bkz. modulGndYolu). */
      return 'M' + a[0] + ' ' + a[1] + ' C ' + a[0] + ' 22, ' + MODUL_INIS[1] + ' 22, ' + MODUL_INIS[1] + ' 70' +
        ' C ' + MODUL_INIS[1] + ' ' + (u[1] - 6) + ', ' + (MODUL_INIS[1] + 10) + ' ' + u[1] + ', ' + u[0] + ' ' + u[1];
    }
    // Alt kenar: kartın altındaki koridordan sağa, sütundan dümdüz yukarı, kanalın üstünden f'ye.
    var y = 236 + 6 * k;
    return 'M' + a[0] + ' ' + a[1] + ' C ' + (a[0] + 30) + ' ' + y + ' ' + (u[0] - 30) + ' ' + y + ' ' + u[0] + ' ' + (y - 40) +
      ' L ' + u[0] + ' ' + u[1];
  }
  function modulGndYolu() {
    var x = COL[C_GND_UST], u = modulUc('GND');
    // D9 kablosunun dışından: daha yüksek kavis, daha solda iniş, daha aşağıdaki deliğe (g).
    return 'M' + x + ' ' + SIRA_DIS + ' C ' + x + ' 8, ' + MODUL_INIS[0] + ' 8, ' + MODUL_INIS[0] + ' 70' +
      ' C ' + MODUL_INIS[0] + ' ' + (u[1] - 8) + ', ' + (MODUL_INIS[0] + 12) + ' ' + u[1] + ', ' + u[0] + ' ' + u[1];
  }
  /* Modülün LED'i: kartına lehimli, çocuğa bakan kubbe; yukarıdan bakınca basık elips. */
  function modulLedIc(k) {
    var x = MODUL_LED_X, y = MODUL_LED_Y[k] + 3;
    return '' +
'    <ellipse class="wd-led-glow" cx="' + x + '" cy="' + y + '" rx="24" ry="16" filter="url(#wd-blur)"/>' +
'    <ellipse class="wd-led-bulb" cx="' + x + '" cy="' + y + '" rx="13" ry="8.5"/>' +
'    <ellipse class="wd-led-glass" cx="' + x + '" cy="' + y + '" rx="13" ry="8.5" fill="url(#wd-led-shade)"/>' +
'    <ellipse class="wd-led-glass" cx="' + (x - 4.5) + '" cy="' + (y - 3) + '" rx="3.6" ry="1.8" fill="#fff" opacity="0.55"/>';
  }
  function modulMarkup(ledler) {
    // Kablolar modülden SONRA: f/g/h'deki uçlar modülün başlığının önünde görünsün.
    var out = '<g class="wd-part wd-drop" id="wd-part-modul" data-part="modul">' +
      '<image href="assets/img/kart/trafik-modul-dik.webp" x="378" y="-16" width="138" height="108" preserveAspectRatio="none"/></g>';
    ledler.forEach(function (l, k) {
      var stil = l.renk ? ' style="--sira-kapali:' + l.renk.kapali + ';--sira-yanik:' + l.renk.yanik + ';--sira-isik:' + l.renk.isik + '"' : '';
      out += '<g class="wd-part wd-drop wd-led-sira" id="wd-part-led-' + (k + 1) + '" data-part="led-' + (k + 1) + '"' + stil + '>' + modulLedIc(k) + '</g>';
    });
    var g = modulUc('GND');
    out += '<g class="wd-part" id="wd-part-kablo-gnd" data-part="kablo-gnd">' +
      wireMarkup('wd-path-sira-gnd', modulGndYolu(), '#33383F', '#6E7682') +
      pinMarkup(COL[C_GND_UST], SIRA_DIS, '#33383F') + pinMarkup(g[0], g[1], '#33383F') + '</g>';
    ledler.forEach(function (l, k) {
      var ad = 'kablo-' + l.pin.toLowerCase(), uc = siraKartUcu(l.pin), u = modulUc(l.pin), r = SIRA_KABLO_RENK[l.pin] || ['#D6273A', '#FF8A86'];
      out += '<g class="wd-part" id="wd-part-' + ad + '" data-part="' + ad + '">' +
        wireMarkup('wd-path-' + ad, modulTelYolu(l.pin, k), r[0], r[1]) +
        pinMarkup(uc[0], uc[1], r[0], SIRA_PINLER[l.pin].ust ? undefined : 'alt') +
        pinMarkup(u[0], u[1], r[0]) + '</g>';
    });
    return out + siraHalkalar(ledler);
  }
  function modulTakDelik(ledler) {
    // Modül: dört pin i satırında; iki uç pin (GND, R) yeter. 3B (sahne3b.js modulKur) GND'yi esas alır.
    TAK_DELIK['modul'] = [[COL[MODUL_SUTUN.GND], MODUL_PIN_SATIR], [COL[MODUL_SUTUN.D5], MODUL_PIN_SATIR]];
    TAK_DELIK['kablo-gnd'] = [[COL[C_GND_UST], SIRA_DIS], modulUc('GND')];
    ledler.forEach(function (l, k) {
      // LED modülün üstünde: 'modul' işareti + sıra no (3B LED'i modülün dönüşüyle yerleştirir).
      TAK_DELIK['led-' + (k + 1)] = [[MODUL_LED_X, MODUL_LED_Y[k], 'modul', k], [MODUL_LED_X, MODUL_LED_Y[k], 'modul', k]];
      TAK_DELIK['kablo-' + l.pin.toLowerCase()] = [siraKartUcu(l.pin), modulUc(l.pin)];
    });
  }
  function modulAdimlari(ledler) {
    var A = [KART_ADIMI, { part: ['modul'].concat(ledler.map(function (l, k) { return 'led-' + (k + 1); })), chip: 'Modül', ring: null, col: [],
      hint: 'Modülü breadboard’a dik tak: LED’ler sana baksın, kırmızı en üstte.',
      checkpoint: 'Dört pin de üst blokta, kartın sağında; soldan sağa GND, G, Y, R.' },
      { part: ['kablo-gnd'], chip: 'GND kablosu', ring: 'gndu', col: [],
        hint: 'Kartın üstteki GND pininden modülün GND pininin önündeki deliğe.', checkpoint: 'Siyah kablo üstteki GND’den modülün GND sütununa gidiyor.' }];
    ledler.forEach(function (l) {
      var harf = MODUL_HARF[l.pin];
      A.push({ part: ['kablo-' + l.pin.toLowerCase()], chip: l.pin + ' kablosu', ring: l.pin.toLowerCase(), col: [],
        hint: 'Kartta ' + SIRA_PINLER[l.pin].etiket + ' yazan pin, kodda ' + l.pin + '; modülde ' + harf + '.',
        checkpoint: 'Kablo ' + SIRA_PINLER[l.pin].etiket + ' pininden modülün ' + harf + ' sütununa gidiyor.' });
    });
    return A;
  }

  function siraTakDelik(ledler) {
    TAK_DELIK['kablo-gnd'] = [[COL[C_GND_UST], SIRA_DIS], [COL[C_GND_UST], SIRA_RAY]];
    ledler.forEach(function (l, k) {
      var K = siraKatot(k), A = siraAnot(k);
      // LED: önce uzun bacak (anot), sonra kısa (katot) — sahne3b.js ledKur bu sırayı bekler.
      TAK_DELIK['led-' + (k + 1)] = [[COL[A], SIRA_LED], [COL[K], SIRA_LED]];
      TAK_DELIK['direnc-' + (k + 1)] = [[COL[K], SIRA_RAY], [COL[K], SIRA_DIR_UC]];
      TAK_DELIK['kablo-' + l.pin.toLowerCase()] = [siraKartUcu(l.pin), [COL[A], siraUc(l.pin)]];
    });
  }
  /* Kurulum adımları: kart, GND kablosu, LED'ler, dirençler, sonra her pinin kablosu.
     Aynı işi tekrar eden parçalar (dört LED) TEK adım: her adımda tek iş. */
  function siraAdimlari(ledler) {
    var n = ledler.length, ids = function (on) { return ledler.map(function (l, k) { return on + (k + 1); }); };
    var A = [KART_ADIMI, { part: ['kablo-gnd'], chip: 'GND kablosu', ring: 'gndu', col: [],
      hint: 'Önce eksi rayını kartın GND’sine bağla.', checkpoint: 'Siyah kablo kartın üstteki GND pininden üst − rayına gidiyor.' },
      { part: ids('led-'), chip: n + ' LED', ring: null, col: [],
        hint: 'İki bacak da g satırında: kısa bacak (−) solda, uzun bacak (+) sağda.', checkpoint: n + ' LED yan yana, aralarında birer boş sütun; kısa bacaklar solda.' },
      { part: ids('direnc-'), chip: n + ' direnç', ring: null, col: [],
        hint: 'Her LED’in kendi direnci olmalı.', checkpoint: 'Her direnç − rayından kendi LED’inin kısa bacağının sütununa iniyor.' }];
    ledler.forEach(function (l, k) {
      A.push({ part: ['kablo-' + l.pin.toLowerCase()], chip: l.pin + ' kablosu', ring: l.pin.toLowerCase(), col: [],
        hint: 'Kartta ' + SIRA_PINLER[l.pin].etiket + ' yazan pin, kodda ' + l.pin + '.',
        checkpoint: 'Kablo ' + SIRA_PINLER[l.pin].etiket + ' pininden ' + (k + 1) + '. LED’in uzun bacağının sütununa gidiyor.' });
    });
    return A;
  }

  function holes() {
    var out = '';
    var i, j;
    for (i = 0; i < COL.length; i++) {
      for (j = 0; j < ROW_UP.length; j++) {
        out += '<rect class="wd-hole" data-col="' + i + '" x="' + (COL[i] - 3) + '" y="' + (ROW_UP[j] - 3) + '" width="6" height="6" rx="1.6"/>';
      }
      for (j = 0; j < ROW_DOWN.length; j++) {
        /* data-col2: alt bloğun sütunu. Ders 1.4'te ikinci LED zinciri alt
           blokta kuruluyor; nabız o sütunlarda da atabilsin diye. Üst blokla
           AYNI anahtarı taşımaz: kanal iki bloğu ayırır, sütun 22'nin üstü
           ile altı birbirine bağlı değildir. */
        out += '<rect class="wd-hole" data-col2="' + i + '" x="' + (COL[i] - 3) + '" y="' + (ROW_DOWN[j] - 3) + '" width="6" height="6" rx="1.6"/>';
      }
    }
    return out;
  }

  /* Ray delikleri ayrı sınıfla çiziliyor: terminal delikleri sütun
     vurgusuna katılır (data-col), ray delikleri katılmaz — çünkü raylar
     DİKEY değil YATAY bağlıdır. */
  function railHoles() {
    var out = '', i, j;
    var rows = RAIL_UP.concat(RAIL_DOWN);
    for (j = 0; j < rows.length; j++) {
      for (i = 1; i < COL.length - 1; i++) {
        /* Gerçeğindeki gibi beşerli gruplar: her 6. delik atlanır. */
        if (i % 6 === 0) continue;
        out += '<rect class="wd-rail-hole" x="' + (COL[i] - 3) + '" y="' + (rows[j] - 3) +
               '" width="6" height="6" rx="1.6"/>';
      }
    }
    return out;
  }

  function railLines() {
    var out = '';
    var conf = [
      { y: RAIL_UP[0] - 8,    k: '+' }, { y: RAIL_UP[1] + 8,    k: '−' },
      { y: RAIL_DOWN[0] - 8,  k: '+' }, { y: RAIL_DOWN[1] + 8,  k: '−' }
    ];
    for (var i = 0; i < conf.length; i++) {
      var art = conf[i].k === '+';
      out += '<line class="wd-rail-line ' + (art ? 'is-plus' : 'is-minus') + '" x1="' + (COL[1] - 6) +
             '" y1="' + conf[i].y + '" x2="' + (COL[COL.length - 2] + 6) + '" y2="' + conf[i].y + '"/>' +
             '<text class="wd-rail-mark ' + (art ? 'is-plus' : 'is-minus') + '" x="' + (COL[0] - 10) +
             '" y="' + (conf[i].y + 4) + '">' + conf[i].k + '</text>';
    }
    return out;
  }

  /* x-ray: ray şeritleri YATAY, sütun şeritleri DİKEY. Aradaki fark tek
     görselde anlaşılsın diye ikisi aynı dille çiziliyor. */
  function railStrips() {
    var out = '', rows = RAIL_UP.concat(RAIL_DOWN);
    for (var j = 0; j < rows.length; j++) {
      out += '<rect class="wd-metal-strip wd-rail-strip" x="' + (COL[1] - 7) +
             '" y="' + (rows[j] - 6) + '" width="' + (COL[COL.length - 2] - COL[1] + 14) +
             '" height="12" rx="5"/>';
    }
    return out;
  }

  function colRect(id, i) {
    /* Sütun vurgusu yalnızca SERBEST iki sırayı kapsar; geri kalanı
       kartın altında kalıyor ve zaten görünmüyor. */
    return '<rect class="wd-col" id="wd-col-' + id + '" x="' + (COL[i] - 7) +
           '" y="' + (SIRA_DIS - 9) + '" width="14" height="' + (SIRA_IC - SIRA_DIS + 18) + '" rx="7"/>';
  }

  /* Faz C1 — "İçini gör": her sütunun 5 deliğinin altında metal bir klips
     var, dışarıdan görünmüyor (spec §C1, çocuğun göremediği ama bilmek
     zorunda olduğu tek kural). Normalde gizli (opacity 0); #wd-xray
     düğmesi plastiği yarı saydamlaştırıp şeritleri ortaya çıkarır. Bir
     parça sütuna takılınca o şerit bakır rengine döner (bkz. setStep). */
  function stripRect(i) {
    var key = COL_KEY[i];
    var idAttr = key ? ' id="wd-strip-' + key + '"' : '';
    return '<rect class="wd-metal-strip"' + idAttr + ' data-col="' + i +
           '" x="' + (COL[i] - 6) + '" y="' + (ROW_UP[0] - 7) +
           '" width="12" height="' + (ROW_UP[4] - ROW_UP[0] + 14) + '" rx="5"/>';
  }
  function strips() {
    var out = '';
    for (var i = 0; i < COL.length; i++) out += stripRect(i);
    return out;
  }

  /* Ders 1.4: alt bloğun şeritleri ve sütun vurguları. Yalnızca ikinci
     LED modunda çizilir; 1.2/1.3 sahnesi birebir aynı kalır. */
  function strips2() {
    var out = '';
    for (var i = 0; i < COL.length; i++) {
      var key = COL_KEY2_ALT[i];
      out += '<rect class="wd-metal-strip"' + (key ? ' id="wd-strip-' + key + '"' : '') +
        ' data-col2="' + i + '" x="' + (COL[i] - 6) + '" y="' + (ROW_DOWN[0] - 7) +
        '" width="12" height="' + (ROW_DOWN[4] - ROW_DOWN[0] + 14) + '" rx="5"/>';
    }
    return out;
  }
  function colRectY(id, i, y0, y1) {
    return '<rect class="wd-col" id="wd-col-' + id + '" x="' + (COL[i] - 7) +
           '" y="' + (y0 - 9) + '" width="14" height="' + (y1 - y0 + 18) + '" rx="7"/>';
  }
  function cols2() {
    return colRectY('a2', C2_ANOT, SIRA2_DIS, SIRA2_IC) +
           colRectY('k2', C2_KATOT, SIRA2_DIS, SIRA2_IC) +
           colRectY('r2', C2_DIRENC, SIRA2_DIS, SIRA2_IC) +
           colRectY('g2', C_DIRENC, SIRA_DIS, SIRA_KOPRU);
  }

  /* LED ve direnç çizimi TEK kaynak: birinci zincir olduğu yerde, ikinci
     zincir (Ders 1.4) aynısı translate ile alt blokta. */
  function direncIc() {
    return '' +
'    <path d="M' + COL[C_KATOT] + ' ' + SIRA_IC + ' H' + (COL[C_KATOT] + 12) + '" stroke="#A9B0BA" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
'    <path d="M' + (COL[C_DIRENC] - 12) + ' ' + SIRA_IC + ' H' + COL[C_DIRENC] + '" stroke="#A9B0BA" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
'    <rect x="' + (COL[C_KATOT] + 12) + '" y="' + (SIRA_IC - 9) + '" width="' + (COL[C_DIRENC] - COL[C_KATOT] - 24) + '" height="18" rx="8" fill="#E7CF9C" stroke="#BC9C5E" stroke-width="1"/>' +
'    <rect x="' + (COL[C_KATOT] + 18) + '" y="' + (SIRA_IC - 9) + '" width="5" height="18" fill="#C0392B"/>' +
'    <rect x="' + (COL[C_KATOT] + 26) + '" y="' + (SIRA_IC - 9) + '" width="5" height="18" fill="#C0392B"/>' +
'    <rect x="' + (COL[C_KATOT] + 34) + '" y="' + (SIRA_IC - 9) + '" width="5" height="18" fill="#6E4B23"/>' +
'    <circle cx="' + COL[C_KATOT] + '" cy="' + SIRA_IC + '" r="3" fill="#8E969F"/>' +
'    <circle cx="' + COL[C_DIRENC] + '" cy="' + SIRA_IC + '" r="3" fill="#8E969F"/>' +
'    <rect x="' + (COL[C_KATOT] + 12) + '" y="' + (SIRA_IC - 9) + '" width="' + (COL[C_DIRENC] - COL[C_KATOT] - 24) + '" height="18" rx="8" fill="url(#wd-res-shade)" pointer-events="none"/>' +
'    <text x="' + ((COL[C_KATOT] + COL[C_DIRENC]) / 2) + '" y="' + (SIRA_IC - 14) + '" class="wd-label">220Ω</text>';
  }

  function ledIc() {
    return '' +
'    <circle class="wd-led-glow" cx="' + ((COL[C_ANOT] + COL[C_KATOT]) / 2) + '" cy="18" r="26" filter="url(#wd-blur)"/>' +
'    <path d="M' + (COL[C_ANOT] + 5) + ' 36 L' + (COL[C_ANOT] + 5) + ' 48 L' + COL[C_ANOT] + ' ' + SIRA_DIS + '" stroke="url(#wd-leg-metal)" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
'    <path d="M' + (COL[C_KATOT] - 5) + ' 36 L' + (COL[C_KATOT] - 5) + ' 54 L' + COL[C_KATOT] + ' ' + SIRA_DIS + '" stroke="url(#wd-leg-metal)" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
'    <ellipse class="wd-leg-land" cx="' + COL[C_ANOT] + '" cy="' + SIRA_DIS + '" rx="3.2" ry="2"/>' +
'    <ellipse class="wd-leg-land" cx="' + COL[C_KATOT] + '" cy="' + SIRA_DIS + '" rx="3.2" ry="2"/>' +
'    <path class="wd-led-bulb" d="M' + (COL[C_ANOT] - 6) + ' 30 L' + (COL[C_ANOT] - 6) + ' 16 A13 13 0 0 1 ' + (COL[C_KATOT] + 6) + ' 16 L' + (COL[C_KATOT] + 6) + ' 30 Z"/>' +
'    <rect class="wd-led-bulb" x="' + (COL[C_ANOT] - 10) + '" y="28" width="' + (COL[C_KATOT] - COL[C_ANOT] + 20) + '" height="6" rx="3"/>' +
'    <path class="wd-led-post" d="M' + (COL[C_ANOT] + 2) + ' 30 L' + (COL[C_ANOT] + 2) + ' 20" />' +
'    <path class="wd-led-cup" d="M' + (COL[C_KATOT] - 3) + ' 30 L' + (COL[C_KATOT] - 3) + ' 22 L' + (COL[C_KATOT] + 6) + ' 14 L' + (COL[C_KATOT] + 6) + ' 24 Z" />' +
'    <path d="M' + (COL[C_KATOT] + 4) + ' 29 L' + (COL[C_KATOT] + 10) + ' 29 L' + (COL[C_KATOT] + 10) + ' 22" fill="none" stroke="#8a4038" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>' +
/* Cam: soldan ışık, sağdan gölge + üst-sol parlama + yaka gölgesi. */
'    <path class="wd-led-glass" d="M' + (COL[C_ANOT] - 6) + ' 30 L' + (COL[C_ANOT] - 6) + ' 16 A13 13 0 0 1 ' + (COL[C_KATOT] + 6) + ' 16 L' + (COL[C_KATOT] + 6) + ' 30 Z" fill="url(#wd-led-shade)"/>' +
'    <rect class="wd-led-glass" x="' + (COL[C_ANOT] - 10) + '" y="28" width="' + (COL[C_KATOT] - COL[C_ANOT] + 20) + '" height="6" rx="3" fill="url(#wd-led-rim)"/>' +
'    <ellipse class="wd-led-glass" cx="' + (COL[C_ANOT] + 1.5) + '" cy="13" rx="3.2" ry="6.5" fill="#fff" opacity="0.55" transform="rotate(18 ' + (COL[C_ANOT] + 1.5) + ' 13)"/>' +
'    <circle class="wd-led-glass" cx="' + (COL[C_ANOT] + 4) + '" cy="5.5" r="1.4" fill="#fff" opacity="0.8"/>' +
'    <text x="' + (COL[C_ANOT] - 11) + '" y="' + (SIRA_DIS - 22) + '" class="wd-sign wd-sign-plus">+</text>' +
'    <text x="' + (COL[C_KATOT] + 11) + '" y="' + (SIRA_DIS - 22) + '" class="wd-sign">−</text>';
  }

  /* Ders 1.4 ikinci zinciri. Parçalar dışta mutlak konumlu (takma hareketi
     delikleri sahne koordinatında arıyor), çizim içte translate ile. */
  function zincir2Markup() {
    var kay = '<g transform="translate(' + DX2 + ',' + DY2 + ')">';
    return '' +
      '<g class="wd-part" id="wd-part-jumper-gnd2" data-part="jumper-gnd2">' +
        wireMarkup('wd-path-gnd2', kopruPath(), '#33383F', '#6E7682') +
        pinMarkup(COL[C2_DIRENC], SIRA2_DIS, '#33383F') +
        pinMarkup(COL[C_DIRENC], SIRA_KOPRU, '#33383F', 'alt') +
      '</g>' +
      '<g class="wd-part" id="wd-part-jumper-d6" data-part="jumper-d6">' +
        wireMarkup('wd-path-d6', d6WirePath(), '#E8A317', '#FFE08A') +
        pinMarkup(COL[C2_D6], SIRA_KART, '#E8A317', 'alt') +
        pinMarkup(COL[C2_ANOT], SIRA2_IC, '#E8A317', 'alt') +
      '</g>' +
      '<g class="wd-part wd-drop" id="wd-part-resistor2" data-part="resistor2">' + kay + direncIc() + '</g></g>' +
      '<g class="wd-part wd-drop wd-led2" id="wd-part-led2" data-part="led2">' + kay + ledIc() + '</g></g>';
  }
  function kivilcim2() {
    var k = function (yol, dur, begin, ters) {
      return '<circle class="wd-spark wd-spark2" r="3.6"><animateMotion dur="' + dur + '" repeatCount="indefinite" begin="' + begin + '"' +
        (ters ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : '') + '><mpath href="#' + yol + '"/></animateMotion></circle>';
    };
    return k('wd-path-d6', '1.6s', '0s') + k('wd-path-d6', '1.6s', '0.8s') + k('wd-path-gnd2', '1.2s', '0.2s');
  }

  /* --- LAPTOP (2026-10-14): 3B sahnelerdeki modelin Blender render'ı ---
     blender/laptop.py → assets/img/kart/laptop.webp (1000 × 1019 px, önden 14°, yukarıdan 32°).
     Arda: "kartın yanında bilgisayar küçük kaldı" → "Büyük, köşesi kadraj dışı": genişlik 236 birim
     (eski çizim 124), sol çeyreği viewBox'ın (x -172) dışında; ekranın neredeyse tamamı görünür.
     Ekran içeriği SVG kalır (keskin yazı, lt-* sınıfları): 160 × 100'lük yerel çerçevede, 3B
     ekranın (sahne3b.js ekranCiz) aynı düzeniyle çizilir ve matrisle render'daki eğik ekrana oturur —
     ortografik render'da dikdörtgen paralelkenara düşer, afin matris birebir taşır. Ekran köşeleri
     ve kablo çıkışı (takılı fişin ucu) betiğin yazdırdığı ISARET satırından, piksel. */
  var LAPTOP_2B = {
    boy: [1000, 1019],
    ekran: [[209.9, 54.6], [949.6, 152.3], [914.0, 612.9], [174.3, 515.2]],   // sol üst, sağ üst, sağ alt, sol alt
    kablo: [914.0, 831.5], kabloIleri: [964.3, 838.1]
  };
  var LT_X = -236, LT_Y = -20, LT_W = 236;
  function laptopNokta(q) { var s = LT_W / LAPTOP_2B.boy[0]; return [LT_X + q[0] * s, LT_Y + q[1] * s]; }
  function sayi(v) { return +v.toFixed(2); }
  function laptopMarkup() {
    var E = LAPTOP_2B.ekran.map(laptopNokta), tl = E[0], tr = E[1], bl = E[3];
    var m = [(tr[0] - tl[0]) / 160, (tr[1] - tl[1]) / 160, (bl[0] - tl[0]) / 100, (bl[1] - tl[1]) / 100, tl[0], tl[1]].map(sayi);
    // Kod satırları: sahne3b.js ekranCiz ile aynı (renk, genişlik oranı, girinti).
    var satir = [['#7FB4FF', 0.32, 0], ['#E5C07B', 0.46, 1], ['#7FB4FF', 0.12, 0], ['#98C379', 0.36, 0], ['#E5C07B', 0.5, 1], ['#98C379', 0.28, 0]];
    /* Resim fişsiz; takılı fiş ayrı küçük kırpıntı (render'ın 840,800–990,876 kutusu): kart tezgahta
       değilken kablosu da yok, fiş de gizlenir (.is-kartsiz). */
    var s = LT_W / LAPTOP_2B.boy[0];
    return '  <g id="wd-laptop">' +
      '<image class="wd-laptop-render" href="assets/img/kart/laptop.webp" x="' + LT_X + '" y="' + LT_Y + '" width="' + LT_W +
        '" height="' + sayi(LT_W * LAPTOP_2B.boy[1] / LAPTOP_2B.boy[0]) + '" preserveAspectRatio="none"/>' +
      '<image class="wd-laptop-fis" href="assets/img/kart/laptop-fis.webp" x="' + sayi(LT_X + 840 * s) + '" y="' + sayi(LT_Y + 800 * s) +
        '" width="' + sayi(150 * s) + '" height="' + sayi(76 * s) + '" preserveAspectRatio="none"/>' +
      '<g class="wd-laptop-ekran" transform="matrix(' + m.join(' ') + ')">' +
        '<rect class="lt-ekran" width="160" height="100" fill="#0b1220"/>' +
        '<rect width="160" height="10.6" fill="#ffffff" opacity="0.06"/>' +
        '<circle cx="5.6" cy="5.3" r="1.9" fill="#ef4444"/><circle cx="11.3" cy="5.3" r="1.9" fill="#f59e0b"/><circle cx="16.9" cy="5.3" r="1.9" fill="#22c55e"/>' +
        '<text class="lt-vurgu" x="80" y="7.5" font-family="Arial, sans-serif" font-size="6.2" font-weight="bold" fill="#6FB7FF" text-anchor="middle">Arduino IDE</text>' +
        satir.map(function (s, i) {
          return '<rect class="lt-kod" x="' + sayi(12.5 + s[2] * 8.75) + '" y="' + sayi(18.75 + i * 10.6) + '" width="' + sayi(160 * s[1]) +
            '" height="3.75" fill="' + s[0] + '" opacity="0.9"/>';
        }).join('') +
        '<rect width="160" height="100" fill="url(#wd-screenGlare)"/>' +
      '</g>' +
    '</g>';
  }
  /* Kablo laptoptaki fişin ucundan çıkış yönünde başlar, kartın fişine yatay girer (bx: fişteki ucu,
     takılı 26 / çekik 2). dx, dy: gölge ve parlama çizgisinin kayması. */
  function usbYol(bx, dx, dy) {
    var k = laptopNokta(LAPTOP_2B.kablo), ki = laptopNokta(LAPTOP_2B.kabloIleri);
    var ux = ki[0] - k[0], uy = ki[1] - k[1], L = Math.hypot(ux, uy);
    var p = [k, [k[0] + ux / L * 24, k[1] + uy / L * 24], [bx - 18, 139.1], [bx, 139.1]];
    var f = function (q) { return sayi(q[0] + dx) + ' ' + sayi(q[1] + dy); };
    return 'M' + f(p[0]) + ' C ' + f(p[1]) + ' ' + f(p[2]) + ' ' + f(p[3]);
  }

  function svgMarkup(iki, sira, modul, buton) {
    return '' +
/* viewBox sola 140 birim genişletildi: laptop + Type-C kablosu oraya
   girdi (Arda: "burada da bilgisayara bağlı olacak, gösterebilir miyiz").
   Sahne KÜÇÜLMEDİ — eski 480x320 (oran 1.5) kutunun içinde yükseklikten
   sınırlanıyordu ve sağda ~200px boş kalıyordu; yeni 620x320 (oran 1.94)
   kutunun oranına (886x462 ≈ 1.88) oturuyor, breadboard ölçüldüğünde
   378px (eskiden 380px). Yani boşa giden yer kullanıldı.
   2026-09-30: -200 -44 790 350 -> -172 -16 730 302. Arda: "kartın üstündeki
   yazılar zor okunuyor." Çizimin tamamı (her kurulum durumunda, fiş çekikken
   de) x -164..550, y -8..278 aralığında — ölçüldü. Kenarda 8'er birim pay
   bırakıp boşluk kırpıldı; sahne yükseklikten sınırlıyken çizim ~%16 büyür. */
'<svg class="wd-svg" id="wd-svg" viewBox="-172 -16 730 302" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="wd-t wd-d">' +
(modul
  ? '  <title id="wd-t">Trafik lambası modülü devre şeması</title>' +
    '  <desc id="wd-d">Trafik lambası modülü breadboard’un üst bloğunda, kartın sağında dik duruyor. Modülün R pini D5’e (kartta MI), Y pini D6’ya (MC), G pini D9’a, GND pini kartın üstteki GND pinine erkek-erkek kablolarla bağlı: her kablo modül pininin sütununda, modülün önündeki deliğe takılı. LED’lerin dirençleri modülün üstünde hazır.</desc>'
  : sira
  ? '  <title id="wd-t">' + sira.length + ' LED devre şeması</title>' +
    '  <desc id="wd-d">' + sira.map(function (l) { return l.pin; }).join(', ') + ' pinlerine bağlı ' + sira.length + ' LED üst blokta yan yana. Her LED’in uzun bacağı kendi pinine, kısa bacağı kendi 220 ohm direnci üzerinden − rayına gider; − rayı kartın GND pinine bağlıdır.</desc>'
  : iki
  ? '  <title id="wd-t">İki LED devre şeması</title>' +
    '  <desc id="wd-d">Birinci LED D5 (kartta MI) pinine, ikinci LED D6 (kartta MC) pinine bağlı. Her LED’in kısa bacağı kendi 220 ohm direnciyle GND’ye gider; ikinci direnç, birinci direncin GND sütununa kısa bir kabloyla bağlanır.</desc>'
  : '  <title id="wd-t">Harici LED devre şeması</title>' +
    '  <desc id="wd-d">Deneyap Mini v2 kartının D5 pini LED’in uzun bacağına, LED’in kısa bacağı 220 ohm direnç üzerinden GND pinine bağlanır.</desc>') +

'  <defs>' +
/* wd-pcb/wd-gold/wd-shield eskiden karta aitti; kart artık kendi
   gradyanlarını (bsvg-*) getiriyor, bkz. assets/js/board-svg.js. */
'    <linearGradient id="wd-bb" x1="0" y1="0" x2="0" y2="1">' +
'      <stop offset="0" stop-color="#FFFDF8"/><stop offset="1" stop-color="#F2E7D6"/>' +
'    </linearGradient>' +
'    <radialGradient id="wd-sheen" cx="0.32" cy="0.1" r="0.75">' +
'      <stop offset="0" stop-color="#fff" stop-opacity="0.20"/>' +
'      <stop offset="1" stop-color="#fff" stop-opacity="0"/>' +
'    </radialGradient>' +
/* Faz C1: metal şerit gradyanları — bağlı değilken mat gri, bağlıyken bakır. */
'    <linearGradient id="wd-metal-grey" x1="0" y1="0" x2="1" y2="0">' +
'      <stop offset="0" stop-color="#9AA1AA"/><stop offset="0.5" stop-color="#D7DBE0"/><stop offset="1" stop-color="#9AA1AA"/>' +
'    </linearGradient>' +
'    <linearGradient id="wd-metal-copper" x1="0" y1="0" x2="1" y2="0">' +
'      <stop offset="0" stop-color="#B5651D"/><stop offset="0.5" stop-color="#E8A05C"/><stop offset="1" stop-color="#B5651D"/>' +
'    </linearGradient>' +
/* LED camı ve direnç gövdesi için hacim katmanları (2026-09-28). Taban
   renk .wd-led-bulb'da kalıyor — yanıp sönme onun fill'ini değiştiriyor;
   bunlar üstüne binen YARI SAYDAM ışık/gölge, her iki halde de çalışır. */
'    <linearGradient id="wd-led-shade" x1="0" y1="0" x2="1" y2="0">' +
'      <stop offset="0" stop-color="#fff" stop-opacity="0.30"/><stop offset="0.38" stop-color="#fff" stop-opacity="0"/>' +
'      <stop offset="0.72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.26"/>' +
'    </linearGradient>' +
'    <linearGradient id="wd-led-rim" x1="0" y1="0" x2="0" y2="1">' +
'      <stop offset="0" stop-color="#fff" stop-opacity="0.30"/><stop offset="1" stop-color="#000" stop-opacity="0.28"/>' +
'    </linearGradient>' +
'    <linearGradient id="wd-res-shade" x1="0" y1="0" x2="0" y2="1">' +
'      <stop offset="0" stop-color="#fff" stop-opacity="0.50"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/>' +
'      <stop offset="1" stop-color="#5a3d12" stop-opacity="0.30"/>' +
'    </linearGradient>' +
'    <linearGradient id="wd-leg-metal" x1="0" y1="0" x2="1" y2="0">' +
'      <stop offset="0" stop-color="#8E959E"/><stop offset="0.5" stop-color="#E4E7EB"/><stop offset="1" stop-color="#8E959E"/>' +
'    </linearGradient>' +
'    <filter id="wd-blur" x="-70%" y="-70%" width="240%" height="240%">' +
'      <feGaussianBlur stdDeviation="7"/>' +
'    </filter>' +
'  </defs>' +

/* --- LAPTOP + TYPE-C KABLOSU + VERİ IŞILTISI ---
   Kart artık breadboard'a takılı ve yatay; Type-C soketi kartın SOL
   kenarında (x~76..90, y~140..176). Kablo laptoptan oraya giriyor.
   Gradyan id'leri "wd-" önekli, çünkü aynı id'ler çakışırsa gizli olan
   kazanıyor ve çizim soluyor (kart kırmızısında tam olarak bu olmuştu).
   2026-10-14: laptop Blender render'ı (laptopMarkup, aşağıda). */
'  <defs>' +
'    <linearGradient id="wd-screenGlare" x1="0" y1="0" x2="1" y2="1">' +
'      <stop offset="0" stop-color="#ffffff" stop-opacity="0.10"/>' +
'      <stop offset="0.35" stop-color="#ffffff" stop-opacity="0"/>' +
'      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>' +
'    </linearGradient>' +
'    <linearGradient id="wd-cableGrad" x1="0" y1="0" x2="0.4" y2="1">' +
'      <stop offset="0" stop-color="#fbfbfc"/><stop offset="0.5" stop-color="#dcdee2"/>' +
'      <stop offset="1" stop-color="#b6bbc3"/>' +
'    </linearGradient>' +
'    <linearGradient id="wd-plugGrad" x1="0" y1="0" x2="0" y2="1">' +
'      <stop offset="0" stop-color="#f2f4f7"/><stop offset="0.45" stop-color="#ced3da"/>' +
'      <stop offset="1" stop-color="#93a0ac"/>' +
'    </linearGradient>' +
'  </defs>' +

laptopMarkup() +

/* --- BREADBOARD --- */
'  <g id="wd-breadboard">' +
'    <rect x="48" y="20" width="502" height="258" rx="14" fill="#E0CFB2" opacity="0.45"/>' +
/* Gövde + orta kanal Blender render'ı (blender/breadboard.py), 2026-09-30.
   Delikler, raylar, şeritler aşağıda SVG: sütun dalgası, x-ray ve nabız onlara bağlı. */
'    <image class="wd-bb-render" href="assets/img/kart/breadboard.webp" x="40" y="10" width="510" height="266" preserveAspectRatio="none"/>' +
'    <g class="wd-rails">' + railLines() + railHoles() + '</g>' +
'  </g>' +
'  <g id="wd-strips">' + strips() + railStrips() + (iki ? strips2() : '') + '</g>' +
'  <g id="wd-holes">' + holes() + '</g>' +
'  <g id="wd-cols">' + (sira ? '' : colRect('a', C_ANOT) + colRect('k', C_KATOT) + colRect('r', C_DIRENC)) + (iki ? cols2() : '') + '</g>' +

/* --- LAPTOP KABLOSU ---
   Çizim sırası önemli: kablo BREADBOARD'DAN SONRA, KARTTAN ÖNCE geliyor.
   Tahtadan önce çizilince fişin gövdesi tahtanın altında kalıyor ve kablo
   havada bitiyormuş gibi duruyordu; karttan sonra çizilse bu sefer fiş
   soketin önüne binerdi. Aradaki yer doğrusu: kablo tahtanın üstünde
   uzanıyor, ucu kartın soketinin içinde kayboluyor. --- */
/* Kablonun iki hali: takılı ve fiş soketin D I Ş I N D A.
   Kablo fişin ucunda bittiği için yalnızca fişi kaydırmak kabloyu
   koparirdı — iki eğri ayrı çiziliyor, CSS birini gösteriyor. */
'  <g id="wd-usb">' +
'    <g class="wd-usb-on">' +
'      <path d="' + usbYol(26, 1, 1) + '" stroke="#000000" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.14"/>' +
'      <path id="wd-usb-path" d="' + usbYol(26, 0, 0) + '" stroke="url(#wd-cableGrad)" stroke-width="6.5" fill="none" stroke-linecap="round"/>' +
'      <path d="' + usbYol(26, -0.6, -1.6) + '" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.6"/>' +
'    </g>' +
'    <g class="wd-usb-off">' +
'      <path d="' + usbYol(2, 1, 1) + '" stroke="#000000" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.14"/>' +
'      <path d="' + usbYol(2, 0, 0) + '" stroke="url(#wd-cableGrad)" stroke-width="6.5" fill="none" stroke-linecap="round"/>' +
'      <path d="' + usbYol(2, -0.6, -1.6) + '" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.6"/>' +
'    </g>' +
'    <g id="wd-usb-plug">' +
/* 2026-10-14: kartın USB-C soketi gerçek oranında (BoardSVG.KONUM.usb, 46 birim genişlik):
   yatayda x 75.2..111.2, y 116.1..162.1 (merkez 139.1), ağız x 75.2. Fiş ona göre: metal dil
   ağza sığar (38 birim; ağız 41), gövde soketten geniş (58; gerçekte 12.4 mm / 8.9 mm). Eski
   fiş y 157'de, soketin alt yarısındaydı (kart 180° dönünce kaydırılmamıştı). Kart fişten SONRA
   çizildiği için dilin soketin içinde kalan kısmını soket örter: kablo gerçekten takılı durur. */
'      <rect x="62" y="120.1" width="18" height="38" rx="3" fill="#B9C0C9" stroke="#7D8791" stroke-width="1"/>' +
'      <rect x="26" y="110.1" width="38" height="58" rx="8" fill="url(#wd-plugGrad)" stroke="#727d89" stroke-width="1.5"/>' +
'      <rect x="30" y="114" width="28" height="8" rx="3" fill="#ffffff" opacity="0.35"/>' +
'    </g>' +
'    <circle class="wd-data" r="4">' +
'      <animateMotion dur="1.9s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear"><mpath href="#wd-usb-path"/></animateMotion>' +
'    </circle>' +
'  </g>' +

/* --- KART: breadboard'un üzerinde, kanalı boydan boya kaplıyor ---
   Sıfırdan kurulan derslerde kart da bir parça (KART_ADIMI): #wd-part-kart sarar, #wd-board'a
   dokunulmaz (kendi transform'u, 1.1 kartıyla birebirliği ve 3B'nin okuduğu resmi onda). 1.4'te
   kart baştan takılı: sarılmaz. */
(iki ? '' : '  <g class="wd-part wd-drop wd-kart" id="wd-part-kart" data-part="kart">') +
'  <g id="wd-board" transform="translate(' + KART_DX + ',' + KART_DY + ')">' +
global.BoardSVG.groupMarkup({ rings: true, horizontal: true }) + '</g>' +
(iki ? '' : '  </g>') +

/* --- KILAVUZ ÇİZGİLER: pin yazısından üstündeki TEK boş deliğe --- */
(sira ? '' : guideMarkup('d5', C_D5) + guideMarkup('gnd', C_GND)) +
/* Ders 1.4: D6 (kartta MC) için halka + kılavuz. Halka kartın grubunda
   değil sahnede: kart çizimi (board-svg.js) iki derste birebir aynı kalsın. */
(iki ? guideMarkup('d6', C2_D6) +
  '<circle class="wd-ring" id="wd-ring-d6" cx="' + COL[C2_D6] + '" cy="' + SIRA_PIN + '" r="8.5"/>' +
  /* Kartın "= D5" çağrısı tam MC'nin altındaki deliğe düşüyor, D6 kablosu
     da oraya takılıyor. Bu derste kart çağrısı gizli (wiring-diagram.css
     .is-iki .wd-pin-alias), yerine iki satır: GND ile MC arasındaki boş
     bant (sütun 7-9, satır a çevresi); kablolar orada y>=240'ta. */
  '<text class="wd-pin-alias wd-alias2" x="' + (COL[C2_D6] - 9) + '" y="' + (SIRA_KART - 4) + '">MC = D6</text>' +
  '<text class="wd-pin-alias wd-alias2" x="' + (COL[C2_D6] - 9) + '" y="' + (SIRA_KART + 5) + '">MI = D5</text>' : '') +

/* --- SIYAH JUMPER: direnç sağ ucu -> kartın GND pini.
   Arda (2026-09-18): "GND kablosu alt taraftan gelsin, kablo LED'in
   arkasından gittiği için belli olmuyor." Eskiden yol yukarıdan kavis
   yapıyordu ve LED'in çizim alanının TAM İÇİNDEN geçiyordu (ölçüldü:
   240 örnek noktanın 77'si LED'in bbox'ı içinde, en tepe y=49).
   Yeni yol LED'e hiç girmiyor: direncin sağından aşağı iniyor, direncin
   ALTINDAN (y~104, kartın sağındaki boş sıralar) sola dolaşıyor ve GND'ye
   aşağıdan giriyor. Kritik ölçüler: LED bbox x 363..424 / y -8..68,
   kart x 84..352 / y 88.4..228 — üçüncü kavis kartın sol tarafına
   girmeden önce y~85'e çıkıyor, yani kartın üstüne binmiyor. --- */
(sira ? (modul ? modulMarkup(sira) : siraMarkup(sira) + (buton ? butonMarkup() : '')) : ((function () {
  var d = iki ? blackWirePath2() : blackWirePath(COL[C_DIRENC]);
  return '<g class="wd-part" id="wd-part-jumper-black" data-part="jumper-black">' +
    wireMarkup('wd-path-black', d, '#33383F', '#6E7682') +
    pinMarkup(COL[C_DIRENC], SIRA_DIS, '#33383F') +
    pinMarkup(COL[C_GND], SIRA_KART, '#33383F', 'alt') +
  '</g>';
})() +

/* --- KIRMIZI JUMPER: kartın D5 (Mİ) pini -> LED'in uzun bacağı --- */
(function () {
  /* Kırmızı kablo (2026-09-22'de sıfırdan çizildi): D5 (Mİ) pininin
     ALTINDAKİ boş delikten çıkar, kartın altındaki koridorda y~230'da
     sağa uzanır, kartın sağ kenarını (x 352.2) geçtikten sonra yukarı
     dönüp kanalı aşar ve LED'in uzun bacağının sütununa üst bloktan
     girer. Kartın gövdesine hiç değmez: yatay bölüm gövdenin altında,
     dikey bölüm gövdenin sağında. */
  var d = 'M' + COL[C_D5] + ' ' + SIRA_KART +
    ' C ' + (COL[C_D5] + 40) + ' 232 ' + (COL[C_ANOT] - 26) + ' 232 ' + (COL[C_ANOT] - 8) + ' 214' +
    ' C ' + (COL[C_ANOT] + 14) + ' 176 ' + (COL[C_ANOT] - 12) + ' 120 ' + COL[C_ANOT] + ' ' + SIRA_IC;
  return '<g class="wd-part" id="wd-part-jumper-red" data-part="jumper-red">' +
    wireMarkup('wd-path-red', d, '#D6273A', '#FF8A86') +
    pinMarkup(COL[C_D5], SIRA_KART, '#D6273A', 'alt') +
    pinMarkup(COL[C_ANOT], SIRA_IC, '#D6273A') +
  '</g>';
})() +

/* --- DİRENÇ 220Ω --- */
'  <g class="wd-part wd-drop" id="wd-part-resistor" data-part="resistor">' +
direncIc() +
'  </g>' +

/* --- LED: gövde breadboard'un üzerinde, bacaklar iki ayrı sütunun
   dış sırasına giriyor. --- */
'  <g class="wd-part wd-drop" id="wd-part-led" data-part="led">' +
ledIc() +
'  </g>')) +

(iki ? zincir2Markup() : '') +

/* --- AKIM AKIŞI: devre tamamlanınca D5 -> LED -> direnç -> GND --- */
/* LED sırasında her an tek LED yanıyor: sürekli dönen kıvılcım yanıltır, akış boş. */
'  <g id="wd-flow">' + (sira ? '' :
'    <circle class="wd-spark" r="3.6">' +
'      <animateMotion dur="1.6s" repeatCount="indefinite" begin="0s"><mpath href="#wd-path-red"/></animateMotion>' +
'    </circle>' +
'    <circle class="wd-spark" r="3.6">' +
'      <animateMotion dur="1.6s" repeatCount="indefinite" begin="0.55s"><mpath href="#wd-path-red"/></animateMotion>' +
'    </circle>' +
'    <circle class="wd-spark" r="3.6">' +
'      <animateMotion dur="1.6s" repeatCount="indefinite" begin="1.1s"><mpath href="#wd-path-red"/></animateMotion>' +
'    </circle>' +
'    <circle class="wd-spark" r="3.6">' +
'      <animateMotion dur="2.2s" repeatCount="indefinite" begin="0.3s" keyPoints="1;0" keyTimes="0;1" calcMode="linear"><mpath href="#wd-path-black"/></animateMotion>' +
'    </circle>' +
'    <circle class="wd-spark" r="3.6">' +
'      <animateMotion dur="2.2s" repeatCount="indefinite" begin="1.4s" keyPoints="1;0" keyTimes="0;1" calcMode="linear"><mpath href="#wd-path-black"/></animateMotion>' +
'    </circle>' +
(iki ? kivilcim2() : '')) +
'  </g>' +
'</svg>';
  }

  /* Faz C2 — büyüteç yakın planı: uzun bacak (+), kısa bacak (−) ve
     LED'in kenarındaki DÜZ YÜZ (spec §C2). Bacakları kesilmiş bir LED'de
     çocuğun elinde kalan tek ipucu düz kenardır, bu yüzden büyütülüyor. */
  function magnifySvg() {
    return '' +
      '<path class="wd-led-bulb" d="M45 100 L45 46 A32 32 0 0 1 109 46 L109 74 L96 74 A18 18 0 0 0 58 74 L45 74 Z"/>' +
      '<path d="M101 52 L112 52 L112 72" fill="none" stroke="#8a4038" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path class="wd-led-post" d="M60 100 L60 114" stroke-width="4"/>' +
      '<path class="wd-led-cup" d="M92 100 L92 88 L104 78 L104 92 Z" stroke-width="1.4"/>' +
      '<text x="60" y="26" class="wd-sign wd-sign-plus" font-size="17">+</text>' +
      '<text x="100" y="26" class="wd-sign" font-size="17">−</text>' +
      '<text x="118" y="60" font-size="9" fill="#8a4038" font-weight="700">düz&#160;kenar</text>' +
      '<path d="M114 60 L106 60" stroke="#8a4038" stroke-width="1.4" fill="none" marker-end="none"/>';
  }

  /* ============================================================
     FAZ A — YAYGIN HATA GALERİSİ
     ============================================================
     Yanında kimse olmayan çocuğun takıldığı yerde çıkışı yok. Dört hata
     kendi helpPrompt'umuzdaki (assets/data/lesson-1-2.js) kontrol
     listesinin ilk dördüyle birebir örtüşür. Metin listesi DEĞİL, küçük
     ÇİZİM — 5. sınıf metin listesi okumaz (spec §Faz A).
     ============================================================ */
  /* ============================================================
     HATA GALERİSİ ÇİZİMLERİ ("Bende olmadı")
     ============================================================
     Önceki hâl soyut kutucuklardı: LED düz bir daire, breadboard yok,
     delik ızgarası yok, kablo yok. Arda: "bende olmadı kısmını ben
     anlamadım, çizimler kötü, çocuk nasıl anlasın." Haklıydı — çocuk
     kendi tezgahını ekrandakiyle KARŞILAŞTIRACAK; ekrandaki şey tezgaha
     benzemiyorsa karşılaştırılacak bir şey yok.

     Artık her hata, ASIL SAHNENİN kırpılmış hâlidir: aynı breadboard,
     aynı delik ızgarası (holes() — tek kaynak), aynı LED çizimi, aynı
     koordinatlar (COL/ROW_UP, bkz. dosya başındaki ÖLÇÜ NOTU). Her
     karttan tek bir şey farklı: hatanın kendisi. Nereye bakılacağı da
     kırmızı kesikli halkayla işaretli.
     ============================================================ */

  /* Köşe rozeti. Kartların viewBox genişliği farklı olduğu için rozet
     viewBox'a oranlı ölçekleniyor — böylece hepsinde AYNI fiziksel
     büyüklükte çıkıyor. */
  function errBadge(ok, vb) {
    var k = vb[2] / 140;
    return '<g transform="translate(' + (vb[0] + vb[2] - 15 * k) + ',' + (vb[1] + 15 * k) + ') scale(' + k + ')">' +
      '<circle r="10" fill="' + (ok ? '#2BB673' : '#D6273A') + '"/>' +
      (ok
        ? '<path d="M-4 0.5l3 3.2 5.4-6.2" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<path d="M-3.6 -3.6l7.2 7.2M3.6 -3.6l-7.2 7.2" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>') +
      '</g>';
  }

  function errFrame(vb, inner, ok) {
    return '<svg class="mh-svg" viewBox="' + vb.join(' ') + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect class="mh-bg" x="' + vb[0] + '" y="' + vb[1] + '" width="' + vb[2] + '" height="' + vb[3] + '" rx="10"/>' +
      inner + errBadge(ok, vb) + '</svg>';
  }

  /* Breadboard gövdesi + orta kanal + GERÇEK delik ızgarası + KART.
     Kartın kendisi sade bir kırmızı gövde: asıl çizimi (BoardSVG) sekiz
     kez daha basmak gradyan id'lerini çakıştırır ve kartın kırmızısı
     söner — bu hata bir kez yaşandı. Kartın bu kartlardaki işi zaten
     "çocuğun tezgahına benzesin" demek: gövde yeter. */
  function errBoard() {
    return '<rect x="44" y="14" width="502" height="258" rx="14" fill="#FBF6EC" stroke="#E3D4BC" stroke-width="1.5"/>' +
      '<rect x="52" y="' + KANAL_Y + '" width="486" height="' + KANAL_H + '" rx="6" fill="#EADCC4"/>' +
      holes() +
      '<rect x="' + (KART_DX - 48) + '" y="' + (KART_DY + 90) + '" width="268" height="140" rx="6" fill="#A81F18"/>';
  }

  /* Bir sütunu boyar: "bu delikler birbirine bağlı" mesajı. Asıl
     sahnedeki colRect ile aynı kutu (serbest iki satır). */
  function errCol(i, color) {
    return '<rect x="' + (COL[i] - 7) + '" y="' + (SIRA_DIS - 9) + '" width="14" height="' +
      (SIRA_IC - SIRA_DIS + 16) + '" rx="7" fill="' + color +
      '" opacity="0.16" stroke="' + color + '" stroke-width="1.6"/>';
  }

  /* "Buraya bak" halkası — yalnızca yanlış kartta. */
  function errMark(cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#D6273A" ' +
      'stroke-width="2.4" stroke-dasharray="5 4" opacity="0.92"/>';
  }

  /* Kırmızı jumper: asıl sahnedeki eğrinin AYNISI (D5 sütunundan LED
     sütununa). Kırpma neyi göstereceğine kendi karar veriyor. */
  /* Jumper'ın erkek ucu: delikten giren metal iğne + üstünde plastik kılıf.
     Eskiden tek bir daire vardı; kablonun deliğin İÇİNE girdiği anlaşılmıyordu.
     Halka rehberde o kablo aktifken nabız atar (bkz. .wd-pin-ring). */
  /* KILAVUZ ÇİZGİ — tester bulgusu (Arda, 2026-09-20): çocuk kartta `MI`
     yazısını görüyor ama kabloyu hangi deliğe sokacağını bulamıyor. Sebebi
     ölçüldü: pinin KENDİ deliği (satır i) kartın altında ve DOLU; elinde
     kalan tek boş delik bir üstteki j. Çizgi tam o bağı gösteriyor —
     yazıdan yukarı, pedin üstünden geçip boş deliğe.
     Kart grubunun DIŞINDA ve mutlak konumlu çiziliyor: kart kıpırdarsa
     çizgi onunla sürüklenmesin, sahne de kaymasın (19 Eylül sözleşmesi). */
  function guideMarkup(id, sut) {
    var x = COL[sut];
    return '<g class="wd-guide" id="wd-guide-' + id + '">' +
      /* Boş delik pinin ALTINDA: offsetlerin işareti döndü. */
      '<path d="M' + x + ' ' + (SIRA_PIN - 4) + ' V' + (SIRA_KART - 7) + '" fill="none"/>' +
      '<circle cx="' + x + '" cy="' + SIRA_KART + '" r="6.4" fill="none"/>' +
    '</g>';
  }

  /* Fişin yönü artık sabit değil: üst bloktaki uçlarda gövde deliğin
     ÜSTÜNDE (kablo yukarıdan gelir), kartın altındaki uçlarda ALTINDA
     (kablo aşağıdan gelir). yon='alt' verilince her şekil kendi deliğinin
     y'sine göre aynalanır — rect'lerde y' = 2y - (y0 + h). */
  function pinMarkup(x, y, renk, yon) {
    var alt = (yon === 'alt');
    var halka = alt ? (y + 2) : (y - 2);
    var metalY = alt ? (y - 6) : (y - 1);
    var govdeY = alt ? (y - 0.4) : (y - 8);
    return '<g class="wd-pin">' +
      '<circle class="wd-pin-ring" cx="' + x + '" cy="' + halka + '" r="8"/>' +
      '<rect x="' + (x - 1.4) + '" y="' + metalY + '" width="2.8" height="7" rx="1" fill="url(#wd-metal-grey)"/>' +
      '<rect x="' + (x - 3.4) + '" y="' + govdeY + '" width="6.8" height="8.4" rx="2.2" fill="' + renk +
        '" stroke="rgba(0,0,0,.28)" stroke-width="0.6"/>' +
      '<rect x="' + (x - 3.4) + '" y="' + govdeY + '" width="2.4" height="8.4" rx="1.6" fill="#fff" opacity=".22"/>' +
    '</g>';
  }

  /* Siyah jumper'ın yolu TEK KAYNAK: hem asıl sahne hem hata galerisi
     bunu kullanır. Ayrı ayrı yazıldıklarında biri değişip öbürü eski
     kaldı ve çocuk karşılaştıracağı iki çizimde farklı kablolar gördü
     (kural: öğretici çizim asıl sahnenin kırpılmış hali olmalı).
     x = kablonun tahtaya girdiği sütun; öbür uç her zaman GND. */
  /* Siyah kablo (2026-09-22'de sıfırdan çizildi): direncin sağ ucundan
     çıkar, kartın SAĞINDAKİ boş sütunlardan (x > 352.2) aşağı iner,
     kanalı geçer, kartın ALTINDAN (y ~240, gövdenin dibi 209.1 ile alt
     ray 244 arasındaki tek koridor) sola süzülür ve GND'ye alttan girer.
     Kırmızı kablo bu koridorda y~230'da yattığı için siyah 10 birim
     altından geçer; ikisi kesişmez, paralel uzanır. */
  function blackWirePath(x) {
    return 'M' + x + ' ' + SIRA_DIS +
      ' C ' + (x + 26) + ' 60 ' + (x + 40) + ' 96 ' + (x + 34) + ' 140' +
      ' C ' + (x + 28) + ' 186 ' + (x - 20) + ' 214 ' + (COL[C_ANOT] + 4) + ' 240' +
      ' C ' + (COL[C_D5] - 10) + ' 252 ' + (COL[C_GND] + 44) + ' 252 ' + COL[C_GND] + ' ' + SIRA_KART;
  }

  /* Bir kablonun üç katmanı. Aynı "d" üç kez çizilir:
       casing  — tahta yüzeyi renginde, en kalın: kablo LED bacağının
                 üstünden geçerken altındakinde boşluk açar, hangisinin
                 önde olduğu anlaşılır.
       gövde   — asıl renk.
       gloss   — üstte ince açık ton: yuvarlak kablo hissi. */
  function wireMarkup(id, d, renk, gloss) {
    /* Casing'de de pathLength=1 ŞART: yoksa wd-draw'ın dashoffset'i
       gerçek uzunlukta 1 birimlik çizgilere düşüyor, casing baştan TAMAMI
       görünüyor ve renkli kablonun önünde krem bir "hayalet" gibi
       uzanıyordu (2026-09-28, 3x ekran görüntüsüyle görüldü). */
    return '<path class="wd-wire-casing" pathLength="1" d="' + d + '" fill="none"/>' +
           '<path id="' + id + '" class="wd-wire" pathLength="1" d="' + d + '" stroke="' + renk +
             '" stroke-width="5" fill="none" stroke-linecap="round"/>' +
           '<path class="wd-wire-gloss" pathLength="1" d="' + d + '" stroke="' + gloss +
             '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
  }

  function errRedWire(fromCol) {
    var a = COL[fromCol === undefined ? C_D5 : fromCol], b = COL[C_ANOT];
    return '<path d="M' + a + ' ' + SIRA_KART + ' C ' + (a + 30) + ' ' + (SIRA_IC - 26) + ' ' +
      (b - 30) + ' ' + (SIRA_IC - 26) + ' ' + b + ' ' + SIRA_IC +
      '" stroke="#D6273A" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<circle cx="' + a + '" cy="' + SIRA_KART + '" r="3.4" fill="#8E1220"/>' +
      '<circle cx="' + b + '" cy="' + SIRA_IC + '" r="3.4" fill="#8E1220"/>';
  }

  /* Siyah jumper: x sütunundan kartın GND pinine, LED'in üstünden kavis. */
  function errBlackWire(x) {
    return '<path d="' + blackWirePath(x) +
      '" stroke="#33383F" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<circle cx="' + x + '" cy="' + SIRA_DIS + '" r="3.4" fill="#22262B"/>';
  }

  /* Direnç — asıl sahnedeki çizim, id'siz. */
  function errResistor() {
    var k = COL[C_KATOT], r = COL[C_DIRENC];
    return '' +
      '<path d="M' + k + ' ' + SIRA_IC + ' H' + (k + 12) + '" stroke="#A9B0BA" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M' + (r - 12) + ' ' + SIRA_IC + ' H' + r + '" stroke="#A9B0BA" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<rect x="' + (k + 12) + '" y="' + (SIRA_IC - 9) + '" width="' + (r - k - 24) + '" height="18" rx="8" fill="#E7CF9C" stroke="#BC9C5E" stroke-width="1"/>' +
      '<rect x="' + (k + 18) + '" y="' + (SIRA_IC - 9) + '" width="5" height="18" fill="#C0392B"/>' +
      '<rect x="' + (k + 26) + '" y="' + (SIRA_IC - 9) + '" width="5" height="18" fill="#C0392B"/>' +
      '<rect x="' + (k + 34) + '" y="' + (SIRA_IC - 9) + '" width="5" height="18" fill="#6E4B23"/>' +
      '<circle cx="' + k + '" cy="' + SIRA_IC + '" r="3" fill="#8E969F"/>' +
      '<circle cx="' + r + '" cy="' + SIRA_IC + '" r="3" fill="#8E969F"/>';
  }

  /* Asıl sahnedeki LED çizimi.
     flip=true: içerideki ŞİŞMAN kâse ile İNCE çubuk yer değiştirir ve
     +/- işaretleri takas olur — yani LED ters takılmıştır. Bacakların
     kendisi yer değiştirmez; gerçekte de öyle, ters takmak LED'i
     çevirmektir, bacakları başka deliğe sokmak değil.
     legs: bacakların indiği delikler. */
  function errLed(flip, legs) {
    var A = COL[C_ANOT], K = COL[C_KATOT];
    var l = legs || [[A, SIRA_DIS], [K, SIRA_DIS]];
    var ic =
      '<path class="wd-led-post" d="M' + (A + 2) + ' 30 L' + (A + 2) + ' 20"/>' +
      '<path class="wd-led-cup" d="M' + (K - 3) + ' 30 L' + (K - 3) + ' 22 L' + (K + 6) + ' 14 L' + (K + 6) + ' 24 Z"/>' +
      '<path d="M' + (K + 4) + ' 29 L' + (K + 10) + ' 29 L' + (K + 10) + ' 22" fill="none" stroke="#8a4038" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>';
    return '' +
      '<path d="M' + (A + 5) + ' 36 L' + (A + 5) + ' 48 L' + l[0][0] + ' ' + l[0][1] + '" stroke="#B6BCC5" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M' + (K - 5) + ' 36 L' + (K - 5) + ' 54 L' + l[1][0] + ' ' + l[1][1] + '" stroke="#B6BCC5" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<ellipse class="wd-leg-land" cx="' + l[0][0] + '" cy="' + l[0][1] + '" rx="3.2" ry="2"/>' +
      '<ellipse class="wd-leg-land" cx="' + l[1][0] + '" cy="' + l[1][1] + '" rx="3.2" ry="2"/>' +
      '<path class="wd-led-bulb" d="M' + (A - 6) + ' 30 L' + (A - 6) + ' 16 A13 13 0 0 1 ' + (K + 6) + ' 16 L' + (K + 6) + ' 30 Z"/>' +
      '<rect class="wd-led-bulb" x="' + (A - 10) + '" y="28" width="' + (K - A + 20) + '" height="6" rx="3"/>' +
      '<g' + (flip ? ' transform="translate(' + (A + K) + ',0) scale(-1,1)"' : '') + '>' + ic + '</g>' +
      '<text x="' + (A - 11) + '" y="' + (SIRA_DIS - 22) + '" class="wd-sign' + (flip ? '' : ' wd-sign-plus') + '">' + (flip ? '\u2212' : '+') + '</text>' +
      '<text x="' + (K + 11) + '" y="' + (SIRA_DIS - 22) + '" class="wd-sign' + (flip ? ' wd-sign-plus' : '') + '">' + (flip ? '+' : '\u2212') + '</text>';
  }

  /* LED'in çevresini gösteren ortak kırpma. */
  function ledVb() { return [COL[C_ANOT] - 40, -12, 108, 130]; }

  /* 1) LED ters takılmış: içerideki şişman kâse yanlış tarafta, yani
     artının gitmesi gereken deliğe eksi bacak inmiş. */
  function errReversed(ok) {
    return errFrame(ledVb(),
      errBoard() + errCol(C_ANOT, ok ? '#2BB673' : '#D6273A') + errRedWire() + errLed(!ok) +
      (ok ? '' : errMark((COL[C_ANOT] + COL[C_KATOT]) / 2, 24, 27)),
      ok);
  }

  /* 2) İki bacak AYNI sütunda: sütunun beşi birbirine bağlı olduğu için
     LED'in iki ucu kısa devre olur, akım LED'e hiç uğramaz. */
  function errShort(ok) {
    var legs = ok
      ? [[COL[C_ANOT], SIRA_DIS], [COL[C_KATOT], SIRA_DIS]]
      : [[COL[C_ANOT], SIRA_DIS], [COL[C_ANOT], SIRA_IC]];
    return errFrame(ledVb(),
      errBoard() +
      (ok ? errCol(C_ANOT, '#2BB673') + errCol(C_KATOT, '#2BB673') : errCol(C_ANOT, '#D6273A')) +
      errRedWire() + errLed(false, legs) +
      (ok ? '' : errMark(COL[C_ANOT], (SIRA_DIS + SIRA_IC) / 2, 18)),
      ok);
  }

  /* 3) Direnç devrede değil: yanlışta direnç TAHTADA ama kanalın ÖBÜR
     tarafında — üst blokla alt blok ayrı olduğu için devreye hiç girmiyor.
     Siyah kablo da doğrudan LED'in kısa bacağının sütununa girmiş.
     Olması gereken yer kesikli hayalet olarak duruyor ki çocuk
     "orada bir şey eksik" desin. */
  function errNoResistor(ok) {
    var vb = [COL[C_KATOT] - 52, -10, 179, 216];
    var hayalet =
      '<rect x="' + (COL[C_KATOT] + 12) + '" y="' + (SIRA_IC - 9) + '" width="' + (COL[C_DIRENC] - COL[C_KATOT] - 24) +
      '" height="18" rx="8" fill="none" stroke="#BC9C5E" stroke-width="1.6" stroke-dasharray="5 4" opacity="0.85"/>' +
      '<text x="' + ((COL[C_KATOT] + COL[C_DIRENC]) / 2) + '" y="' + (SIRA_IC - 15) +
      '" font-size="10" font-weight="700" fill="#D6273A" text-anchor="middle" font-family="Arial, sans-serif">buraya</text>';
    var yanlisYer = '<g transform="translate(0,' + (ROW_DOWN[1] - SIRA_IC) + ')">' + errResistor() + '</g>';
    return errFrame(vb,
      errBoard() + errCol(C_KATOT, ok ? '#2BB673' : '#D6273A') + errLed(false) +
      (ok
        ? errResistor() + errBlackWire(COL[C_DIRENC])
        : hayalet + yanlisYer + errBlackWire(COL[C_KATOT]) +
          errMark((COL[C_KATOT] + COL[C_DIRENC]) / 2, ROW_DOWN[1], 38)),
      ok);
  }

  /* 4) Kablo yanlış pinde: kod D5'i kullanıyor, kartta o pin Mİ diye
     yazıyor. Bir yanındaki MC'ye takmak en sık yapılan hata.
     Kart artık breadboard'a takılı olduğu için hata artık "yanlış pin"
     değil, YANLIŞ SÜTUN olarak görünüyor — zaten öğretmek istediğimiz de
     bu: kablonun girdiği delik, kartın pini ile aynı sütunda olmalı. */
  function errWrongPin(ok) {
    var sut = ok ? C_D5 : C_D5 + 1;
    var vb = [COL[C_D5] - 36, 28, 105, 126];
    var pads = '';
    [[C_D5 - 1, 'MO'], [C_D5, 'M\u0130'], [C_D5 + 1, 'MC']].forEach(function (pin) {
      var x = COL[pin[0]];
      /* Pedlerin y'si asil sahnedeki pin sirasi (SIRA_PIN = i) ile ayni
         olmali; sabit 96 eski KART_DY'ye gore yazilmisti. */
      pads += '<circle cx="' + x + '" cy="' + SIRA_PIN + '" r="4" fill="#E2B85F" stroke="#7c5a1e" stroke-width="0.5"/>' +
        '<text x="' + x + '" y="' + (SIRA_PIN + 9) + '" font-size="7" font-weight="700" fill="#F7E3C8" ' +
        'font-family="Arial, sans-serif" transform="rotate(90 ' + x + ' ' + (SIRA_PIN + 9) + ')">' + pin[1] + '</text>';
    });
    return errFrame(vb,
      errBoard() + pads +
      '<text x="' + COL[C_D5] + '" y="42" font-size="8" font-weight="700" fill="#8a4038" ' +
      'text-anchor="middle" font-family="Arial, sans-serif">M\u0130 = D5</text>' +
      errCol(sut, ok ? '#2BB673' : '#D6273A') + errRedWire(sut) +
      (ok ? '' : errMark(COL[sut], SIRA_KART, 12)),
      ok);
  }

  var ERROR_ITEMS = [
    {
      id: 'reversed',
      label: 'LED ters takılmış',
      check: 'LED’in UZUN bacağı kırmızı kablonun sütununda mı?',
      fix: 'Değilse LED’i çıkar, çevir, tekrar tak.',
      wrong: errReversed(false),
      correct: errReversed(true)
    },
    {
      id: 'short',
      label: 'İki bacak aynı sütunda',
      check: 'İki bacak FARKLI sütunlarda mı?',
      fix: 'Aynı sütundaysa akım LED’e hiç uğramaz. Bir bacağı yan sütuna al.',
      wrong: errShort(false),
      correct: errShort(true)
    },
    {
      id: 'noresistor',
      label: 'Direnç devrede değil',
      check: 'Direnç, LED’in KISA bacağı ile siyah kablonun arasında mı?',
      fix: 'Direncin iki ucu da kanalın AYNI tarafında olmalı.',
      wrong: errNoResistor(false),
      correct: errNoResistor(true)
    },
    {
      id: 'wrongpin',
      label: 'Kablo yanlış sütunda',
      check: 'Kırmızı kablo, kartın Mİ pini ile AYNI sütunda mı?',
      fix: 'Kodun kullandığı D5, kartta Mİ diye yazıyor. Yanındaki MC sütunu değil.',
      wrong: errWrongPin(false),
      correct: errWrongPin(true)
    }
  ];

  var BOS_BASLIK = 'Tezgah boş. Parçaları sırayla takalım.';
  var BOS_IPUCU = '▶ <strong>Hadi kuralım</strong>’a bas: parçaları birlikte, tek tek takacağız.';

  function mount(opts) {
    var container = opts.container;
    /* Ders 1.4: birinci zincir tezgahta KURULU ve sabit; rehber yalnızca
       ikinci zinciri (LED2, D6 kablosu, direnç 2, GND köprüsü) kurar.
       -1 (boş tezgah) bu modda "yalnızca birinci LED devresi" demek. */
    var iki = !!opts.ikinciLed;
    /* Ders 1.5/1.6: LED sırası. desen = [{ yanik: [LED sırası], ms }, ...] — kodun loop()'u. */
    var sira = (opts.ledSirasi && opts.ledSirasi.length) ? opts.ledSirasi : null;
    var desen = opts.desen || [];
    /* Ders 1.6: trafik lambası modülü (LED sırası verisiyle, düzen modül). */
    var modul = !!(sira && opts.trafikModulu);
    /* Ders 3.1: LED sırası (D9) + buton (D10, 3V3, 10K pull-down). */
    var buton = !!(sira && !modul && opts.buton);
    if (sira) (modul ? modulTakDelik : siraTakDelik)(sira);
    if (buton) butonTakDelik();
    var ADIMLAR = sira ? (modul ? modulAdimlari(sira) : siraAdimlari(sira).concat(buton ? butonAdimlari() : [])) : iki ? STEPS2 : STEPS;
    var HALKALAR = sira ? ['gndu'].concat(sira.map(function (l) { return l.pin.toLowerCase(); })).concat(buton ? ['3v3', 'd10'] : [])
      : iki ? ['d6'] : ['d5', 'gnd'];
    var SUTUNLAR = sira ? [] : iki ? ['a2', 'k2', 'r2', 'g2'] : ['a', 'k', 'r'];
    var bosBaslik = opts.emptyTitle || BOS_BASLIK;
    var bosIpucu = opts.emptyHint || BOS_IPUCU;
    var bosNot = (opts.emptyNote !== undefined) ? opts.emptyNote
      : ' Devre bitince karta yükleyeceğin kod hemen aşağıda çıkacak.';
    var steps = opts.steps || [];
    /* Rehber metinleri ders VERİSİNDEN gelir (assets/data/lesson-1-2.js →
       wiringGuide). Motor içeriği bilmez. Verilmezse eski hint/checkpoint
       kutusuna düşer — geriye dönük uyum. */
    var guide = opts.guide || [];
    /* Adim 3 parca kartlarini okuyan islev DISARIDAN gelir (ders sayfasi
       PartsGallery.get'i baglar). Motor ne parcalari ne cumleleri bilir;
       veride yalnizca id durur, metin tek kaynaktan (parts-gallery.js)
       okunur - Adim 3 ile Adim 4 ayrisamaz. */
    var parcaBilgi = opts.partInfo || null;
    var onChange = opts.onStepChange || null;
    /* Devre bitince rehber kartının "sırada ne var" satırı. Ders 1.2'de kod
       aynı adımda, hemen aşağıda; Ders 1.3'te bir SONRAKİ adımda — metin
       derse göre değişiyor, bileşen hangi derste olduğunu bilmiyor. */
    var bitisMetni = opts.doneText || 'Şimdi aşağıdaki kodu karta yükle.';
    var bitisKontrol = opts.doneCheck || 'LED henüz yanmaz — kod karta gitmeden yanmaz.';

    var root = document.createElement('div');
    root.className = 'wd-root';
    root.tabIndex = 0;
    root.innerHTML =
      '<div class="wd-stage-wrap">' +
      '  <div class="wd-stage" id="wd-stage">' + svgMarkup(iki, sira, modul, buton) + '</div>' +
      '  <div class="wd-stage-tools">' +
      '    <button type="button" class="wd-x-ray-btn" id="wd-xray" hidden>İçini gör</button>' +
      '    <button type="button" class="wd-x-ray-btn" id="wd-magnify" hidden><img class="fx-ikon" src="assets/img/esya/alet-kod.webp" alt="" aria-hidden="true" draggable="false"> Yakından bak</button>' +
      '  </div>' +
      /* Adim 3 katmani KARTIN ICINDE DEGIL, sahnenin icinde duruyor:
         .wd-guide-card'in overflow-y:auto'su mutlak konumlu cocugu
         kirpiyordu (ekran goruntusuyle goruldu, katman hic gorunmedi).
         Burada kirpan yok ve sahne kutusu zaten position:relative. */
      '  <div class="wd-adim3-panel" id="wd-adim3-panel" hidden></div>' +
      '  <div class="wd-magnify-panel" id="wd-magnify-panel" hidden>' +
      '    <svg class="wd-magnify-svg" viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">' + magnifySvg() + '</svg>' +
      '    <p class="wd-magnify-note">Düz kenar var mı? O taraf kısa bacak (−).</p>' +
      '  </div>' +
      '</div>' +
      '<p class="wd-caption" id="wd-caption" aria-live="polite"></p>' +
      /* Ipucu ve kontrol noktasi TEK bir kutuda, sabit yukseklikte.
         Eskiden ikisi alt alta gelebiliyordu: bos tezgahta yalnizca ipucu
         vardi, ilk parca takilinca kontrol noktasi da acilip 96px yer
         kapiyor ve sahne 488px'ten 392px'e DUSUYORDU (olculdu). Yani
         animasyon tam ortasinda kuculup tasiyordu. Artik kutunun yeri
         bastan ayrilmis; kontrol noktasi acilinca ipucu gizleniyor, sahne
         hic boyut degistirmiyor. */
      '<div class="wd-notes">' +
      '  <div class="wd-hint" id="wd-hint"></div>' +
      '  <div class="wd-noport" id="wd-noport" hidden aria-live="polite"></div>' +
      '  <div class="wd-checkpoint" id="wd-checkpoint" hidden aria-live="polite">' +
      '    <p class="wd-checkpoint-title">✓ Şu an tezgahın buna benzemeli</p>' +
      '    <p class="wd-checkpoint-tip" id="wd-checkpoint-tip"></p>' +
      '  </div>' +
      '</div>' +
      /* Adim 3 baglantisi. Dugme kartin sag ust kosesinde MUTLAK
         konumlu, acilan katman da oyle (bkz. .wd-adim3-panel): ikisi de
         yerlesimden yer calmaz, yani acilip kapanirken sahne kipirdamaz
         - kartin butun tasariminin dayandigi kural. */
      '<div class="wd-guide-card" id="wd-guide-card" hidden aria-live="polite">' +
      '  <button type="button" class="wd-adim3-btn" id="wd-adim3-btn" hidden' +
      '          aria-expanded="false" aria-controls="wd-adim3-panel">Adım 3’te görmüştün</button>' +
      '  <p class="wd-guide-neden" id="wd-guide-neden"></p>' +
      '  <p class="wd-guide-nereye" id="wd-guide-nereye"></p>' +
      '  <p class="wd-guide-kontrol" id="wd-guide-kontrol"><span class="wd-guide-kontrol-ok">✓</span> <span id="wd-guide-kontrol-metin"></span></p>' +
      '</div>' +
      /* Serit ve dugme cubugu TEK SATIRDA (2026-09-19). Alt alta iken
         ikisi 85px tutuyordu; yan yana 43px. Kazanilan 42px sahneye
         gidiyor. Sayfanin altinda 48px'lik sabit gezinme cubugu (.bottom-nav)
         var ve hero yuksekligi onu da dusuyor - o 48px bir yerden
         cikmak zorundaydi, sahneden degil buradan cikti. */
      '<div class="wd-footer">' +
      /* ADIM ŞERİDİ KALDIRILDI (Arda, 2026-09-22): "o kısımlara basınca
         etkileşime giriyor ama ben bunu istemiyorum... öğrenciler direkt
         taktım kısmına basmayıp diğerlerine tıklıyor." Şerit, Taktım'la
         yarışan ikinci bir ilerleme yolu sunuyordu. Yerine TIKLANAMAZ bir
         ilerleme yazısı: bilgi ("kaçıncı parçadayım") duruyor, rekabet yok. */
      '<p class="wd-ilerleme" id="wd-ilerleme" aria-live="polite"></p>' +
      '<div class="wd-bar">' +
      '  <button type="button" class="wd-btn" id="wd-prev">◀ Geri</button>' +
      '  <button type="button" class="wd-btn wd-btn-guide" id="wd-guide" hidden>▶ Hadi kuralım</button>' +
      '  <button type="button" class="wd-btn wd-btn-done" id="wd-done" hidden>Taktım</button>' +
      '  <button type="button" class="wd-btn" id="wd-next">İleri ▶</button>' +
      '  <span class="wd-status" id="wd-status">✓ Devre tamam!</span>' +
      '</div>' +
      '</div>';

    container.innerHTML = '';
    container.appendChild(root);

    var svg = root.querySelector('#wd-svg');
    if (iki) svg.classList.add('is-iki');
    if (sira) svg.classList.add('is-sira');
    if (modul) svg.classList.add('is-modul');
    /* Takma hareketi anime.js'teyse CSS yerleşmesi (wd-place) çekilir,
       ikisi aynı transform'u yarıştırmasın (bkz. hareket.css). */
    if (global.Hareket && global.Hareket.animeAcik) svg.classList.add('hk-anime');
    var caption = root.querySelector('#wd-caption');
    var hint = root.querySelector('#wd-hint');
    var checkpoint = root.querySelector('#wd-checkpoint');
    var checkpointTip = root.querySelector('#wd-checkpoint-tip');
    var noport = root.querySelector('#wd-noport');
    var ilerleme = root.querySelector('#wd-ilerleme');
    var status = root.querySelector('#wd-status');
    var btnPrev = root.querySelector('#wd-prev');
    var btnNext = root.querySelector('#wd-next');
    var btnGuide = root.querySelector('#wd-guide');
    var btnDone = root.querySelector('#wd-done');
    var btnXray = root.querySelector('#wd-xray');
    var btnMagnify = root.querySelector('#wd-magnify');
    var magnifyPanel = root.querySelector('#wd-magnify-panel');
    var guideCard = root.querySelector('#wd-guide-card');
    var gNeden = root.querySelector('#wd-guide-neden');
    var gNereye = root.querySelector('#wd-guide-nereye');
    var gKontrolBox = root.querySelector('#wd-guide-kontrol');
    var gKontrol = root.querySelector('#wd-guide-kontrol-metin');
    var notes = root.querySelector('.wd-notes');
    var btnAdim3 = root.querySelector('#wd-adim3-btn');
    var panelAdim3 = root.querySelector('#wd-adim3-panel');

    /* -2 = henuz hic boyanmadi. -1 (bos tezgah) gecerli bir durum oldugu
       icin baslangic degeri -1 olamaz: setStep ayni indekste erken donuyor
       ve acilistaki ilk boyama hic calismiyordu. */
    var current = -2;

    /* Kablo takılı mı? Takılı değilse karta güç gitmiyor, LED yanamaz. */
    var plugged = true;
    /* Kod karta yüklendi mi? Devre tam olsa bile LED bundan önce yanmaz. */
    var codeUploaded = false;
    /* Rehber açık mı, ve devre bir kez baştan sona kuruldu mu.
       devreKuruldu eski playedThrough'nun yerine geçer: LED'in canlı
       görünmesi ve Adım 4'ün kapısı buna bakar. */
    var guideOn = false;
    var devreKuruldu = false;

    /* Şerit yok: ilerleme yalnızca Geri / Taktım / İleri ile. */

    function fx(name) {
      if (global.FX && global.FX.sound) { try { global.FX.sound(name); } catch (e) {} }
    }

    /* Bos tezgah ipucu ("Hadi kuralım'a bas") sadece o dugme gorunurken
       anlamli. Dugme gizliyse (setGuideVisible(false)) ipucu da gizlenir,
       yoksa olmayan bir dugmeyi isaret eder. */
    function updateEmptyHint() {
      /* Rehber varken ipucu hiç çizilmez (paintGuide zaten aynısını
         söylüyor) — ama bu fonksiyon setStep DIŞINDAN da çağrılıyor
         (bkz. setGuideVisible), o yüzden karar burada da tekrar edilmeli;
         yoksa dışarıdaki çağrı paintGuide'ın gizlediğini geri açar. */
      if (guide.length) { hint.hidden = true; hint.innerHTML = ''; return; }
      if (current < 0) {
        var izleGorunur = !btnGuide.hidden;
        hint.hidden = !izleGorunur;
        hint.innerHTML = izleGorunur ? bosIpucu : '';
      } else {
        hint.hidden = false;
        hint.innerHTML = ADIMLAR[current].hint;
      }
    }

    function setStep(index, userDriven) {
      /* -1 = bos tezgah: kart ve breadboard durur, hicbir parca takili
         degildir. Ders acilir acilmaz devrenin kurulmus gorunmesi cocuga
         kuracak bir sey birakmiyordu. */
      index = Math.max(-1, Math.min(ADIMLAR.length - 1, index));
      if (index === current) return;
      var forward = index > current;
      current = index;

      /* Bir adım birden çok parça açabilir (LED sırası: dört LED tek adım); ad dizisi
         ya da tek ad. Takma hareketleri aynı adımın parçalarında 140 ms arayla. */
      ADIMLAR.forEach(function (s, i) {
        [].concat(s.part).forEach(function (pad, sn) {
        var part = svg.querySelector('#wd-part-' + pad);
        if (!part) return;
        var revealed = i <= current;
        /* "is-placing" GEÇİCİ bir durumdur: yerleşme animasyonu. Parça
           sahneden kalkarken kaldırılmazsa wd-place'in fill-mode:both ile
           üstünde bıraktığı son kare (opacity:1) .is-ghost'un opacity:0'ını
           EZER — animasyon bildirimleri normal bildirimlerden önceliklidir.
           Arda'nın gördüğü hata buydu: geri alınca LED ve direnç ekranda
           kalıyordu. Kablolarda opacity animasyonu olmadığı için onlar
           doğru kalkıyordu, yani hata yalnızca .wd-drop parçalarındaydı. */
        if (!revealed) {
          part.classList.remove('is-placing');
          /* Takma hareketi yarıda kalmışsa satır içi opacity/transform
             .is-ghost'u ezmesin — yukarıdaki hatanın anime.js karşılığı. */
          if (global.Hareket) global.Hareket.birak(part);
        }
        part.classList.toggle('is-ghost', !revealed);
        part.classList.toggle('is-active', i === current);
        /* Yeni açılan parça yerleşme animasyonunu baştan oynatsın. */
        if (revealed && i === current && forward) {
          part.classList.remove('is-placing');
          void part.getBoundingClientRect().width;
          part.classList.add('is-placing');
          /* Takma hareketi (hareket.js, anime.js): bacaklar deliklerin
             üstüne gelir, bastırılır, delikte "tık" halkası; kabloda
             ucunda kalem. Kapalıysa no-op ve CSS yerleşmesi oynar. */
          if (global.Hareket) {
            var takHareket = function () {
              var tel = part.querySelector('.wd-wire');
              if (tel) global.Hareket.kalemUcu(tel, 620, TAK_DELIK[pad]);
              else global.Hareket.tak(part, TAK_DELIK[pad]);
            };
            if (sn) setTimeout(takHareket, 140 * sn); else takHareket();
          }
        }
        });

      });

      /* Kart henüz tezgahta değilken (boş tezgah) ona takılı USB kablosu, fişi ve kartın
         dışındaki kılavuz çizgiler de görünmez: havada asılı fiş "kart nerede?" dedirtiyordu.
         Kart adımında kartla birlikte gelirler (wiring-diagram.css .is-kartsiz). */
      svg.classList.toggle('is-kartsiz', ADIMLAR[0] === KART_ADIMI && current < 0);

      /* Tıklanamaz ilerleme yazısı: "3/4 · Direnç". Şerit kaldırıldığı
         için çocuğun "kaçıncı parçadayım" bilgisi burada duruyor. */
      if (ilerleme) {
        if (current >= 0 && current < ADIMLAR.length) {
          ilerleme.textContent = (current + 1) + '/' + ADIMLAR.length + ' · ' + ADIMLAR[current].chip;
        } else if (devreKuruldu) {
          ilerleme.textContent = '';
        } else {
          /* Rehber daha baslamadan da cocuk SIRADAKI parcayi gorsun:
             serit kaldirilinca bu bilgiyi soyleyen baska bir sey kalmadi. */
          ilerleme.textContent = 'Sıradaki: ' + ADIMLAR[0].chip;
        }
      }

      var aktif = (current >= 0) ? ADIMLAR[current] : null;
      HALKALAR.forEach(function (r) {
        var on = !!aktif && aktif.ring === r;
        svg.querySelector('#wd-ring-' + r).classList.toggle('is-on', on);
        /* Kılavuz çizgi halkayla birlikte yanar: halka "pin bu", çizgi
           "delik şu" diyor. İkisi ayrı ayrı anlamsız. */
        var g = svg.querySelector('#wd-guide-' + r);
        if (g) g.classList.toggle('is-on', on);
      });
      SUTUNLAR.forEach(function (c) {
        var on = !!aktif && (Array.isArray(aktif.col) ? aktif.col.indexOf(c) !== -1 : aktif.col === c);
        svg.querySelector('#wd-col-' + c).classList.toggle('is-on', on);
        /* Faz C1: parça sütuna takılınca o şerit bakır rengine döner,
           aynı sütundaki diğer 4 delik hafifçe nabız atar — mesaj: "bu
           dördünden herhangi birine de taksan aynı şey olur" (spec §C1). */
        var strip = svg.querySelector('#wd-strip-' + c);
        if (strip) strip.classList.toggle('is-on', on);
      });
      svg.querySelectorAll(iki ? '.wd-hole' : '.wd-hole[data-col]').forEach(function (h) {
        var anahtar = iki
          ? (h.dataset.col !== undefined ? COL_KEY2_UST[h.dataset.col] : COL_KEY2_ALT[h.dataset.col2])
          : COL_KEY[h.dataset.col];
        var aktifSut = aktif ? [].concat(aktif.col) : [];
        h.classList.toggle('is-pulse', !!anahtar && aktifSut.indexOf(anahtar) !== -1);
      });

      /* Rehber varken aciklama satiri EKRANDA DURMAZ (2026-09-19).
         Ayni cumle rehber kartinin "nereye" satirinda zaten var; iki kez
         yazmak hem gereksiz hem de 50px'lik dusey butce yiyordu - o butce
         yuzunden Geri/Ileri cubugu ekranin altinda kaliyordu. Bos tezgahin
         iki cumlesi de karta tasindi (bkz. paintGuide). Karar SABIT: mod
         degistikce acilip kapanmaz, yani sahne yine hic ziplamaz. */
      if (guide.length) {
        caption.hidden = true;
        caption.innerHTML = '';
      } else {
        caption.innerHTML = (current < 0) ? bosBaslik : (steps[current] || '');
      }
      updateEmptyHint();

      /* Faz B — her adımın sonunda kendi kendini doğrulama: "doğru mu
         yaptım?" Yanında kimse olmayan çocuğun en çok ihtiyacı bu (spec
         §Faz B). En fazla iki satır; bu bir kontrol noktası, ders değil. */
      checkpoint.hidden = current < 0;
      checkpointTip.textContent = current >= 0 ? ADIMLAR[current].checkpoint : '';
      paintGuide();

      /* "İçini gör" yalnızca bir parça takılıyken anlamlı (boş tezgahta
         gösterilecek bir bağlantı yok). */
      btnXray.hidden = current < 0;
      xrayCagriTazele();

      /* Büyüteç yalnızca LED adımında anlamlı — her adımda TEK bir iş
         (spec §0): D5/direnç/GND adımlarında yön sorusu yok. */
      // Kart adımından sonra: 1.2'de LED 2. adım, LED sırasında LED'ler 3. adım (1.4'te kart adımı
      // yok, LED2 ilk adım); modülde LED'in bacağı yok, düz kenar büyüteci de yok.
      var magAdim = modul ? -99 : sira ? 2 : iki ? 0 : 1;
      btnMagnify.hidden = current !== magAdim;
      if (current !== magAdim && !magnifyPanel.hidden) {
        magnifyPanel.hidden = true;
        btnMagnify.classList.remove('is-on');
      }

      var done = current === ADIMLAR.length - 1;
      /* Devrenin tamam olması LED'i YAKMAZ — D5'ten sinyal ancak kod
         yüklenince çıkar (Arda). Üç şart birden: devre tam, kod yüklendi
         (ders Adım 5'e geçince açılır), kablo takılı. */
      tazeleCanli();
      status.classList.toggle('is-on', done);
      btnPrev.disabled = current <= -1;
      btnNext.disabled = done;

      if (userDriven) fx(forward ? 'step' : 'back');
      /* Rehber DIŞINDA son parçaya varmak (şerit çipine tıklamak, ders
         Adım 5'in dışarıdan senkronu) devreyi kurulmuş sayar. Rehber
         açıkken son sözü çocuğun "Taktım"ı söyler, bkz. taktim(). */
      if (current === ADIMLAR.length - 1 && !guideOn) devreKuruldu = true;
      if (onChange) onChange(current);
    }

    /* Rehber kartı: o an takılan parçanın NEDEN / NEREYE / KONTROL metni.
       Eski hint+checkpoint kutusu rehber varken hiç çizilmez — ikisi birden
       açık kalırsa aynı şey iki kez ekranda olur. Yalnızca hint+checkpoint:
       #wd-noport ("porta takılı değil" uyarısı) bundan BAĞIMSIZ, kritik
       bir uyarı — rehber varken de çalışmaya devam etmeli. */
    function paintGuide() {
      if (!guide.length) return;                 // veri yoksa eski kutu çalışır
      hint.hidden = true;
      checkpoint.hidden = true;
      /* Review bulgusu #3: .wd-notes (hint+checkpoint+noport) rehber modunda
         TAMAMEN gizlenir — porta takılı değil uyarısı artık AYRI bir kutuda
         değil, aşağıdaki tazeleCanli() içinde bu kartın kendi kontrol
         alanına yazılıyor. Bkz. wiring-diagram.css .wd-notes üstündeki not. */
      notes.hidden = true;
      /* Kart HER ZAMAN görünür kalır (boş tezgahta da) — yalnızca içeriği
         boşalır. Yalnızca current'a göre gizlenip gösterilseydi kart 0 ile
         108px arasında zıplar, sahne tam da yukarıdaki .wd-guide-card
         notunun uyardığı şeyi yapardı: kurulumun ortasında boyut değiştirmek. */
      guideCard.hidden = false;
      /* Devre bitti: kart artık parça anlatmıyor, sıradaki işi söylüyor.
         Son parçanın "nereye takılır" metni burada yanlış bilgi olurdu —
         çocuk onu çoktan taktı. Bu satır ekranı KAYDIRMAZ: yönü gösterir,
         çocuğu taşımaz (Arda: "animasyon bitince olduğu yerde kalsın"). */
      if (devreKuruldu && current === ADIMLAR.length - 1) {
        gNeden.innerHTML = 'Devre tamam! Akım artık tam tur atabilir.';
        gNereye.innerHTML = bitisMetni;
        gKontrolBox.hidden = false;
        gKontrol.innerHTML = bitisKontrol;
        /* Kart artik bir parcayi anlatmiyor: "Adim 3'te gormustun"
           dugmesi de bir onceki parcanin bilgisiyle ekranda kalmasin. */
        adim3Tazele(null);
        return;
      }
      var g = (current >= 0) ? guide[current] : null;
      /* Bos tezgah: kart eskiden BOMBOS duruyordu, cunku ne yapilacagini
         .wd-caption ile Adim 4'un giris paragrafi soyluyordu. Ikisi de
         kalkti (dusey butce), o yuzden o iki cumle artik burada. */
      if (!g) {
        gNeden.innerHTML = bosBaslik;
        /* Adim 4'un kalkan giris paragrafindaki "kod asagida cikacak"
           bilgisi burada yasiyor. Kontrol satirina YAZILMAZ: oradaki "✓"
           bir kendini-dogrulama isareti, bu ise bir bilgi (bkz. review
           bulgusu #2 ve onu koruyan test). */
        gNereye.innerHTML = bosIpucu + bosNot;
        gKontrolBox.hidden = true;
        gKontrol.innerHTML = '';
        /* Geri gidip bos tezgaha donunce eski parcanin Adim 3 dugmesi
           ekranda kalmasin. */
        adim3Tazele(null);
        return;
      }
      gNeden.innerHTML = g ? (g.neden || '') : '';
      gNereye.innerHTML = g ? (g.nereye || '') : '';
      /* Review bulgusu #2: "✓" glifi markup'ta SABİT — yalnızca metin
         span'ini boşaltmak boş tezgahta anlamsız bir onay işareti bırakır.
         Kontrol PARAGRAFININ TAMAMI (✓ dahil) g yokken gizlenir; kartın
         kendi min-height'ı korunduğu için sahne yine de kıpırdamaz. */
      gKontrolBox.hidden = !g;
      gKontrol.innerHTML = g ? (g.kontrol || '') : '';
      adim3Tazele(g);
      if (g) yeniNotUyar();
    }

    /* Parca degisince kartin METNI degisiyordu ama ekranda hicbir sey
       kipirdamiyordu: cocuk "Taktim"a basiyor, gozu sahnede, kartin yeni
       bir talimat verdigini fark etmiyor. Arda: "bu 4 bilgi notunu
       vurgulat, kesinlikle adim adim okumasi lazim."
       Uc kez vurup susuyor, sonsuz degil (Kurallar.md: dikkat degisim
       anina saklanir, surekli yanip sonen kutu okumayi zorlastirir).
       Sinif her seferinde SIFIRLANIYOR: ayni sinif tekrar eklenirse
       tarayici animasyonu yeniden baslatmaz, void offsetWidth bunu
       zorlar. */
    function yeniNotUyar() {
      if (!guideCard || guideCard.hidden) return;
      guideCard.classList.remove('is-yeni-not');
      void guideCard.offsetWidth;
      guideCard.classList.add('is-yeni-not');
    }

    /* Bos tezgahta ve rehber verisi olmayan derste kart da dugme de
       calismaz; ikisi de sessizce gizlenir. */
    function adim3Kapat() {
      panelAdim3.hidden = true;
      btnAdim3.classList.remove('is-on');
      btnAdim3.setAttribute('aria-expanded', 'false');
    }

    function adim3Tazele(g) {
      var idler = (g && g.adim3) || [];
      var html = '';
      if (parcaBilgi) {
        for (var i = 0; i < idler.length; i++) {
          var bilgi = parcaBilgi(idler[i]);
          if (!bilgi || !bilgi.lines || !bilgi.lines.length) continue;
          html += '<p class="wd-adim3-ad">' + bilgi.name + '</p><ul class="wd-adim3-liste">';
          for (var j = 0; j < bilgi.lines.length; j++) html += '<li>' + bilgi.lines[j] + '</li>';
          html += '</ul>';
        }
      }
      panelAdim3.innerHTML = html;
      btnAdim3.hidden = !html;
      /* Parca degisti: eski parcanin katmani acik kalmasin, cocuk yanlis
         parcanin bilgisini okur. */
      adim3Kapat();
    }

    /* "Icini gor" cagrisi: sorunun cevabi tahtanin ICINDE oldugu
       adimlarda (veride xray:true) dugme nabiz atar. Cocuk bir kez
       actiysa bir daha cagirmaz - bilgiyi gordu, dirsek durtmek kalir. */
    var xrayAcildi = false;
    var xrayCagriZaman = null;
    function xrayCagriTazele() {
      var g = (current >= 0) ? guide[current] : null;
      var cagir = !!(g && g.xray) && !xrayAcildi && !btnXray.hidden && !devreKuruldu;
      btnXray.classList.toggle('is-calling', cagir);
      /* Nabiz SONSUZ atmaz: adima girerken uc kez vurup susar. Surekli
         yanip sonen bir dugme, cocuk parcayi takmaya calisirken ekranin
         en gurultulu seyi olur (bkz. Kurallar.md - "her seye basinca
         bigid bigid" notuyla ayni sebep). */
      if (xrayCagriZaman) { clearTimeout(xrayCagriZaman); xrayCagriZaman = null; }
      if (cagir) {
        xrayCagriZaman = setTimeout(function () {
          btnXray.classList.remove('is-calling');
        }, 5200);
      }
    }

    function tazeleCanli() {
      var done = current === ADIMLAR.length - 1;
      /* Ders 1.4: ikinci LED ancak YENİ kod yüklenince yanar (kartta
         1.3'ün kodu duruyorken D6'ya sinyal gitmez). Birinci zincir hep
         kurulu: kablo takılıysa kartta hangi kod olursa olsun D5 çalışır. */
      var canli = done && plugged && ((iki || sira) ? codeUploaded : (codeUploaded || devreKuruldu));
      if (iki) svg.classList.toggle('is-live1', plugged);
      if (sira) desenCal(canli);
      var oncedenCanli = svg.classList.contains('is-live');
      svg.classList.toggle('is-live', canli);
      /* Devrenin kapandığı AN: akımın ilk turu tek seferlik iz (hareket.js). */
      if (canli && !oncedenCanli && global.Hareket) global.Hareket.akimIzi(svg);
      /* Kurulum bitti ama kart porta takılı değilse LED yanmaz — ve çocuk
         NEDEN yanmadığını bilmeli. Sessiz kalmak, kurulumu yanlış yaptığını
         sandırır. */
      var uyar = done && !plugged;
      noport.hidden = !uyar;
      if (uyar && global.UsbLink) noport.innerHTML = UsbLink.noPowerMessage();
      /* Review bulgusu #3: rehber modunda #wd-noport'un kendi kutusu
         (.wd-notes) kalıcı gizli (bkz. paintGuide) — o kutuyu uyarı çıkınca
         açıp kapatmak sahnenin zıplamasına yol açıyordu, SABİT açık tutmak
         da >=440px sahne-boyu bütçesini aşıyordu. Üçüncü çözüm: uyarı, zaten
         sabit boyutlu rehber kartının KENDİ kontrol alanına yazılıyor —
         yeni kutu yok, yeni gap yok, sahne hiç etkilenmiyor. Uyarı kapanınca
         paintGuide() o an aktif parçanın normal kontrol metnini geri yazar. */
      if (guide.length && global.UsbLink) {
        if (uyar) {
          gKontrolBox.hidden = false;
          gKontrol.innerHTML = UsbLink.noPowerMessage();
        } else {
          paintGuide();
        }
      }
    }

    /* LED sırası: kodun loop()'u (desen) zamanla oynatılır, o an yanan LED'lere .is-yanik.
       3B sahne ışımayı .wd-led-glow saydamlığından okuyor, kendiliğinden eşleşir. */
    var desenZaman = null, desenAdim = 0;
    function desenYak(adim) {
      var yanik = (desen[adim] && desen[adim].yanik) || [];
      sira.forEach(function (l, k) {
        var e = svg.querySelector('#wd-part-led-' + (k + 1));
        if (e) e.classList.toggle('is-yanik', yanik.indexOf(k) !== -1);
      });
      // Ders 3.1: buton desenle basılır/bırakılır (3B sahne kapağı bu sınıftan okur).
      var bt = svg.querySelector('#wd-part-buton');
      if (bt) bt.classList.toggle('is-basili', !!(desen[adim] && desen[adim].basili));
    }
    function desenCal(acik) {
      if (!acik) {
        if (desenZaman) { clearTimeout(desenZaman); desenZaman = null; }
        desenYak(-1);
        return;
      }
      if (desenZaman || !desen.length) return;
      var sonraki = function () {
        desenYak(desenAdim);
        var ms = desen[desenAdim].ms;
        desenAdim = (desenAdim + 1) % desen.length;
        desenZaman = setTimeout(sonraki, ms);
      };
      desenAdim = 0;
      sonraki();
    }

    function celebrate() {
      if (!global.FX) return;
      var bulb = svg.querySelector(sira ? '#wd-part-led-1 .wd-led-bulb' : iki ? '#wd-part-led2 .wd-led-bulb' : '.wd-led-bulb');
      try {
        FX.sound('unlock');
        FX.burst(bulb, { count: 18, power: 150, color: '#FF6A5E' });
        FX.float(bulb, 'Devre çalışıyor!', 'good');
      } catch (e) {}
    }

    /* Rehberli kurulum. Eskiden burada setInterval(2200) vardı: parçalar
       kendiliğinden yerine oturuyordu, çocuk sadece izliyordu ve animasyon
       bitince kendi tezgahı hâlâ boştu (iki gerçek testte tam olarak bu oldu).
       Artık her parçada duruyor ve çocuk "Taktım" diyene kadar beklenir. */
    function startGuide() {
      guideOn = true;
      btnGuide.hidden = true;
      btnDone.hidden = false;
      /* Geri/İleri rehber boyunca gizli: tek yol, tek buton. Açık kalsalar
         "İleri" son parçayı onaylamadan geçmenin ikinci bir yolu olurdu. */
      btnPrev.hidden = true;
      btnNext.hidden = true;
      if (current === ADIMLAR.length - 1) setStep(-1, false);
      setStep(0, true);
      updateEmptyHint();
    }

    /* "Taktım": çocuk bu parçayı gerçekten taktığını söyledi. Site tezgahı
       göremez; tek kaynak çocuğun beyanıdır (aynı desen kablo kutusunda ve
       "LED yandı mı?" sorusunda da var). */
    function taktim() {
      if (current < ADIMLAR.length - 1) {
        setStep(current + 1, true);
        return;
      }
      devreKuruldu = true;
      guideOn = false;
      btnDone.hidden = true;
      btnPrev.hidden = false;
      btnNext.hidden = false;
      tazeleCanli();
      paintGuide();
      celebrate();
      if (onChange) onChange(current);
    }

    function stopGuide() {
      guideOn = false;
      btnDone.hidden = true;
      btnPrev.hidden = false;
      btnNext.hidden = false;
      btnGuide.hidden = devreKuruldu;
    }

    /* Ders 1.2'de "Hadi kuralım" yalnızca Adım 4'te (Bağlantı Adımları)
       anlamlı — diğer adımlarda kurulacak bir devre ekranda yok. */
    function setGuideVisible(visible) {
      if (!visible) stopGuide();
      btnGuide.hidden = !visible || guideOn;
      updateEmptyHint();
    }

    btnPrev.addEventListener('click', function () { setStep(current - 1, true); });
    btnNext.addEventListener('click', function () { setStep(current + 1, true); });
    btnGuide.addEventListener('click', startGuide);
    btnDone.addEventListener('click', taktim);

    /* Faz C1 — "İçini gör": plastik yarı saydamlaşır, sütunların altındaki
       metal şeritler ortaya çıkar (spec §C1). Çocuğun GÖREMEDİĞİ ama bilmek
       zorunda olduğu tek kural: aynı sütunun 5 deliği metalle bağlı. */
    btnAdim3.addEventListener('click', function () {
      var acilacak = panelAdim3.hidden;
      panelAdim3.hidden = !acilacak;
      btnAdim3.classList.toggle('is-on', acilacak);
      btnAdim3.setAttribute('aria-expanded', acilacak ? 'true' : 'false');
    });

    var xrayOn = false;
    btnXray.addEventListener('click', function () {
      xrayOn = !xrayOn;
      svg.classList.toggle('is-xray', xrayOn);
      btnXray.classList.toggle('is-on', xrayOn);
      btnXray.textContent = xrayOn ? 'Plastiği kapat' : 'İçini gör';
      if (xrayOn) { xrayAcildi = true; xrayCagriTazele(); }
      fx('tap');
    });

    btnMagnify.addEventListener('click', function () {
      var on = magnifyPanel.hidden;
      magnifyPanel.hidden = !on;
      btnMagnify.classList.toggle('is-on', on);
      fx('tap');
    });

    root.addEventListener('keydown', function (e) {
      /* Rehber açıkken de klavye oklarını bloke etmiyoruz — ama önce
         stopGuide() ile rehberden çıkıyoruz, yoksa "Taktım" basmadan ok
         tuşuyla ilerlemek, tek yol tek buton kuralını klavyeden delerdi. */
      if (e.key === 'ArrowRight') { stopGuide(); setStep(current + 1, true); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { stopGuide(); setStep(current - 1, true); e.preventDefault(); }
    });

    /* Acilista bos tezgah: cocuk "Hadi kuralım"a basinca kurulur. */
    setStep(-1, false);

    return {
      element: root,
      setStep: function (i) { stopGuide(); setStep(i, false); },
      next: function () { stopGuide(); setStep(current + 1, true); },
      step: function () { return current; },
      stepCount: function () { return ADIMLAR.length; },
      isBuilt: function () { return devreKuruldu; },
      setGuideVisible: setGuideVisible,
      /* Kablo takılı değilse sahne de öyle görünsün: fiş soketin üstünde,
         veri akışı yok, LED yanmaz. Ders 1.1'deki sol panel sahnesiyle aynı dil. */
      setPlugged: function (v) {
        plugged = !!v;
        svg.classList.toggle('is-unplugged', !plugged);
        tazeleCanli();
      },
      setCodeUploaded: function (v) {
        codeUploaded = !!v;
        tazeleCanli();
      },
      destroy: function () { stopGuide(); if (sira) desenCal(false); container.innerHTML = ''; }
    };
  }

  /* TAK_DELIK: 3B sahne (sahne3b.js) parçaların bacaklarını aynı deliklere indirir. */
  global.WiringDiagram = { mount: mount, STEP_COUNT: STEPS.length, ERROR_ITEMS: ERROR_ITEMS, TAK_DELIK: TAK_DELIK };
})(window);
