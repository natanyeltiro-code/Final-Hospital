/**
 * Doctor Availability Routes
 * Simple API endpoints for managing doctor availability
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// ============================================================
// GET DOCTOR AVAILABILITY STATUS
// ============================================================

/**
 * GET /api/doctor/:doctorId/availability
 * Get current availability status of a doctor
 */
router.get("/doctor/:doctorId/availability", (req, res) => {
  const { doctorId } = req.params;

  const sql = "SELECT id, name, specialty, status, work_start_time, work_end_time FROM users WHERE id = ? AND role = 'doctor'";
  
  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      console.error("Error fetching doctor availability:", err);
      return res.status(500).json({ message: "❌ Error fetching availability" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "❌ Doctor not found" });
    }

    const doctor = results[0];
    res.json({
      message: "✅ Doctor availability retrieved",
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        status: doctor.status,
        workingHours: {
          start: doctor.work_start_time,
          end: doctor.work_end_time,
        },
      },
    });
  });
});

// ============================================================
// UPDATE DOCTOR STATUS (Doctor can update their own)
// ============================================================

/**
 * PUT /api/doctor/status/:doctorId
 * Update doctor status (Available, Busy, Off-duty)
 */
router.put("/doctor/status/:doctorId", authenticateToken, authorizeRoles("doctor", "admin"), (req, res) => {
  const { doctorId } = req.params;
  const { status } = req.body;

  // Verify user is updating their own status or is admin
  if (req.user.id !== parseInt(doctorId) && req.user.role !== "admin") {
    return res.status(403).json({ message: "❌ You can only update your own status" });
  }

  const validStatuses = ["Available", "Busy", "Off-duty"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "❌ Invalid status. Must be: Available, Busy, or Off-duty" });
  }

  const sql = "UPDATE users SET status = ?, last_status_update = CURRENT_TIMESTAMP WHERE id = ? AND role = 'doctor'";

  db.query(sql, [status, doctorId], (err) => {
    if (err) {
      console.error("Error updating doctor status:", err);
      return res.status(500).json({ message: "❌ Error updating status" });
    }

    res.json({
      message: "✅ Doctor status updated successfully",
      status: status,
    });
  });
});

// ============================================================
// GET AVAILABLE DOCTORS (for patient booking)
// ============================================================

/**
 * GET /api/available-doctors?specialty=Cardiology&date=2026-04-20
 * Get list of available doctors for a specific department and date
 * Note: Query param is called 'specialty' for compatibility, but filters by 'department' column
 */
router.get("/available-doctors", (req, res) => {
  const { specialty, date } = req.query;

  if (!specialty || !date) {
    return res.status(400).json({ message: "❌ Department and date are required" });
  }

  console.log(`\n🔍 Searching for doctors with department='${specialty}' on date='${date}'`);

  // Get current time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}:00`;

  const sql = `
    SELECT id, name, specialty, department, status, work_start_time, work_end_time
    FROM users
    WHERE role = 'doctor' 
      AND department = ?
      AND status IN ('Available', 'Busy')
      AND (
        SELECT COUNT(*) FROM doctor_schedule 
        WHERE doctor_id = users.id 
          AND schedule_date = ?
          AND schedule_type = 'Off'
      ) = 0
    ORDER BY status DESC, name ASC
  `;

  console.log(`📝 Query params: [${specialty}, ${date}]`);

  db.query(sql, [specialty, date], (err, results) => {
    if (err) {
      console.error("❌ Error fetching available doctors:", err);
      return res.status(500).json({ message: "❌ Error fetching doctors" });
    }

    console.log(`✅ Found ${results.length} doctors`);
    if (results.length === 0) {
      console.log("Debug: Let me check all Cardiology doctors...");
      db.query("SELECT id, name, department, status FROM users WHERE role='doctor' AND department='Cardiology'", (err2, allDocs) => {
        console.log("All Cardiology doctors:", allDocs);
      });
    }

    res.json({
      message: `✅ Found ${results.length} available doctors`,
      doctors: results,
    });
  });
});

