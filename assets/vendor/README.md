# Üçüncü taraf kütüphaneler

Yerel kopya: site `file://` ile de açılıyor ve build adımı yok, bu yüzden CDN yerine
buradan yükleniyor. Sürüm yükseltirken dosyayı değiştir, `tests/test-hareket.mjs`'i koş.

| Dosya | Kütüphane | Sürüm | Lisans | Global | Kaynak |
| --- | --- | --- | --- | --- | --- |
| `motion.min.js` | Motion | 13.4.4 | MIT | `Motion` | `cdn.jsdelivr.net/npm/motion@13.4.4/dist/motion.js` |
| `anime.umd.min.js` | anime.js | 4.5.0 | MIT | `anime` | `cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.umd.min.js` |
| `three.min.js` | three.js | r149 (0.149.0) | MIT | `THREE` | `cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js` |
| `supabase.min.js` | supabase-js | 2.58.0 | MIT | `supabase` | `cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/dist/umd/supabase.min.js` |

**three.js neden r149:** sonraki sürümler yalnızca ES modülü olarak geliyor; Chrome
`file://` altında modül yüklemeyi engelliyor. r149 son UMD (klasik `<script>`) derlemesi.
Yalnızca portalda, hero görünüme girince ve hareket açıkken tembel yüklenir.

Kullanım: doğrudan değil, `assets/js/hareket.js` (`window.Hareket`) üzerinden.

**supabase-js neden yerel (2026-10-16):** CDN'den senkron yükleniyordu; okul ağında jsdelivr yavaşken bütün ders betikleri onu bekliyor, "İleri" düğmesi görünür ama ölü kalıyordu. Sürüm, Edge Function'lardaki `esm.sh/@supabase/supabase-js@2.58.0` ile aynı tutulur.
