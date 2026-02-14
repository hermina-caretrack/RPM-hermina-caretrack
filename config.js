/*************************************************
 * HERMINA CARETRACK – CONFIG
 * RS MODE FINAL
 * Hanya untuk konfigurasi global
 *************************************************/

window.CARETRACK_CONFIG = {
  /* ===============================
     API BACKEND (Google Apps Script)
  =============================== */
API_URL: "https://script.google.com/macros/s/AKfycbyEEYufRVPWvlBDKe9fyrz7myomy3QGYn7spgxXuAq5zZXFqnhXPwqWf7KsGTyxpsXk/exec",
  /* ===============================
     IDENTITAS APLIKASI
  =============================== */
  APP_NAME: "Hermina CareTrack",
  APP_VERSION: "v1.4.2",
  MODE: "RS_PRODUCTION",

  /* ===============================
     DAFTAR DOKTER (UNTUK DROPDOWN)
     → Nama harus konsisten & resmi
  =============================== */
  DOKTER_LIST: [
    "dr. Tuti SpPD-KHOM",
    
  ],

  /* ===============================
     TEMPLATE WA KE PASIEN
     (Bahasa RS, aman & formal)
  =============================== */
  WA_TEMPLATE_HEADER: 
`Yth. Bapak/Ibu {{NAMA_PASIEN}},

Kami dari RS Hermina menyampaikan tindak lanjut
berdasarkan pemantauan kondisi Bapak/Ibu
melalui Hermina CareTrack.`,

  WA_TEMPLATE_FOOTER:
`Apabila keluhan memberat, demam tinggi,
atau kondisi memburuk, mohon segera
datang ke IGD RS terdekat.

Pesan ini disampaikan oleh tim pelayanan RS Hermina.`,

  /* ===============================
     VALIDASI FORM
  =============================== */
  REQUIRE_DIAGNOSA: true,
  REQUIRE_REGIMEN: true
};
