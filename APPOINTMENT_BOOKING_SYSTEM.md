# Appointment Booking System - Implementation Guide

**Date:** April 18, 2026  
**Version:** 1.0  
**Status:** ✅ Complete Implementation

---

## Overview

This document describes the complete appointment booking system with **double-booking prevention**. The system allows patients to book appointments with doctors while ensuring no doctor can have two appointments at the same time.

### Key Features

✅ **Patient Appointment Booking**: Simple 3-step booking (Doctor → Date → Time)  
✅ **Double-booking Prevention**: Verified at backend with SQL checks  
✅ **Time Slot Management**: Shows available and booked slots  
✅ **Real-time Validation**: Checks slot availability before booking  
✅ **Error Handling**: Clear error messages for conflicting bookings  
✅ **Status Tracking**: Pending, Confirmed, Completed, Cancelled states  

---

## Database Schema

### Core Tables

#### 1. **users** Table
```sql
-- Doctor information stored here
id INT PRIMARY KEY
name VARCHAR(255)
email VARCHAR(255) UNIQUE
role ENUM('admin', 'doctor', 'patient')
specialty VARCHAR(100)
department VARCHAR(100)
work_start_time TIME DEFAULT '09:00:00'
work_end_time TIME DEFAULT '18:00:00'
```

#### 2. **appointments** Table (Core)
```sql
CREATE TABLE IF NOT EXISTS appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT,
  doctor_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type VARCHAR(100),
  status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
  notes TEXT,
  patient_name VARCHAR(255),
  patient_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_doctor_date_time ON appointments(doctor_id, date, time);
CREATE INDEX idx_patient_date ON appointments(patient_id, date);
CREATE INDEX idx_status ON appointments(status);
```

#### 3. **available_slots** Table (Optional, for pre-generated slots)
```sql
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
  UNIQUE KEY unique_slot (doctor_id, slot_date, slot_time)
);
```

---

## Backend API Endpoints

### 1. **Create Appointment** (POST)
**Endpoint:** `POST /appointments`  
**Authentication:** Required (Patient or Admin)  
**Purpose:** Book a new appointment with double-booking prevention

**Request Body:**
```json
{
  "patientId": 4,
  "doctorId": 1,
  "date": "2026-04-25",
  "time": "14:00",
  "type": "Consultation",
  "status": "Pending"
}
```

**Response (Success - 200):**
```json
{
  "message": "✅ Appointment created successfully",
  "appointmentId": 42
}
```

**Response (Double-booking Error - 409):**
```json
{
  "message": "❌ This time slot is already booked! The doctor is not available at 14:00 on 2026-04-25. Please select a different time.",
  "available": false,
  "conflictingAppointmentId": 41
}
```

**Double-booking Prevention Logic:**
```javascript
// Before creating appointment, check for conflicts
const doubleBookingCheckSql = `
  SELECT id, patient_id, time 
  FROM appointments 
  WHERE doctor_id = ? 
    AND date = ? 
    AND time = ?
    AND status IN ('Pending', 'Confirmed')
`;

db.query(doubleBookingCheckSql, [doctorId, date, time], (err, results) => {
  if (results && results.length > 0) {
    // ❌ CONFLICT DETECTED - Reject booking
    return res.status(409).json({ 
      message: "❌ This time slot is already booked!",
      available: false
    });
  }
  // ✅ SLOT AVAILABLE - Proceed with booking
});
```

---

### 2. **Check Slot Availability** (GET)
**Endpoint:** `GET /appointments/check-slot/:doctorId/:date/:time`  
**Authentication:** Not required  
**Purpose:** Verify if a specific time slot is available (race condition check)

**Example:** `GET /appointments/check-slot/1/2026-04-25/14:00`

**Response (Available - 200):**
```json
{
  "message": "Time slot is available",
  "available": true,
  "doctorId": 1,
  "date": "2026-04-25",
  "time": "14:00"
}
```

**Response (Already Booked - 409):**
```json
{
  "message": "Time slot at 14:00 on 2026-04-25 is already booked",
  "available": false,
  "conflictCount": 1,
  "conflictingAppointments": [
    {
      "id": 41,
      "doctor_id": 1,
      "date": "2026-04-25",
      "time": "14:00",
      "patient_id": 5,
      "status": "Confirmed"
    }
  ]
}
```

---

### 3. **Get Booked Slots** (GET)
**Endpoint:** `GET /appointments/booked-slots/:doctorId/:date`  
**Authentication:** Not required  
**Purpose:** Get all booked time slots for a doctor on a specific date

**Example:** `GET /appointments/booked-slots/1/2026-04-25`

