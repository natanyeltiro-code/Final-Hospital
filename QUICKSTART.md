# Quick Start: Doctor Availability System (5 Steps)

Get the availability system running in **~30 minutes**.

---

## ✅ Step 1: Database Setup (5 min)

### Run the SQL script:
```bash
cd backend
mysql -u root -p < setup-availability.sql
```

**Or manually:**
Open MySQL Workbench / command line and run:
```sql
-- Copy contents of backend/setup-availability.sql and paste here
```

✅ **Done:** 3 new tables created, 4 columns added to users table

---

## ✅ Step 2: Backend Integration (5 min)

### Edit `backend/server.js`:

Find where other routes are imported (around line 20):
```javascript
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
// ADD THIS LINE:
const availabilityRoutes = require('./routes/availability');
```

Find where routes are mounted (around line 50):
```javascript
app.use('/api', authRoutes);
app.use('/api', appointmentRoutes);
// ADD THIS LINE:
app.use('/api', availabilityRoutes);
```

**Restart backend:**
```bash
npm start
```

✅ **Done:** 9 new API endpoints available

---

## ✅ Step 3: Add Doctor Availability Widget (5 min)

### Edit `src/DoctorDashboard.jsx`:

**At the top, add import:**
```javascript
import DoctorAvailabilityStatus from './DoctorAvailabilityStatus';
```

**In the JSX, add this section** (after other dashboard content):
```jsx
{/* Doctor Availability Status */}
<div className="mt-8">
  <DoctorAvailabilityStatus 
    doctorId={doctorData.id} 
    darkMode={darkMode} 
  />
</div>
```

✅ **Done:** Doctor can see and change their availability status

---

## ✅ Step 4: Add Patient Appointment Booking Improvements (10 min)

### Edit Patient Appointment Booking Page:

**At the top, add imports:**
```javascript
import AvailableDoctorsList from './AvailableDoctorsList';
import AvailableSlotsSelector from './AvailableSlotsSelector';
```

**Add state hooks:**
```javascript
const [selectedDate, setSelectedDate] = useState('');
const [selectedSlot, setSelectedSlot] = useState(null);
const [selectedDoctorId, setSelectedDoctorId] = useState(null);
```

**In JSX, replace your appointment booking section with this:**
```jsx
<div className="space-y-6">
  {/* Specialty Selection (your existing code) */}
  <div>
    <label className="block text-sm font-medium mb-2">Specialty</label>
    <select 
      value={selectedSpecialty}
      onChange={(e) => setSelectedSpecialty(e.target.value)}
      className="w-full px-4 py-2 border rounded-lg"
    >
      <option>Select Specialty</option>
      <option>Cardiology</option>
      <option>Neurology</option>
      <option>Orthopedics</option>
      {/* Add your specialties */}
    </select>
  </div>

  {/* New: Available Doctors List */}
  <AvailableDoctorsList 
    selectedSpecialty={selectedSpecialty}
    darkMode={darkMode}
  />

  {/* New: Available Slots Selector */}
  {selectedDoctorId && (
    <AvailableSlotsSelector
      doctorId={selectedDoctorId}
      selectedDate={selectedDate}
      onSlotSelected={setSelectedSlot}
      darkMode={darkMode}
    />
  )}

  {/* Existing: Booking Details */}
  {selectedSlot && (
    <div className="p-4 bg-green-50 rounded-lg">
      <p className="text-green-800">
        ✓ Selected: {selectedSlot.slot_time} on {selectedDate}
      </p>
    </div>
  )}

  {/* Submit Button */}
  <button
    onClick={() => handleBookAppointment(selectedSlot)}
    className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
  >
    Book Appointment
  </button>
</div>
```

**Update your booking handler:**
```javascript
const handleBookAppointment = async (slot) => {
  if (!selectedDoctorId || !slot) {
    alert('Please select a doctor and time slot');
    return;
  }

  try {
    const response = await api.post('/api/appointments', {
      doctor_id: selectedDoctorId,
      patient_id: currentUser.id,
      appointment_date: selectedDate,
      appointment_time: slot.slot_time,
      slot_id: slot.id,  // NEW: Add slot ID
      reason: appointmentReason
    });

    console.log('Appointment booked:', response.data);
    // Redirect or show success message
  } catch (error) {
    alert('Error booking appointment');
  }
};
```

✅ **Done:** Patients see only available doctors and can book time slots

---

## ✅ Step 5: Test It Works (5 min)

### Start everything:
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
npm run dev
```

### Quick Test Checklist:
- [ ] Go to Doctor Dashboard
- [ ] See "Your Availability" widget
- [ ] Click "Available", "Busy", "Off-duty" buttons
- [ ] Status changes immediately
- [ ] Go to Appointment Booking (Patient)
- [ ] Select specialty
- [ ] See list of available doctors
- [ ] Click a doctor
- [ ] See available time slots
- [ ] Click a time slot (shows green confirmation)
- [ ] Click "Book Appointment"
- [ ] Appointment is booked

✅ **Done:** System is working!

---

## 🎉 That's It!

Your appointment booking system now has:
- ✅ Real-time doctor availability status
- ✅ Patient filtering by available doctors
- ✅ Time slot booking (no double-booking)
- ✅ Automatic status updates based on schedules

---

## 📚 Need More Details?

- **Integration Help:** See `AVAILABILITY_INTEGRATION.md`
- **API Reference:** See `backend/routes/availability.js` comments
- **Testing:** See `AVAILABILITY_TESTING.md`
- **Component Props:** See individual .jsx file comments

---

## 🐛 Common Issues

| Issue | Fix |
|-------|-----|
| "No available doctors" | Make sure doctor status is set to "Available" |
| "No available slots" | Run a test POST to `/api/generate-slots/:doctorId` |
| Import errors | Check file paths match your project structure |
| 403 Forbidden errors | Make sure JWT token is valid in API calls |

---

## 📋 Files Modified/Created

**Backend:**
- [x] `backend/setup-availability.sql` - Database schema
- [x] `backend/routes/availability.js` - API endpoints
- [x] `backend/server.js` - Import routes (you do this)

**Frontend:**
- [x] `src/DoctorAvailabilityStatus.jsx` - Doctor widget
- [x] `src/AvailableDoctorsList.jsx` - Patient doctor list
- [x] `src/AvailableSlotsSelector.jsx` - Patient slot selector
- [x] `src/DoctorDashboard.jsx` - Add component (you do this)
- [x] `src/PatientDashboard.jsx` - Add components (you do this)

**Documentation:**
- [x] `AVAILABILITY_SUMMARY.md` - Overview
- [x] `AVAILABILITY_INTEGRATION.md` - Detailed guide
- [x] `AVAILABILITY_TESTING.md` - Testing guide
- [x] `QUICKSTART.md` - This file

---

## ✨ Ready? Let's Go!

1. Run the SQL script
2. Update `server.js`
3. Add components to dashboards
4. Test
5. Done!

Questions? Check the docs or review the code comments. 🚀
