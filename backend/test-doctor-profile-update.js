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
  testDoctorProfileUpdate();
});

async function testDoctorProfileUpdate() {
  try {
    // Step 1: Create a test doctor
    console.log("\n1️⃣ Creating test doctor...");
    const hashedPassword = await bcrypt.hash("doctorpass123", 10);
    const doctorEmail = "testdoctor@test.com";
    
    const sql = "INSERT INTO users (name, email, password, role, phone, specialty, department, experience, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sql, ["Test Doctor", doctorEmail, hashedPassword, "doctor", "+1-123-456-7890", "Cardiology", "Heart Dept", 15, "Expert cardiologist"], (err, result) => {
      if (err) {
        if (err.message.includes("Duplicate entry")) {
          console.log("  ℹ️  Doctor already exists");
          findAndUpdateDoctor();
        } else {
          console.error("  ❌ Error creating doctor:", err.message);
          process.exit(1);
        }
      } else {
        console.log("  ✅ Doctor created with ID:", result.insertId);
        testLogin(doctorEmail);
      }
    });

    function findAndUpdateDoctor() {
      // Find the doctor and get their ID
      db.query("SELECT id FROM users WHERE email = ?", [doctorEmail], (err, results) => {
        if (err) {
          console.error("  ❌ Error finding doctor:", err.message);
          process.exit(1);
        }
        if (results.length === 0) {
          console.error("  ❌ Doctor not found");
          process.exit(1);
        }
        console.log("  ✅ Doctor found with ID:", results[0].id);
        testLogin(doctorEmail);
      });
    }

    function testLogin(email) {
      // Step 2: Login to get access token
      console.log("\n2️⃣ Testing login...");
      axios
        .post("http://localhost:3000/login", {
          email: email,
          password: "doctorpass123",
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
      // Step 3: Update doctor profile
      console.log("\n3️⃣ Testing doctor profile update...");
      const updateData = {
        name: "Updated Doctor Name",
        email: doctorEmail,
        phone: "+1-999-888-7777",
        specialization: "Neurology",
        department: "Neuro Dept",
        yearsExperience: 20,
        bio: "Updated bio for the doctor",
      };

      axios
        .put(`http://localhost:3000/users/${userId}`, updateData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          console.log("  ✅ Doctor profile update successful!");
          console.log("  Response:", response.data);
          
          // Step 4: Verify update
          console.log("\n4️⃣ Verifying doctor update...");
          db.query("SELECT name, specialty, department, experience, bio, phone FROM users WHERE id = ?", [userId], (err, results) => {
            if (err) {
              console.error("  ❌ Error verifying:", err.message);
            } else {
              console.log("  ✅ Current doctor data in database:");
              console.log("    Name:", results[0].name);
              console.log("    Specialty:", results[0].specialty);
              console.log("    Department:", results[0].department);
              console.log("    Experience:", results[0].experience);
              console.log("    Bio:", results[0].bio);
              console.log("    Phone:", results[0].phone);
            }
            db.end();
          });
        })
        .catch((error) => {
          console.error("  ❌ Doctor profile update failed!");
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
