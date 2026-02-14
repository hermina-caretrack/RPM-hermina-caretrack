/*************************************************
 * HERMINA CARETRACK – PERAWAT.JS
 * SBAR Dua Arah + Panel Full Width
 * Buka Satu SBAR Saja + Auto Open WA
 * Versi: v1.4.3 FINAL RS
 *************************************************/

console.log("perawat.js loaded");

const API = CARETRACK_CONFIG.API_URL;
let currentTab = "aktif";
let currentPage = 1;
const PAGE_SIZE = 20;
/* ===============================
   HELPER
================================ */
function safe(v, f = "Tidak ada data") {
  return (v !== undefined && v !== null && v !== "") ? v : f;
}

function formatWA(no) {
  let n = (no || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.substring(1);
  if (n && !n.startsWith("62")) n = "62" + n;
  return n;
}


function interpretDemam(p) {
  const g = Number(p.demam_gejala || 0);
  const s = Number(p.demam_suhu || 0);
  if (s && s >= 38) return `Demam ≥ 38°C (${s}°C)`;
  if (g === 3) return "Demam tinggi / menggigil";
  if (g === 2) return "Badan terasa hangat";
  if (g === 1) return "Tidak demam";
  return "Tidak ada data";
}

function statusBadge(p) {
  if (p.sbar_status === "ADVICE_TERISI") {
    return `<span style="color:#2E7D32;font-weight:700">🟢 Advice Dokter Tersedia</span>`;
  }
  return `<span style="color:#F9A825;font-weight:700">🟡 Menunggu Advice Dokter</span>`;
}

function badgeCTCAE(grade) {
  grade = Number(grade || 0);

  if (grade >= 3) {
    return `<span class="ctcae ctcae-red">🔴 CTCAE ${grade}</span>`;
  }
  if (grade === 2) {
    return `<span class="ctcae ctcae-yellow">🟡 CTCAE 2</span>`;
  }
  return `<span class="ctcae ctcae-green">🟢 CTCAE 1</span>`;
}

function setTab(tab) {
  currentTab = tab;

  document.getElementById("tabAktif").classList.remove("active");
  document.getElementById("tabRiwayat").classList.remove("active");

  if (tab === "aktif") {
    document.getElementById("tabAktif").classList.add("active");
  } else {
    document.getElementById("tabRiwayat").classList.add("active");
  }

  loadDashboard();
}

/* ===============================
   LOAD DASHBOARD
================================ */
function loadDashboard() {
 fetch(`${API}?action=getSBAR`)
.then(r => {
  if (!r.ok) throw new Error("Server error");
  return r.json();
})
.then(rows => {

      const tbody = document.getElementById("data");
      tbody.innerHTML = "";

let data = [...rows].reverse(); // terbaru di atas

// 🔴 TAB AKTIF → hanya yang BELUM ada advice + belum archive
if (currentTab === "aktif") {
  data = data.filter(p =>
    Number(p.maxGrade) >= 3 &&
    p.sbar_status !== "ADVICE_TERISI" &&
    p.sbar_status !== "ARCHIVE"
  );
}

// 🟢 TAB RIWAYAT → hanya yang sudah ada advice
if (currentTab === "riwayat") {
  data = data
    .filter(p => p.sbar_status === "ADVICE_TERISI")
    .slice(0, 20); // limit 20 terbaru
}


data.forEach((p, index) => {

  const rowId = `sbar_${index}`;

  tbody.innerHTML += `
<tr>
  <td>${new Date(p.waktu).toLocaleString()}</td>
  <td>${safe(p.nama)}</td>
  <td>${safe(p.mrn)}</td>
  <td>${safe(p.hari)}</td>
  <td>
    ${badgeCTCAE(p.maxGrade)}<br>
    ${statusBadge(p)}
  </td>
  <td>
    <button onclick="toggleSBAR('${rowId}')">
      📄 Lihat SBAR
    </button>
  </td>
</tr>
<tr id="${rowId}" class="sbar-row" style="display:none">
  <td colspan="6">
    <div class="sbar-panel">

      <div class="sbar-header">📄 SBAR Klinis</div>

      <label>Diagnosa</label>
      <input type="text"
        id="diag_${index}"
        value="${safe(p.diagnosa, "")}"
        placeholder="Contoh: Karsinoma payudara stadium III"
      >

      <label style="margin-top:8px">Regimen Kemoterapi</label>
      <input type="text"
        id="reg_${index}"
        value="${safe(p.regimen, "")}"
        placeholder="Contoh: AC-T / FEC / Cisplatin-based"
      >

      <textarea class="sbar-textarea">
S (Situation):
Pasien ${safe(p.nama)}, No. Rekam Medis ${safe(p.mrn)}

Hari ke-${safe(p.hari)} pasca kemoterapi.

B (Background):
- Mual        : ${safe(p.mual)}
- Muntah      : ${safe(p.muntah)}
- Demam       : ${interpretDemam(p)}
- Diare       : ${safe(p.diare)}
- Kelelahan   : ${safe(p.kelelahan)}
- Lokasi infus: ${safe(p.infus)}

A (Assessment):
Efek samping kemoterapi sesuai CTCAE Grade ${safe(p.maxGrade)}

R (Recommendation):
${p.sbar_advice ? p.sbar_advice : "(Menunggu advice dokter)"}
      </textarea>

      <div class="sbar-actions">
        <button onclick="toggleSBAR('${rowId}')">
          ✖ Tutup SBAR
        </button>

        ${
          p.sbar_status !== "ADVICE_TERISI"
            ? `<button onclick="kirimKeDokter('${p.mrn}','${p.waktu}',${index})">
                 📤 Kirim SBAR ke Dokter
               </button>`
            : `<button onclick='autoOpenWA(${JSON.stringify(p)})'>
                 📲 Kirim Advice ke Pasien (WA)
               </button>`
        }
        <button onclick="arsipSBAR('${p.mrn}', '${p.waktu}')">
🗑 Arsipkan
</button>
</div>
</td>
</tr>
`;
      });
    });
}
/* ===============================
   SBAR TOGGLE (BUKA SATU SAJA)
================================ */
function toggleSBAR(id) {

  document.querySelectorAll(".sbar-row").forEach(row => {
    if (row.id !== id) {
      row.style.display = "none";
    }
  });

  const row = document.getElementById(id);
  if (!row) return;

  row.style.display =
    (row.style.display === "none" || row.style.display === "")
      ? "table-row"
      : "none";
}

/* ===============================
   ACTION
================================ */
function kirimKeDokter(mrn, waktu, index) {

  const formData = new FormData();
  formData.append("action", "kirimSBAR");
  formData.append("mrn", mrn);
  formData.append("waktu", waktu);
  formData.append("diagnosa", document.getElementById("diag_" + index).value);
  formData.append("regimen", document.getElementById("reg_" + index).value);
  formData.append("apiKey", CARETRACK_CONFIG.API_KEY);

  fetch(API, {
    method: "POST",
    body: formData
  })
  .then(r => r.json())
  .then(data => {
    if (data.status !== "OK") {
      alert("Gagal mengirim SBAR");
      return;
    }
    alert("SBAR berhasil dikirim");
    loadDashboard();
  })
  .catch(() => alert("Error koneksi"));
}



function arsipSBAR(mrn, waktu) {

  if (!confirm("Yakin ingin mengarsipkan SBAR ini?")) return;

fetch(
  `${API}?action=arsipSBAR` +
  `&mrn=${encodeURIComponent(mrn)}` +
  `&waktu=${encodeURIComponent(waktu)}`
)
  .then(r => r.json())
  .then(res => {
    if (res.status === "OK") {
      alert("SBAR berhasil diarsipkan");
      loadDashboard();
    } else {
      alert("Gagal mengarsipkan");
    }
  });
}




/* ===============================
   AUTO OPEN WHATSAPP PASIEN
================================ */
function autoOpenWA(p) {
  if (!p.telp) {
    alert("Nomor WhatsApp pasien tidak tersedia");
    return;
  }

  const wa = formatWA(p.telp);

  const pesan = `
Yth. Bapak/Ibu ${p.nama},

Kami dari RS Hermina menyampaikan tindak lanjut
berdasarkan pemantauan kondisi Bapak/Ibu
melalui Hermina CareTrack.

Berdasarkan evaluasi dokter, berikut arahan tindak lanjut:

${p.sbar_advice}

Apabila keluhan memberat, demam tinggi,
atau kondisi memburuk, mohon segera
datang ke IGD RS terdekat.

Pesan ini disampaikan oleh tim pelayanan RS Hermina.
`.trim();

  const url = "https://wa.me/" + wa + "?text=" + encodeURIComponent(pesan);
  window.open(url, "_blank");

  // Catat status (opsional)
 fetch(
  `${API}?action=updateTindakan` +
  `&mrn=${encodeURIComponent(p.mrn)}` +
  `&tindakan=ADVICE_DIBUKA_KE_WA`
);


}

/* ===============================
   INIT
================================ */
loadDashboard();
setInterval(loadDashboard, 60000);
