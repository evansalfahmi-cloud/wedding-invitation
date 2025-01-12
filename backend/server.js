const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'evansalfahmi',
  password: 'evansalfahmi',
  database: 'wedding_rsvp',
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Google Spreadsheet Setup
const doc = new GoogleSpreadsheet('SPREADSHEET_ID'); // Ganti dengan ID spreadsheet Anda
const credentials = require('./credentials.json'); // File JSON kredensial Google API

async function accessSpreadsheet() {
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo(); // Load spreadsheet info
}

accessSpreadsheet().catch(console.error);

// Handle RSVP Submission
app.post('/submit-rsvp', async (req, res) => {
  const { name, phone, attendance, comment } = req.body;

  // Save to MySQL
  const query = 'INSERT INTO rsvp (name, phone, attendance, comment) VALUES (?, ?, ?, ?)';
  db.query(query, [name, phone, attendance, comment], err => {
    if (err) {
      console.error('MySQL insert error:', err);
      res.status(500).send('Error saving to database');
      return;
    }
    console.log('Saved to MySQL');
  });

  // Save to Google Spreadsheet
  try {
    const sheet = doc.sheetsByIndex[0]; // Gunakan sheet pertama
    await sheet.addRow({ Name: name, Phone: phone, Attendance: attendance, Comment: comment });
    console.log('Saved to Google Spreadsheet');
  } catch (error) {
    console.error('Spreadsheet save error:', error);
    res.status(500).send('Error saving to spreadsheet');
    return;
  }

  res.status(200).send('RSVP submitted successfully');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
