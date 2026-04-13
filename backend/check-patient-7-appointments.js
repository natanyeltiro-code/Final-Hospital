require('dotenv').config();
const db = require('./config/db');

console.log('\n📋 Checking appointments for patient 7 (wew)...');
db.query(
  'SELECT id, patient_id, doctor_id, status, date, time FROM appointments WHERE patient_id = 7 ORDER BY date DESC LIMIT 10',
  (err, results) => {
    console.log(`\nAppointments for patient 7 (wew):`);
    if (err) {
      console.error('Error:', err.message);
      process.exit(1);
    } else if (results.length === 0) {
      console.log('   ❌ No appointments found for patient 7');
    } else {
      results.forEach((a, i) => {
        console.log(`\n   [${i+1}] ID: ${a.id}, Doctor: ${a.doctor_id}, Status: ${a.status}, Date: ${a.date} ${a.time}`);
      });
    }
    process.exit(0);
  }
);
