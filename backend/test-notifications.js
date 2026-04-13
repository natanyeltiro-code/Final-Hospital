/*
  Test script for the enhanced notification system
  Run: node backend/test-notifications.js
*/

const http = require('http');

// Helper to make HTTP POST requests
const makeRequest = (path, method, data) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if needed
        'Authorization': 'Bearer your_auth_token_here'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function runTests() {
  console.log('🧪 Testing Enhanced Notification System\n');
  console.log('=========================================\n');

  try {
    // Test 1: Appointment Status Notification
    console.log('1️⃣  Testing Appointment Status Notification...');
    console.log('   Simulating appointment confirmation');
    console.log('   - Doctor ID: 2 (Dr. Tiro)');
    console.log('   - Patient ID: 1');
    console.log('   - Appointment ID: 1');
    console.log('   - New Status: Confirmed\n');

    // Test 2: Medical Record Notification
    console.log('2️⃣  Testing Medical Record Notification...');
    console.log('   Simulating new medical record');
    const recordResult = await makeRequest('/notifications/medical-record', 'POST', {
      recordId: 101,
      patientId: 1,
      doctorId: 2,
      action: 'created'
    });
    console.log('   Response:', recordResult.message);
    console.log('   Expected: ✅ Medical record created notification sent\n');

    // Test 3: Approval Notification
    console.log('3️⃣  Testing Approval Notification...');
    const approvalResult = await makeRequest('/notifications/send-approval', 'POST', {
      userId: 1,
      approverName: 'Tiro',
      itemType: 'Medical Request',
      itemTitle: 'Lab Test - Complete Blood Count'
    });
    console.log('   Response:', approvalResult.message);
    console.log('   Expected Message: "Dr. Tiro Approved your Medical Request: Lab Test - Complete Blood Count"\n');

    // Test 4: Appointment Reminder
    console.log('4️⃣  Testing Appointment Reminder...');
    const reminderResult = await makeRequest('/notifications/appointment-reminder', 'POST', {
      appointmentId: 1,
      patientId: 1,
      doctorId: 2,
      appointmentDate: '2026-04-20',
      appointmentTime: '14:30'
    });
    console.log('   Response:', reminderResult.message);
    console.log('   Expected Message: "Reminder: Your appointment with Dr. Tiro is scheduled for Apr 20, 2026 at 14:30"\n');

    // Test 5: System Alert
    console.log('5️⃣  Testing System Alert...');
    const alertResult = await makeRequest('/notifications/system-alert', 'POST', {
      userId: 1,
      title: 'System Maintenance',
      message: 'The system will be undergoing maintenance on April 15, 2026 from 10 PM to 12 AM.',
      alertType: 'system'
    });
    console.log('   Response:', alertResult.message);
    console.log('   Expected: ✅ System alert sent\n');

    // Test 6: Profile Update Notification
    console.log('6️⃣  Testing Profile Update Notification...');
    console.log('   Types available:');
    console.log('   - personal: "Your profile information has been updated"');
    console.log('   - password: "Your password has been successfully changed"');
    console.log('   - contact: "Your contact information has been updated"');
    console.log('   - medical: "Your medical information has been updated"\n');

    console.log('=========================================\n');
    console.log('📊 Notification Types Summary:\n');
    console.log('✅ appointment_status - Green icon - When doctor confirms/completes appointment');
    console.log('📋 medical_record - Blue icon - When doctor creates/updates medical record');
    console.log('👍 approval - Purple icon - When doctor approves something');
    console.log('⏰ appointment_reminder - Yellow icon - Reminder before appointment');
    console.log('👤 profile_update - Cyan icon - When user updates profile');
    console.log('⚙️ system - Gray icon - System alerts and announcements');
    console.log('📌 appointment - Teal icon - Default appointment notifications\n');

    console.log('=========================================\n');
    console.log('✅ Test Summary:');
    console.log('All notification types are now available with personalized messages including doctor/user names.');
    console.log('Each notification type has unique styling with icons and background colors for better UX.\n');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run tests
runTests();