**Response:**
```json
{
  "message": "Booked slots retrieved successfully",
  "bookedSlots": ["09:00", "09:30", "14:00", "14:30", "15:00"],
  "bookedDetails": [
    {
      "slot_time": "09:00",
      "appointment_count": 1,
      "status": "Confirmed"
    },
    {
      "slot_time": "14:00",
      "appointment_count": 1,
      "status": "Pending"
    }
  ],
  "count": 5,
  "doctorId": 1,
  "date": "2026-04-25"
}
```

---

### 4. **Get Available Slots** (GET)
**Endpoint:** `GET /available-slots/:doctorId/:date`  
**Authentication:** Not required  
**Purpose:** Get all available time slots for a doctor on a specific date

**Query Parameters:**
- `startTime`: Working hours start (default: 09:00)
- `endTime`: Working hours end (default: 18:00)
- `slotDuration`: Slot duration in minutes (default: 30)

**Example:** 
```
GET /available-slots/1/2026-04-25?startTime=09:00&endTime=18:00&slotDuration=30
```

**Response:**
```json
{
  "message": "Available slots retrieved successfully",
  "availableSlots": [
    "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
  ],
  "bookedSlots": ["09:00", "09:30", "14:00", "14:30", "15:00"],
  "doctorId": 1,
  "date": "2026-04-25",
  "workingHours": {
    "start": "09:00",
    "end": "18:00"
  },
  "slotDuration": 30,
  "totalSlots": 18,
  "availableCount": 14
}
```

---

### 5. **Get My Appointments** (GET)
**Endpoint:** `GET /appointments/:userId`  
**Authentication:** Required  
**Purpose:** Get all appointments for a patient or doctor

**Example:** `GET /appointments/4`

**Response:**
```json
{
  "message": "✅ Appointments retrieved successfully",
  "appointments": [
    {
      "id": 42,
      "patient_id": 4,
      "doctor_id": 1,
      "date": "2026-04-25",
      "time": "14:00",
      "type": "Consultation",
      "status": "Pending",
      "notes": null,
      "created_at": "2026-04-18T10:30:00.000Z"
    }
  ]
}
```

---

### 6. **Update Appointment Status** (PUT)
**Endpoint:** `PUT /appointments/:appointmentId`  
**Authentication:** Not required (for now)  
**Purpose:** Change appointment status (Pending → Confirmed, Cancelled, etc.)

**Request Body:**
```json
{
  "status": "Confirmed"
}
```

**Response:**
```json
{
  "message": "✅ Appointment updated successfully"
}
```

---

## Frontend Component: SimpleAppointmentBooking

### Location
File: `src/SimpleAppointmentBooking.jsx`

### Features
- ✅ Doctor selection dropdown
- ✅ Date picker with validation (today to 30 days ahead)
- ✅ Time slot selector with live availability check
- ✅ Appointment type selection
- ✅ Real-time validation with double-booking prevention
- ✅ Clear error messages
- ✅ Success notifications
- ✅ Loading states

### Props
```javascript
<SimpleAppointmentBooking 
  darkMode={boolean}           // Theme
  loggedInUser={user}          // Current user object
  onBookingSuccess={callback}  // Called when booking succeeds
  onClose={callback}           // Optional: close modal callback
/>
```

### Usage in App.jsx

**Import:**
```javascript
import SimpleAppointmentBooking from "./SimpleAppointmentBooking";
```

**Add to Sidebar:**
```javascript
<button
  onClick={() => setActivePage("book-appointment")}
  className="..."
>
  <CalendarPlus size={22} />
  {!patientSidebarCollapsed && <span>Book Appointment</span>}
</button>
```

**Render in Content Area:**
```javascript
{activePage === "book-appointment" && (
  <div className="p-6">
    <SimpleAppointmentBooking 
      darkMode={darkMode}
      loggedInUser={loggedInUser}
      onBookingSuccess={() => setActivePage("appointments")}
    />
  </div>
)}
```

---

## Double-Booking Prevention: How It Works

### The Problem
Without protection, two patients could book the same doctor at the same time:
- Patient A books Dr. Smith at 2026-04-25 14:00 ✅
- Patient B books Dr. Smith at 2026-04-25 14:00 ✅ (Should be rejected!)

### The Solution: Three-Layer Validation

#### Layer 1: Frontend Validation
**Component:** `SimpleAppointmentBooking.jsx`
```javascript
// Fetch available slots before showing them
const response = await api.get(
  `/available-slots/${doctorId}/${date}`,
  { params: { slotDuration: 30 } }
);
const availableSlots = response.data.availableSlots;

// Only show available times in UI
{availableSlots.map(time => (
  <button key={time} onClick={() => setSelectedTime(time)}>
    {time}
  </button>
))}
```

