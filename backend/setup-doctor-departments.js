const mysql = require("mysql2/promise");

async function setupDoctorDepartments() {
  try {
    const pool = await mysql.createPool({
      host: "localhost",
      user: "root",
      password: "@Nathaniel123",
      database: "medicare"
    });
    
    const conn = await pool.getConnection();
    
    console.log("\n🔄 Setting up doctor departments...\n");
    
    // Define department mappings
    const departmentMappings = [
      { name: "Tiro", department: "Cardiology" },
      { name: "Dr. Sarah Jenkins", department: "Cardiology" },
      { name: "Dr. James Wilson", department: "General Medicine" },
      { name: "amelita", department: "Cardiology" }
    ];
    
    // Update each doctor's department
    for (const mapping of departmentMappings) {
      try {
        const [result] = await conn.query(
          "UPDATE users SET department = ? WHERE (name = ? OR name LIKE ?) AND role = 'doctor'",
          [mapping.department, mapping.name, `%${mapping.name}%`]
        );
        
        if (result.affectedRows > 0) {
          console.log(`✅ ${mapping.name} → ${mapping.department}`);
        }
      } catch (err) {
        console.log(`⚠️  ${mapping.name}: ${err.message.substring(0, 40)}`);
      }
    }
    
    // Verify all doctors now have departments
    console.log("\n📋 Current doctor departments:");
    const [doctors] = await conn.query(
      "SELECT id, name, specialty, department FROM users WHERE role = 'doctor' ORDER BY name"
    );
    
    doctors.forEach(doc => {
      console.log(`  • ${doc.name}: ${doc.department || "(no department)"}`);
    });
    
    // Show available departments
    const [depts] = await conn.query(
      "SELECT DISTINCT department FROM users WHERE role = 'doctor' AND department IS NOT NULL ORDER BY department"
    );
    
    console.log("\n📦 Available departments:");
    depts.forEach(d => {
      console.log(`  • ${d.department}`);
    });
    
    conn.release();
    pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    process.exit(0);
  }
}

setupDoctorDepartments();
