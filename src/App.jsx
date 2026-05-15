import { useEffect, useRef, useState } from "react";
import { Suspense, lazy } from "react";
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
  Sun,
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
  Shield,
  Settings,
  Filter,
  Pencil,
  Trash2,
  MoreVertical,
  Eye,
  EyeOff,
  Phone,
  Info,
  X,
} from "lucide-react";
import SuccessPopup from "./SuccessPopup";
import { buildReportAnalytics } from "./reportUtils";
import { downloadWordDocument } from "./wordExport";

const DoctorDashboard = lazy(() => import("./DoctorDashboard"));
const SimpleDoctorList = lazy(() => import("./SimpleDoctorList"));
const SimpleAppointmentBooking = lazy(() => import("./SimpleAppointmentBooking"));
const ACTIVE_MEDICAL_RECORD_STATUSES = ["Ongoing", "Critical"];
const DOCTOR_SCHEDULE_START_HOUR = 8;
const DOCTOR_SCHEDULE_END_HOUR = 24;
const DOCTOR_SPECIALIZATIONS = [
  "Allergy and Immunology",
  "Anesthesiology",
  "Cardiology",
  "Dermatology",
  "Emergency Medicine",
  "Endocrinology",
  "Family Medicine",
  "Gastroenterology",
  "General Medicine",
  "General Surgery",
  "Geriatrics",
  "Hematology",
  "Infectious Disease",
  "Internal Medicine",
  "Nephrology",
  "Neurology",
  "Obstetrics and Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Otolaryngology",
  "Pathology",
  "Pediatrics",
  "Physical Medicine and Rehabilitation",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Urology",
];

const formatGeneratedTimestamp = () =>
  new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

const getMedicalRecordStatusBadgeClass = (status, darkMode = false) => {
  if (status === "Critical") {
    return darkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-700";
  }
  if (status === "Recovered") {
    return darkMode ? "bg-emerald-900 text-emerald-200" : "bg-emerald-100 text-emerald-700";
  }
  if (status === "Stable") {
    return darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-700";
  }
  if (status === "Ongoing") {
    return darkMode ? "bg-amber-900 text-amber-200" : "bg-amber-100 text-amber-700";
  }

  return darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700";
};

const getDoctorAvailabilityStatus = (darkMode = false, now = new Date()) => {
  const day = now.getDay();
  if (day === 0 || day === 6) {
    return {
      label: "On Leave",
      classes: darkMode ? "bg-amber-900 text-amber-200" : "bg-amber-100 text-amber-700",
    };
  }

  const hour = now.getHours();
  if (hour >= DOCTOR_SCHEDULE_START_HOUR && hour < DOCTOR_SCHEDULE_END_HOUR) {
    return {
      label: "Available",
      classes: darkMode ? "bg-emerald-900 text-emerald-200" : "bg-emerald-100 text-emerald-700",
    };
  }

  return {
    label: "Off Duty",
    classes: darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700",
  };
};

