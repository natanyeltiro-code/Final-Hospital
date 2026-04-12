require("dotenv").config();
const db = require("./config/db");

console.log("\n🧪 FINAL TEST: Complete Login + Save + Reload Flow\n");

const userId = 1;

// STEP 1: Simulate what happens during LOGIN
console.log("STEP 1️⃣: LOGIN - Fetching user data (like /login endpoint)");
const loginSql = "SELECT id, name, email, specialty, department, experience, bio FROM users WHERE id = ?";

db.query(loginSql, [userId], (err, results) => {
  if (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }

  const loginUser = results[0];
  console.log("  Login response has:");
  console.log("    - specialty:", loginUser.specialty || "(missing)");
  console.log("    - department:", loginUser.department || "(missing)");
  console.log("    - experience:", loginUser.experience);
  console.log("    - bio:", loginUser.bio || "(missing)");

  // STEP 2: User updates profile
  console.log("\nSTEP 2️⃣: USER UPDATES - Saving changes to database");
  const updateData = {
    specialty: "Dermatology",
    department: "Skin Clinic",
    experience: 35,
    bio: "Specialist in skin diseases"
  };

  const updateSql = "UPDATE users SET specialty = ?, department = ?, experience = ?, bio = ? WHERE id = ?";
  
  db.query(updateSql, [updateData.specialty, updateData.department, updateData.experience, updateData.bio, userId], (updateErr) => {
    if (updateErr) {
      console.error("❌ Update error:", updateErr.message);
      process.exit(1);
    }

    console.log("  ✅ Updated database with:");
    console.log("    - specialty:", updateData.specialty);
    console.log("    - department:", updateData.department);
    console.log("    - experience:", updateData.experience);
    console.log("    - bio:", updateData.bio);

    // STEP 3: Page reloads - what does LOGIN return now?
    console.log("\nSTEP 3️⃣: PAGE RELOAD - What does /login return now?");
    
    db.query(loginSql, [userId], (readErr, readResults) => {
      if (readErr) {
        console.error("❌ Read error:", readErr.message);
        process.exit(1);
      }

      const reloadUser = readResults[0];
      console.log("  Login response now has:");
      console.log("    - specialty:", reloadUser.specialty || "(empty)");
      console.log("    - department:", reloadUser.department || "(empty)");
      console.log("    - experience:", reloadUser.experience);
      console.log("    - bio:", reloadUser.bio || "(empty)");

      console.log("\n✅ VERIFICATION:");
      const match = 
        reloadUser.specialty === updateData.specialty &&
        reloadUser.department === updateData.department &&
        reloadUser.experience === updateData.experience &&
        reloadUser.bio === updateData.bio;

      if (match) {
        console.log("  🎉 SUCCESS! All fields persist through reload!");
      } else {
        console.log("  ❌ FAILURE! Fields don't match:");
        console.log("    Expected:", updateData);
        console.log("    Got:", reloadUser);
      }

      process.exit(0);
    });
  });
});
