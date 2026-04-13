require('dotenv').config();
const db = require('./config/db');

console.log('\n📊 Appointment status distribution:');
db.query(
  'SELECT status, COUNT(*) as count FROM appointments GROUP BY status ORDER BY count DESC',
  (err, results) => {
    if (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
    
    console.log('\n   Status distribution:');
    results.forEach(r => {
      console.log(`      ${r.status}: ${r.count}`);
    });
    
    // Find an appointment that's NOT confirmed, completed, or cancelled
    console.log('\n\n📋 Looking for appointments in "Requested" or "Pending" status:');
    db.query(
      `SELECT id, patient_id, doctor_id, status, 
              (SELECT name FROM users WHERE id = patient_id) as patient_name,
              (SELECT name FROM users WHERE id = doctor_id) as doctor_name
       FROM appointments 
       WHERE status NOT IN ('Confirmed', 'Completed', 'Cancelled')
       LIMIT 5`,
      (err2, results2) => {
        if (err2) {
          console.error('Error:', err2.message);
        } else if (results2.length === 0) {
          console.log('   ❌ No appointments in other status (all are Confirmed/Completed/Cancelled)');
          console.log('\n   Creating a test appointment for patient 7 with status "Requested"...');
          
          // Insert a test appointment
          const testDate = new Date();
          testDate.setDate(testDate.getDate() + 1);
          
          db.query(
            `INSERT INTO appointments (patient_id, doctor_id, date, status, type) 
             VALUES (?, ?, ?, ?, ?)`,
            [7, 5, testDate, 'Requested', 'Consultation'],
            (err3, result) => {
              if (err3) {
                console.error('   Error creating test appointment:', err3.message);
              } else {
                console.log(`   ✅ Created test appointment ID: ${result.insertId} for patient 7`);
              }
              process.exit(0);
            }
          );
        } else {
          console.log(`   ✅ Found ${results2.length} appointments to test:');
          results2.forEach(a => {
            console.log(`\n      Appointment ID: ${a.id}`);
            console.log(`      Patient: ${a.patient_name} (ID: ${a.patient_id})`);
            console.log(`      Doctor: ${a.doctor_name} (ID: ${a.doctor_id})`);
            console.log(`      Status: ${a.status}`);
          });
          process.exit(0);
        }
      }
    );
  }
);
