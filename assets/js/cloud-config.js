/* Supabase bağlantı bilgileri. Bu dosya .gitignore'da — repoya girmez.
   Şablonu: cloud-config.example.js

   Proje: odozoqsqnapiyweugfth (bölge: eu-central-1 / Frankfurt)

   anonKey tarayıcıya inen açık anahtardır; veriyi koruyan şey bu anahtarın
   gizliliği değil, veritabanındaki satır bazlı güvenlik kurallarıdır (RLS).
   service_role anahtarı ASLA buraya yazılmaz, o yalnızca Edge Function
   tarafında ortam değişkeni olarak durur. */
window.CLOUD_CONFIG = {
  url: 'https://odozoqsqnapiyweugfth.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kb3pvcXNxbmFwaXl3ZXVnZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDY5NDAsImV4cCI6MjEwNDcyMjk0MH0.I8ArS6tAo420uBvbgsRMKuWej1XcinYCZhzenRTwMKg'
};
