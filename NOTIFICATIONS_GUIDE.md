# Enhanced Notification System - Documentation

## Overview

The Medicare portal now includes a comprehensive notification system with multiple notification types, personalized messages featuring doctor/user names, and beautiful UI with type-specific icons and colors.

## Notification Types

### 1. **Appointment Status** (✅ Green)
**Type Code:** `appointment_status`

Triggered when a doctor confirms, completes, or cancels an appointment.

**Example Messages:**
- "Dr. Tiro confirmed your appointment"
- "Dr. Tiro completed your appointment"
- "Dr. Tiro cancelled your appointment"

**Who Gets Notified:**
- Patient (if registered)
- All admins

**Auto-Triggered On:**
- Appointment status update via API endpoint

**Database:** Creates notification with type='appointment_status'

---

### 2. **Medical Record** (📋 Blue)
**Type Code:** `medical_record`

Triggered when a doctor creates or updates a patient's medical record.

**Example Messages:**
- "Dr. Tiro created a new medical record for you"
- "Dr. Tiro updated medical record for you"

**Who Gets Notified:**
- Patient

**Endpoint:**
```
POST /notifications/medical-record
{
  "recordId": 101,
  "patientId": 1,
  "doctorId": 2,
  "action": "created" // or "updated"
}
```

---

### 3. **Approval** (👍 Purple)
**Type Code:** `approval`

General approval notifications for various items.

**Example Messages:**
- "Dr. Tiro approved your Medical Request: Lab Test - Complete Blood Count"
- "Dr. Tiro approved your Prescription: Aspirin 500mg"

**Who Gets Notified:**
- Specified user

**Endpoint:**
```
POST /notifications/send-approval
{
  "userId": 1,
  "approverName": "Tiro",
  "itemType": "Medical Request",
  "itemTitle": "Lab Test - Complete Blood Count"
}
```

---

### 4. **Appointment Reminder** (⏰ Yellow)
**Type Code:** `appointment_reminder`

Reminder notification sent before scheduled appointment.

**Example Messages:**
- "Reminder: Your appointment with Dr. Tiro is scheduled for Apr 20, 2026 at 14:30"

**Who Gets Notified:**
- Patient

**Endpoint:**
```
POST /notifications/appointment-reminder
{
  "appointmentId": 1,
  "patientId": 1,
  "doctorId": 2,
  "appointmentDate": "2026-04-20",
  "appointmentTime": "14:30"
}
```

---

### 5. **Profile Update** (👤 Cyan)
**Type Code:** `profile_update`

Notifies user when their profile is updated. Different messages for different update types.

**Message Variations:**
- Personal: "Your profile information has been updated"
- Password: "Your password has been successfully changed"
- Contact: "Your contact information has been updated"
- Medical: "Your medical information has been updated"

**Who Gets Notified:**
- User who updated profile

**Auto-Triggered On:**
- User profile updates through settings page

**Database:** Creates notification with type='profile_update'

---

### 6. **System Alert** (⚙️ Gray)
**Type Code:** `system`

Generic system announcements and alerts for maintenance or important information.

**Example Messages:**
- "System maintenance scheduled for April 15 from 10 PM to 12 AM"
- "New security update available"

**Who Gets Notified:**
- Specified users or all users in system

**Endpoint:**
```
POST /notifications/system-alert
{
  "userId": 1,
  "title": "System Maintenance",
  "message": "The system will be undergoing maintenance on April 15, 2026 from 10 PM to 12 AM.",
  "alertType": "system"
}
```

---

### 7. **Appointment** (📌 Teal - Default)
**Type Code:** `appointment`

Default appointment notification when appointment is first created.

**Example Messages:**
- "New appointment booked"
- "Your appointment has been successfully booked"

**Auto-Triggered On:**
- New appointment creation

---

## Visual Design

### Notification Icons & Colors

| Type | Icon | Light Mode | Dark Mode |
|------|------|-----------|----------|
| appointment_status | ✅ | Green-50 | Green-900/60 |
| medical_record | 📋 | Blue-50 | Blue-900/60 |
| approval | 👍 | Purple-50 | Purple-900/60 |
| appointment_reminder | ⏰ | Yellow-50 | Yellow-900/60 |
| profile_update | 👤 | Cyan-50 | Cyan-900/60 |
| system | ⚙️ | Slate-50 | Slate-800/60 |
| appointment | 📌 | Teal-50 | Teal-900/60 |

### Notification Display Features

- **Unread Indicator**: Small blue dot appears on unread notifications
- **Icon Display**: Emoji icon displayed prominently for quick recognition
- **Timestamp**: Shows when notification was created (updated to localeString)
- **Delete Button**: Each notification can be individually deleted
- **Mark as Read**: Clicking unread notification marks it as read
- **Color Coding**: Background color changes based on notification type
- **Hover Effects**: Smooth hover transitions for better UX

---

## Backend API Endpoints

### Get Notifications
```
GET /notifications/:userId?limit=10&offset=0
```
Returns paginated list of notifications for a user.

### Get Unread Count
```
GET /notifications/:userId/unread-count
```
Returns count of unread notifications.

### Mark as Read
```
PUT /notifications/:notificationId/read
```
Marks a single notification as read.

### Mark All as Read
```
PUT /notifications/:userId/mark-all-read
```
Marks all notifications for a user as read.

### Delete Notification
```
DELETE /notifications/:notificationId
```
Deletes a specific notification.

