# Videos Klasörü

Ders 1.1 — Adım 4 (Kurulum & IDE Altyapısı) ekran kaydı videoları.

## Mevcut dosyalar

| Dosya | İçerik |
| --- | --- |
| `adım1.mp4` | Arduino IDE'yi indirip kurma |
| `adım2.mp4` | Kart Yöneticisi URL'sini Tercihler'e ekleme, dili Türkçe yapma |
| `adım3.mp4` | "deneyap" paketini kurup Deneyap Mini v2'yi kart olarak seçme |
| `adım4.mp4` | Kodu karta yapıştırıp yükleme |

Sıra ve başlıklar `assets/js/video-player.js` içindeki `STEPS` dizisiyle birebir
eşleşmeli — dosya adı değiştirilirse orası da güncellenmeli.

Poster (kapak) görselleri `videos/posters/` altında, aynı adla `.jpg` olarak durur.

## Format

- Kapsayıcı: **MP4** (H.264)
- Çözünürlük: 1280×720 veya 1920×1080
- **Ses kanalı yok** — anlatım, videonun içine gömülü altyazı ve kırmızı oklarla
  yapılıyor. Oynatıcıdaki `muted` bu yüzden bilinçli, ses kontrolü de yok.
- Ok ve altyazı overlay'leri piksele gömülü (ffmpeg ile), HTML/CSS katmanı değil.

## Videolar neden repoda?

Site canlı bir URL'den yayına alınacak ve dağıtım doğrudan bu repodan yapılıyor.
Videolar repoda olmazsa Adım 4'te oynatıcı placeholder'a düşer, `ended` olayı hiç
tetiklenmez ve **adım kilidi hiç açılmaz** — ders o noktada tıkanır. Toplam boyut
6 MB olduğu için repoda tutmanın maliyeti yok.

## Eksik video davranışı

Oynatıcı `videos/` klasörünü `fetch HEAD` ile tarayıp eksikleri placeholder
kartında listeler. `file://` ile açıldığında bu tarama yapılamadığı için
(CORS) yoklama atlanır ve videolar hazır kabul edilir.
