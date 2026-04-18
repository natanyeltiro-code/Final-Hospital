-- Create Medicare Database
CREATE DATABASE IF NOT EXISTS medicare;
USE medicare;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'doctor', 'patient') NOT NULL,
  phone VARCHAR(20),
  condition VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Appointments Table
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
);

-- Medical Records Table
CREATE TABLE IF NOT EXISTS medical_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  diagnosis TEXT,
  treatment TEXT,
  record_date DATE NOT NULL,
  status ENUM('Draft', 'Active', 'Archived', 'Reviewed') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_token (token)
);

-- Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  appointment_id INT NOT NULL,
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
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert Sample Users
INSERT INTO users (name, email, password, role, phone) VALUES
('Dr. Sarah Jenkins', 'sarah.j@hospital.com', '$2b$10$YourHashedPasswordHere1', 'doctor', '+1 234-567-8901'),
('Dr. James Wilson', 'james.w@hospital.com', '$2b$10$YourHashedPasswordHere2', 'doctor', '+1 234-567-8902'),
('Admin User', 'admin@hospital.com', '$2b$10$YourHashedPasswordHere3', 'admin', '+1 234-567-8900'),
('John Doe', 'john.doe@email.com', '$2b$10$YourHashedPasswordHere4', 'patient', '+1 987-654-3210'),
('Jane Smith', 'jane.s@email.com', '$2b$10$YourHashedPasswordHere5', 'patient', '+1 987-654-3211'),
('Robert Johnson', 'rj@email.com', '$2b$10$YourHashedPasswordHere6', 'patient', '+1 987-654-3212');

-- Insert Sample Appointments
INSERT INTO appointments (patient_id, doctor_id, date, time, type, status) VALUES
(4, 1, '2026-04-18', '11:00:00', 'Follow-up', 'Pending'),
(4, 1, '2026-04-11', '09:00:00', 'Follow-up', 'Completed'),
(5, 1, '2026-04-20', '14:00:00', 'Consultation', 'Pending');

-- Insert Sample Medical Records
INSERT INTO medical_records (patient_id, doctor_id, title, diagnosis, treatment, record_date, status) VALUES
(4, 1, 'Essential Hypertension', 'High blood pressure readings', 'Lifestyle modifications, Medication', '2023-10-15', 'Active'),
(5, 1, 'Routine Cardiology Checkup', 'Normal ECG, Stable blood pressure', 'Continue current medication', '2023-08-22', 'Completed'),
(6, 2, 'Osteoarthritis of knee', 'Mild wear and tear detected', 'Physical therapy, Pain management', '2023-11-02', 'Active');

-- Create Indexes for Performance
CREATE INDEX idx_patient_id ON appointments(patient_id);
CREATE INDEX idx_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_doctor ON medical_records(doctor_id);
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_role ON users(role);
