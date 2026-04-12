require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const db = require("./config/db");
const { signToken, authenticateToken, authorizeRoles } = require("./middleware/auth");

const app = express();

// Database schema initialization - creates missing columns automatically
const initializeSchema = () => {
  console.log("🔄 Initializing database schema...");
  
  const columns = [
    { name: "phone", type: "VARCHAR(20)" },
    { name: "blood_group", type: "VARCHAR(10)" },
    { name: "age", type: "INT" },
    { name: "gender", type: "VARCHAR(20)" },
    { name: "date_of_birth", type: "DATE" },
    { name: "address", type: "VARCHAR(255)" },
    { name: "emergency_contact", type: "VARCHAR(50)" },
    { name: "condition", type: "VARCHAR(255)" },
    { name: "specialty", type: "VARCHAR(100)" },
    { name: "department", type: "VARCHAR(100)" },
    { name: "bio", type: "TEXT" },
    { name: "rating", type: "DECIMAL(2,1) DEFAULT 4.5" },
    { name: "experience", type: "INT DEFAULT 0" },
  ];

  // Use promises to ensure columns are created sequentially
  const createColumnsSequentially = async () => {
    for (const column of columns) {
      await new Promise((resolve) => {
        // Simpler syntax: just try to add the column and catch duplicate column error
        const sql = `ALTER TABLE users ADD COLUMN \`${column.name}\` ${column.type}`;
        db.query(sql, (err) => {
          if (err) {
            // Ignore "Duplicate column" errors, show other errors but don't crash
            if (err.message.includes("Duplicate column") || err.message.includes("already exists")) {
              console.log(`  ℹ️  Column ${column.name} already exists`);
            } else {
              console.log(`  ⚠️  Column ${column.name}: ${err.message.substring(0, 60)}`);
            }
          } else {
            console.log(`  ✅ Column ${column.name} created`);
          }
          // Always resolve to continue with next column
          resolve();
        });
      });
    }
    console.log("✅ Database schema initialization complete!\n");
  };

  createColumnsSequentially().catch(() => {
    // Silently catch any errors, schema may already exist
    console.log("✅ Database ready\n");
  });
};

initializeSchema();


app.use(
  cors({
    origin: process.env.CORS_ORIGIN || ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/* TEST ENDPOINT */
app.get("/test", (req, res) => {
  res.json({ message: "✅ Backend is working!" });
});

/* DEBUG: Check database schema */
app.get("/debug/schema", (req, res) => {
  const dbName = process.env.DB_NAME || "medicare";
  const sql = `
    SELECT COLUMN_NAME, COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    ORDER BY ORDINAL_POSITION
  `;
  
  db.query(sql, [dbName], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error checking schema", error: err.message });
    }
    res.json({
      message: "Current users table columns:",
      columns: results.map(r => `${r.COLUMN_NAME} (${r.COLUMN_TYPE})`),
      count: results.length
    });
  });
});

/* REGISTER */
app.post("/register", async (req, res) => {
  console.log("Register attempt headers:", req.headers["content-type"]);
  console.log("Register attempt body:", req.body);
  const { name, email, password } = req.body;

  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim();
  const trimmedPassword = password?.trim();

  if (!trimmedName || !trimmedEmail || !trimmedPassword) {
    return res.status(400).json({ message: "❌ Please fill all fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
    const role = "patient";

    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

    db.query(sql, [trimmedName, trimmedEmail, hashedPassword, role], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "❌ Email already exists" });
        }
        return res.status(500).json({ message: "❌ Database error" });
      }

      res.json({ message: "✅ Registration successful" });
    });
  } catch (error) {
    console.error("Registration server error:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
});

/* LOGIN */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "❌ Please fill all fields" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "❌ User not found" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "❌ Incorrect password" });
    }

    const token = signToken({ id: user.id, role: user.role });

    res.json({
      message: "✅ Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        bloodGroup: user.blood_group || "",
        age: user.age || "",
        gender: user.gender || "",
        dateOfBirth: user.date_of_birth || "",
        address: user.address || "",
        emergencyContact: user.emergency_contact || "",
        role: user.role,
        specialty: user.specialty || "",
        department: user.department || "",
        experience: user.experience !== null ? parseInt(user.experience) : 0,
        bio: user.bio || "",
        rating: user.rating !== null ? parseFloat(user.rating) : null,
      },
    });
  });
});

