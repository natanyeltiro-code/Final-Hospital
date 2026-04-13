require("dotenv").config();
const axios = require("axios");

const API_URL = "http://localhost:3000";

async function testAppointmentConfirmation() {
  try {
    console.log("\n🔐 STEP 1: Login as Doctor Tiro");
    const loginRes = await axios.post(`${API_URL}/login`, {
      email: "Tiro@gmail.com",
      password: "test123"
    });
    
    const token = loginRes.data.token;
    console.log(`✅ Login successful! Token: ${token.substring(0, 20)}...`);
    console.log(`   User ID: ${loginRes.data.user.id}`);
    console.log(`   User Role: ${loginRes.data.user.role}`);
    
    const headers = { Authorization: `Bearer ${token}` };
    const doctorId = loginRes.data.user.id;
    
    console.log("\n📋 STEP 2: Get doctor's appointments");
    const appointmentsRes = await axios.get(`${API_URL}/appointments/${doctorId}`, { headers });
    const appointments = appointmentsRes.data.appointments || appointmentsRes.data;
    console.log(`✅ Got ${appointments.length} appointments`);
    
    // Find first appointment with status != "Confirmed"
    const appointmentToConfirm = appointments.find(a => a.status !== "Confirmed");
    
    if (!appointmentToConfirm) {
      console.log("⚠️  No appointments to confirm (all are already confirmed)");
      process.exit(0);
    }
    
    console.log(`\n🔑 STEP 3: Found appointment to confirm:`);
    console.log(`   ID: ${appointmentToConfirm.id}`);
    console.log(`   Patient ID: ${appointmentToConfirm.patient_id}`);
    console.log(`   Current Status: ${appointmentToConfirm.status}`);
    
    console.log(`\n⏳ STEP 4: Confirming appointment...`);
    console.log(`   Making PUT request to: /appointments/${appointmentToConfirm.id}`);
    console.log(`   With status: "Confirmed"`);
    
    const confirmRes = await axios.put(
      `${API_URL}/appointments/${appointmentToConfirm.id}`,
      { status: "Confirmed" },
      { headers }
    );
    
    console.log(`\n✅ STEP 5: Confirmation successful!`);
    console.log(`   Response:`, confirmRes.data);
    
    console.log(`\n⏳ Waiting 2 seconds for database to process notifications...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`\n📧 STEP 6: Checking notifications for patient...`);
    const patientNotificationsRes = await axios.get(
      `${API_URL}/notifications/${appointmentToConfirm.patient_id}`,
      { headers }
    );
    
    const patientNotifications = patientNotificationsRes.data;
    console.log(`✅ Patient has ${patientNotifications.length} notifications`);
    
    const statusNotification = patientNotifications.find(n => n.type === "appointment_status");
    if (statusNotification) {
      console.log(`✅✅✅ FOUND APPOINTMENT_STATUS NOTIFICATION!`);
      console.log(`   Title: ${statusNotification.title}`);
      console.log(`   Message: ${statusNotification.message}`);
      console.log(`   Type: ${statusNotification.type}`);
    } else {
      console.log(`❌ NO APPOINTMENT_STATUS NOTIFICATION FOUND`);
      console.log(`   Latest notifications from patient:`);
      patientNotifications.slice(0, 3).forEach((n, i) => {
        console.log(`   [${i+1}] Type: ${n.type}, Title: ${n.title}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    process.exit(1);
  }
}

testAppointmentConfirmation();

testAppointmentConfirmation();
