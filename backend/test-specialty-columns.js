require("dotenv").config();
const db = require("./config/db");

const testUserId = 1; // First user (usually the doctor)

console.log("\n🔍 DIAGNOSTIC: Checking database values...\n");

const sql = "SELECT id, name, email, phone, specialty, department, experience, bio FROM users WHERE id = ?";

db.query(sql, [testUserId], (err, results) => {
  if (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }

  if (results.length === 0) {
    console.error(`❌ User ${testUserId} not found`);
    process.exit(1);
  }

  const user = results[0];
  
  console.log("✅ Current Database Values for User ID " + testUserId + ":\n");
  console.log(`  ID: ${user.id}`);
  console.log(`  Name: "${user.name}"`);
  console.log(`  Email: "${user.email}"`);
  console.log(`  Phone: "${user.phone}"`);
  console.log(`  Specialty: "${user.specialty}" (type: ${typeof user.specialty})`);
  console.log(`  Department: "${user.department}" (type: ${typeof user.department})`);
  console.log(`  Experience: ${user.experience} (type: ${typeof user.experience})`);
  console.log(`  Bio: "${user.bio}" (type: ${typeof user.bio})`);
  
  console.log("\n🧪 Now testing an UPDATE...\n");
  
  const updateSql = "UPDATE users SET specialty = ?, department = ?, experience = ? WHERE id = ?";
  const testSpecialty = "TestSpecialty123";
  const testDepartment = "TestDept456";
  const testExperience = 999;
  
  db.query(updateSql, [testSpecialty, testDepartment, testExperience, testUserId], (updateErr, updateResult) => {
    if (updateErr) {
      console.error("❌ Update error:", updateErr.message);
      process.exit(1);
    }
    
    console.log(`✅ Update executed (rows affected: ${updateResult.affectedRows})`);
    
    // Read back immediately
    db.query(sql, [testUserId], (readErr, readResults) => {
      if (readErr) {
        console.error("❌ Read error:", readErr.message);
        process.exit(1);
      }
      
      const updatedUser = readResults[0];
      
      console.log("\n📖 Values AFTER UPDATE:\n");
      console.log(`  Specialty: "${updatedUser.specialty}"`);
      console.log(`  Department: "${updatedUser.department}"`);
      console.log(`  Experience: ${updatedUser.experience}`);
      
      if (updatedUser.specialty === testSpecialty && 
          updatedUser.department === testDepartment && 
          updatedUser.experience === testExperience) {
        console.log("\n✅ SUCCESS - Updated values match!");
      } else {
        console.log("\n❌ FAILURE - Updated values DO NOT match!");
        console.log("   Expected specialty:", testSpecialty, "Got:", updatedUser.specialty);
        console.log("   Expected department:", testDepartment, "Got:", updatedUser.department);
        console.log("   Expected experience:", testExperience, "Got:", updatedUser.experience);
      }
      
      process.exit(0);
    });
  });
});
