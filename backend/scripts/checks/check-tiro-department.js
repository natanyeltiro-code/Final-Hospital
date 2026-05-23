const mysql = require("mysql2/promise");

async function checkTiroDepartment() {
  try {
    const pool = await mysql.createPool({
      host: "localhost",
      user: "root",
      password: "@Nathaniel123",
      database: "medicare"
    });
    
    const conn = await pool.getConnection();
    const [doctors] = await conn.query(
      "SELECT id, name, specialty, department, experience FROM users WHERE name = 'Tiro'"
    );
    
    if (doctors.length > 0) {
      console.log("\n✅ Tiro's profile:");
      doctors.forEach(d => {
        console.log(`  ID: ${d.id}`);
        console.log(`  Name: ${d.name}`);
        console.log(`  Specialty: ${d.specialty}`);
        console.log(`  Department: ${d.department}`);
        console.log(`  Experience: ${d.experience}`);
      });
    } else {
      console.log("❌ Tiro not found");
    }
    
    conn.release();
    pool.end();
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    process.exit(0);
  }
}

checkTiroDepartment();
