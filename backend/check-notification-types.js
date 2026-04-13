require('dotenv').config();
const db = require('./config/db');

db.query('SELECT type, COUNT(*) as count FROM notifications GROUP BY type', (err, results) => {
  console.log('\n📊 Notification types in database:');
  if (err) {
    console.error('Error:', err.message);
  } else {
    results.forEach(r => console.log(`   ${r.type}: ${r.count}`));
  }
  process.exit(0);
});