app.get("/me", authenticateToken, (req, res) => {
  const sql = "SELECT id, name, email, phone, blood_group, age, gender, date_of_birth, address, emergency_contact, role, specialty, rating, experience, bio, department, created_at FROM users WHERE id = ?";
  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("❌ /me endpoint - Database error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }
    if (results.length === 0) {
      console.error("❌ /me endpoint - User not found, ID:", req.user.id);
      return res.status(404).json({ message: "User not found" });
    }
    const user = results[0];
    console.log("\n📖 GET /me - Fetching user data:");
    console.log("  User ID:", user.id);
    console.log("  Name:", user.name);
    console.log("  Experience DB value:", user.experience);
    console.log("  Bio DB value:", user.bio);
    console.log("  Department DB value:", user.department);
    console.log("  Specialty DB value:", user.specialty);
    
    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      bloodGroup: user.blood_group || "",
      age: user.age || "",
      gender: user.gender || "",
      dateOfBirth: user.date_of_birth || "",
      address: user.address || "",
      emergencyContact: user.emergency_contact || "",
      role: user.role,
      specialty: user.specialty || "",
      rating: user.rating !== null ? parseFloat(user.rating) : null,
      experience: user.experience !== null ? parseInt(user.experience) : 0,
      bio: user.bio || "",
      department: user.department || "",
    };
    
    console.log("\n📤 /me RESPONSE DATA:");
    console.log("  Specialty:", responseUser.specialty);
    console.log("  Department:", responseUser.department);
    console.log("  Experience:", responseUser.experience);
    console.log("  Bio:", responseUser.bio);
    
    res.json({ user: responseUser });
  });
});

/* FORGOT PASSWORD REQUEST */
app.post("/forgot-password/request", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const checkSql = "SELECT id FROM users WHERE email = ?";
  db.query(checkSql, [email], (err, results) => {
    if (err) {
      console.error("Password reset request DB error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.json({ message: "If that email exists, a reset token has been generated" });
    }

    const userId = results[0].id;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const insertSql = "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)";
    db.query(insertSql, [userId, token, expiresAt], (insertErr) => {
      if (insertErr) {
        console.error("Password reset token DB error:", insertErr.message);
      }

      res.json({
        message: "If that email exists, a reset token has been generated",
        resetToken: token,
      });
    });
  });
});

app.post("/forgot-password/reset", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  const tokenSql = "SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = ?";
  db.query(tokenSql, [token], async (err, results) => {
    if (err) {
      console.error("Password reset verify DB error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0 || results[0].used) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const tokenRow = results[0];
    const expiresAt = new Date(tokenRow.expires_at);
    if (expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateSql = "UPDATE users SET password = ? WHERE id = ?";

    db.query(updateSql, [hashedPassword, tokenRow.user_id], (updateErr) => {
      if (updateErr) {
        console.error("Password reset update DB error:", updateErr.message);
        return res.status(500).json({ message: "Database error" });
      }

      const markUsedSql = "UPDATE password_reset_tokens SET used = 1 WHERE token = ?";
      db.query(markUsedSql, [token], () => {
        res.json({ message: "Password reset successfully" });
      });
    });
  });
});

/* GET ALL PATIENTS */
app.get("/patients", authenticateToken, authorizeRoles("doctor", "admin"), (req, res) => {
  const sql = "SELECT id, name, email, role, age, gender, phone, blood_group, `condition` FROM users WHERE role = 'patient'";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get patients DB error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }
    
    res.json({ 
      message: "Patients retrieved successfully",
      patients: results
    });
  });
});

