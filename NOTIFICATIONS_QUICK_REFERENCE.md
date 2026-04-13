# Notification System - Quick Reference Card

## 🚀 Quick Start

### 1. Appointment Status Changed
**Auto-triggered when doctor updates appointment status**
```
Endpoint: PUT /appointments/:appointmentId
Frontend automatically sends:
- Dr. [Name] confirmed your appointment ✅
- Dr. [Name] completed your appointment ✅
- Dr. [Name] cancelled your appointment ✅
```

### 2. Medical Record Created/Updated
**Send via API when record is saved**
```
POST /notifications/medical-record
{
  "recordId": 101,
  "patientId": 1,
  "doctorId": 2,
  "action": "created" // or "updated"
}
→ "Dr. Tiro created a new medical record for you" 📋
```

### 3. Doctor Approved Something
**Use this for approvals, requests, prescriptions, etc.**
```
POST /notifications/send-approval
{
  "userId": 1,
  "approverName": "Tiro",
  "itemType": "Medical Request",
  "itemTitle": "Lab Test - Complete Blood Count"
}
→ "Dr. Tiro approved your Medical Request: Lab Test - Complete Blood Count" 👍
```

### 4. Appointment Reminder
**Send 24h before appointment**
```
POST /notifications/appointment-reminder
{
  "appointmentId": 1,
  "patientId": 1,
  "doctorId": 2,
  "appointmentDate": "2026-04-20",
  "appointmentTime": "14:30"
}
→ "Reminder: Your appointment with Dr. Tiro is scheduled for Apr 20, 2026 at 14:30" ⏰
```

### 5. System Alert
**Maintenance, announcements, important info**
```
POST /notifications/system-alert
{
  "userId": 1,
  "title": "System Maintenance",
  "message": "Maintenance on April 15, 2026 from 10 PM to 12 AM.",
  "alertType": "system"
}
→ System icon: ⚙️
```

---

## 🎨 Notification Types & Icons

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| appointment_status | ✅ | Green | Doctor confirmation/completion |
| medical_record | 📋 | Blue | Medical record updates |
| approval | 👍 | Purple | Approvals & requests |
| appointment_reminder | ⏰ | Yellow | Pre-appointment reminders |
| profile_update | 👤 | Cyan | Profile changes |
| system | ⚙️ | Gray | System alerts |
| appointment | 📌 | Teal | New appointments |

---

## 📊 Notification Features

✅ Personalized messages with doctor/user names  
✅ Type-specific icons and colors  
✅ Unread indicators with badge count  
✅ Mark as read functionality  
✅ Delete notifications  
✅ Responsive design (mobile & desktop)  
✅ Dark mode support  
✅ Hover effects for better UX  
✅ Timestamps for each notification  

---

## 🔧 Implementation Checklist

When adding a new feature that needs notifications:

- [ ] Create notification generation function (if custom type)
- [ ] Add API endpoint if needed
- [ ] Call notification function from relevant business logic
- [ ] Include doctor/user name in message
- [ ] Test both light and dark modes
- [ ] Verify notification appears in UI
- [ ] Add to documentation

---

## 🗂️ File Locations

**Backend Helper Functions:** `backend/server.js` (lines 232-332)

**New API Endpoints:** `backend/server.js` (lines 1943-2011)

**Updated Appointment Endpoint:** `backend/server.js` (lines 1063-1095)

**Doctor Dashboard Display:** `src/DoctorDashboard.jsx` (lines 2230-2282)

**Patient Dashboard Display:** `src/App.jsx` (lines 3457-3529, 4079-4151)

**Database Schema:** `backend/server.js` (lines 104-118)

---

## 💡 Examples

### Example 1: Medical Record Update Trigger
```javascript
// In your medical record save function
if (recordSaved) {
  generateMedicalRecordNotification(recordId, patientId, doctorId, "created");
}
```

### Example 2: Approval in Admin Panel
```javascript
// When admin approves a request
generateApprovalNotification(
  userId,
  loggedInUser.name,  // approver name
  "Medical Request",
  "Lab Test"
);
```

### Example 3: Send Reminder (Scheduled Job)
```javascript
// In a scheduled job (every hour, check appointments for next 24h)
if (appointmentInNext24Hours) {
  generateAppointmentReminder(
    appointmentId,
    patientId,
    doctorId,
    appointmentDate,
    appointmentTime
  );
}
```

---

## 🔍 Database Queries

**View all notifications for a user:**
```sql
SELECT * FROM notifications 
WHERE user_id = 1 
ORDER BY created_at DESC 
LIMIT 10;
```

**Count unread notifications:**
```sql
SELECT COUNT(*) FROM notifications 
WHERE user_id = 1 AND is_read = FALSE;
```

**Check notification types used:**
```sql
SELECT DISTINCT type FROM notifications;
```

**Delete old notifications:**
```sql
DELETE FROM notifications 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

---

## 🐛 Debug Tips

1. **Check notifications aren't being created:**
   - Look for console logs in backend (✅ or ⚠️ messages)
   - Query database: `SELECT * FROM notifications LIMIT 1;`
   - Verify user_id exists in users table

2. **Notification not showing in UI:**
   - Check browser console for JS errors
   - Verify API endpoint returns data
   - Refresh page (F5)

3. **Wrong doctor name:**
   - Verify doctor_id is correct
   - Check users table: `SELECT * FROM users WHERE id = 2;`
   - Ensure name field is not NULL

4. **Notification type icon not showing:**
   - Check type code matches exactly
   - Type codes are case-sensitive
   - See table above for correct codes

---

## 🚀 Performance Notes

- Notifications are created asynchronously (non-blocking)
- Database queries optimized with proper indexing
- Notifications fetched with pagination (default 10 per page)
- Old notifications should be archived after 90 days
- No real-time updates yet (use polling or WebSockets in future)

---

## 📝 Version History

**v1.2 - April 13, 2026**
- ✨ Added 6 notification types
- ✨ Personalized messages with doctor/user names
- ✨ Type-specific icons and colors
- 🎨 Enhanced UI with better visual hierarchy
- 📚 Comprehensive documentation

**v1.1**
- Basic appointment notifications

**v1.0**
- Initial notification system

---

## ❓ FAQ

**Q: How do I send a notification to all admins?**  
A: Use a query like `SELECT id FROM users WHERE role = 'admin'` and loop through to send to each.

**Q: Can I schedule notifications?**  
A: Currently no. Use a job scheduler (node-cron) to call endpoints at scheduled times.

**Q: Do notifications actually send emails/SMS?**  
A: Not yet. Preferences are stored but email/SMS integration needed for future.

**Q: How long are notifications kept?**  
A: Indefinitely. Recommend deleting after 90 days in production.

**Q: Can users customize notification types?**  
A: Yes, via notification preferences UI (not enforced on backend yet).

---

**Need Help?** Check NOTIFICATIONS_GUIDE.md for detailed documentation.

