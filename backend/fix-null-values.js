require("dotenv").config();
const db = require("./config/db");

console.log("\n🔧 FIXING: Cleaning up bad null values...\n");

// Fix the string "null" values in specialty column
const fixSql = `UPDATE users SET specialty = NULL WHERE specialty = 'null' OR specialty IS NULL`;

db.query(fixSql, (err, result) => {
  if (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
  
  console.log(`✅ Fixed ${result.changedRows} rows\n`);
  
  // Verify
  const verifySql = "SELECT id, name, specialty, department, experience FROM users LIMIT 3";
  db.query(verifySql, (verifyErr, results) => {
    if (verifyErr) {
      console.error("❌ Error:", verifyErr.message);
      process.exit(1);
    }
    
    console.log("✅ Current values after fix:\n");
    results.forEach(user => {
      console.log(`  User ${user.id} (${user.name}):`);
      console.log(`    Specialty: ${user.specialty === null ? "NULL (correct)" : `"${user.specialty}"`}`);
      console.log(`    Department: ${user.department === null ? "NULL" : `"${user.department}"`}`);
      console.log(`    Experience: ${user.experience}`);
    });
    
    console.log("\n✅ Database cleanup complete!");
    process.exit(0);
  });
});