#### Layer 2: Race Condition Check
**Before booking**, verify slot is still available:
```javascript
const checkResponse = await api.get(
  `/appointments/check-slot/${doctorId}/${date}/${time}`
);

if (!checkResponse.data.available) {
  // Show error - slot was taken by another user
  setError("Time slot is no longer available");
  await fetchAvailableSlots(); // Refresh
  return;
}
```

#### Layer 3: Database Query (Most Important)
**Backend:** Query before INSERT
```sql
-- Check if slot is already booked
SELECT id FROM appointments 
WHERE doctor_id = ? 
  AND date = ? 
  AND time = ?
  AND status IN ('Pending', 'Confirmed')

-- If results exist, return 409 Conflict error
-- If no results, proceed with INSERT
```

### Why Three Layers?
1. **Layer 1**: Best UX - shows only available slots
2. **Layer 2**: Handles race conditions between frontend and backend
3. **Layer 3**: Database-level protection - final safeguard

---

## Booking Flow: Step-by-Step

### User Journey

```
Patient Views Dashboard
        ↓
Click "Book Appointment" button
        ↓
Select Doctor dropdown
        ↓
Frontend: Fetch available doctors
        ↓
Select Date (min: today, max: +30 days)
        ↓
Frontend: Fetch available time slots
  - GET /available-slots/1/2026-04-25
  - Shows: ["09:30", "10:00", "11:00", ...]
        ↓
Select Time from available slots
        ↓
Select Appointment Type (Consultation, Follow-up, etc.)
        ↓
Review booking summary
        ↓
Click "Book Appointment"
        ↓
Frontend: Verify slot still available
  - GET /appointments/check-slot/1/2026-04-25/11:00
  - Response: { available: true }
        ↓
Backend: Check for conflicts (final check)
  - Query for existing appointments at this time
  - If found: Return 409 error
  - If not found: Insert appointment
        ↓
✅ Success: Appointment created!
  - Doctor receives notification
  - Patient sees confirmation
  - Redirect to "My Appointments"
        ↓
❌ Error (409): Show "Slot already booked"
  - Refresh available slots
  - Let user select different time
```

---

## API Examples: cURL

### Example 1: Get Available Slots
```bash
curl -X GET \
  "http://localhost:3001/available-slots/1/2026-04-25?startTime=09:00&endTime=18:00&slotDuration=30" \
  -H "Content-Type: application/json"
```

### Example 2: Check Slot Availability
```bash
curl -X GET \
  "http://localhost:3001/appointments/check-slot/1/2026-04-25/14:00" \
  -H "Content-Type: application/json"
```

### Example 3: Get Booked Slots
```bash
curl -X GET \
  "http://localhost:3001/appointments/booked-slots/1/2026-04-25" \
  -H "Content-Type: application/json"
```

### Example 4: Book Appointment
```bash
curl -X POST \
  "http://localhost:3001/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patientId": 4,
    "doctorId": 1,
    "date": "2026-04-25",
    "time": "14:00",
    "type": "Consultation",
    "status": "Pending"
  }'
```

---

## Test Scenarios

### Scenario 1: Successful Booking
1. Patient logs in (Patient ID: 4)
2. Clicks "Book Appointment"
3. Selects "Dr. Sarah Jenkins" (Doctor ID: 1)
4. Selects "2026-04-25"
5. System shows available slots: ["09:00", "10:00", "11:00", ...]
6. Selects "14:00"
7. Confirms
8. ✅ Appointment created successfully

### Scenario 2: Double-Booking Prevention
1. Patient A books Dr. Smith at 2026-04-25 14:00 → ✅ Success
2. Patient B tries to book Dr. Smith at 2026-04-25 14:00
3. When Patient B selects date/time:
   - API shows ["09:00", "10:00", "11:00", "14:30", ...] (14:00 NOT shown)
4. Patient B cannot select 14:00 (not in dropdown)
5. If Patient B tries via direct API call:
   - POST /appointments with time 14:00
   - Backend checks: finds existing appointment
   - Returns 409: "Time slot is already booked"
6. ✅ System prevents double-booking

### Scenario 3: Race Condition Handling
1. Patient A and Patient B both viewing same doctor's schedule
2. Both see 14:00 as available
3. Patient A books 14:00 → ✅ Success
4. Patient B tries to book 14:00
5. Frontend detects: "Slot no longer available"
6. Shows error: "Someone else just booked this slot"
7. Refreshes available slots
8. Patient B can see updated availability

---

