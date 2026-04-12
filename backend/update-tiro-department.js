const mysql = require("mysql2/promise");

async function updateTiroDepartment() {
  try {
    const pool = await mysql.createPool({
      host: "localhost",
      user: "root",
      password: "@Nathaniel123",
      database: "medicare"
    });
    
    const conn = await pool.getConnection();
    
    // Update Tiro's department
    await conn.query(
      "UPDATE users SET department = ? WHERE name = 'Tiro'",
      ["General Medicine"]
    );
    
    // Verify the update
    const [updated] = await conn.query(
      "SELECT id, name, specialty, department, experience FROM users WHERE name = 'Tiro'"
    );
    
    console.log("\n✅ Updated Tiro's profile:");
    updated.forEach(d => {
      console.log(`  Name: ${d.name}`);
      console.log(`  Specialty: ${d.specialty}`);
      console.log(`  Department: ${d.department}`);
      console.log(`  Experience: ${d.experience}`);
    });
    
    conn.release();
    pool.end();
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    process.exit(0);
  }
}

updateTiroDepartment();
