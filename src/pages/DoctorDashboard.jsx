import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { downloadWordDocument } from "../utils/wordExport";
import SuccessPopup from "../components/common/SuccessPopup";
import trueCareLogo from "../assets/true-care-hospital-logo.svg";
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
  ChevronRight,
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

const MEDICAL_RECORD_STATUSES = ["Ongoing", "Stable", "Recovered", "Critical"];
const DOCTOR_WORKING_DAYS = "Monday-Friday";
const DOCTOR_SCHEDULE_START = "8:00 AM";
const DOCTOR_SCHEDULE_END = "12:00 AM";

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

const DoctorDashboard = ({ loggedInUser, setLoggedInUser, onLogout }) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [appointmentFilter, setAppointmentFilter] = useState("All");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [prescriptionSearch, setPrescriptionSearch] = useState("");
  const [recordStatusFilter, setRecordStatusFilter] = useState("All");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
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
  const [patientPage, setPatientPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [recordForm, setRecordForm] = useState({
    patientId: "",
    diagnosis: "",
    treatment: "",
    notes: "",
    status: "Ongoing",
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
  const [profileSuccessPopupOpen, setProfileSuccessPopupOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [doctorSuccessPopup, setDoctorSuccessPopup] = useState({
    open: false,
    message: "",
  });
  const [error, setError] = useState(null);
  const [profileForm, setProfileForm] = useState({
    fullName: loggedInUser?.name || "",
    email: loggedInUser?.email || "",
    phone: loggedInUser?.phone || "",
    specialization: loggedInUser?.specialty || "",
    department: loggedInUser?.department || "",
    yearsExperience: loggedInUser?.experience !== undefined && loggedInUser?.experience !== null ? String(loggedInUser.experience) : "",
    bio: loggedInUser?.bio || "",
  });
  const accountMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (showAccountMenu && accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowAccountMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showNotifications, showAccountMenu]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getMedicalRecordTimestamp = (record) => {
    const value = record?.record_date || record?.created_at || record?.updated_at || 0;
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const normalizeMedicalRecords = (items = []) => {
    return items
      .map((record) => ({
        ...record,
        patientName: record.patientName || record.patient_name || "Unknown Patient",
      }))
      .sort((a, b) => {
        const dateDiff = getMedicalRecordTimestamp(b) - getMedicalRecordTimestamp(a);
        if (dateDiff !== 0) return dateDiff;
        return Number(b?.id || 0) - Number(a?.id || 0);
      });
  };

  const getDoctorAvailability = (now) => {
    const day = now.getDay();
    if (day === 0 || day === 6) {
      return {
        label: "On Leave",
        classes: darkMode
          ? "bg-amber-500/15 text-amber-300"
          : "bg-amber-100 text-amber-700",
      };
    }

    const hour = now.getHours();
    const isWithinSchedule = hour >= 8 && hour < 24;

    if (isWithinSchedule) {
      return {
        label: "Available",
        classes: darkMode
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-emerald-100 text-emerald-700",
      };
    }

    return {
      label: "Off Duty",
      classes: darkMode
        ? "bg-slate-700 text-slate-200"
        : "bg-slate-100 text-slate-700",
    };
  };

  const doctorAvailability = getDoctorAvailability(currentTime);

  const createProfileFormFromUser = (user, prev = {}) => ({
    ...prev,
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    specialization: user?.specialty ?? "",
    department: user?.department ?? "",
    yearsExperience: user?.experience !== undefined && user?.experience !== null ? String(user.experience) : "",
    bio: user?.bio ?? "",
  });

  const showDoctorSuccessPopup = (message) => {
    setDoctorSuccessPopup({
      open: true,
      message,
    });
  };

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
    : "min-h-screen bg-[#f7fbff] text-slate-800";

  const sidebarClasses = darkMode
    ? `flex flex-col justify-between transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-[260px]"} border-r border-slate-800 bg-slate-900 hidden md:flex`
    : `flex flex-col justify-between transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-[260px]"} border-r border-blue-100 bg-white hidden md:flex`;

  const topbarClasses = darkMode
    ? "relative flex h-[72px] items-center justify-between border-b border-slate-800 bg-slate-900 px-4 md:px-9"
    : "relative flex h-[72px] items-center justify-between border-b border-blue-100 bg-white px-4 md:px-9";

  const cardClasses = darkMode
    ? "rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1"
    : "rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_12px_32px_rgba(15,76,129,0.06)] transition-transform duration-300 hover:-translate-y-1";

  const textMain = darkMode ? "text-slate-100" : "text-slate-900";
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";
  const textSoft = darkMode ? "text-slate-300" : "text-slate-600";
  const borderSoft = darkMode ? "border-slate-800" : "border-blue-100";
  const hoverRow = darkMode ? "hover:bg-slate-800" : "hover:bg-sky-50/70";
  const panelBg = darkMode ? "bg-slate-950" : "bg-white";

  const activeNav = darkMode
    ? "bg-sky-500/15 text-sky-300"
    : "bg-sky-50 text-blue-700";

  const inactiveNav = darkMode
    ? "text-slate-300 hover:bg-slate-800"
    : "text-slate-600 hover:bg-sky-50";

  const inputClasses = `w-full rounded-lg border ${borderSoft} px-4 py-3 outline-none ${
    darkMode
      ? "bg-slate-800 text-slate-100 placeholder-slate-500"
      : "bg-white text-slate-900 placeholder-slate-400"
  }`;

  const secondaryButtonClasses = `rounded-lg border ${borderSoft} py-3 ${
    darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
  }`;

  const renderHospitalTopbarBrand = () => (
    <div className="h-12 w-[170px] overflow-hidden">
      <img
        src={trueCareLogo}
        alt="True Care Hospital"
        className="h-12 w-full object-contain object-left"
      />
    </div>
  );

  const renderHospitalBrandText = () => (
    <div>
      <p className="text-[24px] font-bold leading-none" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <span className={darkMode ? "text-sky-200" : "text-blue-800"}>True</span>
        <span className={darkMode ? "text-lime-300" : "text-lime-600"}>Care</span>
      </p>
      <p className={`mt-1 text-[11px] font-bold uppercase leading-none tracking-[0.38em] ${darkMode ? "text-sky-200" : "text-blue-900"}`}>
        Hospital
      </p>
    </div>
  );

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

  const getMedicalRecordStatusBadgeClass = (status) => {
    if (status === "Critical") {
      return darkMode
        ? "bg-red-500/15 text-red-300"
        : "bg-red-100 text-red-700";
    }
    if (status === "Recovered") {
      return darkMode
        ? "bg-emerald-500/15 text-emerald-300"
        : "bg-emerald-100 text-emerald-700";
    }
    if (status === "Stable") {
      return darkMode
        ? "bg-blue-500/15 text-blue-300"
        : "bg-blue-100 text-blue-700";
    }
    if (status === "Ongoing") {
      return darkMode
        ? "bg-amber-500/15 text-amber-300"
        : "bg-amber-100 text-amber-700";
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

  const getNotificationDestination = (notification) => {
    switch (notification?.type) {
      case "appointment":
      case "appointment_status":
      case "appointment_reminder":
        return "appointments";
      case "medical_record":
      case "approval":
        return "records";
      case "prescription":
        return "prescriptions";
      case "profile_update":
      case "system":
        return "settings";
      default:
        return "dashboard";
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification) return;

    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }

    setShowNotifications(false);
    setSelectedPatient(null);
    setSelectedRecord(null);
    setActivePage(getNotificationDestination(notification));
  };

  // Auto-complete confirmed appointments when their time passes
  useEffect(() => {
    const autoCompleteConfirmedAppointments = async () => {
      const now = new Date();
      
      // Find all confirmed appointments that have passed
      const confirmedToComplete = appointments.filter((apt) => {
        if (apt.status !== "Confirmed") return false;
        
        try {
          const aptEndDateTime = getAppointmentEndDateTime(apt);
          if (!aptEndDateTime) return false;
          return aptEndDateTime < now; // Appointment end time has passed
        } catch (err) {
          return false;
        }
      });

      // Auto-complete each confirmed appointment that has passed
      for (const apt of confirmedToComplete) {
        try {
          await api.put(`/appointments/${apt.id}`, { status: "Completed" });
          console.log(`Auto-completed appointment ${apt.id}`);
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

    console.log("ðŸ“– useEffect - Syncing loggedInUser to profileForm:");
    console.log("  loggedInUser:", loggedInUser);

    setProfileForm((prev) => {
      const newForm = createProfileFormFromUser(loggedInUser, prev);
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

      const trimmedName = profileForm.fullName?.trim() || "";
      const trimmedEmail = profileForm.email?.trim() || "";
      const trimmedPhone = profileForm.phone?.trim() || "";

      if (!trimmedName || !trimmedEmail) {
        setProfileSaveMessage({
          type: "error",
          text: "Name and email are required.",
        });
        return;
      }

      if (trimmedPhone && !/^\d{11}$/.test(trimmedPhone)) {
        setProfileSaveMessage({
          type: "error",
          text: "Phone number must be exactly 11 digits.",
        });
        return;
      }

      const profileData = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone || null,
        specialization: profileForm.specialization?.trim() || null,
        department: profileForm.department?.trim() || null,
        yearsExperience: profileForm.yearsExperience,
        bio: profileForm.bio?.trim() || null,
      };

      console.log("ðŸ’¾ Sending profile update:");
      console.log("  Data:", profileData);

      const response = await api.put(`/users/${loggedInUser.id}`, profileData);

      console.log("Response from server:");
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
        console.log("ðŸ”„ Updating loggedInUser state with:", updatedUser);
        setLoggedInUser(updatedUser);
      }

      setProfileSaveMessage({
        type: "success",
        text: response.data?.message || "Profile updated successfully!",
      });
      setProfileSuccessPopupOpen(true);
      setEditingProfile(false);

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

    if (!doctorPatients.some((patient) => String(patient.id) === String(prescriptionForm.patientId))) {
      alert("You can only prescribe for patients who booked an appointment with you.");
      return;
    }

    const selectedMedicalRecord = records.find(
      (record) =>
        String(record.id) === String(prescriptionForm.medicalRecordId) &&
        String(record.patient_id || record.patientId) === String(prescriptionForm.patientId)
    );
    if (!selectedMedicalRecord) {
      alert("Please select a medical record for the selected patient.");
      return;
    }

    try {
      const appointmentToComplete = [...appointments]
        .filter(
          (appointment) =>
            String(appointment.patient_id) === String(prescriptionForm.patientId) &&
            ["Pending", "Confirmed"].includes(appointment.status)
        )
        .sort(
          (a, b) =>
            new Date(`${b.date || ""}T${b.time || "00:00"}`) -
            new Date(`${a.date || ""}T${a.time || "00:00"}`)
        )[0];

      await api.post("/prescriptions", {
        appointmentId: appointmentToComplete?.id || null,
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

      if (appointmentToComplete?.id) {
        await api.put(`/appointments/${appointmentToComplete.id}`, {
          status: "Completed",
        });
      }

      const prescriptionsRes = await api.get("/doctor/prescriptions");
      setPrescriptions(prescriptionsRes.data.prescriptions || []);
      const recordsRes = await api.get("/doctor/medical-records");
      setRecords(normalizeMedicalRecords(recordsRes.data.records || []));
      const appointmentsRes = await api.get(`/appointments/${loggedInUser.id}`);
      setAppointments(appointmentsRes.data.appointments || []);
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
      showDoctorSuccessPopup("Prescription Added Successfully");
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
    const generatedAt = formatGeneratedTimestamp();

    downloadWordDocument(
      `prescription-${prescription.patient_name || "patient"}-${prescription.id}.doc`,
      "Prescription",
      `
        <h1>Prescription</h1>
        <p class="muted"><strong>Generated on:</strong> ${generatedAt}</p>
        <p><span class="label">Doctor:</span> Dr. ${loggedInUser?.name || "Doctor"}</p>
        <div class="card">
          <p><span class="label">Patient:</span> ${prescription.patient_name || "Unknown"}</p>
          <p><span class="label">Medication:</span> ${prescription.medication}</p>
          <p><span class="label">Dosage:</span> ${prescription.dosage}</p>
          <p><span class="label">Frequency:</span> ${prescription.frequency || "N/A"}</p>
          <p><span class="label">Duration:</span> ${prescription.duration || "N/A"}</p>
          <p><span class="label">Instructions:</span> ${prescription.instructions || "N/A"}</p>
          <p><span class="label">Date:</span> ${new Date(prescription.prescribed_date).toLocaleDateString()}</p>
          <p><span class="label">Medical Record:</span> ${prescription.medical_record_diagnosis || prescription.medical_record_title || "N/A"}</p>
        </div>
      `
    );
    showDoctorSuccessPopup("Report Generated Successfully");
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

    if (!doctorPatients.some((patient) => String(patient.id) === String(recordForm.patientId))) {
      alert("You can only add medical records for patients who booked an appointment with you.");
      return;
    }

    try {
      const recordDate = new Date().toISOString().split("T")[0];
      const medicalRecordData = {
        patientId: recordForm.patientId,
        doctorId: loggedInUser.id,
        title: recordForm.diagnosis,
        diagnosis: recordForm.diagnosis,
        treatment: recordForm.treatment,
        notes: recordForm.notes,
        status: recordForm.status,
        record_date: recordDate,
      };

      await api.post("/medical-records", medicalRecordData);

      const recordsRes = await api.get("/doctor/medical-records");
      setRecords(normalizeMedicalRecords(recordsRes.data.records || []));
      setRecordForm({
        patientId: "",
        diagnosis: "",
        treatment: "",
        notes: "",
        status: "Ongoing",
      });
      setShowAddRecordModal(false);
      showDoctorSuccessPopup("Medical Record Added Successfully");
    } catch (err) {
      console.error("Error adding medical record:", err);
      alert(err.response?.data?.message || "Failed to add medical record.");
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
      .filter((apt) => apt.patient_id && apt.status !== "Cancelled") // Only booked registered patients.
      .map((apt) => String(apt.patient_id))
  );

  // Filter patients to only show those who have appointments with this doctor
  const doctorPatients = patients.filter((patient) => patientIdsWithAppointments.has(String(patient.id)));
  const getRecordsForPatient = (patientId) =>
    records.filter((record) => String(record.patient_id || record.patientId) === String(patientId));
  
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

  const getLocalDateKey = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getAppointmentDateTime = (apt) => {
    if (!apt?.date) return null;

    const dateStr = getLocalDateKey(apt.date);
    if (!dateStr) return null;

    const dateTime = new Date(`${dateStr}T${apt.time || "00:00"}`);
    return Number.isNaN(dateTime.getTime()) ? null : dateTime;
  };

  const getAppointmentEndDateTime = (apt) => {
    const startDateTime = getAppointmentDateTime(apt);
    if (!startDateTime) return null;

    const durationMinutes = Number(apt.appointment_duration) || 30;
    return new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
  };

  const doctorAppointments = appointments.map((apt) => {
    const appointmentEndDateTime = getAppointmentEndDateTime(apt);
    const status =
      apt.status === "Completed" && appointmentEndDateTime && appointmentEndDateTime > new Date()
        ? "Confirmed"
        : apt.status || "Pending";

    return {
      ...apt,
      patientName:
        apt.patient_name ||
        patients.find((p) => p.id === apt.patient_id)?.name ||
        "Unknown Patient",
      formattedDate: apt.date
        ? new Date(apt.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "TBD",
      formattedTime: formatTimeString(apt.time),
      type: apt.type || "Consultation",
      status,
    };
  });

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
          Welcome back, <span className="text-blue-600">Dr. {loggedInUser?.name || 'Doctor'}</span>
        </h2>
        <p className={`mt-2 text-[18px] ${textMuted}`}>Here's your schedule for today.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setAppointmentFilter("Today");
            setActivePage("appointments");
          }}
          className={`${cardClasses} w-full text-left focus:outline-none focus:ring-4 focus:ring-blue-500/20`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[16px] ${textMuted}`}>Today's Appointments</p>
              <p className="mt-3 text-[42px] font-bold">{todayCount}</p>
            </div>
            <div
              className={
                darkMode
                  ? "rounded-xl bg-sky-500/15 p-3 text-sky-300"
                  : "rounded-xl bg-sky-50 p-3 text-blue-600"
              }
            >
              <CalendarDays size={24} />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActivePage("patients")}
          className={`${cardClasses} w-full text-left focus:outline-none focus:ring-4 focus:ring-blue-500/20`}
        >
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
        </button>

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
                    <p className="text-[20px] font-bold text-blue-600">{apt.formattedTime.split(" ")[0]}</p>
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
            <button
              type="button"
              onClick={() => {
                setSelectedPatient(null);
                setActivePage("records");
              }}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentRecords.map((record) => (
              <div key={record.id} className={`flex items-start gap-4 rounded-xl border ${borderSoft} p-5`}>
                <div
                  className={
                    darkMode
                      ? "rounded-lg bg-sky-500/15 p-3 text-sky-300"
                      : "rounded-lg bg-sky-50 p-3 text-blue-600"
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

  const _renderPatientCardsPage = () => {
    const _patientRows = filteredDoctorPatients.map((patient) => {
      const patientAppointments = appointments.filter((apt) => apt.patient_id === patient.id);
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
      const status = patient.medical_status || latestRecord?.status || "No Records";
      const lastVisit = lastVisitAppointment
        ? new Date(lastVisitAppointment.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "No completed visits";

      return {
        patient,
        conditionText,
        status,
        lastVisit,
        appointmentCount: patientAppointments.length,
      };
    });

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
              const status = patient.medical_status || latestRecord?.status || "No Records";
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
                            {patient.age ? `${patient.age} years` : "Age not provided"} / {patient.gender || "Unknown"}
                          </p>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getMedicalRecordStatusBadgeClass(status)}`}>
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

  const renderPatientsTablePage = () => {
    const patientRows = filteredDoctorPatients.map((patient) => {
      const patientAppointments = appointments.filter((apt) => apt.patient_id === patient.id);
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

      return {
        patient,
        conditionText: patient.condition || latestRecord?.diagnosis || latestRecord?.title || "No condition noted",
        status: patient.medical_status || latestRecord?.status || "No Records",
        appointmentCount: patientAppointments.length,
        lastVisit: lastVisitAppointment
          ? new Date(lastVisitAppointment.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "No completed visits",
      };
    });
    const patientsPerPage = 5;
    const totalPatientPages = Math.max(1, Math.ceil(patientRows.length / patientsPerPage));
    const currentPatientPage = Math.min(patientPage, totalPatientPages);
    const patientStartIndex = (currentPatientPage - 1) * patientsPerPage;
    const paginatedPatientRows = patientRows.slice(patientStartIndex, patientStartIndex + patientsPerPage);
    const patientEndIndex = Math.min(patientStartIndex + paginatedPatientRows.length, patientRows.length);
    const patientPageNumbers = Array.from({ length: totalPatientPages }, (_, index) => index + 1);

    return (
      <div className="w-full px-6 py-10 md:px-8 lg:px-10">
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
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setPatientPage(1);
              }}
              placeholder="Search by name or condition..."
              className="w-full bg-transparent text-[16px] outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {patientRows.length === 0 ? (
          <div className={`rounded-3xl border border-dashed ${darkMode ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-500"} p-10 text-center text-sm`}>
            No patients found.
          </div>
        ) : (
          <div className={`overflow-hidden rounded-[24px] border ${borderSoft} ${panelBg} shadow-sm`}>
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-left">
                <thead className={darkMode ? "bg-slate-900" : "bg-slate-50"}>
                  <tr className={`border-b ${borderSoft} text-xs font-semibold uppercase tracking-wide ${textMuted}`}>
                    <th className="px-5 py-4">Patient</th>
                    <th className="px-5 py-4">Age / Gender</th>
                    <th className="px-5 py-4">Blood</th>
                    <th className="px-5 py-4">Condition</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Appointments</th>
                    <th className="px-5 py-4">Last Visit</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatientRows.map(({ patient, conditionText, status, appointmentCount, lastVisit }, index) => (
                    <tr
                      key={patient.id}
                      className={`${hoverRow} ${index !== paginatedPatientRows.length - 1 ? `border-b ${borderSoft}` : ""}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                              darkMode ? "bg-slate-800 text-slate-100" : "bg-sky-50 text-blue-700"
                            }`}
                          >
                            {getInitials(patient.name)}
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-[16px] font-semibold ${textMain}`}>{patient.name}</p>
                            <p className={`truncate text-sm ${textMuted}`}>{patient.email || "No email provided"}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-5 py-4 text-sm ${textSoft}`}>
                        {patient.age ? `${patient.age} years` : "Age not provided"} / {patient.gender || "Unknown"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={darkMode ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300" : "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"}>
                          {patient.bloodGroup || patient.blood_group || "N/A"}
                        </span>
                      </td>
                      <td className={`max-w-[220px] px-5 py-4 text-sm ${textSoft}`}>{conditionText}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getMedicalRecordStatusBadgeClass(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className={`px-5 py-4 text-sm font-medium ${textSoft}`}>{appointmentCount}</td>
                      <td className={`px-5 py-4 text-sm ${textSoft}`}>{lastVisit}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewPatient(patient)}
                          className={`inline-flex items-center gap-2 rounded-xl border ${borderSoft} px-4 py-2 text-sm font-semibold transition ${
                            darkMode ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <Eye size={16} />
                          View Records
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`flex flex-col gap-4 border-t ${borderSoft} px-5 py-4 text-sm ${textMuted} sm:flex-row sm:items-center sm:justify-between`}>
              <span>
                Showing {patientStartIndex + 1} to {patientEndIndex} of {patientRows.length} entries
              </span>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPatientPage((page) => Math.max(1, page - 1))}
                  disabled={currentPatientPage === 1}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    currentPatientPage === 1
                      ? darkMode
                        ? "bg-slate-800 text-slate-600"
                        : "bg-slate-100 text-slate-400"
                      : darkMode
                      ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                  aria-label="Previous patients page"
                >
                  <ChevronLeft size={18} />
                </button>

                {patientPageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPatientPage(pageNumber)}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 font-semibold transition ${
                      currentPatientPage === pageNumber
                        ? darkMode
                          ? "bg-sky-500/20 text-sky-300"
                          : "bg-sky-50 text-blue-700"
                        : darkMode
                        ? "text-slate-300 hover:bg-slate-800"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPatientPage((page) => Math.min(totalPatientPages, page + 1))}
                  disabled={currentPatientPage === totalPatientPages}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    currentPatientPage === totalPatientPages
                      ? darkMode
                        ? "bg-slate-800 text-slate-600"
                        : "bg-slate-100 text-slate-400"
                      : darkMode
                      ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                  aria-label="Next patients page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function to get display status based on appointment date
  const _getDisplayStatus = (apt) => {
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

      // If appointment is in the future, show "Confirmed"
      if (aptDate > today || (aptDateNormalized.getTime() > todayNormalized.getTime())) {
        return "Confirmed";
      }

      // If appointment is today or in the past, show the actual status
      return apt.status || "Pending";
    } catch (err) {
      return apt.status || "Pending";
    }
  };

  const renderAppointmentsPage = () => {
    const filters = ["All", "Today", "Pending", "Scheduled", "Completed"];
    const normalizedAppointmentSearch = appointmentSearch.trim().toLowerCase();
    const isScheduledAppointment = (apt) =>
      ["Confirmed", "Scheduled"].includes(apt.status || "");
    const filterCounts = doctorAppointments.reduce(
      (counts, apt) => {
        try {
          const aptDateTime = getAppointmentDateTime(apt);
          const today = new Date();
          const isToday = apt.date && getLocalDateKey(apt.date) === getLocalDateKey(today);
          const isUpcoming = !!aptDateTime && aptDateTime >= today;
          const isPast = !!aptDateTime && aptDateTime < today;

          counts.All += 1;
          if (isToday && apt.status !== "Cancelled") counts.Today += 1;
          if ((isUpcoming || isToday) && isScheduledAppointment(apt)) counts.Scheduled += 1;
          if (apt.status === "Pending") counts.Pending += 1;
          if (apt.status === "Completed" && (isToday || isPast)) counts.Completed += 1;
        } catch (err) {
          counts.All += 1;
        }

        return counts;
      },
      { All: 0, Today: 0, Pending: 0, Scheduled: 0, Completed: 0 }
    );

    const filteredAppointments = doctorAppointments.filter((apt) => {
      const matchesPatientName =
        !normalizedAppointmentSearch ||
        (apt.patientName || "").toLowerCase().includes(normalizedAppointmentSearch);

      if (!matchesPatientName) return false;
      if (appointmentFilter === "All") return true;
      try {
        if (!apt.date) return false;

        const aptDateTime = getAppointmentDateTime(apt);
        if (!aptDateTime) return false;

        const today = new Date();
        const isToday = getLocalDateKey(apt.date) === getLocalDateKey(today);
        const isUpcoming = aptDateTime >= today;
        const isPast = aptDateTime < today;

        if (appointmentFilter === "Today") return isToday && apt.status !== "Cancelled";
        if (appointmentFilter === "Scheduled") return (isUpcoming || isToday) && isScheduledAppointment(apt);
        if (appointmentFilter === "Pending") return apt.status === "Pending";
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
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[28px] font-bold">My Appointments</h2>
              {pendingCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white">
                  {pendingCount > 99 ? "99+" : pendingCount} pending
                </span>
              )}
            </div>
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
                  ? "bg-blue-600 text-white"
                  : darkMode
                  ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border border-blue-100 text-slate-700 hover:bg-sky-50"
              }`}
            >
              <span>{filter}</span>
              {filter === "Pending" && filterCounts.Pending > 0 && (
                <span
                  className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                    appointmentFilter === filter ? "bg-white text-blue-700" : "bg-red-500 text-white"
                  }`}
                >
                  {filterCounts.Pending > 99 ? "99+" : filterCounts.Pending}
                </span>
              )}
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
    const statusOrder = {
      Ongoing: 0,
      Stable: 1,
      Recovered: 2,
      Critical: 3,
    };

    const filteredRecords = (selectedPatient
      ? records.filter((record) => record.patient_id === selectedPatient.id || record.patientId === selectedPatient.id)
      : records
    )
      .filter((record) => recordStatusFilter === "All" || (record.status || "Ongoing") === recordStatusFilter)
      .sort((a, b) => {
        const statusDiff =
          (statusOrder[a.status || "Ongoing"] ?? 99) - (statusOrder[b.status || "Ongoing"] ?? 99);

        if (statusDiff !== 0) return statusDiff;

        return new Date(b.record_date || 0) - new Date(a.record_date || 0);
      });

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
                      ? "rounded-full bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-300"
                      : "rounded-full bg-sky-50 px-3 py-2 text-sm font-semibold text-blue-700"
                  }
                >
                  Showing records for {selectedPatient.name}
                </span>
                <button onClick={() => setSelectedPatient(null)} className="text-sm font-medium text-blue-600 hover:underline">
                  Clear filter
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAddRecordModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-white shadow-md hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Record
          </button>
        </div>

        <div className={`mb-8 flex flex-wrap gap-3 rounded-2xl border ${borderSoft} px-4 py-4 ${panelBg} shadow-sm`}>
          {["All", "Ongoing", "Stable", "Recovered", "Critical"].map((statusOption) => (
            <button
              key={statusOption}
              type="button"
              onClick={() => setRecordStatusFilter(statusOption)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                recordStatusFilter === statusOption
                  ? darkMode
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-sky-100 text-blue-700"
                  : darkMode
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {statusOption}
            </button>
          ))}
        </div>

        {filteredRecords.length === 0 ? (
          <div className={`rounded-[24px] border ${borderSoft} ${panelBg} p-12 text-center shadow-sm`}>
            <p className={`text-[18px] ${textMuted}`}>
              {records.length === 0
                ? selectedPatient
                  ? "No records found for this patient."
                  : "No medical records found yet."
                : `No medical records found for ${recordStatusFilter}.`}
            </p>
            <p className={`mt-3 text-sm ${textSoft}`}>
              {records.length === 0
                ? selectedPatient
                  ? "Try another patient or clear the filter to view all records."
                  : "Add a new record to begin tracking patient history, or verify that patients are assigned to this doctor."
                : "Choose another status tab or switch back to All."}
            </p>
          </div>
        ) : (
          <div className={`rounded-[24px] border ${borderSoft} ${panelBg} shadow-sm`}>
            <div className={`grid grid-cols-[0.8fr_1fr_1fr_1.4fr_1.4fr_1fr_1fr] gap-4 border-b ${borderSoft} px-5 py-4 text-sm font-semibold ${textMuted}`}>
              <div>id</div>
              <div>patient_id</div>
              <div>date</div>
              <div>diagnosis</div>
              <div>treatment</div>
              <div>status</div>
              <div className="text-right">Actions</div>
            </div>

            {filteredRecords.map((record, index) => (
              <div
                key={record.id}
                className={`grid grid-cols-[0.8fr_1fr_1fr_1.4fr_1.4fr_1fr_1fr] items-center gap-4 px-5 py-5 ${
                  index !== filteredRecords.length - 1 ? `border-b ${borderSoft}` : ""
                } ${hoverRow}`}
              >
                <div className="text-[17px] font-medium">{record.id}</div>

                <div className="text-[17px]">{record.patient_id || record.patientId || "N/A"}</div>

                <div className="text-[17px]">
                  {record.record_date
                    ? new Date(record.record_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "N/A"}
                </div>

                <div className="text-[17px]">{record.diagnosis || record.title || "N/A"}</div>

                <div className="text-[17px]">{record.treatment || "N/A"}</div>

                <div>
                  <select
                    value={record.status || "Ongoing"}
                    onChange={(e) => handleUpdateRecordStatus(record.id, e.target.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border-none outline-none ${getMedicalRecordStatusBadgeClass(record.status || "Ongoing")}`}
                  >
                    {MEDICAL_RECORD_STATUSES.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex items-center justify-end gap-3">
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
                        setSelectedRecord(record);
                        setOpenActionsId(null);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm ${textSoft} ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                    >
                      <Eye size={16} />
                      View
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteRecord(record.id);
                        setOpenActionsId(null);
                      }}
                      className={`flex w-full items-center gap-2 rounded-b-2xl px-4 py-3 text-left text-sm text-red-600 ${
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
                <button onClick={() => setShowAddRecordModal(false)} className={`text-[0px] ${textMuted} hover:text-slate-600`} aria-label="Close add medical record modal">
                  <X size={18} className={darkMode ? "text-slate-300" : "text-slate-600"} />
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
                    {doctorPatients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                  {doctorPatients.length === 0 && (
                    <p className={`mt-2 text-sm ${textSoft}`}>No booked patients available.</p>
                  )}
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
                    {MEDICAL_RECORD_STATUSES.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddRecordModal(false)} className={`flex-1 ${secondaryButtonClasses}`}>
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700">
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
                <button onClick={() => setSelectedRecord(null)} className={`text-[0px] ${textMuted} hover:text-slate-400`} aria-label="Close record details">
                  <X size={20} className={darkMode ? "text-slate-300" : "text-slate-600"} />
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
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-white shadow-md hover:bg-blue-700"
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
          <div className={`grid grid-cols-[1.1fr_1.5fr_1.2fr_1.2fr_1.2fr_1fr] gap-4 border-b ${borderSoft} px-5 py-4 text-sm font-semibold ${textMuted}`}>
            <div>prescription_id</div>
            <div>medicine</div>
            <div>dosage</div>
            <div>frequency</div>
            <div>duration</div>
            <div className="text-right">Actions</div>
          </div>

          {filteredPrescriptions.map((prescription, index) => (
            <div
              key={prescription.id}
              className={`grid grid-cols-[1.1fr_1.5fr_1.2fr_1.2fr_1.2fr_1fr] items-center gap-4 px-5 py-5 ${
                index !== filteredPrescriptions.length - 1 ? `border-b ${borderSoft}` : ""
              } ${hoverRow}`}
            >
              <div className="text-[17px] font-medium">{prescription.id}</div>

              <div className="text-[17px]">{prescription.medication || "N/A"}</div>

              <div className="text-[17px]">{prescription.dosage || "N/A"}</div>

              <div className="text-[17px]">{prescription.frequency || "N/A"}</div>

              <div className="text-[17px]">{prescription.duration || "N/A"}</div>

              <div className="relative flex items-center justify-end gap-3">
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
                      onClick={() => {
                        setSelectedPrescription(prescription);
                        setOpenActionsId(null);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm ${textSoft} ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                    >
                      <Eye size={16} />
                      View
                    </button>
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
              <button onClick={() => setShowAddPrescriptionModal(false)} className={`text-[0px] ${textMuted} hover:text-slate-600`} aria-label="Close add prescription modal">
                <X size={18} className={darkMode ? "text-slate-300" : "text-slate-600"} />
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
                    {doctorPatients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                  {doctorPatients.length === 0 && (
                    <p className={`mt-2 text-sm ${textSoft}`}>No booked patients available.</p>
                  )}
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
                    {getRecordsForPatient(prescriptionForm.patientId)
                      .map((record) => (
                        <option key={record.id} value={record.id}>
                          {record.record_date
                            ? new Date(record.record_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : "No date"} - {record.diagnosis || record.title || "Medical Record"}
                        </option>
                      ))}
                  </select>
                  {prescriptionForm.patientId && getRecordsForPatient(prescriptionForm.patientId).length === 0 && (
                    <p className={`mt-2 text-sm ${textSoft}`}>No medical records found for this patient yet.</p>
                  )}
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
                  className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700 sm:w-[220px]"
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
                  className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700 sm:w-[220px]"
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
              <button onClick={() => setSelectedPrescription(null)} className={`text-[0px] ${textMuted} hover:text-slate-600`} aria-label="Close prescription details">
                <X size={18} className={darkMode ? "text-slate-300" : "text-slate-600"} />
              </button>
            </div>
            <div className="mb-5 flex justify-end">
              <button
                onClick={() => handleOpenEditPrescription(selectedPrescription)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 text-[40px] font-bold text-white">
              {getInitials(profileForm.fullName)}
            </div>

            <div>
              <h3 className="text-[32px] font-bold">{profileForm.fullName}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p
                  className={
                    darkMode
                      ? "inline-block rounded-full bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-300"
                      : "inline-block rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-blue-700"
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

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={`rounded-[28px] border p-5 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-blue-100 bg-white"}`}>
          <p className={`text-sm ${textMuted}`}>Working Days</p>
          <div className="mt-2 flex items-center gap-3">
            <CalendarDays size={18} className={textMuted} />
            <p className="text-[22px] font-semibold">{DOCTOR_WORKING_DAYS}</p>
          </div>
        </div>

        <div className={`rounded-[28px] border p-5 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-blue-100 bg-white"}`}>
          <p className={`text-sm ${textMuted}`}>Time Schedule</p>
          <div className="mt-2 flex items-start gap-3">
            <Clock3 size={18} className={textMuted} />
            <div>
              <p className="text-sm font-medium">Start Time</p>
              <p className="text-[20px] font-semibold">{DOCTOR_SCHEDULE_START}</p>
              <p className="mt-2 text-sm font-medium">End Time</p>
              <p className="text-[20px] font-semibold">{DOCTOR_SCHEDULE_END}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-[28px] border p-5 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-blue-100 bg-white"}`}>
          <p className={`text-sm ${textMuted}`}>Availability Status</p>
          <div className="mt-2 flex items-center gap-3">
            <Activity size={18} className={textMuted} />
            <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${doctorAvailability.classes}`}>
              {doctorAvailability.label}
            </span>
          </div>
        </div>
      </div>

      <div id="doctor-profile-form" className={`rounded-2xl border ${borderSoft} ${panelBg} p-8 shadow-sm`}>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-[24px] font-bold">Professional Information</h3>
            <p className={`mt-2 text-sm ${textMuted}`}>Update your profile details here.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!editingProfile) {
                setProfileForm((prev) => createProfileFormFromUser(loggedInUser, prev));
                const profileSection = document.getElementById("doctor-profile-form");
                profileSection?.scrollIntoView({ behavior: "smooth", block: "start" });
              } else {
                setProfileForm((prev) => createProfileFormFromUser(loggedInUser, prev));
              }
              setProfileSaveMessage(null);
              setEditingProfile((prev) => !prev);
            }}
            className={`inline-flex items-center gap-3 self-start rounded-2xl px-7 py-4 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 ${
              editingProfile ? "bg-slate-500 hover:bg-slate-600" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Pencil size={16} />
            {editingProfile ? "Cancel Editing" : "Edit Profile"}
          </button>
        </div>

        {editingProfile ? (
          <>
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
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 11),
                      })
                    }
                    placeholder="09XXXXXXXXX"
                    inputMode="numeric"
                    maxLength={11}
                    pattern="[0-9]{11}"
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
          </>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className={`rounded-3xl border p-6 ${darkMode ? "border-slate-700 bg-slate-800" : "border-blue-100 bg-sky-50/60"}`}>
              <p className={`text-sm ${textMuted}`}>Full Name</p>
              <p className="mt-3 text-[18px] font-medium">{profileForm.fullName || "Not set"}</p>
            </div>
            <div className={`rounded-3xl border p-6 ${darkMode ? "border-slate-700 bg-slate-800" : "border-blue-100 bg-sky-50/60"}`}>
              <p className={`text-sm ${textMuted}`}>Email Address</p>
              <p className="mt-3 text-[18px] font-medium">{profileForm.email || "Not set"}</p>
            </div>
            <div className={`rounded-3xl border p-6 ${darkMode ? "border-slate-700 bg-slate-800" : "border-blue-100 bg-sky-50/60"}`}>
              <p className={`text-sm ${textMuted}`}>Phone Number</p>
              <p className="mt-3 text-[18px] font-medium">{profileForm.phone || "Not set"}</p>
            </div>
            <div className={`rounded-3xl border p-6 ${darkMode ? "border-slate-700 bg-slate-800" : "border-blue-100 bg-sky-50/60"}`}>
              <p className={`text-sm ${textMuted}`}>Specialization</p>
              <p className="mt-3 text-[18px] font-medium">{profileForm.specialization || "Not set"}</p>
            </div>
            <div className={`rounded-3xl border p-6 ${darkMode ? "border-slate-700 bg-slate-800" : "border-blue-100 bg-sky-50/60"}`}>
              <p className={`text-sm ${textMuted}`}>Department</p>
              <p className="mt-3 text-[18px] font-medium">{profileForm.department || "Not set"}</p>
            </div>
            <div className={`rounded-3xl border p-6 ${darkMode ? "border-slate-700 bg-slate-800" : "border-blue-100 bg-sky-50/60"}`}>
              <p className={`text-sm ${textMuted}`}>Years of Experience</p>
              <p className="mt-3 text-[18px] font-medium">{profileForm.yearsExperience || "Not set"}</p>
            </div>
            <div className={`rounded-3xl border p-6 md:col-span-2 ${darkMode ? "border-slate-700 bg-slate-800" : "border-blue-100 bg-sky-50/60"}`}>
              <p className={`text-sm ${textMuted}`}>Bio</p>
              <p className="mt-3 text-[18px] font-medium">{profileForm.bio || "Not set"}</p>
            </div>
          </div>
        )}

        <SuccessPopup
          open={profileSuccessPopupOpen}
          message="Successfully edited profile."
          onClose={() => setProfileSuccessPopupOpen(false)}
        />

        {profileSaveMessage && profileSaveMessage.type !== "success" && (
          <div
            className={`mt-6 rounded-lg px-6 py-4 font-medium ${
              darkMode
                ? "bg-red-500/15 text-red-300"
                : "bg-red-100 text-red-700"
            }`}
          >
            {profileSaveMessage.text}
          </div>
        )}

        {editingProfile && (
          <div className="mt-8 flex justify-between gap-4 border-t pt-6">
            <div className={`max-w-sm text-sm ${textMuted}`}>
              Review your changes, then press the button on the right to update your doctor profile.
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className={`flex items-center gap-2 rounded-lg px-8 py-3 font-semibold text-white transition ${
                savingProfile
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
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
        )}
      </div>


    </div>
  );

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-700"}`}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className={`rounded-2xl border px-8 py-6 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-blue-100 bg-white"}`}>
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
          <button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
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
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className={`rounded-2xl border px-8 py-6 shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-blue-100 bg-white"}`}>
            Initializing your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={appClasses}>
      <SuccessPopup
        open={doctorSuccessPopup.open}
        message={doctorSuccessPopup.message}
        onClose={() => setDoctorSuccessPopup({ open: false, message: "" })}
      />
      <div className="flex min-h-screen">
        <aside className={sidebarClasses}>
          <div>
            <div className={`flex h-[72px] items-center ${sidebarCollapsed ? "justify-center" : "justify-between"} transition-all duration-300 gap-3 border-b px-6 ${borderSoft}`}>
              {!sidebarCollapsed && renderHospitalTopbarBrand()}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`p-2 rounded-lg transition-all flex-shrink-0 ${darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <ChevronLeft size={20} style={{ transform: sidebarCollapsed ? "scaleX(-1)" : "scaleX(1)", transition: "transform 300ms ease-in-out" }} />
              </button>
            </div>

            <nav className="px-3 py-6 space-y-3">
              <button
                onClick={() => setActivePage("dashboard")}
                className={`group relative flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                  activePage === "dashboard" ? activeNav : inactiveNav
                }`}
              >
                <LayoutDashboard size={22} />
                <span className={`text-[18px] font-medium transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>Dashboard</span>
                {sidebarCollapsed && (
                  <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                    darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                  }`}>
                    Dashboard
                  </span>
                )}
              </button>

              <button
                onClick={() => setActivePage("patients")}
                className={`group relative flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                  activePage === "patients" ? activeNav : inactiveNav
                }`}
              >
                <Users size={22} />
                <span className={`text-[18px] transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>My Patients</span>
                {sidebarCollapsed && (
                  <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                    darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                  }`}>
                    My Patients
                  </span>
                )}
              </button>

              <button
                onClick={() => setActivePage("appointments")}
                className={`group relative flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                  activePage === "appointments" ? activeNav : inactiveNav
                }`}
              >
                <div className="relative flex-shrink-0">
                  <CalendarDays size={22} />
                  {sidebarCollapsed && pendingCount > 0 && (
                    <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </div>
                <span className={`text-[18px] transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>Appointments</span>
                {!sidebarCollapsed && pendingCount > 0 && (
                  <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
                {sidebarCollapsed && (
                  <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                    darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                  }`}>
                    Appointments{pendingCount > 0 ? ` (${pendingCount > 99 ? "99+" : pendingCount})` : ""}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActivePage("prescriptions")}
                className={`group relative flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                  activePage === "prescriptions" ? activeNav : inactiveNav
                }`}
              >
                <ClipboardList size={22} />
                <span className={`text-[18px] transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>Prescriptions</span>
                {sidebarCollapsed && (
                  <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                    darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                  }`}>
                    Prescriptions
                  </span>
                )}
              </button>

              <button
                onClick={() => setActivePage("records")}
                className={`group relative flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                  activePage === "records" ? activeNav : inactiveNav
                }`}
              >
                <FileText size={22} />
                <span className={`text-[18px] transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>Medical History</span>
                {sidebarCollapsed && (
                  <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                    darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                  }`}>
                    Medical History
                  </span>
                )}
              </button>

              <button
                onClick={() => setActivePage("settings")}
                className={`group relative flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                  activePage === "settings" ? activeNav : inactiveNav
                }`}
              >
                <Settings size={22} />
                <span className={`text-[18px] transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>Settings</span>
                {sidebarCollapsed && (
                  <span className={`pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 ${
                    darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-900 text-white"
                  }`}>
                    Settings
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className={`border-t p-4 ${borderSoft}`}>
            <button
              onClick={onLogout}
              className={`group relative flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start"} gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all duration-300 ${
                darkMode
                  ? "text-red-300 hover:bg-red-500/10"
                  : "text-red-600 hover:bg-red-50"
              }`}
            >
              <LogOut size={22} />
              <span className={`text-[18px] transition-all duration-300 ${sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>Logout</span>
              {sidebarCollapsed && (
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
          <div className={topbarClasses}>
            <div className="flex flex-1 items-center gap-2 md:gap-6">
              {renderHospitalBrandText()}
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

              <div className="relative" ref={notificationsRef}>
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
                      darkMode ? "border-slate-800 bg-slate-900" : "border-blue-100 bg-white"
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
                            onClick={() => handleNotificationClick(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleNotificationClick(item);
                              }
                            }}
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
                                <p className={`mt-2 text-xs ${textMuted}`}>{formatNotificationTimestamp(item.created_at)}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                {item.unread && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(item.id);
                                  }}
                                  className={`rounded p-1.5 text-[0px] transition ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}
                                  aria-label="Delete notification"
                                >
                                  <X size={14} className={darkMode ? "text-slate-200" : "text-slate-600"} />
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

              <div className={`relative hidden border-l pl-6 md:block ${borderSoft}`} ref={accountMenuRef}>
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="text-right">
                    <p className="text-sm font-semibold">Doctor</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAccountMenu((prev) => !prev)}
                    className={`rounded-full p-1 transition ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                  >
                    <span className={darkMode ? "text-slate-300" : "text-slate-600"}>
                      <ChevronDown size={20} />
                    </span>
                  </button>
                </div>

                {showAccountMenu && (
                  <div className={`absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border p-2 shadow-xl ${darkMode ? `${panelBg} ${borderSoft}` : "border-blue-100 bg-white"}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAccountMenu(false);
                        onLogout();
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${darkMode ? "text-slate-200 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-100"}`}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {activePage === "dashboard" && renderDashboardPage()}
          {activePage === "patients" && renderPatientsTablePage()}
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
                className={`text-[0px] ${textMuted} hover:text-slate-400 transition`}
                aria-label="Close appointment details"
              >
                <X size={20} className={darkMode ? "text-slate-300" : "text-slate-600"} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {loadingAppointmentDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
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
                        <p className="text-base font-medium mt-2">{selectedAppointmentDetails.time ? formatTimeString(selectedAppointmentDetails.time) : "N/A"}</p>
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




