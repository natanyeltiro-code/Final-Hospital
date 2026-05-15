-- Simple Doctor Availability System
-- Add these columns to your existing database

-- Add availability status to users table (doctor status)
SET @status_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'status'
);
SET @status_sql = IF(
  @status_exists = 0,
  "ALTER TABLE users ADD COLUMN status ENUM('Available', 'Busy', 'Off-duty') DEFAULT 'Available'",
  "SELECT 'users.status already exists'"
);
PREPARE stmt FROM @status_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @last_status_update_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'last_status_update'
);
SET @last_status_update_sql = IF(
  @last_status_update_exists = 0,
  "ALTER TABLE users ADD COLUMN last_status_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
  "SELECT 'users.last_status_update already exists'"
);
PREPARE stmt FROM @last_status_update_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add working hours to users table (doctor schedule)
SET @work_start_time_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'work_start_time'
);
SET @work_start_time_sql = IF(
  @work_start_time_exists = 0,
  "ALTER TABLE users ADD COLUMN work_start_time TIME DEFAULT '08:00:00'",
  "SELECT 'users.work_start_time already exists'"
);
PREPARE stmt FROM @work_start_time_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @work_end_time_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'work_end_time'
);
SET @work_end_time_sql = IF(
  @work_end_time_exists = 0,
  "ALTER TABLE users ADD COLUMN work_end_time TIME DEFAULT '23:59:00'",
  "SELECT 'users.work_end_time already exists'"
);
PREPARE stmt FROM @work_end_time_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create simple doctor_schedule table for leave/time-off
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
);

-- Add appointment slots tracking (when doctors are busy)
ALTER TABLE appointments MODIFY patient_id INT NULL;
SET @patient_name_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'appointments'
    AND COLUMN_NAME = 'patient_name'
);
SET @patient_name_sql = IF(
  @patient_name_exists = 0,
  "ALTER TABLE appointments ADD COLUMN patient_name VARCHAR(255)",
  "SELECT 'appointments.patient_name already exists'"
);
PREPARE stmt FROM @patient_name_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @patient_phone_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'appointments'
    AND COLUMN_NAME = 'patient_phone'
);
SET @patient_phone_sql = IF(
  @patient_phone_exists = 0,
  "ALTER TABLE appointments ADD COLUMN patient_phone VARCHAR(20)",
  "SELECT 'appointments.patient_phone already exists'"
);
PREPARE stmt FROM @patient_phone_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @slot_id_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'appointments'
    AND COLUMN_NAME = 'slot_id'
);
SET @slot_id_sql = IF(
  @slot_id_exists = 0,
  "ALTER TABLE appointments ADD COLUMN slot_id INT",
  "SELECT 'appointments.slot_id already exists'"
);
PREPARE stmt FROM @slot_id_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @appointment_duration_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'appointments'
    AND COLUMN_NAME = 'appointment_duration'
);
SET @appointment_duration_sql = IF(
  @appointment_duration_exists = 0,
  "ALTER TABLE appointments ADD COLUMN appointment_duration INT DEFAULT 30",
  "SELECT 'appointments.appointment_duration already exists'"
);
PREPARE stmt FROM @appointment_duration_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create available slots table
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
);

-- Verify table creation
SHOW TABLES;
