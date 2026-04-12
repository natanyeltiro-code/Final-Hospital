# Medicare Portal

A comprehensive healthcare management system built with React, Node.js, and MySQL. Supports admin, doctor, and patient roles with features for appointment scheduling, medical record management, and user authentication.

## Features

✅ **User Authentication** - Secure login/register/forgot password for all roles
✅ **Doctor Dashboard** - Manage patients, appointments, medical records, and profile
✅ **Patient Portal** - Book appointments, view medical records, check appointment history
✅ **Admin Panel** - Manage all users, appointments, and medical records
✅ **Medical Records** - Create, view, and manage patient medical histories
✅ **Appointment System** - Schedule, confirm, and track appointments
✅ **Dark Mode** - Toggle between light and dark themes
✅ **Responsive Design** - Works on desktop, tablet, and mobile devices

## Tech Stack

**Frontend:**
- React 19
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)
- Axios (HTTP client)

**Backend:**
- Node.js with Express
- MySQL 2
- Bcrypt (password hashing)
- CORS enabled

**Database:**
- MySQL 8.0+

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MySQL Server** (running locally on default port 3306)
- **Visual Studio Code** (or any code editor)

## Installation

### 1. Clone the Repository
```bash
cd c:\Users\tanta\Downloads\medicare-portal
```

### 2. Setup Database

#### Option A: Using Node.js Setup Script (Recommended)
```bash
cd backend
npm install
node setup.js
```

This will:
- Create the `medicare` database
- Create all required tables (users, appointments, medical_records, prescriptions)
- Insert sample data with test accounts

#### Option B: Using MySQL CLI
```bash
mysql -u root -p < backend/db_setup.sql
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Install Frontend Dependencies
```bash
cd .. (back to project root)
npm install
```

## Configuration

### Backend Configuration

Edit `backend/server.js` to match your MySQL credentials if different:

```javascript
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "@Nathaniel123",  // Change this if different
  database: "medicare",
});
```

### Frontend Configuration

The frontend is pre-configured to connect to the backend at `http://localhost:3000`. If running on a different port, update the API URLs in `src/App.jsx`:

```javascript
axios.post("http://localhost:3000/login", loginData)
```

## Running the Application

### Start the Backend Server

```bash
cd backend
npm start
```

Expected output:
```
✅ MySQL Connected
🚀 Server running on http://localhost:3000
```

### Start the Frontend Development Server

In a new terminal:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or as shown in terminal)

## Sample Login Credentials

After running the setup script, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | admin123 |
| Doctor | sarah.j@hospital.com | doctor123 |
| Patient | john.doe@email.com | patient123 |

## API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /login` - Login user
- `POST /forgot-password` - Reset password

### Patients
- `GET /patients` - Get all patients
- `DELETE /users/:userId` - Delete a user

### Appointments
- `POST /appointments` - Create new appointment
- `GET /appointments/:userId` - Get user's appointments
- `PUT /appointments/:appointmentId` - Update appointment status
- `DELETE /appointments/:appointmentId` - Delete appointment

### Medical Records
- `POST /medical-records` - Create medical record
- `GET /medical-records/:patientId` - Get patient's medical records
- `DELETE /medical-records/:recordId` - Delete medical record

### Doctors
- `GET /doctors` - Get all doctors

### Users
- `PUT /users/:userId` - Update user profile

## Directory Structure

```
medicare-portal/
├── src/
│   ├── App.jsx              # Main app component with auth flows
│   ├── DoctorDashboard.jsx  # Doctor-specific interface
│   ├── main.jsx             # React entry point
│   ├── index.css            # Global styles
│   └── assets/              # Static assets
├── backend/
│   ├── server.js            # Express server with all routes
│   ├── setup.js             # Database initialization script
│   ├── db_setup.sql         # SQL schema file
│   └── package.json         # Backend dependencies
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── package.json             # Frontend dependencies
└── README.md                # This file
```

## Key Features Explained

### Patient Dashboard
- View upcoming appointments
- Book new appointments with doctors
- Access medical records and history
- Update personal profile information

### Doctor Dashboard
- View assigned patients list
- Manage appointments (accept/reject)
- Create and manage medical records
- Update professional profile
- Dark mode toggle
- Real-time notifications

### Admin Panel
- View and manage all patients
- View and manage all doctors
- Monitor all appointments
- Access system settings
- Generate reports

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
- Ensure MySQL server is running
- Check credentials in `backend/server.js`
- Verify database `medicare` exists

### Port 3000 Already in Use
```bash
# Find and kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Vite Port Error
If port 5173 is in use, Vite will try port 5174, 5175, etc.

### npm install Fails
```bash
rm -rf node_modules package-lock.json
npm install
```

## Features by Role

### Patient
- 📅 Book and manage appointments
- 🏥 View medical history and records
- 👤 Update personal profile
- 🔔 View appointment notifications
- 📄 Download medical records

### Doctor
- 👥 Manage patient list
- 📋 Create and update medical records
- 📅 View and manage appointments
- 🎯 Accept/reject appointment requests
- 👤 Update professional information
- 🌙 Toggle dark mode
- 🔔 Real-time notifications

### Admin
- 🛡️ Full system control
- 👥 Manage users (create/edit/delete)
- 📊 View system statistics
- ⚙️ System settings and configuration
- 📈 Generate reports

## Frontend Routes

- `/` - Login/Register page (when not authenticated)
- Family-based routing in App.jsx based on user role:
  - **Patient**: Dashboard, Appointments, Medical Records, Profile
  - **Doctor**: Dashboard, Patients, Appointments, Medical Records, Settings
  - **Admin**: Dashboard, Patients, Doctors, Appointments, History, Reports, Settings

## Security Notes

⚠️ **Important**: This is a development project. For production use:
- Environment variables for sensitive data
- HTTPS/SSL encryption
- JWT tokens for authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS restrictions
- SQL injection prevention (already using prepared statements)

## Database Schema

### users
- id (PK)
- name
- email (UNIQUE)
- password (hashed)
- role (admin/doctor/patient)
- phone
- timestamps

### appointments
- id (PK)
- patient_id (FK)
- doctor_id (FK)
- date
- time
- type
- status
- notes
- timestamps

### medical_records
- id (PK)
- patient_id (FK)
- doctor_id (FK)
- title
- diagnosis
- treatment
- record_date
- status
- timestamps

### prescriptions
- id (PK)
- appointment_id (FK)
- patient_id (FK)
- doctor_id (FK)
- medication
- dosage
- instructions
- prescribed_date

## Contributing

Feel free to fork and submit pull requests for improvements.

## Support

For issues or questions, please create an issue in the repository.

## License

This project is open source under the MIT License.
