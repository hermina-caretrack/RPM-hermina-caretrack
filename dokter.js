/*************************************************
 * HERMINA CARETRACK – DOKTER.JS
 * Hybrid Mode (Dropdown Terkurasi)
 * Match dokter.html v1.9
 *************************************************/

console.log("dokter.js loaded");

const API = CARETRACK_CONFIG.API_URL;
let daftarSBAR = [];

/* ===============================
   HELPER
================================ */
function safe(v, f = "-") {
  return (v !== undefined && v !== null && v !== "") ? v : f;
}

function badgeCTCAE(g) {
  g = Number(g || 0);
  if (g >= 3) return "🔴";
  if (g === 2) return "🟡";
  return "🟢";
}
function formatWaktu(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit"
  }) + " " + d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* ===============================
   LOAD SBAR KE DROPDOWN
================================ */
function loadSBARDokter() {
 fetch(`${API}?action=getSBARForDokter`)
.then(r => {
  if (!r.ok) throw new Error("Server error");
  return r.json();
})
.then(rows => {



      console.log("RAW SBAR FROM BACKEND:", rows);

      // ⛔ JANGAN FILTER DULU
      daftarSBAR = rows;

      const select = document.getElementById("pilihPasien");
      select.innerHTML = `<option value="">-- Pilih SBAR --</option>`;

      if (!daftarSBAR || daftarSBAR.length === 0) {
        select.innerHTML = `<option value="">Tidak ada laporan</option>`;
        return;
      }

      daftarSBAR
        .sort((a, b) => new Date(b.waktu) - new Date(a.waktu))
        .forEach(p => {
          const opt = document.createElement("option");
          opt.value = `${p.mrn}|${p.waktu}`;
          opt.textContent =
            `${badgeCTCAE(p.maxGrade)} ${safe(p.nama)} – Hari ${safe(p.hari)} – CTCAE ${safe(p.maxGrade)}`;
          select.appendChild(opt);
        });
    })
    .catch(err => {
      console.error("LOAD SBAR ERROR:", err);
    });
}


function loadDokterList() {
  const select = document.getElementById("namaDokter");
  if (!select) return;

  select.innerHTML = `<option value="">-- Pilih Dokter --</option>`;

  CARETRACK_CONFIG.DOKTER_LIST.forEach(nama => {
    const opt = document.createElement("option");
    opt.value = nama;
    opt.textContent = nama;
    select.appendChild(opt);
  });
}


/* ===============================
   PILIH SBAR
================================ */
document.getElementById("pilihPasien").addEventListener("change", function () {
  const [mrn, waktu] = this.value.split("|");

const p = daftarSBAR.find(x =>
  String(x.mrn) === String(mrn) &&
  new Date(x.waktu).getTime() === new Date(waktu).getTime()
);
  const sbarBox = document.getElementById("sbarText");
  const adviceBox = document.getElementById("adviceDokter");

  if (!p) {
    sbarBox.value = "";
    adviceBox.value = "";
    adviceBox.classList.add("highlight");
    return;
  }

  sbarBox.value = `
S (Situation):
Pasien ${safe(p.nama)}, No. Rekam Medis ${safe(p.mrn)}
Diagnosa: ${safe(p.diagnosa)}
Regimen Kemoterapi: ${safe(p.regimen)}
Hari ke-${safe(p.hari)} pasca kemoterapi

B (Background):
- Mual        : ${safe(p.mual)}
- Muntah      : ${safe(p.muntah)}
- Demam       : ${safe(p.demam)}
- Diare       : ${safe(p.diare)}
- Kelelahan   : ${safe(p.kelelahan)}
- Lokasi infus: ${safe(p.infus)}

A (Assessment):
Efek samping kemoterapi sesuai CTCAE Grade ${safe(p.maxGrade)}
  `.trim();

  adviceBox.value = "";
  adviceBox.classList.add("highlight");
});


/* ===============================
   SIMPAN ADVICE DOKTER
================================ */
function simpanAdvice() {
  const value = document.getElementById("pilihPasien").value;
const [mrn, waktu] = value.split("|");
  const advice = document.getElementById("adviceDokter").value.trim();
  const namaDokter = document.getElementById("namaDokter").value.trim();

  if (!mrn) {
    alert("Pilih laporan pasien terlebih dahulu");
    return;
  }

  if (!namaDokter) {
    alert("Nama dokter wajib diisi");
    return;
  }

  if (!advice) {
    alert("Advice dokter belum diisi");
    document.getElementById("adviceDokter").classList.add("highlight");
    return;
  }

  // 🔑 INI KUNCI: ambil SBAR yang dipilih
  const p = daftarSBAR.find(x => String(x.mrn) === String(mrn));

  if (!p) {
    alert("Data SBAR tidak ditemukan");
    return;
  }

  fetch(
  `${API}?action=simpanAdvice` +
  `&mrn=${encodeURIComponent(mrn)}` +
  `&waktu=${encodeURIComponent(waktu)}` +
  `&advice=${encodeURIComponent(advice)}` +
  `&dokter=${encodeURIComponent(namaDokter)}`
)
.then(r => {
  if (!r.ok) throw new Error("Server error");
  return r.json();
})
.then(() => {


    alert("Advice dokter berhasil dikirim");

    // reset form
    document.getElementById("pilihPasien").value = "";
    document.getElementById("sbarText").value = "";
    document.getElementById("adviceDokter").value = "";
    document.getElementById("adviceDokter").classList.remove("highlight");

    loadSBARDokter();
  })
  .catch(() => {
    alert("Gagal menyimpan advice dokter");
  });
}


/* ===============================
   INIT
================================ */
loadDokterList();
loadSBARDokter();
setInterval(loadSBARDokter, 60000);

