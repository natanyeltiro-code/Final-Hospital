require("dotenv").config();
const axios = require("axios");

const API_URL = "http://localhost:3000";

async function testPatientNotifications() {
  try {
    // Get patient 7 (wew) info first
    console.log("\n👤 Getting patient 'wew' (user 7) email...");
    const { db } = require("./config/db");
    
    // We'll use a different approach - let's check if wew exists
    console.log("\n🔐 Attempting to login as patient 'wew'...");
    // First, we need to know wew's password. Let me just test with a known user or create one
    
    // Actually, let's just query the database directly to see notifications for user 7
    const db_module = require("./config/db");
    
    console.log("\n📧 Checking notifications for patient user 7 (wew):");
    db_module.query(
      `SELECT id, title, message, type, created_at, is_read 
       FROM notifications 
       WHERE user_id = 7 
       ORDER BY created_at DESC 
       LIMIT 10`,
      (err, results) => {
        if (err) {
          console.error("Error:", err.message);
          process.exit(1);
        }
        
        console.log(`\n✅ Found ${results.length} notifications for patient user 7:`);
        
        const appointmentStatusNotifs = results.filter(n => n.type === "appointment_status");
        console.log(`\n   appointment_status: ${appointmentStatusNotifs.length}`);
        
        if (appointmentStatusNotifs.length > 0) {
          console.log(`\n   ✅✅✅ PATIENT "wew" HAS APPOINTMENT_STATUS NOTIFICATIONS! 🎉`);
          appointmentStatusNotifs.slice(0, 3).forEach((n, i) => {
            console.log(`\n   [${i+1}] ${new Date(n.created_at).toLocaleString()}`);
            console.log(`       Title: ${n.title}`);
            console.log(`       Message: ${n.message}`);
            console.log(`       Read: ${n.is_read ? 'Yes' : 'No'}`);
          });
        } else {
          console.log(`\n   ❌ No appointment_status notifications for patient "wew"`);
        }
        
        // Show all notifications grouped by type
        console.log(`\n\n   All notifications for patient 7 by type:`);
        const typeCount = {};
        results.forEach(n => {
          typeCount[n.type] = (typeCount[n.type] || 0) + 1;
        });
        Object.entries(typeCount).forEach(([type, count]) => {
          console.log(`      - ${type}: ${count}`);
        });
        
        process.exit(0);
      }
    );
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testPatientNotifications();