/* GET ALL DOCTORS */
app.get("/doctors", authenticateToken, (req, res) => {
  const sql = "SELECT id, name, email, role, specialty, department, phone, rating, experience FROM users WHERE role = 'doctor'";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get doctors DB error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }
    
    // Convert rating and experience to proper types
    const doctorsWithTypes = results.map(doc => ({
      ...doc,
      rating: doc.rating !== null ? parseFloat(doc.rating) : null,
      experience: doc.experience !== null ? parseInt(doc.experience) : null
    }));
    
    console.log("Doctors query results:", doctorsWithTypes);
    res.json({ 
      message: "Doctors retrieved successfully",
      doctors: doctorsWithTypes
    });
  });
});

/* CREATE APPOINTMENT */
app.post("/appointments", authenticateToken, authorizeRoles("patient"), (req, res) => {
  const { patientId, doctorId, date, time, type, status } = req.body;
  
  if (!patientId || !doctorId || !date || !time) {
    return res.status(400).json({ message: "❌ Please fill all required fields" });
  }

  if (req.user.role === "patient" && req.user.id !== Number(patientId)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  
  const sql = "INSERT INTO appointments (patient_id, doctor_id, date, time, type, status) VALUES (?, ?, ?, ?, ?, ?)";
  
  db.query(sql, [patientId, doctorId, date, time, type || "Consultation", status || "Pending"], (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to create appointment" });
    }
    
    res.json({ message: "✅ Appointment created successfully" });
  });
});

/* GET APPOINTMENTS */
app.get("/appointments/:userId", authenticateToken, (req, res) => {
  const { userId } = req.params;

  if (req.user.role === "patient" && req.user.id !== Number(userId)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  if (req.user.role === "doctor" && req.user.id !== Number(userId)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  
  const sql = "SELECT * FROM appointments WHERE patient_id = ? OR doctor_id = ? ORDER BY date DESC";
  
  db.query(sql, [userId, userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({ 
      message: "✅ Appointments retrieved successfully",
      appointments: results
    });
  });
});

/* UPDATE APPOINTMENT STATUS */
app.put("/appointments/:appointmentId", (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ message: "❌ Status is required" });
  }
  
  const sql = "UPDATE appointments SET status = ? WHERE id = ?";
  
  db.query(sql, [status, appointmentId], (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to update appointment" });
    }
    
    res.json({ message: "✅ Appointment updated successfully" });
  });
});

/* CREATE MEDICAL RECORD */
app.post("/medical-records", (req, res) => {
  const { patientId, doctorId, title, diagnosis, treatment, notes, status, recordDate } = req.body;

  if (!patientId || !doctorId || !diagnosis || !treatment) {
    return res.status(400).json({ message: "❌ Please fill all required fields" });
  }

  const recordTitle = title || diagnosis;
  const sql = "INSERT INTO medical_records (patient_id, doctor_id, title, diagnosis, treatment, notes, status, record_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  db.query(
    sql,
    [patientId, doctorId, recordTitle, diagnosis, treatment, notes || "", status || "Active", recordDate || new Date()],
    (err) => {
      if (err) {
        console.error("Error creating medical record:", err);
        return res.status(500).json({ message: "❌ Failed to create medical record" });
      }

      const updateConditionSql = "UPDATE users SET `condition` = ? WHERE id = ?";
      db.query(updateConditionSql, [diagnosis, patientId], (updateErr) => {
        if (updateErr) {
          console.error("Error updating patient condition:", updateErr);
          return res.status(500).json({ message: "❌ Medical record created, but failed to update patient condition" });
        }

        res.json({ message: "✅ Medical record created successfully" });
      });
    }
  );
});

/* GET MEDICAL RECORDS */
app.get("/medical-records/:patientId", authenticateToken, (req, res) => {
  const { patientId } = req.params;

  if (req.user.role === "patient" && req.user.id !== Number(patientId)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const sql = "SELECT mr.*, u.name AS patient_name, d.name AS doctor_name FROM medical_records mr JOIN users u ON mr.patient_id = u.id JOIN users d ON mr.doctor_id = d.id WHERE mr.patient_id = ? ORDER BY mr.record_date DESC";
  
  db.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({ 
      message: "✅ Medical records retrieved successfully",
      records: results
    });
  });
});

