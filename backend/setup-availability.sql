-- Simple Doctor Availability System
-- Add these columns to your existing database

-- Add availability status to users table (doctor status)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('Available', 'Busy', 'Off-duty') DEFAULT 'Available';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add working hours to users table (doctor schedule)
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '09:00:00';
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '18:00:00';

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
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS slot_id INT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_duration INT DEFAULT 30;

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
