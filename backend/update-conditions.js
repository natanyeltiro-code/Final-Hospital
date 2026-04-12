require("dotenv").config();
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "medicare",
});

connection.connect((err) => {
  if (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }

  // Update patient conditions from their medical records (most recent diagnosis)
  const sql = `
    UPDATE users u
    SET u.\`condition\` = (
      SELECT mr.diagnosis
      FROM medical_records mr
      WHERE mr.patient_id = u.id
      ORDER BY mr.record_date DESC
      LIMIT 1
    )
    WHERE u.role = 'patient' AND EXISTS (
      SELECT 1 FROM medical_records WHERE patient_id = u.id
    )
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error updating conditions:", err);
      connection.end();
      process.exit(1);
    }

    console.log("✅ Updated patient conditions from medical records");
    console.log(`Affected rows: ${results.affectedRows}`);
    connection.end();
    process.exit(0);
  });
});