// ============================================================
// GET AVAILABLE TIME SLOTS
// ============================================================

/**
 * GET /api/available-slots/:doctorId?date=2026-04-20
 * Get available appointment slots for a doctor on a specific date
 */
router.get("/available-slots/:doctorId", (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "❌ Date is required" });
  }

  const sql = `
    SELECT id, slot_time, duration_minutes, is_available
    FROM available_slots
    WHERE doctor_id = ? AND slot_date = ? AND is_available = TRUE
    ORDER BY slot_time ASC
  `;

  db.query(sql, [doctorId, date], (err, results) => {
    if (err) {
      console.error("Error fetching slots:", err);
      return res.status(500).json({ message: "❌ Error fetching slots" });
    }

    if (results.length === 0) {
      return res.json({
        message: "⚠️ No available slots for this date",
        slots: [],
      });
    }

    res.json({
      message: `✅ Found ${results.length} available slots`,
      date: date,
      slots: results.map((slot) => ({
        id: slot.id,
        time: slot.slot_time,
        duration: slot.duration_minutes,
      })),
    });
  });
});

// ============================================================
// GENERATE TIME SLOTS (for doctor's working hours)
// ============================================================

/**
 * POST /api/generate-slots/:doctorId
 * Generate available time slots based on doctor's working hours
 * Body: { date, slotDuration }
 */
