const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@Nathaniel123',
    database: 'medicare'
  });
  
  // Check all doctors
  const [doctors] = await connection.execute('SELECT id, name, role FROM users WHERE role = ?', ['doctor']);
  console.log('=== DOCTORS ===');
  console.log(JSON.stringify(doctors, null, 2));
  
  // Check all appointments
  const [appointments] = await connection.execute('SELECT * FROM appointments ORDER BY date DESC LIMIT 10');
  console.log('\n=== ALL APPOINTMENTS (LAST 10) ===');
  console.log(JSON.stringify(appointments, null, 2));
  
  // Check appointments for doctor id 1
  const [drTiroAppts] = await connection.execute('SELECT * FROM appointments WHERE doctor_id = ?', [1]);
  console.log('\n=== APPOINTMENTS FOR DOCTOR ID 1 ===');
  console.log(JSON.stringify(drTiroAppts, null, 2));
  
  // Check TODAY's date
  const today = new Date().toISOString().split('T')[0];
  console.log('\n=== TODAY\'S DATE ===');
  console.log(today);
  
  // Check today's appointments for doctor 1
  const [todayAppts] = await connection.execute('SELECT * FROM appointments WHERE doctor_id = ? AND date = ?', [1, today]);
  console.log('\n=== TODAY\'S APPOINTMENTS FOR DOCTOR ID 1 ===');
  console.log(JSON.stringify(todayAppts, null, 2));
  
  await connection.end();
})();
