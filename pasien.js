/*************************************************
 * HERMINA CARETRACK – PASIEN.JS
 * Remote Patient Monitoring Pasca Kemoterapi
 * CTCAE v5.0 (NCI)
 * Versi: v1.1 RS READY (DEMAM REVISI)
 *************************************************/

console.log("pasien.js loaded");

/* ===============================
   KONFIGURASI
================================ */
if (typeof CARETRACK_CONFIG === "undefined") {
  alert("Konfigurasi sistem tidak ditemukan.");
  throw new Error("CARETRACK_CONFIG missing");
}

const API = CARETRACK_CONFIG.API_URL;

/* ===============================
   HELPER
================================ */
function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function getNumber(id) {
  const el = document.getElementById(id);
  if (!el || el.value === "") return null;
  return Number(el.value);
}
/* ===============================
   VALIDATION
================================ */
function isValidMRN(mrn) {
  // hanya angka, min 4 digit
  return /^[0-9]{4,}$/.test(mrn);
}

function isValidPhone(phone) {
  // format Indonesia 08xxx atau 62xxx
  return /^(08|628)[0-9]{8,12}$/.test(phone.replace(/\s/g, ""));
}

/* ===============================
   HITUNG GRADE DEMAM (REVISI)
================================
   Prioritas:
   1. Suhu ≥ 38°C  → grade 3
   2. Gejala demam tinggi / menggigil → grade 3
   3. Terasa hangat → grade 2
   4. Tidak demam → grade 1
================================ */
function hitungGradeDemam() {
  const gejala = getNumber("demam_gejala");
  const suhu = getNumber("demam_suhu");

  if (suhu !== null && suhu >= 38) return 3;
  if (gejala === 3) return 3;
  if (gejala === 2) return 2;
  if (gejala === 1) return 1;

  return null; // belum diisi
}

/* ===============================
   AMBIL GRADE UMUM
================================ */
function ambilGrade(id) {
  const val = getNumber(id);
  return val !== null ? val : null;
}

/* ===============================
   EVALUASI CTCAE REAL-TIME
================================ */
function evaluasiCTCAE() {
  const grades = [
    ambilGrade("mual_ctcae"),
    ambilGrade("muntah_ctcae"),
    hitungGradeDemam(),
    ambilGrade("diare"),
    ambilGrade("lelah_ctcae"),
    ambilGrade("infus")
  ].filter(v => v !== null);

  if (grades.length === 0) {
    document.getElementById("status").innerText = "-";
    document.getElementById("aksi").innerText = "";
    return;
  }

  const maxGrade = Math.max(...grades);

  let statusText = "";
  let aksi = "";
  let warna = "";

  if (maxGrade >= 3) {
    statusText = "PERLU SEGERA MENGHUBUNGI RS";
    aksi = "Mohon segera menghubungi atau datang ke Rumah Sakit.";
    warna = "#D32F2F";
  } else if (maxGrade === 2) {
    statusText = "PERLU PEMANTAUAN KETAT";
    aksi = "Kondisi perlu dipantau dengan ketat oleh tim kesehatan.";
    warna = "#F9A825";
  } else {
    statusText = "KONDISI RELATIF AMAN";
    aksi = "Tetap lanjutkan pemantauan mandiri di rumah.";
    warna = "#2E7D32";
  }

  const statusEl = document.getElementById("status");
  statusEl.innerText = statusText;
  statusEl.style.background = warna;
  statusEl.style.color = "#fff";
  statusEl.style.padding = "8px";
  statusEl.style.borderRadius = "6px";

  document.getElementById("aksi").innerText = aksi;
}

/* ===============================
   EVENT LISTENER
================================ */
[
  "mual_ctcae",
  "muntah_ctcae",
  "demam_gejala",
  "demam_suhu",
  "diare",
  "lelah_ctcae",
  "infus"
].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("change", evaluasiCTCAE);
});

/* ===============================
   SUBMIT DATA (DENGAN ANTI-DOUBLE SUBMIT)
================================ */
let isSubmitting = false;

