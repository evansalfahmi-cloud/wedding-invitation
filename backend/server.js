const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const { google } = require("googleapis");
const path = require("path");

const app = express();

// Middleware untuk menangani JSON dan URL Encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Konfigurasi MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "evansalfahmi",
  password: "evansalfahmi",
  database: "wedding",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
    return;
  }
  console.log("MySQL connected...");
});

// Google Sheets Configuration
const SHEET_ID = '1EcYIP2sRmKxXNDPXGUD4uXLk9Y3JfDPtPwGHQIZB4m8';
const doc = new GoogleSpreadsheet(SHEET_ID);

async function accessGoogleSheet() {
    await doc.useServiceAccountAuth(require('./wedding-rsvp-447316-11c78ce8029e.json')); // Path to your service account credentials
    await doc.loadInfo();
}
accessGoogleSheet();



// API untuk menerima data RSVP
app.post("/rsvp", async (req, res) => {
  const { name, phone, attendance, comment } = req.body;

  // Validasi input
  if (!name || !phone || !attendance) {
    return res.status(400).send("Semua field wajib diisi.");
  }

  // Validasi attendance hanya boleh "Iya" atau "Tidak"
  if (attendance !== "Iya" && attendance !== "Tidak") {
    return res.status(400).send("Kehadiran hanya boleh 'Iya' atau 'Tidak'.");
  }

  // Simpan data ke MySQL
  const sql = "INSERT INTO rsvp (name, phone, attendance, comment) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, phone, attendance, comment], (err) => {
    if (err) {
      console.error("Error saving to MySQL:", err);
      return res.status(500).send("Gagal menyimpan ke database.");
    }
  });

  // Simpan data ke Google Sheets
  try {
    const authClient = await auth.getClient();
    await sheets.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId,
      range: "RSVP!A1", // Menyisipkan data mulai dari baris pertama
      valueInputOption: "RAW",
      requestBody: {
        values: [[name, phone, attendance, comment]],
      },
    });
  } catch (error) {
    console.error("Error saving to Google Sheets:", error);
    return res.status(500).send("Gagal menyimpan ke Google Sheets.");
  }

  res.status(200).send("RSVP berhasil disimpan.");
});

// API untuk menampilkan komentar
app.get("/comments", (req, res) => {
  db.query("SELECT name, comment FROM rsvp", (err, results) => {
    if (err) {
      console.error("Error fetching comments:", err);
      return res.status(500).send("Gagal memuat komentar.");
    }
    res.json(results);
  });
});

// Menjalankan server di port 3000
app.listen(4019, () => {
  console.log("Server berjalan di port 4019");
});

