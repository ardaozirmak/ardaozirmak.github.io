/* ============================================================
   cloud.js — Supabase köprüsü (window.Cloud)
   ============================================================
   Yapılandırma (cloud-config.js) veya Supabase kitaplığı yoksa
   modül sessizce devre dışı kalır: site hesapsız çalışmaya devam
   eder. Bu yüzden buradaki her yol "bulut yok" durumunu normal
   kabul eder, hata durumu saymaz.
   ============================================================ */

(function () {
  'use strict';

  /* ?cloud=off: bulutu kapatan kaçış kapısı. Testin "hesapsız mod"u
     doğrulayabilmesi için var, ama atölyede ağ sorunu çıktığında da
     siteyi bilinçli olarak hesapsız moda düşürmenin yolu budur.

     YALNIZCA file:// altında dinlenir. Hesap zorunlu olduğundan
     (LearnerUI.requireAccount) bu parametre yayındaki sitede kilidin
     etrafından dolanmanın yolu olurdu: adres çubuğuna yazan çocuk
     hesapsız girerdi. file:// hem testlerin hem atölyedeki çevrimdışı
     kullanımın ortamı; oradaki gevşeklik bilinçli. */
  var yerelDosya = window.location.protocol === 'file:';
  var forcedOff = yerelDosya && (window.location.search || '').indexOf('cloud=off') !== -1;

  var cfg = forcedOff ? null : (window.CLOUD_CONFIG || null);
  var lib = window.supabase || null;
  var client = null;

  if (cfg && cfg.url && cfg.anonKey && lib && typeof lib.createClient === 'function') {
    try { client = lib.createClient(cfg.url, cfg.anonKey); } catch (e) { client = null; }
  }

  function enabled() { return client !== null; }

  /* Edge Function çağrısı. Devre dışıyken reddedilen bir söz döner —
     çağıranlar tek bir catch ile hesapsız moda düşebilsin. */
  function call(name, payload) {
    if (!enabled()) return Promise.reject(new Error('bulut-kapali'));
    return client.functions.invoke(name, { body: payload || {} }).then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  }

  window.Cloud = { enabled: enabled, call: call, client: function () { return client; } };
})();
