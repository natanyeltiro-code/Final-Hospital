const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Nathaniel123',
  database: 'medicare'
});

// First, get the wew user ID and a doctor ID
db.query('SELECT id FROM users WHERE name = "wew" AND role = "patient"', (err, patientResults) => {
  if (err) {
    console.error('Error finding wew user:', err);
    db.end();
    return;
  }

  if (patientResults.length === 0) {
    console.error('wew user not found');
    db.end();
    return;
  }

  const patientId = patientResults[0].id;
  console.log('Found wew user with ID:', patientId);

  // Get a doctor ID
  db.query('SELECT id FROM users WHERE role = "doctor" LIMIT 1', (err, doctorResults) => {
    if (err) {
      console.error('Error finding doctor:', err);
      db.end();
      return;
    }

    if (doctorResults.length === 0) {
      console.error('No doctors found');
      db.end();
      return;
    }

    const doctorId = doctorResults[0].id;
    console.log('Found doctor with ID:', doctorId);

    // Get today's date and add 5 days for a future appointment
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0];
    const timeStr = '14:00:00';

    // Insert the appointment
    const query = 'INSERT INTO appointments (patient_id, doctor_id, date, time, type, status) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [patientId, doctorId, dateStr, timeStr, 'Consultation', 'Pending'], (err, result) => {
      if (err) {
        console.error('Error inserting appointment:', err);
      } else {
        console.log('Appointment added successfully!');
        console.log(`Patient ID: ${patientId}, Doctor ID: ${doctorId}, Date: ${dateStr}, Time: ${timeStr}`);
      }
      db.end();
    });
  });
});