/* UPDATE USER PROFILE */
app.put("/users/:userId", authenticateToken, (req, res) => {
  const { userId } = req.params;
  const { name, email, phone, bloodGroup, age, gender, dateOfBirth, address, emergencyContact, specialization, department, yearsExperience, bio } = req.body;

  console.log("Profile update request:");
  console.log("userId param:", userId);
  console.log("req.user:", req.user);
  console.log("req.body:", req.body);

  if (!userId || !name || !email) {
    return res.status(400).json({ message: "❌ Missing required fields: userId, name, email" });
  }

  if (req.user.role !== "admin" && req.user.id !== Number(userId)) {
    console.log("Authorization failed:", { userRole: req.user.role, userId: req.user.id, requestedUserId: userId });
    return res.status(403).json({ message: "Forbidden" });
  }

  const parsedAge = age !== undefined && age !== null && age !== "" ? Number(age) : null;
  const parsedExperience = yearsExperience !== undefined && yearsExperience !== null && yearsExperience !== "" ? Number(yearsExperience) : null;
  const sql = "UPDATE users SET name = ?, email = ?, phone = ?, blood_group = ?, age = ?, gender = ?, date_of_birth = ?, address = ?, emergency_contact = ?, specialty = ?, department = ?, experience = ?, bio = ? WHERE id = ?";

  console.log("\n📝 UPDATE PROFILE DETAILS:");
  console.log("  User ID:", userId);
  console.log("  Name:", name);
  console.log("  Experience:", parsedExperience);
  console.log("  Specialization:", specialization);
  console.log("  Department:", department);
  console.log("  Bio:", bio);

  db.query(
    sql,
    [
      name,
      email,
      phone || null,
      bloodGroup || null,
      parsedAge,
      gender || null,
      dateOfBirth || null,
      address || null,
      emergencyContact || null,
      specialization || null,
      department || null,
      parsedExperience,
      bio || null,
      userId,
    ],
    (err, result) => {
      if (err) {
        console.error("\n❌ DATABASE ERROR:");
        console.error("  Message:", err.message);
        console.error("  Code:", err.code);
        console.error("  SQL:", sql);
        return res.status(500).json({ message: "❌ Failed to update profile", error: err.message });
      }

      console.log("\n✅ UPDATE SUCCESSFUL:");
      console.log("  Rows affected:", result.affectedRows);
      
      if (result.affectedRows === 0) {
        console.log("  ⚠️ No rows were updated!");
        return res.status(404).json({ message: "❌ User not found" });
      }

      console.log("Profile updated successfully for user:", userId);
      const selectSql = "SELECT id, name, email, phone, blood_group AS bloodGroup, age, gender, date_of_birth AS dateOfBirth, address, emergency_contact AS emergencyContact, role, specialty, department, experience, bio, rating FROM users WHERE id = ?";
      db.query(selectSql, [userId], (selectErr, selectResults) => {
        if (selectErr) {
          console.error("Failed to retrieve updated user:", selectErr);
          return res.status(500).json({ message: "✅ Profile updated successfully" });
        }

        const user = selectResults[0];
        const responseUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          bloodGroup: user.bloodGroup || "",
          age: user.age || "",
          gender: user.gender || "",
          dateOfBirth: user.dateOfBirth || "",
          address: user.address || "",
          emergencyContact: user.emergencyContact || "",
          role: user.role,
          specialty: user.specialty || "",
          department: user.department || "",
          experience: user.experience !== null ? parseInt(user.experience) : 0,
          bio: user.bio || "",
          rating: user.rating !== null ? parseFloat(user.rating) : null,
        };

        console.log("\n📤 RESPONSE DATA:");
        console.log("  Specialty:", responseUser.specialty);
        console.log("  Department:", responseUser.department);
        console.log("  Experience:", responseUser.experience);
        console.log("  Bio:", responseUser.bio);

        res.json({
          message: "✅ Profile updated successfully",
          user: responseUser,
        });
      });
    }
  );
});

