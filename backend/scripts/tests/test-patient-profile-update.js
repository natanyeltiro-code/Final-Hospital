const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const axios = require("axios");

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "@Nathaniel123",
  database: "medicare",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL");
  testPatientProfileUpdate();
});

async function testPatientProfileUpdate() {
  try {
    // Step 1: Create a test patient
    console.log("\n1️⃣ Creating test patient...");
    const hashedPassword = await bcrypt.hash("testpass123", 10);
    const patientEmail = "testpatient@test.com";
    
    const sql = "INSERT INTO users (name, email, password, role, phone, age, gender, blood_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sql, ["Test Patient", patientEmail, hashedPassword, "patient", "+1-123-456-7890", 35, "Male", "O+"], (err, result) => {
      if (err) {
        if (err.message.includes("Duplicate entry")) {
          console.log("  ℹ️  Patient already exists");
          findAndUpdatePatient();
        } else {
          console.error("  ❌ Error creating patient:", err.message);
          process.exit(1);
        }
      } else {
        console.log("  ✅ Patient created with ID:", result.insertId);
        testLogin(patientEmail);
      }
    });

    function findAndUpdatePatient() {
      // Find the patient and get their ID
      db.query("SELECT id FROM users WHERE email = ?", [patientEmail], (err, results) => {
        if (err) {
          console.error("  ❌ Error finding patient:", err.message);
          process.exit(1);
        }
        if (results.length === 0) {
          console.error("  ❌ Patient not found");
          process.exit(1);
        }
        console.log("  ✅ Patient found with ID:", results[0].id);
        testLogin(patientEmail);
      });
    }

    function testLogin(email) {
      // Step 2: Login to get access token
      console.log("\n2️⃣ Testing login...");
      axios
        .post("http://localhost:3000/login", {
          email: email,
          password: "testpass123",
        })
        .then((response) => {
          const token = response.data.token;
          const userId = response.data.user.id;
          console.log("  ✅ Login successful");
          console.log("  Token:", token.substring(0, 20) + "...");
          console.log("  User ID:", userId);
          testProfileUpdate(token, userId);
        })
        .catch((error) => {
          console.error("  ❌ Login failed:", error.response?.data?.message || error.message);
          process.exit(1);
        });
    }

    function testProfileUpdate(token, userId) {
      // Step 3: Update patient profile
      console.log("\n3️⃣ Testing profile update...");
      const updateData = {
        name: "Updated Patient Name",
        email: `testpatient@test.com`,
        phone: "+1-999-888-7777",
        bloodGroup: "B+",
        age: 40,
        gender: "Female",
        dateOfBirth: "1986-05-15",
        address: "123 Main St, City",
        emergencyContact: "+1-111-222-3333",
      };

      axios
        .put(`http://localhost:3000/users/${userId}`, updateData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          console.log("  ✅ Profile update successful!");
          console.log("  Response:", response.data);
          
          // Step 4: Verify update
          console.log("\n4️⃣ Verifying update...");
          db.query("SELECT name, age, gender, blood_group, phone FROM users WHERE id = ?", [userId], (err, results) => {
            if (err) {
              console.error("  ❌ Error verifying:", err.message);
            } else {
              console.log("  ✅ Current data in database:");
              console.log("    Name:", results[0].name);
              console.log("    Age:", results[0].age);
              console.log("    Gender:", results[0].gender);
              console.log("    Blood Group:", results[0].blood_group);
              console.log("    Phone:", results[0].phone);
            }
            db.end();
          });
        })
        .catch((error) => {
          console.error("  ❌ Profile update failed!");
          console.error("  Status:", error.response?.status);
          console.error("  Message:", error.response?.data?.message);
          console.error("  Error:", error.response?.data?.error);
          console.error("\n📋 Full error response:");
          console.log(error.response?.data);
          db.end();
          process.exit(1);
        });
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    db.end();
    process.exit(1);
  }
}