window.kirimData = function () {

  // 🔒 PREVENT DOUBLE SUBMIT
  if (isSubmitting) {
    alert("Data sedang dikirim, mohon tunggu...");
    return;
  }

  // VALIDASI IDENTITAS
  const nama = getValue("nama");
  const mrn  = getValue("mrn");
  const telp = getValue("telp");
  const hari = getValue("hari");

  if (!nama || !mrn || !telp || !hari) {
    alert("Mohon lengkapi identitas pasien sebelum mengirim laporan.");
    return;
  }
if (!isValidMRN(mrn)) {
  alert("Format MRN tidak valid (minimal 4 digit angka).");
  return;
}

if (!isValidPhone(telp)) {
  alert("Format nomor WhatsApp tidak valid.");
  return;
}

  // VALIDASI CTCAE (DEMAM GEJALA WAJIB)
  if (getNumber("demam_gejala") === null) {
  alert("Mohon lengkapi seluruh penilaian keluhan sebelum mengirim laporan.");
  return;
}

  const grades = [
    ambilGrade("mual_ctcae"),
    ambilGrade("muntah_ctcae"),
    hitungGradeDemam(),
    ambilGrade("diare"),
    ambilGrade("lelah_ctcae"),
    ambilGrade("infus")
  ].filter(v => v !== null);

  if (grades.length < 6) {
    alert("Mohon lengkapi seluruh penilaian kondisi sebelum mengirim laporan.");
    return;
  }

  const maxGrade = Math.max(...grades);

  /* ===== DISABLE BUTTON & SET FLAG ===== */
  isSubmitting = true;
  const btn = document.querySelector('button[onclick="kirimData()"]');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "⏳ Mengirim data...";
  btn.style.opacity = "0.6";
  btn.style.cursor = "not-allowed";

  /* ===== KIRIM DATA ===== */
  const formData = new FormData();
  formData.append("nama", nama);
  formData.append("mrn", mrn);
  formData.append("telp", telp);
  formData.append("hari", hari);

  formData.append("mual", getValue("mual_ctcae"));
  formData.append("muntah", getValue("muntah_ctcae"));
  formData.append("demam_gejala", getValue("demam_gejala"));
  formData.append("demam_suhu", getValue("demam_suhu"));
  formData.append("diare", getValue("diare"));
  formData.append("kelelahan", getValue("lelah_ctcae"));
  formData.append("infus", getValue("infus"));
  formData.append("maxGrade", maxGrade);

// tambahkan apiKey ke formData
fetch(API, {
  method: "POST",
  body: formData
})
.then(res => {
  if (!res.ok) throw new Error("Server tidak merespon");
  return res.json();
})
.then(data => {

  if (data.status !== "OK") {
    throw new Error(data.message || "Gagal mengirim laporan");
  }

  tampilkanModalPesan();
  
  // ✅ RESET BUTTON SETELAH 3 DETIK (COOLDOWN)
  setTimeout(() => {
    isSubmitting = false;
    btn.disabled = false;
    btn.textContent = originalText;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
  }, 3000);
})
.catch(err => {
  console.error(err);
  alert("Laporan gagal dikirim. Periksa koneksi internet lalu coba kembali.");
  
  // RESTORE BUTTON ON ERROR
  isSubmitting = false;
  btn.disabled = false;
  btn.textContent = originalText;
  btn.style.opacity = "1";
  btn.style.cursor = "pointer";
});

};

/* ===============================
   MODAL
================================ */
function tampilkanModalPesan() {
  const pesan =
    "Laporan Anda telah kami terima.\n\n" +
    "Data kondisi Anda sedang diproses oleh tim Rumah Sakit.\n" +
    "Petugas kesehatan akan menindaklanjuti sesuai kondisi yang dilaporkan.\n\n" +
    "Apabila keluhan bertambah berat, segera datang ke IGD RS terdekat.\n\n" +
    "Terima kasih telah menggunakan Hermina CareTrack.";

  document.getElementById("modalMessage").innerText = pesan;
  document.getElementById("modalOverlay").style.display = "flex";
}

window.tutupModal = function () {
  document.getElementById("modalOverlay").style.display = "none";
};
