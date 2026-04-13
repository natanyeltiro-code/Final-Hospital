import { useEffect, useRef, useState } from "react";
import api, { setAuthToken } from "./api";
import {
  Mail,
  Lock,
  Activity,
  ArrowRight,
  User,
  LayoutDashboard,
  CalendarDays,
  FileText,
  UserCircle,
  LogOut,
  Bell,
  Moon,
  Clock3,
  ClipboardList,
  CalendarPlus,
  Search,
  Stethoscope,
  ChevronDown,
  ChevronLeft,
  Users,
  UserCog,
  CalendarRange,
  FileHeart,
  BarChart3,
  Settings,
  Filter,
  Pencil,
  Trash2,
  MoreVertical,
  Eye,
  Phone,
  Info,
} from "lucide-react";
import DoctorDashboard from "./DoctorDashboard";

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken") || "");
  const [activePage, setActivePage] = useState("dashboard");
  const [adminPage, setAdminPage] = useState("dashboard");
  const [patientSidebarCollapsed, setPatientSidebarCollapsed] = useState(true);
  const [adminSidebarCollapsed, setAdminSidebarCollapsed] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const notificationsRef = useRef(null);
  const detailsRef = useRef(null);

  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [adminPatients, setAdminPatients] = useState([]);
  const [adminPatientsPage, setAdminPatientsPage] = useState(1);
  const [patientSearchFilter, setPatientSearchFilter] = useState("");
  const [adminDoctorsPage, setAdminDoctorsPage] = useState(1);
  const [doctorSearchFilter, setDoctorSearchFilter] = useState("");
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [adminAppointments, setAdminAppointments] = useState([]);
  const [adminMedicalRecords, setAdminMedicalRecords] = useState([]);
  const [appointmentFilter, setAppointmentFilter] = useState("All");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [adminAppointmentsPage, setAdminAppointmentsPage] = useState(1);
  const [medicalRecordsSearch, setMedicalRecordsSearch] = useState("");
  const [expandedRecordId, setExpandedRecordId] = useState(null);
  const [adminStats, setAdminStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalMedicalRecords: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
  });
  const [demographicsPeriod, setDemographicsPeriod] = useState('This Year');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState(""); // "patient", "doctor", "appointment"
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "patient",
    specialty: "",
    age: "",
    gender: "",
    blood_group: "",
    condition: "",
    date_of_birth: "",
    address: "",
    emergency_contact: "",
    patientType: "registered",
    selectedPatientId: "",
    emergencyPatientName: "",
    emergencyPatientPhone: "",
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    doctorId: "",
    date: "",
    time: "",
    type: "Consultation",
  });
  const [forgotStep, setForgotStep] = useState("request");
  const [resetToken, setResetToken] = useState("");
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [selectedDetailType, setSelectedDetailType] = useState("");
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    bloodGroup: "",
    age: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    emergencyContact: "",
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [forgotData, setForgotData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Debug modal state
  useEffect(() => {
    console.log("Modal State Debug:", {
      showAppointmentDetails,
      selectedDetail: selectedDetail ? `ID ${selectedDetail.id}` : null,
      selectedDetailType,
    });
  }, [showAppointmentDetails, selectedDetail, selectedDetailType]);

  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    if (savedToken) {
      setToken(savedToken);
      setAuthToken(savedToken);
      fetchCurrentUser();
    }
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (showAppointmentDetails && detailsRef.current && !detailsRef.current.contains(event.target)) {
        setShowAppointmentDetails(false);
        setSelectedDetail(null);
        setSelectedDetailType("");
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowAppointmentDetails(false);
        setSelectedDetail(null);
        setSelectedDetailType("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showNotifications, showAppointmentDetails]);

  // Auto-refresh notifications every 15 seconds
  useEffect(() => {
    if (!loggedInUser || !loggedInUser.id) return;

    // Fetch notifications immediately
    fetchNotifications(loggedInUser.id);

    // Set up interval to refresh
    const interval = setInterval(() => {
      fetchNotifications(loggedInUser.id);
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [loggedInUser?.id]);

  useEffect(() => {
    if (loggedInUser && loggedInUser.role === "patient") {
      fetchPatientData();
    }
    if (loggedInUser && loggedInUser.role === "admin") {
      fetchAdminData();
    }
  }, [loggedInUser]);

  const fetchPatientData = async () => {
    try {
      const aptsRes = await api.get(`/appointments/${loggedInUser.id}`);
      setAppointments(aptsRes.data.appointments || []);

      const recordsRes = await api.get(`/medical-records/${loggedInUser.id}`);
      setMedicalRecords(recordsRes.data.records || []);

      const doctorsRes = await api.get("/doctors");
      setDoctors(doctorsRes.data.doctors || []);

      setProfileData({
        name: loggedInUser.name || "",
        email: loggedInUser.email || "",
        phone: loggedInUser.phone || "",
        bloodGroup: loggedInUser.bloodGroup || "",
        age: loggedInUser.age || "",
        gender: loggedInUser.gender || "",
        dateOfBirth: loggedInUser.dateOfBirth || "",
        address: loggedInUser.address || "",
        emergencyContact: loggedInUser.emergencyContact || "",
      });
    } catch (err) {
      console.error("Error fetching patient data:", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/me");
      setLoggedInUser(res.data.user);
      // Fetch notifications for this user
      if (res.data.user && res.data.user.id) {
        fetchNotifications(res.data.user.id);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
      setToken("");
      setAuthToken("");
    }
  };

  const fetchNotifications = async (userId) => {
    try {
      setLoadingNotifications(true);
      const res = await api.get(`/notifications/${userId}?limit=10`);
      setNotifications(res.data.notifications || []);
      
      // Calculate unread count
      const unread = res.data.notifications?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
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
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Recalculate unread count
      const unread = notifications.filter(n => n.id !== notificationId && !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const markAllNotificationsAsRead = async (userId) => {
    try {
      await api.put(`/notifications/${userId}/mark-all-read`);
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const fetchNotificationPreferences = async (userId) => {
    try {
      const res = await api.get(`/notification-preferences/${userId}`);
      if (res.data.preferences) {
        setEmailNotifications(res.data.preferences.email_notifications !== false);
        setSmsNotifications(res.data.preferences.sms_notifications === true);
        setPushNotifications(res.data.preferences.push_notifications !== false);
      }
    } catch (err) {
      console.error("Error fetching notification preferences:", err);
      // Use defaults if error
      setEmailNotifications(true);
      setSmsNotifications(false);
      setPushNotifications(true);
    }
  };

  // Load notification preferences when admin opens settings page
  useEffect(() => {
    if (loggedInUser && loggedInUser.id && (adminPage === "settings" || adminPage === "profile")) {
      fetchNotificationPreferences(loggedInUser.id);
    }
  }, [adminPage, loggedInUser?.id]);

  const fetchAdminData = async () => {
    try {
      // Fetch stats
      const statsRes = await api.get("/admin/stats");
      setAdminStats(statsRes.data.stats || {});
      
      // Fetch patients
      const patientsRes = await api.get("/patients");
      setAdminPatients(patientsRes.data.patients || []);
      
      // Fetch doctors
      const doctorsRes = await api.get("/doctors");
      console.log("Doctors API Response:", doctorsRes.data.doctors);
      setDoctors(doctorsRes.data.doctors || []);
      
      // Fetch all medical records
      const recordsRes = await api.get("/admin/medical-records");
      setAdminMedicalRecords(recordsRes.data.records || []);
      
      // Fetch all appointments
      try {
        const appointmentsRes = await api.get("/admin/appointments");
        console.log("Appointments API Response:", appointmentsRes.data);
        setAdminAppointments(appointmentsRes.data.appointments || []);
      } catch (err) {
        console.warn("Couldn't fetch appointments:", err);
        setAdminAppointments([]);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    }
  };

  // Reset pagination when local search query changes
  useEffect(() => {
    setAdminPatientsPage(1);
    setAdminDoctorsPage(1);
    setAdminAppointmentsPage(1);
  }, [patientSearchFilter, doctorSearchFilter, appointmentSearch]);

  // Helper functions for date/time formatting
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "short", 
        day: "numeric" 
      });
    } catch (err) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
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

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!bookingData.doctorId || !bookingData.date || !bookingData.time) {
      setIsError(true);
      setMessage("❌ Please fill all appointment fields");
      return;
    }

    try {
      const res = await api.post("/appointments", {
        patientId: loggedInUser.id,
        doctorId: parseInt(bookingData.doctorId, 10),
        date: bookingData.date,
        time: bookingData.time,
        type: bookingData.type,
        status: "Pending",
      });
      
      // Notify the doctor about new appointment booking
      const doctorId = parseInt(bookingData.doctorId, 10);
      const patientName = loggedInUser?.name || "Patient";
      const doctor = doctors.find((d) => d.id === doctorId);
      
      if (doctor) {
        try {
          await api.post("/notifications", {
            userId: doctorId,
            type: "appointment_booked",
            title: "New Appointment Booking",
            message: `${patientName} has booked an appointment with you on ${bookingData.date} at ${bookingData.time}`,
            relatedId: res.data.appointmentId,
            relatedType: "appointment",
          });
        } catch (err) {
          console.error("Error sending booking notification to doctor:", err);
        }
      }
      
      setIsError(false);
      setMessage(res.data.message || "✅ Appointment booked successfully!");
      setShowBookingModal(false);
      setBookingData({ doctorId: "", date: "", time: "", type: "Consultation" });
      fetchPatientData();
      // Refresh notifications immediately after booking
      if (loggedInUser && loggedInUser.id) {
        fetchNotifications(loggedInUser.id);
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "❌ Failed to book appointment");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const res = await api.put(`/appointments/${appointmentId}`, { status: "Cancelled" });
      setIsError(false);
      setMessage(res.data.message || "✅ Appointment cancelled successfully!");
      fetchPatientData();
      // Refresh notifications after status change
      if (loggedInUser && loggedInUser.id) {
        fetchNotifications(loggedInUser.id);
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "❌ Failed to cancel appointment");
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();

    if (!loggedInUser || !loggedInUser.id) {
      setIsError(true);
      setMessage("❌ User not logged in properly");
      return;
    }

    const trimmedName = profileData.name?.trim() || "";
    const trimmedEmail = profileData.email?.trim() || "";
    const trimmedPhone = profileData.phone?.trim() || "";
    const trimmedBloodGroup = profileData.bloodGroup?.trim() || "";
    const trimmedAge = profileData.age ? Number(profileData.age) : null;
    const trimmedGender = profileData.gender?.trim() || "";
    const trimmedDateOfBirth = profileData.dateOfBirth || "";
    const trimmedAddress = profileData.address?.trim() || "";
    const trimmedEmergencyContact = profileData.emergencyContact?.trim() || "";

    if (!trimmedName || !trimmedEmail) {
      setIsError(true);
      setMessage("❌ Name and email are required.");
      return;
    }

    const updateData = {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      bloodGroup: trimmedBloodGroup,
      age: trimmedAge,
      gender: trimmedGender,
      dateOfBirth: trimmedDateOfBirth,
      address: trimmedAddress,
      emergencyContact: trimmedEmergencyContact,
    };

    try {
      const res = await api.put(`/users/${loggedInUser.id}`, updateData);
      setIsError(false);
      setMessage(res.data.message || "✅ Profile updated successfully!");
      setLoggedInUser({ ...loggedInUser, ...updateData });
      setEditingProfile(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err.response || err);
      setIsError(true);
      setMessage(err.response?.data?.message || "❌ Failed to update profile");
    }
  };

  const downloadMedicalRecord = (record) => {
    const content = `MEDICAL RECORD\n\nTitle: ${record.title}\nDiagnosis: ${record.diagnosis}\nTreatment: ${record.treatment}\nDate: ${record.record_date}\nStatus: ${record.status}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${record.title}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadAllRecords = () => {
    if (medicalRecords.length === 0) {
      alert("No medical records to download");
      return;
    }

    let content = "COMPLETE MEDICAL RECORDS\n";
    content += `Patient: ${loggedInUser.name}\n`;
    content += `Downloaded on: ${new Date().toLocaleDateString()}\n`;
    content += `Total Records: ${medicalRecords.length}\n`;
    content += "=" .repeat(60) + "\n\n";

    medicalRecords.forEach((record, index) => {
      content += `RECORD ${index + 1}\n`;
      content += `Title: ${record.title || "N/A"}\n`;
      content += `Diagnosis: ${record.diagnosis || "N/A"}\n`;
      content += `Treatment: ${record.treatment || "N/A"}\n`;
      content += `Doctor: Dr. ${doctors.find((doc) => doc.id === record.doctor_id)?.name || `ID ${record.doctor_id}`}\n`;
      content += `Date: ${record.record_date || "N/A"}\n`;
      content += `Status: ${record.status || "N/A"}\n`;
      content += "-".repeat(60) + "\n\n";
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medical-records-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getLastUpdatedDate = () => {
    if (medicalRecords.length === 0) return "N/A";
    const dates = medicalRecords
      .map((r) => new Date(r.record_date || ""))
      .filter((d) => !isNaN(d.getTime()));
    if (dates.length === 0) return "N/A";
    const mostRecentDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    return mostRecentDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const generateAdminReport = () => {
    const now = new Date();
    const reportDate = now.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    let report = "MEDICARE PORTAL - COMPREHENSIVE ADMIN REPORT\n";
    report += "=" .repeat(70) + "\n\n";
    report += `Generated on: ${reportDate}\n`;
    report += `Report Type: Healthcare System Operations Summary\n`;
    report += "\n" + "=" .repeat(70) + "\n";

    // 1. Executive Summary
    report += "\n1. EXECUTIVE SUMMARY\n";
    report += "-".repeat(70) + "\n";
    report += `Total Patients: ${adminPatients.length}\n`;
    report += `Total Doctors: ${doctors.length}\n`;
    report += `Total Appointments: ${adminAppointments.length}\n`;
    report += `Total Medical Records: ${medicalRecords.length}\n`;
    report += `Pending Appointments: ${adminAppointments.filter(a => a.status === 'Pending').length}\n`;
    report += `Completed Appointments: ${adminAppointments.filter(a => a.status === 'Completed').length}\n`;
    report += `Cancelled Appointments: ${adminAppointments.filter(a => a.status === 'Cancelled').length}\n`;

    // 2. Appointment Statistics
    report += "\n" + "=" .repeat(70) + "\n";
    report += "\n2. APPOINTMENT STATISTICS\n";
    report += "-".repeat(70) + "\n";
    const appointmentsByType = {};
    adminAppointments.forEach(apt => {
      const type = apt.type || "Consultation";
      appointmentsByType[type] = (appointmentsByType[type] || 0) + 1;
    });
    Object.entries(appointmentsByType).forEach(([type, count]) => {
      report += `${type}: ${count} appointments\n`;
    });

    // 3. Patient Demographics
    report += "\n" + "=" .repeat(70) + "\n";
    report += "\n3. PATIENT DEMOGRAPHICS\n";
    report += "-".repeat(70) + "\n";
    const conditionCounts = {};
    adminPatients.forEach(patient => {
      const condition = patient.condition || 'No Condition';
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    });
    const topConditions = Object.entries(conditionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    topConditions.forEach(([condition, count]) => {
      const percentage = ((count / adminPatients.length) * 100).toFixed(1);
      report += `${condition}: ${count} patients (${percentage}%)\n`;
    });

    // 4. Doctor Statistics
    report += "\n" + "=" .repeat(70) + "\n";
    report += "\n4. DOCTOR STATISTICS\n";
    report += "-".repeat(70) + "\n";
    doctors.forEach(doctor => {
      const appointmentCount = adminAppointments.filter(a => a.doctor_id === doctor.id).length;
      const avgRating = doctor.rating ? parseFloat(doctor.rating).toFixed(1) : "N/A";
      report += `Dr. ${doctor.name} (${doctor.specialty || "N/A"})\n`;
      report += `  - Department: ${doctor.department || "N/A"}\n`;
      report += `  - Rating: ${avgRating}/5\n`;
      report += `  - Experience: ${doctor.experience || "N/A"} years\n`;
      report += `  - Appointments: ${appointmentCount}\n\n`;
    });

    // 5. Recent Appointments
    report += "=" .repeat(70) + "\n";
    report += "\n5. RECENT APPOINTMENTS (Last 10)\n";
    report += "-".repeat(70) + "\n";
    const recentAppointments = adminAppointments.slice(-10).reverse();
    recentAppointments.forEach((apt, index) => {
      const patient = adminPatients.find(p => p.id === apt.patient_id);
      const doctor = doctors.find(d => d.id === apt.doctor_id);
      report += `\n${index + 1}. ${patient?.name || "Unknown Patient"} → Dr. ${doctor?.name || "Unknown Doctor"}\n`;
      report += `   Date: ${apt.date || "N/A"} | Time: ${apt.time || "N/A"}\n`;
      report += `   Type: ${apt.type || "Consultation"} | Status: ${apt.status}\n`;
    });

    // 6. Active Medical Records
    report += "\n" + "=" .repeat(70) + "\n";
    report += "\n6. ACTIVE MEDICAL CONDITIONS\n";
    report += "-".repeat(70) + "\n";
    const activeMedicalRecords = medicalRecords.filter(r => r.status === 'Active').slice(-10);
    activeMedicalRecords.forEach((record, index) => {
      const patient = adminPatients.find(p => p.id === record.patient_id);
      const doctor = doctors.find(d => d.id === record.doctor_id);
      report += `\n${index + 1}. ${record.title}\n`;
      report += `   Patient: ${patient?.name || "Unknown"}\n`;
      report += `   Doctor: Dr. ${doctor?.name || "Unknown"}\n`;
      report += `   Diagnosis: ${record.diagnosis || "N/A"}\n`;
      report += `   Treatment: ${record.treatment || "N/A"}\n`;
      report += `   Date: ${record.record_date || "N/A"}\n`;
    });

    // 7. System Summary
    report += "\n" + "=" .repeat(70) + "\n";
    report += "\n7. SYSTEM SUMMARY\n";
    report += "-".repeat(70) + "\n";
    report += `Report Generated: ${reportDate}\n`;
    report += `Total Healthcare Users: ${adminPatients.length + doctors.length}\n`;
    report += `System Health: Operational\n`;
    report += "\n" + "=" .repeat(70) + "\n";
    report += "END OF REPORT\n";

    // Download report
    const blob = new Blob([report], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleForgotChange = (e) => {
    setForgotData({ ...forgotData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    const { name, email, password } = registerData;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setIsError(true);
      setMessage("❌ Please fill in all registration fields.");
      return;
    }

    try {
      const res = await api.post("/register", { name: trimmedName, email: trimmedEmail, password: trimmedPassword });
      setIsError(false);
      setMessage(res.data.message || "✅ Registration successful!");
      setRegisterData({ name: "", email: "", password: "" });
      setIsLogin(true);
      setShowForgotPassword(false);
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setIsError(true);
      setMessage(backendMessage || `❌ Registration failed: ${err.message}`);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    const { email, password } = loginData;

    if (!email || !password) {
      setIsError(true);
      setMessage("❌ Please enter email and password.");
      return;
    }

    try {
      const res = await api.post("/login", { email, password });
      setAuthToken(res.data.token);
      setToken(res.data.token);
      setLoggedInUser(res.data.user);
      setActivePage("dashboard");
      setAdminPage("dashboard");
      setIsError(false);
      setMessage(res.data.message || "✅ Login successful!");
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "❌ Login failed");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    const { email, newPassword, confirmPassword } = forgotData;

    if (forgotStep === "request") {
      if (!email) {
        setIsError(true);
        setMessage("❌ Please enter your email.");
        return;
      }

      try {
        const res = await api.post("/forgot-password/request", { email });
        setIsError(false);
        setMessage(res.data.message || "✅ Password reset token generated.");
        if (res.data.resetToken) {
          setResetToken(res.data.resetToken);
        }
        setForgotStep("reset");
      } catch (err) {
        setIsError(true);
        setMessage(err.response?.data?.message || "❌ Failed to request reset");
      }
      return;
    }

    if (!email || !newPassword || !confirmPassword || !resetToken) {
      setIsError(true);
      setMessage("❌ Please fill in all reset fields and enter your token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage("❌ Passwords do not match.");
      return;
    }

    try {
      const res = await api.post("/forgot-password/reset", {
        token: resetToken,
        newPassword,
      });
      setIsError(false);
      setMessage(res.data.message || "✅ Password reset successfully.");
      setForgotData({ email: "", newPassword: "", confirmPassword: "" });
      setResetToken("");
      setShowForgotPassword(false);
      setIsLogin(true);
      setForgotStep("request");
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "❌ Failed to reset password");
    }
  };

  const handleDeleteUser = async (userId, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        await api.delete(`/users/${userId}`);
        setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
        fetchAdminData();
      } catch (err) {
        setMessage(`Error deleting ${type}`, true);
        setIsError(true);
      }
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        await api.delete(`/appointments/${appointmentId}`);
        setMessage("Appointment deleted successfully");
        fetchAdminData();
      } catch (err) {
        setMessage("Error deleting appointment", true);
        setIsError(true);
      }
    }
  };

  const handleDeleteMedicalRecord = async (recordId) => {
    if (window.confirm("Are you sure you want to delete this medical record?")) {
      try {
        await api.delete(`/medical-records/${recordId}`);
        setMessage("Medical record deleted successfully");
        fetchAdminData();
      } catch (err) {
        setMessage("Error deleting medical record", true);
        setIsError(true);
      }
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      // Get appointment details before updating
      const appointmentToUpdate = adminAppointments.find((apt) => apt.id === appointmentId);
      if (!appointmentToUpdate) {
        console.error("Appointment not found");
        return;
      }

      await api.put(`/appointments/${appointmentId}`, { status });
      
      // Send notification to patient if appointment is confirmed or cancelled
      const patientId = appointmentToUpdate.patient_id;
      const doctorName = `Dr. ${appointmentToUpdate.doctor_name || "Your Doctor"}`;
      const patient = adminPatients.find((p) => p.id === patientId);
      
      if (status === "Confirmed" && patientId && patient) {
        try {
          await api.post("/notifications", {
            userId: patientId,
            type: "appointment_confirmation",
            title: "Appointment Confirmed",
            message: `${doctorName} successfully confirmed your appointment booking`,
            relatedId: appointmentId,
            relatedType: "appointment",
          });
        } catch (err) {
          console.error("Error sending confirmation notification:", err);
        }
      } else if (status === "Cancelled" && patientId && patient) {
        try {
          await api.post("/notifications", {
            userId: patientId,
            type: "appointment_cancelled",
            title: "Appointment Cancelled",
            message: `${doctorName} cancelled your appointment booking`,
            relatedId: appointmentId,
            relatedType: "appointment",
          });
        } catch (err) {
          console.error("Error sending cancellation notification:", err);
        }
      }
      
      setMessage("Appointment status updated successfully");
      fetchAdminData();
    } catch (err) {
      setMessage("Error updating appointment status", true);
      setIsError(true);
    }
  };

  const handleBookAdminAppointment = async () => {
    // Validate required fields
    console.log("=== BOOKING APPOINTMENT ===");
    console.log("Booking data:", bookingData);
    console.log("New user data:", newUserData);
    console.log("Patient type:", newUserData.patientType);
    console.log("Selected patient ID:", newUserData.selectedPatientId);
    console.log("Emergency patient name:", newUserData.emergencyPatientName);
    console.log("Emergency patient phone:", newUserData.emergencyPatientPhone);
    
    // EXTRA SAFETY CHECKS
    console.log("🔍 SAFETY CHECK - bookingData values:");
    console.log("  doctorId:", bookingData.doctorId, "type:", typeof bookingData.doctorId, "truthy?", !!bookingData.doctorId);
    console.log("  date:", bookingData.date, "type:", typeof bookingData.date, "truthy?", !!bookingData.date);
    console.log("  time:", bookingData.time, "type:", typeof bookingData.time, "truthy?", !!bookingData.time);
    
    if (!bookingData.doctorId) {
      console.warn("❌ Doctor ID missing");
      setMessage("❌ Please select a doctor", true);
      setIsError(true);
      return;
    }
    
    if (!bookingData.date) {
      console.warn("❌ Date missing");
      setMessage("❌ Please select a date", true);
      setIsError(true);
      return;
    }
    
    if (!bookingData.time) {
      console.warn("❌ Time missing");
      setMessage("❌ Please select a time", true);
      setIsError(true);
      return;
    }

    if (newUserData.patientType === "registered" && !newUserData.selectedPatientId) {
      console.warn("Selected patient ID missing");
      setMessage("❌ Please select a patient", true);
      setIsError(true);
      return;
    }

    if (newUserData.patientType === "emergency" && (!newUserData.emergencyPatientName || !newUserData.emergencyPatientPhone)) {
      console.warn("Emergency patient details missing");
      setMessage("❌ Please enter emergency patient details (Name and Phone)", true);
      setIsError(true);
      return;
    }

    try {
      const patientId = newUserData.patientType === "registered" ? newUserData.selectedPatientId : null;
      const patientName = newUserData.patientType === "emergency" ? newUserData.emergencyPatientName : null;
      const patientPhone = newUserData.patientType === "emergency" ? newUserData.emergencyPatientPhone : null;

      const appointmentPayload = {
        patientId: patientId ? parseInt(patientId, 10) : null,
        emergencyPatientName: patientName,
        emergencyPatientPhone: patientPhone,
        doctorId: parseInt(bookingData.doctorId, 10),
        date: bookingData.date,
        time: bookingData.time,
        type: bookingData.type,
        status: "Pending",
      };

      console.log("Sending appointment payload:", appointmentPayload);

      const response = await api.post("/appointments", appointmentPayload);

      console.log("Appointment response:", response);
      
      // Send notification to doctor about new appointment
      const doctorId = parseInt(bookingData.doctorId, 10);
      const displayPatientName = newUserData.patientType === "emergency" ? newUserData.emergencyPatientName : (adminPatients.find((p) => p.id === parseInt(newUserData.selectedPatientId, 10))?.name || "Patient");
      const doctor = doctors.find((d) => d.id === doctorId);
      
      if (doctor) {
        try {
          await api.post("/notifications", {
            userId: doctorId,
            type: "appointment_booked",
            title: "New Appointment Booking",
            message: `${displayPatientName} has booked an appointment with you on ${bookingData.date} at ${bookingData.time}`,
            relatedId: response.data.appointmentId,
            relatedType: "appointment",
          });
        } catch (err) {
          console.error("Error sending booking notification to doctor:", err);
        }
      }
      
      // If registered patient, notify the patient as well
      if (newUserData.patientType === "registered" && newUserData.selectedPatientId) {
        const patientId = parseInt(newUserData.selectedPatientId, 10);
        const doctorName = doctor?.name || "Doctor";
        try {
          await api.post("/notifications", {
            userId: patientId,
            type: "appointment_booked",
            title: "Appointment Booked",
            message: `Your appointment with Dr. ${doctorName} has been booked for ${bookingData.date} at ${bookingData.time}`,
            relatedId: response.data.appointmentId,
            relatedType: "appointment",
          });
        } catch (err) {
          console.error("Error sending booking notification to patient:", err);
        }
      }
      
      setMessage("✅ Appointment booked successfully!");
      setIsError(false);
      setShowAddModal(false);
      setAddModalType("");
      setNewUserData({ name: "", email: "", password: "", phone: "", role: "patient", specialty: "", age: "", gender: "", blood_group: "", condition: "", date_of_birth: "", address: "", emergency_contact: "", patientType: "registered", selectedPatientId: "", emergencyPatientName: "", emergencyPatientPhone: "" });
      setBookingData({ doctorId: "", date: "", time: "", type: "Consultation" });
      fetchAdminData();
      // Refresh notifications immediately
      if (loggedInUser && loggedInUser.id) {
        fetchNotifications(loggedInUser.id);
      }
    } catch (err) {
      console.error("Error booking appointment:", err);
      const errorMsg = err.response?.data?.message || err.message || "❌ Failed to book appointment";
      console.error("Error message:", errorMsg);
      setIsError(true);
      setMessage(errorMsg);
    }
  };

  const handleAddUser = async () => {
    console.log("❌ handleAddUser called! addModalType=", addModalType);
    console.log("newUserData.name=", newUserData.name);
    console.log("newUserData.email=", newUserData.email);
    if (!newUserData.name || !newUserData.email) {
      console.warn("Name or email missing in handleAddUser");
      setMessage("Please fill all required fields", true);
      setIsError(true);
      return;
    }

    // For new users (not editing), password is required
    if (!editingDoctorId && !editingPatientId && !newUserData.password) {
      setMessage("Please fill all required fields", true);
      setIsError(true);
      return;
    }

    try {
      if (editingDoctorId) {
        // Update existing doctor
        await api.put(`/users/${editingDoctorId}`, {
          name: newUserData.name,
          email: newUserData.email,
          phone: newUserData.phone,
          specialty: newUserData.specialty,
        });
        setMessage("Doctor updated successfully");
        setEditingDoctorId(null);
      } else if (editingPatientId) {
        // Update existing patient
        await api.put(`/users/${editingPatientId}`, {
          name: newUserData.name,
          email: newUserData.email,
          phone: newUserData.phone,
          age: newUserData.age,
          gender: newUserData.gender,
          bloodGroup: newUserData.blood_group,
          condition: newUserData.condition,
        });
        setMessage("Patient updated successfully");
        setEditingPatientId(null);
      } else {
        // Create new user
        await api.post("/register", {
          name: newUserData.name,
          email: newUserData.email,
          password: newUserData.password,
          role: newUserData.role,
          specialty: addModalType === "doctor" ? newUserData.specialty : undefined,
        });
        setMessage(`${addModalType.charAt(0).toUpperCase() + addModalType.slice(1)} added successfully`);
      }
      setIsError(false);
      setShowAddModal(false);
      setNewUserData({ name: "", email: "", password: "", phone: "", role: "patient", specialty: "", age: "", gender: "", blood_group: "", condition: "", date_of_birth: "", address: "", emergency_contact: "" });
      fetchAdminData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error", true);
      setIsError(true);
    }
  };

  const handleLogout = () => {
    setAuthToken("");
    setToken("");
    setLoggedInUser(null);
    setActivePage("dashboard");
    setAdminPage("dashboard");
    setLoginData({ email: "", password: "" });
    setIsError(false);
    setMessage("✅ Logged out successfully.");
  };

  const renderPatientDashboard = () => {
    const upcomingAppointments = appointments.filter((appointment) => {
      // Filter for appointments that have a Pending status (not Completed or Cancelled)
      if (appointment.status === "Completed" || appointment.status === "Cancelled") {
        return false;
      }
      
      // Handle both date formats: ISO datetime string or date-only string
      let dateStr = appointment.date;
      if (dateStr.includes('T')) {
        // If it's an ISO datetime, extract just the date part
        dateStr = dateStr.split('T')[0];
      }
      const appointmentDate = new Date(`${dateStr}T${appointment.time || '00:00'}`);
      // Include both today and future appointments
      return appointmentDate >= new Date();
    });

    const pastAppointments = appointments.filter((appointment) => {
      // Handle both date formats: ISO datetime string or date-only string
      let dateStr = appointment.date;
      if (dateStr.includes('T')) {
        // If it's an ISO datetime, extract just the date part
        dateStr = dateStr.split('T')[0];
      }
      const appointmentDate = new Date(`${dateStr}T${appointment.time || '00:00'}`);
      return appointmentDate < new Date();
    });

    const nextAppointment = upcomingAppointments.length > 0 
      ? upcomingAppointments.sort((a, b) => {
          let aDateStr = a.date;
          if (aDateStr.includes('T')) {
            aDateStr = aDateStr.split('T')[0];
          }
          let bDateStr = b.date;
          if (bDateStr.includes('T')) {
            bDateStr = bDateStr.split('T')[0];
          }
          const aDate = new Date(`${aDateStr}T${a.time || '00:00'}`);
          const bDate = new Date(`${bDateStr}T${b.time || '00:00'}`);
          return aDate - bDate;
        })[0]
      : null;

    return (
      <div className="p-9">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-[28px] font-bold">Hello, {loggedInUser.name}</h2>
            <p className="mt-2 text-[18px] text-slate-500">Welcome to your patient portal.</p>
          </div>

          <button
            onClick={() => setActivePage("appointments")}
            className="flex items-center gap-3 rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700"
          >
            <CalendarPlus size={20} />
            <span>Book Appointment</span>
          </button>
        </div>

        <div className="rounded-[28px] bg-gradient-to-r from-teal-500 to-teal-700 p-9 text-white shadow-lg">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${
                nextAppointment 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-white text-teal-700'
              }`}>Next Appointment</span>

              <h3 className="mt-6 text-[34px] font-bold">
                {nextAppointment ? new Date(nextAppointment.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'No upcoming appointments'}
              </h3>

              {nextAppointment ? (
                <div className="mt-4 flex items-center gap-3 text-white text-opacity-90">
                  <Clock3 size={24} />
                  <p className="text-[28px]">
                    {(() => {
                      try {
                        if (nextAppointment.time) {
                          const [hours, minutes] = nextAppointment.time.split(':');
                          const hour = parseInt(hours, 10);
                          const min = parseInt(minutes, 10);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour % 12 || 12;
                          return `${displayHour}:${String(min).padStart(2, '0')} ${ampm}`;
                        }
                        return 'TBD';
                      } catch (e) {
                        return nextAppointment.time || 'TBD';
                      }
                    })()}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="w-full max-w-[360px]">
              {nextAppointment ? (
                <div className="rounded-2xl border-2 border-teal-400 bg-teal-600 bg-opacity-80 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-teal-500">
                        <Stethoscope size={28} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[16px] font-semibold text-white">
                        Dr. {doctors.find((doc) => doc.id === nextAppointment.doctor_id)?.name || `Doctor ${nextAppointment.doctor_id}`}
                      </p>
                      <p className="mt-1 text-[14px] text-white text-opacity-90">{doctors.find((doc) => doc.id === nextAppointment.doctor_id)?.specialty || 'Medical Professional'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-white border-opacity-60 bg-white bg-opacity-90 p-6 flex items-center justify-center min-h-[100px]">
                  <p className="text-slate-600 text-center text-[14px]">No appointment scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[20px] text-slate-500">Upcoming Visits</p>
                <p className="mt-3 text-[42px] font-bold">{upcomingAppointments.length}</p>
              </div>
              <div className="rounded-2xl bg-teal-50 p-4 text-teal-600">
                <CalendarDays size={28} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[20px] text-slate-500">Past Visits</p>
                <p className="mt-3 text-[42px] font-bold">{pastAppointments.length}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
                <Clock3 size={28} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[20px] text-slate-500">Medical Records</p>
                <p className="mt-3 text-[42px] font-bold">{medicalRecords.length}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
                <ClipboardList size={28} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[20px] font-semibold">Recent Medical Records</h3>
              <button
                onClick={() => setActivePage("records")}
                className="flex items-center gap-2 text-[18px] font-medium text-teal-600"
              >
                <span>View All</span>
                <ArrowRight size={18} />
              </button>
            </div>

            {medicalRecords.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 p-5 text-slate-500">
                No records available yet.
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[24px] font-semibold text-teal-600">{medicalRecords[0].title || 'Recent record'}</p>
                    <p className="mt-3 text-[18px] text-slate-500">{medicalRecords[0].treatment || 'No summary available'}</p>
                    <div className="mt-5 flex items-center gap-2 text-[16px] text-slate-500">
                      <UserCircle size={16} />
                      <span>Dr. {doctors.find((doc) => doc.id === medicalRecords[0].doctor_id)?.name || `Doctor ${medicalRecords[0].doctor_id}`}</span>
                    </div>
                  </div>
                  <p className="text-[16px] text-slate-400">
                    {medicalRecords[0].record_date
                      ? new Date(medicalRecords[0].record_date).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="mb-6 text-[20px] font-semibold">Appointment History</h3>

            {appointments.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 p-5 text-slate-500">No past appointments yet.</div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-slate-100 text-sm font-semibold">
                    <span>{new Date(appointments[0].date).getDate()}</span>
                    <span className="text-xs text-slate-500">{new Date(appointments[0].date).toLocaleString(undefined, { month: 'short' })}</span>
                  </div>

                  <div>
                    <p className="text-[22px] font-medium">{doctors.find((doc) => doc.id === appointments[0].doctor_id)?.name || `Doctor ${appointments[0].doctor_id}`}</p>
                    <p className="text-[17px] text-slate-500">{appointments[0].type || 'Consultation'}</p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-100 px-5 py-2 text-sm font-medium text-emerald-700">
                  {appointments[0].status || 'Pending'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAppointmentsPage = () => (
    <div className="p-9">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-[28px] font-bold">My Appointments</h2>
          <p className="mt-2 text-[18px] text-slate-500">
            Book and manage your appointments.
          </p>
        </div>

        <button 
          onClick={() => setShowBookingModal(true)}
          className="flex items-center gap-3 rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700">
          <CalendarPlus size={20} />
          <span>Book Appointment</span>
        </button>
      </div>

      {showBookingModal && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-[22px] font-bold">Book New Appointment</h3>
          <form onSubmit={handleBookAppointment} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">Select Doctor</label>
              <select 
                value={bookingData.doctorId}
                onChange={(e) => setBookingData({...bookingData, doctorId: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-4 py-2" required>
                <option value="">Choose a doctor...</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Date</label>
              <input type="date" 
                value={bookingData.date}
                onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-4 py-2" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Time</label>
              <input type="time" 
                value={bookingData.time}
                onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-4 py-2" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Appointment Type</label>
              <select 
                value={bookingData.type}
                onChange={(e) => setBookingData({...bookingData, type: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-4 py-2">
                <option>Consultation</option>
                <option>Follow-up</option>
                <option>Checkup</option>
              </select>
            </div>
            <button type="submit" className="col-span-1 rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 md:col-span-2">Book Appointment</button>
            <button type="button" onClick={() => setShowBookingModal(false)} className="col-span-1 rounded-lg border border-slate-200 px-4 py-2 hover:bg-slate-50 md:col-span-2">Cancel</button>
          </form>
        </div>
      )}

      <div className="space-y-5">
        {appointments.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">No appointments booked yet</p>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="pointer-events-auto rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-5">
                  <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-slate-200">
                    <Stethoscope size={24} className="text-slate-600" />
                  </div>

                  <div>
                    <h3 className="text-[20px] font-semibold">Doctor: {doctors.find((doc) => doc.id === appointment.doctor_id)?.name || `ID ${appointment.doctor_id}`}</h3>
                    <p className="mt-1 text-[18px] text-slate-500">{appointment.type}</p>

                    <div className="mt-5 flex flex-wrap items-center gap-6 text-[18px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={18} />
                        <span>{formatDate(appointment.date)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock3 size={18} />
                        <span>{formatTime(appointment.time)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 xl:items-end">
                  <span
                    className={`rounded-full px-4 py-1 text-sm font-medium ${
                      appointment.status === "Pending"
                        ? "bg-amber-100 text-amber-700"
                        : appointment.status === "Cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {appointment.status}
                  </span>

                  <div className="flex flex-wrap gap-3">
                    {appointment.status === "Pending" && (
                      <button 
                        type="button"
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="pointer-events-auto cursor-pointer rounded-2xl border border-red-200 bg-white px-7 py-3 text-[18px] text-red-500 transition hover:bg-red-50 active:bg-red-100">
                        Cancel
                      </button>
                    )}

                    {appointment.status !== "Cancelled" && (
                      <button 
                        type="button"
                        onClick={() => {
                          console.log("View Details - Setting modal state");
                          setSelectedDetail(appointment);
                          setSelectedDetailType("appointment");
                          setShowAppointmentDetails(true);
                        }}
                        className="pointer-events-auto cursor-pointer rounded-2xl border border-slate-200 bg-white px-7 py-3 text-[18px] text-slate-700 transition hover:bg-slate-50 active:bg-slate-100">
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderMedicalRecordsPage = () => (
    <div className="p-9">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-[28px] font-bold">Medical Records</h2>
          <p className="mt-2 text-[18px] text-slate-500">
            View your diagnoses, summaries, and treatment history.
          </p>
        </div>

        <button 
          onClick={downloadAllRecords}
          className="flex items-center gap-3 rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700 transition">
          <FileText size={20} />
          <span>Download Records</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[20px] text-slate-500">Total Records</p>
              <p className="mt-3 text-[42px] font-bold">{medicalRecords.length}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
              <ClipboardList size={28} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[20px] text-slate-500">Active Conditions</p>
              <p className="mt-3 text-[42px] font-bold">{medicalRecords.filter(r => r.status === 'Active').length}</p>
            </div>
            <div className="rounded-2xl bg-teal-50 p-4 text-teal-600">
              <Activity size={28} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[20px] text-slate-500">Last Updated</p>
              <p className="mt-3 text-[24px] font-bold">{getLastUpdatedDate()}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
              <Clock3 size={28} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {medicalRecords.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">No medical records found</p>
        ) : (
          medicalRecords.map((record) => (
            <div
              key={record.id}
              className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-5">
                  <div className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <FileText size={28} />
                  </div>

                  <div>
                    <h3 className="text-[22px] font-semibold text-slate-900">
                      {record.title}
                    </h3>

                    <p className="mt-2 text-[18px] text-slate-500">
                      {record.treatment}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-6 text-[17px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <UserCircle size={18} />
                        <span>Dr. {doctors.find((doc) => doc.id === record.doctor_id)?.name || `ID ${record.doctor_id}`}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarDays size={18} />
                        <span>
                          {record.record_date
                            ? new Date(record.record_date).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 xl:items-end">
                  <span
                    className={`rounded-full px-4 py-1 text-sm font-medium ${
                      record.status === "Active"
                        ? "bg-amber-100 text-amber-700"
                        : record.status === "Completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {record.status}
                  </span>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setSelectedDetail(record);
                        setSelectedDetailType("record");
                        setShowAppointmentDetails(true);
                      }}
                      className="rounded-2xl border border-slate-200 px-7 py-3 text-[18px] text-slate-700 hover:bg-slate-50">
                      View Details
                    </button>
                    <button
                      onClick={() => downloadMedicalRecord(record)}
                      className="rounded-2xl border border-slate-200 px-7 py-3 text-[18px] text-teal-600 hover:bg-teal-50">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderProfilePage = () => (
    <div className="p-9">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[28px] font-bold">My Profile</h2>
          <p className="mt-2 text-[18px] text-slate-500">Manage your personal information.</p>
        </div>

        <button
          onClick={() => {
            if (!editingProfile && loggedInUser) {
              setProfileData({
                name: loggedInUser.name || "",
                email: loggedInUser.email || "",
                phone: loggedInUser.phone || "",
                bloodGroup: loggedInUser.bloodGroup || "",
                age: loggedInUser.age || "",
                gender: loggedInUser.gender || "",
                dateOfBirth: loggedInUser.dateOfBirth || "",
                address: loggedInUser.address || "",
                emergencyContact: loggedInUser.emergencyContact || "",
              });
            }
            setEditingProfile(!editingProfile);
          }}
          className="rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700"
        >
          {editingProfile ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      <div className="space-y-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-teal-600">
                <Stethoscope size={50} className="text-white" />
              </div>
              <div>
                <h3 className="text-[28px] font-semibold">{loggedInUser.name}</h3>
                <p className="mt-1 text-[17px] text-slate-500">{loggedInUser.email}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">{loggedInUser.age ? `${loggedInUser.age} years` : 'Age not set'}</span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">{loggedInUser.gender || 'Gender not set'}</span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">{loggedInUser.bloodGroup || 'Blood group not set'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700">
                <Phone size={16} /> {loggedInUser.phone || 'No phone'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                Patient ID: PT-{loggedInUser.id}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Blood Group</p>
            <p className="mt-3 text-[28px] font-semibold text-slate-900">{loggedInUser.bloodGroup || 'N/A'}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Age</p>
            <p className="mt-3 text-[28px] font-semibold text-slate-900">{loggedInUser.age || 'N/A'}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Gender</p>
            <p className="mt-3 text-[28px] font-semibold text-slate-900">{loggedInUser.gender || 'N/A'}</p>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-[22px] font-bold">Personal Information</h3>
              <p className="mt-2 text-slate-500">Update your contact and emergency details.</p>
            </div>
          </div>

          {editingProfile ? (
            <form onSubmit={handleEditProfile} className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Full Name</label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <User size={16} className="mr-3 text-slate-400" />
                    <input
                      type="text"
                      value={profileData.name || loggedInUser.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full bg-transparent text-slate-900 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Email Address</label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Mail size={16} className="mr-3 text-slate-400" />
                    <input
                      type="email"
                      value={profileData.email || loggedInUser.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full bg-transparent text-slate-900 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Phone Number</label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Phone size={16} className="mr-3 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+1 987-654-3210"
                      value={profileData.phone || loggedInUser.phone || ''}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full bg-transparent text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Blood Group</label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <FileHeart size={16} className="mr-3 text-slate-400" />
                    <select
                      value={profileData.bloodGroup || loggedInUser.bloodGroup || ''}
                      onChange={(e) => setProfileData({ ...profileData, bloodGroup: e.target.value })}
                      className="w-full bg-transparent text-slate-900 outline-none"
                    >
                      <option value="">Select blood group</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Age</label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Clock3 size={16} className="mr-3 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      placeholder="45"
                      value={profileData.age || loggedInUser.age || ''}
                      onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                      className="w-full bg-transparent text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Gender</label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <UserCog size={16} className="mr-3 text-slate-400" />
                    <select
                      value={profileData.gender || loggedInUser.gender || ''}
                      onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                      className="w-full bg-transparent text-slate-900 outline-none"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Date of Birth</label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <CalendarRange size={16} className="mr-3 text-slate-400" />
                    <input
                      type="date"
                      value={profileData.dateOfBirth || loggedInUser.dateOfBirth || ''}
                      onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                      className="w-full bg-transparent text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">Address</label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <textarea
                      rows="3"
                      value={profileData.address || loggedInUser.address || ''}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="w-full resize-none bg-transparent text-slate-900 outline-none"
                      placeholder="123 Main St, City"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">Emergency Contact</label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Phone size={16} className="mr-3 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+1 234-567-8900"
                      value={profileData.emergencyContact || loggedInUser.emergencyContact || ''}
                      onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                      className="w-full bg-transparent text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="mt-8 w-full rounded-2xl bg-teal-600 px-6 py-3 font-medium text-white hover:bg-teal-700">
                Save Changes
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Full Name</p>
                <p className="mt-3 text-[18px] font-medium text-slate-900">{loggedInUser.name}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Email Address</p>
                <p className="mt-3 text-[18px] font-medium text-slate-900">{loggedInUser.email}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Phone Number</p>
                <p className="mt-3 text-[18px] font-medium text-slate-900">{loggedInUser.phone || 'Not set'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Blood Group</p>
                <p className="mt-3 text-[18px] font-medium text-slate-900">{loggedInUser.bloodGroup || 'Not set'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Age</p>
                <p className="mt-3 text-[18px] font-medium text-slate-900">{loggedInUser.age || 'Not set'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Gender</p>
                <p className="mt-3 text-[18px] font-medium text-slate-900">{loggedInUser.gender || 'Not set'}</p>
              </div>
              <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Address</p>
                <p className="mt-3 text-[18px] font-medium text-slate-900">{loggedInUser.address || 'Not set'}</p>
              </div>
              <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Emergency Contact</p>
                <p className="mt-3 text-[18px] font-medium text-slate-900">{loggedInUser.emergencyContact || 'Not set'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAdminPatientsPage = () => {
    const itemsPerPage = 5;
    
    // Filter patients based on local search query
    const filteredPatients = adminPatients.filter(patient => {
      // If search is empty, include all patients
      if (!patientSearchFilter || patientSearchFilter.trim() === "") {
        return true;
      }
      
      const searchLower = patientSearchFilter.toLowerCase().trim();
      return (
        patient.name.toLowerCase().includes(searchLower) ||
        patient.email.toLowerCase().includes(searchLower) ||
        (patient.phone && patient.phone.includes(searchLower))
      );
    });
    
    // Reset page if needed
    if (adminPatientsPage > Math.ceil(filteredPatients.length / itemsPerPage) && filteredPatients.length > 0) {
      setAdminPatientsPage(1);
    }
    
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
    const startIndex = (adminPatientsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

    return (
    <div className="p-9">
      <div className="mb-8">
        <div>
          <h2 className="text-[28px] font-bold">Manage Patients</h2>
          <p className="mt-2 text-[18px] text-slate-500">
            View and manage all registered patients.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div className="flex w-full max-w-[360px] items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search patients by name..."
              value={patientSearchFilter}
              onChange={(e) => setPatientSearchFilter(e.target.value)}
              className="w-full border-none bg-transparent outline-none text-slate-900 placeholder-slate-400"
            />
          </div>

          <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-slate-700 hover:bg-slate-50">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>

        <div className="grid gap-4 border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-500" style={{gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1.2fr 1fr'}}>
          <div>PATIENT</div>
          <div>AGE/GENDER</div>
          <div>BLOOD GROUP</div>
          <div>CONDITION</div>
          <div>PHONE</div>
          <div className="text-right">Actions</div>
        </div>

        {paginatedPatients.map((patient, index) => (
          <div
            key={patient.id}
            className={`grid items-center gap-4 px-5 py-5 ${
              index !== paginatedPatients.length - 1 ? "border-b border-slate-200" : ""
            }`}
            style={{gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1.2fr 1fr'}}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-200">
                <User size={18} className="text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[18px] font-medium text-slate-900">{patient.name}</p>
                <p className="truncate text-sm text-slate-500">{patient.email}</p>
              </div>
            </div>

            <div className="truncate text-[17px] text-slate-700">
              {patient.age && patient.gender ? `${patient.age} / ${patient.gender}` : 'N/A'}
            </div>

            <div className="truncate text-[17px] text-slate-700">{patient.blood_group || 'N/A'}</div>

            <div className="truncate text-[17px] text-slate-700">{patient.condition || 'N/A'}</div>

            <div className="truncate text-[17px] text-slate-700">{patient.phone || 'N/A'}</div>

            <div className="flex items-center justify-end gap-4">
              <button 
                onClick={() => { 
                  setAddModalType("patient"); 
                  setShowAddModal(true); 
                  setEditingPatientId(patient.id);
                  setNewUserData({
                    name: patient.name,
                    email: patient.email,
                    password: "",
                    phone: patient.phone || "",
                    role: "patient",
                    specialty: "",
                    age: patient.age || "",
                    gender: patient.gender || "",
                    blood_group: patient.blood_group || "",
                    condition: patient.condition || "",
                    date_of_birth: patient.date_of_birth || "",
                    address: patient.address || "",
                    emergency_contact: patient.emergency_contact || "",
                  }); 
                }}
                className="text-blue-600 hover:opacity-70"
              >
                <Pencil size={18} />
              </button>
              <button 
                onClick={() => { 
                  setSelectedDetailType("patient"); 
                  setSelectedDetail(patient); 
                  setShowAppointmentDetails(true); 
                }}
                className="text-blue-600 hover:opacity-70"
              >
                <Eye size={18} />
              </button>
              <button
                onClick={() => handleDeleteUser(patient.id, "patient")}
                className="text-red-500 hover:opacity-70"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {filteredPatients.length === 0 && (
          <div className="px-5 py-8 text-center text-slate-500">
            {patientSearchFilter ? "No patients match your search." : "No patients found."}
          </div>
        )}

        {filteredPatients.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-5 text-slate-500">
            <p>Showing {startIndex + 1} to {Math.min(endIndex, filteredPatients.length)} of {filteredPatients.length} entries</p>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setAdminPatientsPage(Math.max(1, adminPatientsPage - 1))}
                disabled={adminPatientsPage === 1}
                className="rounded-lg bg-slate-700 px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setAdminPatientsPage(page)}
                  className={`rounded-lg px-4 py-2 ${
                    adminPatientsPage === page
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setAdminPatientsPage(Math.min(totalPages, adminPatientsPage + 1))}
                disabled={adminPatientsPage === totalPages}
                className="rounded-lg bg-slate-700 px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderAdminPlaceholderPage = (title, description) => (
    <div className="p-9">
      <h2 className="text-[28px] font-bold">{title}</h2>
      <p className="mt-2 text-[18px] text-slate-500">{description}</p>

      <div className="mt-8 rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[18px] text-slate-600">{title} page content goes here.</p>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-9 p-9">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[28px] font-bold">Admin Dashboard</h2>
          <p className="mt-2 text-[18px] text-slate-500">Overview of hospital operations and statistics.</p>
        </div>
        <button 
          onClick={generateAdminReport}
          className="flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-white shadow-md hover:bg-teal-700 transition">
          <BarChart3 size={20} />
          <span>Generate Report</span>
        </button>
      </div>

      {/* Stats Grid - 4 columns */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCardWithChange 
          title="Total Patients" 
          value={adminStats.totalPatients || 0} 
          change="+12.5%" 
          isPositive={true} 
        />
        <StatCardWithChange 
          title="Total Doctors" 
          value={adminStats.totalDoctors || 0} 
          change="+2.4%" 
          isPositive={true} 
        />
        <StatCardWithChange 
          title="Appointments Today" 
          value={adminStats.totalAppointments || 0} 
          change="-5.1%" 
          isPositive={false} 
        />
        <StatCardWithChange 
          title="Active Cases" 
          value={adminStats.pendingAppointments || 0} 
          change="+8.2%" 
          isPositive={true} 
        />
      </div>

      {/* Charts and Recent Appointments Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Patient Demographics Chart */}
        <div className="col-span-2 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[20px] font-bold">Patient Demographics</h3>
            <select 
              value={demographicsPeriod}
              onChange={(e) => setDemographicsPeriod(e.target.value)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
            >
              <option>This Year</option>
              <option>Last Year</option>
              <option>This Month</option>
            </select>
          </div>
          {(() => {
            // Calculate patient demographics by condition
            const conditionCounts = {};
            adminPatients.forEach(patient => {
              const condition = patient.condition || 'No Condition';
              conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
            });
            
            // Get top 12 conditions
            const sortedConditions = Object.entries(conditionCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12);
            
            // If no conditions, show months
            if (sortedConditions.length === 0) {
              sortedConditions.push(['No Data', 0]);
            }
            
            // Find max value for scaling
            const maxCount = Math.max(...sortedConditions.map(c => c[1]), 1);
            
            // Color palette for variety
            const colors = [
              'from-blue-500 to-blue-300',
              'from-teal-500 to-teal-300',
              'from-emerald-500 to-emerald-300',
              'from-cyan-500 to-cyan-300',
              'from-indigo-500 to-indigo-300',
              'from-purple-500 to-purple-300',
              'from-pink-500 to-pink-300',
              'from-rose-500 to-rose-300',
              'from-amber-500 to-amber-300',
              'from-orange-500 to-orange-300',
              'from-lime-500 to-lime-300',
              'from-sky-500 to-sky-300',
            ];
            
            return (
              <div className="space-y-6">
                <div className="h-72 flex items-end justify-between gap-3 px-1 pb-4">
                  {sortedConditions.length > 0 ? sortedConditions.map(([condition, count], i) => (
                    <div key={condition} className="flex flex-col items-center gap-3 flex-1 group">
                      <div className="text-center">
                        <span className="text-sm font-semibold text-slate-900">{count}</span>
                      </div>
                      <div 
                        className={`w-full bg-gradient-to-t ${colors[i % colors.length]} rounded-t-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-y-110 cursor-pointer transform origin-bottom`}
                        style={{
                          height: `${(count / maxCount) * 240}px`,
                          minHeight: count > 0 ? '20px' : '0px'
                        }}
                        title={`${condition}: ${count} patients`}
                      ></div>
                      <span className="text-xs text-slate-600 font-medium text-center truncate w-full px-1 group-hover:text-slate-900" title={condition}>
                        {condition.length > 10 ? condition.substring(0, 9) + '.' : condition}
                      </span>
                    </div>
                  )) : (
                    <div className="w-full flex items-center justify-center text-slate-400">
                      No patient data available
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{adminPatients.length}</p>
                    <p className="text-sm text-slate-500">Total Patients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{Object.keys(conditionCounts).length}</p>
                    <p className="text-sm text-slate-500">Conditions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{sortedConditions.length > 0 ? Math.max(...sortedConditions.map(c => c[1])) : 0}</p>
                    <p className="text-sm text-slate-500">Most Common</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Recent Appointments */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[20px] font-bold">Recent Appointments</h3>
            <a href="#" className="text-sm text-teal-600 hover:underline">View All →</a>
          </div>
          <div className="space-y-4">
            {adminAppointments.slice(0, 5).map((apt, idx) => {
              const statusColors = {
                'Pending': 'bg-orange-100 text-orange-700',
                'Confirmed': 'bg-blue-100 text-blue-700',
                'Completed': 'bg-emerald-100 text-emerald-700',
                'Cancelled': 'bg-red-100 text-red-700'
              };
              
              // Get patient name from adminPatients array
              const patient = adminPatients.find(p => p.id === apt.patient_id);
              const patientName = patient?.name || `Patient ${apt.patient_id}`;
              
              // Get doctor name and ensure "Dr." prefix
              let doctorName = apt.doctor_name || `${apt.doctor_id || 'Unknown'}`;
              if (!doctorName.startsWith('Dr.')) {
                doctorName = `Dr. ${doctorName}`;
              }
              
              return (
                <div key={apt.id || idx} className="flex items-center gap-3 pb-4 border-b border-slate-100 last:border-b-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
                    <User size={16} className="text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900">{patientName}</p>
                    <p className="text-xs text-slate-500">{doctorName}</p>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[apt.status] || statusColors['Pending']}`}>
                      {apt.status || 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
            {adminAppointments.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">No recent appointments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const StatCardWithChange = ({ title, value, change, isPositive }) => {
    let IconComponent = Users;
    if (title.includes('Doctors')) IconComponent = Stethoscope;
    if (title.includes('Appointments')) IconComponent = CalendarDays;
    if (title.includes('Cases')) IconComponent = BarChart3;
    
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600">{title}</p>
            <p className="mt-2 text-[32px] font-bold text-slate-900">{value}</p>
            <p className={`mt-2 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {change} vs last month
            </p>
          </div>
          <div className={`p-3 rounded-lg ${
            title.includes('Patients') ? 'bg-blue-100' :
            title.includes('Doctors') ? 'bg-purple-100' :
            title.includes('Appointments') ? 'bg-orange-100' :
            'bg-teal-100'
          }`}>
            <IconComponent size={28} className={
              title.includes('Patients') ? 'text-blue-600' :
              title.includes('Doctors') ? 'text-purple-600' :
              title.includes('Appointments') ? 'text-orange-600' :
              'text-teal-600'
            } />
          </div>
        </div>
      </div>
    );
  };

  const renderAdminDoctorsPage = () => {
    const itemsPerPage = 5;
    
    // Filter doctors based on local search
    const filteredDoctors = doctors.filter(doc => {
      // If search is empty, include all
      if (!doctorSearchFilter || doctorSearchFilter.trim() === "") {
        return true;
      }
      
      const localSearchLower = doctorSearchFilter.toLowerCase().trim();
      
      return (
        doc.name.toLowerCase().includes(localSearchLower) ||
        doc.email.toLowerCase().includes(localSearchLower) ||
        (doc.specialty && doc.specialty.toLowerCase().includes(localSearchLower))
      );
    });
    
    // Reset page if needed
    if (adminDoctorsPage > Math.ceil(filteredDoctors.length / itemsPerPage) && filteredDoctors.length > 0) {
      setAdminDoctorsPage(1);
    }
    
    const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage) || 1;
    const startIndex = (adminDoctorsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDoctors = filteredDoctors.slice(startIndex, endIndex);

    return (
      <div className="p-9">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-[28px] font-bold">Manage Doctors</h2>
            <p className="mt-2 text-[18px] text-slate-500">
              View and manage all registered doctors.
            </p>
          </div>

          <button
            onClick={() => { setAddModalType("doctor"); setShowAddModal(true); setNewUserData({...newUserData, role: "doctor"}); }}
            className="flex items-center gap-3 rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700"
          >
            <UserCog size={20} />
            <span>Add Doctor</span>
          </button>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div className="flex w-full max-w-[360px] items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-slate-400">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search doctors..."
                value={doctorSearchFilter}
                onChange={(e) => {
                  setDoctorSearchFilter(e.target.value);
                  setAdminDoctorsPage(1);
                }}
                className="w-full bg-transparent outline-none text-slate-900"
              />
            </div>

            <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-slate-700 hover:bg-slate-50">
              <Filter size={18} />
              <span>Filter</span>
            </button>
          </div>

          <div className="grid gap-4 border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-500" style={{gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr 1fr 1fr'}}>
            <div>DOCTOR</div>
            <div>SPECIALIZATION</div>
            <div>DEPARTMENT</div>
            <div>EXPERIENCE</div>
            <div>RATING</div>
            <div>PATIENTS</div>
            <div className="text-right">Actions</div>
          </div>

          {paginatedDoctors.map((doctor, index) => {
            // Count unique patients for this doctor
            const patientCount = adminAppointments
              ? adminAppointments
                  .filter(app => app.doctor_id === doctor.id)
                  .reduce((unique, app) => {
                    if (!unique.has(app.patient_id)) unique.add(app.patient_id);
                    return unique;
                  }, new Set()).size
              : 0;

            return (
            <div
              key={doctor.id}
              className={`grid items-center gap-4 px-5 py-5 ${
                index !== paginatedDoctors.length - 1 ? "border-b border-slate-200" : ""
              }`}
              style={{gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr 1fr 1fr'}}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600">
                  <Stethoscope size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[18px] font-medium text-slate-900">{doctor.name}</p>
                  <p className="truncate text-sm text-slate-500">{doctor.email}</p>
                </div>
              </div>

              <div className="truncate text-[17px] text-slate-700">{doctor.specialty ?? 'N/A'}</div>

              <div className="truncate text-[17px] text-slate-700">{doctor.department ?? 'N/A'}</div>

              <div className="truncate text-[17px] text-slate-700">{(doctor.experience !== null && doctor.experience !== undefined) ? `${doctor.experience} years` : 'N/A'}</div>

              <div className="flex items-center gap-1 text-[17px] text-slate-700">
                <span className="text-yellow-400">★</span>
                <span className="font-medium">{doctor.rating !== null && doctor.rating !== undefined ? parseFloat(doctor.rating).toFixed(1) : 'N/A'}</span>
              </div>

              <div className="truncate text-[17px] text-teal-600 font-medium">{patientCount}</div>

              <div className="flex items-center justify-end gap-4">
                <button 
                  onClick={() => { 
                    setAddModalType("doctor"); 
                    setShowAddModal(true); 
                    setEditingDoctorId(doctor.id);
                    setNewUserData({
                      name: doctor.name,
                      email: doctor.email,
                      password: "",
                      phone: doctor.phone || "",
                      role: "doctor",
                      specialty: doctor.specialty || "",
                    }); 
                  }}
                  className="text-blue-600 hover:opacity-70"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => { 
                    setSelectedDetailType("doctor"); 
                    setSelectedDetail(doctor); 
                    setShowAppointmentDetails(true); 
                  }}
                  className="text-blue-600 hover:opacity-70"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => handleDeleteUser(doctor.id, "doctor")}
                  className="text-red-500 hover:opacity-70"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
          })}

          {filteredDoctors.length === 0 && (
            <div className="px-5 py-8 text-center text-slate-500">
              No doctors found.
            </div>
          )}

          {filteredDoctors.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-5 text-slate-500">
              <p>Showing {startIndex + 1} to {Math.min(endIndex, filteredDoctors.length)} of {filteredDoctors.length} entries</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdminDoctorsPage(Math.max(1, adminDoctorsPage - 1))}
                  disabled={adminDoctorsPage === 1}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setAdminDoctorsPage(page)}
                    className={`rounded-lg px-3 py-2 font-medium ${
                      adminDoctorsPage === page
                        ? "bg-teal-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setAdminDoctorsPage(Math.min(totalPages, adminDoctorsPage + 1))}
                  disabled={adminDoctorsPage === totalPages}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAdminAppointmentsPage = () => {
    // Filter appointments by status and search
    const filteredAppointments = adminAppointments.filter((apt) => {
      const matchesStatus = appointmentFilter === "All" || apt.status === appointmentFilter;
      
      // Local search only
      const localSearchActive = appointmentSearch && appointmentSearch.trim() !== "";
      const matchesLocalSearch = !localSearchActive ||
        apt.patient_name?.toLowerCase().includes(appointmentSearch.toLowerCase().trim()) ||
        apt.doctor_name?.toLowerCase().includes(appointmentSearch.toLowerCase().trim());
      
      return matchesStatus && matchesLocalSearch;
    });

    // Pagination logic
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
    const startIndex = (adminAppointmentsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

    // Reset to page 1 if current page exceeds available pages
    if (adminAppointmentsPage > totalPages && totalPages > 0) {
      setAdminAppointmentsPage(1);
    }

    const getStatusBadgeClass = (status) => {
      switch (status) {
        case "Completed":
          return "bg-emerald-100 text-emerald-700";
        case "Confirmed":
        case "Scheduled":
          return "bg-blue-100 text-blue-700";
        case "Pending":
          return "bg-amber-100 text-amber-700";
        case "Cancelled":
          return "bg-red-100 text-red-700";
        default:
          return "bg-slate-100 text-slate-700";
      }
    };

    return (
      <div className="p-9">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-[28px] font-bold">All Appointments</h2>
            <p className="mt-2 text-[18px] text-slate-500">
              View and manage all hospital appointments. Book appointments for registered patients or emergency walk-in patients.
            </p>
          </div>

          <button
            onClick={() => {
              console.log("🎬 Opening Book Appointment modal");
              console.log("Available doctors:", doctors);
              console.log("Admin patients:", adminPatients);
              setShowAddModal(true);
              setAddModalType("appointment");
              setNewUserData({ ...newUserData, patientType: "registered", selectedPatientId: "", emergencyPatientName: "", emergencyPatientPhone: "" });
              setBookingData({ doctorId: "", date: "", time: "", type: "Consultation" });
            }}
            className="flex items-center gap-3 rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700"
          >
            <CalendarPlus size={20} />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {["All", "Scheduled", "Pending", "Completed", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setAppointmentFilter(status);
                setAdminAppointmentsPage(1);
              }}
              className={`rounded-full px-5 py-2 font-medium transition-colors ${
                appointmentFilter === status
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          {/* Search Bar */}
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 bg-slate-50">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={appointmentSearch}
                onChange={(e) => {
                  setAppointmentSearch(e.target.value);
                  setAdminAppointmentsPage(1);
                }}
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Table Header */}
          <div className="grid gap-4 border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-500" style={{gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 0.8fr 0.8fr'}}>
            <div>PATIENT</div>
            <div>DOCTOR</div>
            <div>DATE</div>
            <div>TYPE</div>
            <div>STATUS</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Table Body */}
          {paginatedAppointments.length > 0 ? (
            paginatedAppointments.map((apt, index) => (
              <div
                key={apt.id}
                className={`grid items-center gap-4 px-5 py-5 ${
                  index !== paginatedAppointments.length - 1 ? "border-b border-slate-200" : ""
                }`}
                style={{gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 0.8fr 0.8fr'}}
              >
                {/* Patient */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                    <span className="text-white font-semibold text-sm">
                      {apt.patient_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-slate-900">
                      {apt.patient_name || "Unknown"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {apt.patient_email || ""}
                    </p>
                  </div>
                </div>

                {/* Doctor */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600">
                    <Stethoscope size={16} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-slate-900">
                      {apt.doctor_name || "Unassigned"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {apt.specialty || ""}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="text-[15px] text-slate-700">
                  <div>{formatDate(apt.date)}</div>
                  <div className="text-xs text-slate-500">{formatTime(apt.time)}</div>
                </div>

                {/* Type */}
                <div className="text-[15px] text-slate-700">
                  {apt.type || "General"}
                </div>

                {/* Status Badge */}
                <div>
                  <select
                    value={apt.status}
                    onChange={(e) => handleUpdateAppointmentStatus(apt.id, e.target.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer ${getStatusBadgeClass(apt.status)}`}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDetailType("appointment");
                      setSelectedDetail(apt);
                      setShowAppointmentDetails(true);
                    }}
                    className="text-blue-600 hover:opacity-70 transition-opacity cursor-pointer"
                    title="View"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAppointment(apt.id)}
                    className="text-red-500 hover:opacity-70 transition-opacity cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-slate-500 text-[15px]">No appointments found.</p>
            </div>
          )}

          {/* Pagination */}
          {filteredAppointments.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-5 text-slate-600">
              <p className="text-sm">Showing {startIndex + 1} to {Math.min(endIndex, filteredAppointments.length)} of {filteredAppointments.length} entries</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdminAppointmentsPage(Math.max(1, adminAppointmentsPage - 1))}
                  disabled={adminAppointmentsPage === 1}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setAdminAppointmentsPage(page)}
                    className={`rounded-lg px-3 py-2 font-medium ${
                      adminAppointmentsPage === page
                        ? "bg-teal-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setAdminAppointmentsPage(Math.min(totalPages, adminAppointmentsPage + 1))}
                  disabled={adminAppointmentsPage === totalPages}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAdminMedicalHistoryPage = () => {
    // Filter medical records by search
    const filteredRecords = adminMedicalRecords.filter((record) => {
      const searchLower = medicalRecordsSearch.toLowerCase();
      return (
        record.patient_name?.toLowerCase().includes(searchLower) ||
        record.doctor_name?.toLowerCase().includes(searchLower) ||
        record.diagnosis?.toLowerCase().includes(searchLower)
      );
    });

    return (
      <div className="p-9">
        <div className="mb-8">
          <h2 className="text-[28px] font-bold">Medical History</h2>
          <p className="mt-2 text-[18px] text-slate-500">Browse all patient medical records.</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by patient name or diagnosis..."
            value={medicalRecordsSearch}
            onChange={(e) => setMedicalRecordsSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 placeholder-slate-400 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {/* Medical Records Cards */}
        <div className="space-y-4">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setExpandedRecordId(expandedRecordId === record.id ? null : record.id)}
                  className="w-full flex items-start justify-between p-5 text-left hover:bg-slate-50 transition-colors rounded-2xl"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* File Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <FileText size={24} className="text-slate-400" />
                    </div>

                    {/* Record Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[18px] font-semibold text-slate-900">{record.diagnosis}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Patient: <span className="font-medium">{record.patient_name}</span> • Doctor: <span className="font-medium">{record.doctor_name}</span>
                      </p>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-1">{record.treatment || "No treatment details"}</p>
                    </div>
                  </div>

                  {/* Date and Chevron */}
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <span className="text-sm font-medium text-slate-500">
                      {record.record_date 
                        ? new Date(record.record_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          }).split("/").reverse().join("-")
                        : "N/A"}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`text-slate-400 transition-transform ${
                        expandedRecordId === record.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedRecordId === record.id && (
                  <div className="border-t border-slate-200 px-5 py-4 space-y-3 bg-slate-50 rounded-b-2xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Patient</p>
                        <p className="mt-1 text-sm text-slate-700">{record.patient_name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Doctor</p>
                        <p className="mt-1 text-sm text-slate-700">{record.doctor_name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Diagnosis</p>
                        <p className="mt-1 text-sm text-slate-700">{record.diagnosis}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Record Date</p>
                        <p className="mt-1 text-sm text-slate-700">
                          {record.record_date 
                            ? new Date(record.record_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Treatment</p>
                      <p className="mt-1 text-sm text-slate-700">{record.treatment || "No treatment details"}</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleDeleteMedicalRecord(record.id)}
                        className="text-red-500 hover:opacity-70 transition-opacity text-sm font-medium flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-500">No medical records found.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAdminReportsPage = () => {
    // Calculate real statistics
    const totalAppointments = adminAppointments.length;
    const activePatients = adminPatients.length;
    const totalDoctors = doctors.length;
    const avgRating = totalDoctors > 0 ? (doctors.reduce((sum, d) => sum + (parseFloat(d.rating) || 0), 0) / totalDoctors).toFixed(1) : 0;

    // Calculate appointment types from real data
    const appointmentTypeData = {
      "Checkup": adminAppointments.filter(a => a.type === "Checkup").length,
      "Consultation": adminAppointments.filter(a => a.type === "Consultation").length,
      "Follow-up": adminAppointments.filter(a => a.type === "Follow-up").length,
      "Emergency": adminAppointments.filter(a => a.type === "Emergency").length,
    };
    const totalTypes = Object.values(appointmentTypeData).reduce((a, b) => a + b, 0) || 1;
    const appointmentTypes = {
      "Checkup": Math.round((appointmentTypeData["Checkup"] / totalTypes) * 100),
      "Consultation": Math.round((appointmentTypeData["Consultation"] / totalTypes) * 100),
      "Follow-up": Math.round((appointmentTypeData["Follow-up"] / totalTypes) * 100),
      "Emergency": Math.round((appointmentTypeData["Emergency"] / totalTypes) * 100),
    };

    // Calculate department patient load from real doctors data
    const deptLoad = {};
    doctors.forEach(doc => {
      const dept = doc.department || "General";
      const count = adminAppointments.filter(a => a.doctor_id === doc.id).length;
      deptLoad[dept] = (deptLoad[dept] || 0) + count;
    });
    const maxDeptLoad = Math.max(...Object.values(deptLoad), 1);

    // Calculate age demographics from real patient data
    const ageGroups = {
      "0-18": 0,
      "19-35": 0,
      "36-50": 0,
      "51-65": 0,
      "65+": 0,
    };
    adminPatients.forEach(patient => {
      if (patient.dateOfBirth) {
        const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
        if (age < 18) ageGroups["0-18"]++;
        else if (age < 36) ageGroups["19-35"]++;
        else if (age < 51) ageGroups["36-50"]++;
        else if (age < 66) ageGroups["51-65"]++;
        else ageGroups["65+"]++;
      }
    });
    const maxAge = Math.max(...Object.values(ageGroups), 1);

    // Monthly trend - group appointments by month
    const monthlyTrend = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    months.forEach((m, i) => monthlyTrend[m] = 0);
    adminAppointments.forEach(apt => {
      if (apt.date) {
        const month = new Date(apt.date).toLocaleString("en-US", { month: "short" });
        if (monthlyTrend.hasOwnProperty(month)) monthlyTrend[month]++;
      }
    });
    const maxMonthly = Math.max(...Object.values(monthlyTrend), 1);

    return (
      <div className="p-9">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-bold">Reports & Analytics</h2>
            <p className="mt-2 text-[18px] text-slate-500">Comprehensive insights and statistics.</p>
          </div>
          <select className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700">
            <option>This Month</option>
            <option>Last Month</option>
            <option>Last Quarter</option>
            <option>This Year</option>
          </select>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Appointments"
            value={totalAppointments}
            change="13.6%"
            icon={<CalendarDays size={32} className="text-blue-500" />}
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Active Patients"
            value={activePatients}
            change="16.2%"
            icon={<Users size={32} className="text-emerald-500" />}
            bgColor="bg-emerald-50"
          />
          <StatCard
            title="Total Doctors"
            value={totalDoctors}
            change="2.7%"
            icon={<Stethoscope size={32} className="text-purple-500" />}
            bgColor="bg-purple-50"
          />
          <StatCard
            title="Avg. Rating"
            value={avgRating}
            change="25.5%"
            icon={<BarChart3 size={32} className="text-amber-500" />}
            bgColor="bg-amber-50"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
          {/* Line Chart - Monthly Trend */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-[18px] font-semibold text-slate-900 mb-4">Monthly Appointments Trend</h3>
            <div className="h-64 flex items-end gap-2 px-2 py-4">
              {Object.entries(monthlyTrend).map(([month, value]) => (
                <div key={month} className="flex-1 flex flex-col items-center">
                  <div className="w-full relative">
                    <div
                      className="w-full bg-gradient-to-t from-blue-400 to-blue-500 rounded-t-lg transition-all"
                      style={{ height: `${(value / maxMonthly) * 200}px` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 mt-2">{month}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              appointments
            </div>
          </div>

          {/* Pie Chart - Appointment Types */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-[18px] font-semibold text-slate-900 mb-6">Appointments by Type</h3>
            <div className="flex flex-col items-center justify-center">
              <div className="w-32 h-32 rounded-full" style={{
                background: `conic-gradient(
                  #3b82f6 0deg ${(appointmentTypes.Checkup / 100) * 360}deg,
                  #8b5cf6 ${(appointmentTypes.Checkup / 100) * 360}deg ${((appointmentTypes.Checkup + appointmentTypes["Follow-up"]) / 100) * 360}deg,
                  #10b981 ${((appointmentTypes.Checkup + appointmentTypes["Follow-up"]) / 100) * 360}deg ${((appointmentTypes.Checkup + appointmentTypes["Follow-up"] + appointmentTypes.Consultation) / 100) * 360}deg,
                  #f97316 ${((appointmentTypes.Checkup + appointmentTypes["Follow-up"] + appointmentTypes.Consultation) / 100) * 360}deg 360deg
                )`
              }}></div>
            </div>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>Checkup {appointmentTypes.Checkup}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span>Follow-up {appointmentTypes["Follow-up"]}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Consultation {appointmentTypes.Consultation}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-orange-500 rounded-full"></span>Emergency {appointmentTypes.Emergency}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Bar Chart - Department Load */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-[18px] font-semibold text-slate-900 mb-4">Department Patient Load</h3>
            <div className="h-64 flex items-end gap-3 px-2 py-4">
              {Object.entries(deptLoad).length > 0 ? (
                Object.entries(deptLoad).map(([dept, value]) => (
                  <div key={dept} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-purple-400 to-purple-500 rounded-t-lg transition-all"
                      style={{ height: `${(value / maxDeptLoad) * 200}px` }}
                    />
                    <span className="text-xs text-slate-500 mt-2 text-center line-clamp-2">{dept}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-center w-full">No department data</div>
              )}
            </div>
            <div className="mt-2 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
              Patients
            </div>
          </div>

          {/* Bar Chart - Age Demographics */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-[18px] font-semibold text-slate-900 mb-4">Patient Demographics by Age</h3>
            <div className="h-64 flex items-end gap-3 px-2 py-4">
              {Object.entries(ageGroups).map(([label, value]) => (
                <div key={label} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-400 to-emerald-500 rounded-t-lg transition-all"
                    style={{ height: `${(value / maxAge) * 200}px` }}
                  />
                  <span className="text-xs text-slate-500 mt-2">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
              Count
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StatCard = ({ title, value, change, icon, bgColor = "bg-blue-50" }) => {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600 font-medium">{title}</p>
            <p className="mt-3 text-[32px] font-bold text-slate-900">{value}</p>
            <p className="mt-3 text-xs text-teal-600 font-medium">+{change} vs last month</p>
          </div>
          <div className={`rounded-lg ${bgColor} p-3`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  const renderAdminSettingsPage = () => {
    const handleUpdatePassword = async () => {
      setPasswordMessage("");
      setPasswordError(false);

      // Validate fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordMessage("❌ Please fill all password fields");
        setPasswordError(true);
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordMessage("❌ Passwords don't match");
        setPasswordError(true);
        return;
      }

      if (newPassword.length < 6) {
        setPasswordMessage("❌ Password must be at least 6 characters");
        setPasswordError(true);
        return;
      }

      setLoadingPassword(true);
      try {
        const response = await api.put(`/users/${loggedInUser.id}/change-password`, {
          currentPassword,
          newPassword,
          confirmPassword,
        });
        setPasswordMessage(response.data.message || "✅ Password changed successfully!");
        setPasswordError(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err) {
        const errorMsg = err.response?.data?.message || "❌ Failed to change password";
        setPasswordMessage(errorMsg);
        setPasswordError(true);
      } finally {
        setLoadingPassword(false);
      }
    };

    const handleSaveAllChanges = async () => {
      try {
        // Save notification preferences to backend
        await api.put(`/notification-preferences/${loggedInUser.id}`, {
          emailNotifications,
          smsNotifications,
          pushNotifications,
        });
        setMessage("✅ All changes saved successfully!");
        setIsError(false);
      } catch (err) {
        setMessage("❌ Failed to save changes");
        setIsError(true);
      }
    };

    return (
      <div className="p-9">
        {/* Notification Preferences */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell size={24} className="text-amber-500" />
            <h3 className="text-[20px] font-semibold">Notification Preferences</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                <p className="text-xs text-slate-600">Receive appointment and system updates via email</p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`w-12 h-6 rounded-full transition-colors ${emailNotifications ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">SMS Notifications</p>
                <p className="text-xs text-slate-600">Get text messages for urgent updates</p>
              </div>
              <button
                onClick={() => setSmsNotifications(!smsNotifications)}
                className={`w-12 h-6 rounded-full transition-colors ${smsNotifications ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${smsNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Push Notifications</p>
                <p className="text-xs text-slate-600">Browser notifications for real-time alerts</p>
              </div>
              <button
                onClick={() => setPushNotifications(!pushNotifications)}
                className={`w-12 h-6 rounded-full transition-colors ${pushNotifications ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${pushNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock size={24} className="text-red-500" />
            <h3 className="text-[20px] font-semibold">Security</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-900">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-900">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {passwordMessage && (
              <div className={`p-3 rounded-lg text-sm ${passwordError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {passwordMessage}
              </div>
            )}

            <button
              onClick={handleUpdatePassword}
              disabled={loadingPassword}
              className="mt-4 px-6 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Info size={24} className="text-purple-500" />
            <h3 className="text-[20px] font-semibold">System Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-600">Version</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">v2.4.1</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Last Updated</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">December 15, 2023</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Database</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">PostgreSQL 14.2</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Server Status</p>
              <p className="text-sm font-semibold text-teal-600 mt-1">Online</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleSaveAllChanges}
            className="px-6 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
            Save All Changes
          </button>
        </div>
      </div>
    );
  };

  const SettingsSection = ({ title, description, fields }) => (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-[20px] font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-6 space-y-4">
        {fields.map((field, idx) => (
          <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-4">
            <label className="text-sm font-medium text-slate-700">{field.label}</label>
            <input
              type="text"
              value={field.value}
              readOnly={field.readonly}
              disabled={field.readonly}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        ))}
      </div>
    </div>
  );

  if (loggedInUser && loggedInUser.role === "doctor") {
    return <DoctorDashboard loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} onLogout={handleLogout} />;
  }

  if (loggedInUser && loggedInUser.role === "patient") {
    return (
      <>
        <div className="flex min-h-screen">
          <aside className={`flex flex-col justify-between border-r transition-all duration-300 ${patientSidebarCollapsed ? "w-20" : "w-[260px]"} ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <div>
              <div className={`flex h-[72px] items-center ${patientSidebarCollapsed ? "justify-center" : "justify-between"} transition-all duration-300 gap-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-6`}>
                <div className={`flex items-center gap-3 transition-all duration-300 ${patientSidebarCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
                  <Activity className="text-teal-600 flex-shrink-0" size={28} />
                  <h1 className="text-[30px] font-semibold tracking-tight whitespace-nowrap">MediCare</h1>
                </div>
                <button
                  onClick={() => setPatientSidebarCollapsed(!patientSidebarCollapsed)}
                  className={`p-2 rounded-lg transition-all flex-shrink-0 ${darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}
                >
                  <ChevronLeft size={20} style={{ transform: patientSidebarCollapsed ? "scaleX(-1)" : "scaleX(1)", transition: "transform 300ms ease-in-out" }} />
                </button>
              </div>

              <nav className="px-3 py-6">
                <button
                  onClick={() => setActivePage("dashboard")}
                  className={`mb-3 flex w-full items-center ${patientSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "dashboard"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard size={22} />
                  {!patientSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Dashboard</span>}
                </button>

                <button
                  onClick={() => setActivePage("appointments")}
                  className={`mb-3 flex w-full items-center ${patientSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "appointments"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CalendarDays size={22} />
                  {!patientSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>My Appointments</span>}
                </button>

                <button
                  onClick={() => setActivePage("records")}
                  className={`mb-3 flex w-full items-center ${patientSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "records"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileText size={22} />
                  {!patientSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Medical Records</span>}
                </button>

                <button
                  onClick={() => setActivePage("profile")}
                  className={`flex w-full items-center ${patientSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "profile"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <UserCircle size={22} />
                  {!patientSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Profile</span>}
                </button>
              </nav>
            </div>

            <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-4`}>
              <button
                onClick={handleLogout}
                className={`flex w-full items-center ${patientSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${darkMode ? 'text-red-400 hover:bg-red-950' : 'text-red-600 hover:bg-red-50'}`}
              >
                <LogOut size={22} />
                {!patientSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Logout</span>}
              </button>
            </div>
          </aside>

          <main className="flex-1">
            <div className={`flex h-[72px] items-center justify-between border-b transition-colors ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} px-9`}>
              <div className="flex items-center gap-6">
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`rounded-lg p-2 transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <Moon size={20} />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative rounded-lg p-2 transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className={`absolute right-0 top-12 z-50 w-80 rounded-2xl border shadow-lg ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                      <div className={`border-b p-4 flex items-center justify-between ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        <h3 className={`text-[18px] font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => loggedInUser && markAllNotificationsAsRead(loggedInUser.id)}
                            className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className={`p-8 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Loading notifications...
                          </div>
                        ) : notifications.length > 0 ? (
                          notifications.map(notif => {
                            // Get notification styling based on type
                            let notificationIcon = "📌";
                            let bgColor = darkMode ? 'bg-blue-900' : 'bg-blue-50';
                            let borderColor = darkMode ? 'border-slate-700' : 'border-slate-100';
                            
                            switch (notif.type) {
                              case "appointment_status":
                                notificationIcon = "✅";
                                bgColor = darkMode ? "bg-green-900/60" : "bg-green-50/60";
                                borderColor = darkMode ? "border-green-700" : "border-green-100";
                                break;
                              case "medical_record":
                                notificationIcon = "📋";
                                bgColor = darkMode ? "bg-blue-900/60" : "bg-blue-50/60";
                                borderColor = darkMode ? "border-blue-700" : "border-blue-100";
                                break;
                              case "approval":
                                notificationIcon = "👍";
                                bgColor = darkMode ? "bg-purple-900/60" : "bg-purple-50/60";
                                borderColor = darkMode ? "border-purple-700" : "border-purple-100";
                                break;
                              case "appointment_reminder":
                                notificationIcon = "⏰";
                                bgColor = darkMode ? "bg-yellow-900/60" : "bg-yellow-50/60";
                                borderColor = darkMode ? "border-yellow-700" : "border-yellow-100";
                                break;
                              case "profile_update":
                                notificationIcon = "👤";
                                bgColor = darkMode ? "bg-cyan-900/60" : "bg-cyan-50/60";
                                borderColor = darkMode ? "border-cyan-700" : "border-cyan-100";
                                break;
                              case "system":
                                notificationIcon = "⚙️";
                                bgColor = darkMode ? "bg-slate-800/60" : "bg-slate-50/60";
                                borderColor = darkMode ? "border-slate-700" : "border-slate-100";
                                break;
                              default:
                                notificationIcon = "🔔";
                            }
                            
                            return (
                              <div 
                                key={notif.id}
                                onClick={() => !notif.is_read && markNotificationAsRead(notif.id)}
                                className={`cursor-pointer border-b p-4 transition-colors ${
                                  !notif.is_read ? (`${bgColor} hover:opacity-80`) : (darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50')
                                } ${borderColor}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{notif.title}</p>
                                    <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{notif.message}</p>
                                    <p className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                      {new Date(notif.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    {!notif.is_read && (
                                      <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notif.id);
                                      }}
                                      className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}>
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className={`p-8 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            No notifications
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`h-8 w-px transition-colors ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200">
                    <User size={18} className="text-slate-500" />
                  </div>

                  <div>
                    <p className={`text-[18px] font-medium leading-none ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      {loggedInUser.name}
                    </p>
                    <p className={`mt-1 text-sm capitalize ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {loggedInUser.role}
                    </p>
                  </div>

                  <ChevronDown size={18} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
                </div>
              </div>
            </div>

            <div className={`transition-colors ${darkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}>
              {activePage === "dashboard" && renderPatientDashboard()}
              {activePage === "appointments" && renderAppointmentsPage()}
              {activePage === "records" && renderMedicalRecordsPage()}
              {activePage === "profile" && renderProfilePage()}
            </div>
          </main>
        </div>

        {/* Appointment Details Modal */}
        {showAppointmentDetails && selectedDetailType === "appointment" && selectedDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div
              ref={detailsRef}
              className={`w-full max-w-2xl rounded-2xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-xl flex flex-col max-h-[90vh]`}
            >
              <div className={`flex flex-shrink-0 items-center justify-between border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-8 py-6`}>
                <h3 className={`text-[22px] font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Appointment Details</h3>
                <button 
                  onClick={() => setShowAppointmentDetails(false)} 
                  className={`text-2xl transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Appointment Basic Information */}
                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Appointment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Doctor</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {doctors.find((doc) => doc.id === selectedDetail.doctor_id)?.name || `ID ${selectedDetail.doctor_id}`}
                      </p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Specialization</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {doctors.find((doc) => doc.id === selectedDetail.doctor_id)?.specialty || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Appointment Date</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {selectedDetail.date
                          ? new Date(selectedDetail.date).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Time</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.time || "N/A"}</p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Appointment Type</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.type || "Consultation"}</p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Status</label>
                      <div className="mt-2">
                        <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                          selectedDetail.status === "Pending"
                            ? darkMode ? "bg-amber-900 text-amber-200" : "bg-amber-100 text-amber-700"
                            : selectedDetail.status === "Cancelled"
                            ? darkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-700"
                            : darkMode ? "bg-emerald-900 text-emerald-200" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {selectedDetail.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes / Description */}
                {selectedDetail.notes && (
                  <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} pt-6`}>
                    <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Notes</label>
                    <p className={`text-base mt-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{selectedDetail.notes}</p>
                  </div>
                )}

                {/* Additional Details */}
                <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} pt-6`}>
                  <h4 className={`text-[16px] font-bold mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Appointment ID</h4>
                  <p className={`text-base font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{selectedDetail.id}</p>
                </div>
              </div>

              <div className={`flex flex-shrink-0 gap-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-8 py-6`}>
                <button
                  onClick={() => setShowAppointmentDetails(false)}
                  className={`flex-1 rounded-lg px-4 py-3 font-medium transition ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Medical Records Details Modal */}
        {showAppointmentDetails && selectedDetailType === "record" && selectedDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div
              ref={detailsRef}
              className={`w-full max-w-2xl rounded-2xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-xl flex flex-col max-h-[90vh]`}
            >
              <div className={`flex flex-shrink-0 items-center justify-between border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-8 py-6`}>
                <h3 className={`text-[22px] font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Medical Record Details</h3>
                <button 
                  onClick={() => setShowAppointmentDetails(false)} 
                  className={`text-2xl transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Record Title and Status */}
                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Record Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Title</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {selectedDetail.title || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Status</label>
                      <div className="mt-2">
                        <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                          selectedDetail.status === "Active"
                            ? darkMode ? "bg-amber-900 text-amber-200" : "bg-amber-100 text-amber-700"
                            : selectedDetail.status === "Completed"
                            ? darkMode ? "bg-emerald-900 text-emerald-200" : "bg-emerald-100 text-emerald-700"
                            : darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-700"
                        }`}>
                          {selectedDetail.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Doctor</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        Dr. {doctors.find((doc) => doc.id === selectedDetail.doctor_id)?.name || `ID ${selectedDetail.doctor_id}`}
                      </p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Record Date</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {selectedDetail.record_date
                          ? new Date(selectedDetail.record_date).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Diagnosis */}
                {selectedDetail.diagnosis && (
                  <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} pt-6`}>
                    <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Diagnosis</label>
                    <p className={`text-base mt-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{selectedDetail.diagnosis}</p>
                  </div>
                )}

                {/* Treatment */}
                {selectedDetail.treatment && (
                  <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} pt-6`}>
                    <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Treatment</label>
                    <p className={`text-base mt-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{selectedDetail.treatment}</p>
                  </div>
                )}

                {/* Record ID */}
                <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} pt-6`}>
                  <h4 className={`text-[16px] font-bold mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Record ID</h4>
                  <p className={`text-base font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{selectedDetail.id}</p>
                </div>
              </div>

              <div className={`flex flex-shrink-0 gap-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-8 py-6`}>
                <button
                  onClick={() => downloadMedicalRecord(selectedDetail)}
                  className={`flex-1 rounded-lg px-4 py-3 font-medium transition flex items-center justify-center gap-2 ${
                    darkMode
                      ? 'bg-teal-900/30 text-teal-200 hover:bg-teal-900/50'
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                  }`}
                >
                  <FileText size={18} />
                  Download Record
                </button>
                <button
                  onClick={() => setShowAppointmentDetails(false)}
                  className={`flex-1 rounded-lg px-4 py-3 font-medium transition ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Patient Details Modal - Admin View */}
        {showAppointmentDetails && selectedDetailType === "patient" && selectedDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div
              ref={detailsRef}
              className={`w-full max-w-2xl rounded-2xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-xl flex flex-col max-h-[90vh]`}
            >
              <div className={`flex flex-shrink-0 items-center justify-between border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-8 py-6`}>
                <h3 className={`text-[22px] font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Patient Details</h3>
                <button 
                  onClick={() => setShowAppointmentDetails(false)} 
                  className={`text-2xl transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.name || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Email</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.email || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.phone || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Age</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.age || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Gender</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.gender || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Blood Group</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.blood_group || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Medical Condition</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.condition || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Date of Birth</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.date_of_birth?.split('T')[0] || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Contact Information</h4>
                  <div>
                    <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Address</label>
                    <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.address || "N/A"}</p>
                  </div>
                  <div className="mt-4">
                    <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Emergency Contact</label>
                    <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.emergency_contact || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className={`flex flex-shrink-0 gap-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-8 py-6`}>
                <button
                  onClick={() => setShowAppointmentDetails(false)}
                  className={`flex-1 rounded-lg px-4 py-3 font-medium transition ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Details Modal - Admin View */}
        {showAppointmentDetails && selectedDetailType === "doctor" && selectedDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div
              ref={detailsRef}
              className={`w-full max-w-2xl rounded-2xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-xl flex flex-col max-h-[90vh]`}
            >
              <div className={`flex flex-shrink-0 items-center justify-between border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-8 py-6`}>
                <h3 className={`text-[22px] font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Doctor Details</h3>
                <button 
                  onClick={() => setShowAppointmentDetails(false)} 
                  className={`text-2xl transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Professional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.name || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Email</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.email || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Specialization</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.specialty || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Department</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.department || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Experience</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.experience ? `${selectedDetail.experience} years` : "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Rating</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        <span className="text-yellow-400">★</span> {selectedDetail.rating ? parseFloat(selectedDetail.rating).toFixed(1) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.phone || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Bio</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.bio || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`flex flex-shrink-0 gap-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-8 py-6`}>
                <button
                  onClick={() => setShowAppointmentDetails(false)}
                  className={`flex-1 rounded-lg px-4 py-3 font-medium transition ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (loggedInUser && loggedInUser.role === "admin") {
    return (
      <>
        <div className="flex min-h-screen">
          <aside className={`flex flex-col justify-between border-r transition-all duration-300 ${adminSidebarCollapsed ? "w-20" : "w-[260px]"} ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <div>
              <div className={`flex h-[72px] items-center ${adminSidebarCollapsed ? "justify-center" : "justify-between"} transition-all duration-300 gap-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-6`}>
                <div className={`flex items-center gap-3 transition-all duration-300 ${adminSidebarCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
                  <Activity className="text-teal-600 flex-shrink-0" size={28} />
                  <h1 className="text-[30px] font-semibold tracking-tight whitespace-nowrap">MediCare</h1>
                </div>
                <button
                  onClick={() => setAdminSidebarCollapsed(!adminSidebarCollapsed)}
                  className={`p-2 rounded-lg transition-all flex-shrink-0 ${darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}
                >
                  <ChevronLeft size={20} style={{ transform: adminSidebarCollapsed ? "scaleX(-1)" : "scaleX(1)", transition: "transform 300ms ease-in-out" }} />
                </button>
              </div>

              <nav className="px-3 py-6">
                <button
                  onClick={() => setAdminPage("dashboard")}
                  className={`mb-3 flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "dashboard"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Dashboard</span>}
                </button>

                <button
                  onClick={() => setAdminPage("patients")}
                  className={`mb-3 flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "patients"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Users size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Patients</span>}
                </button>

                <button
                  onClick={() => setAdminPage("doctors")}
                  className={`mb-3 flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "doctors"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <UserCog size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Doctors</span>}
                </button>

                <button
                  onClick={() => setAdminPage("appointments")}
                  className={`mb-3 flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "appointments"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CalendarRange size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Appointments</span>}
                </button>

                <button
                  onClick={() => setAdminPage("history")}
                  className={`mb-3 flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "history"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileHeart size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Medical History</span>}
                </button>

                <button
                  onClick={() => setAdminPage("reports")}
                  className={`mb-3 flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "reports"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BarChart3 size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Reports</span>}
                </button>

                <button
                  onClick={() => setAdminPage("settings")}
                  className={`flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "settings"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Settings size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Settings</span>}
                </button>
              </nav>
            </div>

            <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-4`}>
              <button
                onClick={handleLogout}
                className={`flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${darkMode ? 'text-red-400 hover:bg-red-950' : 'text-red-600 hover:bg-red-50'}`}
              >
                <LogOut size={22} />
                {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Logout</span>}
              </button>
            </div>
          </aside>

          <main className="flex-1">
            <div className={`flex h-[72px] items-center justify-between border-b transition-colors ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} px-9`}>
              <div className="flex items-center gap-6">
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`rounded-lg p-2 transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <Moon size={20} />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative rounded-lg p-2 transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className={`absolute right-0 top-12 z-50 w-80 rounded-2xl border shadow-lg ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                      <div className={`border-b p-4 flex items-center justify-between ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        <h3 className={`text-[18px] font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => loggedInUser && markAllNotificationsAsRead(loggedInUser.id)}
                            className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className={`p-8 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Loading notifications...
                          </div>
                        ) : notifications.length > 0 ? (
                          notifications.map(notif => {
                            // Get notification styling based on type
                            let notificationIcon = "📌";
                            let bgColor = darkMode ? 'bg-blue-900' : 'bg-blue-50';
                            let borderColor = darkMode ? 'border-slate-700' : 'border-slate-100';
                            
                            switch (notif.type) {
                              case "appointment_status":
                                notificationIcon = "✅";
                                bgColor = darkMode ? "bg-green-900/60" : "bg-green-50/60";
                                borderColor = darkMode ? "border-green-700" : "border-green-100";
                                break;
                              case "medical_record":
                                notificationIcon = "📋";
                                bgColor = darkMode ? "bg-blue-900/60" : "bg-blue-50/60";
                                borderColor = darkMode ? "border-blue-700" : "border-blue-100";
                                break;
                              case "approval":
                                notificationIcon = "👍";
                                bgColor = darkMode ? "bg-purple-900/60" : "bg-purple-50/60";
                                borderColor = darkMode ? "border-purple-700" : "border-purple-100";
                                break;
                              case "appointment_reminder":
                                notificationIcon = "⏰";
                                bgColor = darkMode ? "bg-yellow-900/60" : "bg-yellow-50/60";
                                borderColor = darkMode ? "border-yellow-700" : "border-yellow-100";
                                break;
                              case "profile_update":
                                notificationIcon = "👤";
                                bgColor = darkMode ? "bg-cyan-900/60" : "bg-cyan-50/60";
                                borderColor = darkMode ? "border-cyan-700" : "border-cyan-100";
                                break;
                              case "system":
                                notificationIcon = "⚙️";
                                bgColor = darkMode ? "bg-slate-800/60" : "bg-slate-50/60";
                                borderColor = darkMode ? "border-slate-700" : "border-slate-100";
                                break;
                              default:
                                notificationIcon = "🔔";
                            }
                            
                            return (
                              <div 
                                key={notif.id}
                                onClick={() => !notif.is_read && markNotificationAsRead(notif.id)}
                                className={`cursor-pointer border-b p-4 transition-colors ${
                                  !notif.is_read ? (`${bgColor} hover:opacity-80`) : (darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50')
                                } ${borderColor}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{notif.title}</p>
                                    <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{notif.message}</p>
                                    <p className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                      {new Date(notif.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    {!notif.is_read && (
                                      <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notif.id);
                                      }}
                                      className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}>
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className={`p-8 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            No notifications
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-8 w-px bg-slate-200" />

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200">
                    <User size={18} className="text-slate-500" />
                  </div>

                  <div>
                    <p className="text-[18px] font-medium leading-none">
                      {loggedInUser.name}
                    </p>
                    <p className="mt-1 text-sm capitalize text-slate-500">
                      {loggedInUser.role}
                    </p>
                  </div>

                  <ChevronDown size={18} className="text-slate-500" />
                </div>
              </div>
            </div>

            {adminPage === "patients"
              ? renderAdminPatientsPage()
              : adminPage === "dashboard"
              ? renderAdminDashboard()
              : adminPage === "doctors"
              ? renderAdminDoctorsPage()
              : adminPage === "appointments"
              ? renderAdminAppointmentsPage()
              : adminPage === "history"
              ? renderAdminMedicalHistoryPage()
              : adminPage === "reports"
              ? renderAdminReportsPage()
              : renderAdminSettingsPage()}

            {message && (
              <div className="px-9 pb-8">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    isError
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {message}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg max-h-[90vh] overflow-y-auto">
              <h2 className="mb-6 text-[24px] font-bold">
                {addModalType === "appointment" ? "Book Appointment" : editingDoctorId ? "Edit Doctor" : editingPatientId ? "Edit Patient" : `Add ${addModalType.charAt(0).toUpperCase() + addModalType.slice(1)}`}
              </h2>
              
              <div className="space-y-4">
                {addModalType === "appointment" ? (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold">Patient Type</label>
                      <select 
                        value={newUserData.patientType || "registered"}
                        onChange={(e) => setNewUserData({...newUserData, patientType: e.target.value})}
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                      >
                        <option value="registered">Registered Patient</option>
                        <option value="emergency">Emergency / Walk-in Patient</option>
                      </select>
                    </div>

                    {newUserData.patientType === "registered" ? (
                      <div>
                        <label className="mb-2 block text-sm font-semibold">Select Patient</label>
                        <select 
                          value={newUserData.selectedPatientId || ""}
                          onChange={(e) => setNewUserData({...newUserData, selectedPatientId: e.target.value})}
                          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                          required
                        >
                          <option value="">Choose a patient...</option>
                          {adminPatients.map(patient => (
                            <option key={patient.id} value={patient.id}>{patient.name} ({patient.email})</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Patient Full Name"
                          value={newUserData.emergencyPatientName || ""}
                          onChange={(e) => setNewUserData({...newUserData, emergencyPatientName: e.target.value})}
                          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Patient Phone"
                          value={newUserData.emergencyPatientPhone || ""}
                          onChange={(e) => setNewUserData({...newUserData, emergencyPatientPhone: e.target.value})}
                          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                          required
                        />
                      </>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-semibold">Select Doctor</label>
                      <select 
                        value={bookingData.doctorId}
                        onChange={(e) => {
                          console.log("🏥 Doctor selected:", e.target.value);
                          console.log("Doctor option object:", doctors.find(d => d.id == e.target.value));
                          setBookingData({...bookingData, doctorId: e.target.value});
                        }}
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                        required
                      >
                        <option value="">Choose a doctor...</option>
                        {doctors.map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">Appointment Date</label>
                      <input 
                        type="date" 
                        value={bookingData.date}
                        onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                        required 
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">Appointment Time</label>
                      <input 
                        type="time" 
                        value={bookingData.time}
                        onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                        required 
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">Appointment Type</label>
                      <select 
                        value={bookingData.type}
                        onChange={(e) => setBookingData({...bookingData, type: e.target.value})}
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Checkup">Checkup</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                    </div>
                  </>
) : (
                  <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                />
                {!editingDoctorId && !editingPatientId && (
                  <input
                    type="password"
                    placeholder="Password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                  />
                )}
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                />
                {(editingPatientId || addModalType === "patient") && (
                  <>
                    <input
                      type="number"
                      placeholder="Age"
                      value={newUserData.age}
                      onChange={(e) => setNewUserData({...newUserData, age: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                      min="0"
                      max="150"
                    />
                    <select
                      value={newUserData.gender}
                      onChange={(e) => setNewUserData({...newUserData, gender: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <select
                      value={newUserData.blood_group}
                      onChange={(e) => setNewUserData({...newUserData, blood_group: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Medical Condition"
                      value={newUserData.condition}
                      onChange={(e) => setNewUserData({...newUserData, condition: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    />
                  </>
                )}
                {addModalType === "doctor" && !editingPatientId && (
                  <input
                    type="text"
                    placeholder="Specialty"
                    value={newUserData.specialty}
                    onChange={(e) => setNewUserData({...newUserData, specialty: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                  />
                )}
                  </>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddModalType("");
                    setEditingDoctorId(null);
                    setEditingPatientId(null);
                    setNewUserData({ name: "", email: "", password: "", phone: "", role: "patient", specialty: "", age: "", gender: "", blood_group: "", condition: "", date_of_birth: "", address: "", emergency_contact: "", patientType: "registered", selectedPatientId: "", emergencyPatientName: "", emergencyPatientPhone: "" });
                    setBookingData({ doctorId: "", date: "", time: "", type: "Consultation" });
                  }}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log("📌 Modal button clicked. addModalType =", addModalType);
                    console.log("Will call:", addModalType === "appointment" ? "handleBookAdminAppointment" : "handleAddUser");
                    if (addModalType === "appointment") {
                      handleBookAdminAppointment();
                    } else {
                      handleAddUser();
                    }
                  }}
                  className="flex-1 rounded-lg bg-teal-600 px-4 py-3 font-medium text-white hover:bg-teal-700"
                >
                  {addModalType === "appointment" ? "Book Appointment" : editingPatientId ? "Save" : addModalType === "patient" ? "Save" : `Add ${addModalType.charAt(0).toUpperCase() + addModalType.slice(1)}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Patient Details Modal - Admin View */}
        {showAppointmentDetails && selectedDetailType === "patient" && selectedDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div
              ref={detailsRef}
              className={`w-full max-w-2xl rounded-2xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-xl flex flex-col max-h-[90vh]`}
            >
              <div className={`flex flex-shrink-0 items-center justify-between border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-8 py-6`}>
                <h3 className={`text-[22px] font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Patient Details</h3>
                <button 
                  onClick={() => setShowAppointmentDetails(false)} 
                  className={`text-2xl transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.name || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Email</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.email || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.phone || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Age</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.age || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Gender</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.gender || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Blood Group</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.blood_group || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Medical Condition</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.condition || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Date of Birth</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.date_of_birth?.split('T')[0] || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Contact Information</h4>
                  <div>
                    <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Address</label>
                    <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.address || "N/A"}</p>
                  </div>
                  <div className="mt-4">
                    <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Emergency Contact</label>
                    <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.emergency_contact || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className={`flex flex-shrink-0 gap-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-8 py-6`}>
                <button
                  onClick={() => setShowAppointmentDetails(false)}
                  className={`flex-1 rounded-lg px-4 py-3 font-medium transition ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Details Modal - Admin View */}
        {showAppointmentDetails && selectedDetailType === "doctor" && selectedDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div
              ref={detailsRef}
              className={`w-full max-w-2xl rounded-2xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-xl flex flex-col max-h-[90vh]`}
            >
              <div className={`flex flex-shrink-0 items-center justify-between border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-8 py-6`}>
                <h3 className={`text-[22px] font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Doctor Details</h3>
                <button 
                  onClick={() => setShowAppointmentDetails(false)} 
                  className={`text-2xl transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Professional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.name || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Email</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.email || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Specialization</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.specialty || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Department</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.department || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Experience</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.experience ? `${selectedDetail.experience} years` : "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Rating</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        <span className="text-yellow-400">★</span> {selectedDetail.rating ? parseFloat(selectedDetail.rating).toFixed(1) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.phone || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Bio</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.bio || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`flex flex-shrink-0 gap-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-8 py-6`}>
                <button
                  onClick={() => setShowAppointmentDetails(false)}
                  className={`flex-1 rounded-lg px-4 py-3 font-medium transition ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-slate-100 via-teal-50 to-blue-100 px-4">
      <div className="w-full max-w-[460px] rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
        <div className="flex flex-col items-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100">
            <Activity className="text-teal-600" size={28} />
          </div>

          <h1 className="text-[22px] font-semibold text-gray-900">
            MediCare Portal
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {showForgotPassword
              ? "Reset your password"
              : isLogin
              ? "Sign in to access your dashboard"
              : "Create an account to continue"}
          </p>
        </div>

        {!showForgotPassword && (
          <div className="mt-6 flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => {
                setIsLogin(true);
                setShowForgotPassword(false);
                setMessage("");
              }}
              className={`w-1/2 rounded-md py-2 text-sm font-medium transition ${
                isLogin ? "bg-white shadow text-teal-600" : "text-gray-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setShowForgotPassword(false);
                setMessage("");
              }}
              className={`w-1/2 rounded-md py-2 text-sm font-medium transition ${
                !isLogin ? "bg-white shadow text-teal-600" : "text-gray-600"
              }`}
            >
              Register
            </button>
          </div>
        )}

        {message && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
              isError
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="mt-6">
            <div className="mt-1">
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Email Address
              </label>
              <div className="flex items-center rounded-lg border border-gray-300 px-3 py-3">
                <Mail size={18} className="mr-3 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={forgotData.email}
                  onChange={handleForgotChange}
                  placeholder="Enter your email"
                  className="w-full outline-none placeholder:text-gray-400"
                />
              </div>
              <p className="mt-3 text-sm text-gray-500">
                {forgotStep === "request"
                  ? "Enter your email to request a password reset token."
                  : "Enter the reset token you received and choose a new password."}
              </p>
            </div>

            {forgotStep === "reset" && (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Reset Token
                </label>
                <div className="flex items-center rounded-lg border border-gray-300 px-3 py-3">
                  <Lock size={18} className="mr-3 text-gray-400" />
                  <input
                    type="text"
                    name="token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste your reset token"
                    className="w-full outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}

            {forgotStep === "reset" && (
              <>
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-gray-800">
                    New Password
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-300 px-3 py-3">
                    <Lock size={18} className="mr-3 text-gray-400" />
                    <input
                      type="password"
                      name="newPassword"
                      value={forgotData.newPassword}
                      onChange={handleForgotChange}
                      placeholder="Enter new password"
                      className="w-full outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-gray-800">
                    Confirm New Password
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-300 px-3 py-3">
                    <Lock size={18} className="mr-3 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={forgotData.confirmPassword}
                      onChange={handleForgotChange}
                      placeholder="Confirm new password"
                      className="w-full outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </>
            )}

            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 text-white transition hover:bg-teal-700">
              {forgotStep === "request" ? "Request Reset Token" : "Reset Password"}
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setIsLogin(true);
                setMessage("");
                setForgotStep("request");
                setResetToken("");
              }}
              className="mt-3 w-full rounded-lg border border-gray-300 py-3 text-gray-700 transition hover:bg-gray-50"
            >
              Back to Login
            </button>
          </form>
        ) : isLogin ? (
          <form onSubmit={handleLogin} className="mt-6">
            <p className="mb-5 text-sm text-gray-600">
              Signing in will use the account role assigned by the server.
            </p>
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Email Address
              </label>
              <div className="flex items-center rounded-lg border border-gray-300 px-3 py-3">
                <Mail size={18} className="mr-3 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="patient@hospital.com"
                  className="w-full outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Password
              </label>
              <div className="flex items-center rounded-lg border border-gray-300 px-3 py-3">
                <Lock size={18} className="mr-3 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="••••••••"
                  className="w-full outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="h-4 w-4" />
                Remember me
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setMessage("");
                }}
                className="text-teal-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 text-white transition hover:bg-teal-700">
              Sign In
              <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-6">
            <p className="mb-5 text-sm text-gray-600">
              Registration creates only a patient account. Admin and doctor accounts must be provisioned securely.
            </p>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Full Name
              </label>
              <div className="flex items-center rounded-lg border border-gray-300 px-3 py-3">
                <User size={18} className="mr-3 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  placeholder="Enter your name"
                  required
                  className="w-full outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Email Address
              </label>
              <div className="flex items-center rounded-lg border border-gray-300 px-3 py-3">
                <Mail size={18} className="mr-3 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="Enter your email"
                  required
                  className="w-full outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Password
              </label>
              <div className="flex items-center rounded-lg border border-gray-300 px-3 py-3">
                <Lock size={18} className="mr-3 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  placeholder="Create password"
                  required
                  className="w-full outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 text-white transition hover:bg-teal-700">
              Register
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
