require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");

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
    
    // Now fix appointments table
    await new Promise((resolve) => {
      console.log("  🔧 Modifying appointments table...");
      const alterSQL = `ALTER TABLE appointments MODIFY patient_id INT NULL`;
      db.query(alterSQL, (err) => {
        if (err && !err.message.includes("already exists")) {
          console.log(`  ℹ️  patient_id: ${err.message.substring(0, 60)}`);
        } else if (!err) {
          console.log(`  ✅ patient_id changed to nullable`);
        }
        resolve();
      });
    });
    
    // Add patient_name column
    await new Promise((resolve) => {
      const sql = `ALTER TABLE appointments ADD COLUMN patient_name VARCHAR(255)`;
      db.query(sql, (err) => {
        if (err) {
          if (err.message.includes("Duplicate column") || err.message.includes("already exists")) {
            console.log(`  ℹ️  Column patient_name already exists`);
          } else {
            console.log(`  ⚠️  patient_name: ${err.message.substring(0, 60)}`);
          }
        } else {
          console.log(`  ✅ patient_name column added`);
        }
        resolve();
      });
    });
    
    // Add patient_phone column
    await new Promise((resolve) => {
      const sql = `ALTER TABLE appointments ADD COLUMN patient_phone VARCHAR(20)`;
      db.query(sql, (err) => {
        if (err) {
          if (err.message.includes("Duplicate column") || err.message.includes("already exists")) {
            console.log(`  ℹ️  Column patient_phone already exists`);
          } else {
            console.log(`  ⚠️  patient_phone: ${err.message.substring(0, 60)}`);
          }
        } else {
          console.log(`  ✅ patient_phone column added`);
        }
        resolve();
      });
    });
    
    // Create notifications table
    await new Promise((resolve) => {
      console.log("  🔧 Creating notifications table...");
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'system',
          is_read BOOLEAN DEFAULT FALSE,
          related_entity_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `;
      db.query(createTableSQL, (err) => {
        if (err) {
          if (err.message.includes("already exists")) {
            console.log(`  ℹ️  notifications table already exists`);
          } else {
            console.log(`  ⚠️  notifications table: ${err.message.substring(0, 60)}`);
          }
        } else {
          console.log(`  ✅ notifications table created`);
        }
        resolve();
      });
    });

    // Create notification_preferences table
    await new Promise((resolve) => {
      console.log("  🔧 Creating notification_preferences table...");
      const createPreferencesSQL = `
        CREATE TABLE IF NOT EXISTS notification_preferences (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          email_notifications BOOLEAN DEFAULT TRUE,
          sms_notifications BOOLEAN DEFAULT FALSE,
          push_notifications BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `;
      db.query(createPreferencesSQL, (err) => {
        if (err) {
          if (err.message.includes("already exists")) {
            console.log(`  ℹ️  notification_preferences table already exists`);
          } else {
            console.log(`  ⚠️  notification_preferences table: ${err.message.substring(0, 60)}`);
          }
        } else {
          console.log(`  ✅ notification_preferences table created`);
        }
        resolve();
      });
    });

    // Add columns to users table for availability system
    const availabilityColumns = [
      { name: "status", type: "ENUM('Available', 'Busy', 'Off-duty') DEFAULT 'Available'" },
      { name: "last_status_update", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
      { name: "work_start_time", type: "TIME DEFAULT '09:00:00'" },
      { name: "work_end_time", type: "TIME DEFAULT '18:00:00'" },
    ];

    for (const column of availabilityColumns) {
      await new Promise((resolve) => {
        const sql = `ALTER TABLE users ADD COLUMN \`${column.name}\` ${column.type}`;
        db.query(sql, (err) => {
          if (err) {
            if (err.message.includes("Duplicate column") || err.message.includes("already exists")) {
              console.log(`  ℹ️  Column ${column.name} already exists`);
            } else {
              console.log(`  ⚠️  Column ${column.name}: ${err.message.substring(0, 60)}`);
            }
          } else {
            console.log(`  ✅ Column ${column.name} added to users table`);
          }
          resolve();
        });
      });
    }

    // Create doctor_schedule table
    await new Promise((resolve) => {
      console.log("  🔧 Creating doctor_schedule table...");
      const createScheduleSQL = `
        CREATE TABLE IF NOT EXISTS doctor_schedule (
          id INT PRIMARY KEY AUTO_INCREMENT,
          doctor_id INT NOT NULL,
          schedule_date DATE NOT NULL,
          schedule_type ENUM('Available', 'Leave', 'Off') DEFAULT 'Available',
          reason VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_schedule (doctor_id, schedule_date),
          INDEX idx_doctor_date (doctor_id, schedule_date)
        )
      `;
      db.query(createScheduleSQL, (err) => {
        if (err) {
          if (err.message.includes("already exists")) {
            console.log(`  ℹ️  doctor_schedule table already exists`);
          } else {
            console.log(`  ⚠️  doctor_schedule table: ${err.message.substring(0, 60)}`);
          }
        } else {
          console.log(`  ✅ doctor_schedule table created`);
        }
        resolve();
      });
    });

    // Add columns to appointments table for availability system
    const appointmentColumns = [
      { name: "slot_id", type: "INT" },
      { name: "appointment_duration", type: "INT DEFAULT 30" },
    ];

    for (const column of appointmentColumns) {
      await new Promise((resolve) => {
        const sql = `ALTER TABLE appointments ADD COLUMN \`${column.name}\` ${column.type}`;
        db.query(sql, (err) => {
          if (err) {
            if (err.message.includes("Duplicate column") || err.message.includes("already exists")) {
              console.log(`  ℹ️  Column ${column.name} already exists in appointments`);
            } else {
              console.log(`  ⚠️  Column ${column.name}: ${err.message.substring(0, 60)}`);
            }
          } else {
            console.log(`  ✅ Column ${column.name} added to appointments table`);
          }
          resolve();
        });
      });
    }

    // Ensure prescriptions table supports medical-record linking
    await new Promise((resolve) => {
      const sql = "ALTER TABLE prescriptions MODIFY appointment_id INT NULL";
      db.query(sql, (err) => {
        if (err) {
          console.log(`  ℹ️  prescriptions.appointment_id: ${err.message.substring(0, 60)}`);
        } else {
          console.log("  ✅ prescriptions.appointment_id changed to nullable");
        }
        resolve();
      });
    });

    await new Promise((resolve) => {
      const sql = "ALTER TABLE prescriptions ADD COLUMN medical_record_id INT NULL AFTER appointment_id";
      db.query(sql, (err) => {
        if (err) {
          if (err.message.includes("Duplicate column") || err.message.includes("already exists")) {
            console.log("  ℹ️  Column medical_record_id already exists in prescriptions");
          } else {
            console.log(`  ⚠️  prescriptions.medical_record_id: ${err.message.substring(0, 60)}`);
          }
        } else {
          console.log("  ✅ Column medical_record_id added to prescriptions");
        }
        resolve();
      });
    });

    await new Promise((resolve) => {
      const sql =
        "ALTER TABLE prescriptions ADD CONSTRAINT fk_prescriptions_medical_record FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE SET NULL";
      db.query(sql, (err) => {
        if (err) {
          if (
            err.message.includes("Duplicate key") ||
            err.message.includes("already exists") ||
            err.message.includes("errno: 121")
          ) {
            console.log("  ℹ️  Foreign key fk_prescriptions_medical_record already exists");
          } else {
            console.log(`  ⚠️  prescriptions FK medical_record_id: ${err.message.substring(0, 60)}`);
          }
        } else {
          console.log("  ✅ Foreign key for prescriptions.medical_record_id created");
        }
        resolve();
      });
    });

    // Ensure medical_records status supports "Completed"
    await new Promise((resolve) => {
      const sql =
        "ALTER TABLE medical_records MODIFY status ENUM('Draft', 'Active', 'Archived', 'Reviewed', 'Completed') DEFAULT 'Active'";
      db.query(sql, (err) => {
        if (err) {
          console.log(`  ⚠️  medical_records.status enum: ${err.message.substring(0, 60)}`);
        } else {
          console.log("  ✅ medical_records.status enum updated with Completed");
        }
        resolve();
      });
    });

    // Create available_slots table
    await new Promise((resolve) => {
      console.log("  🔧 Creating available_slots table...");
      const createSlotsSQL = `
        CREATE TABLE IF NOT EXISTS available_slots (
          id INT PRIMARY KEY AUTO_INCREMENT,
          doctor_id INT NOT NULL,
          slot_date DATE NOT NULL,
          slot_time TIME NOT NULL,
          duration_minutes INT DEFAULT 30,
          is_available BOOLEAN DEFAULT TRUE,
          appointment_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
          UNIQUE KEY unique_slot (doctor_id, slot_date, slot_time),
          INDEX idx_doctor_available (doctor_id, is_available)
        )
      `;
      db.query(createSlotsSQL, (err) => {
        if (err) {
          if (err.message.includes("already exists")) {
            console.log(`  ℹ️  available_slots table already exists`);
          } else {
            console.log(`  ⚠️  available_slots table: ${err.message.substring(0, 60)}`);
          }
        } else {
          console.log(`  ✅ available_slots table created`);
        }
        resolve();
      });
    });
    
    console.log("✅ Database schema initialization complete!\n");
  };

  createColumnsSequentially().catch(() => {
    // Silently catch any errors, schema may already exist
    console.log("✅ Database ready\n");
  });
};

