require("dotenv").config();
const db = require("./config/db");

console.log("\n🧪 COMPREHENSIVE TEST: Update all fields\n");

const userId = 1;
const testData = {
  name: "Dr. Test Name",
  email: "test@example.com",
  phone: "+1 555-1234",
  specialization: "Neurology",
  department: "Neurology Dept",
  yearsExperience: 25,
  bio: "This is a test bio"
};

console.log("1️⃣ Sending UPDATE with this data:");
console.log(JSON.stringify(testData, null, 2));

// Simulate the UPDATE request
const sql = "UPDATE users SET name = ?, email = ?, phone = ?, specialty = ?, department = ?, experience = ?, bio = ? WHERE id = ?";

db.query(
  sql,
  [
    testData.name,
    testData.email,
    testData.phone,
    testData.specialization,
    testData.department,
    testData.yearsExperience,
    testData.bio,
    userId
  ],
  (err, result) => {
    if (err) {
      console.error("❌ UPDATE ERROR:", err.message);
      process.exit(1);
    }

    console.log("\n2️⃣ UPDATE executed, rows affected:", result.affectedRows);

    // Now query back like the API does
    const selectSql = "SELECT id, name, email, phone, specialty, department, experience, bio FROM users WHERE id = ?";
    
    db.query(selectSql, [userId], (selectErr, selectResults) => {
      if (selectErr) {
        console.error("❌ SELECT ERROR:", selectErr.message);
        process.exit(1);
      }

      const user = selectResults[0];
      
      console.log("\n3️⃣ Raw values from database:");
      console.log("  name:", user.name);
      console.log("  email:", user.email);
      console.log("  phone:", user.phone);
      console.log("  specialty:", user.specialty);
      console.log("  department:", user.department);
      console.log("  experience:", user.experience);
      console.log("  bio:", user.bio);

      // Format response like the API does
      const responseUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        specialty: user.specialty || "",
        department: user.department || "",
        experience: user.experience !== null ? parseInt(user.experience) : 0,
        bio: user.bio || "",
      };

      console.log("\n4️⃣ Formatted response (what frontend receives):");
      console.log(JSON.stringify(responseUser, null, 2));

      console.log("\n5️⃣ Comparison:");
      console.log("  Expected name:", testData.name, "| Got:", responseUser.name, "|", responseUser.name === testData.name ? "✅" : "❌");
      console.log("  Expected email:", testData.email, "| Got:", responseUser.email, "|", responseUser.email === testData.email ? "✅" : "❌");
      console.log("  Expected phone:", testData.phone, "| Got:", responseUser.phone, "|", responseUser.phone === testData.phone ? "✅" : "❌");
      console.log("  Expected specialty:", testData.specialization, "| Got:", responseUser.specialty, "|", responseUser.specialty === testData.specialization ? "✅" : "❌");
      console.log("  Expected department:", testData.department, "| Got:", responseUser.department, "|", responseUser.department === testData.department ? "✅" : "❌");
      console.log("  Expected experience:", testData.yearsExperience, "| Got:", responseUser.experience, "|", responseUser.experience === testData.yearsExperience ? "✅" : "❌");
      console.log("  Expected bio:", testData.bio, "| Got:", responseUser.bio, "|", responseUser.bio === testData.bio ? "✅" : "❌");

      process.exit(0);
    });
  }
);
