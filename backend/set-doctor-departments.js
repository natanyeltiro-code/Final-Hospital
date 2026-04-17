const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Nathaniel123',
  database: 'medicare'
});

console.log('🔄 Setting departments for all doctors...\n');

// Map of doctor IDs to their departments
const doctorDepartments = [
  { id: 1, department: 'Cardiology' },
  { id: 3, department: 'General Medicine' },
  { id: 5, department: 'Cardiology' },
  { id: 17, department: 'Cardiology' }
];

let count = 0;
doctorDepartments.forEach((doc) => {
  db.query(
    'UPDATE users SET department = ? WHERE id = ? AND role = "doctor"',
    [doc.department, doc.id],
    (err) => {
      if (err) {
        console.log(`❌ Error updating doctor ${doc.id}: ${err.message}`);
      } else {
        console.log(`✅ Doctor ID ${doc.id} department set to: ${doc.department}`);
      }
      count++;
      if (count === doctorDepartments.length) {
        console.log('\n🔍 Verifying updates...\n');
        db.query(
          'SELECT id, name, specialty, department, status FROM users WHERE role = "doctor"',
          (err, results) => {
            if (err) {
              console.log('❌ Verification error:', err.message);
            } else {
              console.log('Final Doctor List:');
              results.forEach(d => {
                console.log(`  ID ${d.id}: ${d.name}`);
                console.log(`    Department: ${d.department || '(not set)'}`);
                console.log(`    Specialty: ${d.specialty || '(not set)'}`);
                console.log(`    Status: ${d.status || '(not set)'}`);
              });
            }
            db.end();
          }
        );
      }
    }
  );
});
