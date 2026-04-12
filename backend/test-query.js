require('dotenv').config();
const db = require('./config/db');

// Check schema
db.query('DESCRIBE users', (err, results) => {
  if (err) {
    console.error('Schema Error:', err.message);
  } else {
    const ratingCol = results.find(r => r.Field === 'rating');
    const experienceCol = results.find(r => r.Field === 'experience');
    console.log('\n=== RATING COLUMN ===');
    console.log(ratingCol || 'NOT FOUND');
    console.log('\n=== EXPERIENCE COLUMN ===');
    console.log(experienceCol || 'NOT FOUND');
  }
});

// Check doctor data
db.query('SELECT id, name, rating, experience, specialty FROM users WHERE role = "doctor"', (err, results) => {
  if (err) {
    console.error('Data Error:', err.message);
  } else {
    console.log('\n=== ALL DOCTORS DATA ===');
    console.table(results);
  }
});

setTimeout(() => process.exit(0), 2000);