### Delete Read Notifications
```
DELETE /notifications/:userId/all
```
Deletes all read notifications for a user.

### Send Medical Record Notification
```
POST /notifications/medical-record
Body: { recordId, patientId, doctorId, action }
```

### Send Approval Notification
```
POST /notifications/send-approval
Body: { userId, approverName, itemType, itemTitle }
```

### Send System Alert
```
POST /notifications/system-alert
Body: { userId, title, message, alertType }
```

### Send Appointment Reminder
```
POST /notifications/appointment-reminder
Body: { appointmentId, patientId, doctorId, appointmentDate, appointmentTime }
```

---

## Database Schema

### notifications table
```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

**Fields:**
- `id`: Unique notification identifier
- `user_id`: ID of user receiving notification
- `title`: Short notification title
- `message`: Detailed notification message
- `type`: Notification type (appointment, appointment_status, medical_record, approval, appointment_reminder, profile_update, system)
- `is_read`: Boolean flag for read status
- `related_entity_id`: Optional ID reference to related entity (appointment, record, etc.)
- `created_at`: Timestamp when notification was created

---

## Testing

### Manual Testing

1. **Test Appointment Status Notification:**
   - Update appointment status to "Confirmed", "Completed", or "Cancelled"
   - Check that patient receives appropriate notification
   - Verify doctor name is included in message

2. **Test Medical Record Notification:**
   - Create/update medical record for patient
   - Check that patient receives notification
   - Verify doctor name is included

3. **Test Approval Notification:**
   - Call approval endpoint with sample data
   - Verify notification appears for user
   - Check format: "Dr. [Name] approved your [Type]: [Title]"

4. **Test Appointment Reminder:**
   - Call reminder endpoint
   - Verify date/time formatting is correct
   - Check that patient receives reminder

5. **Test System Alert:**
   - Send system alert to user
   - Verify title and message display correctly
   - Check⚙️ icon appears

### Automated Testing

Run the test script:
```bash
node backend/test-notifications.js
```

This demonstrates all notification types with expected messages.

---

## Frontend Integration

### Viewing Notifications

**Doctor Dashboard:**
- Click 🔔 bell icon in top navigation
- Dropdown shows latest notifications with indicators
- Click "Mark all read" button to mark all as read

**Patient Dashboard (App.jsx):**
- Click 🔔 bell icon in header
- Same notification dropdown interface
- Personalized notifications with doctor names

### Notification Preferences

Users can toggle notification types in their Settings:
- Email Notifications (default: enabled)
- SMS Notifications (default: disabled)
- Push Notifications (default: enabled)

*Note: These are UI toggles for future email/SMS integration*

---

## Future Enhancements

1. **Email Notifications**: Integrate Nodemailer to send actual emails
2. **SMS Notifications**: Integrate Twilio for SMS delivery
3. **Push Notifications**: Implement Web Push API for browser notifications
4. **Delivery Tracking**: Track whether notifications were read/delivered
5. **Notification History**: Archive old notifications with search capability
6. **Custom Notification Rules**: Let users customize which notifications they receive
7. **Bulk Notifications**: Send notifications to multiple users at once
8. **Scheduling**: Schedule notifications to be sent at specific times

---

## Code Examples

### Creating a Notification Manually

```javascript
// Backend - Node.js
generateApprovalNotification(
  userId = 1,
  approverName = "Tiro",
  itemType = "Medical Request",
  itemTitle = "Lab Test"
);
```

### Fetching Notifications

```javascript
// Frontend - React
const fetchNotifications = async (userId) => {
  const res = await api.get(`/notifications/${userId}?limit=10`);
  setNotifications(res.data.notifications || []);
};
```

### Marking as Read

```javascript
// Frontend - React
const markNotificationAsRead = async (notificationId) => {
  await api.put(`/notifications/${notificationId}/read`);
  setNotifications(prev => 
    prev.map(n => n.id === notificationId ? {...n, is_read: true} : n)
  );
};
```

---

## Styling Standards

All notifications follow a consistent design:

1. **Icon**: 18px emoji emoji placed at left
2. **Title**: Bold font-semibold text
3. **Message**: Regular text with secondary styling
4. **Timestamp**: Small, muted text below message
5. **Background**: Type-specific color with opacity
6. **Border**: Subtle border matching background theme
7. **Delete Button**: Small ✕ button at right
8. **Read Indicator**: Small blue dot for unread

---

## Troubleshooting

### Notification Not Appearing

1. Check that user ID is correct
2. Verify notification was inserted into database: 
   ```sql
   SELECT * FROM notifications WHERE user_id = 1;
   ```
3. Check browser console for any JavaScript errors
4. Verify notification preferences are enabled

### Personalized Name Not Showing

1. Ensure doctor/user exists in database with proper name field
2. Check that doctorId/userId matches actual database IDs
3. Verify name field is not NULL in users table

### Notifications Not Refreshing

1. Frontend polls notifications when components mount
2. If not appearing, try refreshing page: F5
3. Check network tab for API response status
4. Verify authentication token is valid

---

## Production Checklist

- [ ] Test all notification types in production
- [ ] Monitor notification creation logs
- [ ] Set up email/SMS integration
- [ ] Test notifications on mobile devices
- [ ] Set up backup for important notifications
- [ ] Configure notification preferences by role
- [ ] Document notification retention policy
- [ ] Set up alerts for failed notifications

---

**Last Updated:** April 13, 2026
**System Version:** Medicare Portal v1.2
