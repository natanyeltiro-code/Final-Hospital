# Medicare Portal - Complete API Reference

## All CRUD Operations

### Authentication Endpoints

#### Register New User
```
POST /register
Body: {
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "admin|doctor|patient"
}
Response: { message: "✅ Registration successful" }
```

#### Login
```
POST /login
Body: {
  "email": "string",
  "password": "string",
  "role": "admin|doctor|patient"
}
Response: {
  message: "✅ Login successful",
  user: { id, name, email, role }
}
```

#### Forgot Password
```
POST /forgot-password
Body: {
  "email": "string",
  "newPassword": "string"
}
Response: { message: "✅ Password updated successfully" }
```

---

### User Management CRUD

#### Create User (via Register)
```
POST /register
```

#### Read - Get All Patients
```
GET /patients
Response: {
  message: "✅ Patients retrieved successfully",
  patients: [...]
}
```

#### Read - Get Single Patient
```
GET /patients/:patientId
Response: {
  message: "✅ Patient retrieved successfully",
  patient: {...}
}
```

#### Read - Get All Doctors
```
GET /doctors
Response: {
  message: "✅ Doctors retrieved successfully",
  doctors: [...]
}
```

#### Read - Get Single Doctor
```
GET /doctors/:doctorId
Response: {
  message: "✅ Doctor retrieved successfully",
  doctor: {...}
}
```

#### Read - Get User by ID
```
GET /users/:userId
Response: {
  message: "✅ User retrieved successfully",
  user: {...}
}
```

#### Update User Profile
```
PUT /users/:userId
Body: {
  "name": "string",
  "email": "string",
  "phone": "string"
}
Response: { message: "✅ Profile updated successfully" }
```

#### Delete User
```
DELETE /users/:userId
Response: { message: "✅ User deleted successfully" }
```

#### Search Patients
```
GET /search/patients/:query
Example: /search/patients/John
Response: {
  message: "✅ Search results retrieved",
  patients: [...]
}
```

#### Search Doctors
```
GET /search/doctors/:query
Example: /search/doctors/Sarah
Response: {
  message: "✅ Search results retrieved",
  doctors: [...]
}
```

---

### Appointments CRUD

#### Create Appointment
```
POST /appointments
Body: {
  "patientId": number,
  "doctorId": number,
  "date": "YYYY-MM-DD",
  "time": "HH:MM:SS",
  "type": "string (optional)",
  "status": "Pending|Confirmed|Completed|Cancelled (optional)"
}
Response: { message: "✅ Appointment created successfully" }
```

#### Read - Get All Appointments
```
GET /appointments
Response: {
  message: "✅ All appointments retrieved successfully",
  appointments: [...]
}
```

#### Read - Get User's Appointments
```
GET /appointments/:userId
Response: {
  message: "✅ Appointments retrieved successfully",
  appointments: [...]
}
```

#### Read - Get Single Appointment
```
GET /appointments-details/:appointmentId
Response: {
  message: "✅ Appointment retrieved successfully",
  appointment: {...}
}
```

#### Read - Get Appointments by Status
```
GET /appointments-status/:status
Example: /appointments-status/Pending
Response: {
  message: "✅ Appointments with status 'Pending' retrieved successfully",
  appointments: [...]
}
```

#### Read - Get Appointments by Date Range
```
GET /appointments-range/:patientId/:startDate/:endDate
Example: /appointments-range/4/2026-04-01/2026-04-30
Response: {
  message: "✅ Appointments in date range retrieved successfully",
  appointments: [...]
}
```

#### Update Appointment (Full Update)
```
PUT /appointments/:appointmentId
Body: {
  "status": "string"
}
Response: { message: "✅ Appointment updated successfully" }
```

#### Update Appointment (Partial Update)
```
PATCH /appointments/:appointmentId
Body: {
  "date": "YYYY-MM-DD (optional)",
  "time": "HH:MM:SS (optional)",
  "type": "string (optional)",
  "status": "string (optional)",
  "notes": "string (optional)"
}
Response: { message: "✅ Appointment updated successfully" }
```

#### Delete Appointment
```
DELETE /appointments/:appointmentId
Response: { message: "✅ Appointment deleted successfully" }
```

---

### Medical Records CRUD

#### Create Medical Record
```
POST /medical-records
Body: {
  "patientId": number,
  "doctorId": number,
  "title": "string",
  "diagnosis": "string (optional)",
  "treatment": "string (optional)",
  "date": "YYYY-MM-DD (optional)"
}
Response: { message: "✅ Medical record created successfully" }
```

