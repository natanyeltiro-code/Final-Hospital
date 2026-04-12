const mysql = require("mysql2/promise");

async function checkTiroPassword() {
  try {
    const pool = await mysql.createPool({
      host: "localhost",
      user: "root",
      password: "@Nathaniel123",
      database: "medicare"
    });
    
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT id, name, email, password, role FROM users LIMIT 10");
    
    if (rows.length === 0) {
      console.log("❌ No users found");
    } else {
      console.log("All users in database:");
      rows.forEach(u => console.log(`  ID ${u.id}: ${u.name} (${u.email}) [${u.role}]`));
      
      const tiro = rows.find(u => u.name && u.name.toLowerCase().includes('tiro'));
      if (tiro) {
        console.log("\n🎯 Found Tiro:");
        console.log(`  ID: ${tiro.id}`);
        console.log(`  Name: ${tiro.name}`);
        console.log(`  Email: ${tiro.email}`);
        console.log(`  Role: ${tiro.role}`);
        console.log(`  Password hash: ${tiro.password.substring(0, 20)}...`);
      }
    }
    
    conn.release();
    pool.end();
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    process.exit(0);
  }
}

checkTiroPassword();
