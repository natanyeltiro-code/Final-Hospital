const axios = require("axios");
const mysql = require("mysql2/promise");

async function testCompleteFlow() {
  try {
    console.log("\n=== COMPLETE FLOW TEST ===\n");
    
    const baseURL = "http://localhost:3000";
    const testEmail = "Tiro@gmail.com";
    const testPassword = "password123";
    
    // Step 1: Login
    console.log("1️⃣ Login...");
    const loginRes = await axios.post(`${baseURL}/login`, {
      email: testEmail,
      password: testPassword,
    });
    const token = loginRes.data.token;
    const userId = loginRes.data.user.id;
    console.log(`  ✅ Logged in - Token: ${token.substring(0, 10)}...`);
    console.log(`  User ID: ${userId}`);
    console.log(`  Login experience value: ${loginRes.data.user.experience}`);
    
    // Step 2: Call /me to get current state
    console.log("\n2️⃣ Call /me endpoint (before update)...");
    const meBeforeRes = await axios.get(`${baseURL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`  /me experience value: ${meBeforeRes.data.user.experience}`);
    
    // Step 3: Update profile to experience = 14
    console.log("\n3️⃣ Update profile (experience = 14)...");
    const updateRes = await axios.put(
      `${baseURL}/users/${userId}`,
      {
        name: "Tiro",
        email: testEmail,
        phone: "09334350204",
        specialization: "Cardiology",
        department: "Cardiology",
        yearsExperience: 14,
        bio: "Test"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`  ✅ Update response experience: ${updateRes.data.user.experience}`);
    
    // Step 4: Call /me immediately after update
    console.log("\n4️⃣ Call /me endpoint (after update, same token)...");
    const meAfterRes = await axios.get(`${baseURL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`  /me experience value: ${meAfterRes.data.user.experience}`);
    
    // Step 5: Check database directly
    console.log("\n5️⃣ Check database directly...");
    const pool = await mysql.createPool({
      host: "localhost",
      user: "root",
      password: "@Nathaniel123",
      database: "medicare",
    });
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT experience FROM users WHERE id = ?", [userId]);
    console.log(`  Database experience value: ${rows[0].experience}`);
    conn.release();
    
    console.log("\n=== SUMMARY ===");
    console.log(`Login response: ${loginRes.data.user.experience}`);
    console.log(`/me before update: ${meBeforeRes.data.user.experience}`);
    console.log(`Update response: ${updateRes.data.user.experience}`);
    console.log(`/me after update: ${meAfterRes.data.user.experience}`);
    console.log(`Database actual: ${rows[0].experience}`);
    
    if (meAfterRes.data.user.experience === 14) {
      console.log("\n✅ SUCCESS: /me returns updated value");
    } else {
      console.log("\n❌ PROBLEM: /me not returning updated value");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}

testCompleteFlow();
