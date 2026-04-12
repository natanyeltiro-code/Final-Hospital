const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Nathaniel123',
  database: 'medicare'
});

// Update existing patients with age and gender
const updates = [
  { id: 1, age: 35, gender: 'Male' },
  { id: 6, age: 28, gender: 'Male' }
];

updates.forEach((update, index) => {
  db.query(
    'UPDATE users SET age = ?, gender = ? WHERE id = ?',
    [update.age, update.gender, update.id],
    (err, result) => {
      if (err) {
        console.error('Error updating user:', err);
      } else {
        console.log(`Updated user ${update.id}: ${result.affectedRows} row(s)`);
      }

      if (index === updates.length - 1) {
        // Check final data
        db.query('SELECT id, name, age, gender FROM users WHERE role = "patient"', (err, results) => {
          if (err) {
            console.error('Error:', err);
          } else {
            console.log('Updated patient data:');
            console.log(results);
          }
          db.end();
        });
      }
    }
  );
});