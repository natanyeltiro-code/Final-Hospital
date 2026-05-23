const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Nathaniel123',
  database: 'medicare'
});

// Today is April 18, 2026
const today = '2026-04-18';

// Get ALL appointments for today
db.query(
  `SELECT a.*, u.name as doctor_name FROM appointments a 
   JOIN users u ON a.doctor_id = u.id 
   WHERE a.date = ?`,
  [today],
  (err, results) => {
    if (err) {
      console.error('Error:', err);
      db.end();
      return;
    }
    console.log(`\n=== ALL APPOINTMENTS FOR TODAY (${today}) ===`);
    console.log('Total Count:', results.length);
    console.log(JSON.stringify(results, null, 2));

    // Get appointments for doctor ID 5 (Dr. Tiro)
    db.query(
      `SELECT * FROM appointments WHERE doctor_id = 5 AND date = ?`,
      [today],
      (err, tiroToday) => {
        if (err) {
          console.error('Error:', err);
          db.end();
          return;
        }
        console.log(`\n=== APPOINTMENTS FOR DR. TIRO (ID 5) TODAY (${today}) ===`);
        console.log('Count:', tiroToday.length);
        console.log(JSON.stringify(tiroToday, null, 2));

        // Let's check the raw date format in the database
        db.query(
          `SELECT id, doctor_id, date, DATE(date) as date_only, time, status FROM appointments WHERE doctor_id = 5 ORDER BY date DESC LIMIT 5`,
          (err, dateCheck) => {
            if (err) {
              console.error('Error:', err);
              db.end();
              return;
            }
            console.log(`\n=== DR. TIRO'S RECENT APPOINTMENTS (DATE FORMAT CHECK) ===`);
            console.log(JSON.stringify(dateCheck, null, 2));
            db.end();
          }
        );
      }
    );
  }
);