/* DELETE APPOINTMENT */
app.delete("/appointments/:appointmentId", authenticateToken, (req, res) => {
  const { appointmentId } = req.params;
  
  if (req.user.role !== "admin" && req.user.role !== "doctor") {
    return res.status(403).json({ message: "Forbidden" });
  }
  
  const sql = "DELETE FROM appointments WHERE id = ?";
  
  db.query(sql, [appointmentId], (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to delete appointment" });
    }
    
    res.json({ message: "✅ Appointment deleted successfully" });
  });
});

/* DELETE MEDICAL RECORD */
app.delete("/medical-records/:recordId", authenticateToken, authorizeRoles("doctor", "admin"), (req, res) => {
  const { recordId } = req.params;
  
  const sql = "DELETE FROM medical_records WHERE id = ?";
  
  db.query(sql, [recordId], (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to delete medical record" });
    }
    
    res.json({ message: "✅ Medical record deleted successfully" });
  });
});

/* DELETE USER (ADMIN ONLY) */
app.delete("/users/:userId", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const { userId } = req.params;
  
  const sql = "DELETE FROM users WHERE id = ?";
  
  db.query(sql, [userId], (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to delete user" });
    }
    
    res.json({ message: "✅ User deleted successfully" });
  });
});

/* ===== COMPLETE CRUD OPERATIONS ===== */

/* GET USER BY ID */
app.get("/users/:userId", (req, res) => {
  const { userId } = req.params;
  
  const sql = "SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?";
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "❌ User not found" });
    }
    
    res.json({ 
      message: "✅ User retrieved successfully",
      user: results[0]
    });
  });
});

/* GET SINGLE PATIENT BY ID */
app.get("/patients/:patientId", (req, res) => {
  const { patientId } = req.params;
  
  const sql = "SELECT id, name, email, phone, role FROM users WHERE id = ? AND role = 'patient'";
  
  db.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "❌ Patient not found" });
    }
    
    res.json({ 
      message: "✅ Patient retrieved successfully",
      patient: results[0]
    });
  });
});

/* GET SINGLE DOCTOR BY ID */
app.get("/doctors/:doctorId", (req, res) => {
  const { doctorId } = req.params;
  
  const sql = "SELECT id, name, email, phone, role FROM users WHERE id = ? AND role = 'doctor'";
  
  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "❌ Doctor not found" });
    }
    
    res.json({ 
      message: "✅ Doctor retrieved successfully",
      doctor: results[0]
    });
  });
});

/* GET ALL APPOINTMENTS */
app.get("/appointments", (req, res) => {
  const sql = "SELECT * FROM appointments ORDER BY date DESC";
  
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({ 
      message: "✅ All appointments retrieved successfully",
      appointments: results
    });
  });
});

/* GET SINGLE APPOINTMENT BY ID */
app.get("/appointments-details/:appointmentId", (req, res) => {
  const { appointmentId } = req.params;
  
  const sql = "SELECT * FROM appointments WHERE id = ?";
  
  db.query(sql, [appointmentId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "❌ Appointment not found" });
    }
    
    res.json({ 
      message: "✅ Appointment retrieved successfully",
      appointment: results[0]
    });
  });
});

/* PATCH/UPDATE APPOINTMENT WITH ALL FIELDS */
app.patch("/appointments/:appointmentId", (req, res) => {
  const { appointmentId } = req.params;
  const { date, time, type, status, notes } = req.body;
  
  if (date === undefined && time === undefined && type === undefined && status === undefined && notes === undefined) {
    return res.status(400).json({ message: "❌ No fields to update" });
  }
  
  let updateFields = [];
  let params = [];
  
  if (date !== undefined) {
    updateFields.push("date = ?");
    params.push(date);
  }
  if (time !== undefined) {
    updateFields.push("time = ?");
    params.push(time);
  }
  if (type !== undefined) {
    updateFields.push("type = ?");
    params.push(type);
  }
  if (status !== undefined) {
    updateFields.push("status = ?");
    params.push(status);
  }
  if (notes !== undefined) {
    updateFields.push("notes = ?");
    params.push(notes);
  }
  
  params.push(appointmentId);
  const sql = `UPDATE appointments SET ${updateFields.join(", ")} WHERE id = ?`;
  
  db.query(sql, params, (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to update appointment" });
    }
    
    res.json({ message: "✅ Appointment updated successfully" });
  });
});

