const mysql = require("mysql2/promise");

async function updateTiroName() {
  try {
    const pool = await mysql.createPool({
      host: "localhost",
      user: "root",
      password: "@Nathaniel123",
      database: "medicare"
    });
    
    const conn = await pool.getConnection();
    
    // Update Tiro's name to Dr.Tiro
    await conn.query(
      "UPDATE users SET name = ? WHERE name = 'Tiro'",
      ["Dr.Tiro"]
    );
    
    // Verify the update
    const [updated] = await conn.query(
      "SELECT id, name, email, role FROM users WHERE id = 5"
    );
    
    console.log("\n✅ Updated doctor name:");
    updated.forEach(d => {
      console.log(`  ID: ${d.id}`);
      console.log(`  Name: ${d.name}`);
      console.log(`  Email: ${d.email}`);
      console.log(`  Role: ${d.role}`);
    });
    
    conn.release();
    pool.end();
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    process.exit(0);
  }
}

updateTiroName();