#### Read - Get Patient's Medical Records
```
GET /medical-records/:patientId
Response: {
  message: "✅ Medical records retrieved successfully",
  records: [...]
}
```

#### Read - Get Single Medical Record
```
GET /medical-records-details/:recordId
Response: {
  message: "✅ Medical record retrieved successfully",
  record: {...}
}
```

#### Read - Get All Medical Records (Admin)
```
GET /admin/medical-records
Response: {
  message: "✅ All medical records retrieved successfully",
  records: [...]
}
```

#### Update Medical Record
```
PUT /medical-records/:recordId
(Use PATCH for partial updates)
```

#### Update Medical Record (Partial)
```
PATCH /medical-records/:recordId
Body: {
  "title": "string (optional)",
  "diagnosis": "string (optional)",
  "treatment": "string (optional)",
  "status": "Draft|Active|Archived|Reviewed (optional)",
  "record_date": "YYYY-MM-DD (optional)"
}
Response: { message: "✅ Medical record updated successfully" }
```

#### Delete Medical Record
```
DELETE /medical-records/:recordId
Response: { message: "✅ Medical record deleted successfully" }
```

---

### Prescriptions CRUD

#### Create Prescription
```
POST /prescriptions
Body: {
  "appointmentId": number,
  "patientId": number,
  "doctorId": number,
  "medication": "string",
  "dosage": "string",
  "instructions": "string (optional)",
  "prescribed_date": "YYYY-MM-DD (optional)"
}
Response: { message: "✅ Prescription created successfully" }
```

#### Read - Get Prescriptions by Appointment
```
GET /prescriptions/:appointmentId
Response: {
  message: "✅ Prescriptions retrieved successfully",
  prescriptions: [...]
}
```

#### Read - Get Prescriptions by Patient
```
GET /prescriptions-patient/:patientId
Response: {
  message: "✅ Prescriptions retrieved successfully",
  prescriptions: [...]
}
```

#### Update Prescription
```
PATCH /prescriptions/:prescriptionId
Body: {
  "medication": "string (optional)",
  "dosage": "string (optional)",
  "instructions": "string (optional)"
}
Response: { message: "✅ Prescription updated successfully" }
```

#### Delete Prescription
```
DELETE /prescriptions/:prescriptionId
Response: { message: "✅ Prescription deleted successfully" }
```

---

### Admin Dashboard Endpoints

#### Get Dashboard Statistics
```
GET /admin/stats
Response: {
  message: "✅ Statistics retrieved successfully",
  stats: {
    totalPatients: number,
    totalDoctors: number,
    totalAppointments: number,
    totalMedicalRecords: number,
    pendingAppointments: number,
    completedAppointments: number
  }
}
```

---

## Base URL
```
http://localhost:3000
```

## Error Responses
All endpoints return error messages in this format:
```json
{
  "message": "❌ Error description"
}
```

## Status Codes
- 200: Success
- 400: Bad Request
- 404: Not Found
- 500: Server Error

## Sample Users for Testing
- **Admin**: admin@hospital.com / admin123
- **Doctor**: sarah.j@hospital.com / doctor123
- **Patient**: john.doe@email.com / patient123

## Complete CRUD Summary

| Resource | Create | Read | Update | Delete |
|----------|--------|------|--------|--------|
| Users | ✅ POST /register | ✅ GET /users/:id | ✅ PUT /users/:id | ✅ DELETE /users/:id |
| Patients | ✅ POST /register | ✅ GET /patients/:id | ✅ PUT /users/:id | ✅ DELETE /users/:id |
| Doctors | ✅ POST /register | ✅ GET /doctors/:id | ✅ PUT /users/:id | ✅ DELETE /users/:id |
| Appointments | ✅ POST /appointments | ✅ GET /appointments/:id | ✅ PATCH /appointments/:id | ✅ DELETE /appointments/:id |
| Medical Records | ✅ POST /medical-records | ✅ GET /medical-records/:id | ✅ PATCH /medical-records/:id | ✅ DELETE /medical-records/:id |
| Prescriptions | ✅ POST /prescriptions | ✅ GET /prescriptions/:id | ✅ PATCH /prescriptions/:id | ✅ DELETE /prescriptions/:id |

All CRUD operations are now fully functional! ✅
