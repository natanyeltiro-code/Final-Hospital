const mysql = require("mysql2");
const bcrypt = require("bcrypt");

// Create connection to MySQL WITHOUT specifying database first
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "@Nathaniel123",
});

connection.connect((err) => {
  if (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL Server");
  setupDatabase();
});

async function setupDatabase() {
  try {
    // Create database
    connection.query("CREATE DATABASE IF NOT EXISTS medicare", (err) => {
      if (err) {
        console.error("Failed to create database:", err);
        process.exit(1);
      }
      console.log("✅ Database 'medicare' created/exists");
      createTables();
    });
  } catch (error) {
    console.error("Setup error:", error);
    process.exit(1);
  }
}

function createTables() {
  const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "@Nathaniel123",
    database: "medicare",
  });

  db.connect((err) => {
    if (err) {
      console.error("Failed to connect to medicare database:", err);
      process.exit(1);
    }
    console.log("✅ Connected to 'medicare' database");

    // Create Users Table
    const usersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'doctor', 'patient') NOT NULL,
        phone VARCHAR(20),
        blood_group VARCHAR(10),
        age INT,
        gender VARCHAR(20),
        date_of_birth DATE,
        address VARCHAR(255),
        emergency_contact VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    db.query(usersTableQuery, (err) => {
      if (err) {
        console.error("Failed to create users table:", err);
        process.exit(1);
      }
      console.log("✅ Users table created/exists");

      const requiredColumns = [
        { name: 'phone', definition: 'VARCHAR(20)' },
        { name: 'blood_group', definition: 'VARCHAR(10)' },
        { name: 'age', definition: 'INT' },
        { name: 'gender', definition: 'VARCHAR(20)' },
        { name: 'date_of_birth', definition: 'DATE' },
        { name: 'address', definition: 'VARCHAR(255)' },
        { name: 'emergency_contact', definition: 'VARCHAR(50)' },
        { name: 'condition', definition: 'VARCHAR(255)' },
      ];

      const ensureColumn = (column, callback) => {
        const checkColumnQuery = `
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = 'medicare'
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = ?
        `;

        db.query(checkColumnQuery, [column.name], (err, results) => {
          if (err) {
            console.error(`Failed to check ${column.name} column:`, err);
            callback();
            return;
          }

          if (results.length === 0) {
            const addColumnQuery = `ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`;
            db.query(addColumnQuery, (err) => {
              if (err) {
                console.error(`Failed to add ${column.name} column:`, err);
              } else {
                console.log(`✅ ${column.name} column added`);
              }
              callback();
            });
          } else {
            callback();
          }
        });
      };

      const ensureColumnsRecursively = (columns) => {
        if (columns.length === 0) {
          createAppointmentsTable();
          return;
        }

        const [first, ...rest] = columns;
        ensureColumn(first, () => ensureColumnsRecursively(rest));
      };

      ensureColumnsRecursively(requiredColumns);
    });

    function createAppointmentsTable() {
      const appointmentsTableQuery = `
        CREATE TABLE IF NOT EXISTS appointments (
          id INT PRIMARY KEY AUTO_INCREMENT,
          patient_id INT NOT NULL,
          doctor_id INT NOT NULL,
          date DATE NOT NULL,
          time TIME NOT NULL,
          type VARCHAR(100),
          status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `;

      db.query(appointmentsTableQuery, (err) => {
        if (err) {
          console.error("Failed to create appointments table:", err);
          process.exit(1);
        }
        console.log("✅ Appointments table created/exists");
        createMedicalRecordsTable();
      });
    }

    function createMedicalRecordsTable() {
      const medicalRecordsTableQuery = `
        CREATE TABLE IF NOT EXISTS medical_records (
          id INT PRIMARY KEY AUTO_INCREMENT,
          patient_id INT NOT NULL,
          doctor_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          diagnosis TEXT,
          treatment TEXT,
          record_date DATE NOT NULL,
          status ENUM('Draft', 'Active', 'Archived', 'Reviewed', 'Completed') DEFAULT 'Active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `;

      db.query(medicalRecordsTableQuery, (err) => {
        if (err) {
          console.error("Failed to create medical_records table:", err);
          process.exit(1);
        }
        console.log("✅ Medical Records table created/exists");
        createPrescriptionsTable();
      });
    }

    function createPrescriptionsTable() {
      const prescriptionsTableQuery = `
        CREATE TABLE IF NOT EXISTS prescriptions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          appointment_id INT NULL,
          medical_record_id INT NULL,
          patient_id INT NOT NULL,
          doctor_id INT NOT NULL,
          medication VARCHAR(255) NOT NULL,
          dosage VARCHAR(100) NOT NULL,
          frequency VARCHAR(100),
          duration VARCHAR(100),
          instructions TEXT,
          prescribed_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
          FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE SET NULL,
          FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `;

      db.query(prescriptionsTableQuery, (err) => {
        if (err) {
          console.error("Failed to create prescriptions table:", err);
          process.exit(1);
        }
        console.log("✅ Prescriptions table created/exists");
        createDoctorAvailabilityTable();
      });
    }

    function createDoctorAvailabilityTable() {
      const doctorAvailabilityTableQuery = `
        CREATE TABLE IF NOT EXISTS doctor_availability (
          id INT PRIMARY KEY AUTO_INCREMENT,
          doctor_id INT NOT NULL,
          unavailable_date DATE NOT NULL,
          reason VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_doctor_date (doctor_id, unavailable_date),
          FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `;

      db.query(doctorAvailabilityTableQuery, (err) => {
        if (err) {
          console.error("Failed to create doctor_availability table:", err);
          process.exit(1);
        }
        console.log("✅ Doctor availability table created/exists");
        seedDatabase();
      });
    }

    async function seedDatabase() {
      // Check if data already exists
      db.query("SELECT COUNT(*) as count FROM users", async (err, results) => {
        if (results[0].count > 0) {
          console.log("✅ Database already has data. Skipping seed.");
          closeConnection();
          return;
        }

        try {
          // Hash passwords for sample data
          const adminPassword = await bcrypt.hash("admin123", 10);
          const doctorPassword = await bcrypt.hash("doctor123", 10);
          const patientPassword = await bcrypt.hash("patient123", 10);

          // Insert sample users
          const users = [
            ["Dr. Sarah Jenkins", "sarah.j@hospital.com", doctorPassword, "doctor", "+1 234-567-8901", null, null],
            ["Dr. James Wilson", "james.w@hospital.com", doctorPassword, "doctor", "+1 234-567-8902", null, null],
            ["Admin User", "admin@hospital.com", adminPassword, "admin", "+1 234-567-8900", null, null],
            ["John Doe", "john.doe@email.com", patientPassword, "patient", "+1 987-654-3210", 45, "Male"],
            ["Jane Smith", "jane.s@email.com", patientPassword, "patient", "+1 987-654-3211", 32, "Female"],
            ["Robert Johnson", "rj@email.com", patientPassword, "patient", "+1 987-654-3212", 58, "Male"],
          ];

          for (const user of users) {
            db.query(
              "INSERT INTO users (name, email, password, role, phone, age, gender) VALUES (?, ?, ?, ?, ?, ?, ?)",
              user,
              (err) => {
                if (err) console.error("Error inserting user:", err);
              }
            );
          }

          console.log("✅ Sample users created");

          // Insert sample appointments after users are created
          setTimeout(() => {
            const appointments = [
              [4, 1, "2026-04-18", "11:00:00", "Follow-up", "Pending"],
              [4, 1, "2026-04-11", "09:00:00", "Follow-up", "Completed"],
              [5, 1, "2026-04-20", "14:00:00", "Consultation", "Pending"],
            ];

            for (const apt of appointments) {
              db.query(
                "INSERT INTO appointments (patient_id, doctor_id, date, time, type, status) VALUES (?, ?, ?, ?, ?, ?)",
                apt,
                (err) => {
                  if (err) console.error("Error inserting appointment:", err);
                }
              );
            }

            console.log("✅ Sample appointments created");

            // Insert sample medical records
            const records = [
              [
                4,
                1,
                "Essential Hypertension",
                "High blood pressure readings",
                "Lifestyle modifications, Medication",
                "2023-10-15",
                "Active",
              ],
              [
                5,
                1,
                "Routine Cardiology Checkup",
                "Normal ECG, Stable blood pressure",
                "Continue current medication",
                "2023-08-22",
                "Completed",
              ],
              [
                6,
                2,
                "Osteoarthritis of knee",
                "Mild wear and tear detected",
                "Physical therapy, Pain management",
                "2023-11-02",
                "Active",
              ],
            ];

            for (const record of records) {
              db.query(
                "INSERT INTO medical_records (patient_id, doctor_id, title, diagnosis, treatment, record_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                record,
                (err) => {
                  if (err) {
                    console.error("Error inserting medical record:", err);
                  } else {
                    // Update patient condition with diagnosis
                    const patientId = record[0];
                    const diagnosis = record[3];
                    db.query(
                      "UPDATE users SET `condition` = ? WHERE id = ?",
                      [diagnosis, patientId],
                      (updateErr) => {
                        if (updateErr) {
                          console.error("Error updating patient condition:", updateErr);
                        }
                      }
                    );
                  }
                }
              );
            }

            console.log("✅ Sample medical records created");
            setTimeout(() => closeConnection(), 500);
          }, 1000);
        } catch (error) {
          console.error("Error during seeding:", error);
          closeConnection();
        }
      });
    }

    function closeConnection() {
      db.end(() => {
        connection.end(() => {
          console.log("\n✅ Database setup complete!");
          console.log("\n📝 Sample Login Credentials:");
          console.log("Admin: admin@hospital.com / admin123");
          console.log("Doctor: sarah.j@hospital.com / doctor123");
          console.log("Patient: john.doe@email.com / patient123");
          process.exit(0);
        });
      });
    }
  });
}