const isServerless = process.env.VERCEL === "1";
if (!isServerless) {
  initializeSchema();
}


app.use(
  cors({
    origin: (origin, callback) => {
      const configuredOrigins = (process.env.CORS_ORIGIN || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const defaultOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "https://project-jrwhp.vercel.app",
      ];
      const allowedOrigins = configuredOrigins.length ? configuredOrigins : defaultOrigins;

      // Allow same-origin/no-origin requests (e.g., direct function calls, curl).
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      try {
        if (/\.vercel\.app$/i.test(new URL(origin).hostname)) return callback(null, true);
      } catch (_err) {
        // Ignore URL parse errors and treat as disallowed origin below.
      }

      return callback(new Error("CORS not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/* HELPER FUNCTION: Generate notifications for new appointments */
const generateAppointmentNotifications = (appointmentId, patientId, doctorId, emergencyPatientName) => {
  // Get doctor name to personalize messages
  db.query("SELECT name FROM users WHERE id = ?", [doctorId], (err, doctorResults) => {
    if (err || !doctorResults.length) {
      console.log("⚠️  Could not fetch doctor name:", err?.message);
      return;
    }
    
    const doctorName = doctorResults[0].name;
    
    // Notify the doctor
    const doctorNotificationSql = `
      INSERT INTO notifications (user_id, title, message, type, related_entity_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    // For emergency patients, notify doctor with patient name
    if (emergencyPatientName) {
      const doctorMsg = `New emergency appointment booked with patient ${emergencyPatientName}`;
      db.query(doctorNotificationSql, [doctorId, "New Appointment", doctorMsg, "appointment", appointmentId], (err) => {
        if (err) console.log("⚠️  Could not create doctor notification:", err.message);
        else console.log("✅ Doctor notification created");
      });
    } else if (patientId && patientId > 0) {
      // For registered patients, get their name for better notification
      db.query("SELECT name FROM users WHERE id = ?", [patientId], (err, patientResults) => {
        let doctorMsg = "New appointment booked";
        if (patientResults && patientResults.length > 0) {
          doctorMsg = `New appointment booked with ${patientResults[0].name}`;
        }
        db.query(doctorNotificationSql, [doctorId, "New Appointment", doctorMsg, "appointment", appointmentId], (err) => {
          if (err) console.log("⚠️  Could not create doctor notification:", err.message);
          else console.log("✅ Doctor notification created");
        });
      });
    } else {
      const doctorMsg = "New appointment booked";
      db.query(doctorNotificationSql, [doctorId, "New Appointment", doctorMsg, "appointment", appointmentId], (err) => {
        if (err) console.log("⚠️  Could not create doctor notification:", err.message);
        else console.log("✅ Doctor notification created");
      });
    }
    
    // Notify the patient if it's a registered patient - WITH DOCTOR NAME
    if (patientId && patientId > 0) {
      const patientNotificationSql = `
        INSERT INTO notifications (user_id, title, message, type, related_entity_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const patientMsg = `Successfully book appointment`;
      
      db.query(patientNotificationSql, [patientId, "Appointment Booked", patientMsg, "appointment", appointmentId], (err) => {
        if (err) console.log("⚠️  Could not create patient notification:", err.message);
        else console.log("✅ Patient notification created");
      });
    }
    
    // Notify all admins - WITH DOCTOR NAME
    const adminNotificationSql = `
      INSERT INTO notifications (user_id, title, message, type, related_entity_id)
      SELECT id, ?, ?, ?, ? FROM users WHERE role = 'admin'
    `;
    
    const adminMsg = emergencyPatientName
      ? `New emergency appointment: ${emergencyPatientName} with Dr. ${doctorName}`
      : `Dr. ${doctorName} accepted new appointment`;
    
    db.query(adminNotificationSql, ["New Appointment", adminMsg, "appointment", appointmentId], (err) => {
      if (err) console.log("⚠️  Could not create admin notifications:", err.message);
      else console.log("✅ Admin notifications created");
    });
  });
};

/* HELPER FUNCTION: Generate appointment status change notifications */
const generateAppointmentStatusNotification = (appointmentId, newStatus, doctorId, patientId, emergencyPatientName) => {
  console.log(`\n🔔 GENERATING STATUS NOTIFICATION for appointment ${appointmentId}`);
  console.log(`   Status: ${newStatus}`);
  console.log(`   Doctor ID: ${doctorId}`);
  console.log(`   Patient ID: ${patientId} (type: ${typeof patientId}, value: ${JSON.stringify(patientId)})`);
  console.log(`   Emergency Patient Name: ${emergencyPatientName}`);
  
  // Get doctor and patient names
  db.query("SELECT name FROM users WHERE id = ?", [doctorId], (err, doctorResults) => {
    if (err || !doctorResults.length) {
      console.log("⚠️  Could not fetch doctor name:", err?.message);
      return;
    }
    
    const doctorName = doctorResults[0].name;
    let patientName = emergencyPatientName;
    let patientNotificationTitle = "";
    let patientNotificationMsg = "";
    let doctorNotificationMsg = "";
    let doctorNotificationTitle = "Appointment Updated";
    
    switch (newStatus) {
      case "Confirmed":
        doctorNotificationTitle = "Appointment Confirmed";
        doctorNotificationMsg = `You confirmed the appointment`;
        patientNotificationTitle = "Appointment Confirmed";
        patientNotificationMsg = `Dr. ${doctorName} Confirmed your booking`;
        break;
      case "Completed":
        doctorNotificationTitle = "Appointment Completed";
        doctorNotificationMsg = `You marked the appointment as completed`;
        patientNotificationTitle = "Appointment Completed";
        patientNotificationMsg = `Your appointment with Dr. ${doctorName} has been completed`;
        break;
      case "Cancelled":
        doctorNotificationTitle = "Appointment Cancelled";
        doctorNotificationMsg = `You cancelled the appointment`;
        patientNotificationTitle = "Booking Cancelled";
        patientNotificationMsg = `Dr. ${doctorName} Cancelled your appointment`;
        break;
      default:
        console.log(`⚠️  Unknown status: ${newStatus}`);
        return;
    }
    
    console.log(`   Patient Notification Title: ${patientNotificationTitle}`);
    console.log(`   Patient Notification Message: ${patientNotificationMsg}`);
    
    // Notify patient if registered (regular patient)
    if (patientId && patientId > 0) {
      const patientSql = `
        INSERT INTO notifications (user_id, title, message, type, related_entity_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      console.log(`   ✅ Creating patient notification (patientId: ${patientId})`);
      db.query(patientSql, [patientId, patientNotificationTitle, patientNotificationMsg, "appointment_status", appointmentId], (err) => {
        if (err) console.log("   ⚠️  Could not create patient status notification:", err.message);
        else console.log(`   ✅ Patient ${newStatus.toLowerCase()} notification created`);
      });
    } else {
      console.log(`   ⚠️  Skipping patient notification - Patient ID invalid: ${patientId}`);
    }
    
    // Notify doctor about their own action
    const doctorSql = `
      INSERT INTO notifications (user_id, title, message, type, related_entity_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(doctorSql, [doctorId, doctorNotificationTitle, doctorNotificationMsg, "appointment_status", appointmentId], (err) => {
      if (err) console.log(`⚠️  Could not create doctor status notification: ${err.message}`);
      else console.log(`✅ Doctor ${newStatus.toLowerCase()} notification created`);
    });
    
    // Notify all admins about status change
    const adminSql = `
      INSERT INTO notifications (user_id, title, message, type, related_entity_id)
      SELECT id, ?, ?, ?, ? FROM users WHERE role = 'admin'
    `;
    const adminMsg = `Appointment ${newStatus.toLowerCase()}: Dr. ${doctorName}`;
    db.query(adminSql, [`Appointment ${newStatus}`, adminMsg, "appointment_status", appointmentId], (err) => {
      if (err) console.log("⚠️  Could not create admin status notifications:", err.message);
      else console.log(`✅ Admin ${newStatus.toLowerCase()} notifications created`);
    });
  });
};

/* HELPER FUNCTION: Generate medical record notification */
const generateMedicalRecordNotification = (recordId, patientId, doctorId, action = "created") => {
  db.query("SELECT name FROM users WHERE id = ?", [doctorId], (err, results) => {
    if (err || !results.length) return;
    
    const doctorName = results[0].name;
    const actionTitle = action === "created" ? "Created" : "Updated";
    const actionMessage = action === "created" ? "created a new" : "updated";
    
    const sql = `
      INSERT INTO notifications (user_id, title, message, type, related_entity_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const title = `Medical Record ${actionTitle}`;
    const message = `Dr. ${doctorName} ${actionMessage} medical record for you`;
    
    db.query(sql, [patientId, title, message, "medical_record", recordId], (err) => {
      if (err) console.log(`⚠️  Could not create medical record notification: ${err.message}`);
      else console.log(`✅ Medical record ${action} notification created`);
    });
  });
};

/* HELPER FUNCTION: Generate prescription notification */
const generatePrescriptionNotification = (
  prescriptionId,
  patientId,
  doctorId,
  medication,
  done = () => {}
) => {
  db.query("SELECT name FROM users WHERE id = ?", [doctorId], (err, results) => {
    if (err || !results.length) {
      if (err) console.log(`⚠️  Could not fetch doctor for prescription notification: ${err.message}`);
      done(err || new Error("Doctor not found"));
      return;
    }

    const doctorName = results[0].name;
    const patientTitle = "Prescription Added";
    const patientMessage = `Dr. ${doctorName} prescribed you ${medication || "a medicine"}`;
    const doctorTitle = "Prescription Sent";
    const sql = `
      INSERT INTO notifications (user_id, title, message, type, related_entity_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [patientId, patientTitle, patientMessage, "prescription", prescriptionId], (notifyErr) => {
      if (notifyErr) {
        console.log(`⚠️  Could not create patient prescription notification: ${notifyErr.message}`);
        done(notifyErr);
      } else {
        console.log("✅ Patient prescription notification created");
        done(null);
      }
    });

    db.query("SELECT name FROM users WHERE id = ?", [patientId], (patientErr, patientResults) => {
      const patientName = !patientErr && patientResults && patientResults.length
        ? patientResults[0].name
        : `patient #${patientId}`;
      const doctorMessage = `You prescribed ${medication || "a medicine"} to ${patientName}`;

      db.query(sql, [doctorId, doctorTitle, doctorMessage, "prescription", prescriptionId], (doctorNotifyErr) => {
      if (doctorNotifyErr) {
        console.log(`⚠️  Could not create doctor prescription notification: ${doctorNotifyErr.message}`);
      } else {
        console.log("✅ Doctor prescription notification created");
      }
      });
    });
  });
};

/* HELPER FUNCTION: Generate profile update notification */
const generateProfileUpdateNotification = (userId, updateType) => {
  const title = "Profile Updated";
  let message = "";
  
  switch (updateType) {
    case "personal":
      message = "Your profile information has been updated";
      break;
    case "password":
      message = "Your password has been successfully changed";
      break;
    case "contact":
      message = "Your contact information has been updated";
      break;
    case "medical":
      message = "Your medical information has been updated";
      break;
    default:
      message = "Your profile has been updated";
  }
  
  const sql = `
    INSERT INTO notifications (user_id, title, message, type, related_entity_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.query(sql, [userId, title, message, "profile_update", userId], (err) => {
    if (err) console.log(`⚠️  Could not create profile update notification: ${err.message}`);
    else console.log(`✅ Profile update ${updateType} notification created`);
  });
};

/* HELPER FUNCTION: Generate system alert notification */
const generateSystemAlert = (userId, title, message, alertType = "system") => {
  const sql = `
    INSERT INTO notifications (user_id, title, message, type, related_entity_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.query(sql, [userId, title, message, alertType, null], (err) => {
    if (err) console.log(`⚠️  Could not create system alert: ${err.message}`);
    else console.log(`✅ System alert notification created: ${title}`);
  });
};

/* HELPER FUNCTION: Generate approval notification */
const generateApprovalNotification = (userId, approverName, itemType, itemTitle) => {
  const title = `${itemType} Approved`;
  const message = `Dr. ${approverName} approved your ${itemType.toLowerCase()}: ${itemTitle}`;
  
  const sql = `
    INSERT INTO notifications (user_id, title, message, type, related_entity_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.query(sql, [userId, title, message, "approval", null], (err) => {
    if (err) console.log(`⚠️  Could not create approval notification: ${err.message}`);
    else console.log(`✅ Approval notification created`);
  });
};

/* HELPER FUNCTION: Generate appointment reminder */
const generateAppointmentReminder = (appointmentId, patientId, doctorId, appointmentDate, appointmentTime) => {
  db.query("SELECT name FROM users WHERE id = ?", [doctorId], (err, results) => {
    if (err || !results.length) return;
    
    const doctorName = results[0].name;
    const reminderTime = new Date(appointmentDate).toLocaleDateString() + " at " + appointmentTime;
    
    const sql = `
      INSERT INTO notifications (user_id, title, message, type, related_entity_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const title = "Appointment Reminder";
    const message = `Reminder: Your appointment with Dr. ${doctorName} is scheduled for ${reminderTime}`;
    
    db.query(sql, [patientId, title, message, "appointment_reminder", appointmentId], (err) => {
      if (err) console.log(`⚠️  Could not create appointment reminder: ${err.message}`);
      else console.log(`✅ Appointment reminder notification created`);
    });
  });
};

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
  const { name, email, password, role, specialty, phone, department, yearsExperience, bio } = req.body;

  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim();
  const trimmedPassword = password?.trim();
  const trimmedPhone = phone?.trim() || null;
  const trimmedDepartment = department?.trim() || null;
  const trimmedBio = bio?.trim() || null;
  const parsedExperience =
    yearsExperience !== undefined && yearsExperience !== null && yearsExperience !== ""
      ? Number(yearsExperience)
      : null;

  if (!trimmedName || !trimmedEmail || !trimmedPassword) {
    return res.status(400).json({ message: "❌ Please fill all fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
    const userRole = role || "patient";

    const sql = "INSERT INTO users (name, email, password, role, specialty, phone, department, experience, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    db.query(sql, [trimmedName, trimmedEmail, hashedPassword, userRole, specialty || null, trimmedPhone, trimmedDepartment, parsedExperience, trimmedBio], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "❌ Email already exists" });
        }
        const dbUnavailable =
          typeof err.message === "string" &&
          (err.message.includes("ECONNREFUSED") || err.message.includes("ETIMEDOUT"));
        if (dbUnavailable) {
          return res.status(500).json({
            message:
              "❌ Database is not reachable in production. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME in Vercel Environment Variables.",
          });
        }
        return res.status(500).json({ message: `❌ Database error: ${err.message}` });
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

  const checkSql = "SELECT id, name, email FROM users WHERE email = ?";
  db.query(checkSql, [email], (err, results) => {
    if (err) {
      console.error("Password reset request DB error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      // Keep generic response to avoid account enumeration.
      return res.json({ message: "If that email exists, your reset request has been sent to admin." });
    }

    const requester = results[0];
    const title = "Password Reset Request";
    const message = `${requester.name} wants to reset their password.`;
    const type = "password_reset_request";

    const notifyAdminsSql = `
      INSERT INTO notifications (user_id, title, message, type, related_entity_id)
      SELECT id, ?, ?, ?, ? FROM users WHERE role = 'admin'
    `;

    db.query(notifyAdminsSql, [title, message, type, requester.id], (notifyErr) => {
      if (notifyErr) {
        console.error("Password reset admin notification DB error:", notifyErr.message);
        return res.status(500).json({ message: "Failed to submit reset request" });
      }

      return res.json({
        message: "✅ Reset request sent to admin. Please wait for admin assistance.",
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
/* GET ALL DEPARTMENTS */
app.get("/departments", authenticateToken, (req, res) => {
  const sql = "SELECT DISTINCT department FROM users WHERE role = 'doctor' AND department IS NOT NULL ORDER BY department ASC";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get departments DB error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }
    
    const departments = results.map(r => r.department).filter(d => d && d.trim() !== '');
    console.log(`✅ Retrieved ${departments.length} departments:`, departments);
    
    res.json({ 
      message: "Departments retrieved successfully",
      departments: departments
    });
  });
});

/* GET DOCTORS - Optional department filter */
app.get("/doctors", authenticateToken, (req, res) => {
  const { department } = req.query;
  
  let sql = "SELECT id, name, email, role, specialty, department, phone, rating, experience FROM users WHERE role = 'doctor'";
  const params = [];
  
  // Filter by department if provided
  if (department && department.trim() !== '') {
    sql += " AND department = ?";
    params.push(department);
  }
  
  const finalSql = sql + " ORDER BY name ASC";
  
  db.query(finalSql, params, (err, results) => {
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
    
    const filterMsg = department ? ` in ${department}` : '';
    console.log(`✅ Retrieved ${doctorsWithTypes.length} doctors${filterMsg}:`, doctorsWithTypes.map(d => d.name));
    
    res.json({ 
      message: "Doctors retrieved successfully",
      doctors: doctorsWithTypes
    });
  });
});

/* CREATE APPOINTMENT */
app.post("/appointments", authenticateToken, authorizeRoles("patient", "admin"), (req, res) => {
  console.log("\n\n🎯🎯🎯 APPOINTMENT ENDPOINT HIT 🎯🎯🎯");
  console.log("User role:", req.user?.role);
  console.log("User ID:", req.user?.id);
  console.log("\n🔵🔵🔵 FULL REQUEST BODY 🔵🔵🔵");
  console.log("req.body:", JSON.stringify(req.body, null, 2));
  
  let { patientId, doctorId, date, time, type, status, emergencyPatientName, emergencyPatientPhone } = req.body;
  
  // Ensure doctorId is a number if it's a string
  if (typeof doctorId === 'string') {
    doctorId = parseInt(doctorId, 10);
  }
  
  console.log("\n📋 EXTRACTED FIELDS:");
  console.log("patientId:", patientId, typeof patientId);
  console.log("doctorId:", doctorId, typeof doctorId);
  console.log("date:", date, typeof date);
  console.log("time:", time, typeof time);
  console.log("type:", type, typeof type);
  console.log("emergencyPatientName:", emergencyPatientName, typeof emergencyPatientName);
  console.log("emergencyPatientPhone:", emergencyPatientPhone, typeof emergencyPatientPhone);
  
  // Check required appointment fields - must be non-empty AND valid values
  if (!doctorId || isNaN(doctorId) || !date || !time) {
    console.log("❌ Missing basic appointment fields");
    console.log("  doctorId present?", !!doctorId, "isNaN?", isNaN(doctorId));
    console.log("  date present?", !!date);
    console.log("  time present?", !!time);
    return res.status(400).json({ message: "❌ Please fill all required fields: doctor, date, time" });
  }

  // Either must have patientId (registered) OR emergency patient details (walk-in)
  const hasRegisteredPatient = patientId && Number(patientId) > 0;
  const hasEmergencyDetails = emergencyPatientName && emergencyPatientPhone;
  
  console.log("\n🔍 VALIDATION CHECK:");
  console.log("  hasRegisteredPatient:", hasRegisteredPatient);
  console.log("  hasEmergencyDetails:", hasEmergencyDetails);
  
  if (!hasRegisteredPatient && !hasEmergencyDetails) {
    console.log("❌ Missing patient details - neither registered nor emergency");
    return res.status(400).json({ message: "❌ Either select a registered patient or provide emergency patient details" });
  }
  
  console.log("✅ All validations passed, proceeding to insert");

  // Only patients can book for themselves, admins can book for anyone
  if (req.user.role === "patient" && patientId && req.user.id !== Number(patientId)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  
  // ⭐ DOUBLE BOOKING PREVENTION: Check if doctor already has appointment at this time
  console.log("\n🔐 DOUBLE BOOKING CHECK:");
  console.log(`  Checking for existing appointments: doctor=${doctorId}, date=${date}, time=${time}`);
  
  const doubleBookingCheckSql = `
    SELECT id, patient_id, time 
    FROM appointments 
    WHERE doctor_id = ? 
      AND date = ? 
      AND time = ?
      AND status IN ('Pending', 'Confirmed')
  `;
  
  db.query(doubleBookingCheckSql, [parseInt(doctorId, 10), date, time], (doubleErr, doubleResults) => {
    if (doubleErr) {
      console.error("❌ Error checking for double booking:", doubleErr);
      return res.status(500).json({ message: "❌ Error checking appointment availability" });
    }
    
    if (doubleResults && doubleResults.length > 0) {
      console.log(`❌ DOUBLE BOOKING PREVENTED! Found ${doubleResults.length} existing appointment(s) at this time.`);
      console.log(`   Existing appointment ID: ${doubleResults[0].id}, time: ${doubleResults[0].time}`);
      return res.status(409).json({ 
        message: `❌ This time slot is already booked! The doctor is not available at ${time} on ${date}. Please select a different time.`,
        available: false,
        conflictingAppointmentId: doubleResults[0].id
      });
    }
    
    console.log("✅ No conflicts found - time slot is available!");
    
    // Proceed with appointment creation
    const sql = "INSERT INTO appointments (patient_id, doctor_id, date, time, type, status) VALUES (?, ?, ?, ?, ?, ?)";
    
    const params = [
      hasRegisteredPatient ? parseInt(patientId, 10) : null, 
      parseInt(doctorId, 10), 
      date, 
      time, 
      type || "Consultation", 
      status || "Pending"
    ];
    
    console.log("📝 SQL QUERY:", sql);
    console.log("📝 SQL PARAMS:", params);
    
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error("❌ Appointment creation SQL error:");
        console.error("  Error code:", err.code);
        console.error("  Error message:", err.message);
        console.error("  SQL state:", err.sqlState);
        return res.status(500).json({ 
          message: "❌ Failed to create appointment",
          error: err.message,
          code: err.code
        });
      }
      
      console.log("✅ Appointment created successfully, ID:", result.insertId);
      
      // Now update with emergency patient details if needed
      if ((emergencyPatientName || emergencyPatientPhone) && result.insertId) {
        const updateSql = "UPDATE appointments SET patient_name = ?, patient_phone = ? WHERE id = ?";
        const updateParams = [emergencyPatientName || null, emergencyPatientPhone || null, result.insertId];
        
        db.query(updateSql, updateParams, (updateErr) => {
          if (updateErr) {
            console.error("Warning: Could not update emergency patient details:", updateErr.message);
          } else {
            console.log("✅ Emergency patient details updated");
          }
          
          // Create notifications after appointment is saved
          generateAppointmentNotifications(result.insertId, patientId, doctorId, emergencyPatientName);
          
          res.json({ message: "✅ Appointment created successfully", appointmentId: result.insertId });
        });
      } else {
        // Create notifications for this appointment
        generateAppointmentNotifications(result.insertId, patientId, doctorId, emergencyPatientName);
        res.json({ message: "✅ Appointment created successfully", appointmentId: result.insertId });
      }
    });
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

/* ⭐ CHECK IF TIME SLOT IS AVAILABLE (Double-booking prevention) */
app.get("/appointments/check-slot/:doctorId/:date/:time", (req, res) => {
  const { doctorId, date, time } = req.params;
  
  console.log(`\n✅ CHECK SLOT API CALLED`);
  console.log(`   Doctor: ${doctorId}, Date: ${date}, Time: ${time}`);
  
  if (!doctorId || !date || !time) {
    return res.status(400).json({ 
      message: "Doctor ID, date, and time are required",
      available: false 
    });
  }
  
  // Query for conflicting appointments
  const sql = `
    SELECT id, doctor_id, date, time, patient_id, status
    FROM appointments 
    WHERE doctor_id = ? 
      AND date = ? 
      AND time = ?
      AND status IN ('Pending', 'Confirmed')
  `;
  
  db.query(sql, [parseInt(doctorId), date, time], (err, results) => {
    if (err) {
      console.error("❌ Slot check error:", err.message);
      return res.status(500).json({ 
        message: "Error checking slot availability",
        available: false,
        error: err.message
      });
    }
    
    if (results && results.length > 0) {
      console.log(`❌ SLOT TAKEN - Found ${results.length} appointment(s)`);
      return res.status(409).json({ 
        message: `Time slot at ${time} on ${date} is already booked`,
        available: false,
        conflictCount: results.length,
        conflictingAppointments: results
      });
    }
    
    console.log(`✅ SLOT AVAILABLE`);
    res.json({ 
      message: "Time slot is available",
      available: true,
      doctorId: parseInt(doctorId),
      date,
      time
    });
  });
});

/* ⭐ GET ALL BOOKED SLOTS FOR A DOCTOR ON A DATE */
app.get("/appointments/booked-slots/:doctorId/:date", (req, res) => {
  const { doctorId, date } = req.params;
  
  console.log(`\n📋 GET BOOKED SLOTS API CALLED`);
  console.log(`   Doctor: ${doctorId}, Date: ${date}`);
  
  if (!doctorId || !date) {
    return res.status(400).json({ 
      message: "Doctor ID and date are required",
      bookedSlots: []
    });
  }
  
  const sql = `
    SELECT DISTINCT 
      TIME_FORMAT(time, '%H:%i') as slot_time,
      COUNT(*) as appointment_count,
      status
    FROM appointments 
    WHERE doctor_id = ? 
      AND date = ?
      AND status IN ('Pending', 'Confirmed')
    GROUP BY TIME_FORMAT(time, '%H:%i'), status
    ORDER BY slot_time ASC
  `;
  
  db.query(sql, [parseInt(doctorId), date], (err, results) => {
    if (err) {
      console.error("❌ Error fetching booked slots:", err.message);
      return res.status(500).json({ 
        message: "Error fetching booked slots",
        bookedSlots: [],
        error: err.message
      });
    }
    
    const bookedTimes = results.map(r => r.slot_time);
    console.log(`✅ Found ${bookedTimes.length} booked time slots:`, bookedTimes);
    
    res.json({ 
      message: "Booked slots retrieved successfully",
      bookedSlots: bookedTimes,
      bookedDetails: results,
      count: bookedTimes.length,
      doctorId: parseInt(doctorId),
      date
    });
  });
});

/* ⭐ GET AVAILABLE TIME SLOTS FOR A DOCTOR */
app.get("/available-slots/:doctorId/:date", (req, res) => {
  const { doctorId, date } = req.params;
  const workStartTime = req.query.startTime || "09:00";
  const workEndTime = req.query.endTime || "18:00";
  const slotDuration = parseInt(req.query.slotDuration) || 30; // minutes
  
  console.log(`\n📅 AVAILABLE SLOTS API CALLED`);
  console.log(`   Doctor: ${doctorId}, Date: ${date}`);
  console.log(`   Working Hours: ${workStartTime} - ${workEndTime}, Slot Duration: ${slotDuration}min`);
  
  if (!doctorId || !date) {
    return res.status(400).json({ 
      message: "Doctor ID and date are required",
      availableSlots: []
    });
  }
  
  // Get doctor's working hours from users table
  const getDoctorHoursSql = `
    SELECT work_start_time, work_end_time 
    FROM users 
    WHERE id = ? AND role = 'doctor'
  `;
  
  db.query(getDoctorHoursSql, [parseInt(doctorId)], (hours_err, hours_results) => {
    if (hours_err || !hours_results || hours_results.length === 0) {
      console.log("ℹ️  Using default working hours");
    }
    
    // Use doctor's custom hours if available, otherwise defaults
    const docWorkStart = (hours_results && hours_results[0]?.work_start_time) ? 
      hours_results[0].work_start_time.substring(0, 5) : workStartTime;
    const docWorkEnd = (hours_results && hours_results[0]?.work_end_time) ? 
      hours_results[0].work_end_time.substring(0, 5) : workEndTime;
    
    // Get all booked appointments for this doctor on this date
    const bookedSql = `
      SELECT TIME_FORMAT(time, '%H:%i') as slot_time
      FROM appointments 
      WHERE doctor_id = ? 
        AND date = ?
        AND status IN ('Pending', 'Confirmed')
      ORDER BY slot_time ASC
    `;
    
    db.query(bookedSql, [parseInt(doctorId), date], (booked_err, booked_results) => {
      if (booked_err) {
        console.error("❌ Error fetching booked times:", booked_err.message);
        return res.status(500).json({ 
          message: "Error fetching available slots",
          availableSlots: []
        });
      }
      
      const bookedTimes = (booked_results || []).map(r => r.slot_time);
      console.log(`Found ${bookedTimes.length} booked slots:`, bookedTimes);
      
      // Generate all possible time slots
      const generateTimeSlots = (startTime, endTime, durationMinutes) => {
        const slots = [];
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);
        
        let currentTime = new Date(2000, 0, 1, startHour, startMin);
        const endDateTime = new Date(2000, 0, 1, endHour, endMin);
        
        while (currentTime < endDateTime) {
          const hours = String(currentTime.getHours()).padStart(2, "0");
          const minutes = String(currentTime.getMinutes()).padStart(2, "0");
          slots.push(`${hours}:${minutes}`);
          
          currentTime = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);
        }
        
        return slots;
      };
      
      const allSlots = generateTimeSlots(docWorkStart, docWorkEnd, slotDuration);
      const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
      
      console.log(`✅ Generated ${allSlots.length} total slots, ${availableSlots.length} available`);
      
      res.json({ 
        message: "Available slots retrieved successfully",
        availableSlots,
        bookedSlots: bookedTimes,
        doctorId: parseInt(doctorId),
        date,
        workingHours: {
          start: docWorkStart,
          end: docWorkEnd
        },
        slotDuration,
        totalSlots: allSlots.length,
        availableCount: availableSlots.length
      });
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
  const { name, email, phone, bloodGroup, age, gender, dateOfBirth, address, emergencyContact, specialization, department, yearsExperience, bio, condition } = req.body;

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
  const updateFields = [];
  const updateValues = [];

  const addUpdateField = (column, value) => {
    updateFields.push(`${column} = ?`);
    updateValues.push(value);
  };

  // Only update fields explicitly provided by the client so admin edits do not
  // overwrite unrelated doctor fields with NULL when the modal omits them.
  addUpdateField("name", name);
  addUpdateField("email", email);
  if (phone !== undefined) addUpdateField("phone", phone || null);
  if (bloodGroup !== undefined) addUpdateField("blood_group", bloodGroup || null);
  if (age !== undefined) addUpdateField("age", parsedAge);
  if (gender !== undefined) addUpdateField("gender", gender || null);
  if (dateOfBirth !== undefined) addUpdateField("date_of_birth", dateOfBirth || null);
  if (address !== undefined) addUpdateField("address", address || null);
  if (emergencyContact !== undefined) addUpdateField("emergency_contact", emergencyContact || null);
  if (specialization !== undefined) addUpdateField("specialty", specialization || null);
  if (department !== undefined) addUpdateField("department", department || null);
  if (yearsExperience !== undefined) addUpdateField("experience", parsedExperience);
  if (bio !== undefined) addUpdateField("bio", bio || null);
  if (condition !== undefined) addUpdateField("`condition`", condition || null);

  const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;

  console.log("\n📝 UPDATE PROFILE DETAILS:");
  console.log("  User ID:", userId);
  console.log("  Name:", name);
  console.log("  Experience:", parsedExperience);
  console.log("  Specialization:", specialization);
  console.log("  Department:", department);
  console.log("  Bio:", bio);

  db.query(
    sql,
    [...updateValues, userId],
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

/* CHANGE PASSWORD */
app.put("/users/:userId/change-password", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const isAdminReset = req.user.role === "admin" && req.user.id !== Number(userId);

  console.log("🔐 CHANGE PASSWORD REQUEST:");
  console.log("  User ID:", userId);
  console.log("  Auth user ID:", req.user.id);
  console.log("  Auth user role:", req.user.role);

  // Check authorization - can only change own password, unless admin
  if (req.user.role !== "admin" && req.user.id !== Number(userId)) {
    console.log("❌ Unauthorized password change attempt");
    return res.status(403).json({ message: "❌ You can only change your own password" });
  }

  // Validate required fields
  if (!newPassword || !confirmPassword || (!isAdminReset && !currentPassword)) {
    return res.status(400).json({
      message: isAdminReset
        ? "❌ New password and confirm password are required"
        : "❌ All password fields are required",
    });
  }

  // Verify passwords match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "❌ Passwords do not match" });
  }

  // Verify password length
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "❌ Password must be at least 6 characters" });
  }

  try {
    // Get current user
    const selectSql = "SELECT password FROM users WHERE id = ?";
    db.query(selectSql, [userId], async (err, results) => {
      if (err) {
        console.error("❌ Database error:", err.message);
        return res.status(500).json({ message: "❌ Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "❌ User not found" });
      }

      const user = results[0];

      // For admin reset of another user, skip current-password verification.
      try {
        if (!isAdminReset) {
          const isMatch = await bcrypt.compare(currentPassword, user.password);
          if (!isMatch) {
            console.log("❌ Current password is incorrect");
            return res.status(401).json({ message: "❌ Current password is incorrect" });
          }
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const updateSql = "UPDATE users SET password = ? WHERE id = ?";
        db.query(updateSql, [hashedNewPassword, userId], (updateErr) => {
          if (updateErr) {
            console.error("❌ Update error:", updateErr.message);
            return res.status(500).json({ message: "❌ Failed to update password" });
          }

          console.log("✅ Password changed successfully for user:", userId);
          res.json({
            message: isAdminReset
              ? "✅ Password reset successfully by admin"
              : "✅ Password changed successfully",
          });
        });
      } catch (hashErr) {
        console.error("❌ Hash comparison error:", hashErr.message);
        return res.status(500).json({ message: "❌ Error verifying password" });
      }
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ message: "❌ An error occurred" });
  }
});

/* UPDATE APPOINTMENT STATUS */
app.put("/appointments/:appointmentId", authenticateToken, (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;
  
  console.log("📝 UPDATE APPOINTMENT - User:", req.user.id, "Role:", req.user.role, "Appointment ID:", appointmentId, "New Status:", status);
  
  if (!status) {
    return res.status(400).json({ message: "❌ Status is required" });
  }

  // Patients can only update their own appointments
  if (req.user.role === "patient") {
    const sql = "SELECT patient_id FROM appointments WHERE id = ?";
    db.query(sql, [appointmentId], (err, results) => {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({ message: "❌ Database error" });
      }
      if (results.length === 0) {
        console.log("❌ Appointment not found");
        return res.status(404).json({ message: "❌ Appointment not found" });
      }
      
      const appointmentPatientId = Number(results[0].patient_id);
      const userId = Number(req.user.id);
      
      if (appointmentPatientId !== userId) {
        console.log("❌ Authorization failed - appointment doesn't belong to patient");
        return res.status(403).json({ message: "❌ You can only update your own appointments" });
      }
      
      // Update appointment status
      const updateSql = "UPDATE appointments SET status = ? WHERE id = ?";
      db.query(updateSql, [status, appointmentId], (updateErr) => {
        if (updateErr) {
          console.error("❌ Update error:", updateErr);
          return res.status(500).json({ message: "❌ Failed to update appointment" });
        }
        console.log("✅ Appointment status updated successfully");
        res.json({ message: "✅ Appointment status updated successfully" });
      });
    });
  } else if (req.user.role === "admin" || req.user.role === "doctor") {
    // Admins and doctors can update any appointment
    console.log(`\n🎯 APPOINTMENT STATUS UPDATE ENDPOINT HIT`);
    console.log(`   User: ${req.user.role} (ID: ${req.user.id})`);
    console.log(`   Appointment ID: ${appointmentId}`);
    console.log(`   New Status: ${status}`);
    
    // First get appointment details to generate appropriate notifications
    const getAppointmentSql = "SELECT patient_id, doctor_id, patient_name, date, time FROM appointments WHERE id = ?";
    db.query(getAppointmentSql, [appointmentId], (getErr, appointmentResults) => {
      if (getErr || !appointmentResults.length) {
        console.error("❌ Could not fetch appointment details:", getErr);
        return res.status(500).json({ message: "❌ Failed to fetch appointment details" });
      }
      
      const { patient_id, doctor_id, patient_name, date, time } = appointmentResults[0];
      console.log(`   Retrieved appointment details:`, {patient_id, doctor_id, patient_name, date, time});
      
      // Update appointment status
      const updateSql = "UPDATE appointments SET status = ? WHERE id = ?";
      db.query(updateSql, [status, appointmentId], (err) => {
        if (err) {
          console.error("❌ Update error:", err);
          return res.status(500).json({ message: "❌ Failed to update appointment" });
        }
        console.log("✅ Appointment status updated in database");
        
        // Generate appropriate notification based on status
        console.log(`   Calling generateAppointmentStatusNotification with:`, {appointmentId, status, doctor_id, patient_id, patient_name});
        generateAppointmentStatusNotification(appointmentId, status, doctor_id, patient_id, patient_name);
        
        res.json({ message: "✅ Appointment status updated successfully" });
      });
    });
  } else {
    console.log("❌ Invalid role:", req.user.role);
    return res.status(403).json({ message: "❌ Forbidden" });
  }
});

/* DELETE APPOINTMENT */
app.delete("/appointments/:appointmentId", authenticateToken, (req, res) => {
  const { appointmentId } = req.params;
  
  console.log("🗑️ DELETE APPOINTMENT - User:", req.user.id, "Role:", req.user.role, "Appointment ID:", appointmentId);
  
  // Patients can delete their own appointments, doctors and admins can delete any
  if (req.user.role === "patient") {
    // For patients, verify the appointment belongs to them
    const sql = "SELECT patient_id FROM appointments WHERE id = ?";
    db.query(sql, [appointmentId], (err, results) => {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({ message: "❌ Database error" });
      }
      if (results.length === 0) {
        console.log("❌ Appointment not found");
        return res.status(404).json({ message: "❌ Appointment not found" });
      }
      
      const appointmentPatientId = Number(results[0].patient_id);
      const userId = Number(req.user.id);
      
      console.log("Checking ownership - DB patient_id:", appointmentPatientId, "User ID:", userId);
      
      if (appointmentPatientId !== userId) {
        console.log("❌ Authorization failed - this appointment doesn't belong to user");
        return res.status(403).json({ message: "❌ You can only delete your own appointments" });
      }
      
      // Appointment belongs to patient, proceed with deletion
      console.log("✅ Authorization passed - deleting appointment");
      deleteAppointment(appointmentId, res);
    });
  } else if (req.user.role === "admin" || req.user.role === "doctor") {
    // Admins and doctors can delete any appointment
    console.log("✅ Admin/Doctor role - deleting appointment");
    deleteAppointment(appointmentId, res);
  } else {
    console.log("❌ Invalid role:", req.user.role);
    return res.status(403).json({ message: "❌ Forbidden" });
  }
});

// Helper function to delete appointment
const deleteAppointment = (appointmentId, res) => {
  const sql = "DELETE FROM appointments WHERE id = ?";
  db.query(sql, [appointmentId], (err) => {
    if (err) {
      console.error("❌ Delete error:", err);
      return res.status(500).json({ message: "❌ Failed to delete appointment" });
    }
    console.log("✅ Appointment deleted successfully");
    res.json({ message: "✅ Appointment deleted successfully" });
  });
};

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

/* GET APPOINTMENTS FOR A SPECIFIC DOCTOR */
app.get("/appointments/doctor/:doctorId", (req, res) => {
  const { doctorId } = req.params;
  
  const sql = "SELECT id, doctor_id, patient_id, patient_name, DATE_FORMAT(date, '%Y-%m-%d') as date, time, status FROM appointments WHERE doctor_id = ? AND status IN ('Pending', 'Confirmed') ORDER BY date DESC";
  
  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({ 
      message: "✅ Doctor appointments retrieved successfully",
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
  // Use LEFT JOIN to include emergency appointments (those with NULL patient_id)
  const sql = `SELECT a.*, 
    COALESCE(p.name, a.patient_name) as patient_name, 
    p.email as patient_email, 
    d.name as doctor_name, 
    d.specialty,
    a.patient_phone as emergency_phone
  FROM appointments a 
  LEFT JOIN users p ON a.patient_id = p.id 
  JOIN users d ON a.doctor_id = d.id 
  ORDER BY a.date DESC`;
  
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
  const {
    appointmentId,
    medicalRecordId,
    patientId,
    doctorId,
    medication,
    dosage,
    frequency,
    duration,
    instructions,
    prescribed_date,
  } = req.body;
  
  if (!medicalRecordId || !patientId || !doctorId || !medication || !dosage || !frequency || !duration) {
    return res.status(400).json({ message: "❌ Please fill all required fields" });
  }
  
  const verifyRecordSql =
    "SELECT id FROM medical_records WHERE id = ? AND patient_id = ? AND doctor_id = ? LIMIT 1";
  const insertSql =
    "INSERT INTO prescriptions (appointment_id, medical_record_id, patient_id, doctor_id, medication, dosage, frequency, duration, instructions, prescribed_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  db.query(verifyRecordSql, [medicalRecordId, patientId, doctorId], (verifyErr, verifyResults) => {
    if (verifyErr) {
      return res.status(500).json({ message: "❌ Failed to verify medical record" });
    }

    if (!verifyResults || verifyResults.length === 0) {
      return res.status(400).json({ message: "❌ Selected medical record does not match the patient and doctor" });
    }

    db.query(
      insertSql,
      [
        appointmentId || null,
        medicalRecordId,
        patientId,
        doctorId,
        medication,
        dosage,
        frequency,
        duration,
        instructions || "",
        prescribed_date || new Date(),
      ],
      (err, insertResult) => {
        if (err) {
          const dbMessage = String(err.message || "");
          const needsMigration =
            dbMessage.includes("Unknown column 'medical_record_id'") ||
            dbMessage.includes("cannot be null") && dbMessage.includes("appointment_id");

          if (needsMigration) {
            return res.status(500).json({
              message:
                "❌ Database schema is outdated. Please run: cd backend && npm run migrate, then restart backend.",
            });
          }

          return res.status(500).json({ message: `❌ Failed to create prescription (${dbMessage})` });
        }

        const markCompletedSql =
          "UPDATE medical_records SET status = 'Completed' WHERE id = ?";

        db.query(markCompletedSql, [medicalRecordId], (markErr, markResult) => {
          if (markErr) {
            const markMessage = String(markErr.message || "");
            if (markMessage.includes("Data truncated")) {
              return res.status(500).json({
                message:
                  "❌ Prescription was created, but medical_records.status does not support 'Completed' yet. Restart backend to apply schema updates.",
              });
            }
            return res.status(500).json({
              message:
                "❌ Prescription was created but failed to mark the medical record as Completed.",
            });
          }

          if (!markResult || markResult.affectedRows === 0) {
            return res.status(500).json({
              message:
                "❌ Prescription was created, but no medical record row was updated to Completed.",
            });
          }

          generatePrescriptionNotification(
            insertResult?.insertId || null,
            patientId,
            doctorId,
            medication,
            (notifyErr) => {
              if (notifyErr) {
                return res.json({
                  message:
                    "✅ Prescription created and record marked as Completed, but notification could not be delivered.",
                });
              }

              return res.json({
                message:
                  "✅ Prescription created, record marked as Completed, and patient notified successfully",
              });
            }
          );
        });
      }
    );
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
    SELECT 
      p.*, 
      u.name AS patient_name, 
      a.date AS appointment_date, 
      a.time AS appointment_time,
      mr.record_date AS medical_record_date,
      mr.title AS medical_record_title,
      mr.diagnosis AS medical_record_diagnosis
    FROM prescriptions p
    LEFT JOIN users u ON p.patient_id = u.id
    LEFT JOIN appointments a ON p.appointment_id = a.id
    LEFT JOIN medical_records mr ON p.medical_record_id = mr.id
    WHERE p.doctor_id = ?
    ORDER BY p.prescribed_date DESC
  `;

  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      // Backward-compatible fallback for instances where migration has not run yet.
      if (String(err.message || "").includes("Unknown column 'p.medical_record_id'")) {
        const fallbackSql = `
          SELECT p.*, u.name AS patient_name, a.date AS appointment_date, a.time AS appointment_time
          FROM prescriptions p
          LEFT JOIN users u ON p.patient_id = u.id
          LEFT JOIN appointments a ON p.appointment_id = a.id
          WHERE p.doctor_id = ?
          ORDER BY p.prescribed_date DESC
        `;

        return db.query(fallbackSql, [doctorId], (fallbackErr, fallbackResults) => {
          if (fallbackErr) {
            console.error("Error fetching prescriptions for doctor (fallback):", fallbackErr);
            return res.status(500).json({ message: "❌ Database error" });
          }

          return res.json({
            message: "✅ Doctor prescriptions retrieved successfully",
            prescriptions: fallbackResults,
          });
        });
      }

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
  const { medication, dosage, frequency, duration, instructions } = req.body;
  
  if (!medication && !dosage && !frequency && !duration && !instructions) {
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
  if (frequency) {
    updateFields.push("frequency = ?");
    params.push(frequency);
  }
  if (duration) {
    updateFields.push("duration = ?");
    params.push(duration);
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

/* NOTIFICATIONS - GET ALL NOTIFICATIONS FOR A USER */
app.get("/notifications/:userId", authenticateToken, (req, res) => {
  const { userId } = req.params;
  const { limit = 10, offset = 0 } = req.query;
  
  // Authorization check: user can only fetch their own notifications unless they're an admin
  if (req.user.role !== "admin" && req.user.id !== Number(userId)) {
    return res.status(403).json({ message: "❌ Forbidden" });
  }
  
  const sql = `
    SELECT id, user_id, title, message, type, is_read, created_at, related_entity_id
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  db.query(sql, [userId, parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) {
      console.error("Error fetching notifications:", err);
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    // Convert created_at to ISO format for proper timezone handling in frontend
    const notificationsWithISODate = (results || []).map(notification => ({
      ...notification,
      created_at: notification.created_at ? new Date(notification.created_at).toISOString() : null
    }));
    
    res.json({
      message: "✅ Notifications retrieved successfully",
      notifications: notificationsWithISODate || []
    });
  });
});

/* NOTIFICATIONS - GET UNREAD COUNT */
app.get("/notifications/:userId/unread-count", authenticateToken, (req, res) => {
  const { userId } = req.params;
  
  // Authorization check: user can only fetch their own unread count unless they're an admin
  if (req.user.role !== "admin" && req.user.id !== Number(userId)) {
    return res.status(403).json({ message: "❌ Forbidden" });
  }
  
  const sql = "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE";
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({
      message: "✅ Unread count retrieved",
      unreadCount: results[0].count
    });
  });
});

/* NOTIFICATIONS - CREATE NOTIFICATION */
app.post("/notifications", authenticateToken, authorizeRoles("admin", "doctor"), (req, res) => {
  const {
    userId,
    title,
    message,
    type = "system",
    relatedEntityId = null,
    relatedId = null,
  } = req.body;
  
  if (!userId || !title || !message) {
    return res.status(400).json({ message: "❌ Missing required fields: userId, title, message" });
  }
  
  const sql = `
    INSERT INTO notifications (user_id, title, message, type, related_entity_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.query(sql, [userId, title, message, type, relatedEntityId || relatedId], (err, result) => {
    if (err) {
      console.error("Error creating notification:", err);
      return res.status(500).json({ message: "❌ Failed to create notification" });
    }
    
    res.json({
      message: "✅ Notification created successfully",
      notificationId: result.insertId
    });
  });
});

/* NOTIFICATIONS - MARK AS READ */
app.put("/notifications/:notificationId/read", authenticateToken, (req, res) => {
  const { notificationId } = req.params;
  
  const sql = "UPDATE notifications SET is_read = TRUE WHERE id = ?";
  
  db.query(sql, [notificationId], (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to update notification" });
    }
    
    res.json({ message: "✅ Notification marked as read" });
  });
});

/* NOTIFICATIONS - MARK ALL AS READ */
app.put("/notifications/:userId/mark-all-read", authenticateToken, (req, res) => {
  const { userId } = req.params;
  
  const sql = "UPDATE notifications SET is_read = TRUE WHERE user_id = ?";
  
  db.query(sql, [userId], (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to update notifications" });
    }
    
    res.json({ message: "✅ All notifications marked as read" });
  });
});

/* NOTIFICATIONS - DELETE NOTIFICATION */
app.delete("/notifications/:notificationId", authenticateToken, (req, res) => {
  const { notificationId } = req.params;
  
  const sql = "DELETE FROM notifications WHERE id = ?";
  
  db.query(sql, [notificationId], (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to delete notification" });
    }
    
    res.json({ message: "✅ Notification deleted successfully" });
  });
});

/* NOTIFICATIONS - DELETE ALL NOTIFICATIONS FOR USER */
app.delete("/notifications/:userId/all", authenticateToken, (req, res) => {
  const { userId } = req.params;
  
  const sql = "DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE";
  
  db.query(sql, [userId], (err) => {
    if (err) {
      return res.status(500).json({ message: "❌ Failed to delete notifications" });
    }
    
    res.json({ message: "✅ Read notifications deleted successfully" });
  });
});

/* NOTIFICATIONS - SEND APPROVAL NOTIFICATION */
app.post("/notifications/send-approval", authenticateToken, authorizeRoles("admin", "doctor"), (req, res) => {
  const { userId, approverName, itemType, itemTitle } = req.body;
  
  if (!userId || !approverName || !itemType || !itemTitle) {
    return res.status(400).json({ message: "❌ Missing required fields" });
  }
  
  generateApprovalNotification(userId, approverName, itemType, itemTitle);
  
  res.json({ message: "✅ Approval notification sent" });
});

/* NOTIFICATIONS - SEND MEDICAL RECORD NOTIFICATION */
app.post("/notifications/medical-record", authenticateToken, authorizeRoles("doctor", "admin"), (req, res) => {
  const { recordId, patientId, doctorId, action = "created" } = req.body;
  
  if (!recordId || !patientId || !doctorId) {
    return res.status(400).json({ message: "❌ Missing required fields" });
  }
  
  generateMedicalRecordNotification(recordId, patientId, doctorId, action);
  
  res.json({ message: `✅ Medical record ${action} notification sent` });
});

/* NOTIFICATIONS - SEND SYSTEM ALERT */
app.post("/notifications/system-alert", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const { userId, title, message, alertType = "system" } = req.body;
  
  if (!userId || !title || !message) {
    return res.status(400).json({ message: "❌ Missing required fields: userId, title, message" });
  }
  
  generateSystemAlert(userId, title, message, alertType);
  
  res.json({ message: "✅ System alert sent" });
});

/* NOTIFICATIONS - SEND APPOINTMENT REMINDER */
app.post("/notifications/appointment-reminder", authenticateToken, (req, res) => {
  const { appointmentId, patientId, doctorId, appointmentDate, appointmentTime } = req.body;
  
  if (!appointmentId || !patientId || !doctorId || !appointmentDate || !appointmentTime) {
    return res.status(400).json({ message: "❌ Missing required fields" });
  }
  
  generateAppointmentReminder(appointmentId, patientId, doctorId, appointmentDate, appointmentTime);
  
  res.json({ message: "✅ Appointment reminder sent" });
});

/* NOTIFICATION PREFERENCES - GET USER PREFERENCES */
app.get("/notification-preferences/:userId", authenticateToken, (req, res) => {
  const { userId } = req.params;
  
  // Check if user can access this
  if (req.user.role === "patient" && req.user.id !== Number(userId)) {
    return res.status(403).json({ message: "❌ Forbidden" });
  }
  if (req.user.role === "doctor" && req.user.id !== Number(userId)) {
    return res.status(403).json({ message: "❌ Forbidden" });
  }
  
  const sql = `
    SELECT email_notifications, sms_notifications, push_notifications
    FROM notification_preferences
    WHERE user_id = ?
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching preferences:", err);
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    if (results.length === 0) {
      // Return default preferences
      return res.json({
        message: "✅ Preferences retrieved",
        preferences: {
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true
        }
      });
    }
    
    res.json({
      message: "✅ Preferences retrieved",
      preferences: results[0]
    });
  });
});

/* NOTIFICATION PREFERENCES - UPDATE USER PREFERENCES */
app.put("/notification-preferences/:userId", authenticateToken, (req, res) => {
  const { userId } = req.params;
  const { emailNotifications, smsNotifications, pushNotifications } = req.body;
  
  // Check if user can update their own preferences
  if (req.user.role === "patient" && req.user.id !== Number(userId)) {
    return res.status(403).json({ message: "❌ Forbidden" });
  }
  if (req.user.role === "doctor" && req.user.id !== Number(userId)) {
    return res.status(403).json({ message: "❌ Forbidden" });
  }
  
  // First check if preferences exist for this user
  const checkSql = "SELECT id FROM notification_preferences WHERE user_id = ?";
  db.query(checkSql, [userId], (err, results) => {
    if (err) {
      console.error("Error checking preferences:", err);
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    if (results.length === 0) {
      // Create new preferences
      const insertSql = `
        INSERT INTO notification_preferences (user_id, email_notifications, sms_notifications, push_notifications)
        VALUES (?, ?, ?, ?)
      `;
      db.query(insertSql, [userId, emailNotifications, smsNotifications, pushNotifications], (err) => {
        if (err) {
          console.error("Error creating preferences:", err);
          return res.status(500).json({ message: "❌ Failed to create preferences" });
        }
        
        res.json({ message: "✅ Preferences saved successfully" });
      });
    } else {
      // Update existing preferences
      const updateSql = `
        UPDATE notification_preferences
        SET email_notifications = ?, sms_notifications = ?, push_notifications = ?
        WHERE user_id = ?
      `;
      db.query(updateSql, [emailNotifications, smsNotifications, pushNotifications, userId], (err) => {
        if (err) {
          console.error("Error updating preferences:", err);
          return res.status(500).json({ message: "❌ Failed to update preferences" });
        }
        
        res.json({ message: "✅ Preferences saved successfully" });
      });
    }
  });
});

/* DOCTOR AVAILABILITY */
// Get doctor availability
app.get("/doctor/:doctorId/availability", (req, res) => {
  const { doctorId } = req.params;
  
  const sql = "SELECT unavailable_date, reason FROM doctor_availability WHERE doctor_id = ? ORDER BY unavailable_date";
  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      console.error("Error fetching doctor availability:", err);
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({
      message: "✅ Doctor availability retrieved",
      unavailable_dates: results || []
    });
  });
});

// Add unavailable date for doctor (doctor only)
app.post("/doctor/availability", authenticateToken, authorizeRoles("doctor", "admin"), (req, res) => {
  const { unavailable_date, reason } = req.body;
  const doctor_id = req.user.id; // Doctor setting their own availability
  
  if (!unavailable_date) {
    return res.status(400).json({ message: "❌ Unavailable date is required" });
  }
  
  const sql = "INSERT INTO doctor_availability (doctor_id, unavailable_date, reason) VALUES (?, ?, ?)";
  db.query(sql, [doctor_id, unavailable_date, reason || null], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: "⚠️  Doctor is already marked unavailable on this date" });
      }
      console.error("Error adding unavailable date:", err);
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    res.json({ message: "✅ Doctor marked as unavailable on this date" });
  });
});

// Remove unavailable date for doctor
app.delete("/doctor/availability/:dateId", authenticateToken, authorizeRoles("doctor", "admin"), (req, res) => {
  const { dateId } = req.params;
  const doctor_id = req.user.id;
  
  const sql = "DELETE FROM doctor_availability WHERE id = ? AND doctor_id = ?";
  db.query(sql, [dateId, doctor_id], (err, results) => {
    if (err) {
      console.error("Error removing unavailable date:", err);
      return res.status(500).json({ message: "❌ Database error" });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "❌ Availability record not found" });
    }
    
    res.json({ message: "✅ Doctor availability removed" });
  });
});

/* ========== DOCTOR AVAILABILITY SYSTEM ========== */
const availabilityRoutes = require('./routes/availability');
app.use('/api', availabilityRoutes);
app.use('/', availabilityRoutes);

module.exports = app;

/* SERVER */
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
