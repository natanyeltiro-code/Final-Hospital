require("dotenv").config();
const db = require("./config/db");

// Check appointments for patient user 7 (wew)
console.log("\n🏥 Appointments for patient 'wew' (user 7):");
db.query(
  `SELECT id, patient_id, patient_name, doctor_id, status, date 
   FROM appointments 
   WHERE patient_id = 7 
   ORDER BY date DESC`,
  (err, results) => {
    if (err) {
      console.error("Error:", err.message);
      process.exit(1);
    }
    
    if (results.length === 0) {
      console.log("   No appointments found for patient 7");
    } else {
      console.log(`\n   Found ${results.length} appointment(s):`);
      results.forEach((app, i) => {
        console.log(`\n   [${i+1}] Appointment ID: ${app.id}`);
        console.log(`       Patient: ${app.patient_name || 'Registered patient'} (user 7)`);
        console.log(`       Doctor ID: ${app.doctor_id}`);
        console.log(`       Status: ${app.status}`);
        console.log(`       Date: ${app.date}`);
      });
    }
    
    process.exit(0);
  }
);