export default function App() {
  const formatDateForInput = (value) => {
    if (!value) return "";
    if (typeof value === "string") {
      const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
      return match ? match[1] : value;
    }
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const formatDateForDisplay = (value) => {
    const normalizedValue = formatDateForInput(value);
    if (!normalizedValue) return "Not set";

    const parsedDate = new Date(`${normalizedValue}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return normalizedValue;

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [successPopup, setSuccessPopup] = useState({
    open: false,
    title: "Success!",
    message: "",
  });
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [, setToken] = useState(localStorage.getItem("authToken") || "");
  const [activePage, setActivePage] = useState("dashboard");
  const [adminPage, setAdminPage] = useState("dashboard");
  const [patientSidebarCollapsed, setPatientSidebarCollapsed] = useState(true);
  const [adminSidebarCollapsed, setAdminSidebarCollapsed] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const notificationsRef = useRef(null);
  const detailsRef = useRef(null);
  const bookingModalRef = useRef(null);
  const accountMenuRef = useRef(null);

  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [recordMonthSearch, setRecordMonthSearch] = useState("");
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
  const adminPendingAppointmentsCount =
    adminAppointments.length > 0
      ? adminAppointments.filter((apt) => (apt.status || "Pending").toLowerCase() === "pending").length
      : Number(adminStats.pendingAppointments || 0);
  const adminPendingAppointmentsBadge =
    adminPendingAppointmentsCount > 99 ? "99+" : adminPendingAppointmentsCount;
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
    department: "",
    yearsExperience: "",
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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    doctorId: "",
    date: "",
    time: "",
    type: "Follow-up",
  });
  const [doctorUnavailableDates] = useState([]);
  const [, setSelectedSlot] = useState(null); // For availability system
  const [bookingSpecialty, setBookingSpecialty] = useState(""); // For availability system
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
  const [showAccountMenu, setShowAccountMenu] = useState(false);

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
  const [showPatientPasswordModal, setShowPatientPasswordModal] = useState(false);
  const [selectedPatientForPassword, setSelectedPatientForPassword] = useState(null);
  const [showDoctorPasswordModal, setShowDoctorPasswordModal] = useState(false);
  const [selectedDoctorForPassword, setSelectedDoctorForPassword] = useState(null);
  const [adminResetPasswordData, setAdminResetPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [adminResetPasswordLoading, setAdminResetPasswordLoading] = useState(false);
  const [showAdminResetPassword, setShowAdminResetPassword] = useState(false);
  const [openPatientActionsMenuId, setOpenPatientActionsMenuId] = useState(null);
  const [openDoctorActionsMenuId, setOpenDoctorActionsMenuId] = useState(null);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [registerData, setRegisterData] = useState({
    role: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    specialty: "",
    department: "",
    yearsExperience: "",
    bio: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);

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
    const pageBackground = darkMode ? "#0f172a" : "#ffffff";
    document.documentElement.style.backgroundColor = pageBackground;
    document.body.style.backgroundColor = pageBackground;
  }, [darkMode]);

  const showSuccessPopup = (popupMessage, title = "Success!") => {
    if (!popupMessage) return;

    setSuccessPopup({
      open: true,
      title,
      message: popupMessage,
    });
  };

  const closeSuccessPopup = () => {
    setSuccessPopup((prev) => ({ ...prev, open: false }));
  };

  const resetBookingModal = () => {
    setShowBookingModal(false);
    setBookingData({ doctorId: "", date: "", time: "", type: "Follow-up" });
    setSelectedSlot(null);
    setBookingSpecialty("");
    setMessage("");
  };

  useEffect(() => {
    const closeMenu = () => setOpenPatientActionsMenuId(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

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
      if (showBookingModal && bookingModalRef.current && !bookingModalRef.current.contains(event.target)) {
        resetBookingModal();
      }
      if (showAccountMenu && accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowAppointmentDetails(false);
        setSelectedDetail(null);
        setSelectedDetailType("");
        if (showBookingModal) {
          resetBookingModal();
        }
        setShowAccountMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showNotifications, showAppointmentDetails, showBookingModal, showAccountMenu]);

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

  const sortByNewestDate = (items = [], key) =>
    [...items].sort((a, b) => new Date(b?.[key] || 0) - new Date(a?.[key] || 0));

  const toDateOnly = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const attachPrescriptionsToRecords = (records = [], prescriptions = []) => {
    const preparedRecords = records.map((record) => ({
      ...record,
      linkedPrescriptions: [],
    }));

    // Attach each prescription to exactly one best-fit record so records stay separate.
    prescriptions.forEach((prescription) => {
      // Preferred linking path: explicit medical_record_id from backend.
      if (prescription.medical_record_id) {
        const explicitRecord = preparedRecords.find(
          (record) => String(record.id) === String(prescription.medical_record_id)
        );
        if (explicitRecord) {
          explicitRecord.linkedPrescriptions.push(prescription);
          return;
        }
      }

      const prescriptionDate = toDateOnly(prescription.prescribed_date || prescription.created_at);
      const sameDoctorRecords = preparedRecords.filter(
        (record) => String(record.doctor_id) === String(prescription.doctor_id)
      );

      if (sameDoctorRecords.length === 0) return;

      let targetRecord = null;

      if (prescriptionDate) {
        const eligibleRecords = sameDoctorRecords
          .filter((record) => {
            const recordDate = toDateOnly(record.record_date || record.created_at);
            return recordDate && recordDate.getTime() <= prescriptionDate.getTime();
          })
          .sort((a, b) => {
            const aDate = toDateOnly(a.record_date || a.created_at)?.getTime() || 0;
            const bDate = toDateOnly(b.record_date || b.created_at)?.getTime() || 0;
            return bDate - aDate;
          });

        targetRecord = eligibleRecords[0] || null;
      }

      // Fallback: attach to latest record by the same doctor.
      if (!targetRecord) {
        targetRecord = [...sameDoctorRecords].sort(
          (a, b) =>
            new Date(b.record_date || b.created_at || 0) - new Date(a.record_date || a.created_at || 0)
        )[0];
      }

      if (targetRecord) {
        targetRecord.linkedPrescriptions.push(prescription);
      }
    });

    return preparedRecords;
  };

  const fetchPatientData = async () => {
    try {
      const [aptsRes, recordsRes, prescriptionsRes, doctorsRes] = await Promise.all([
        api.get(`/appointments/${loggedInUser.id}`),
        api.get(`/medical-records/${loggedInUser.id}`),
        api.get(`/prescriptions-patient/${loggedInUser.id}`),
        api.get("/doctors"),
      ]);

      const appointmentsData = aptsRes.data.appointments || [];
      const recordsData = sortByNewestDate(recordsRes.data.records || [], "record_date");
      const prescriptionsData = sortByNewestDate(
        prescriptionsRes.data.prescriptions || [],
        "prescribed_date"
      );
      const doctorsData = doctorsRes.data.doctors || [];

      setAppointments(appointmentsData);
      setPatientPrescriptions(prescriptionsData);
      setMedicalRecords(attachPrescriptionsToRecords(recordsData, prescriptionsData));
      setDoctors(doctorsData);

      setProfileData({
        name: loggedInUser.name || "",
        email: loggedInUser.email || "",
        phone: loggedInUser.phone || "",
        bloodGroup: loggedInUser.bloodGroup || "",
        age: loggedInUser.age || "",
        gender: loggedInUser.gender || "",
        dateOfBirth: formatDateForInput(loggedInUser.dateOfBirth),
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

  const getNotificationDestination = (notification) => {
    const type = notification?.type;
    const role = loggedInUser?.role;

    if (role === "admin") {
      switch (type) {
        case "appointment":
        case "appointment_status":
        case "appointment_reminder":
          return { section: "admin", page: "appointments" };
        case "medical_record":
        case "prescription":
        case "approval":
          return { section: "admin", page: "history" };
        case "profile_update":
        case "system":
          return { section: "admin", page: "settings" };
        default:
          return { section: "admin", page: "dashboard" };
      }
    }

    switch (type) {
      case "appointment":
      case "appointment_status":
      case "appointment_reminder":
        return { section: "patient", page: "appointments" };
      case "medical_record":
      case "approval":
        return { section: "patient", page: "records" };
      case "prescription":
        return { section: "patient", page: "prescriptions" };
      case "profile_update":
        return { section: "patient", page: "profile" };
      default:
        return { section: "patient", page: "dashboard" };
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification) return;

    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }

    const destination = getNotificationDestination(notification);
    setShowNotifications(false);
    setShowAppointmentDetails(false);
    setSelectedDetail(null);
    setSelectedDetailType("");

    if (destination.section === "admin") {
      setAdminPage(destination.page);
      return;
    }

    setActivePage(destination.page);
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
      const [statsRes, patientsRes, doctorsRes, recordsRes, appointmentsRes] = await Promise.allSettled([
        api.get("/admin/stats"),
        api.get("/patients"),
        api.get("/doctors"),
        api.get("/admin/medical-records"),
        api.get("/admin/appointments"),
      ]);

      if (statsRes.status === "fulfilled") {
        setAdminStats(statsRes.value.data.stats || {});
      } else {
        console.error("Error fetching admin stats:", statsRes.reason);
      }

      if (patientsRes.status === "fulfilled") {
        setAdminPatients(patientsRes.value.data.patients || []);
      } else {
        console.error("Error fetching admin patients:", patientsRes.reason);
        setAdminPatients([]);
      }

      if (doctorsRes.status === "fulfilled") {
        console.log("Doctors API Response:", doctorsRes.value.data.doctors);
        setDoctors(doctorsRes.value.data.doctors || []);
      } else {
        console.error("Error fetching admin doctors:", doctorsRes.reason);
        setDoctors([]);
      }

      if (recordsRes.status === "fulfilled") {
        setAdminMedicalRecords(recordsRes.value.data.records || []);
      } else {
        console.error("Error fetching admin medical records:", recordsRes.reason);
        setAdminMedicalRecords([]);
      }

      if (appointmentsRes.status === "fulfilled") {
        console.log("Appointments API Response:", appointmentsRes.value.data);
        setAdminAppointments(appointmentsRes.value.data.appointments || []);
      } else {
        console.warn("Couldn't fetch appointments:", appointmentsRes.reason);
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

  const formatNotificationTimestamp = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const isSameDay = date.toDateString() === now.toDateString();

      if (isSameDay) {
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }

      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (err) {
      return dateString;
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!bookingData.doctorId || !bookingData.date || !bookingData.time) {
      setIsError(true);
      setMessage("❌ Please fill all appointment fields");
      return;
    }

    // Check if doctor is available on selected date
    if (doctorUnavailableDates.includes(bookingData.date)) {
      setIsError(true);
      setMessage("❌ Doctor is not available on this date");
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
            message: `${patientName} has booked an appointment with you on ${formatDateForDisplay(bookingData.date)} at ${formatTime(bookingData.time)}`,
            relatedId: res.data.appointmentId,
            relatedType: "appointment",
          });
        } catch (err) {
          console.error("Error sending booking notification to doctor:", err);
        }
      }
      
      setIsError(false);
      showSuccessPopup("Appointment Booked Successfully");
      resetBookingModal();
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
      await api.put(`/appointments/${appointmentId}`, { status: "Cancelled" });
      setIsError(false);
      showSuccessPopup("Appointment Cancelled Successfully");
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
    const trimmedDateOfBirth = profileData.dateOfBirth || null;
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
      showSuccessPopup("Successfully edited profile.");
      setLoggedInUser((prev) => ({ ...prev, ...(res.data.user || updateData) }));
      setEditingProfile(false);
    } catch (err) {
      console.error("Error updating profile:", err.response || err);
      setIsError(true);
      setMessage(err.response?.data?.message || "❌ Failed to update profile");
    }
  };

  const downloadMedicalRecord = (record) => {
    const generatedAt = formatGeneratedTimestamp();

    downloadWordDocument(
      `${record.title || "medical-record"}.doc`,
      "Medical Record",
      `
        <h1>Medical Record</h1>
        <p class="muted"><strong>Generated on:</strong> ${generatedAt}</p>
        <div class="card">
          <p><strong>Title:</strong> ${record.title || "N/A"}</p>
          <p><strong>Diagnosis:</strong> ${record.diagnosis || "N/A"}</p>
          <p><strong>Treatment:</strong> ${record.treatment || "N/A"}</p>
          <p><strong>Date:</strong> ${record.record_date ? formatDateForDisplay(record.record_date) : "N/A"}</p>
          <p><strong>Status:</strong> ${record.status || "N/A"}</p>
        </div>
      `
    );
    showSuccessPopup("Report Generated Successfully");
  };

  const downloadAllRecords = () => {
    if (medicalRecords.length === 0) {
      alert("No medical records to download");
      return;
    }

    const generatedAt = formatGeneratedTimestamp();
    const recordsHtml = medicalRecords
      .map(
        (record, index) => `
          <div class="card">
            <h2>Record ${index + 1}</h2>
            <p><strong>Title:</strong> ${record.title || "N/A"}</p>
            <p><strong>Diagnosis:</strong> ${record.diagnosis || "N/A"}</p>
            <p><strong>Treatment:</strong> ${record.treatment || "N/A"}</p>
            <p><strong>Doctor:</strong> Dr. ${doctors.find((doc) => doc.id === record.doctor_id)?.name || `ID ${record.doctor_id}`}</p>
            <p><strong>Date:</strong> ${record.record_date ? formatDateForDisplay(record.record_date) : "N/A"}</p>
            <p><strong>Status:</strong> ${record.status || "N/A"}</p>
          </div>
        `
      )
      .join("");

    downloadWordDocument(
      `medical-records-${new Date().toISOString().split("T")[0]}.doc`,
      "Complete Medical Records",
      `
        <h1>Complete Medical Records</h1>
        <p class="muted"><strong>Patient:</strong> ${loggedInUser.name}</p>
        <p class="muted"><strong>Generated on:</strong> ${generatedAt}</p>
        <p class="muted"><strong>Total Records:</strong> ${medicalRecords.length}</p>
        <div class="divider"></div>
        ${recordsHtml}
      `
    );
    showSuccessPopup("Report Generated Successfully");
  };

  const downloadPatientPrescriptions = () => {
    if (patientPrescriptions.length === 0) {
      alert("No prescriptions to download");
      return;
    }

    const generatedAt = formatGeneratedTimestamp();
    const prescriptionsHtml = patientPrescriptions
      .map((prescription, index) => {
        const doctorName =
          prescription.doctor_name ||
          doctors.find((doc) => String(doc.id) === String(prescription.doctor_id))?.name ||
          `ID ${prescription.doctor_id || "N/A"}`;
        const prescriptionDate = prescription.prescribed_date || prescription.created_at;

        return `
          <div class="card">
            <h2>Prescription ${index + 1}</h2>
            <p><strong>Medication:</strong> ${prescription.medication || "N/A"}</p>
            <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p><strong>Dosage:</strong> ${prescription.dosage || "N/A"}</p>
            <p><strong>Frequency:</strong> ${prescription.frequency || "N/A"}</p>
            <p><strong>Duration:</strong> ${prescription.duration || "N/A"}</p>
            <p><strong>Instructions:</strong> ${prescription.instructions || "N/A"}</p>
            <p><strong>Date:</strong> ${
              prescriptionDate
                ? new Date(prescriptionDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "N/A"
            }</p>
          </div>
        `;
      })
      .join("");

    downloadWordDocument(
      `prescriptions-${new Date().toISOString().split("T")[0]}.doc`,
      "Generated Prescriptions",
      `
        <h1>Generated Prescriptions</h1>
        <p class="muted"><strong>Patient:</strong> ${loggedInUser.name}</p>
        <p class="muted"><strong>Generated on:</strong> ${generatedAt}</p>
        <p class="muted"><strong>Total Prescriptions:</strong> ${patientPrescriptions.length}</p>
        <div class="divider"></div>
        ${prescriptionsHtml}
      `
    );
    showSuccessPopup("Prescriptions Generated Successfully");
  };

  const generateAdminReport = (
    analytics = buildReportAnalytics({
      period: demographicsPeriod,
      adminAppointments,
      adminMedicalRecords,
      adminPatients,
      doctors,
    })
  ) => {
    const reportDate = formatGeneratedTimestamp();

    let report = "MEDICARE PORTAL - COMPREHENSIVE ADMIN REPORT\n";
    report += "=" .repeat(70) + "\n\n";
    report += `Generated on: ${reportDate}\n`;
    report += `Report Type: Healthcare System Operations Summary\n`;
    report += "\n" + "=" .repeat(70) + "\n";

    // 1. Executive Summary
    report += "\n1. EXECUTIVE SUMMARY\n";
    report += "-".repeat(70) + "\n";
    report += `Selected Period: ${analytics.period}\n`;
    report += `Total Patients: ${adminPatients.length}\n`;
    report += `Total Doctors: ${analytics.totalDoctors}\n`;
    report += `Total Appointments: ${analytics.totalAppointments}\n`;
    report += `Total Medical Records: ${analytics.filteredRecords.length}\n`;
    report += `Pending Appointments: ${analytics.filteredAppointments.filter(a => a.status === 'Pending').length}\n`;
    report += `Completed Appointments: ${analytics.filteredAppointments.filter(a => a.status === 'Completed').length}\n`;
    report += `Cancelled Appointments: ${analytics.filteredAppointments.filter(a => a.status === 'Cancelled').length}\n`;

    // 2. Appointment Statistics
    report += "\n" + "=" .repeat(70) + "\n";
    report += "\n2. APPOINTMENT STATISTICS\n";
    report += "-".repeat(70) + "\n";
    Object.entries(analytics.appointmentTypeData).forEach(([type, count]) => {
      report += `${type}: ${count} appointments\n`;
    });

    // 3. Patient Demographics
    report += "\n" + "=" .repeat(70) + "\n";
    report += "\n3. PATIENT DEMOGRAPHICS\n";
    report += "-".repeat(70) + "\n";
    const topConditions = Object.entries(analytics.conditionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    topConditions.forEach(([condition, count]) => {
      const percentage = adminPatients.length
        ? ((count / adminPatients.length) * 100).toFixed(1)
        : "0.0";
      report += `${condition}: ${count} patients (${percentage}%)\n`;
    });

    // 4. Doctor Statistics
    report += "\n" + "=" .repeat(70) + "\n";
    report += "\n4. DOCTOR STATISTICS\n";
    report += "-".repeat(70) + "\n";
    doctors.forEach(doctor => {
      const appointmentCount = analytics.filteredAppointments.filter(a => a.doctor_id === doctor.id).length;
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
    const recentAppointments = [...analytics.filteredAppointments]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 10);
    recentAppointments.forEach((apt, index) => {
      const patient = adminPatients.find(p => p.id === apt.patient_id);
      const doctor = doctors.find(d => d.id === apt.doctor_id);
      report += `\n${index + 1}. ${patient?.name || "Unknown Patient"} → Dr. ${doctor?.name || "Unknown Doctor"}\n`;
      report += `   Date: ${apt.date ? formatDateForDisplay(apt.date) : "N/A"} | Time: ${apt.time ? formatTime(apt.time) : "N/A"}\n`;
      report += `   Type: ${apt.type || "Consultation"} | Status: ${apt.status}\n`;
    });

    // 6. Active Medical Records
    report += "\n" + "=" .repeat(70) + "\n";
    report += "\n6. ACTIVE MEDICAL CONDITIONS\n";
    report += "-".repeat(70) + "\n";
    const activeMedicalRecords = analytics.filteredRecords
      .filter((record) => ACTIVE_MEDICAL_RECORD_STATUSES.includes(record.status))
      .slice(-10);
    activeMedicalRecords.forEach((record, index) => {
      const patient = adminPatients.find(p => p.id === record.patient_id);
      const doctor = doctors.find(d => d.id === record.doctor_id);
      report += `\n${index + 1}. ${record.title || record.diagnosis || "Medical Record"}\n`;
      report += `   Patient: ${patient?.name || "Unknown"}\n`;
      report += `   Doctor: Dr. ${doctor?.name || "Unknown"}\n`;
      report += `   Diagnosis: ${record.diagnosis || "N/A"}\n`;
      report += `   Treatment: ${record.treatment || "N/A"}\n`;
      report += `   Date: ${record.record_date ? formatDateForDisplay(record.record_date) : "N/A"}\n`;
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
    downloadWordDocument(
      `admin-report-${new Date().toISOString().split("T")[0]}.doc`,
      "Admin Report",
      `
        <h1>Medicare Portal - Comprehensive Admin Report</h1>
        <p class="muted">Generated on: ${reportDate}</p>
        <p class="muted">Report Type: Healthcare System Operations Summary</p>
        <div class="card"><pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${report}</pre></div>
      `
    );
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

    const { role, name, email, phone, password, specialty, department, yearsExperience, bio } = registerData;
    const trimmedRole = role.trim();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();
    const trimmedSpecialty = specialty.trim();
    const trimmedDepartment = department.trim();
    const trimmedYearsExperience = yearsExperience.toString().trim();
    const trimmedBio = bio.trim();

    if (!trimmedRole) {
      setIsError(true);
      setMessage("❌ Role is required.");
      return;
    }

    if (!trimmedName) {
      setIsError(true);
      setMessage("❌ Full name is required.");
      return;
    }

    if (!trimmedEmail) {
      setIsError(true);
      setMessage("❌ Email address is required.");
      return;
    }

    if (!trimmedPhone) {
      setIsError(true);
      setMessage("❌ Phone number is required.");
      return;
    }

    if (!trimmedPassword) {
      setIsError(true);
      setMessage("❌ Password is required.");
      return;
    }

    if (
      trimmedRole === "doctor" &&
      (!trimmedSpecialty || !trimmedDepartment || !trimmedYearsExperience)
    ) {
      setIsError(true);
      setMessage("❌ Please complete all doctor registration fields.");
      return;
    }

    try {
      const res = await api.post("/register", {
        role: trimmedRole,
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password: trimmedPassword,
        specialty: trimmedRole === "doctor" ? trimmedSpecialty : "",
        department: trimmedRole === "doctor" ? trimmedDepartment : "",
        yearsExperience: trimmedRole === "doctor" ? trimmedYearsExperience : "",
        bio: trimmedRole === "doctor" ? trimmedBio : "",
      });
      setIsError(false);
      setMessage(res.data.message || "Registration successful!");
      setRegisterData({
        role: "",
        name: "",
        email: "",
        phone: "",
        password: "",
        specialty: "",
        department: "",
        yearsExperience: "",
        bio: "",
      });
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
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setIsError(true);
      setMessage("❌ Email address is required.");
      return;
    }

    if (!trimmedPassword) {
      setIsError(true);
      setMessage("❌ Password is required.");
      return;
    }

    try {
      const res = await api.post("/login", { email: trimmedEmail, password: trimmedPassword });
      const detectedRole = res.data.user?.role || "user";
      const roleLabel =
        detectedRole === "doctor"
          ? "Doctor"
          : detectedRole === "admin"
          ? "Admin"
          : detectedRole === "patient"
          ? "Patient"
          : "User";

      setAuthToken(res.data.token);
      setToken(res.data.token);
      setLoggedInUser(res.data.user);
      setActivePage("dashboard");
      setAdminPage("dashboard");
      setIsError(false);
      showSuccessPopup(`Logged in successfully as ${roleLabel}.`);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "❌ Login failed");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    const { email } = forgotData;

    if (!email) {
      setIsError(true);
      setMessage("❌ Please enter your email.");
      return;
    }

    try {
      const res = await api.post("/forgot-password/request", { email });
      setIsError(false);
      setMessage(res.data.message || "✅ Reset request sent to admin.");
      setForgotData({ email: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "❌ Failed to request admin reset");
    }
  };

  const handleDeleteUser = async (userId, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        await api.delete(`/users/${userId}`);
        if (type === "patient") {
          showSuccessPopup("Patient Deleted Successfully");
        } else {
          setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
        }
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
        showSuccessPopup("Appointment Deleted Successfully");
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
            message: `${displayPatientName} has booked an appointment with you on ${formatDateForDisplay(bookingData.date)} at ${formatTime(bookingData.time)}`,
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
            message: `Your appointment with Dr. ${doctorName} has been booked for ${formatDateForDisplay(bookingData.date)} at ${formatTime(bookingData.time)}`,
            relatedId: response.data.appointmentId,
            relatedType: "appointment",
          });
        } catch (err) {
          console.error("Error sending booking notification to patient:", err);
        }
      }
      
      showSuccessPopup("Appointment Booked Successfully");
      setIsError(false);
      setShowAddModal(false);
      setAddModalType("");
      setNewUserData({ name: "", email: "", password: "", phone: "", role: "patient", specialty: "", age: "", gender: "", blood_group: "", condition: "", date_of_birth: "", address: "", emergency_contact: "", patientType: "registered", selectedPatientId: "", emergencyPatientName: "", emergencyPatientPhone: "" });
      setBookingData({ doctorId: "", date: "", time: "", type: "Follow-up" });
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
          department: newUserData.department,
          yearsExperience: newUserData.yearsExperience,
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
          address: newUserData.address,
        });
        showSuccessPopup("Patient Updated Successfully");
        setEditingPatientId(null);
      } else {
        // Create new user
        await api.post("/register", {
          name: newUserData.name,
          email: newUserData.email,
          password: newUserData.password,
          role: newUserData.role,
          phone: newUserData.phone,
          specialty: addModalType === "doctor" ? newUserData.specialty : undefined,
          department: addModalType === "doctor" ? newUserData.department : undefined,
          yearsExperience: addModalType === "doctor" ? newUserData.yearsExperience : undefined,
        });
        setMessage(`${addModalType.charAt(0).toUpperCase() + addModalType.slice(1)} added successfully`);
      }
      setIsError(false);
      setShowAddModal(false);
      setNewUserData({ name: "", email: "", password: "", phone: "", role: "patient", specialty: "", department: "", yearsExperience: "", age: "", gender: "", blood_group: "", condition: "", date_of_birth: "", address: "", emergency_contact: "" });
      fetchAdminData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error", true);
      setIsError(true);
    }
  };

  const openPatientPasswordModal = (patient) => {
    setSelectedPatientForPassword(patient);
    setAdminResetPasswordData({ newPassword: "", confirmPassword: "" });
    setShowAdminResetPassword(false);
    setShowPatientPasswordModal(true);
  };

  const openDoctorPasswordModal = (doctor) => {
    setSelectedDoctorForPassword(doctor);
    setAdminResetPasswordData({ newPassword: "", confirmPassword: "" });
    setShowAdminResetPassword(false);
    setShowDoctorPasswordModal(true);
  };

  const handleAdminResetPatientPassword = async () => {
    if (!selectedPatientForPassword?.id) {
      setIsError(true);
      setMessage("❌ No patient selected for password reset");
      return;
    }

    const trimmedNewPassword = adminResetPasswordData.newPassword.trim();
    const trimmedConfirmPassword = adminResetPasswordData.confirmPassword.trim();

    if (!trimmedNewPassword || !trimmedConfirmPassword) {
      setIsError(true);
      setMessage("❌ Please fill both password fields");
      return;
    }

    if (trimmedNewPassword.length < 6) {
      setIsError(true);
      setMessage("❌ Password must be at least 6 characters");
      return;
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setIsError(true);
      setMessage("❌ Passwords do not match");
      return;
    }

    setAdminResetPasswordLoading(true);
    try {
      await api.put(`/users/${selectedPatientForPassword.id}/change-password`, {
        newPassword: trimmedNewPassword,
        confirmPassword: trimmedConfirmPassword,
      });
      setIsError(false);
      showSuccessPopup("Patient Password Updated Successfully");
      setShowPatientPasswordModal(false);
      setSelectedPatientForPassword(null);
      setAdminResetPasswordData({ newPassword: "", confirmPassword: "" });
      setShowAdminResetPassword(false);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "❌ Failed to reset patient password");
    } finally {
      setAdminResetPasswordLoading(false);
    }
  };

  const handleAdminResetDoctorPassword = async () => {
    if (!selectedDoctorForPassword?.id) {
      setIsError(true);
      setMessage("❌ No doctor selected for password reset");
      return;
    }

    const trimmedNewPassword = adminResetPasswordData.newPassword.trim();
    const trimmedConfirmPassword = adminResetPasswordData.confirmPassword.trim();

    if (!trimmedNewPassword || !trimmedConfirmPassword) {
      setIsError(true);
      setMessage("❌ Please fill both password fields");
      return;
    }

    if (trimmedNewPassword.length < 6) {
      setIsError(true);
      setMessage("❌ Password must be at least 6 characters");
      return;
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setIsError(true);
      setMessage("❌ Passwords do not match");
      return;
    }

    setAdminResetPasswordLoading(true);
    try {
      await api.put(`/users/${selectedDoctorForPassword.id}/change-password`, {
        newPassword: trimmedNewPassword,
        confirmPassword: trimmedConfirmPassword,
      });
      setIsError(false);
      setMessage(`✅ Successfully reset the password for Dr. ${selectedDoctorForPassword.name}`);
      setShowDoctorPasswordModal(false);
      setSelectedDoctorForPassword(null);
      setAdminResetPasswordData({ newPassword: "", confirmPassword: "" });
      setShowAdminResetPassword(false);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "❌ Failed to reset doctor password");
    } finally {
      setAdminResetPasswordLoading(false);
    }
  };

  const handleGenerateTemporaryPassword = async () => {
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const passwordLength = 12;
    let generated = "";

    for (let i = 0; i < passwordLength; i += 1) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      generated += charset[randomIndex];
    }

    setAdminResetPasswordData({
      newPassword: generated,
      confirmPassword: generated,
    });

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(generated);
        setIsError(false);
        setMessage("✅ Temporary password generated and copied to clipboard");
        return;
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }

    setIsError(false);
    setMessage("✅ Temporary password generated");
  };

  const handleLogout = () => {
    setShowAccountMenu(false);
    setAuthToken("");
    setToken("");
    setLoggedInUser(null);
    setActivePage("dashboard");
    setAdminPage("dashboard");
    setLoginData({ email: "", password: "" });
    setIsError(false);
    showSuccessPopup("Logged out successfully.");
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
            <p className={`mt-2 text-[18px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Welcome to your patient portal.</p>
          </div>

          <button
            onClick={() => setActivePage("appointments")}
            className="flex items-center gap-3 rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700"
          >
            <CalendarPlus size={20} />
            <span>Book Appointment</span>
          </button>
        </div>

        <div className="rounded-[28px] bg-gradient-to-r from-teal-700 to-emerald-800 p-9 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${
                nextAppointment 
                  ? 'bg-white/12 text-white' 
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
                <div className="rounded-2xl border border-white/20 bg-white/8 p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/14">
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
          <div className={`rounded-3xl border p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-[20px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Upcoming Visits</p>
                <p className="mt-3 text-[42px] font-bold">{upcomingAppointments.length}</p>
              </div>
              <div className={`rounded-2xl p-4 ${darkMode ? "bg-teal-500/10 text-teal-300" : "bg-teal-50 text-teal-600"}`}>
                <CalendarDays size={28} />
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-[20px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Past Visits</p>
                <p className="mt-3 text-[42px] font-bold">{pastAppointments.length}</p>
              </div>
              <div className={`rounded-2xl p-4 ${darkMode ? "bg-teal-500/10 text-teal-300" : "bg-teal-50 text-teal-600"}`}>
                <Clock3 size={28} />
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-[20px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Medical Records</p>
                <p className="mt-3 text-[42px] font-bold">{medicalRecords.length}</p>
              </div>
              <div className={`rounded-2xl p-4 ${darkMode ? "bg-teal-500/10 text-teal-300" : "bg-teal-50 text-teal-600"}`}>
                <ClipboardList size={28} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className={`rounded-3xl border p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
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
              <div className={`rounded-3xl border p-5 ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                No records available yet.
              </div>
            ) : (
              <div className={`rounded-3xl border p-5 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="space-y-3">
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Diagnosis</p>
                        <p className="mt-2 text-[22px] font-semibold text-teal-600">
                          {medicalRecords[0].diagnosis || medicalRecords[0].title || 'Recent record'}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Treatment</p>
                        <p className={`mt-2 text-[16px] leading-7 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {medicalRecords[0].treatment || 'No treatment details available'}
                        </p>
                      </div>
                    </div>
                    <div className={`mt-5 flex items-center gap-2 text-[16px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      <UserCircle size={16} />
                      <span>Dr. {doctors.find((doc) => doc.id === medicalRecords[0].doctor_id)?.name || `Doctor ${medicalRecords[0].doctor_id}`}</span>
                    </div>
                  </div>
                  <p className={`text-[16px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                    {medicalRecords[0].created_at || medicalRecords[0].record_date
                      ? new Date(medicalRecords[0].created_at || medicalRecords[0].record_date).toLocaleString("en-US", {
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

          <div className={`rounded-3xl border p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <h3 className="mb-6 text-[20px] font-semibold">Appointment History</h3>

            {appointments.length === 0 ? (
              <div className={`rounded-3xl border p-5 ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>No past appointments yet.</div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-16 w-16 flex-col items-center justify-center rounded-full text-sm font-semibold ${darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-100"}`}>
                    <span>{new Date(appointments[0].date).getDate()}</span>
                    <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{new Date(appointments[0].date).toLocaleString(undefined, { month: 'short' })}</span>
                  </div>

                  <div>
                    <p className="text-[22px] font-medium">{doctors.find((doc) => doc.id === appointments[0].doctor_id)?.name || `Doctor ${appointments[0].doctor_id}`}</p>
                    <p className={`text-[17px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{appointments[0].type || 'Consultation'}</p>
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

  const renderAppointmentsPage = () => {
    const statusPriority = {
      Pending: 0,
      Confirmed: 1,
      Completed: 2,
      Cancelled: 3,
    };

    const sortedAppointments = [...appointments].sort((a, b) => {
      const priorityDiff =
        (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);

      if (priorityDiff !== 0) return priorityDiff;

      const aDateTime = new Date(
        `${(a.date || "").split("T")[0]}T${a.time || "00:00"}`
      ).getTime();
      const bDateTime = new Date(
        `${(b.date || "").split("T")[0]}T${b.time || "00:00"}`
      ).getTime();

      return bDateTime - aDateTime;
    });

    return (
    <div className="p-9">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-[28px] font-bold">My Appointments</h2>
          <p className={`mt-2 text-[18px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Book and manage your appointments.
          </p>
        </div>

        <button 
          onClick={() => {
            setBookingData({ doctorId: "", date: "", time: "", type: "Follow-up" });
            setShowBookingModal(true);
          }}
          className="flex items-center gap-3 rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700">
          <CalendarPlus size={20} />
          <span>Book Appointment</span>
        </button>
      </div>

      <div className="space-y-5">
        {sortedAppointments.length === 0 ? (
          <p className={`rounded-2xl border p-6 text-center ${darkMode ? "border-slate-800 bg-slate-900 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>No appointments booked yet</p>
        ) : (
          sortedAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className={`pointer-events-auto rounded-[24px] border p-6 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}
            >
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-5">
                  <div className={`flex h-[68px] w-[68px] items-center justify-center rounded-full ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                    <Stethoscope size={24} className={darkMode ? "text-slate-300" : "text-slate-600"} />
                  </div>

                  <div>
                    <h3 className="text-[20px] font-semibold">Doctor: {doctors.find((doc) => doc.id === appointment.doctor_id)?.name || `ID ${appointment.doctor_id}`}</h3>
                    <p className={`mt-1 text-[18px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{appointment.type}</p>

                    <div className={`mt-5 flex flex-wrap items-center gap-6 text-[18px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
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
                        className={`pointer-events-auto cursor-pointer rounded-2xl border px-7 py-3 text-[18px] text-red-500 transition ${
                          darkMode ? "border-red-900 bg-slate-900 hover:bg-red-950/40 active:bg-red-950/60" : "border-red-200 bg-white hover:bg-red-50 active:bg-red-100"
                        }`}>
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
                        className={`pointer-events-auto cursor-pointer rounded-2xl border px-7 py-3 text-[18px] transition ${
                          darkMode ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-700/80" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                        }`}>
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

      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div
            ref={bookingModalRef}
            className={`flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border shadow-2xl ${
              darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
            }`}
          >
            <div className={`flex flex-shrink-0 items-center justify-between border-b px-8 py-6 ${
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}>
              <div>
                <h3 className={`text-[24px] font-bold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Book New Appointment</h3>
                <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Choose a department, pick a doctor, then confirm your date and time.
                </p>
              </div>

              <button
                type="button"
                onClick={resetBookingModal}
                className={`transition ${darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900"}`}
                aria-label="Close booking modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="mb-6 grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Select Department</label>
                  <select
                    value={bookingSpecialty}
                    onChange={(e) => {
                      setBookingSpecialty(e.target.value);
                      setBookingData({ ...bookingData, doctorId: "" });
                      setSelectedSlot(null);
                    }}
                    className={`mb-4 w-full rounded-lg border px-4 py-3 focus:border-teal-500 focus:outline-none ${
                      darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 text-slate-900"
                    }`}
                  >
                    <option value="">Choose a department...</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Psychiatry">Psychiatry</option>
                  </select>

                  {bookingData.doctorId ? (
                    <>
                      <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Select Date</label>
                      <input
                        type="date"
                        value={bookingData.date}
                        onChange={(e) => {
                          setBookingData({ ...bookingData, date: e.target.value });
                        }}
                        min={new Date().toISOString().split("T")[0]}
                        className={`mb-4 w-full rounded-lg border px-4 py-3 focus:border-teal-500 focus:outline-none ${
                          darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 text-slate-900"
                        }`}
                      />

                      <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Select Time</label>
                      <input
                        type="time"
                        value={bookingData.time}
                        onChange={(e) => {
                          setBookingData({ ...bookingData, time: e.target.value });
                        }}
                        className={`w-full rounded-lg border px-4 py-3 focus:border-teal-500 focus:outline-none ${
                          darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 text-slate-900"
                        }`}
                      />
                    </>
                  ) : (
                    <div className={`mt-6 flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed p-6 text-center ${
                      darkMode ? "border-slate-700 bg-slate-800/80" : "border-slate-300 bg-slate-50"
                    }`}>
                      <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Select a doctor first</p>
                    </div>
                  )}
                </div>

                <div>
                  {bookingSpecialty && (
                    <div>
                      <p className={`mb-3 text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Available Doctors</p>
                      <Suspense fallback={renderLazyFallback("Loading doctors...")}>
                        <SimpleDoctorList
                          selectedSpecialty={bookingSpecialty}
                          darkMode={darkMode}
                          onDoctorSelect={(doctor) => {
                            setBookingData({ ...bookingData, doctorId: doctor.id.toString() });
                            setSelectedSlot(null);
                          }}
                        />
                      </Suspense>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div className={`rounded-2xl border p-5 shadow-sm ${
                  darkMode ? "border-teal-900/70 bg-teal-950/20" : "border-teal-200 bg-teal-50/70"
                }`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className={`block text-base font-bold ${
                      darkMode ? "text-teal-100" : "text-teal-800"
                    }`}>
                      Appointment Type
                    </label>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      darkMode ? "bg-teal-900 text-teal-100" : "bg-white text-teal-700"
                    }`}>
                      Required
                    </span>
                  </div>
                  <select
                    value={bookingData.type}
                    onChange={(e) => setBookingData({ ...bookingData, type: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 focus:border-teal-500 focus:outline-none ${
                      darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-white bg-white text-slate-900"
                    }`}
                  >
                    <option>Follow-up</option>
                    <option>Checkup</option>
                  </select>
                  <p className={`mt-3 text-sm ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}>
                    Choose what kind of visit you want to book.
                  </p>
                </div>

                {bookingData.doctorId && bookingData.date && bookingData.time && (
                  <div className={`rounded-xl border p-4 ${
                    darkMode ? "border-teal-900 bg-teal-950/40" : "border-teal-200 bg-teal-50"
                  }`}>
                    <p className={`text-sm ${darkMode ? "text-teal-100" : "text-teal-800"}`}>
                      <strong>Ready to book:</strong> {formatDateForDisplay(bookingData.date)} at {formatTime(bookingData.time)}
                    </p>
                  </div>
                )}

                <div className={`flex flex-shrink-0 gap-3 border-t pt-6 ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}>
                  <button
                    type="submit"
                    disabled={!bookingData.doctorId || !bookingData.date || !bookingData.time}
                    className="flex-1 rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Book Appointment
                  </button>
                  <button
                    type="button"
                    onClick={resetBookingModal}
                    className={`flex-1 rounded-lg border px-4 py-3 transition ${
                      darkMode ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };

  const renderMedicalRecordsPage = () => {
    const normalizedMonthSearch = recordMonthSearch.trim().toLowerCase();
    const filteredMedicalRecords = medicalRecords.filter((record) => {
      if (!normalizedMonthSearch) return true;
      if (!record.record_date) return false;

      const monthName = new Date(record.record_date).toLocaleString("en-US", {
        month: "long",
      }).toLowerCase();

      return monthName.includes(normalizedMonthSearch);
    });

    return (
    <div className={`p-4 md:p-6 ${darkMode ? "bg-slate-900" : "bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.08),_transparent_24%)]"}`}>
      <div className={`rounded-[28px] border p-5 shadow-sm backdrop-blur md:p-6 ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white/90"}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className={`text-[30px] font-bold tracking-tight md:text-[34px] ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
              Medical Records
            </h2>
            <p className={`mt-2 max-w-2xl text-[17px] leading-7 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Review diagnoses, care summaries, and treatment notes in one organized place.
            </p>
          </div>

          <button
            onClick={downloadAllRecords}
            className="inline-flex items-center justify-center gap-3 rounded-2xl bg-teal-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <FileText size={20} />
            Download Records
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.9fr_0.9fr]">
          <div className="rounded-[24px] bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 p-5 text-white shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-50/90">Overview</p>
                <p className="text-[36px] font-bold leading-none">{filteredMedicalRecords.length}</p>
                <p className="mt-2 text-sm text-teal-50/90">Records in your timeline</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 text-white">
                <ClipboardList size={24} />
              </div>
            </div>
          </div>

          <div className={`rounded-[24px] border p-5 ${darkMode ? "border-slate-800 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.20em] text-slate-400">Active</p>
                <p className={`mt-3 text-[32px] font-bold leading-none ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                  {filteredMedicalRecords.filter((r) => ACTIVE_MEDICAL_RECORD_STATUSES.includes(r.status)).length}
                </p>
                <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Conditions currently marked ongoing or critical</p>
              </div>
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Activity size={22} />
              </div>
            </div>
          </div>

          <div className={`rounded-[24px] border p-5 ${darkMode ? "border-slate-800 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.20em] text-slate-400">Latest Update</p>
                <p className={`mt-3 text-[24px] font-bold leading-tight ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                  {filteredMedicalRecords.length > 0
                    ? new Date(filteredMedicalRecords[0].record_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "N/A"}
                </p>
                <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Most recent record activity</p>
              </div>
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <Clock3 size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {medicalRecords.length === 0 ? (
          <div className={`rounded-[28px] border border-dashed px-6 py-16 text-center shadow-sm ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"}`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FileText size={28} />
            </div>
            <h3 className={`mt-5 text-[22px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>No medical records yet</h3>
            <p className={`mt-3 text-base ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
              Once your doctor adds a consultation record, it will appear here with treatment details.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`rounded-[24px] border p-5 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Search by Month</p>
                  <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                    Type a month like April, May, or June to show only records from that month.
                  </p>
                </div>
                <div className={`flex w-full max-w-md items-center gap-3 rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                  <Search size={18} className="text-slate-400" />
                  <input
                    type="text"
                    value={recordMonthSearch}
                    onChange={(e) => setRecordMonthSearch(e.target.value)}
                    placeholder="Search month, e.g. April"
                    className={`w-full bg-transparent text-sm outline-none placeholder:text-slate-400 ${darkMode ? "text-slate-100" : "text-slate-700"}`}
                  />
                </div>
              </div>
            </div>

            {filteredMedicalRecords.length === 0 ? (
              <div className={`rounded-[28px] border border-dashed px-6 py-16 text-center shadow-sm ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"}`}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Search size={28} />
                </div>
                <h3 className={`mt-5 text-[22px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>No records found for that month</h3>
                <p className={`mt-3 text-base ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                  Try another month name or clear the search to view all medical records.
                </p>
              </div>
            ) : (
            filteredMedicalRecords.map((record, index) => (
              <div
                key={record.id}
                className={`overflow-hidden rounded-[28px] border shadow-sm transition ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}
              >
                <div className={`border-b px-6 py-5 md:px-8 ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-slate-50"}`}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${darkMode ? "bg-teal-900/40 text-teal-300" : "bg-emerald-100 text-emerald-700"}`}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Record {String(index + 1).padStart(2, "0")}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getMedicalRecordStatusBadgeClass(record.status, false)}`}
                          >
                            {record.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 md:justify-end">
                      <button
                        onClick={() => {
                          setSelectedDetail(record);
                          setSelectedDetailType("record");
                          setShowAppointmentDetails(true);
                        }}
                        className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${darkMode ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => downloadMedicalRecord(record)}
                        className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6 md:px-8">
                  <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
                    <div className={`flex min-h-[130px] flex-col rounded-2xl border p-5 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Doctor</p>
                      <div className="mt-auto flex items-center gap-3">
                        <div className={`rounded-2xl p-2.5 ${darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
                          <Stethoscope size={20} />
                        </div>
                        <p className={`text-[18px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                          Dr. {doctors.find((doc) => doc.id === record.doctor_id)?.name || `ID ${record.doctor_id}`}
                        </p>
                      </div>
                    </div>

                    <div className={`flex min-h-[130px] flex-col rounded-2xl border p-5 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Recorded On</p>
                      <div className="mt-auto flex items-center gap-3">
                        <div className={`rounded-2xl p-2.5 ${darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
                          <CalendarRange size={20} />
                        </div>
                        <p className={`text-[18px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                          {record.created_at || record.record_date
                            ? new Date(record.created_at || record.record_date).toLocaleString("en-US", {
                                month: "long",
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
                  </div>

                  <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
                    <div className={`flex min-h-[130px] flex-col rounded-2xl border p-5 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Diagnosis</p>
                      <p className={`mt-5 text-[16px] leading-relaxed ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                        {record.diagnosis || "No diagnosis noted for this medical record."}
                      </p>
                    </div>

                    <div className={`flex min-h-[130px] flex-col rounded-2xl border p-5 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Treatment</p>
                      <p className={`mt-5 text-[16px] leading-relaxed ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                        {record.treatment || "No treatment details available for this medical record."}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )))}
          </div>
        )}
      </div>
    </div>
  );
  };

  const renderPatientPrescriptionsPage = () => (
    <div className={`p-4 md:p-6 ${darkMode ? "bg-slate-900" : "bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.08),_transparent_24%)]"}`}>
      <div className={`rounded-[28px] border p-5 shadow-sm backdrop-blur md:p-6 ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white/90"}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className={`text-[30px] font-bold tracking-tight md:text-[34px] ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
              Prescriptions
            </h2>
            <p className={`mt-2 max-w-2xl text-[17px] leading-7 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Review medications, dosage, frequency, duration, and doctor instructions.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <button
              onClick={downloadPatientPrescriptions}
              className="inline-flex items-center justify-center gap-3 self-start rounded-2xl bg-teal-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700 sm:self-end"
            >
              <FileText size={20} />
              Generate Prescriptions
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {patientPrescriptions.length === 0 ? (
          <div className={`rounded-[28px] border border-dashed px-6 py-16 text-center shadow-sm ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"}`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FileText size={28} />
            </div>
            <h3 className={`mt-5 text-[22px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>No prescriptions yet</h3>
            <p className={`mt-3 text-base ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
              Once your doctor creates a prescription, it will appear here.
            </p>
          </div>
        ) : (
          <div className={`overflow-hidden rounded-[28px] border shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className={darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-700"}>
                  <tr>
                    <th className="px-5 py-4 text-base font-semibold">Medication</th>
                    <th className="px-5 py-4 text-base font-semibold">Doctor</th>
                    <th className="px-5 py-4 text-base font-semibold">Dosage</th>
                    <th className="px-5 py-4 text-base font-semibold">Frequency</th>
                    <th className="px-5 py-4 text-base font-semibold">Duration</th>
                    <th className="px-5 py-4 text-base font-semibold">Instructions</th>
                    <th className="px-5 py-4 text-base font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className={darkMode ? "text-slate-100" : "text-slate-800"}>
                  {patientPrescriptions.map((prescription) => (
                    <tr key={prescription.id} className={darkMode ? "border-t border-slate-700" : "border-t border-slate-200"}>
                      <td className="px-5 py-5 align-top">
                        <p className="text-[18px] font-semibold leading-tight">{prescription.medication || "Medication"}</p>
                      </td>
                      <td className="px-5 py-5 align-top text-[16px] leading-tight">
                        Dr. {prescription.doctor_name || doctors.find((doc) => String(doc.id) === String(prescription.doctor_id))?.name || `ID ${prescription.doctor_id || "N/A"}`}
                      </td>
                      <td className="px-5 py-5 align-top text-[16px] leading-tight">{prescription.dosage || "Not set"}</td>
                      <td className="px-5 py-5 align-top">
                        <span className={`inline-flex rounded-xl px-3 py-1 text-sm ${darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
                          {prescription.frequency || "No frequency set"}
                        </span>
                      </td>
                      <td className="px-5 py-5 align-top">
                        <span className={`inline-flex rounded-xl px-3 py-1 text-sm ${darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
                          {prescription.duration || "No duration set"}
                        </span>
                      </td>
                      <td className="px-5 py-5 align-top text-[16px] leading-relaxed">
                        {prescription.instructions || "No instructions provided"}
                      </td>
                      <td className="px-5 py-5 align-top text-[16px] leading-tight">
                        {new Date(prescription.prescribed_date || prescription.created_at || Date.now()).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfilePage = () => (
    <div className={`p-9 ${darkMode ? "bg-slate-900 text-slate-100" : ""}`}>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[28px] font-bold">My Profile</h2>
          <p className={`mt-2 text-[18px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Manage your personal information.</p>
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
                dateOfBirth: formatDateForInput(loggedInUser.dateOfBirth),
                address: loggedInUser.address || "",
                emergencyContact: loggedInUser.emergencyContact || "",
              });
            }
            setEditingProfile(!editingProfile);
          }}
          className={`inline-flex items-center gap-3 rounded-2xl px-7 py-4 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 ${
            editingProfile
              ? "bg-slate-500 hover:bg-slate-600"
              : "bg-teal-600 ring-4 ring-teal-100 hover:bg-teal-700"
          }`}
        >
          {editingProfile ? "Cancel Editing" : "Edit Profile"}
        </button>
      </div>

      <div className="space-y-6">
        <div className={`rounded-[32px] border p-8 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-teal-600">
                <Stethoscope size={50} className="text-white" />
              </div>
              <div>
                <h3 className={`text-[28px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{loggedInUser.name}</h3>
                <p className={`mt-1 text-[17px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{loggedInUser.email}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-4 py-2 text-sm font-medium ${darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}`}>{loggedInUser.age ? `${loggedInUser.age} years` : 'Age not set'}</span>
                  <span className={`rounded-full px-4 py-2 text-sm font-medium ${darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}`}>{loggedInUser.gender || 'Gender not set'}</span>
                  <span className={`rounded-full px-4 py-2 text-sm font-medium ${darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}`}>{loggedInUser.bloodGroup || 'Blood group not set'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${darkMode ? "bg-teal-950/50 text-teal-300" : "bg-teal-50 text-teal-700"}`}>
                <Phone size={16} /> {loggedInUser.phone || 'No phone'}
              </span>
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-50 text-slate-700"}`}>
                Patient ID: PT-{loggedInUser.id}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className={`rounded-[28px] border p-6 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Blood Group</p>
            <p className={`mt-3 text-[28px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{loggedInUser.bloodGroup || 'N/A'}</p>
          </div>
          <div className={`rounded-[28px] border p-6 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Age</p>
            <p className={`mt-3 text-[28px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{loggedInUser.age || 'N/A'}</p>
          </div>
          <div className={`rounded-[28px] border p-6 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Gender</p>
            <p className={`mt-3 text-[28px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{loggedInUser.gender || 'N/A'}</p>
          </div>
        </div>

        <div className={`rounded-[32px] border p-8 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className={`text-[22px] font-bold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Personal Information</h3>
              <p className={`mt-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Update your contact and emergency details.</p>
            </div>
          </div>

          {editingProfile ? (
            <form onSubmit={handleEditProfile} className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Full Name</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <User size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <input
                      type="text"
                      value={profileData.name ?? ""}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className={`w-full bg-transparent outline-none ${darkMode ? "text-slate-100" : "text-slate-900"}`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Email Address</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <Mail size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <input
                      type="email"
                      value={profileData.email ?? ""}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className={`w-full bg-transparent outline-none ${darkMode ? "text-slate-100" : "text-slate-900"}`}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Phone Number</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <Phone size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <input
                      type="tel"
                      placeholder="+1 987-654-3210"
                      value={profileData.phone ?? ""}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className={`w-full bg-transparent outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-900"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Blood Group</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <FileHeart size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <select
                      value={profileData.bloodGroup ?? ""}
                      onChange={(e) => setProfileData({ ...profileData, bloodGroup: e.target.value })}
                      className={`w-full bg-transparent outline-none ${darkMode ? "text-slate-100" : "text-slate-900"}`}
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
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Age</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <Clock3 size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <input
                      type="number"
                      min="0"
                      placeholder="45"
                      value={profileData.age ?? ""}
                      onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                      className={`w-full bg-transparent outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-900"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Gender</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <UserCog size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <select
                      value={profileData.gender ?? ""}
                      onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                      className={`w-full bg-transparent outline-none ${darkMode ? "text-slate-100" : "text-slate-900"}`}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Date of Birth</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <CalendarRange size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <input
                      type="date"
                      value={profileData.dateOfBirth ?? ""}
                      onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                      className={`w-full bg-transparent outline-none ${darkMode ? "text-slate-100" : "text-slate-900"}`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Address</label>
                  <div className={`rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <textarea
                      rows="3"
                      value={profileData.address ?? ""}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className={`w-full resize-none bg-transparent outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-900"}`}
                      placeholder="123 Main St, City"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Emergency Contact</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <Phone size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <input
                      type="tel"
                      placeholder="+1 234-567-8900"
                      value={profileData.emergencyContact ?? ""}
                      onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                      className={`w-full bg-transparent outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-900"}`}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="mt-8 w-full rounded-2xl bg-teal-600 px-6 py-3 font-medium text-white hover:bg-teal-700">
                Save Changes
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Full Name</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <User size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <div className={`w-full ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{loggedInUser.name || "Not set"}</div>
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Email Address</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <Mail size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <div className={`w-full ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{loggedInUser.email || "Not set"}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Phone Number</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <Phone size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <div className={`w-full ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{loggedInUser.phone || "Not set"}</div>
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Blood Group</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <FileHeart size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <div className={`w-full ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{loggedInUser.bloodGroup || "Not set"}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Age</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <Clock3 size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <div className={`w-full ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{loggedInUser.age || "Not set"}</div>
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Gender</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <UserCog size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <div className={`w-full ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{loggedInUser.gender || "Not set"}</div>
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Date of Birth</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <CalendarRange size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <div className={`w-full ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{formatDateForDisplay(loggedInUser.dateOfBirth)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Address</label>
                  <div className={`rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <div className={`min-h-[96px] whitespace-pre-wrap ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{loggedInUser.address || "Not set"}</div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>Emergency Contact</label>
                  <div className={`flex items-center rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                    <Phone size={16} className={`mr-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <div className={`w-full ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{loggedInUser.emergencyContact || "Not set"}</div>
                  </div>
                </div>
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
        String(patient.id).includes(searchLower) ||
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
    const getPatientStatusClasses = (status) => {
      if (status === "Critical") {
        return darkMode
          ? "bg-rose-500/15 text-rose-300"
          : "bg-rose-100 text-rose-700";
      }

      if (status === "Ongoing") {
        return darkMode
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-emerald-100 text-emerald-700";
      }

      if (status === "Stable") {
        return darkMode
          ? "bg-blue-500/15 text-blue-300"
          : "bg-blue-100 text-blue-700";
      }

      if (status === "Recovered") {
        return darkMode
          ? "bg-amber-500/15 text-amber-300"
          : "bg-amber-100 text-amber-700";
      }

      return darkMode
        ? "bg-slate-700 text-slate-200"
        : "bg-slate-100 text-slate-700";
    };

    return (
    <div className={`p-9 ${darkMode ? "bg-slate-900 text-slate-100" : ""}`}>
      <div className="mb-8">
        <div>
          <h2 className={`text-[28px] font-bold ${darkMode ? "text-slate-100" : ""}`}>Manage Patients</h2>
          <p className={`mt-2 text-[18px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            View and manage all registered patients.
          </p>
        </div>
      </div>

      <div className={`overflow-hidden rounded-[24px] border shadow-sm ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
        <div className={`flex items-center justify-between border-b p-5 ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
          <div className={`flex w-full max-w-[360px] items-center gap-3 rounded-xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200"}`}>
            <Search size={18} className={darkMode ? "text-slate-500" : "text-slate-400"} />
            <input
              type="text"
              placeholder="Search patients by ID, name, or phone..."
              value={patientSearchFilter}
              onChange={(e) => setPatientSearchFilter(e.target.value)}
              className={`w-full border-none bg-transparent outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
            />
          </div>

          <button className={`flex items-center gap-2 rounded-xl border px-5 py-3 ${darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className={`${darkMode ? "bg-slate-900 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
              <tr className={`border-b ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
                <th className="w-[90px] px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide">ID</th>
                <th className="w-[260px] px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide">Name</th>
                <th className="w-[150px] px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide">Age/Gender</th>
                <th className="w-[170px] px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide">Phone</th>
                <th className="w-[150px] px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide">Status</th>
                <th className="w-[220px] px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide">Doctor</th>
                <th className="w-[160px] px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide">Last Visit</th>
                <th className="w-[110px] px-5 py-4 text-right text-sm font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPatients.map((patient, index) => {
                const patientAppointments = [...adminAppointments]
                  .filter((appointment) => String(appointment.patient_id) === String(patient.id))
                  .sort((a, b) => new Date(`${b.date || ""}T${b.time || "00:00"}`) - new Date(`${a.date || ""}T${a.time || "00:00"}`));
                const patientRecords = [...adminMedicalRecords]
                  .filter((record) => String(record.patient_id) === String(patient.id))
                  .sort((a, b) => new Date(b.record_date || 0) - new Date(a.record_date || 0));
                const latestAppointment = patientAppointments[0];
                const latestMedicalRecord = patientRecords[0];
                const matchedDoctor = latestAppointment
                  ? doctors.find((doctor) => String(doctor.id) === String(latestAppointment.doctor_id))
                  : null;
                const doctorName = matchedDoctor
                  ? (matchedDoctor.name?.startsWith("Dr.") ? matchedDoctor.name : `Dr. ${matchedDoctor.name}`)
                  : "Unassigned";
                const patientStatus = patient.medical_status || latestMedicalRecord?.status || "No Records";
                const lastVisit = latestAppointment?.date ? formatDate(latestAppointment.date) : "N/A";

                return (
                  <tr
                    key={patient.id}
                    className={`align-middle ${
                      index !== paginatedPatients.length - 1 ? (darkMode ? "border-b border-slate-800" : "border-b border-slate-200") : ""
                    } ${darkMode ? "hover:bg-slate-900/80" : "hover:bg-slate-50"} transition-colors`}
                  >
                    <td className={`px-5 py-5 text-[17px] font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{patient.id}</td>
                    <td className="px-5 py-5">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                          <User size={18} className={darkMode ? "text-slate-300" : "text-slate-500"} />
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate text-[18px] font-medium ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{patient.name}</p>
                          <p className={`truncate text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{patient.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-5 py-5 text-[17px] ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      {patient.age && patient.gender ? `${patient.age} / ${patient.gender}` : "N/A"}
                    </td>
                    <td className={`px-5 py-5 text-[17px] ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{patient.phone || "N/A"}</td>
                    <td className="px-5 py-5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getPatientStatusClasses(patientStatus)}`}>
                        {patientStatus}
                      </span>
                    </td>
                    <td className={`px-5 py-5 text-[17px] ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{doctorName}</td>
                    <td className={`px-5 py-5 text-[17px] ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{lastVisit}</td>
                    <td className="relative px-5 py-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenPatientActionsMenuId((prev) => (prev === patient.id ? null : patient.id));
                        }}
                        className={`rounded-lg p-2 transition ${darkMode ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                        title="Patient actions"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openPatientActionsMenuId === patient.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute right-5 top-14 z-20 w-56 rounded-xl border p-1.5 text-left shadow-lg ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
                        >
                          <button
                            onClick={() => {
                              setOpenPatientActionsMenuId(null);
                              openPatientPasswordModal(patient);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50"
                          >
                            <Lock size={16} />
                            Reset Password
                          </button>
                          <button
                            onClick={() => {
                              setOpenPatientActionsMenuId(null);
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
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil size={16} />
                            Edit Patient
                          </button>
                          <button
                            onClick={() => {
                              setOpenPatientActionsMenuId(null);
                              setSelectedDetailType("patient");
                              setSelectedDetail(patient);
                              setShowAppointmentDetails(true);
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"}`}
                          >
                            <Eye size={16} />
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              setOpenPatientActionsMenuId(null);
                              handleDeleteUser(patient.id, "patient");
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            Delete Patient
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className={`px-5 py-8 text-center ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            {patientSearchFilter ? "No patients match your search." : "No patients found."}
          </div>
        )}

        {filteredPatients.length > 0 && (
          <div className={`flex items-center justify-between border-t px-5 py-5 ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
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
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
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

  const renderAdminDashboard = () => (
    (() => {
      const analytics = buildReportAnalytics({
        period: demographicsPeriod,
        adminAppointments,
        adminMedicalRecords,
        adminPatients,
        doctors,
      });
      const sortedConditions = Object.entries(analytics.conditionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12);

      if (sortedConditions.length === 0) {
        sortedConditions.push(["No Data", 0]);
      }

      const maxCount = Math.max(...sortedConditions.map((c) => c[1]), 1);

      return (
    <div className={`space-y-9 p-9 ${darkMode ? "bg-slate-900 text-slate-100" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className={`text-[28px] font-bold ${darkMode ? "text-slate-100" : ""}`}>Admin Dashboard</h2>
          <p className={`mt-2 text-[18px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Overview of hospital operations and statistics.</p>
        </div>
        <button 
          onClick={() => {
            generateAdminReport(
              buildReportAnalytics({
                period: demographicsPeriod,
                adminAppointments,
                adminMedicalRecords,
                adminPatients,
                doctors,
              })
            );
            showSuccessPopup("Report Generated Successfully");
          }}
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
        <div className={`col-span-2 rounded-[24px] border p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-[20px] font-bold ${darkMode ? "text-slate-100" : ""}`}>Patient Demographics</h3>
            <select 
              value={demographicsPeriod}
              onChange={(e) => setDemographicsPeriod(e.target.value)}
              className={`rounded-lg border px-4 py-2 text-sm ${darkMode ? "border-slate-700 bg-slate-800 text-slate-200" : "border-slate-200 text-slate-600"}`}
            >
              <option>This Year</option>
              <option>Last Year</option>
              <option>This Month</option>
            </select>
          </div>
          {(() => {
            // Color palette for variety
            const colors = [
              'from-teal-600 to-emerald-400',
              'from-emerald-600 to-teal-300',
              'from-cyan-600 to-teal-300',
              'from-teal-500 to-cyan-300',
              'from-emerald-500 to-lime-300',
              'from-green-600 to-emerald-300',
              'from-teal-700 to-emerald-500',
              'from-cyan-500 to-emerald-300',
              'from-teal-500 to-green-300',
              'from-emerald-600 to-lime-400',
              'from-cyan-600 to-emerald-400',
              'from-teal-600 to-green-400',
            ];
            
            return (
              <div className="space-y-6">
                <div className="h-72 flex items-end justify-between gap-3 px-1 pb-4">
                  {sortedConditions.length > 0 ? sortedConditions.map(([condition, count], i) => (
                    <div key={condition} className="flex flex-col items-center gap-3 flex-1 group">
                      <div className="text-center">
                        <span className={`text-sm font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{count}</span>
                      </div>
                      <div 
                        className={`w-full bg-gradient-to-t ${colors[i % colors.length]} rounded-t-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-y-110 cursor-pointer transform origin-bottom`}
                        style={{
                          height: `${(count / maxCount) * 240}px`,
                          minHeight: count > 0 ? '20px' : '0px'
                        }}
                        title={`${condition}: ${count} patients`}
                      ></div>
                      <span className={`text-xs font-medium text-center w-full px-1 break-words leading-snug ${darkMode ? "text-slate-400 group-hover:text-slate-200" : "text-slate-600 group-hover:text-slate-900"}`} title={condition}>
                        {condition}
                      </span>
                    </div>
                  )) : (
                    <div className={`w-full flex items-center justify-center ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                      No patient data available
                    </div>
                  )}
                </div>
                <div className={`grid grid-cols-3 gap-4 pt-4 border-t ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{analytics.filteredPatients.length}</p>
                    <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Total Patients</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{Object.keys(analytics.conditionCounts).length}</p>
                    <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Conditions</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{sortedConditions.length > 0 ? Math.max(...sortedConditions.map(c => c[1])) : 0}</p>
                    <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Most Common</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Recent Appointments */}
        <div className={`rounded-[24px] border p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-[20px] font-bold ${darkMode ? "text-slate-100" : ""}`}>Recent Appointments</h3>
            <button
              type="button"
              onClick={() => setAdminPage("appointments")}
              className="text-sm text-teal-600 hover:underline"
            >
              View All →
            </button>
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
                <div key={apt.id || idx} className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-300 hover:-translate-y-1 ${darkMode ? "hover:bg-slate-900/70" : "hover:bg-slate-50"}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                    <User size={16} className={darkMode ? "text-slate-300" : "text-slate-600"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{patientName}</p>
                    <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{doctorName}</p>
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
              <p className={`text-center text-sm py-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No recent appointments</p>
            )}
          </div>
        </div>
      </div>
    </div>
      );
    })()
  );

  const StatCardWithChange = ({ title, value, change, isPositive }) => {
    let IconComponent = Users;
    if (title.includes('Doctors')) IconComponent = Stethoscope;
    if (title.includes('Appointments')) IconComponent = CalendarDays;
    if (title.includes('Cases')) IconComponent = BarChart3;
    
    return (
      <div className={`rounded-[24px] border p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{title}</p>
            <p className={`mt-2 text-[32px] font-bold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{value}</p>
            <p className={`mt-2 text-sm font-medium ${isPositive ? 'text-teal-600' : 'text-rose-600'}`}>
              {change} vs last month
            </p>
          </div>
          <div className={`p-3 rounded-lg ${
            title.includes('Patients') ? 'bg-teal-100' :
            title.includes('Doctors') ? 'bg-emerald-100' :
            title.includes('Appointments') ? 'bg-cyan-100' :
            'bg-teal-100'
          }`}>
            <IconComponent size={28} className={
              title.includes('Patients') ? 'text-teal-600' :
              title.includes('Doctors') ? 'text-emerald-600' :
              title.includes('Appointments') ? 'text-cyan-600' :
              'text-teal-600'
            } />
          </div>
        </div>
      </div>
    );
  };

  const renderAdminDoctorsPage = () => {
    const itemsPerPage = 5;
    const adminDoctorStatus = getDoctorAvailabilityStatus(darkMode, new Date());
    
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
      <div className={`p-9 ${darkMode ? "bg-slate-900 text-slate-100" : ""}`}>
        <div className="mb-8">
          <div>
            <h2 className={`text-[28px] font-bold ${darkMode ? "text-slate-100" : ""}`}>Manage Doctors</h2>
            <p className={`mt-2 text-[18px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              View and manage all registered doctors.
            </p>
          </div>
        </div>

        <div className={`overflow-hidden rounded-[24px] border shadow-sm ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <div className={`flex items-center justify-between border-b p-5 ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
            <div className={`flex w-full max-w-[360px] items-center gap-3 rounded-xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-900 text-slate-500" : "border-slate-200 text-slate-400"}`}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search doctors..."
                value={doctorSearchFilter}
                onChange={(e) => {
                  setDoctorSearchFilter(e.target.value);
                  setAdminDoctorsPage(1);
                }}
                className={`w-full bg-transparent outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-900"}`}
              />
            </div>

            <button className={`flex items-center gap-2 rounded-xl border px-5 py-3 ${darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              <Filter size={18} />
              <span>Filter</span>
            </button>
          </div>

          <div
            className={`grid gap-4 border-b px-5 py-4 text-sm font-semibold ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}
            style={{ gridTemplateColumns: "0.6fr 1.1fr 1.5fr 1fr 1.2fr 1.1fr 0.9fr 0.9fr 0.5fr" }}
          >
            <div>id</div>
            <div>name</div>
            <div>email</div>
            <div>phone</div>
            <div>specialization</div>
            <div>department</div>
            <div>experience</div>
            <div>status</div>
            <div className="text-right">...</div>
          </div>

          {paginatedDoctors.map((doctor, index) => {
            return (
            <div
              key={doctor.id}
              className={`grid items-center gap-4 px-5 py-5 ${
                index !== paginatedDoctors.length - 1 ? (darkMode ? "border-b border-slate-800" : "border-b border-slate-200") : ""
              }`}
              style={{ gridTemplateColumns: "0.6fr 1.1fr 1.5fr 1fr 1.2fr 1.1fr 0.9fr 0.9fr 0.5fr" }}
            >
              <div className={`truncate text-[16px] font-medium ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                {doctor.id}
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600">
                  <Stethoscope size={16} className="text-white" />
                </div>
                <div className={`truncate text-[16px] font-medium ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                  {doctor.name ? `Dr. ${doctor.name}` : "N/A"}
                </div>
              </div>

              <div className={`truncate text-[16px] ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{doctor.email ?? "N/A"}</div>

              <div className={`truncate text-[16px] ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{doctor.phone ?? "N/A"}</div>

              <div className={`truncate text-[16px] ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{doctor.specialty ?? "N/A"}</div>

              <div className={`truncate text-[16px] ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{doctor.department ?? "N/A"}</div>

              <div className={`truncate text-[16px] ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{(doctor.experience !== null && doctor.experience !== undefined) ? `${doctor.experience} years` : "N/A"}</div>

              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${adminDoctorStatus.classes}`}>
                  {adminDoctorStatus.label}
                </span>
              </div>

              <div className="relative flex items-center justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDoctorActionsMenuId((prev) => (prev === doctor.id ? null : doctor.id));
                  }}
                  className={`rounded-lg p-2 transition ${darkMode ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                  title="Doctor actions"
                >
                  <MoreVertical size={18} />
                </button>

                {openDoctorActionsMenuId === doctor.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute bottom-10 right-0 z-20 w-56 rounded-xl border p-1.5 shadow-lg ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
                  >
                    <button
                      onClick={() => {
                        setOpenDoctorActionsMenuId(null);
                        openDoctorPasswordModal(doctor);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50"
                    >
                      <Lock size={16} />
                      Reset Password
                    </button>
                    <button
                      onClick={() => {
                        setOpenDoctorActionsMenuId(null);
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
                          department: doctor.department || "",
                          yearsExperience: doctor.experience !== null && doctor.experience !== undefined ? String(doctor.experience) : "",
                        });
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50"
                    >
                      <Pencil size={16} />
                      Edit Doctor
                    </button>
                    <button
                      onClick={() => {
                        setOpenDoctorActionsMenuId(null);
                        setSelectedDetailType("doctor");
                        setSelectedDetail(doctor);
                        setShowAppointmentDetails(true);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"}`}
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setOpenDoctorActionsMenuId(null);
                        handleDeleteUser(doctor.id, "doctor");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete Doctor
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
          })}

          {filteredDoctors.length === 0 && (
            <div className={`px-5 py-8 text-center ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              No doctors found.
            </div>
          )}

          {filteredDoctors.length > 0 && (
            <div className={`flex items-center justify-between border-t px-5 py-5 ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
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
                        : darkMode ? "border border-slate-700 text-slate-300 hover:bg-slate-800" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
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
      const appointmentDate = apt.date ? new Date(`${apt.date}T00:00:00`) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const matchesStatus =
        appointmentFilter === "All" ||
        (appointmentFilter === "Today"
          ? !!appointmentDate && appointmentDate.getTime() === today.getTime()
          : apt.status === appointmentFilter);
      
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
      <div className={`p-9 ${darkMode ? "bg-slate-900 text-slate-100" : ""}`}>
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className={`text-[28px] font-bold ${darkMode ? "text-slate-100" : ""}`}>All Appointments</h2>
            <p className={`mt-2 text-[18px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
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
              setBookingData({ doctorId: "", date: "", time: "", type: "Follow-up" });
            }}
            className="flex items-center gap-3 rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700"
          >
            <CalendarPlus size={20} />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {["All", "Today", "Pending", "Completed", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setAppointmentFilter(status);
                setAdminAppointmentsPage(1);
              }}
              className={`rounded-full px-5 py-2 font-medium transition-colors ${
                appointmentFilter === status
                  ? "bg-teal-600 text-white"
                  : darkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className={`overflow-hidden rounded-[24px] border shadow-sm ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          {/* Search Bar */}
          <div className={`border-b p-5 ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
              <Search size={18} className={darkMode ? "text-slate-500" : "text-slate-400"} />
              <input
                type="text"
                placeholder="Search appointments..."
                value={appointmentSearch}
                onChange={(e) => {
                  setAppointmentSearch(e.target.value);
                  setAdminAppointmentsPage(1);
                }}
                className={`w-full bg-transparent outline-none ${darkMode ? "text-slate-100 placeholder-slate-500" : ""}`}
              />
            </div>
          </div>

          {/* Table Header */}
          <div className={`grid gap-4 border-b px-5 py-4 text-sm font-semibold ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`} style={{gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 0.8fr 0.8fr'}}>
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
                  index !== paginatedAppointments.length - 1 ? (darkMode ? "border-b border-slate-800" : "border-b border-slate-200") : ""
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
                    <p className={`truncate text-[15px] font-medium ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                      {apt.patient_name || "Unknown"}
                    </p>
                    <p className={`truncate text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
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
                    <p className={`truncate text-[15px] font-medium ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                      {apt.doctor_name || "Unassigned"}
                    </p>
                    <p className={`truncate text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {apt.specialty || ""}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className={`text-[15px] ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                  <div>{formatDate(apt.date)}</div>
                  <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{formatTime(apt.time)}</div>
                </div>

                {/* Type */}
                <div className={`text-[15px] ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
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
              <p className={`text-[15px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No appointments found.</p>
            </div>
          )}

          {/* Pagination */}
          {filteredAppointments.length > 0 && (
            <div className={`flex items-center justify-between border-t px-5 py-5 ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-600"}`}>
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
                        : darkMode ? "border border-slate-700 text-slate-300 hover:bg-slate-800" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
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
      <div className={`p-9 ${darkMode ? "bg-slate-900 text-slate-100" : ""}`}>
        <div className="mb-8">
          <h2 className={`text-[28px] font-bold ${darkMode ? "text-slate-100" : ""}`}>Medical History</h2>
          <p className={`mt-2 text-[18px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Browse all patient medical records.</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by patient name or diagnosis..."
            value={medicalRecordsSearch}
            onChange={(e) => setMedicalRecordsSearch(e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 ${darkMode ? "border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500" : "border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400"}`}
          />
        </div>

        {/* Medical Records Cards */}
        <div className="space-y-4">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className={`rounded-2xl border shadow-sm hover:shadow-md transition-shadow ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}
              >
                <button
                  onClick={() => setExpandedRecordId(expandedRecordId === record.id ? null : record.id)}
                  className={`w-full flex items-start justify-between p-5 text-left transition-colors rounded-2xl ${darkMode ? "hover:bg-slate-900" : "hover:bg-slate-50"}`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* File Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <FileText size={24} className={darkMode ? "text-slate-500" : "text-slate-400"} />
                    </div>

                    {/* Record Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-[18px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{record.diagnosis}</h3>
                      <p className={`mt-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        Patient: <span className="font-medium">{record.patient_name}</span> • Doctor: <span className="font-medium">{record.doctor_name}</span>
                      </p>
                      <p className={`mt-2 text-sm line-clamp-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{record.treatment || "No treatment details"}</p>
                    </div>
                  </div>

                  {/* Date and Chevron */}
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <span className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
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
                      className={`${darkMode ? "text-slate-500" : "text-slate-400"} transition-transform ${
                        expandedRecordId === record.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedRecordId === record.id && (
                  <div className={`border-t px-5 py-4 space-y-3 rounded-b-2xl ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-xs font-semibold uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Patient</p>
                        <p className={`mt-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{record.patient_name}</p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Doctor</p>
                        <p className={`mt-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{record.doctor_name}</p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Diagnosis</p>
                        <p className={`mt-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{record.diagnosis}</p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Record Date</p>
                        <p className={`mt-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
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
                      <p className={`text-xs font-semibold uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Treatment</p>
                      <p className={`mt-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{record.treatment || "No treatment details"}</p>
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
    const analytics = buildReportAnalytics({
      period: demographicsPeriod,
      adminAppointments,
      adminMedicalRecords,
      adminPatients,
      doctors,
    });
    const maxDeptLoad = Math.max(...Object.values(analytics.deptLoad), 1);
    const maxAge = Math.max(...Object.values(analytics.ageGroups), 1);
    const maxMonthly = Math.max(...analytics.trendMonths.map((item) => item.value), 1);
    const totalAgePatients = Object.values(analytics.ageGroups).reduce((sum, value) => sum + value, 0);

    return (
      <div className={`p-9 ${darkMode ? "bg-slate-900 text-slate-100" : ""}`}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className={`text-[28px] font-bold ${darkMode ? "text-slate-100" : ""}`}>Reports & Analytics</h2>
            <p className={`mt-2 text-[18px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Comprehensive insights and statistics.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={demographicsPeriod}
              onChange={(e) => setDemographicsPeriod(e.target.value)}
              className={`rounded-lg border px-4 py-2 ${darkMode ? "border-slate-700 bg-slate-800 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last Quarter</option>
              <option>This Year</option>
              <option>Last Year</option>
            </select>
            <button
              type="button"
              onClick={() => {
                generateAdminReport(analytics);
                showSuccessPopup("Report Generated Successfully");
              }}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              <FileText size={18} />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Appointments"
            value={analytics.totalAppointments}
            change={analytics.changes.appointments}
            icon={<CalendarDays size={32} className="text-blue-500" />}
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Active Patients"
            value={analytics.activePatients}
            change={analytics.changes.patients}
            icon={<Users size={32} className="text-emerald-500" />}
            bgColor="bg-emerald-50"
          />
          <StatCard
            title="Total Doctors"
            value={analytics.totalDoctors}
            change={analytics.changes.doctors}
            icon={<Stethoscope size={32} className="text-purple-500" />}
            bgColor="bg-purple-50"
          />
          <StatCard
            title="Medical Records"
            value={analytics.filteredRecords.length}
            change={analytics.changes.records}
            icon={<BarChart3 size={32} className="text-amber-500" />}
            bgColor="bg-amber-50"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
          {/* Line Chart - Monthly Trend */}
          <div className={`rounded-2xl border p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
            <h3 className={`text-[18px] font-semibold mb-4 ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Monthly Appointments Trend</h3>
            <div className="h-64 flex items-end gap-2 px-2 py-4">
              {analytics.trendMonths.map(({ label, value, year, month }) => (
                <div key={`${year}-${month}`} className="group flex-1 flex flex-col items-center">
                  <div className="w-full relative">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-blue-400 to-blue-500 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_16px_30px_rgba(59,130,246,0.35)]"
                      style={{ height: `${(value / maxMonthly) * 200}px` }}
                    />
                  </div>
                  <span className={`text-xs mt-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
                </div>
              ))}
            </div>
            <div className={`mt-4 text-center text-xs flex items-center justify-center gap-2 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              appointments
            </div>
          </div>

          {/* Pie Chart - Appointment Types */}
          <div className={`rounded-2xl border p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
            <h3 className={`text-[18px] font-semibold mb-6 ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Appointments by Type</h3>
            <div className="flex flex-col items-center justify-center">
              <div className="w-32 h-32 rounded-full transition-transform duration-300 hover:-translate-y-1 hover:scale-105" style={{
                background: `conic-gradient(
                  #3b82f6 0deg ${(analytics.appointmentTypes.Checkup / 100) * 360}deg,
                  #8b5cf6 ${(analytics.appointmentTypes.Checkup / 100) * 360}deg ${((analytics.appointmentTypes.Checkup + analytics.appointmentTypes["Follow-up"]) / 100) * 360}deg,
                  #10b981 ${((analytics.appointmentTypes.Checkup + analytics.appointmentTypes["Follow-up"]) / 100) * 360}deg ${((analytics.appointmentTypes.Checkup + analytics.appointmentTypes["Follow-up"] + analytics.appointmentTypes.Consultation) / 100) * 360}deg,
                  #f97316 ${((analytics.appointmentTypes.Checkup + analytics.appointmentTypes["Follow-up"] + analytics.appointmentTypes.Consultation) / 100) * 360}deg 360deg
                )`
              }}></div>
            </div>
            <div className={`mt-6 space-y-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>Checkup {analytics.appointmentTypes.Checkup}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span>Follow-up {analytics.appointmentTypes["Follow-up"]}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Consultation {analytics.appointmentTypes.Consultation}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-orange-500 rounded-full"></span>Emergency {analytics.appointmentTypes.Emergency}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Bar Chart - Department Load */}
          <div className={`rounded-2xl border p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
            <h3 className={`text-[18px] font-semibold mb-4 ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Department Patient Load</h3>
            <div className="h-64 flex items-end gap-3 px-2 py-4">
              {Object.entries(analytics.deptLoad).length > 0 ? (
                Object.entries(analytics.deptLoad).map(([dept, value]) => (
                  <div key={dept} className="group flex-1 flex flex-col items-center">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-purple-400 to-purple-500 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_16px_30px_rgba(168,85,247,0.35)]"
                      style={{ height: `${(value / maxDeptLoad) * 200}px` }}
                    />
                    <span className={`text-xs mt-2 text-center line-clamp-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{dept}</span>
                  </div>
                ))
              ) : (
                <div className={`text-center w-full ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No department data</div>
              )}
            </div>
            <div className={`mt-2 text-center text-xs flex items-center justify-center gap-2 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
              Patients
            </div>
          </div>

          {/* Bar Chart - Age Demographics */}
          <div className={`rounded-2xl border p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
            <h3 className={`text-[18px] font-semibold mb-4 ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Patient Demographics by Age</h3>
            <div className="h-64 flex items-end gap-3 px-2 py-4">
              {totalAgePatients > 0 ? (
                Object.entries(analytics.ageGroups).map(([label, value]) => (
                  <div key={label} className="group flex-1 flex flex-col items-center">
                    <span className={`mb-2 text-sm font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{value}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-emerald-400 to-emerald-500 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_16px_30px_rgba(16,185,129,0.35)]"
                      style={{
                        height: `${(value / maxAge) * 200}px`,
                        minHeight: value > 0 ? "16px" : "0px",
                      }}
                    />
                    <span className={`text-xs mt-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
                  </div>
                ))
              ) : (
                <div className={`flex w-full items-center justify-center rounded-2xl border border-dashed text-center ${darkMode ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  No patient age data for this period
                </div>
              )}
            </div>
            <div className={`mt-2 text-center text-xs flex items-center justify-center gap-2 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
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
      <div className={`rounded-2xl border p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{title}</p>
            <p className={`mt-3 text-[32px] font-bold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{value}</p>
            <p className="mt-3 text-xs text-teal-600 font-medium">{change} vs previous period</p>
          </div>
          <div className={`rounded-lg ${bgColor} p-3`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  const renderTopToast = () => {
    if (!message) return null;

    return (
      <div
        className="fixed inset-0 z-[80]"
        onClick={() => setMessage("")}
      >
        <div className="pointer-events-none absolute inset-0 bg-black/10" />
        <div
          onClick={(event) => event.stopPropagation()}
          className="absolute left-1/2 top-5 w-[92%] max-w-xl -translate-x-1/2"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-black/45 blur-xl" />
          <div
          className={`rounded-2xl border px-6 py-4 text-base font-semibold tracking-[0.01em] text-white shadow-[0_24px_60px_rgba(2,6,23,0.65)] backdrop-blur-xl ${
            isError
              ? "border-red-300/45 bg-slate-950/86 ring-1 ring-red-400/30"
              : "border-emerald-300/40 bg-slate-950/86 ring-1 ring-emerald-300/25"
          }`}
          >
            {message}
          </div>
        </div>
      </div>
    );
  };

  const renderLazyFallback = (label = "Loading...") => (
    <div className="flex min-h-[240px] items-center justify-center p-8">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-sm">
        {label}
      </div>
    </div>
  );

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
        await api.put(`/users/${loggedInUser.id}/change-password`, {
          currentPassword,
          newPassword,
          confirmPassword,
        });
        showSuccessPopup("Password Updated Successfully");
        setPasswordMessage("");
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
        showSuccessPopup("All Changes Saved Successfully");
        setIsError(false);
      } catch (err) {
        setMessage("❌ Failed to save changes");
        setIsError(true);
      }
    };

    return (
      <div className={`p-9 ${darkMode ? "bg-slate-900 text-slate-100" : ""}`}>
        {/* Notification Preferences */}
        <div className={`rounded-2xl border p-6 shadow-sm mb-6 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center gap-3 mb-6">
            <Bell size={24} className="text-amber-500" />
            <h3 className={`text-[20px] font-semibold ${darkMode ? "text-slate-100" : ""}`}>Notification Preferences</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Email Notifications</p>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Receive appointment and system updates via email</p>
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
                <p className={`text-sm font-medium ${darkMode ? "text-slate-100" : "text-slate-900"}`}>SMS Notifications</p>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Get text messages for urgent updates</p>
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
                <p className={`text-sm font-medium ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Push Notifications</p>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Browser notifications for real-time alerts</p>
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
        <div className={`rounded-2xl border p-6 shadow-sm mb-6 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center gap-3 mb-6">
            <Lock size={24} className="text-red-500" />
            <h3 className={`text-[20px] font-semibold ${darkMode ? "text-slate-100" : ""}`}>Security</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200"}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`text-sm font-medium ${darkMode ? "text-slate-100" : "text-slate-900"}`}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200"}`}
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200"}`}
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
        <div className={`rounded-2xl border p-6 shadow-sm mb-6 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center gap-3 mb-6">
            <Info size={24} className="text-purple-500" />
            <h3 className={`text-[20px] font-semibold ${darkMode ? "text-slate-100" : ""}`}>System Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Version</p>
              <p className={`text-sm font-semibold mt-1 ${darkMode ? "text-slate-100" : "text-slate-900"}`}>v2.4.1</p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Last Updated</p>
              <p className={`text-sm font-semibold mt-1 ${darkMode ? "text-slate-100" : "text-slate-900"}`}>December 15, 2023</p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Database</p>
              <p className={`text-sm font-semibold mt-1 ${darkMode ? "text-slate-100" : "text-slate-900"}`}>PostgreSQL 14.2</p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Server Status</p>
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
    return (
      <>
        <SuccessPopup
          open={successPopup.open}
          title={successPopup.title}
          message={successPopup.message}
          onClose={closeSuccessPopup}
        />
        <Suspense fallback={renderLazyFallback("Loading doctor dashboard...")}>
          <DoctorDashboard loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} onLogout={handleLogout} />
        </Suspense>
      </>
    );
  }

  if (loggedInUser && loggedInUser.role === "patient") {
    return (
      <>
        <SuccessPopup
          open={successPopup.open}
          title={successPopup.title}
          message={successPopup.message}
          onClose={closeSuccessPopup}
        />
        {renderTopToast()}
        <div className={`flex min-h-screen ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
          <aside className={`flex flex-col justify-between border-r transition-all duration-300 ${patientSidebarCollapsed ? "w-20" : "w-[260px]"} ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <div>
              <div className={`flex h-[72px] items-center ${patientSidebarCollapsed ? "justify-center" : "justify-between"} transition-all duration-300 gap-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-6`}>
                <div className={`flex items-center gap-3 transition-all duration-300 ${patientSidebarCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
                  <Activity className="text-teal-600 flex-shrink-0" size={28} />
                  <h1 className={`text-[30px] font-semibold tracking-tight whitespace-nowrap ${darkMode ? "text-white" : "text-slate-900"}`}>MediCare</h1>
                </div>
                <button
                  onClick={() => setPatientSidebarCollapsed(!patientSidebarCollapsed)}
                  className={`p-2 rounded-lg transition-all flex-shrink-0 ${darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}
                  title={patientSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <ChevronLeft size={20} style={{ transform: patientSidebarCollapsed ? "scaleX(-1)" : "scaleX(1)", transition: "transform 300ms ease-in-out" }} />
                </button>
              </div>

              <nav className="px-3 py-6">
                <button
                  onClick={() => setActivePage("dashboard")}
                  className={`group relative mb-3 flex w-full items-center ${patientSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "dashboard"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard size={22} />
                  {!patientSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Dashboard</span>}
                  {patientSidebarCollapsed && (
                    <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                      darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                    }`}>
                      Dashboard
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActivePage("appointments")}
                  className={`group relative mb-3 flex w-full items-center ${patientSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "appointments"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CalendarDays size={22} />
                  {!patientSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>My Appointments</span>}
                  {patientSidebarCollapsed && (
                    <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                      darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                    }`}>
                      My Appointments
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActivePage("prescriptions")}
                  className={`group relative mb-3 flex w-full items-center ${patientSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "prescriptions"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileText size={22} />
                  {!patientSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Prescriptions</span>}
                  {patientSidebarCollapsed && (
                    <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                      darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                    }`}>
                      Prescriptions
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActivePage("records")}
                  className={`group relative mb-3 flex w-full items-center ${patientSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "records"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileHeart size={22} />
                  {!patientSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Medical History</span>}
                  {patientSidebarCollapsed && (
                    <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                      darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                    }`}>
                      Medical History
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActivePage("profile")}
                  className={`group relative flex w-full items-center ${patientSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "profile"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <UserCircle size={22} />
                  {!patientSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Profile</span>}
                  {patientSidebarCollapsed && (
                    <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                      darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                    }`}>
                      Profile
                    </span>
                  )}
                </button>
              </nav>
            </div>

            <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-4`}>
              <button
                onClick={handleLogout}
                className={`group relative flex w-full items-center ${patientSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${darkMode ? 'text-red-400 hover:bg-red-950' : 'text-red-600 hover:bg-red-50'}`}
              >
                <LogOut size={22} />
                {!patientSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Logout</span>}
                {patientSidebarCollapsed && (
                  <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                    darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                  }`}>
                    Logout
                  </span>
                )}
              </button>
            </div>
          </aside>

          <main className={`flex-1 min-h-screen ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
            <div className={`flex h-[72px] items-center justify-between border-b transition-colors ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} px-9`}>
              <div className="flex items-center gap-6">
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`rounded-lg p-2 transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                
                <div className="relative" ref={notificationsRef}>
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
                            let NotificationIcon = Bell;
                            let bgColor = darkMode ? 'bg-blue-900' : 'bg-blue-50';
                            let borderColor = darkMode ? 'border-slate-700' : 'border-slate-100';
                            
                            switch (notif.type) {
                              case "appointment_status":
                                NotificationIcon = CalendarDays;
                                bgColor = darkMode ? "bg-green-900/60" : "bg-green-50/60";
                                borderColor = darkMode ? "border-green-700" : "border-green-100";
                                break;
                              case "medical_record":
                                NotificationIcon = FileText;
                                bgColor = darkMode ? "bg-blue-900/60" : "bg-blue-50/60";
                                borderColor = darkMode ? "border-blue-700" : "border-blue-100";
                                break;
                              case "prescription":
                                NotificationIcon = FileText;
                                bgColor = darkMode ? "bg-teal-900/60" : "bg-teal-50/60";
                                borderColor = darkMode ? "border-teal-700" : "border-teal-100";
                                break;
                              case "approval":
                                NotificationIcon = Info;
                                bgColor = darkMode ? "bg-purple-900/60" : "bg-purple-50/60";
                                borderColor = darkMode ? "border-purple-700" : "border-purple-100";
                                break;
                              case "appointment_reminder":
                                NotificationIcon = Clock3;
                                bgColor = darkMode ? "bg-yellow-900/60" : "bg-yellow-50/60";
                                borderColor = darkMode ? "border-yellow-700" : "border-yellow-100";
                                break;
                              case "profile_update":
                                NotificationIcon = User;
                                bgColor = darkMode ? "bg-cyan-900/60" : "bg-cyan-50/60";
                                borderColor = darkMode ? "border-cyan-700" : "border-cyan-100";
                                break;
                              case "system":
                                NotificationIcon = Settings;
                                bgColor = darkMode ? "bg-slate-800/60" : "bg-slate-50/60";
                                borderColor = darkMode ? "border-slate-700" : "border-slate-100";
                                break;
                            }
                            const unreadHighlightClasses = darkMode
                              ? "bg-blue-950/80 border-l-4 border-l-blue-400 shadow-[0_12px_28px_rgba(15,23,42,0.34)]"
                              : "bg-blue-100 border-l-4 border-l-blue-500 shadow-[0_12px_28px_rgba(37,99,235,0.20)]";
                            
                            return (
                              <div 
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleNotificationClick(notif);
                                  }
                                }}
                                className={`cursor-pointer border-b p-4 transition-colors ${
                                  !notif.is_read
                                    ? `${unreadHighlightClasses} hover:opacity-95`
                                    : darkMode
                                    ? `hover:bg-slate-700 ${bgColor}`
                                    : `hover:bg-slate-50 ${bgColor}`
                                } ${borderColor}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex flex-1 items-start gap-3">
                                    <div className={`mt-0.5 rounded-xl p-2 ${darkMode ? 'bg-slate-800/70 text-slate-200' : 'bg-white/80 text-slate-600'}`}>
                                      <NotificationIcon size={16} />
                                    </div>
                                    <div className="flex-1">
                                    <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{notif.title}</p>
                                    <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{notif.message}</p>
                                    <p className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                      {formatNotificationTimestamp(notif.created_at)}
                                    </p>
                                    </div>
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
                                      <X size={12} />
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

                <div className="relative" ref={accountMenuRef}>
                  <div className="flex items-center gap-3 px-2 py-1">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200">
                      <User size={18} className="text-slate-500" />
                    </div>

                    <div>
                      <p className={`text-[18px] font-medium leading-none capitalize ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                        {loggedInUser.role}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAccountMenu((prev) => !prev)}
                      className={`rounded-full p-1 transition hover:bg-slate-100/70 ${darkMode ? 'hover:bg-slate-800' : ''}`}
                    >
                      <ChevronDown size={18} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
                    </button>
                  </div>

                  {showAccountMenu && (
                    <div className={`absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border p-2 shadow-xl ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'}`}
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`transition-colors ${darkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}>
              {activePage === "dashboard" && renderPatientDashboard()}
              {activePage === "book-appointment" && (
                <div className="p-6">
                  <Suspense fallback={renderLazyFallback("Loading appointment booking...")}>
                    <SimpleAppointmentBooking 
                      darkMode={darkMode}
                      loggedInUser={loggedInUser}
                      onBookingSuccess={() => {
                        showSuccessPopup("Appointment Booked Successfully");
                        setActivePage("appointments");
                        fetchPatientData();
                      }}
                    />
                  </Suspense>
                </div>
              )}
              {activePage === "appointments" && renderAppointmentsPage()}
              {activePage === "records" && renderMedicalRecordsPage()}
              {activePage === "prescriptions" && renderPatientPrescriptionsPage()}
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
                  className={`transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                  aria-label="Close patient details"
                >
                  <X size={24} />
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
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.time ? formatTime(selectedDetail.time) : "N/A"}</p>
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
                  className={`transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                  aria-label="Close patient details"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Record Title and Status */}
                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Record Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Diagnosis</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {selectedDetail.diagnosis || selectedDetail.title || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Status</label>
                      <div className="mt-2">
                        <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getMedicalRecordStatusBadgeClass(selectedDetail.status, darkMode)}`}>
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
                  className={`transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                  aria-label="Close details"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Patient ID</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.id || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Name</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.name || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Age / Gender</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {selectedDetail.age || "N/A"} / {selectedDetail.gender || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone / Contact</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.phone || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Address (Optional)</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.address || "N/A"}</p>
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
                  className={`transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                  aria-label="Close details"
                >
                  <X size={24} />
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
                  </div>
                </div>

                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Contact Information</h4>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.phone || "N/A"}</p>
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
        <SuccessPopup
          open={successPopup.open}
          title={successPopup.title}
          message={successPopup.message}
          onClose={closeSuccessPopup}
        />
        {renderTopToast()}
        <div className="flex min-h-screen">
          <aside className={`flex flex-col justify-between border-r transition-all duration-300 ${adminSidebarCollapsed ? "w-20" : "w-[260px]"} ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <div>
              <div className={`flex h-[72px] items-center ${adminSidebarCollapsed ? "justify-center" : "justify-between"} transition-all duration-300 gap-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-6`}>
                <div className={`flex items-center gap-3 transition-all duration-300 ${adminSidebarCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
                  <Activity className="text-teal-600 flex-shrink-0" size={28} />
                  <h1 className={`text-[30px] font-semibold tracking-tight whitespace-nowrap ${darkMode ? "text-white" : "text-slate-900"}`}>MediCare</h1>
                </div>
                <button
                  onClick={() => setAdminSidebarCollapsed(!adminSidebarCollapsed)}
                  className={`p-2 rounded-lg transition-all flex-shrink-0 ${darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}
                  title={adminSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <ChevronLeft size={20} style={{ transform: adminSidebarCollapsed ? "scaleX(-1)" : "scaleX(1)", transition: "transform 300ms ease-in-out" }} />
                </button>
              </div>

              <nav className="px-3 py-6">
                <button
                  onClick={() => setAdminPage("dashboard")}
                  className={`group relative mb-3 flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "dashboard"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Dashboard</span>}
                  {adminSidebarCollapsed && (
                    <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                      darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                    }`}>
                      Dashboard
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminPage("patients")}
                  className={`group relative mb-3 flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "patients"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Users size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Patients</span>}
                  {adminSidebarCollapsed && (
                    <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                      darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                    }`}>
                      Patients
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminPage("doctors")}
                  className={`group relative mb-3 flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "doctors"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <UserCog size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Doctors</span>}
                  {adminSidebarCollapsed && (
                    <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                      darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                    }`}>
                      Doctors
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminPage("appointments")}
                  className={`group relative mb-3 flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "appointments"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <CalendarRange size={22} />
                    {adminSidebarCollapsed && adminPendingAppointmentsCount > 0 && (
                      <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                        {adminPendingAppointmentsBadge}
                      </span>
                    )}
                  </div>
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Appointments</span>}
                  {!adminSidebarCollapsed && adminPendingAppointmentsCount > 0 && (
                    <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                      {adminPendingAppointmentsBadge}
                    </span>
                  )}
                  {adminSidebarCollapsed && (
                    <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                      darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                    }`}>
                      Appointments{adminPendingAppointmentsCount > 0 ? ` (${adminPendingAppointmentsBadge})` : ""}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminPage("history")}
                  className={`group relative mb-3 flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "history"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileHeart size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Medical History</span>}
                  {adminSidebarCollapsed && (
                    <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                      darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                    }`}>
                      Medical History
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminPage("reports")}
                  className={`group relative mb-3 flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "reports"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BarChart3 size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Reports</span>}
                  {adminSidebarCollapsed && (
                    <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                      darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                    }`}>
                      Reports
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminPage("settings")}
                  className={`group relative flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "settings"
                      ? darkMode ? "bg-teal-900 text-teal-300" : "bg-teal-50 text-teal-700"
                      : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Settings size={22} />
                  {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Settings</span>}
                  {adminSidebarCollapsed && (
                    <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                      darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                    }`}>
                      Settings
                    </span>
                  )}
                </button>
              </nav>
            </div>

            <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} p-4`}>
              <button
                onClick={handleLogout}
                className={`group relative flex w-full items-center ${adminSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left ${darkMode ? 'text-red-400 hover:bg-red-950' : 'text-red-600 hover:bg-red-50'}`}
              >
                <LogOut size={22} />
                {!adminSidebarCollapsed && <span className={`text-[18px] transition-all duration-300 inline-block`}>Logout</span>}
                {adminSidebarCollapsed && (
                  <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                    darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                  }`}>
                    Logout
                  </span>
                )}
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
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                
                <div className="relative" ref={notificationsRef}>
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
                            let NotificationIcon = Bell;
                            let bgColor = darkMode ? 'bg-blue-900' : 'bg-blue-50';
                            let borderColor = darkMode ? 'border-slate-700' : 'border-slate-100';
                            
                            switch (notif.type) {
                              case "appointment_status":
                                NotificationIcon = CalendarDays;
                                bgColor = darkMode ? "bg-green-900/60" : "bg-green-50/60";
                                borderColor = darkMode ? "border-green-700" : "border-green-100";
                                break;
                              case "medical_record":
                                NotificationIcon = FileText;
                                bgColor = darkMode ? "bg-blue-900/60" : "bg-blue-50/60";
                                borderColor = darkMode ? "border-blue-700" : "border-blue-100";
                                break;
                              case "prescription":
                                NotificationIcon = FileText;
                                bgColor = darkMode ? "bg-teal-900/60" : "bg-teal-50/60";
                                borderColor = darkMode ? "border-teal-700" : "border-teal-100";
                                break;
                              case "approval":
                                NotificationIcon = Info;
                                bgColor = darkMode ? "bg-purple-900/60" : "bg-purple-50/60";
                                borderColor = darkMode ? "border-purple-700" : "border-purple-100";
                                break;
                              case "appointment_reminder":
                                NotificationIcon = Clock3;
                                bgColor = darkMode ? "bg-yellow-900/60" : "bg-yellow-50/60";
                                borderColor = darkMode ? "border-yellow-700" : "border-yellow-100";
                                break;
                              case "profile_update":
                                NotificationIcon = User;
                                bgColor = darkMode ? "bg-cyan-900/60" : "bg-cyan-50/60";
                                borderColor = darkMode ? "border-cyan-700" : "border-cyan-100";
                                break;
                              case "system":
                                NotificationIcon = Settings;
                                bgColor = darkMode ? "bg-slate-800/60" : "bg-slate-50/60";
                                borderColor = darkMode ? "border-slate-700" : "border-slate-100";
                                break;
                            }
                            const unreadHighlightClasses = darkMode
                              ? "bg-blue-950/80 border-l-4 border-l-blue-400 shadow-[0_12px_28px_rgba(15,23,42,0.34)]"
                              : "bg-blue-100 border-l-4 border-l-blue-500 shadow-[0_12px_28px_rgba(37,99,235,0.20)]";
                            
                            return (
                              <div 
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleNotificationClick(notif);
                                  }
                                }}
                                className={`cursor-pointer border-b p-4 transition-colors ${
                                  !notif.is_read
                                    ? `${unreadHighlightClasses} hover:opacity-95`
                                    : darkMode
                                    ? `hover:bg-slate-700 ${bgColor}`
                                    : `hover:bg-slate-50 ${bgColor}`
                                } ${borderColor}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex flex-1 items-start gap-3">
                                    <div className={`mt-0.5 rounded-xl p-2 ${darkMode ? 'bg-slate-800/70 text-slate-200' : 'bg-white/80 text-slate-600'}`}>
                                      <NotificationIcon size={16} />
                                    </div>
                                    <div className="flex-1">
                                    <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{notif.title}</p>
                                    <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{notif.message}</p>
                                    <p className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                      {formatNotificationTimestamp(notif.created_at)}
                                    </p>
                                    </div>
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
                                      <X size={12} />
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

                <div className={`h-8 w-px ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />

                <div className="relative" ref={accountMenuRef}>
                  <div className="flex items-center gap-3 px-2 py-1">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <User size={18} className={darkMode ? 'text-slate-200' : 'text-slate-500'} />
                    </div>

                    <div>
                      <p className={`text-[18px] font-medium leading-none capitalize ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {loggedInUser.role}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAccountMenu((prev) => !prev)}
                      className={`rounded-full p-1 transition ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                    >
                      <ChevronDown size={18} className={darkMode ? 'text-slate-300' : 'text-slate-500'} />
                    </button>
                  </div>

                  {showAccountMenu && (
                    <div className={`absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border p-2 shadow-xl ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'}`}
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
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
                {!editingPatientId && (
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                  />
                )}
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
                {editingPatientId ? (
                  <>
                    <input
                      type="text"
                      value={`Patient ID: ${editingPatientId}`}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                    />
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
                    <input
                      type="text"
                      placeholder="Address (Optional)"
                      value={newUserData.address}
                      onChange={(e) => setNewUserData({...newUserData, address: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    />
                  </>
                ) : addModalType === "patient" ? (
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
                ) : null}
                {addModalType === "doctor" && !editingPatientId && (
                  <>
                    <input
                      type="text"
                      placeholder="Specialty"
                      value={newUserData.specialty}
                      onChange={(e) => setNewUserData({...newUserData, specialty: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    />
                    <select
                      value={newUserData.department}
                      onChange={(e) => setNewUserData({...newUserData, department: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
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
                    <input
                      type="number"
                      placeholder="Years of Experience"
                      value={newUserData.yearsExperience}
                      onChange={(e) => setNewUserData({...newUserData, yearsExperience: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                      min="0"
                    />
                  </>
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
                    setNewUserData({ name: "", email: "", password: "", phone: "", role: "patient", specialty: "", department: "", yearsExperience: "", age: "", gender: "", blood_group: "", condition: "", date_of_birth: "", address: "", emergency_contact: "", patientType: "registered", selectedPatientId: "", emergencyPatientName: "", emergencyPatientPhone: "" });
                    setBookingData({ doctorId: "", date: "", time: "", type: "Follow-up" });
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
                  {addModalType === "appointment"
                    ? "Book Appointment"
                    : editingDoctorId
                    ? "Update Doctor"
                    : editingPatientId
                    ? "Save"
                    : addModalType === "patient"
                    ? "Save"
                    : `Add ${addModalType.charAt(0).toUpperCase() + addModalType.slice(1)}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Patient Password Modal */}
        {showPatientPasswordModal && selectedPatientForPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
              <h2 className="mb-2 text-[24px] font-bold">Reset Patient Password</h2>
              <p className="mb-6 text-sm text-slate-600">
                Set a new password for <span className="font-semibold text-slate-900">{selectedPatientForPassword.name}</span>.
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleGenerateTemporaryPassword}
                  type="button"
                  className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-100"
                >
                  Generate Temporary Password
                </button>
                <div className="relative">
                  <input
                    type={showAdminResetPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={adminResetPasswordData.newPassword}
                    onChange={(e) =>
                      setAdminResetPasswordData({
                        ...adminResetPasswordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminResetPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-700"
                    aria-label={showAdminResetPassword ? "Hide password" : "Show password"}
                  >
                    {showAdminResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAdminResetPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={adminResetPasswordData.confirmPassword}
                    onChange={(e) =>
                      setAdminResetPasswordData({
                        ...adminResetPasswordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminResetPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-700"
                    aria-label={showAdminResetPassword ? "Hide password" : "Show password"}
                  >
                    {showAdminResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => {
                    setShowPatientPasswordModal(false);
                    setSelectedPatientForPassword(null);
                    setAdminResetPasswordData({ newPassword: "", confirmPassword: "" });
                    setShowAdminResetPassword(false);
                  }}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
                  disabled={adminResetPasswordLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdminResetPatientPassword}
                  className="flex-1 rounded-lg bg-teal-600 px-4 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                  disabled={adminResetPasswordLoading}
                >
                  {adminResetPasswordLoading ? "Saving..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Doctor Password Modal */}
        {showDoctorPasswordModal && selectedDoctorForPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
              <h2 className="mb-2 text-[24px] font-bold">Reset Doctor Password</h2>
              <p className="mb-6 text-sm text-slate-600">
                Set a new password for <span className="font-semibold text-slate-900">Dr. {selectedDoctorForPassword.name}</span>.
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleGenerateTemporaryPassword}
                  type="button"
                  className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-100"
                >
                  Generate Temporary Password
                </button>
                <div className="relative">
                  <input
                    type={showAdminResetPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={adminResetPasswordData.newPassword}
                    onChange={(e) =>
                      setAdminResetPasswordData({
                        ...adminResetPasswordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminResetPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-700"
                    aria-label={showAdminResetPassword ? "Hide password" : "Show password"}
                  >
                    {showAdminResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAdminResetPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={adminResetPasswordData.confirmPassword}
                    onChange={(e) =>
                      setAdminResetPasswordData({
                        ...adminResetPasswordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminResetPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-700"
                    aria-label={showAdminResetPassword ? "Hide password" : "Show password"}
                  >
                    {showAdminResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => {
                    setShowDoctorPasswordModal(false);
                    setSelectedDoctorForPassword(null);
                    setAdminResetPasswordData({ newPassword: "", confirmPassword: "" });
                    setShowAdminResetPassword(false);
                  }}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
                  disabled={adminResetPasswordLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdminResetDoctorPassword}
                  className="flex-1 rounded-lg bg-teal-600 px-4 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                  disabled={adminResetPasswordLoading}
                >
                  {adminResetPasswordLoading ? "Saving..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Details Modal - Admin View */}
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
                  className={`transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                  aria-label="Close details"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Appointment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Patient</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {selectedDetail.patient_name || "Walk-in / Emergency Patient"}
                      </p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Patient Email</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {selectedDetail.patient_email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Doctor</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {selectedDetail.doctor_name || doctors.find((doc) => doc.id === selectedDetail.doctor_id)?.name || `ID ${selectedDetail.doctor_id}`}
                      </p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Specialization</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {selectedDetail.specialty || doctors.find((doc) => doc.id === selectedDetail.doctor_id)?.specialty || "N/A"}
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
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.time ? formatTime(selectedDetail.time) : "N/A"}</p>
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

                {selectedDetail.notes && (
                  <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} pt-6`}>
                    <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Notes</label>
                    <p className={`text-base mt-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{selectedDetail.notes}</p>
                  </div>
                )}

                <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} pt-6`}>
                  <h4 className={`text-[16px] font-bold mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Appointment ID</h4>
                  <p className={`text-base font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{selectedDetail.id}</p>
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
                  className={`transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                  aria-label="Close details"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <h4 className={`text-[18px] font-bold mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Patient ID</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.id || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Name</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.name || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Age / Gender</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {selectedDetail.age || "N/A"} / {selectedDetail.gender || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone / Contact</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.phone || "N/A"}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Address (Optional)</label>
                      <p className={`text-base font-medium mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{selectedDetail.address || "N/A"}</p>
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
                  className={`transition ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                  aria-label="Close details"
                >
                  <X size={24} />
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

  const authTitle = showForgotPassword
    ? "Forgot Password"
    : isLogin
    ? "Welcome back"
    : "Create Account";

  const authSubtitle = showForgotPassword
    ? "Send a reset request to the admin team using your email address."
    : isLogin
    ? "Sign in to access your hospital dashboard."
    : "Create your account to continue using the MediCare Portal.";

  return (
    <>
      <SuccessPopup
        open={successPopup.open}
        title={successPopup.title}
        message={successPopup.message}
        onClose={closeSuccessPopup}
      />
      {renderTopToast()}
      <div
        className="min-h-screen bg-slate-950"
        style={{
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          backgroundImage:
            "linear-gradient(115deg, rgba(44, 86, 183, 0.94) 0%, rgba(48, 88, 190, 0.88) 50%, rgba(14, 128, 124, 0.78) 100%), url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1800&q=80')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="relative min-h-screen w-full overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(180deg,rgba(13,38,91,0.04),rgba(7,22,62,0.22))]" />
          <div className="relative z-10 grid min-h-screen xl:grid-cols-[46%_54%]">
          <section className="relative hidden min-h-screen p-10 text-white xl:flex xl:flex-col xl:p-14">
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/20 bg-white/10 shadow-[0_18px_40px_rgba(15,23,42,0.20)] backdrop-blur-sm">
                <Activity className="text-white" size={29} />
              </div>
              <p className="text-[26px] font-bold tracking-tight">MediCare HMS</p>
            </div>

            <div className="relative z-10 flex flex-1 flex-col pt-24 xl:pt-28">
              <div className="max-w-[680px]">
                <h1 className="text-[46px] font-bold leading-[0.98] tracking-tight xl:text-[52px]">
                  Modern healthcare administration, simplified.
                </h1>
                <p className="mt-4 max-w-[560px] text-[21px] leading-7 text-blue-50/90">
                  Manage patients, appointments, and hospital operations from a single, secure command center.
                </p>
              </div>

              <div className="mt-8 flex gap-12">
                <div>
                  <p className="text-[42px] font-bold leading-none">12k+</p>
                  <p className="mt-2 text-base text-blue-50/85">Patients managed</p>
                </div>
                <div>
                  <p className="text-[42px] font-bold leading-none">98.7%</p>
                  <p className="mt-2 text-base text-blue-50/85">System uptime</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-3 text-sm text-blue-50/80">
              <Shield size={18} />
              <p>HIPAA Compliant · End-to-end encrypted</p>
            </div>
          </section>

          <section className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto px-6 py-10 sm:px-10 xl:justify-center xl:px-8">
            <div
              className={`relative z-10 w-full ${
                !isLogin && !showForgotPassword ? "max-w-[760px]" : "max-w-[560px]"
              }`}
            >
              <div className="mb-8 xl:hidden">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-[0_16px_32px_rgba(37,99,235,0.26)]">
                  <Activity className="text-white" size={28} />
                </div>
                <h1 className="text-[22px] font-semibold text-slate-900">MediCare HMS</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Modern healthcare administration, simplified.
                </p>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-white/80 bg-slate-50/95 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur">
                <div className={!isLogin && !showForgotPassword ? "p-6 sm:p-8" : "p-7 sm:p-12"}>
                <div>
                  <h2 className="text-[32px] font-bold tracking-tight text-slate-950">{authTitle}</h2>
                  <p className="mt-3 text-base leading-7 text-slate-500">{authSubtitle}</p>
                </div>

                {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="mt-8">
                  <div className="mt-1">
                    <label className="mb-3 block text-sm font-semibold text-slate-800">
                      Email Address
                    </label>
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm transition focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]">
                      <Mail size={18} className="mr-3 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={forgotData.email}
                        onChange={handleForgotChange}
                        placeholder="Enter your email address"
                        className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Enter your email to send a reset request to admin.
                    </p>
                  </div>

                  <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-semibold text-white shadow-[0_18px_32px_rgba(37,99,235,0.28)] transition hover:bg-blue-700">
                    Request Reset Admin
                    <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setIsLogin(true);
                      setMessage("");
                      setForgotData({ email: "", newPassword: "", confirmPassword: "" });
                    }}
                    className="mt-4 w-full rounded-2xl border border-slate-200 py-4 font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Back to Login
                  </button>
                </form>
              ) : isLogin ? (
                <form onSubmit={handleLogin} className="mt-8">
                  <div className="mt-5">
                    <label className="mb-3 block text-sm font-semibold text-slate-800">
                      Email Address
                    </label>
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm transition focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]">
                      <Mail size={18} className="mr-3 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        placeholder="Enter your email address"
                        required
                        className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="mb-3 block text-sm font-semibold text-slate-800">
                      Password
                    </label>
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm transition focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]">
                      <Lock size={18} className="mr-3 text-slate-400" />
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        name="password"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        placeholder="Enter your password"
                        required
                        className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        className="ml-3 text-slate-400 transition hover:text-slate-600"
                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-600">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                      Remember me
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setMessage("");
                      }}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-semibold text-white shadow-[0_18px_32px_rgba(37,99,235,0.28)] transition hover:bg-blue-700">
                    Sign in
                    <ArrowRight size={18} />
                  </button>

                  <div className="-mx-7 -mb-7 mt-12 border-t border-slate-200/80 bg-slate-100/70 px-7 py-5 text-center text-sm text-slate-500 sm:-mx-12 sm:-mb-12 sm:px-12">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(false);
                        setShowForgotPassword(false);
                        setMessage("");
                      }}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Create an account
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="mt-6">
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-800">
                      Register As
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "patient", label: "Patient" },
                        { value: "doctor", label: "Doctor" },
                      ].map((roleOption) => (
                        <button
                          key={roleOption.value}
                          type="button"
                          onClick={() =>
                            setRegisterData((prev) => ({
                              ...prev,
                              role: roleOption.value,
                              specialty: roleOption.value === "doctor" ? prev.specialty : "",
                              department: roleOption.value === "doctor" ? prev.department : "",
                              yearsExperience: roleOption.value === "doctor" ? prev.yearsExperience : "",
                              bio: roleOption.value === "doctor" ? prev.bio : "",
                            }))
                          }
                          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                            registerData.role === roleOption.value
                              ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {roleOption.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-slate-800">
                        Full Name
                      </label>
                      <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 shadow-sm transition focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]">
                        <User size={18} className="mr-3 text-slate-400" />
                        <input
                          type="text"
                          name="name"
                          value={registerData.name}
                          onChange={handleRegisterChange}
                          placeholder="Enter your name"
                          required
                          className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-semibold text-slate-800">
                        Email Address
                      </label>
                      <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 shadow-sm transition focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]">
                        <Mail size={18} className="mr-3 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          value={registerData.email}
                          onChange={handleRegisterChange}
                          placeholder="Enter your email address"
                          required
                          className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-semibold text-slate-800">
                        Phone Number
                      </label>
                      <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 shadow-sm transition focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]">
                        <Phone size={18} className="mr-3 text-slate-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={registerData.phone}
                          onChange={handleRegisterChange}
                          placeholder="Enter your phone number"
                          required
                          className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-semibold text-slate-800">
                        Password
                      </label>
                      <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 shadow-sm transition focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]">
                        <Lock size={18} className="mr-3 text-slate-400" />
                        <input
                          type="password"
                          name="password"
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          placeholder="Create a password"
                          required
                          className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {registerData.role === "doctor" && (
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-3 block text-sm font-semibold text-slate-800">
                          Specialization
                        </label>
                        <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 shadow-sm transition focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]">
                          <Stethoscope size={18} className="mr-3 text-slate-400" />
                          <select
                            name="specialty"
                            value={registerData.specialty}
                            onChange={handleRegisterChange}
                            required
                            className={`w-full appearance-none bg-transparent outline-none ${
                              registerData.specialty ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            <option value="">Select your specialization</option>
                            {DOCTOR_SPECIALIZATIONS.map((specialization) => (
                              <option key={specialization} value={specialization}>
                                {specialization}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={18} className="ml-3 shrink-0 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-semibold text-slate-800">
                          Department
                        </label>
                        <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 shadow-sm transition focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]">
                          <select
                            name="department"
                            value={registerData.department}
                            onChange={handleRegisterChange}
                            required
                            className={`w-full appearance-none bg-transparent outline-none ${
                              registerData.department ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            <option value="">Select department</option>
                            <option>Cardiology</option>
                            <option>Neurology</option>
                            <option>Orthopedics</option>
                            <option>Pediatrics</option>
                            <option>Dermatology</option>
                            <option>General Medicine</option>
                            <option>Surgery</option>
                            <option>Internal Medicine</option>
                            <option>Pathology</option>
                            <option>Psychiatry</option>
                          </select>
                          <ChevronDown size={18} className="ml-3 shrink-0 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-semibold text-slate-800">
                          Years of Experience
                        </label>
                        <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 shadow-sm transition focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]">
                          <User size={18} className="mr-3 text-slate-400" />
                          <input
                            type="number"
                            min="0"
                            name="yearsExperience"
                            value={registerData.yearsExperience}
                            onChange={handleRegisterChange}
                            placeholder="Enter years of experience"
                            required
                            className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-semibold text-slate-800">
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          value={registerData.bio}
                          onChange={handleRegisterChange}
                          placeholder="Tell patients about yourself"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                          rows="2"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-4 text-base font-semibold text-white shadow-[0_18px_32px_rgba(59,130,246,0.28)] transition hover:bg-sky-600"
                  >
                    Register
                    <ArrowRight size={18} />
                  </button>

                  <p className="mt-5 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(true);
                        setShowForgotPassword(false);
                        setMessage("");
                      }}
                      className="font-semibold text-sky-600 hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              )}
            </div>
            </div>
            </div>
          </section>
        </div>
      </div>
      </div>
    </>
  );
}

