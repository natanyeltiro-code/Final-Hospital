require('dotenv').config();
const db = require('./config/db');

const sql = "SELECT id, name, email, role, specialty, phone, rating, experience FROM users WHERE role = 'doctor'";

db.query(sql, (err, results) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Raw query results:');
    console.log(JSON.stringify(results, null, 2));
  }
  setTimeout(() => process.exit(0), 500);
});
