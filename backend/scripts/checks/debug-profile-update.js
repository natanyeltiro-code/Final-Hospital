const mysql = require("mysql2");

// Database connection
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "@Nathaniel123",
  database: "medicare",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}).promise();

async function debugProfileUpdate() {
  try {
    console.log("\n=== DEBUG PROFILE UPDATE ===\n");
    
    // Find Tiro's user ID
    console.log("1️⃣ Finding Tiro's user ID...");
    const [users] = await db.query("SELECT id, name, email, experience FROM users WHERE name = 'Tiro' LIMIT 1");
    
    if (users.length === 0) {
      console.log("❌ Tiro not found in database");
      return;
    }
    
    const userId = users[0].id;
    const currentExperience = users[0].experience;
    console.log(`  ✅ Found Tiro - ID: ${userId}, Current experience: ${currentExperience}`);
    
    // Simulate update to experience = 14
    console.log("\n2️⃣ Updating experience to 14...");
    const [updateResult] = await db.query(
      "UPDATE users SET experience = ? WHERE id = ?",
      [14, userId]
    );
    console.log(`  Rows affected: ${updateResult.affectedRows}`);
    
    // IMMEDIATELY query to verify update
    console.log("\n3️⃣ Immediately reading back from database...");
    const [checkUpdate] = await db.query(
      "SELECT id, name, experience FROM users WHERE id = ?",
      [userId]
    );
    console.log(`  Experience after update: ${checkUpdate[0].experience}`);
    
    if (checkUpdate[0].experience === 14) {
      console.log("  ✅ UPDATE SUCCESSFUL - Data is in database");
    } else {
      console.log("  ❌ UPDATE FAILED - Data NOT saved to database!");
    }
    
    // Check complete profile data including new fields
    console.log("\n4️⃣ Fetching complete user profile from DB...");
    const [profile] = await db.query(
      "SELECT id, name, email, phone, specialty, department, experience, bio, rating FROM users WHERE id = ?",
      [userId]
    );
    
    console.log("  User profile:", JSON.stringify(profile[0], null, 2));
    
    console.log("\n=== END DEBUG ===\n");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    process.exit(0);
  }
}

debugProfileUpdate();