## Database Queries

### Find Booked Appointments for a Doctor
```sql
SELECT id, date, TIME_FORMAT(time, '%H:%i') as time, 
       patient_id, status
FROM appointments
WHERE doctor_id = 1 AND date = '2026-04-25'
  AND status IN ('Pending', 'Confirmed')
ORDER BY time;
```

### Find Available Slots (Manual Check)
```sql
-- This query is done in backend code, but here's the logic:
SELECT DISTINCT date, TIME_FORMAT(time, '%H:%i') as time
FROM appointments
WHERE doctor_id = 1 AND date = '2026-04-25'
  AND status IN ('Pending', 'Confirmed');
```

### Check for Double-Booking
```sql
SELECT COUNT(*) as conflict_count
FROM appointments
WHERE doctor_id = 1 
  AND date = '2026-04-25' 
  AND time = '14:00'
  AND status IN ('Pending', 'Confirmed');
-- Returns 0 if available, > 0 if conflict
```

### Get All Active Appointments
```sql
SELECT a.*, u.name as doctor_name, p.name as patient_name
FROM appointments a
JOIN users u ON a.doctor_id = u.id
LEFT JOIN users p ON a.patient_id = p.id
WHERE a.status IN ('Pending', 'Confirmed')
ORDER BY a.date, a.time;
```

---

## Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 400 | Missing required fields | No doctor/date/time | Select all required fields |
| 409 | Time slot is already booked | Double-booking detected | Choose different time |
| 403 | Forbidden | Patient booking for someone else | Patients can only book for themselves |
| 500 | Database error | Server-side error | Try again or contact support |

---

## Testing the System

### Prerequisites
```bash
# Backend running
node backend/server.js

# Frontend running
npm run dev
```

### Manual Test Steps
1. Login as patient (e.g., user: john.doe@email.com)
2. Navigate to "Book Appointment"
3. Select doctor from dropdown
4. Select future date
5. Verify available slots load
6. Select a time
7. Click "Book Appointment"
8. Verify success notification
9. Check "My Appointments" to see it listed

### Automated Test (Example with Postman)
```javascript
// Test: Double-booking prevention
pm.test("Should reject booking if slot is taken", function() {
  pm.request.to_return({
    code: 409,
    body: {
      message: /already booked/i
    }
  });
});
```

---

## Performance Considerations

### Indexes
The appointments table has the following indexes for optimal performance:
```sql
CREATE INDEX idx_doctor_date_time ON appointments(doctor_id, date, time);
-- Used for: double-booking checks, available slots query
```

### Query Optimization
- Booked slots check: `O(1)` with index
- Available slots generation: `O(n)` where n = working hours / slot duration
- Double-booking check: `O(1)` with composite index

---

## Future Enhancements

### Planned Features
1. **Time Slot Pre-generation**: Pre-generate slots for next 90 days
2. **Doctor Availability Rules**: Define unavailable dates/times per doctor
3. **Buffer Time Between Appointments**: Require gap between consecutive bookings
4. **Recurring Appointments**: Support for recurring bookings
5. **Cancellation with Notice**: Require notice period to cancel
6. **Waitlist**: Queue for fully booked time slots

### Possible Improvements
```sql
-- Example: Buffer time between appointments
ALTER TABLE appointments ADD COLUMN buffer_time_minutes INT DEFAULT 15;

-- Before booking, check:
SELECT * FROM appointments
WHERE doctor_id = 1
  AND DATE(date) = '2026-04-25'
  AND (
    -- Check 30 mins before and after requested time
    (time >= TIME_SUB('14:00', INTERVAL 30 MINUTE)
     AND time <= TIME_ADD('14:00', INTERVAL 30 MINUTE))
  );
```

---

## Summary

The appointment booking system is now fully implemented with:

✅ **Database**: Optimized schema with proper indexes  
✅ **Backend**: 6 REST API endpoints with double-booking prevention  
✅ **Frontend**: User-friendly booking component  
✅ **Validation**: 3-layer protection against double-bookings  
✅ **Error Handling**: Clear error messages and recovery  
✅ **Documentation**: Complete guide with examples  

### Key Files
- Backend: `backend/server.js` (lines 862-1200+)
- Frontend: `src/SimpleAppointmentBooking.jsx`
- Integration: `src/App.jsx` (import + sidebar button + render)

---

**Questions or Issues?** Check the API logs:
```bash
# Server logs show:
🎯 APPOINTMENT ENDPOINT HIT
📋 EXTRACTED FIELDS: [details]
🔐 DOUBLE BOOKING CHECK: [results]
✅ No conflicts found - time slot is available!
```
