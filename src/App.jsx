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
  Menu,
  Bell,
  Moon,
  Clock3,
  ClipboardList,
  CalendarPlus,
  Search,
  Stethoscope,
  ChevronDown,
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
  Phone,
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
  const [adminPage, setAdminPage] = useState("patients");
  const [darkMode, setDarkMode] = useState(false);

  const notificationsRef = useRef(null);
  const detailsRef = useRef(null);

  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [adminPatients, setAdminPatients] = useState([]);
  const [adminPatientsPage, setAdminPatientsPage] = useState(1);
  const [adminDoctorsPage, setAdminDoctorsPage] = useState(1);
  const [adminAppointments, setAdminAppointments] = useState([]);
  const [adminMedicalRecords, setAdminMedicalRecords] = useState([]);
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

  const notifications = [
    { id: 1, title: "Appointment Confirmed", message: "Your appointment with the doctor has been confirmed.", time: "5 min ago", unread: true },
    { id: 2, title: "Medical Record Updated", message: "A new medical record has been added to your file.", time: "2 hours ago", unread: false },
  ];

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
    } catch (err) {
      console.error("Error fetching current user:", err);
      setToken("");
      setAuthToken("");
    }
  };

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
      setDoctors(doctorsRes.data.doctors || []);
      
      // Fetch all medical records
      const recordsRes = await api.get("/admin/medical-records");
      setAdminMedicalRecords(recordsRes.data.records || []);
      
      // Fetch all appointments
      try {
        const appointmentsRes = await api.get("/admin/appointments");
        setAdminAppointments(appointmentsRes.data.appointments || []);
      } catch (err) {
        console.warn("Couldn't fetch appointments:", err);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
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
      setIsError(false);
      setMessage(res.data.message || "✅ Appointment booked successfully!");
      setShowBookingModal(false);
      setBookingData({ doctorId: "", date: "", time: "", type: "Consultation" });
      fetchPatientData();
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "❌ Failed to book appointment");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const res = await api.delete(`/appointments/${appointmentId}`);
      setIsError(false);
      setMessage(res.data.message || "✅ Appointment cancelled successfully!");
      fetchPatientData();
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
      setAdminPage("patients");
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
      await api.put(`/appointments/${appointmentId}`, { status });
      setMessage("Appointment status updated successfully");
      fetchAdminData();
    } catch (err) {
      setMessage("Error updating appointment status", true);
      setIsError(true);
    }
  };

  const handleAddUser = async () => {
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      setMessage("Please fill all required fields", true);
      setIsError(true);
      return;
    }

    try {
      await api.post("/register", {
        name: newUserData.name,
        email: newUserData.email,
        password: newUserData.password,
      });
      setMessage(`${addModalType.charAt(0).toUpperCase() + addModalType.slice(1)} added successfully`);
      setIsError(false);
      setShowAddModal(false);
      setNewUserData({ name: "", email: "", password: "", phone: "", role: "patient", specialty: "" });
      fetchAdminData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error adding user", true);
      setIsError(true);
    }
  };

  const handleLogout = () => {
    setAuthToken("");
    setToken("");
    setLoggedInUser(null);
    setActivePage("dashboard");
    setAdminPage("patients");
    setLoginData({ email: "", password: "" });
    setIsError(false);
    setMessage("✅ Logged out successfully.");
  };

  const renderPatientDashboard = () => {
    const upcomingAppointments = appointments.filter((appointment) => {
      // Handle both date formats: ISO datetime string or date-only string
      let dateStr = appointment.date;
      if (dateStr.includes('T')) {
        // If it's an ISO datetime, extract just the date part
        dateStr = dateStr.split('T')[0];
      }
      const appointmentDate = new Date(`${dateStr}T${appointment.time || '00:00'}`);
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

    const nextAppointment = upcomingAppointments.sort((a, b) => {
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
    })[0];

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
                {nextAppointment ? new Date(nextAppointment.date.includes('T') ? nextAppointment.date.split('T')[0] : nextAppointment.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'No upcoming appointments'}
              </h3>

              {nextAppointment ? (
                <div className="mt-4 flex items-center gap-3 text-white text-opacity-90">
                  <Clock3 size={24} />
                  <p className="text-[28px]">{nextAppointment.time || 'TBD'}</p>
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
                  <p className="text-[16px] text-slate-400">{medicalRecords[0].record_date}</p>
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
              className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
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
                        <span>{appointment.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock3 size={18} />
                        <span>{appointment.time}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 xl:items-end">
                  <span
                    className={`rounded-full px-4 py-1 text-sm font-medium ${
                      appointment.status === "Pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {appointment.status}
                  </span>

                  <div className="flex flex-wrap gap-3">
                    {appointment.status === "Pending" && (
                      <button 
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="rounded-2xl border border-red-200 px-7 py-3 text-[18px] text-red-500 hover:bg-red-50">
                        Cancel
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        setSelectedDetail(appointment);
                        setSelectedDetailType("appointment");
                        setShowAppointmentDetails(true);
                      }}
                      className="rounded-2xl border border-slate-200 px-7 py-3 text-[18px] text-slate-700 hover:bg-slate-50">
                      View Details
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

  const renderMedicalRecordsPage = () => (
    <div className="p-9">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-[28px] font-bold">Medical Records</h2>
          <p className="mt-2 text-[18px] text-slate-500">
            View your diagnoses, summaries, and treatment history.
          </p>
        </div>

        <button className="flex items-center gap-3 rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700">
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
              <p className="mt-3 text-[24px] font-bold">{medicalRecords.length > 0 ? medicalRecords[0].record_date : 'N/A'}</p>
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
                        <span>{record.record_date}</span>
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
    const totalPages = Math.ceil(adminPatients.length / itemsPerPage);
    const startIndex = (adminPatientsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPatients = adminPatients.slice(startIndex, endIndex);

    return (
    <div className="p-9">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-[28px] font-bold">Manage Patients</h2>
          <p className="mt-2 text-[18px] text-slate-500">
            View and manage all registered patients.
          </p>
        </div>

        <button
          onClick={() => { setAddModalType("patient"); setShowAddModal(true); setNewUserData({...newUserData, role: "patient"}); }}
          className="flex items-center gap-3 rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-md hover:bg-teal-700"
        >
          <Users size={20} />
          <span>Add Patient</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div className="flex w-full max-w-[360px] items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-slate-400">
            <Search size={18} />
            <span>Search patients by name...</span>
          </div>

          <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-slate-700 hover:bg-slate-50">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>

        <div className="grid grid-cols-6 gap-4 border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-500">
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
            className={`grid grid-cols-6 items-center gap-4 px-5 py-5 ${
              index !== paginatedPatients.length - 1 ? "border-b border-slate-200" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                <User size={18} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[18px] font-medium text-slate-900">{patient.name}</p>
                <p className="text-sm text-slate-500">{patient.email}</p>
              </div>
            </div>

            <div className="text-[17px] text-slate-700">
              {patient.age && patient.gender ? `${patient.age} / ${patient.gender}` : 'N/A'}
            </div>

            <div className="text-[17px] text-slate-700">{patient.blood_group || 'N/A'}</div>

            <div className="text-[17px] text-slate-700">{patient.condition || 'N/A'}</div>

            <div className="text-[17px] text-slate-700">{patient.phone || 'N/A'}</div>

            <div className="flex items-center justify-end gap-4">
              <button className="text-blue-600 hover:opacity-70">
                <Pencil size={18} />
              </button>
              <button
                onClick={() => handleDeleteUser(patient.id, "patient")}
                className="text-red-500 hover:opacity-70"
              >
                <Trash2 size={18} />
              </button>
              <button className="text-slate-500 hover:opacity-70">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        ))}

        {adminPatients.length === 0 && (
          <div className="px-5 py-8 text-center text-slate-500">
            No patients found.
          </div>
        )}

        {adminPatients.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-5 text-slate-500">
            <p>Showing {startIndex + 1} to {Math.min(endIndex, adminPatients.length)} of {adminPatients.length} entries</p>

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
        <button className="flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-white shadow-md hover:bg-teal-700">
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
                'Confirmed': 'bg-yellow-100 text-yellow-700',
                'Completed': 'bg-teal-100 text-teal-700',
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
    const totalPages = Math.ceil(doctors.length / itemsPerPage);
    const startIndex = (adminDoctorsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDoctors = doctors.slice(startIndex, endIndex);

    return (
      <div className="space-y-6 p-9">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[28px] font-bold">Manage Doctors</h2>
            <p className="mt-2 text-[18px] text-slate-500">View and manage all registered doctors.</p>
          </div>
          <button
            onClick={() => { setAddModalType("doctor"); setShowAddModal(true); setNewUserData({...newUserData, role: "doctor"}); }}
            className="flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-white shadow-md hover:bg-teal-700"
          >
            <span>+ Add Doctor</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search doctors by name..."
              className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm hover:bg-slate-50">
            <Filter size={18} />
            Filter
          </button>
        </div>

        {/* Table */}
        <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase text-slate-600">
            <div>Doctor</div>
            <div>Specialization</div>
            <div>Department</div>
            <div>Experience</div>
            <div>Rating</div>
            <div>Patients</div>
            <div className="text-right">Actions</div>
          </div>

          {paginatedDoctors.map((doctor, idx) => (
            <div
              key={doctor.id}
              className={`grid grid-cols-7 items-center gap-4 px-6 py-5 ${
                idx !== paginatedDoctors.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600">
                  <Stethoscope size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{doctor.name}</p>
                  <p className="text-xs text-slate-500">{doctor.email}</p>
                </div>
              </div>
              <div className="text-sm text-slate-700">{doctor.specialty || 'N/A'}</div>
              <div className="text-sm text-slate-700">{doctor.department || 'N/A'}</div>
              <div className="text-sm text-slate-700">{doctor.experience || 'N/A'} years</div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                <span className="text-sm font-medium text-slate-900">{doctor.rating || '4.5'}</span>
              </div>
              <div className="text-sm font-semibold text-teal-600">{doctor.patients_count || '0'}</div>
              <div className="flex items-center justify-end gap-2">
                <button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                  <Pencil size={18} />
                </button>
                <button onClick={() => handleDeleteUser(doctor.id, "doctor")} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                  <Trash2 size={18} />
                </button>
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))}

          {doctors.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-500">
              No doctors found.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing {doctors.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, doctors.length)} of {doctors.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdminDoctorsPage(Math.max(1, adminDoctorsPage - 1))}
              disabled={adminDoctorsPage === 1}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              ← Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setAdminDoctorsPage(page)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  adminDoctorsPage === page
                    ? "bg-teal-600 text-white"
                    : "border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setAdminDoctorsPage(Math.min(totalPages, adminDoctorsPage + 1))}
              disabled={adminDoctorsPage === totalPages}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminAppointmentsPage = () => (
    <div className="p-9">
      <div className="mb-8">
        <h2 className="text-[28px] font-bold">Manage Appointments</h2>
        <p className="mt-2 text-[18px] text-slate-500">View and manage all patient appointments.</p>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-5 gap-4 border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-500">
          <div>ID</div>
          <div>Date & Time</div>
          <div>Type</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>

        {adminAppointments.map((apt, index) => (
          <div
            key={apt.id}
            className={`grid grid-cols-5 items-center gap-4 px-5 py-5 ${
              index !== adminAppointments.length - 1 ? "border-b border-slate-200" : ""
            }`}
          >
            <div className="text-[17px] font-medium text-slate-900">#{apt.id}</div>
            <div className="text-[17px] text-slate-700">{apt.date} {apt.time}</div>
            <div className="text-[17px] text-slate-700">{apt.type}</div>
            <div>
              <select
                value={apt.status}
                onChange={(e) => handleUpdateAppointmentStatus(apt.id, e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-sm"
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => handleDeleteAppointment(apt.id)}
                className="text-red-500 hover:opacity-70"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {adminAppointments.length === 0 && (
          <div className="px-5 py-8 text-center text-slate-500">
            No appointments found.
          </div>
        )}
      </div>
    </div>
  );

  const renderAdminMedicalHistoryPage = () => (
    <div className="p-9">
      <div className="mb-8">
        <h2 className="text-[28px] font-bold">Medical History</h2>
        <p className="mt-2 text-[18px] text-slate-500">Review all medical records in the system.</p>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-5 gap-4 border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-500">
          <div>ID</div>
          <div>Patient</div>
          <div>Doctor</div>
          <div>Diagnosis</div>
          <div className="text-right">Actions</div>
        </div>

        {adminMedicalRecords.map((record, index) => (
          <div
            key={record.id}
            className={`grid grid-cols-5 items-center gap-4 px-5 py-5 ${
              index !== adminMedicalRecords.length - 1 ? "border-b border-slate-200" : ""
            }`}
          >
            <div className="text-[17px] font-medium text-slate-900">#{record.id}</div>
            <div className="text-[17px] text-slate-700">{record.patient_name}</div>
            <div className="text-[17px] text-slate-700">{record.doctor_name}</div>
            <div className="text-[17px] text-slate-700">{record.diagnosis}</div>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => { setSelectedRecord(record); setShowRecordModal(true); }}
                className="text-blue-600 hover:opacity-70"
              >
                <FileText size={18} />
              </button>
              <button
                onClick={() => handleDeleteMedicalRecord(record.id)}
                className="text-red-500 hover:opacity-70"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {adminMedicalRecords.length === 0 && (
          <div className="px-5 py-8 text-center text-slate-500">
            No medical records found.
          </div>
        )}
      </div>

      {showRecordModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
            <h2 className="mb-6 text-[24px] font-bold">Medical Record Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Patient</p>
                <p className="font-medium">{selectedRecord.patient_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Doctor</p>
                <p className="font-medium">{selectedRecord.doctor_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Diagnosis</p>
                <p className="font-medium">{selectedRecord.diagnosis}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Treatment</p>
                <p className="font-medium">{selectedRecord.treatment}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Record Date</p>
                <p className="font-medium">{selectedRecord.record_date}</p>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowRecordModal(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAdminReportsPage = () => (
    <div className="p-9">
      <h2 className="text-[28px] font-bold">Reports</h2>
      <p className="mt-2 text-[18px] text-slate-500">Generate and review system reports.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <ReportCard
          title="Patient Demographics"
          description="View statistics about patient distribution"
          data={`Total Patients: ${adminStats.totalPatients}`}
        />
        <ReportCard
          title="Doctor Performance"
          description="Track doctor appointments and records"
          data={`Total Doctors: ${adminStats.totalDoctors}`}
        />
        <ReportCard
          title="Appointment Summary"
          description="Overview of appointment statuses"
          data={`
            Pending: ${adminStats.pendingAppointments}
            Completed: ${adminStats.completedAppointments}
          `}
        />
        <ReportCard
          title="Medical Records"
          description="Total medical records in system"
          data={`Total Records: ${adminStats.totalMedicalRecords}`}
        />
      </div>
    </div>
  );

  const ReportCard = ({ title, description, data }) => (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-[20px] font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <pre className="whitespace-pre-wrap text-sm text-slate-700">{data}</pre>
      </div>
    </div>
  );

  const renderAdminSettingsPage = () => (
    <div className="p-9">
      <h2 className="text-[28px] font-bold">System Settings</h2>
      <p className="mt-2 text-[18px] text-slate-500">Configure system-wide settings and preferences.</p>

      <div className="mt-8 space-y-6">
        <SettingsSection
          title="Database"
          description="Database configuration"
          fields={[
            { label: "Database Status", value: "Connected ✓", readonly: true },
            { label: "Host", value: "localhost", readonly: true },
            { label: "Backup Status", value: "Last backup: Today at 10:30 AM", readonly: true },
          ]}
        />
        <SettingsSection
          title="User Management"
          description="User and role settings"
          fields={[
            { label: "Default User Role", value: "patient", editable: true },
            { label: "Password Policy", value: "Min 8 characters", readonly: true },
            { label: "Session Timeout", value: "8 hours", editable: true },
          ]}
        />
        <SettingsSection
          title="System"
          description="General system settings"
          fields={[
            { label: "System Version", value: "1.0.0", readonly: true },
            { label: "Last Updated", value: "2026-04-12", readonly: true },
          ]}
        />
      </div>
    </div>
  );

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
    return <DoctorDashboard loggedInUser={loggedInUser} onLogout={handleLogout} />;
  }

  if (loggedInUser && loggedInUser.role === "patient") {
    return (
      <>
        <div className="flex min-h-screen">
          <aside className={`flex w-[260px] flex-col justify-between border-r transition-colors ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <div>
              <div className="flex h-[72px] items-center gap-3 border-b border-slate-200 px-6">
                <Activity className="text-teal-600" size={28} />
                <h1 className="text-[30px] font-semibold tracking-tight">MediCare</h1>
              </div>

              <nav className="px-3 py-6">
                <button
                  onClick={() => setActivePage("dashboard")}
                  className={`mb-3 flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "dashboard"
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard size={22} />
                  <span className="text-[18px]">Dashboard</span>
                </button>

                <button
                  onClick={() => setActivePage("appointments")}
                  className={`mb-3 flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "appointments"
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CalendarDays size={22} />
                  <span className="text-[18px]">My Appointments</span>
                </button>

                <button
                  onClick={() => setActivePage("records")}
                  className={`mb-3 flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "records"
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileText size={22} />
                  <span className="text-[18px]">Medical Records</span>
                </button>

                <button
                  onClick={() => setActivePage("profile")}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left ${
                    activePage === "profile"
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <UserCircle size={22} />
                  <span className="text-[18px]">Profile</span>
                </button>
              </nav>
            </div>

            <div className="border-t border-slate-200 p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-slate-600 hover:bg-slate-50"
              >
                <LogOut size={22} />
                <span className="text-[18px]">Logout</span>
              </button>
            </div>
          </aside>

          <main className="flex-1">
            <div className={`flex h-[72px] items-center justify-between border-b transition-colors ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} px-9`}>
              <div className="flex items-center gap-6">
                <button className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                  <Menu size={24} />
                </button>

                <div className={`hidden items-center gap-3 rounded-xl px-4 py-3 lg:flex lg:w-[390px] transition-colors ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>
                  <Search size={18} />
                  <span>Search appointments, records...</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`rounded-lg p-2 transition-colors ${darkMode ? 'bg-slate-700 text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <Moon size={20} />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative rounded-lg p-2 transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Bell size={20} />
                    {notifications.some(n => n.unread) && (
                      <span className="absolute right-0 top-0 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-lg">
                      <div className="border-b border-slate-200 p-4">
                        <h3 className="text-[18px] font-bold">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(notif => (
                            <div 
                              key={notif.id}
                              className={`cursor-pointer border-b border-slate-100 p-4 transition-colors hover:bg-slate-50 ${
                                notif.unread ? 'bg-blue-50' : ''
                              }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold">{notif.title}</p>
                                  <p className="mt-1 text-sm text-slate-600">{notif.message}</p>
                                  <p className="mt-2 text-xs text-slate-400">{notif.time}</p>
                                </div>
                                {notif.unread && (
                                  <div className="ml-2 mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-slate-500">
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
      </>
    );
  }

  if (loggedInUser && loggedInUser.role === "admin") {
    return (
      <>
        <div className="flex min-h-screen">
          <aside className={`flex w-[260px] flex-col justify-between border-r transition-colors ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <div>
              <div className="flex h-[72px] items-center gap-3 border-b border-slate-200 px-6">
                <Activity className="text-teal-600" size={28} />
                <h1 className="text-[30px] font-semibold tracking-tight">MediCare</h1>
              </div>

              <nav className="px-3 py-6">
                <button
                  onClick={() => setAdminPage("dashboard")}
                  className={`mb-3 flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "dashboard"
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard size={22} />
                  <span className="text-[18px]">Dashboard</span>
                </button>

                <button
                  onClick={() => setAdminPage("patients")}
                  className={`mb-3 flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "patients"
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Users size={22} />
                  <span className="text-[18px]">Patients</span>
                </button>

                <button
                  onClick={() => setAdminPage("doctors")}
                  className={`mb-3 flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "doctors"
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <UserCog size={22} />
                  <span className="text-[18px]">Doctors</span>
                </button>

                <button
                  onClick={() => setAdminPage("appointments")}
                  className={`mb-3 flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "appointments"
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CalendarRange size={22} />
                  <span className="text-[18px]">Appointments</span>
                </button>

                <button
                  onClick={() => setAdminPage("history")}
                  className={`mb-3 flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "history"
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileHeart size={22} />
                  <span className="text-[18px]">Medical History</span>
                </button>

                <button
                  onClick={() => setAdminPage("reports")}
                  className={`mb-3 flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "reports"
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BarChart3 size={22} />
                  <span className="text-[18px]">Reports</span>
                </button>

                <button
                  onClick={() => setAdminPage("settings")}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left ${
                    adminPage === "settings"
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Settings size={22} />
                  <span className="text-[18px]">Settings</span>
                </button>
              </nav>
            </div>

            <div className="border-t border-slate-200 p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-red-500 hover:bg-red-50"
              >
                <LogOut size={22} />
                <span className="text-[18px]">Logout</span>
              </button>
            </div>
          </aside>

          <main className="flex-1">
            <div className={`flex h-[72px] items-center justify-between border-b transition-colors ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} px-9`}>
              <div className="flex items-center gap-6">
                <button className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                  <Menu size={24} />
                </button>

                <div className={`hidden items-center gap-3 rounded-xl px-4 py-3 lg:flex lg:w-[390px] transition-colors ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>
                  <Search size={18} />
                  <span>Search patients, doctors, appointments...</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`rounded-lg p-2 transition-colors ${darkMode ? 'bg-slate-200 text-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <Moon size={20} />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                    <Bell size={20} />
                    {notifications.some(n => n.unread) && (
                      <span className="absolute right-0 top-0 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-lg">
                      <div className="border-b border-slate-200 p-4">
                        <h3 className="text-[18px] font-bold">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(notif => (
                            <div 
                              key={notif.id}
                              className={`cursor-pointer border-b border-slate-100 p-4 transition-colors hover:bg-slate-50 ${
                                notif.unread ? 'bg-blue-50' : ''
                              }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold">{notif.title}</p>
                                  <p className="mt-1 text-sm text-slate-600">{notif.message}</p>
                                  <p className="mt-2 text-xs text-slate-400">{notif.time}</p>
                                </div>
                                {notif.unread && (
                                  <div className="ml-2 mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-slate-500">
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

        {showAppointmentDetails && selectedDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAppointmentDetails(false);
              setSelectedDetail(null);
              setSelectedDetailType("");
            }
          }}>
            <div ref={detailsRef} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-start justify-between">
                <h2 className="text-[24px] font-bold">
                  {selectedDetailType === "record" ? "Medical Record Details" : "Appointment Details"}
                </h2>
                <button
                  onClick={() => {
                    setShowAppointmentDetails(false);
                    setSelectedDetail(null);
                    setSelectedDetailType("");
                  }}
                  className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {selectedDetailType === "record" ? (
                  <>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Title</p>
                      <p className="mt-2 text-[18px] font-medium">{selectedDetail.title}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Diagnosis</p>
                      <p className="mt-2 text-[18px] font-medium">{selectedDetail.diagnosis || "Not specified"}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Treatment</p>
                      <p className="mt-2 text-[18px] font-medium">{selectedDetail.treatment || "Not specified"}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Doctor</p>
                      <p className="mt-2 text-[18px] font-medium">{doctors.find((doc) => doc.id === selectedDetail.doctor_id)?.name || `ID ${selectedDetail.doctor_id}`}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Date</p>
                      <p className="mt-2 text-[18px] font-medium">{selectedDetail.record_date}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Doctor</p>
                      <p className="mt-2 text-[18px] font-medium">{doctors.find((doc) => doc.id === selectedDetail.doctor_id)?.name || `ID ${selectedDetail.doctor_id}`}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Date</p>
                      <p className="mt-2 text-[18px] font-medium">{selectedDetail.date}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Time</p>
                      <p className="mt-2 text-[18px] font-medium">{selectedDetail.time}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Type</p>
                      <p className="mt-2 text-[18px] font-medium">{selectedDetail.type}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Status</p>
                      <p className={`mt-2 text-[18px] font-medium ${
                        selectedDetail.status === 'Confirmed' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {selectedDetail.status}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  setShowAppointmentDetails(false);
                  setSelectedDetail(null);
                  setSelectedDetailType("");
                }}
                className="mt-6 w-full rounded-2xl bg-slate-100 px-6 py-3 font-medium text-slate-700 hover:bg-slate-200">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-[24px] font-bold">
                Add {addModalType.charAt(0).toUpperCase() + addModalType.slice(1)}
              </h2>
              
              <div className="space-y-4">
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
                <input
                  type="password"
                  placeholder="Password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                />
                <input
                  type="tel"
                  placeholder="Phone (Optional)"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                />
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  className="flex-1 rounded-lg bg-teal-600 px-4 py-3 font-medium text-white hover:bg-teal-700"
                >
                  Add {addModalType.charAt(0).toUpperCase() + addModalType.slice(1)}
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
