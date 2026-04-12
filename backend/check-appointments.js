const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Nathaniel123',
  database: 'medicare'
});

// Check if wew user has appointments
db.query(`
  SELECT a.*, u.name as doctor_name 
  FROM appointments a
  JOIN users u ON a.doctor_id = u.id
  WHERE a.patient_id = 7
`, (err, results) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Appointments for wew user (ID 7):');
    console.log(JSON.stringify(results, null, 2));
  }
  db.end();
});