/* GET SINGLE MEDICAL RECORD BY ID */
app.get("/medical-records-details/:recordId", (req, res) => {
  const { recordId } = req.params;
  
  const sql = "SELECT * FROM medical_records WHERE id = ?";
  
  db.query(sql, [recordId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "❌ Medical record not found" });
    }
    
    res.json({ 
      message: "✅ Medical record retrieved successfully",
      record: results[0]
    });
  });
});

/* PATCH/UPDATE MEDICAL RECORD */
app.patch("/medical-records/:recordId", (req, res) => {
  const { recordId } = req.params;
  const { title, diagnosis, treatment, notes, status, record_date } = req.body;

  if (title === undefined && diagnosis === undefined && treatment === undefined && notes === undefined && status === undefined && record_date === undefined) {
    return res.status(400).json({ message: "❌ No fields to update" });
  }

  let updateFields = [];
  let params = [];

  if (title !== undefined) {
    updateFields.push("title = ?");
    params.push(title);
  }
  if (diagnosis !== undefined) {
    updateFields.push("diagnosis = ?");
    params.push(diagnosis);
  }
  if (treatment !== undefined) {
    updateFields.push("treatment = ?");
    params.push(treatment);
  }
  if (notes !== undefined) {
    updateFields.push("notes = ?");
    params.push(notes);
  }
  if (status !== undefined) {
    updateFields.push("status = ?");
    params.push(status);
  }
  if (record_date !== undefined) {
    updateFields.push("record_date = ?");
    params.push(record_date);
  }

  params.push(recordId);
  const sql = `UPDATE medical_records SET ${updateFields.join(", ")} WHERE id = ?`;

  db.query(sql, params, (err) => {
    if (err) {
      console.error("Error updating medical record:", err);
      return res.status(500).json({ message: "❌ Failed to update medical record" });
    }

    if (diagnosis !== undefined) {
      const fetchPatientSql = "SELECT patient_id FROM medical_records WHERE id = ?";
      db.query(fetchPatientSql, [recordId], (fetchErr, fetchResults) => {
        if (fetchErr || fetchResults.length === 0) {
          console.error("Error fetching record patient for condition update:", fetchErr);
          return res.status(500).json({ message: "❌ Medical record updated, but failed to locate patient" });
        }

        const patientId = fetchResults[0].patient_id;
        const updateConditionSql = "UPDATE users SET `condition` = ? WHERE id = ?";
        db.query(updateConditionSql, [diagnosis, patientId], (updateErr) => {
          if (updateErr) {
            console.error("Error updating patient condition:", updateErr);
            return res.status(500).json({ message: "❌ Medical record updated, but failed to update patient condition" });
          }

          res.json({ message: "✅ Medical record updated successfully" });
        });
      });
    } else {
      res.json({ message: "✅ Medical record updated successfully" });
    }
  });
});

/* GET ALL MEDICAL RECORDS (ADMIN) */
app.get("/admin/medical-records", (req, res) => {
  const sql = "SELECT mr.*, u.name as patient_name, d.name as doctor_name FROM medical_records mr JOIN users u ON mr.patient_id = u.id JOIN users d ON mr.doctor_id = d.id ORDER BY mr.record_date DESC";
  
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({ 
      message: "✅ All medical records retrieved successfully",
      records: results
    });
  });
});

