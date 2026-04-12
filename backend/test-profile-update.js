require("dotenv").config();
const db = require("./config/db");

// Test updating doctor profile
const testUserId = 1; // Usually the first doctor in the database

console.log("\n🧪 Testing Profile Update...\n");

// First, check current values
const selectSql = "SELECT id, name, experience, bio, department FROM users WHERE id = ?";
db.query(selectSql, [testUserId], (err, results) => {
  if (err) {
    console.error("❌ Error reading user:", err.message);
    process.exit(1);
  }

  if (results.length === 0) {
    console.error(`❌ User ${testUserId} not found`);
    process.exit(1);
  }

  console.log("📖 Current Values:");
  console.log(`  ID: ${results[0].id}`);
  console.log(`  Name: ${results[0].name}`);
  console.log(`  Experience: ${results[0].experience}`);
  console.log(`  Bio: ${results[0].bio || "(empty)"}`);
  console.log(`  Department: ${results[0].department || "(empty)"}`);

  // Now update
  const updateSql = "UPDATE users SET experience = ?, bio = ?, department = ? WHERE id = ?";
  const newExperience = 150;
  const newBio = "Updated bio test";
  const newDepartment = "Updated Department";

  db.query(
    updateSql,
    [newExperience, newBio, newDepartment, testUserId],
    (updateErr, updateResult) => {
      if (updateErr) {
        console.error("\n❌ Error updating user:", updateErr.message);
        process.exit(1);
      }

      console.log("\n✅ Update executed");
      console.log(`   Rows affected: ${updateResult.affectedRows}`);

      // Verify the update
      db.query(selectSql, [testUserId], (verifyErr, verifyResults) => {
        if (verifyErr) {
          console.error("❌ Error verifying update:", verifyErr.message);
          process.exit(1);
        }

        console.log("\n✅ Verification - New Values:");
        console.log(`  ID: ${verifyResults[0].id}`);
        console.log(`  Name: ${verifyResults[0].name}`);
        console.log(`  Experience: ${verifyResults[0].experience}`);
        console.log(`  Bio: ${verifyResults[0].bio || "(empty)"}`);
        console.log(`  Department: ${verifyResults[0].department || "(empty)"}`);

        if (
          verifyResults[0].experience === newExperience &&
          verifyResults[0].bio === newBio &&
          verifyResults[0].department === newDepartment
        ) {
          console.log("\n✅ TEST PASSED - Data persisted correctly!");
        } else {
          console.log("\n❌ TEST FAILED - Data not updated!");
        }

        process.exit(0);
      });
    }
  );
});
