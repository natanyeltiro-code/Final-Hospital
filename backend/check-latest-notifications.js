require('dotenv').config();
const db = require('./config/db');

// Get the latest appointment_status notification for patient 14 (pet)
db.query(
  'SELECT * FROM notifications WHERE user_id = 14 AND type = "appointment_status" ORDER BY created_at DESC LIMIT 5',
  (err, results) => {
    console.log('\n📧 Latest appointment_status notifications for patient "pet" (user 14):');
    if (err) {
      console.error('Error:', err.message);
    } else if (results.length === 0) {
      console.log('   ❌ No appointment_status notifications found');
    } else {
      results.forEach((n, i) => {
        console.log(`\n   [${i+1}] Created: ${n.created_at}`);
        console.log(`       Title: ${n.title}`);
        console.log(`       Message: ${n.message}`);
        console.log(`       Type: ${n.type}`);
        console.log(`       Related Entity ID: ${n.related_entity_id}`);
      });
    }
    
    // Also check doctor's notifications
    console.log('\n\n📧 Latest appointment_status notifications for doctor "Tiro" (user 5):');
    db.query(
      'SELECT * FROM notifications WHERE user_id = 5 AND type = "appointment_status" ORDER BY created_at DESC LIMIT 5',
      (err2, results2) => {
        if (err2) {
          console.error('Error:', err2.message);
        } else if (results2.length === 0) {
          console.log('   ❌ No appointment_status notifications found');
        } else {
          results2.forEach((n, i) => {
            console.log(`\n   [${i+1}] Created: ${n.created_at}`);
            console.log(`       Title: ${n.title}`);
            console.log(`       Message: ${n.message}`);
            console.log(`       Type: ${n.type}`);
          });
        }
        process.exit(0);
      }
    );
  }
);
