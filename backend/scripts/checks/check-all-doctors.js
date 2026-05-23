const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Nathaniel123',
  database: 'medicare'
});

console.log('🔍 Checking all doctors:\n');

db.query('SELECT id, name, specialty, department, status FROM users WHERE role = "doctor"', (err, results) => {
  if (err) {
    console.log('❌ Error:', err.message);
  } else {
    console.log('Doctors in database:');
    results.forEach(d => {
      console.log(`  ID ${d.id}: ${d.name}`);
      console.log(`    Specialty: ${d.specialty || '(not set)'}`);
      console.log(`    Department: ${d.department || '(not set)'}`);
      console.log(`    Status: ${d.status || '(not set)'}`);
    });
  }
  db.end();
});
