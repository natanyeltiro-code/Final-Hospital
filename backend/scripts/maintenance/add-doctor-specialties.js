const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Nathaniel123',
  database: 'medicare'
});

// Add specialty column to users table if it doesn't exist
db.query(`
  SELECT COLUMN_NAME
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'medicare'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'specialty'
`, (err, results) => {
  if (err) {
    console.error('Error checking column:', err);
    db.end();
    return;
  }

  if (results.length === 0) {
    // Add specialty column
    db.query(`ALTER TABLE users ADD COLUMN specialty VARCHAR(255)`, (err) => {
      if (err) {
        console.error('Error adding specialty column:', err);
      } else {
        console.log('✅ Added specialty column');
        updateSpecialties();
      }
    });
  } else {
    console.log('✅ Specialty column already exists');
    updateSpecialties();
  }
});

function updateSpecialties() {
  // Update doctor specialties
  const specialties = [
    { id: 1, specialty: 'Cardiology' },
    { id: 2, specialty: 'Orthopedics' },
    { id: 3, specialty: 'General Medicine' },
    { id: 5, specialty: 'Family Medicine' }
  ];

  specialties.forEach((doc) => {
    db.query(`UPDATE users SET specialty = ? WHERE id = ? AND role = 'doctor'`, [doc.specialty, doc.id], (err) => {
      if (err) {
        console.error(`Error updating doctor ${doc.id}:`, err);
      } else {
        console.log(`✅ Updated doctor ${doc.id} specialty to ${doc.specialty}`);
      }
    });
  });

  setTimeout(() => db.end(), 1000);
}
