require('dotenv').config();
const db = require('./config/db');

// Update Tiro's doctor profile with actual values
db.query(
  "UPDATE users SET rating = 4.9, experience = 12 WHERE name = 'Tiro' AND role = 'doctor'",
  (err, results) => {
    if (err) {
      console.error('Error updating Tiro:', err.message);
    } else {
      console.log('✅ Updated Tiro: rating=4.9, experience=12');
    }
  }
);

// Update Dr.Nathaniel with some values too
db.query(
  "UPDATE users SET rating = 4.7, experience = 8 WHERE name = 'Dr.Nathaniel' AND role = 'doctor'",
  (err, results) => {
    if (err) {
      console.error('Error updating Dr.Nathaniel:', err.message);
    } else {
      console.log('✅ Updated Dr.Nathaniel: rating=4.7, experience=8');
    }
    
    // Verify the updates
    db.query(
      "SELECT id, name, rating, experience FROM users WHERE role = 'doctor'",
      (err, results) => {
        if (err) {
          console.error('Error verifying:', err.message);
        } else {
          console.log('\n📋 Updated doctor data:');
          console.table(results);
        }
        setTimeout(() => process.exit(0), 500);
      }
    );
  }
);
