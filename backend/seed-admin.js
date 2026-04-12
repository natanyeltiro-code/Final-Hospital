const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "@Nathaniel123",
  database: "medicare",
});

db.connect((err) => {
  if (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
  console.log("✅ Connected to Medicare database");
  createAdminUser();
});

async function createAdminUser() {
  try {
    // Hash the admin password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Check if admin already exists
    db.query("SELECT * FROM users WHERE email = ?", ["admin@hospital.com"], (err, results) => {
      if (err) {
        console.error("❌ Error checking for admin:", err);
        process.exit(1);
      }

      if (results.length > 0) {
        // Update existing admin
        db.query(
          "UPDATE users SET password = ? WHERE email = ?",
          [hashedPassword, "admin@hospital.com"],
          (err) => {
            if (err) {
              console.error("❌ Error updating admin:", err);
              process.exit(1);
            }
            console.log("✅ Admin user updated successfully!");
            console.log("📧 Email: admin@hospital.com");
            console.log("🔐 Password: admin123");
            closeConnection();
          }
        );
      } else {
        // Create new admin
        db.query(
          "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)",
          ["Admin User", "admin@hospital.com", hashedPassword, "admin", "+1 234-567-8900"],
          (err) => {
            if (err) {
              console.error("❌ Error creating admin:", err);
              process.exit(1);
            }
            console.log("✅ Admin user created successfully!");
            console.log("📧 Email: admin@hospital.com");
            console.log("🔐 Password: admin123");
            closeConnection();
          }
        );
      }
    });
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

function closeConnection() {
  db.end(() => {
    console.log("✅ Connection closed");
    process.exit(0);
  });
}