/* GET MEDICAL RECORDS FOR AUTHENTICATED DOCTOR */
app.get("/doctor/medical-records", authenticateToken, authorizeRoles("doctor"), (req, res) => {
  const doctorId = req.user.id;
  const sql = `
    SELECT 
      mr.*,
      u.name as patient_name,
      u.email as patient_email,
      u.phone as patient_phone,
      u.age as patient_age,
      u.gender as patient_gender,
      u.blood_group as patient_blood_group,
      u.date_of_birth as patient_dob,
      u.address as patient_address,
      u.emergency_contact as patient_emergency_contact
    FROM medical_records mr 
    JOIN users u ON mr.patient_id = u.id 
    WHERE mr.doctor_id = ? 
    ORDER BY mr.record_date DESC
  `;

  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      console.error("Get medical records DB error:", err.message);
      return res.status(500).json({ message: "❌ Database error" });
    }

    res.json({ 
      message: "✅ Medical records retrieved successfully",
      records: results
    });
  });
});

/* SEARCH PATIENTS BY NAME */
app.get("/search/patients/:query", authenticateToken, authorizeRoles("doctor", "admin"), (req, res) => {
  const { query } = req.params;
  const searchTerm = `%${query}%`;
  
  const sql = "SELECT id, name, email, phone, role FROM users WHERE role = 'patient' AND (name LIKE ? OR email LIKE ?)";
  
  db.query(sql, [searchTerm, searchTerm], (err, results) => {
    if (err) {
      console.error("Search patients DB error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }
    
    res.json({ 
      message: "✅ Search results retrieved",
      patients: results
    });
  });
});

/* SEARCH DOCTORS BY NAME OR SPECIALTY */
app.get("/search/doctors/:query", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const { query } = req.params;
  const searchTerm = `%${query}%`;
  
  const sql = "SELECT id, name, email, phone, role FROM users WHERE role = 'doctor' AND (name LIKE ? OR email LIKE ?)";
  
  db.query(sql, [searchTerm, searchTerm], (err, results) => {
    if (err) {
      console.error("Search doctors DB error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }
    
    res.json({ 
      message: "✅ Search results retrieved",
      doctors: results
    });
  });
});

/* GET APPOINTMENTS BY STATUS */
app.get("/appointments-status/:status", (req, res) => {
  const { status } = req.params;
  
  const sql = "SELECT * FROM appointments WHERE status = ? ORDER BY date DESC";
  
  db.query(sql, [status], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({ 
      message: `✅ Appointments with status '${status}' retrieved successfully`,
      appointments: results
    });
  });
});

/* GET APPOINTMENTS BY PATIENT AND DATE RANGE */
app.get("/appointments-range/:patientId/:startDate/:endDate", (req, res) => {
  const { patientId, startDate, endDate } = req.params;
  
  const sql = "SELECT * FROM appointments WHERE patient_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC";
  
  db.query(sql, [patientId, startDate, endDate], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({ 
      message: "✅ Appointments in date range retrieved successfully",
      appointments: results
    });
  });
});

/* GET ALL APPOINTMENTS (ADMIN) */
app.get("/admin/appointments", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const sql = "SELECT a.*, p.name as patient_name, p.email as patient_email, d.name as doctor_name, d.specialty FROM appointments a JOIN users p ON a.patient_id = p.id JOIN users d ON a.doctor_id = d.id ORDER BY a.date DESC";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get all appointments DB error:", err.message);
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({ 
      message: "✅ All appointments retrieved successfully",
      appointments: results
    });
  });
});

/* CREATE PRESCRIPTION */
app.post("/prescriptions", (req, res) => {
  const { appointmentId, patientId, doctorId, medication, dosage, instructions, prescribed_date } = req.body;
  
  if (!appointmentId || !patientId || !doctorId || !medication || !dosage) {
    return res.status(400).json({ message: "❌ Please fill all required fields" });
  }
  
  const sql = "INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, medication, dosage, instructions, prescribed_date) VALUES (?, ?, ?, ?, ?, ?, ?)";
  
  db.query(sql, [appointmentId, patientId, doctorId, medication, dosage, instructions || "", prescribed_date || new Date()], (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to create prescription" });
    }
    
    res.json({ message: "✅ Prescription created successfully" });
  });
});

