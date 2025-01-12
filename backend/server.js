const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const { google } = require("googleapis");
const path = require("path");
const cors = require("cors");

const app = express();

// Enable CORS for all origins
app.use(cors());

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
const SHEET_ID = '1IvvnDY2F_eJTIrPXUwUc0YbA78TdoI8iX2B8EEJlvro';

// Fungsi autentikasi dan akses ke Google Sheets
async function accessGoogleSheet(range) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'credentials.json'), // Path ke file JSON
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // Memuat data dari Google Sheet sesuai rentang yang ditentukan
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: range, // Rentang yang sesuai
    });
    return res.data.values;
  } catch (error) {
    console.error("Error accessing Google Sheet:", error.message);
    throw new Error("Error accessing Google Sheet");
  }
}

// API untuk menerima data RSVP
app.post("/rsvp", async (req, res) => {
  const { name, phone, attendance, comment } = req.body;

  // Validasi input
  if (!name || !phone || !attendance) {
    return res.status(400).json({ message: "Semua field wajib diisi." });
  }

  // Validasi attendance hanya boleh "Iya" atau "Tidak"
  if (attendance !== "Iya" && attendance !== "Tidak") {
    return res.status(400).json({ message: "Kehadiran hanya boleh 'Iya' atau 'Tidak'." });
  }

  // Simpan data ke MySQL
  try {
    const sql = "INSERT INTO rsvp (name, phone, attendance, comment) VALUES (?, ?, ?, ?)";
    await db.promise().query(sql, [name, phone, attendance, comment]);
    console.log("RSVP data saved to MySQL.");
  } catch (err) {
    console.error("Error saving to MySQL:", err);
    return res.status(500).json({ message: "Gagal menyimpan ke database MySQL." });
  }

  // Simpan data ke Google Sheets
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "credentials.json"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    // Menambahkan data ke sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "RSVP!A2", // Mulai dari baris 2 untuk menambahkan data baru setelah header
      valueInputOption: "RAW",
      requestBody: {
        values: [[name, phone, attendance, comment]],
      },
    });

    console.log("Data added to Google Sheet.");
  } catch (err) {
    console.error("Error saving to Google Sheets:", err.message);
    return res.status(500).json({ message: "Gagal menyimpan ke Google Sheets." });
  }

  // Berikan respons sukses jika semuanya berhasil
  res.status(200).json({ message: "RSVP berhasil dikirim." });
});

// API untuk menampilkan komentar
// API untuk menampilkan komentar dari MySQL
app.get("/comments", (req, res) => {
    db.query("SELECT name, comment FROM rsvp", (err, results) => {
      if (err) {
        console.error("Error fetching comments:", err);
        return res.status(500).send("Gagal memuat komentar.");
      }
      res.json(results);
    });
  });

  
/*
// API untuk menampilkan data RSVP dari Google Sheets
app.get("/google-rsvp", async (req, res) => {
  try {
    const range = "RSVP!A2:D"; // Mengambil data dari baris kedua dan seterusnya
    const sheetData = await accessGoogleSheet(range);
    if (sheetData && sheetData.length > 0) {
      res.json(sheetData); // Kirimkan data ke frontend
    } else {
      res.status(404).send("Data tidak ditemukan di Google Sheets.");
    }
  } catch (error) {
    res.status(500).send("Gagal mengambil data dari Google Sheets.");
  }
});

app.get("/google-comments", async (req, res) => {
    try {
      const range = "RSVP!A2:D"; // Rentang data Google Sheet (A2:D berisi data RSVP)
      const sheetData = await accessGoogleSheet(range);
  
      if (!sheetData || sheetData.length === 0) {
        return res.status(404).send("Data tidak ditemukan di Google Sheets.");
      }
  
      // Ambil hanya kolom "name" dan "comment"
      const comments = sheetData
        .filter(row => row[3]) // Filter data yang memiliki komentar
        .map(row => ({ name: row[0], comment: row[3] })); // Ambil kolom "name" dan "comment"
  
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments from Google Sheets:", error.message);
      res.status(500).send("Gagal mengambil data komentar dari Google Sheets.");
    }
  });
 */ 
  

// Menjalankan server di port 4019
app.listen(4019, () => {
  console.log("Server berjalan di port 4019");
});
