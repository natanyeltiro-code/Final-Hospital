const http = require('http');

console.log('🧪 Testing API endpoints...\n');

// Test 1: /api/available-doctors (no auth required)
console.log('1️⃣ Testing GET /api/available-doctors?specialty=Cardiology&date=2026-04-16');
const req1 = http.get('http://localhost:3000/api/available-doctors?specialty=Cardiology&date=2026-04-16', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    console.log('');
  });
});

req1.on('error', (err) => {
  console.log('❌ Error:', err.message);
  console.log('');
});

// Wait a bit then test the second endpoint
setTimeout(() => {
  console.log('2️⃣ Testing GET /api/doctors (requires auth)');
  const req2 = http.get('http://localhost:3000/api/doctors', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      if (res.statusCode === 401) {
        console.log('❌ Requires authentication (expected)');
      } else {
        console.log('Response (first 200 chars):', data.substring(0, 200));
      }
      process.exit(0);
    });
  });

  req2.on('error', (err) => {
    console.log('❌ Error:', err.message);
    process.exit(1);
  });
}, 500);
