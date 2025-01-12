const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const { google } = require("googleapis");

const app = express();
app.use(bodyParser.json());

// Konfigurasi MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "evansalfahmi",
  password: "evansalfahmi",
  database: "wedding_rsvp",
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL connected...");
});

// Konfigurasi Google Sheets
const sheets = google.sheets({ version: "v4" });
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const spreadsheetId = "1EcYIP2sRmKxXNDPXGUD4uXLk9Y3JfDPtPwGHQIZB4m8";

// API untuk menerima data RSVP
app.post("/rsvp", async (req, res) => {
  const { name, phone, attendance, comment } = req.body;

  if (!name || !phone || !attendance) {
    return res.status(400).send("Semua field wajib diisi.");
  }

  // Simpan ke MySQL
  const sql = "INSERT INTO rsvp (name, phone, attendance, comment) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, phone, attendance, comment], (err) => {
    if (err) return res.status(500).send("Gagal menyimpan ke database.");
  });

  // Simpan ke Google Sheets
  try {
    const authClient = await auth.getClient();
    await sheets.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId,
      range: "RSVP!A1",
      valueInputOption: "RAW",
      requestBody: {
        values: [[name, phone, attendance, comment]],
      },
    });
  } catch (error) {
    return res.status(500).send("Gagal menyimpan ke Google Sheets.");
  }

  res.status(200).send("RSVP berhasil disimpan.");
});

app.get("/comments", (req, res) => {
    db.query("SELECT name, comment FROM rsvp", (err, results) => {
      if (err) return res.status(500).send("Gagal memuat komentar.");
      res.json(results);
    });
  });
  

app.listen(3000, () => console.log("Server berjalan di port 3000"));
