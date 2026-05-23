const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Nathaniel123',
  database: 'medicare'
});

// Get all doctors info
db.query(`SELECT id, name, role FROM users WHERE role = 'doctor'`, (err, doctors) => {
  if (err) {
    console.error('Error fetching doctors:', err);
    db.end();
    return;
  }
  console.log('=== ALL DOCTORS ===');
  console.log(JSON.stringify(doctors, null, 2));

  // Get all appointments
  db.query(`SELECT * FROM appointments ORDER BY date DESC LIMIT 15`, (err, appointments) => {
    if (err) {
      console.error('Error fetching appointments:', err);
      db.end();
      return;
    }
    console.log('\n=== ALL APPOINTMENTS (LAST 15) ===');
    console.log(JSON.stringify(appointments, null, 2));

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('\n=== TODAY\'S DATE ===');
    console.log(today);

    // Get appointments for doctor ID 1 (Dr. Tiro)
    db.query(`SELECT * FROM appointments WHERE doctor_id = 1`, (err, tiroAppts) => {
      if (err) {
        console.error('Error:', err);
        db.end();
        return;
      }
      console.log('\n=== ALL APPOINTMENTS FOR DOCTOR ID 1 (Dr. Tiro) ===');
      console.log('Count:', tiroAppts.length);
      console.log(JSON.stringify(tiroAppts, null, 2));

      // Get TODAY's appointments for doctor 1
      db.query(`SELECT * FROM appointments WHERE doctor_id = 1 AND date = ?`, [today], (err, todayAppts) => {
        if (err) {
          console.error('Error:', err);
          db.end();
          return;
        }
        console.log(`\n=== TODAY'S APPOINTMENTS (${today}) FOR DOCTOR ID 1 ===`);
        console.log('Count:', todayAppts.length);
        console.log(JSON.stringify(todayAppts, null, 2));
        db.end();
      });
    });
  });
});
