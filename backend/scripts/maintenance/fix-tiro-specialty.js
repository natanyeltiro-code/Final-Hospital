const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Nathaniel123',
  database: 'medicare'
});

console.log('🔄 Updating Tiro specialty to Cardiology...');

db.query('UPDATE users SET specialty = ? WHERE id = 5', ['Cardiology'], (err) => {
  if (err) {
    console.log('❌ Error:', err.message);
  } else {
    console.log('✅ Updated Tiro specialty to Cardiology');
    
    // Verify the update
    db.query('SELECT id, name, specialty, department FROM users WHERE id = 5', (err, results) => {
      if (err) {
        console.log('❌ Verification error:', err.message);
      } else if (results.length > 0) {
        const tiro = results[0];
        console.log(`\n✅ Verified - Tiro profile:`);
        console.log(`  ID: ${tiro.id}`);
        console.log(`  Name: ${tiro.name}`);
        console.log(`  Specialty: ${tiro.specialty}`);
        console.log(`  Department: ${tiro.department}`);
      }
      db.end();
    });
  }
});
