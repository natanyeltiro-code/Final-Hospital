const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Nathaniel123',
  database: 'medicare'
});

console.log('🔍 Testing /api/available-doctors endpoint query...\n');

const specialty = 'Cardiology';
const date = new Date().toISOString().split('T')[0];

console.log(`Searching for doctors with department='${specialty}' on date='${date}'\n`);

const sql = `
  SELECT id, name, specialty, department, status, work_start_time, work_end_time
  FROM users
  WHERE role = 'doctor' 
    AND department = ?
    AND status IN ('Available', 'Busy')
    AND (
      SELECT COUNT(*) FROM doctor_schedule 
      WHERE doctor_id = users.id 
        AND schedule_date = ?
        AND schedule_type = 'Off'
    ) = 0
  ORDER BY status DESC, name ASC
`;

db.query(sql, [specialty, date], (err, results) => {
  if (err) {
    console.log('❌ Query error:', err.message);
  } else {
    console.log(`✅ Found ${results.length} doctors:\n`);
    if (results.length === 0) {
      console.log('No doctors found. Let me check all doctors:\n');
      db.query('SELECT id, name, department, status FROM users WHERE role = "doctor"', (err2, allDoctors) => {
        if (err2) {
          console.log('Error fetching all doctors:', err2.message);
        } else {
          console.log('All doctors in database:');
          allDoctors.forEach(d => {
            console.log(`  ID ${d.id}: ${d.name} - Department: ${d.department || '(null)'} - Status: ${d.status || '(null)'}`);
          });
        }
        db.end();
      });
    } else {
      results.forEach(d => {
        console.log(`  ✅ ID ${d.id}: ${d.name}`);
        console.log(`     Department: ${d.department}`);
        console.log(`     Status: ${d.status}`);
      });
      db.end();
    }
  }
});