router.post("/generate-slots/:doctorId", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const { doctorId } = req.params;
  const { date, slotDuration = 30 } = req.body;

  if (!date) {
    return res.status(400).json({ message: "❌ Date is required" });
  }

  // Get doctor's working hours
  const sql = "SELECT work_start_time, work_end_time FROM users WHERE id = ? AND role = 'doctor'";

  db.query(sql, [doctorId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "❌ Doctor not found or not a doctor" });
    }

    const doctor = results[0];
    const startTime = doctor.work_start_time;
    const endTime = doctor.work_end_time;

    // Generate time slots
    const slots = [];
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}:00`;

      slots.push([doctorId, date, timeStr, slotDuration, true]);

      currentMin += slotDuration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    // Insert slots
    const insertSql = "INSERT INTO available_slots (doctor_id, slot_date, slot_time, duration_minutes, is_available) VALUES ?";

    db.query(insertSql, [slots], (err) => {
      if (err) {
        // Slots might already exist, that's ok
        if (!err.message.includes("Duplicate")) {
          console.error("Error generating slots:", err);
          return res.status(500).json({ message: "❌ Error generating slots" });
        }
      }

      res.json({
        message: `✅ Generated ${slots.length} time slots`,
        date: date,
        slotCount: slots.length,
      });
    });
  });
});

// ============================================================
// BOOK APPOINTMENT SLOT
// ============================================================

/**
 * POST /api/book-slot
 * Mark a slot as booked when appointment is created
 * Body: { slotId, appointmentId }
 */
router.post("/book-slot", authenticateToken, authorizeRoles("patient", "admin"), (req, res) => {
  const { slotId, appointmentId } = req.body;

  if (!slotId || !appointmentId) {
    return res.status(400).json({ message: "❌ Slot ID and Appointment ID are required" });
  }

  const sql = "UPDATE available_slots SET is_available = FALSE, appointment_id = ? WHERE id = ?";

  db.query(sql, [appointmentId, slotId], (err) => {
    if (err) {
      console.error("Error booking slot:", err);
      return res.status(500).json({ message: "❌ Error booking slot" });
    }

    res.json({ message: "✅ Slot booked successfully" });
  });
});

// ============================================================
// SET DOCTOR SCHEDULE (Leave, Off)
// ============================================================

/**
 * POST /api/doctor/schedule
 * Set doctor's schedule (e.g., on leave, day off)
 * Body: { doctorId, date, scheduleType, reason }
 */
router.post("/doctor/schedule", authenticateToken, authorizeRoles("doctor", "admin"), (req, res) => {
  const { doctorId, date, scheduleType, reason } = req.body;

  // Verify user is updating their own schedule or is admin
  if (req.user.id !== parseInt(doctorId) && req.user.role !== "admin") {
    return res.status(403).json({ message: "❌ You can only update your own schedule" });
  }

  const validTypes = ["Available", "Leave", "Off"];
  if (!validTypes.includes(scheduleType)) {
    return res.status(400).json({ message: "❌ Invalid schedule type" });
  }

  const sql = `
    INSERT INTO doctor_schedule (doctor_id, schedule_date, schedule_type, reason)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE schedule_type = ?, reason = ?
  `;

  db.query(sql, [doctorId, date, scheduleType, reason, scheduleType, reason], (err) => {
    if (err) {
      console.error("Error setting schedule:", err);
      return res.status(500).json({ message: "❌ Error setting schedule" });
    }

    res.json({
      message: "✅ Schedule updated successfully",
      date: date,
      type: scheduleType,
    });
  });
});

// ============================================================
// GET DOCTOR SCHEDULE
// ============================================================

/**
 * GET /api/doctor/:doctorId/schedule?startDate=2026-04-20&endDate=2026-04-30
 * Get doctor's schedule for a date range
 */
router.get("/doctor/:doctorId/schedule", (req, res) => {
  const { doctorId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "❌ startDate and endDate are required" });
  }

  const sql = `
    SELECT schedule_date, schedule_type, reason
    FROM doctor_schedule
    WHERE doctor_id = ? AND schedule_date BETWEEN ? AND ?
    ORDER BY schedule_date ASC
  `;

  db.query(sql, [doctorId, startDate, endDate], (err, results) => {
    if (err) {
      console.error("Error fetching schedule:", err);
      return res.status(500).json({ message: "❌ Error fetching schedule" });
    }

    res.json({
      message: "✅ Doctor schedule retrieved",
      schedule: results,
    });
  });
});

// ============================================================
// AUTO-UPDATE STATUS (based on appointments)
// ============================================================

/**
 * POST /api/auto-update-status/:doctorId
 * Automatically update doctor status based on their appointments
 * (Call this after appointment is created/deleted)
 */
router.post("/auto-update-status/:doctorId", authenticateToken, (req, res) => {
  const { doctorId } = req.params;
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;

  // Check if doctor is on leave today
  const scheduleCheckSql = `
    SELECT schedule_type FROM doctor_schedule
    WHERE doctor_id = ? AND schedule_date = ?
  `;

  db.query(scheduleCheckSql, [doctorId, today], (err, scheduleResults) => {
    if (!err && scheduleResults.length > 0) {
      const schedule = scheduleResults[0];
      if (schedule.schedule_type === "Off" || schedule.schedule_type === "Leave") {
        // Set to Off-duty if on leave
        db.query("UPDATE users SET status = 'Off-duty' WHERE id = ?", [doctorId]);
        return res.json({ message: "✅ Status updated: Off-duty (On leave)" });
      }
    }

    // Check if doctor has appointment right now
    const appointmentCheckSql = `
      SELECT id FROM appointments
      WHERE doctor_id = ? 
        AND date = ?
        AND TIME(CONCAT(date, ' ', TIME(NOW()))) BETWEEN TIME(time) AND DATE_ADD(TIME(time), INTERVAL 30 MINUTE)
        AND status NOT IN ('Cancelled', 'Completed')
    `;

    db.query(appointmentCheckSql, [doctorId, today], (err, appointmentResults) => {
      if (!err && appointmentResults.length > 0) {
        // Set to Busy if has appointment
        db.query("UPDATE users SET status = 'Busy' WHERE id = ?", [doctorId]);
        return res.json({ message: "✅ Status updated: Busy (In appointment)" });
      }

      // Otherwise set to Available
      db.query("UPDATE users SET status = 'Available' WHERE id = ?", [doctorId]);
      res.json({ message: "✅ Status updated: Available" });
    });
  });
});

module.exports = router;