/* GET PRESCRIPTIONS BY APPOINTMENT */
app.get("/prescriptions/:appointmentId", (req, res) => {
  const { appointmentId } = req.params;
  
  const sql = "SELECT * FROM prescriptions WHERE appointment_id = ?";
  
  db.query(sql, [appointmentId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({ 
      message: "✅ Prescriptions retrieved successfully",
      prescriptions: results
    });
  });
});

/* GET PRESCRIPTIONS BY PATIENT */
app.get("/prescriptions-patient/:patientId", (req, res) => {
  const { patientId } = req.params;
  
  const sql = "SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY prescribed_date DESC";
  
  db.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({ 
      message: "✅ Prescriptions retrieved successfully",
      prescriptions: results
    });
  });
});

/* GET PRESCRIPTIONS FOR AUTHENTICATED DOCTOR */
app.get("/doctor/prescriptions", authenticateToken, authorizeRoles("doctor"), (req, res) => {
  const doctorId = req.user.id;

  const sql = `
    SELECT p.*, u.name AS patient_name, a.date AS appointment_date, a.time AS appointment_time
    FROM prescriptions p
    LEFT JOIN users u ON p.patient_id = u.id
    LEFT JOIN appointments a ON p.appointment_id = a.id
    WHERE p.doctor_id = ?
    ORDER BY p.prescribed_date DESC
  `;

  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      console.error("Error fetching prescriptions for doctor:", err);
      return res.status(500).json({ message: "❌ Database error" });
    }

    res.json({ 
      message: "✅ Doctor prescriptions retrieved successfully",
      prescriptions: results
    });
  });
});

/* UPDATE PRESCRIPTION */
app.patch("/prescriptions/:prescriptionId", (req, res) => {
  const { prescriptionId } = req.params;
  const { medication, dosage, instructions } = req.body;
  
  if (!medication && !dosage && !instructions) {
    return res.status(400).json({ message: "❌ No fields to update" });
  }
  
  let updateFields = [];
  let params = [];
  
  if (medication) {
    updateFields.push("medication = ?");
    params.push(medication);
  }
  if (dosage) {
    updateFields.push("dosage = ?");
    params.push(dosage);
  }
  if (instructions) {
    updateFields.push("instructions = ?");
    params.push(instructions);
  }
  
  params.push(prescriptionId);
  const sql = `UPDATE prescriptions SET ${updateFields.join(", ")} WHERE id = ?`;
  
  db.query(sql, params, (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to update prescription" });
    }
    
    res.json({ message: "✅ Prescription updated successfully" });
  });
});

/* DELETE PRESCRIPTION */
app.delete("/prescriptions/:prescriptionId", authenticateToken, authorizeRoles("doctor", "admin"), (req, res) => {
  const { prescriptionId } = req.params;
  
  const sql = "DELETE FROM prescriptions WHERE id = ?";
  
  db.query(sql, [prescriptionId], (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to delete prescription" });
    }
    
    res.json({ message: "✅ Prescription deleted successfully" });
  });
});

/* GET DASHBOARD STATISTICS */
app.get("/admin/stats", (req, res) => {
  const queries = {
    totalPatients: "SELECT COUNT(*) as count FROM users WHERE role = 'patient'",
    totalDoctors: "SELECT COUNT(*) as count FROM users WHERE role = 'doctor'",
    totalAppointments: "SELECT COUNT(*) as count FROM appointments",
    totalMedicalRecords: "SELECT COUNT(*) as count FROM medical_records",
    pendingAppointments: "SELECT COUNT(*) as count FROM appointments WHERE status = 'Pending'",
    completedAppointments: "SELECT COUNT(*) as count FROM appointments WHERE status = 'Completed'"
  };
  
  let stats = {};
  let completedQueries = 0;
  
  Object.keys(queries).forEach(key => {
    db.query(queries[key], (err, results) => {
      if (!err && results.length > 0) {
        stats[key] = results[0].count;
      }
      completedQueries++;
      
      if (completedQueries === Object.keys(queries).length) {
        res.json({ 
          message: "✅ Statistics retrieved successfully",
          stats 
        });
      }
    });
  });
});

/* SERVER */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});