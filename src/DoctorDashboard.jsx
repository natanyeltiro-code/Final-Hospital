import { useState, useEffect } from "react";
import api from "./api";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  ChevronLeft,
  Activity,
  Search,
  ClipboardList,
  Pencil,
  Plus,
  Printer,
  Trash2,
  MoreVertical,
  Clock3,
  Check,
  X,
  Mail,
  Phone,
  Moon,
  Sun,
  Eye,
} from "lucide-react";

const DoctorDashboard = ({ loggedInUser, setLoggedInUser, onLogout }) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [appointmentFilter, setAppointmentFilter] = useState("All");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [prescriptionSearch, setPrescriptionSearch] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showAddPrescriptionModal, setShowAddPrescriptionModal] = useState(false);
  const [showEditPrescriptionModal, setShowEditPrescriptionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openActionsId, setOpenActionsId] = useState(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [recordForm, setRecordForm] = useState({
    patientId: "",
    diagnosis: "",
    treatment: "",
    notes: "",
    status: "Active",
  });
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicalRecordId: "",
    patientId: "",
    medication: "",
    dosageAmount: "",
    dosageUnit: "mg",
    frequency: "",
    duration: "",
    instructions: "",
  });
  const [editPrescriptionForm, setEditPrescriptionForm] = useState({
    medication: "",
    dosageAmount: "",
    dosageUnit: "mg",
    frequency: "",
    duration: "",
    instructions: "",
  });
  const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  const [loadingAppointmentDetails, setLoadingAppointmentDetails] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState(null);
  const [error, setError] = useState(null);
  const [profileForm, setProfileForm] = useState({
    fullName: loggedInUser?.name || "Dr. Sarah Jenkins",
    email: loggedInUser?.email || "sarah.j@hospital.com",
    phone: "+1 234-567-8901",
    specialization: "Cardiology",
    department: "Cardiology",
    yearsExperience: "12",
    bio: "",
  });

  const normalizeMedicalRecords = (items = []) =>
    items.map((record) => ({
      ...record,
      patientName: record.patientName || record.patient_name || "Unknown Patient",
    }));

  const parseDosage = (dosage = "") => {
    const parts = String(dosage).trim().split(/\s+/);
    if (parts.length >= 2) {
      return {
        dosageAmount: parts[0],
        dosageUnit: parts.slice(1).join(" "),
      };
    }

    return {
      dosageAmount: dosage || "",
      dosageUnit: "mg",
    };
  };

  const appClasses = darkMode
    ? "min-h-screen bg-slate-950 text-slate-100"
    : "min-h-screen bg-[#f6f7f9] text-slate-800";

  const sidebarClasses = darkMode
    ? `flex flex-col justify-between transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-[260px]"} border-r border-slate-800 bg-slate-900 hidden md:flex`
    : `flex flex-col justify-between transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-[260px]"} border-r border-slate-200 bg-white hidden md:flex`;

  const topbarClasses = darkMode
    ? "relative flex h-[72px] items-center justify-between border-b border-slate-800 bg-slate-900 px-4 md:px-9"
    : "relative flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 md:px-9";

  const cardClasses = darkMode
    ? "rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm"
    : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

  const textMain = darkMode ? "text-slate-100" : "text-slate-900";
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";
  const textSoft = darkMode ? "text-slate-300" : "text-slate-600";
  const borderSoft = darkMode ? "border-slate-800" : "border-slate-200";
  const hoverRow = darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50";
  const panelBg = darkMode ? "bg-slate-950" : "bg-white";
  const softPanelBg = darkMode ? "bg-slate-900" : "bg-slate-50";

  const activeNav = darkMode
    ? "bg-teal-500/15 text-teal-300"
    : "bg-teal-50 text-teal-700";

  const inactiveNav = darkMode
    ? "text-slate-300 hover:bg-slate-800"
    : "text-slate-600 hover:bg-slate-50";

  const inputClasses = `w-full rounded-lg border ${borderSoft} px-4 py-3 outline-none ${
    darkMode
      ? "bg-slate-800 text-slate-100 placeholder-slate-500"
      : "bg-white text-slate-900 placeholder-slate-400"
  }`;

  const secondaryButtonClasses = `rounded-lg border ${borderSoft} py-3 ${
    darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
  }`;

  const getInitials = (name = "P") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "P";

  const getStatusBadgeClass = (status) => {
    if (status === "Completed") {
      return darkMode
        ? "bg-emerald-500/15 text-emerald-300"
        : "bg-emerald-100 text-emerald-700";
    }
    if (status === "Pending") {
      return darkMode
        ? "bg-amber-500/15 text-amber-300"
        : "bg-amber-100 text-amber-700";
    }
    if (status === "Confirmed") {
      return darkMode
        ? "bg-blue-500/15 text-blue-300"
        : "bg-blue-100 text-blue-700";
    }
    if (status === "Cancelled") {
      return darkMode
        ? "bg-red-500/15 text-red-300"
        : "bg-red-100 text-red-700";
    }
    if (status === "No Appointments") {
      return darkMode
        ? "bg-slate-700 text-slate-200"
        : "bg-slate-100 text-slate-700";
    }
    return darkMode
      ? "bg-slate-700 text-slate-200"
      : "bg-slate-100 text-slate-700";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const patientsRes = await api.get("/patients");
        setPatients(patientsRes.data.patients || []);

        const appointmentsRes = await api.get(`/appointments/${loggedInUser.id}`);
        setAppointments(appointmentsRes.data.appointments || []);

        const recordsRes = await api.get("/doctor/medical-records");
        setRecords(normalizeMedicalRecords(recordsRes.data.records || []));

        const prescriptionsRes = await api.get("/doctor/prescriptions");
        setPrescriptions(prescriptionsRes.data.prescriptions || []);

        // Fetch notifications for the doctor
        const notificationsRes = await api.get(`/notifications/${loggedInUser.id}`);
        const notificationsWithUnread = (notificationsRes.data.notifications || []).map(notif => ({
          ...notif,
          unread: !notif.is_read
        }));
        setNotificationsList(notificationsWithUnread || []);
        // Calculate unread count
        const unread = notificationsWithUnread.filter(n => !n.is_read).length || 0;
        setUnreadCount(unread);
      } catch (err) {
        const requestUrl = err.response?.config?.url || "unknown url";
        const statusCode = err.response?.status;
        const serverMessage = err.response?.data?.message;

        setError(
          serverMessage ||
            (statusCode
              ? `Dashboard request failed at ${requestUrl} with status ${statusCode}`
              : err.message) ||
            "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    if (loggedInUser?.id) {
      fetchData();
    } else {
      setError("Unable to load dashboard: missing doctor ID.");
      setLoading(false);
    }
  }, [loggedInUser?.id]);

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      // Update local state
      setNotificationsList(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, unread: false } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      // Update local state
      setNotificationsList(prev => prev.filter(n => n.id !== notificationId));
      // Recalculate unread count
      const unread = notificationsList.filter(n => n.id !== notificationId && !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.put(`/notifications/${loggedInUser.id}/mark-all-read`);
      // Update local state
      setNotificationsList(prev => prev.map(n => ({ ...n, is_read: true, unread: false })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Auto-complete confirmed appointments when their time passes
  useEffect(() => {
    const autoCompleteConfirmedAppointments = async () => {
      const now = new Date();
      
      // Find all confirmed appointments that have passed
      const confirmedToComplete = appointments.filter((apt) => {
        if (apt.status !== "Confirmed") return false;
        
        try {
          let dateStr = apt.date;
          if (dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
          }
          const aptDateTime = new Date(`${dateStr}T${apt.time || "00:00"}`);
          return aptDateTime < now; // Appointment time has passed
        } catch (err) {
          return false;
        }
      });

      // Auto-complete each confirmed appointment that has passed
      for (const apt of confirmedToComplete) {
        try {
          await api.put(`/appointments/${apt.id}`, { status: "Completed" });
          console.log(`✅ Auto-completed appointment ${apt.id}`);
        } catch (err) {
          console.error(`Failed to auto-complete appointment ${apt.id}:`, err);
        }
      }

      // Refresh appointments if any were auto-completed
      if (confirmedToComplete.length > 0) {
        try {
          const appointmentsRes = await api.get(`/appointments/${loggedInUser.id}`);
          setAppointments(appointmentsRes.data.appointments || []);
        } catch (err) {
          console.error("Error refreshing appointments:", err);
        }
      }
    };

    if (loggedInUser?.id && appointments.length > 0) {
      autoCompleteConfirmedAppointments();
      
      // Check every 5 minutes
      const interval = setInterval(autoCompleteConfirmedAppointments, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [loggedInUser?.id, appointments]);

  useEffect(() => {
    if (!loggedInUser) return;

    console.log("📖 useEffect - Syncing loggedInUser to profileForm:");
    console.log("  loggedInUser:", loggedInUser);

    setProfileForm((prev) => {
      const newForm = {
        ...prev,
        // Always update with loggedInUser values, even if empty
        fullName: loggedInUser.name !== undefined && loggedInUser.name !== null ? loggedInUser.name : prev.fullName,
        email: loggedInUser.email !== undefined && loggedInUser.email !== null ? loggedInUser.email : prev.email,
        phone: loggedInUser.phone !== undefined && loggedInUser.phone !== null ? loggedInUser.phone : prev.phone,
        specialization: loggedInUser.specialty !== undefined && loggedInUser.specialty !== null ? loggedInUser.specialty : prev.specialization,
        department: loggedInUser.department !== undefined && loggedInUser.department !== null ? loggedInUser.department : prev.department,
        yearsExperience: loggedInUser.experience !== null && loggedInUser.experience !== undefined ? String(loggedInUser.experience) : prev.yearsExperience,
        bio: loggedInUser.bio !== undefined && loggedInUser.bio !== null ? loggedInUser.bio : prev.bio,
      };
      console.log("  Updated profileForm:", newForm);
      return newForm;
    });
  }, [loggedInUser]);

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      // Get appointment details before updating
      const appointmentToUpdate = appointments.find((apt) => apt.id === appointmentId);
      if (!appointmentToUpdate) {
        console.error("Appointment not found");
        return;
      }

      // Update appointment status
      await api.put(`/appointments/${appointmentId}`, { status });
      
      // Send notification to patient based on new status
      const patientId = appointmentToUpdate.patient_id;
      const doctorName = loggedInUser?.name || "Doctor";
      
      if (status === "Confirmed" && patientId) {
        try {
          await api.post("/notifications", {
            userId: patientId,
            type: "appointment_status",
            title: "Appointment Confirmed",
            message: `Dr. ${doctorName} confirmed your booking.`,
            relatedId: appointmentId,
            relatedType: "appointment",
          });
        } catch (err) {
          console.error("Error sending confirmation notification:", err);
        }
      } else if (status === "Cancelled" && patientId) {
        try {
          await api.post("/notifications", {
            userId: patientId,
            type: "appointment_status",
            title: "Appointment Rejected",
            message: `Dr. ${doctorName} rejected your booking.`,
            relatedId: appointmentId,
            relatedType: "appointment",
          });
        } catch (err) {
          console.error("Error sending cancellation notification:", err);
        }
      }

      // Refresh appointments
      const appointmentsRes = await api.get(`/appointments/${loggedInUser.id}`);
      setAppointments(appointmentsRes.data.appointments || []);

      // Refresh notifications
      const notificationsRes = await api.get(`/notifications/${loggedInUser.id}`);
      const notificationsWithUnread = (notificationsRes.data.notifications || []).map(notif => ({
        ...notif,
        unread: !notif.is_read
      }));
      setNotificationsList(notificationsWithUnread || []);
    } catch (err) {
      console.error("Error updating appointment status:", err);
    }
  };

  const handleViewAppointmentDetails = async (appointmentId) => {
    try {
      setLoadingAppointmentDetails(true);
      const response = await api.get(`/appointments-details/${appointmentId}`);
      setSelectedAppointmentDetails(response.data.appointment);
      setShowAppointmentDetailsModal(true);
    } catch (err) {
      console.error("Error fetching appointment details:", err);
      alert("Failed to load appointment details.");
    } finally {
      setLoadingAppointmentDetails(false);
    }
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setActivePage("records");
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setProfileSaveMessage(null);

      const profileData = {
        name: profileForm.fullName,
        email: profileForm.email,
        phone: profileForm.phone,
        specialization: profileForm.specialization,
        department: profileForm.department,
        yearsExperience: profileForm.yearsExperience,
        bio: profileForm.bio,
      };

      console.log("💾 Sending profile update:");
      console.log("  Data:", profileData);

      const response = await api.put(`/users/${loggedInUser.id}`, profileData);

      console.log("✅ Response from server:");
      console.log("  Message:", response.data?.message);
      console.log("  User data:", response.data?.user);

      // Update the loggedInUser state with the response data
      if (response.data?.user) {
        const updatedUser = {
          ...loggedInUser,
          ...response.data.user,
          // Ensure these fields are included
          specialty: response.data.user.specialty,
          experience: response.data.user.experience,
          rating: response.data.user.rating,
          bio: response.data.user.bio,
          department: response.data.user.department,
        };
        console.log("🔄 Updating loggedInUser state with:", updatedUser);
        setLoggedInUser(updatedUser);
      }

      setProfileSaveMessage({
        type: "success",
        text: response.data?.message || "Profile updated successfully!",
      });

      // Clear success message after 3 seconds
      setTimeout(() => setProfileSaveMessage(null), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setProfileSaveMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();

    if (
      !prescriptionForm.medicalRecordId ||
      !prescriptionForm.patientId ||
      !prescriptionForm.medication ||
      !prescriptionForm.dosageAmount ||
      !prescriptionForm.dosageUnit ||
      !prescriptionForm.frequency ||
      !prescriptionForm.duration
    ) {
      alert("Please fill all required fields for the prescription.");
      return;
    }

    try {
      await api.post("/prescriptions", {
        medicalRecordId: prescriptionForm.medicalRecordId,
        patientId: prescriptionForm.patientId,
        doctorId: loggedInUser.id,
        medication: prescriptionForm.medication,
        dosage: `${prescriptionForm.dosageAmount} ${prescriptionForm.dosageUnit}`,
        frequency: prescriptionForm.frequency,
        duration: prescriptionForm.duration,
        instructions: prescriptionForm.instructions,
        prescribed_date: new Date().toISOString().split("T")[0],
      });

      const prescriptionsRes = await api.get("/doctor/prescriptions");
      setPrescriptions(prescriptionsRes.data.prescriptions || []);
      const recordsRes = await api.get("/doctor/medical-records");
      setRecords(normalizeMedicalRecords(recordsRes.data.records || []));
      setPrescriptionForm({
        medicalRecordId: "",
        patientId: "",
        medication: "",
        dosageAmount: "",
        dosageUnit: "mg",
        frequency: "",
        duration: "",
        instructions: "",
      });
      setShowAddPrescriptionModal(false);
    } catch (err) {
      console.error("Error adding prescription:", err);
      alert(err.response?.data?.message || "Failed to add prescription.");
    }
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm("Delete this prescription?")) return;

    try {
      await api.delete(`/prescriptions/${prescriptionId}`);
      const prescriptionsRes = await api.get("/doctor/prescriptions");
      setPrescriptions(prescriptionsRes.data.prescriptions || []);
      setOpenActionsId(null);
    } catch (err) {
      console.error("Error deleting prescription:", err);
      alert("Failed to delete prescription.");
    }
  };

  const handleOpenEditPrescription = (prescription) => {
    const parsedDosage = parseDosage(prescription.dosage);
    setSelectedPrescription(null);
    setEditingPrescription(prescription);
    setEditPrescriptionForm({
      medication: prescription.medication || "",
      dosageAmount: parsedDosage.dosageAmount || "",
      dosageUnit: parsedDosage.dosageUnit || "mg",
      frequency: prescription.frequency || "",
      duration: prescription.duration || "",
      instructions: prescription.instructions || "",
    });
    setShowEditPrescriptionModal(true);
    setOpenActionsId(null);
  };

  const handleUpdatePrescription = async (e) => {
    e.preventDefault();

    if (
      !editingPrescription?.id ||
      !editPrescriptionForm.medication ||
      !editPrescriptionForm.dosageAmount ||
      !editPrescriptionForm.dosageUnit ||
      !editPrescriptionForm.frequency ||
      !editPrescriptionForm.duration
    ) {
      alert("Please fill all required fields for the prescription.");
      return;
    }

    try {
      await api.patch(`/prescriptions/${editingPrescription.id}`, {
        medication: editPrescriptionForm.medication,
        dosage: `${editPrescriptionForm.dosageAmount} ${editPrescriptionForm.dosageUnit}`,
        frequency: editPrescriptionForm.frequency,
        duration: editPrescriptionForm.duration,
        instructions: editPrescriptionForm.instructions,
      });

      const prescriptionsRes = await api.get("/doctor/prescriptions");
      const updatedPrescriptions = prescriptionsRes.data.prescriptions || [];
      setPrescriptions(updatedPrescriptions);

      const refreshedSelected = updatedPrescriptions.find(
        (prescription) => prescription.id === editingPrescription.id
      );
      if (refreshedSelected) {
        setSelectedPrescription(refreshedSelected);
      }

      setShowEditPrescriptionModal(false);
      setEditingPrescription(null);
    } catch (err) {
      console.error("Error updating prescription:", err);
      alert("Failed to update prescription.");
    }
  };

  const handlePrintPrescription = (prescription) => {
    const printContent = `
      <html>
        <head>
          <title>Prescription</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            .header { margin-bottom: 24px; }
            .header h2 { margin: 0; }
            .card { border: 1px solid #d1d5db; border-radius: 16px; padding: 24px; }
            .row { margin-bottom: 16px; }
            .label { font-weight: 600; color: #334155; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Prescription</h2>
            <p>Dr. ${loggedInUser?.name || 'Doctor'}</p>
          </div>
          <div class="card">
            <div class="row"><span class="label">Patient:</span> ${prescription.patient_name || "Unknown"}</div>
            <div class="row"><span class="label">Medication:</span> ${prescription.medication}</div>
            <div class="row"><span class="label">Dosage:</span> ${prescription.dosage}</div>
            <div class="row"><span class="label">Frequency:</span> ${prescription.frequency || "N/A"}</div>
            <div class="row"><span class="label">Duration:</span> ${prescription.duration || "N/A"}</div>
            <div class="row"><span class="label">Instructions:</span> ${prescription.instructions || "N/A"}</div>
            <div class="row"><span class="label">Date:</span> ${new Date(prescription.prescribed_date).toLocaleDateString()}</div>
            <div class="row"><span class="label">Medical Record:</span> ${prescription.medical_record_diagnosis || prescription.medical_record_title || "N/A"}</div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "PRINT", "height=650,width=900,top=100,left=150");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleUpdateRecordStatus = async (recordId, newStatus) => {
    try {
      await api.patch(`/medical-records/${recordId}`, { status: newStatus });
      const recordsRes = await api.get("/doctor/medical-records");
      setRecords(normalizeMedicalRecords(recordsRes.data.records || []));
    } catch (err) {
      console.error("Error updating record status:", err);
    }
  };

  const handleAddMedicalRecord = async (e) => {
    e.preventDefault();

    if (!recordForm.patientId || !recordForm.diagnosis || !recordForm.treatment) {
      alert("Please fill all required fields for the medical record.");
      return;
    }

    try {
      await api.post("/medical-records", {
        patientId: recordForm.patientId,
        doctorId: loggedInUser.id,
        diagnosis: recordForm.diagnosis,
        treatment: recordForm.treatment,
        notes: recordForm.notes,
        status: recordForm.status,
        record_date: new Date().toISOString().split("T")[0],
      });

      const recordsRes = await api.get("/doctor/medical-records");
      setRecords(normalizeMedicalRecords(recordsRes.data.records || []));
      setRecordForm({
        patientId: "",
        diagnosis: "",
        treatment: "",
        notes: "",
        status: "Active",
      });
      setShowAddRecordModal(false);
    } catch (err) {
      console.error("Error adding medical record:", err);
      alert("Failed to add medical record.");
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm("Delete this medical record?")) return;

    try {
      await api.delete(`/medical-records/${recordId}`);
      const recordsRes = await api.get("/doctor/medical-records");
      setRecords(normalizeMedicalRecords(recordsRes.data.records || []));
      setOpenActionsId(null);
    } catch (err) {
      console.error("Error deleting medical record:", err);
      alert("Failed to delete medical record.");
    }
  };

  // Get unique patient IDs from appointments with this doctor
  const patientIdsWithAppointments = new Set(
    appointments
      .filter((apt) => apt.patient_id) // Only patients with patient_id (exclude emergency patients)
      .map((apt) => apt.patient_id)
  );

  // Filter patients to only show those who have appointments with this doctor
  const doctorPatients = patients.filter((patient) => patientIdsWithAppointments.has(patient.id));
  
  const filteredDoctorPatients = doctorPatients.filter((patient) => {
    const search = patientSearch.toLowerCase();
    return (
      (patient.name || "").toLowerCase().includes(search) ||
      (patient.email || "").toLowerCase().includes(search) ||
      (patient.condition || "").toLowerCase().includes(search)
    );
  });

  const recentRecords = records.slice(0, 3).map((record, index) => ({
    id: record.id || index,
    patientName: record.patientName || "Unknown Patient",
    title: record.title || record.diagnosis || "Medical record",
    date: record.record_date || record.date || "Unknown date",
  }));

  // Helper function to format time as HH:MM AM/PM
  const formatTimeString = (timeString) => {
    if (!timeString) return "TBD";
    try {
      // If it's in HH:MM or HH:MM:SS format
      if (typeof timeString === "string" && timeString.includes(":")) {
        const [hours, minutes] = timeString.split(":").slice(0, 2);
        const date = new Date();
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
        return date.toLocaleTimeString("en-US", { 
          hour: "numeric", 
          minute: "2-digit", 
          hour12: true 
        });
      }
      // If it's a full ISO date string
      const date = new Date(timeString);
      return date.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit", 
        hour12: true 
      });
    } catch (err) {
      return timeString;
    }
  };

  const doctorAppointments = appointments.map((apt) => ({
    ...apt,
    patientName: patients.find((p) => p.id === apt.patient_id)?.name || "Unknown Patient",
    formattedDate: apt.date
      ? new Date(apt.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "TBD",
    formattedTime: formatTimeString(apt.time),
    type: apt.type || "Consultation",
    status: apt.status || "Pending",
  }));

  const getLocalDateKey = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayAppointments = doctorAppointments.filter((apt) => {
    const dateStr = getLocalDateKey(apt.date);
    const today = getLocalDateKey(new Date());
    return dateStr === today && apt.status !== "Cancelled";
  });

  const pendingAppointments = doctorAppointments.filter((apt) => apt.status === "Pending");

  const patientCount = doctorPatients.length;
  const todayCount = todayAppointments.length;
  const pendingCount = pendingAppointments.length;

  const renderDashboardPage = () => (
    <div className="p-9">
      <div className="mb-8">
        <h2 className="text-[32px] font-bold">
          Welcome back, <span className="text-teal-600">Dr. {loggedInUser?.name || 'Doctor'}</span>
        </h2>
        <p className={`mt-2 text-[18px] ${textMuted}`}>Here's your schedule for today.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className={cardClasses}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[16px] ${textMuted}`}>Today's Appointments</p>
              <p className="mt-3 text-[42px] font-bold">{todayCount}</p>
            </div>
            <div
              className={
                darkMode
                  ? "rounded-xl bg-teal-500/15 p-3 text-teal-300"
                  : "rounded-xl bg-teal-50 p-3 text-teal-600"
              }
            >
              <CalendarDays size={24} />
            </div>
          </div>
        </div>

        <div className={cardClasses}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[16px] ${textMuted}`}>Total Patients</p>
              <p className="mt-3 text-[42px] font-bold">{patientCount}</p>
            </div>
            <div
              className={
                darkMode
                  ? "rounded-xl bg-emerald-500/15 p-3 text-emerald-300"
                  : "rounded-xl bg-emerald-50 p-3 text-emerald-600"
              }
            >
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className={cardClasses}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[16px] ${textMuted}`}>Pending Requests</p>
              <p className="mt-3 text-[42px] font-bold">{pendingCount}</p>
            </div>
            <div
              className={
                darkMode
                  ? "rounded-xl bg-cyan-500/15 p-3 text-cyan-300"
                  : "rounded-xl bg-cyan-50 p-3 text-cyan-600"
              }
            >
              <Clock3 size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className={cardClasses}>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[22px] font-bold">Today's Schedule</h3>
            <p className={`text-sm ${textMuted}`}>
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="space-y-4">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((apt) => (
                <div key={apt.id} className={`flex gap-5 rounded-xl border ${borderSoft} p-5`}>
                  <div className="flex flex-col items-center justify-start pt-1">
                    <p className="text-[20px] font-bold text-teal-600">{apt.formattedTime.split(" ")[0]}</p>
                    <p className={`text-xs ${textMuted}`}>{apt.formattedTime.split(" ")[1] || ""}</p>
                  </div>

                  <div className="flex-1">
                    <p className="text-[18px] font-semibold">{apt.patientName}</p>
                    <p className={`mt-1 text-sm ${textMuted}`}>{apt.type}</p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(apt.status || "Pending")}`}>
                      {apt.status || "Pending"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className={`rounded-xl border ${borderSoft} p-6 text-center ${panelBg}`}>
                <p className={`text-sm ${textMuted}`}>No appointments scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        <div className={cardClasses}>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[22px] font-bold">Recent Records Added</h3>
            <button className="text-sm font-medium text-teal-600 hover:underline">View All</button>
          </div>

          <div className="space-y-4">
            {recentRecords.map((record) => (
              <div key={record.id} className={`flex items-start gap-4 rounded-xl border ${borderSoft} p-5`}>
                <div
                  className={
                    darkMode
                      ? "rounded-lg bg-teal-500/15 p-3 text-teal-300"
                      : "rounded-lg bg-teal-50 p-3 text-teal-600"
                  }
                >
                  <FileText size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{record.patientName}</p>
                  <p className={`mt-1 text-sm ${textSoft}`}>{record.title}</p>
                  <p className={`mt-2 text-xs ${textMuted}`}>{record.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatientsPage = () => {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        <div className="mb-8">
          <h2 className="text-[40px] font-bold tracking-tight">My Patients</h2>
          <p className={`mt-2 text-[18px] ${textMuted}`}>Patients assigned to your care.</p>
        </div>

        <div className={`mb-6 rounded-[20px] border ${borderSoft} ${panelBg} p-4 shadow-sm`}>
          <div
            className={`flex items-center gap-3 rounded-2xl border ${borderSoft} px-4 py-4 ${
              darkMode ? "bg-slate-900 text-slate-300" : "bg-white text-slate-500"
            }`}
          >
            <Search size={18} />
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Search by name or condition..."
              className="w-full bg-transparent text-[16px] outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {filteredDoctorPatients.length === 0 ? (
          <div className={`rounded-3xl border border-dashed ${darkMode ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-500"} p-10 text-center text-sm`}>
            No patients found.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filteredDoctorPatients.map((patient) => {
              const patientAppointments = appointments.filter((apt) => apt.patient_id === patient.id);
              const latestAppointment = [...patientAppointments].sort(
                (a, b) => new Date(b.date) - new Date(a.date)
              )[0];
              const completedAppointments = patientAppointments.filter((apt) => apt.status === "Completed");
              const lastVisitAppointment = [...completedAppointments].sort(
                (a, b) => new Date(b.date) - new Date(a.date)
              )[0];

              const patientRecords = records.filter(
                (record) => record.patient_id === patient.id || record.patientId === patient.id
              );
              const latestRecord = [...patientRecords].sort(
                (a, b) => new Date(b.record_date || b.date || 0) - new Date(a.record_date || a.date || 0)
              )[0];
              const conditionText = patient.condition || latestRecord?.diagnosis || latestRecord?.title || "No condition noted";
              const status = latestAppointment ? latestAppointment.status : "No Appointments";
              const avatarTone = darkMode ? "from-slate-700 to-slate-800 text-slate-100" : "from-orange-100 to-amber-50 text-slate-700";

              return (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handleViewPatient(patient)}
                  className={`text-left rounded-[18px] border ${borderSoft} ${
                    darkMode ? "bg-slate-950 hover:bg-slate-900" : "bg-white hover:border-slate-300"
                  } p-6 shadow-sm transition duration-200`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarTone} text-lg font-semibold shadow-sm`}>
                      {getInitials(patient.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className={`text-[16px] font-semibold ${textMain}`}>{patient.name}</p>
                          <p className={`mt-1 text-sm ${textMuted}`}>
                            {patient.age ? `${patient.age} years` : "Age not provided"} • {patient.gender || "Unknown"}
                          </p>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(status)}`}>
                          {status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {patient.bloodGroup && (
                          <span
                            className={
                              darkMode
                                ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300"
                                : "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                            }
                          >
                            {patient.bloodGroup}
                          </span>
                        )}

                        <span
                          className={
                            darkMode
                              ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300"
                              : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                          }
                        >
                          {conditionText}
                        </span>
                      </div>

                      {lastVisitAppointment && (
                        <p className={`mt-4 text-xs ${textMuted}`}>
                          Last visit:{" "}
                          <span className={`font-medium ${textSoft}`}>
                            {new Date(lastVisitAppointment.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Helper function to get display status based on appointment date
  const getDisplayStatus = (apt) => {
    try {
      if (!apt.date) return apt.status || "Pending";

      // Parse appointment date
      let dateStr = apt.date;
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0]; // Extract date part if ISO format
      }
      const aptDate = new Date(`${dateStr}T${apt.time || "00:00"}`);
      if (isNaN(aptDate.getTime())) return apt.status || "Pending";

      // Get today's date normalized
      const today = new Date();
      const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const aptDateNormalized = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());

      // If appointment is in the future → show "Confirmed"
      if (aptDate > today || (aptDateNormalized.getTime() > todayNormalized.getTime())) {
        return "Confirmed";
      }

      // If appointment is today or in the past → show the actual status
      return apt.status || "Pending";
    } catch (err) {
      return apt.status || "Pending";
    }
  };

  const renderAppointmentsPage = () => {
    const filters = ["All", "Today", "Upcoming", "Pending", "Completed"];
    const normalizedAppointmentSearch = appointmentSearch.trim().toLowerCase();

    const filteredAppointments = doctorAppointments.filter((apt) => {
      const matchesPatientName =
        !normalizedAppointmentSearch ||
        (apt.patientName || "").toLowerCase().includes(normalizedAppointmentSearch);

      if (!matchesPatientName) return false;
      if (appointmentFilter === "All") return true;

      try {
        if (!apt.date) return false;

        const aptDate = new Date(apt.date);
        if (Number.isNaN(aptDate.getTime())) return false;

        const today = new Date();
        const isToday = getLocalDateKey(apt.date) === getLocalDateKey(today);
        const isUpcoming = aptDate > today;
        const isPast = getLocalDateKey(apt.date) < getLocalDateKey(today);

        if (appointmentFilter === "Today") return isToday && apt.status !== "Cancelled";
        if (appointmentFilter === "Upcoming") return (isUpcoming || isToday) && apt.status !== "Cancelled";
        if (appointmentFilter === "Pending") return apt.status === "Pending" && !isPast;
        if (appointmentFilter === "Completed") return apt.status === "Completed" && (isToday || isPast); // Only show completed if happened

        return false;
      } catch (err) {
        console.error("Filter error:", err);
        return false;
      }
    });

    return (
      <div className="p-9">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-[28px] font-bold">My Appointments</h2>
            <p className={`mt-2 text-[18px] ${textMuted}`}>Manage your appointment schedule.</p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setAppointmentFilter(filter)}
              className={`rounded-full px-6 py-2 font-medium transition ${
                appointmentFilter === filter
                  ? "bg-teal-600 text-white"
                  : darkMode
                  ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className={`mb-8 flex items-center gap-3 rounded-2xl border ${borderSoft} px-4 py-3 ${darkMode ? "bg-slate-900" : "bg-white"} shadow-sm`}>
          <Search size={18} className={textMuted} />
          <input
            type="text"
            value={appointmentSearch}
            onChange={(e) => setAppointmentSearch(e.target.value)}
            placeholder={`Search patient name in ${appointmentFilter}`}
            className={`w-full bg-transparent text-sm outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-700 placeholder:text-slate-400"}`}
          />
        </div>

        <div className="space-y-5">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((apt) => (
              <div key={apt.id} className={`rounded-[24px] border ${borderSoft} ${panelBg} p-6 shadow-sm`}>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-5">
                    <div
                      className={`flex h-[68px] w-[68px] items-center justify-center rounded-full ${
                        darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="text-xl font-semibold">{getInitials(apt.patientName)}</span>
                    </div>

                    <div>
                      <h3 className="text-[22px] font-semibold">{apt.patientName}</h3>
                      <p className={`mt-2 text-[18px] ${textMuted}`}>{apt.type}</p>

                      <div className={`mt-5 flex flex-wrap items-center gap-6 text-[18px] ${textMuted}`}>
                        <div className="flex items-center gap-2">
                          <CalendarDays size={18} />
                          <span>{apt.formattedDate}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock3 size={18} />
                          <span>{apt.formattedTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-4 lg:items-end">
                    <span className={`rounded-full px-4 py-1 text-sm font-medium ${getStatusBadgeClass(apt.status || "Pending")}`}>
                      {apt.status || "Pending"}
                    </span>

                    {apt.status === "Pending" ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleUpdateAppointmentStatus(apt.id, "Confirmed")}
                          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
                        >
                          <Check size={18} />
                          Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateAppointmentStatus(apt.id, "Cancelled")}
                          className={`flex items-center gap-2 rounded-2xl border px-6 py-3 font-medium ${
                            darkMode
                              ? "border-red-700 text-red-300 hover:bg-red-950/50"
                              : "border-red-300 text-red-600 hover:bg-red-50"
                          }`}
                        >
                          <X size={18} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleViewAppointmentDetails(apt.id)}
                        className={`flex cursor-pointer items-center gap-2 rounded-2xl border ${borderSoft} px-7 py-3 font-medium transition ${
                          darkMode ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Eye size={18} />
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`rounded-[24px] border ${borderSoft} ${panelBg} p-12 text-center shadow-sm`}>
              <p className={`text-[18px] ${textMuted}`}>No appointments found</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMedicalRecordsPage = () => {
    const normalizedRecordSearch = recordSearch.trim().toLowerCase();
    const filteredRecords = (selectedPatient
      ? records.filter((record) => record.patient_id === selectedPatient.id || record.patientId === selectedPatient.id)
      : records
    ).filter((record) =>
      !normalizedRecordSearch ||
      (record.patientName || record.patient_name || "Unknown Patient")
        .toLowerCase()
        .includes(normalizedRecordSearch)
    );

    return (
      <div className="p-9">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[28px] font-bold">Medical Records</h2>
            <p className={`mt-2 text-[18px] ${textMuted}`}>Manage patient medical history and records.</p>
            {selectedPatient && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  className={
                    darkMode
                      ? "rounded-full bg-teal-500/15 px-3 py-2 text-sm font-semibold text-teal-300"
                      : "rounded-full bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700"
                  }
                >
                  Showing records for {selectedPatient.name}
                </span>
                <button onClick={() => setSelectedPatient(null)} className="text-sm font-medium text-teal-600 hover:underline">
                  Clear filter
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAddRecordModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700"
          >
            <Plus size={18} />
            Add Record
          </button>
        </div>

        <div className={`mb-8 flex items-center gap-3 rounded-2xl border ${borderSoft} px-4 py-3 ${panelBg} shadow-sm`}>
          <Search size={18} className={textMuted} />
          <input
            type="text"
            value={recordSearch}
            onChange={(e) => setRecordSearch(e.target.value)}
            placeholder="Search by patient name"
            className={`w-full bg-transparent text-sm outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-700 placeholder:text-slate-400"}`}
          />
        </div>

        {filteredRecords.length === 0 ? (
          <div className={`rounded-[24px] border ${borderSoft} ${panelBg} p-12 text-center shadow-sm`}>
            <p className={`text-[18px] ${textMuted}`}>
              {records.length === 0
                ? selectedPatient
                  ? "No records found for this patient."
                  : "No medical records found yet."
                : "No medical records match that patient name."}
            </p>
            <p className={`mt-3 text-sm ${textSoft}`}>
              {records.length === 0
                ? selectedPatient
                  ? "Try another patient or clear the filter to view all records."
                  : "Add a new record to begin tracking patient history, or verify that patients are assigned to this doctor."
                : "Try another name or clear the search."}
            </p>
          </div>
        ) : (
          <div className={`rounded-[24px] border ${borderSoft} ${panelBg} shadow-sm`}>
            <div className={`grid grid-cols-[3fr_1fr_1fr_1fr] gap-4 border-b ${borderSoft} px-5 py-4 text-sm font-semibold ${textMuted}`}>
              <div>Diagnosis</div>
              <div>Date</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {filteredRecords.map((record, index) => (
              <div
                key={record.id}
                className={`grid grid-cols-[3fr_1fr_1fr_1fr] items-center gap-4 px-5 py-5 ${
                  index !== filteredRecords.length - 1 ? `border-b ${borderSoft}` : ""
                } ${hoverRow}`}
              >
                <div>
                  <p className="text-[17px] font-medium">{record.diagnosis || record.title}</p>
                  <p className={`text-sm ${textMuted}`}>{record.patientName || record.patient_name || "Unknown Patient"}</p>
                </div>

                <div className="text-[17px]">
                  {record.record_date
                    ? new Date(record.record_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "N/A"}
                </div>

                <div>
                  <select
                    value={record.status || "Active"}
                    onChange={(e) => handleUpdateRecordStatus(record.id, e.target.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border-none outline-none ${
                      record.status === "Completed"
                        ? darkMode
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-green-100 text-green-700"
                        : darkMode
                        ? "bg-blue-500/15 text-blue-300"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="relative flex items-center justify-end gap-3">
                  <button onClick={() => setSelectedRecord(record)} className="flex items-center gap-2 text-blue-600 hover:opacity-80">
                    <Eye size={18} />
                    View
                  </button>
                  <button
                    onClick={() => setOpenActionsId(openActionsId === record.id ? null : record.id)}
                    className={`rounded-full p-2 ${textMuted} ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                    aria-label="Open record actions"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openActionsId === record.id && (
                    <div className={`absolute right-0 top-full z-30 mt-1 min-w-[160px] rounded-2xl border ${borderSoft} ${panelBg} shadow-xl`}>
                      <button
                        onClick={() => {
                          handleDeleteRecord(record.id);
                          setOpenActionsId(null);
                        }}
                        className={`flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm text-red-600 ${
                          darkMode ? "hover:bg-red-950" : "hover:bg-red-50"
                        }`}
                      >
                        <Trash2 size={16} />
                        Delete record
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddRecordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
            <div className={`w-full max-w-md rounded-2xl border ${borderSoft} ${panelBg} p-6 shadow-xl`}>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-[20px] font-bold">Add Medical Record</h3>
                <button onClick={() => setShowAddRecordModal(false)} className={`${textMuted} hover:text-slate-600`}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddMedicalRecord} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Patient</label>
                  <select
                    value={recordForm.patientId}
                    onChange={(e) => setRecordForm({ ...recordForm, patientId: e.target.value })}
                    className={inputClasses}
                    required
                  >
                    <option value="">Select patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Diagnosis</label>
                  <textarea
                    value={recordForm.diagnosis}
                    onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                    className={`${inputClasses} resize-none`}
                    rows="3"
                    placeholder="Enter diagnosis..."
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Treatment</label>
                  <textarea
                    value={recordForm.treatment}
                    onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
                    className={`${inputClasses} resize-none`}
                    rows="3"
                    placeholder="Enter treatment plan..."
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Notes (Optional)</label>
                  <textarea
                    value={recordForm.notes}
                    onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                    className={`${inputClasses} resize-none`}
                    rows="2"
                    placeholder="Additional notes..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Status</label>
                  <select
                    value={recordForm.status}
                    onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value })}
                    className={inputClasses}
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddRecordModal(false)} className={`flex-1 ${secondaryButtonClasses}`}>
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 rounded-lg bg-teal-600 py-3 text-white hover:bg-teal-700">
                    Add Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div className={`w-full max-w-2xl rounded-2xl border ${borderSoft} ${panelBg} shadow-xl flex flex-col max-h-[90vh]`}>
              <div className={`flex flex-shrink-0 items-center justify-between border-b ${borderSoft} px-8 py-6`}>
                <h3 className="text-[22px] font-bold">Record Details</h3>
                <button onClick={() => setSelectedRecord(null)} className={`text-2xl ${textMuted} hover:text-slate-400`}>
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* Medical Record Information */}
                <div>
                  <h4 className={`text-[16px] font-bold mb-4 ${textMuted}`}>Medical Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${textMuted}`}>Diagnosis</label>
                      <p className="text-lg font-medium mt-1">{selectedRecord.diagnosis || selectedRecord.title}</p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${textMuted}`}>Treatment</label>
                      <p className="text-base mt-1">{selectedRecord.treatment}</p>
                    </div>

                    {selectedRecord.notes && (
                      <div>
                        <label className={`text-xs font-semibold uppercase ${textMuted}`}>Notes</label>
                        <p className="text-base mt-1">{selectedRecord.notes}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`text-xs font-semibold uppercase ${textMuted}`}>Record Date</label>
                        <p className="text-base font-medium mt-1">
                          {selectedRecord.record_date
                            ? new Date(selectedRecord.record_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <label className={`text-xs font-semibold uppercase ${textMuted}`}>Doctor</label>
                        <p className="text-base font-medium mt-1">{selectedRecord.doctorName || loggedInUser?.name || 'Unknown Doctor'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Personal Information */}
                <div className={`border-t ${borderSoft} pt-6`}>
                  <h4 className={`text-[16px] font-bold mb-4 ${textMuted}`}>Patient Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${textMuted}`}>Full Name</label>
                      <p className="text-base font-medium mt-1">{selectedRecord.patientName || selectedRecord.patient_name || "Unknown Patient"}</p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${textMuted}`}>Email</label>
                      <p className="text-base mt-1">{selectedRecord.patient_email || "-"}</p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${textMuted}`}>Phone</label>
                      <p className="text-base mt-1">{selectedRecord.patient_phone || "-"}</p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${textMuted}`}>Age</label>
                      <p className="text-base mt-1">{selectedRecord.patient_age || "-"}</p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${textMuted}`}>Gender</label>
                      <p className="text-base mt-1">{selectedRecord.patient_gender || "-"}</p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${textMuted}`}>Blood Group</label>
                      <p className="text-base mt-1">{selectedRecord.patient_blood_group || "-"}</p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${textMuted}`}>Date of Birth</label>
                      <p className="text-base mt-1">
                        {selectedRecord.patient_dob
                          ? new Date(selectedRecord.patient_dob).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${textMuted}`}>Emergency Contact</label>
                      <p className="text-base mt-1">{selectedRecord.patient_emergency_contact || "-"}</p>
                    </div>

                    {selectedRecord.patient_address && (
                      <div className="md:col-span-2">
                        <label className={`text-xs font-semibold uppercase ${textMuted}`}>Address</label>
                        <p className="text-base mt-1">{selectedRecord.patient_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPrescriptionPage = () => (
    <div className="p-9">
      {(() => {
        const normalizedPrescriptionSearch = prescriptionSearch.trim().toLowerCase();
        const filteredPrescriptions = prescriptions.filter((prescription) =>
          !normalizedPrescriptionSearch ||
          (prescription.patient_name || "Unknown Patient")
            .toLowerCase()
            .includes(normalizedPrescriptionSearch)
        );

        return (
          <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-[28px] font-bold">Prescriptions</h2>
          <p className={`mt-2 text-[18px] ${textMuted}`}>Create and manage patient prescriptions.</p>
        </div>

        <button
          onClick={() => setShowAddPrescriptionModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700"
        >
          <Plus size={18} />
          Add Prescription
        </button>
      </div>

      <div className={`mb-8 flex items-center gap-3 rounded-2xl border ${borderSoft} px-4 py-3 ${panelBg} shadow-sm`}>
        <Search size={18} className={textMuted} />
        <input
          type="text"
          value={prescriptionSearch}
          onChange={(e) => setPrescriptionSearch(e.target.value)}
          placeholder="Search by patient name"
          className={`w-full bg-transparent text-sm outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-700 placeholder:text-slate-400"}`}
        />
      </div>

      {filteredPrescriptions.length === 0 ? (
        <div className={`rounded-[24px] border ${borderSoft} ${panelBg} p-12 text-center shadow-sm`}>
          <p className={`text-[18px] ${textMuted}`}>
            {prescriptions.length === 0 ? "No prescriptions found yet." : "No prescriptions match that patient name."}
          </p>
          <p className={`mt-3 text-sm ${textSoft}`}>
            {prescriptions.length === 0 ? "Create a new prescription." : "Try another name or clear the search."}
          </p>
        </div>
      ) : (
        <div className={`rounded-[24px] border ${borderSoft} ${panelBg} shadow-sm`}>
          <div className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 border-b ${borderSoft} px-5 py-4 text-sm font-semibold ${textMuted}`}>
            <div>Patient</div>
            <div>Medication</div>
            <div>Dosage</div>
            <div>Date</div>
            <div className="text-right">Actions</div>
          </div>

          {filteredPrescriptions.map((prescription, index) => (
            <div
              key={prescription.id}
              className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] items-center gap-4 px-5 py-5 ${
                index !== filteredPrescriptions.length - 1 ? `border-b ${borderSoft}` : ""
              } ${hoverRow}`}
            >
              <div>
                <p className="text-[17px] font-medium">{prescription.patient_name || "Unknown Patient"}</p>
                <p className={`text-sm ${textMuted}`}>{prescription.frequency || "No frequency set"}</p>
              </div>

              <div>
                <p className="text-[17px]">{prescription.medication}</p>
                <p className={`text-sm ${textMuted}`}>{prescription.duration || "No duration set"}</p>
              </div>

              <div className="text-[17px]">{prescription.dosage}</div>

              <div className="text-[17px]">
                {prescription.prescribed_date
                  ? new Date(prescription.prescribed_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A"}
              </div>

              <div className="relative flex items-center justify-end gap-3">
                <button onClick={() => setSelectedPrescription(prescription)} className="flex items-center gap-2 text-blue-600 hover:opacity-80">
                  <Eye size={18} />
                  View
                </button>
                <button
                  onClick={() => setOpenActionsId(openActionsId === prescription.id ? null : prescription.id)}
                  className={`rounded-full p-2 ${textMuted} ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                  aria-label="Open prescription actions"
                >
                  <MoreVertical size={18} />
                </button>

                {openActionsId === prescription.id && (
                  <div className={`absolute right-0 top-full z-30 mt-1 min-w-[160px] rounded-2xl border ${borderSoft} ${panelBg} shadow-xl`}>
                    <button
                      onClick={() => handleOpenEditPrescription(prescription)}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm ${textSoft} ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                    >
                      <Pencil size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handlePrintPrescription(prescription);
                        setOpenActionsId(null);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm ${textSoft} ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                    >
                      <Printer size={16} />
                      Print
                    </button>
                    <button
                      onClick={() => {
                        handleDeletePrescription(prescription.id);
                        setOpenActionsId(null);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 rounded-b-2xl ${darkMode ? "hover:bg-red-950" : "hover:bg-red-50"}`}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
          </>
        );
      })()}

      {showAddPrescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-3xl rounded-2xl border ${borderSoft} ${panelBg} p-6 shadow-xl`}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[20px] font-bold">Add Prescription</h3>
              <button onClick={() => setShowAddPrescriptionModal(false)} className={`${textMuted} hover:text-slate-600`}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPrescription} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Patient</label>
                  <select
                    value={prescriptionForm.patientId}
                    onChange={(e) => {
                      setPrescriptionForm({
                        ...prescriptionForm,
                        patientId: e.target.value,
                        medicalRecordId: "",
                      });
                    }}
                    className={inputClasses}
                    required
                  >
                    <option value="">Select patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Medical Record</label>
                  <select
                    value={prescriptionForm.medicalRecordId}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicalRecordId: e.target.value })}
                    className={inputClasses}
                    required
                  >
                    <option value="">Select medical record</option>
                    {records
                      .filter((record) => String(record.patient_id || record.patientId) === String(prescriptionForm.patientId))
                      .map((record) => (
                        <option key={record.id} value={record.id}>
                          {record.record_date
                            ? new Date(record.record_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : "No date"} - {record.diagnosis || record.title || "Medical Record"}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Medication</label>
                  <input
                    type="text"
                    value={prescriptionForm.medication}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })}
                    className={inputClasses}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Dosage</label>
                  <div className="grid grid-cols-[1fr_140px] gap-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={prescriptionForm.dosageAmount}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosageAmount: e.target.value })}
                      className={inputClasses}
                      placeholder="Amount"
                      required
                    />
                    <select
                      value={prescriptionForm.dosageUnit}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosageUnit: e.target.value })}
                      className={inputClasses}
                      required
                    >
                      <option value="mg">mg</option>
                      <option value="mcg">mcg</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="tablet">tablet</option>
                      <option value="capsule">capsule</option>
                      <option value="drops">drops</option>
                      <option value="units">units</option>
                      <option value="IU">IU</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Frequency</label>
                  <select
                    value={prescriptionForm.frequency}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })}
                    className={inputClasses}
                    required
                  >
                    <option value="">Select frequency</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="Every 4 hours">Every 4 hours</option>
                    <option value="Every 6 hours">Every 6 hours</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="Every 12 hours">Every 12 hours</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Duration</label>
                  <select
                    value={prescriptionForm.duration}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })}
                    className={inputClasses}
                    required
                  >
                    <option value="">Select duration</option>
                    <option value="3 days">3 days</option>
                    <option value="5 days">5 days</option>
                    <option value="7 days">7 days</option>
                    <option value="10 days">10 days</option>
                    <option value="14 days">14 days</option>
                    <option value="21 days">21 days</option>
                    <option value="1 month">1 month</option>
                    <option value="2 months">2 months</option>
                    <option value="3 months">3 months</option>
                    <option value="6 months">6 months</option>
                    <option value="1 year">1 year</option>
                    <option value="Ongoing">Ongoing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Instructions</label>
                <textarea
                  value={prescriptionForm.instructions}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                  className={`${inputClasses} resize-none`}
                  rows="4"
                  placeholder="Enter instructions..."
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddPrescriptionModal(false)}
                  className={`w-full sm:w-[180px] ${secondaryButtonClasses}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-teal-600 py-3 text-white hover:bg-teal-700 sm:w-[220px]"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditPrescriptionModal && editingPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-3xl rounded-2xl border ${borderSoft} ${panelBg} p-6 shadow-xl`}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-[20px] font-bold">Edit Prescription</h3>
                <p className={`mt-1 text-sm ${textMuted}`}>
                  Update missing details for {editingPrescription.patient_name || "this patient"}.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditPrescriptionModal(false);
                  setEditingPrescription(null);
                }}
                className={`${textMuted} hover:text-slate-600`}
              >
                X
              </button>
            </div>

            <form onSubmit={handleUpdatePrescription} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Medication</label>
                  <input
                    type="text"
                    value={editPrescriptionForm.medication}
                    onChange={(e) => setEditPrescriptionForm({ ...editPrescriptionForm, medication: e.target.value })}
                    className={inputClasses}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Dosage</label>
                  <div className="grid grid-cols-[1fr_140px] gap-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={editPrescriptionForm.dosageAmount}
                      onChange={(e) => setEditPrescriptionForm({ ...editPrescriptionForm, dosageAmount: e.target.value })}
                      className={inputClasses}
                      placeholder="Amount"
                      required
                    />
                    <select
                      value={editPrescriptionForm.dosageUnit}
                      onChange={(e) => setEditPrescriptionForm({ ...editPrescriptionForm, dosageUnit: e.target.value })}
                      className={inputClasses}
                      required
                    >
                      <option value="mg">mg</option>
                      <option value="mcg">mcg</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="tablet">tablet</option>
                      <option value="capsule">capsule</option>
                      <option value="drops">drops</option>
                      <option value="units">units</option>
                      <option value="IU">IU</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Frequency</label>
                  <select
                    value={editPrescriptionForm.frequency}
                    onChange={(e) => setEditPrescriptionForm({ ...editPrescriptionForm, frequency: e.target.value })}
                    className={inputClasses}
                    required
                  >
                    <option value="">Select frequency</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="Every 4 hours">Every 4 hours</option>
                    <option value="Every 6 hours">Every 6 hours</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="Every 12 hours">Every 12 hours</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Duration</label>
                  <select
                    value={editPrescriptionForm.duration}
                    onChange={(e) => setEditPrescriptionForm({ ...editPrescriptionForm, duration: e.target.value })}
                    className={inputClasses}
                    required
                  >
                    <option value="">Select duration</option>
                    <option value="3 days">3 days</option>
                    <option value="5 days">5 days</option>
                    <option value="7 days">7 days</option>
                    <option value="10 days">10 days</option>
                    <option value="14 days">14 days</option>
                    <option value="21 days">21 days</option>
                    <option value="1 month">1 month</option>
                    <option value="2 months">2 months</option>
                    <option value="3 months">3 months</option>
                    <option value="6 months">6 months</option>
                    <option value="1 year">1 year</option>
                    <option value="Ongoing">Ongoing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Instructions</label>
                <textarea
                  value={editPrescriptionForm.instructions}
                  onChange={(e) => setEditPrescriptionForm({ ...editPrescriptionForm, instructions: e.target.value })}
                  className={`${inputClasses} resize-none`}
                  rows="4"
                  placeholder="Enter instructions..."
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPrescriptionModal(false);
                    setEditingPrescription(null);
                  }}
                  className={`w-full sm:w-[180px] ${secondaryButtonClasses}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-teal-600 py-3 text-white hover:bg-teal-700 sm:w-[220px]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border ${borderSoft} ${panelBg} p-6 shadow-xl`}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[20px] font-bold">Prescription Details</h3>
              <button onClick={() => setSelectedPrescription(null)} className={`${textMuted} hover:text-slate-600`}>
                ✕
              </button>
            </div>
            <div className="mb-5 flex justify-end">
              <button
                onClick={() => handleOpenEditPrescription(selectedPrescription)}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                <Pencil size={16} />
                Edit Prescription
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className={`text-sm font-semibold ${textMuted}`}>Patient</p>
                <p className="text-lg font-medium">{selectedPrescription.patient_name}</p>
              </div>
              <div>
                <p className={`text-sm font-semibold ${textMuted}`}>Medication</p>
                <p className="text-lg">{selectedPrescription.medication}</p>
              </div>
              <div>
                <p className={`text-sm font-semibold ${textMuted}`}>Dosage</p>
                <p className="text-lg">{selectedPrescription.dosage}</p>
              </div>
              <div>
                <p className={`text-sm font-semibold ${textMuted}`}>Frequency</p>
                <p className="text-lg">{selectedPrescription.frequency || "N/A"}</p>
              </div>
              <div>
                <p className={`text-sm font-semibold ${textMuted}`}>Duration</p>
                <p className="text-lg">{selectedPrescription.duration || "N/A"}</p>
              </div>
              {selectedPrescription.instructions && (
                <div>
                  <p className={`text-sm font-semibold ${textMuted}`}>Instructions</p>
                  <p className="text-lg">{selectedPrescription.instructions}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm font-semibold ${textMuted}`}>Date</p>
                  <p className="text-lg">
                    {selectedPrescription.prescribed_date
                      ? new Date(selectedPrescription.prescribed_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${textMuted}`}>Medical Record</p>
                  <p className="text-lg">
                    {selectedPrescription.medical_record_diagnosis ||
                      selectedPrescription.medical_record_title ||
                      "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProfilePage = () => (
    <div className="p-9">
      <div className="mb-8">
        <h2 className="text-[28px] font-bold">My Profile</h2>
        <p className={`mt-2 text-[18px] ${textMuted}`}>Manage your professional information.</p>
      </div>

      <div className={`mb-8 rounded-2xl border ${borderSoft} ${panelBg} p-8 shadow-sm`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-6">
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-teal-500 text-[40px] font-bold text-white">
              {getInitials(profileForm.fullName)}
            </div>

            <div>
              <h3 className="text-[32px] font-bold">{profileForm.fullName}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p
                  className={
                    darkMode
                      ? "inline-block rounded-full bg-teal-500/15 px-4 py-2 text-sm font-medium text-teal-300"
                      : "inline-block rounded-full bg-teal-100 px-4 py-2 text-sm font-medium text-teal-700"
                  }
                >
                  {profileForm.specialization}
                </p>
                {profileForm.department && (
                  <p
                    className={
                      darkMode
                        ? "inline-block rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-300"
                        : "inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700"
                    }
                  >
                    {profileForm.department}
                  </p>
                )}
              </div>

              <div className={`mt-6 flex flex-wrap items-center gap-6 text-[16px] ${textSoft}`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{profileForm.yearsExperience}</span>
                  <span>Years</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border ${borderSoft} ${panelBg} p-8 shadow-sm`}>
        <h3 className="mb-8 text-[24px] font-bold">Professional Information</h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Full Name</label>
            <div className={`flex items-center gap-3 rounded-lg border ${borderSoft} px-4 py-3 ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <Users size={18} className={textMuted} />
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className={`flex-1 bg-transparent outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-700 placeholder-slate-400"}`}
              />
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Email Address</label>
            <div className={`flex items-center gap-3 rounded-lg border ${borderSoft} px-4 py-3 ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <Mail size={18} className={textMuted} />
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className={`flex-1 bg-transparent outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-700 placeholder-slate-400"}`}
              />
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Phone Number</label>
            <div className={`flex items-center gap-3 rounded-lg border ${borderSoft} px-4 py-3 ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <Phone size={18} className={textMuted} />
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className={`flex-1 bg-transparent outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-700 placeholder-slate-400"}`}
              />
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Specialization</label>
            <div className={`flex items-center gap-3 rounded-lg border ${borderSoft} px-4 py-3 ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <Pencil size={18} className={textMuted} />
              <input
                type="text"
                value={profileForm.specialization}
                onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                className={`flex-1 bg-transparent outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-700 placeholder-slate-400"}`}
              />
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Department</label>
            <select
              value={profileForm.department}
              onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
              className={inputClasses}
            >
              <option value="">Select Department</option>
              <option>Cardiology</option>
              <option>Neurology</option>
              <option>Orthopedics</option>
              <option>Pediatrics</option>
              <option>Dermatology</option>
              <option>General Medicine</option>
              <option>Surgery</option>
              <option>Internal Medicine</option>
              <option>Pathology</option>
            </select>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Years of Experience</label>
            <input
              type="number"
              value={profileForm.yearsExperience}
              onChange={(e) => setProfileForm({ ...profileForm, yearsExperience: e.target.value })}
              className={inputClasses}
            />
          </div>
        </div>

        <div className="mt-6">
          <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Bio</label>
          <textarea
            value={profileForm.bio}
            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            placeholder="Tell patients about yourself..."
            className={`${inputClasses} resize-none`}
            rows="5"
          />
        </div>

        {profileSaveMessage && (
          <div
            className={`mt-6 rounded-lg px-6 py-4 font-medium ${
              profileSaveMessage.type === "success"
                ? darkMode
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-emerald-100 text-emerald-700"
                : darkMode
                ? "bg-red-500/15 text-red-300"
                : "bg-red-100 text-red-700"
            }`}
          >
            {profileSaveMessage.text}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className={`flex items-center gap-2 rounded-lg px-8 py-3 font-semibold text-white transition ${
              savingProfile
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {savingProfile ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>


    </div>
  );

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-700"}`}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-teal-600"></div>
          <p className={`rounded-2xl border px-8 py-6 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            Loading doctor dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-700"}`}>
        <div className="max-w-md text-center">
          <div className="mb-4 text-red-500">
            <X size={48} className="mx-auto" />
          </div>
          <p className={`rounded-2xl px-8 py-6 shadow-sm ${darkMode ? "border border-red-900 bg-red-950/40 text-red-300" : "border border-red-200 bg-red-50 text-red-700"}`}>
            Error loading dashboard: {error}
          </p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-teal-600 px-6 py-2 text-white hover:bg-teal-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!loggedInUser) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-700"}`}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-teal-600"></div>
          <p className={`rounded-2xl border px-8 py-6 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            Initializing your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={appClasses}>
      <div className="flex min-h-screen">
        <aside className={sidebarClasses}>
          <div>
            <div className={`flex h-[72px] items-center ${sidebarCollapsed ? "justify-center" : "justify-between"} transition-all duration-300 gap-3 border-b px-6 ${borderSoft}`}>
              <div className={`flex items-center gap-3 transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
                <Activity className="text-teal-600 flex-shrink-0" size={28} />
                <h1 className="text-[30px] font-semibold tracking-tight whitespace-nowrap">MediCare</h1>
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`p-2 rounded-lg transition-all flex-shrink-0 ${darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}
              >
                <ChevronLeft size={20} style={{ transform: sidebarCollapsed ? "scaleX(-1)" : "scaleX(1)", transition: "transform 300ms ease-in-out" }} />
              </button>
            </div>

            <nav className="px-3 py-6 space-y-3">
              <button
                onClick={() => setActivePage("dashboard")}
                title="Dashboard"
                className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                  activePage === "dashboard" ? activeNav : inactiveNav
                }`}
              >
                <LayoutDashboard size={22} />
                <span className={`text-[18px] font-medium transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>Dashboard</span>
              </button>

              <button
                onClick={() => setActivePage("patients")}
                title="My Patients"
                className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                  activePage === "patients" ? activeNav : inactiveNav
                }`}
              >
                <Users size={22} />
                <span className={`text-[18px] transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>My Patients</span>
              </button>

              <button
                onClick={() => setActivePage("appointments")}
                title="Appointments"
                className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                  activePage === "appointments" ? activeNav : inactiveNav
                }`}
              >
                <CalendarDays size={22} />
                <span className={`text-[18px] transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>Appointments</span>
              </button>

              <button
                onClick={() => setActivePage("prescriptions")}
                title="Prescriptions"
                className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                  activePage === "prescriptions" ? activeNav : inactiveNav
                }`}
              >
                <ClipboardList size={22} />
                <span className={`text-[18px] transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>Prescriptions</span>
              </button>

              <button
                onClick={() => setActivePage("records")}
                title="Medical History"
                className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                  activePage === "records" ? activeNav : inactiveNav
                }`}
              >
                <FileText size={22} />
                <span className={`text-[18px] transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>Medical History</span>
              </button>

              <button
                onClick={() => setActivePage("settings")}
                title="Settings"
                className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                  activePage === "settings" ? activeNav : inactiveNav
                }`}
              >
                <Settings size={22} />
                <span className={`text-[18px] transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>Settings</span>
              </button>
            </nav>
          </div>

          <div className={`border-t p-4 ${borderSoft}`}>
            <button
              onClick={onLogout}
              title="Logout"
              className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                darkMode
                  ? "text-red-300 hover:bg-red-500/10"
                  : "text-red-600 hover:bg-red-50"
              }`}
            >
              <LogOut size={22} />
              <span className={`text-[18px] transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <div className={topbarClasses}>
            <div className="flex items-center gap-2 md:gap-6 flex-1">
            </div>

            <div className="flex items-center gap-2 md:gap-6">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                  darkMode
                    ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {darkMode ? <Sun size={24} /> : <Moon size={24} />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                    darkMode
                      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    className={`absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-2xl border shadow-xl ${
                      darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className={`flex items-center justify-between border-b px-5 py-4 ${borderSoft}`}>
                      <h3 className="text-lg font-semibold">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllNotificationsAsRead()}
                          className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className={textMuted}>
                        <X size={18} />
                      </button>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto">
                      {notificationsList && notificationsList.length > 0 ? (
                        notificationsList.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => !item.is_read && markNotificationAsRead(item.id)}
                            className={`border-b px-5 py-4 cursor-pointer transition-colors ${borderSoft} ${
                              item.unread
                                ? darkMode
                                  ? "bg-blue-900/60 hover:bg-blue-800/60"
                                  : "bg-blue-50/60 hover:bg-blue-100/60"
                                : darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold">{item.title}</p>
                                <p className={`mt-1 text-sm ${textSoft}`}>{item.message}</p>
                                <p className={`mt-2 text-xs ${textMuted}`}>{new Date(item.created_at).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                {item.unread && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(item.id);
                                  }}
                                  className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}>
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={`px-5 py-8 text-center ${textMuted}`}>
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={`flex items-center gap-3 border-l pl-6 ${borderSoft} hidden md:flex`}>
                <div className="text-right">
                  <p className="text-sm font-semibold">Dr. {loggedInUser?.name || 'Doctor'}</p>
                  <p className={`text-xs ${textMuted}`}>Doctor</p>
                </div>
                <button className={darkMode ? "text-slate-300" : "text-slate-600"}>
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>
          </div>

          {activePage === "dashboard" && renderDashboardPage()}
          {activePage === "patients" && renderPatientsPage()}
          {activePage === "appointments" && renderAppointmentsPage()}
          {activePage === "prescriptions" && renderPrescriptionPage()}
          {activePage === "records" && renderMedicalRecordsPage()}
          {activePage === "settings" && renderProfilePage()}
        </main>
      </div>

      {showAppointmentDetailsModal && selectedAppointmentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-2xl rounded-2xl border ${borderSoft} ${panelBg} shadow-xl flex flex-col max-h-[90vh]`}>
            <div className={`flex flex-shrink-0 items-center justify-between border-b ${borderSoft} px-8 py-6`}>
              <h3 className="text-[22px] font-bold">Appointment Details</h3>
              <button 
                onClick={() => setShowAppointmentDetailsModal(false)} 
                className={`text-2xl ${textMuted} hover:text-slate-400 transition`}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {loadingAppointmentDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-teal-600"></div>
                    <p className={textMuted}>Loading appointment details...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Appointment Basic Information */}
                  <div>
                    <h4 className={`text-[18px] font-bold mb-6 ${textMuted}`}>Appointment Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`text-xs font-semibold uppercase ${textMuted}`}>Appointment Date</label>
                        <p className="text-base font-medium mt-2">
                          {selectedAppointmentDetails.date
                            ? new Date(selectedAppointmentDetails.date).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <label className={`text-xs font-semibold uppercase ${textMuted}`}>Time</label>
                        <p className="text-base font-medium mt-2">{selectedAppointmentDetails.time || "N/A"}</p>
                      </div>

                      <div>
                        <label className={`text-xs font-semibold uppercase ${textMuted}`}>Appointment Type</label>
                        <p className="text-base font-medium mt-2">{selectedAppointmentDetails.type || "Consultation"}</p>
                      </div>

                      <div>
                        <label className={`text-xs font-semibold uppercase ${textMuted}`}>Status</label>
                        <div className="mt-2">
                          <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(selectedAppointmentDetails.status || "Pending")}`}>
                            {selectedAppointmentDetails.status || "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Description */}
                  {selectedAppointmentDetails.notes && (
                    <div className={`border-t ${borderSoft} pt-6`}>
                      <label className={`text-xs font-semibold uppercase ${textMuted}`}>Notes</label>
                      <p className="text-base mt-3">{selectedAppointmentDetails.notes}</p>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div className={`border-t ${borderSoft} pt-6`}>
                    <h4 className={`text-[16px] font-bold mb-4 ${textMuted}`}>Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`text-xs font-semibold uppercase ${textMuted}`}>Created Date</label>
                        <p className="text-base font-medium mt-2">
                          {selectedAppointmentDetails.created_at
                            ? new Date(selectedAppointmentDetails.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className={`text-xs font-semibold uppercase ${textMuted}`}>Appointment ID</label>
                        <p className="text-sm font-mono mt-2">{selectedAppointmentDetails.id || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={`flex flex-shrink-0 items-center justify-end border-t ${borderSoft} gap-3 px-8 py-6`}>
              <button
                onClick={() => setShowAppointmentDetailsModal(false)}
                className={`rounded-lg border ${borderSoft} px-6 py-2 font-medium transition ${
                  darkMode ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
