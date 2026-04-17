/**
 * SimpleAppointmentBooking.jsx
 * 
 * Simple appointment booking component WITHOUT real-time availability dashboard
 * Features:
 * - Select Doctor
 * - Select Date
 * - Select Time from available slots
 * - Double-booking prevention (backend validated)
 * - Error messages for booked slots
 */

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Loader,
  X,
} from "lucide-react";
import api from "./api";

export default function SimpleAppointmentBooking({ 
  darkMode, 
  loggedInUser, 
  onBookingSuccess,
  onClose 
}) {
  // Form state
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("Consultation");
  
  // Data state
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  
  // Loading/UI state
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Styling
  const bgClass = darkMode ? "bg-slate-800" : "bg-white";
  const textClass = darkMode ? "text-slate-100" : "text-slate-900";
  const borderClass = darkMode ? "border-slate-700" : "border-slate-200";
  const inputClass = darkMode
    ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400"
    : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500";
  const hoverClass = darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50";
  
  // Fetch departments and doctors on component mount
  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
    // Set minimum date to today
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate("");
  }, []);
  
  // Fetch doctors when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchDoctors(selectedDepartment);
    } else {
      fetchDoctors();
    }
    // Reset doctor and date/time selections when department changes
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedTime("");
  }, [selectedDepartment]);
  
  // Fetch available slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setBookedSlots([]);
      setSelectedTime("");
    }
  }, [selectedDoctor, selectedDate]);
  
  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    setError("");
    try {
      const response = await api.get("/departments");
      const departmentList = response.data.departments || [];
      setDepartments(departmentList);
      console.log(`✅ Loaded ${departmentList.length} departments`);
    } catch (err) {
      console.error("❌ Error fetching departments:", err.message);
      // Don't show error for departments as it's optional
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };
  
  const fetchDoctors = async (department = "") => {
    setLoading(true);
    setError("");
    try {
      const params = department ? { department } : {};
      const response = await api.get("/doctors", { params });
      const doctorList = response.data.doctors || [];
      setDoctors(doctorList);
      const filterMsg = department ? ` in ${department}` : '';
      console.log(`✅ Loaded ${doctorList.length} doctors${filterMsg}`);
    } catch (err) {
      console.error("❌ Error fetching doctors:", err.message);
      setError("Failed to load doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    setError("");
    setMessage("");
    setSelectedTime("");
    
    try {
      console.log(`\n📅 Fetching available slots...`);
      console.log(`   Doctor ID: ${selectedDoctor.id}`);
      console.log(`   Date: ${selectedDate}`);
      
      // Use doctor's working hours if available
      const startTime = selectedDoctor.work_start_time || "09:00";
      const endTime = selectedDoctor.work_end_time || "18:00";
      
      const response = await api.get(
        `/available-slots/${selectedDoctor.id}/${selectedDate}`,
        {
          params: {
            startTime: startTime.substring(0, 5),
            endTime: endTime.substring(0, 5),
            slotDuration: 30,
          },
        }
      );
      
      const slots = response.data.availableSlots || [];
      const booked = response.data.bookedSlots || [];
      
      console.log(`✅ Available slots: ${slots.length}, Booked: ${booked.length}`);
      
      setAvailableSlots(slots);
      setBookedSlots(booked);
      
      if (slots.length === 0) {
        setMessage(
          `⚠️ No available slots for Dr. ${selectedDoctor.name} on ${selectedDate}. All times are booked.`
        );
      }
    } catch (err) {
      console.error("❌ Error fetching available slots:", err.message);
      setError("Failed to load available time slots. Please try again.");
      setAvailableSlots([]);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };
  
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setError("❌ Please select doctor, date, and time");
      return;
    }
    
    if (!loggedInUser || !loggedInUser.id) {
      setError("❌ You must be logged in to book an appointment");
      return;
    }
    
    setSubmitting(true);
    setError("");
    setMessage("");
    
    try {
      console.log(`\n🎯 BOOKING APPOINTMENT`);
      console.log(`   Patient ID: ${loggedInUser.id}`);
      console.log(`   Doctor ID: ${selectedDoctor.id}`);
      console.log(`   Date: ${selectedDate}`);
      console.log(`   Time: ${selectedTime}`);
      console.log(`   Type: ${appointmentType}`);
      
      // First, verify the slot is still available (race condition check)
      console.log(`\n🔐 Verifying slot availability...`);
      const checkResponse = await api.get(
        `/appointments/check-slot/${selectedDoctor.id}/${selectedDate}/${selectedTime}`
      );
      
      if (!checkResponse.data.available) {
        setError(
          `❌ ${selectedTime} is no longer available. Someone else just booked it! Please select another time.`
        );
        // Refresh available slots
        await fetchAvailableSlots();
        return;
      }
      
      console.log(`✅ Slot confirmed available`);
      
      // Book the appointment
      const bookResponse = await api.post("/appointments", {
        patientId: loggedInUser.id,
        doctorId: selectedDoctor.id,
        date: selectedDate,
        time: selectedTime,
        type: appointmentType,
        status: "Pending",
      });
      
      console.log(`✅ Appointment booked successfully!`);
      console.log(`   Response:`, bookResponse.data);
      
      setSuccess(true);
      setMessage(`✅ ${bookResponse.data.message}`);
      
      // Reset form
      setSelectedDoctor(null);
      setSelectedDate("");
      setSelectedTime("");
      setAppointmentType("Consultation");
      setAvailableSlots([]);
      setBookedSlots([]);
      
      // Notify parent component
      if (onBookingSuccess) {
        setTimeout(() => {
          onBookingSuccess(bookResponse.data);
        }, 1500);
      }
    } catch (err) {
      console.error("❌ Booking error:", err.response?.data || err.message);
      
      if (err.response?.status === 409) {
        // Double booking detected
        setError(
          err.response.data.message ||
          `❌ This time slot is already booked! Please select a different time.`
        );
        // Refresh to show latest booked slots
        await fetchAvailableSlots();
      } else {
        setError(
          err.response?.data?.message ||
          "❌ Failed to book appointment. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };
  
  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Allow booking up to 30 days in advance
    return date.toISOString().split("T")[0];
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString)
      .toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
  };
  
  return (
    <div className={`rounded-lg border ${borderClass} ${bgClass} p-6 max-w-2xl`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="text-teal-600" size={28} />
          <h2 className={`text-2xl font-bold ${textClass}`}>
            Book Appointment
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={24} />
          </button>
        )}
      </div>
      
      {/* Success State */}
      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-100 border border-green-300 flex items-start gap-3">
          <CheckCircle className="text-green-600 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-green-800">{message}</p>
            <p className="text-sm text-green-700 mt-1">
              The doctor will confirm your appointment soon.
            </p>
          </div>
        </div>
      )}
      
      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-100 border border-red-300 flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-800">Booking Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Info Message */}
      {message && !error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-100 border border-amber-300 flex items-start gap-3">
          <AlertCircle className="text-amber-600 mt-0.5" size={20} />
          <p className="text-sm text-amber-800">{message}</p>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmitBooking} className="space-y-6">
        {/* Department Selection */}
        {departments.length > 0 && (
          <div>
            <label className={`block text-sm font-semibold ${textClass} mb-2`}>
              <div className="flex items-center gap-2">
                <User size={16} />
                Select Department
              </div>
            </label>
            
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${inputClass} focus:ring-2 focus:ring-teal-600 focus:border-transparent`}
            >
              <option value="">-- All Departments --</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Doctor Selection */}
        <div>
          <label className={`block text-sm font-semibold ${textClass} mb-2`}>
            <div className="flex items-center gap-2">
              <User size={16} />
              Select Doctor
              {selectedDepartment && (
                <span className="text-xs font-normal text-teal-600">
                  ({selectedDepartment})
                </span>
              )}
            </div>
          </label>
          
          {loading ? (
            <div className={`p-4 rounded-lg border ${borderClass} flex items-center gap-2`}>
              <Loader className="animate-spin" size={16} />
              <span className={textClass}>Loading doctors...</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className={`p-4 rounded-lg border ${borderClass} text-center text-slate-500`}>
              No doctors available
              {selectedDepartment && ` in ${selectedDepartment}`}
            </div>
          ) : (
            <select
              value={selectedDoctor ? selectedDoctor.id : ""}
              onChange={(e) => {
                const doctor = doctors.find(
                  (d) => d.id === parseInt(e.target.value)
                );
                setSelectedDoctor(doctor || null);
              }}
              disabled={doctors.length === 0}
              className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${inputClass} focus:ring-2 focus:ring-teal-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">-- Choose a doctor --</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name}
                  {doctor.specialty ? ` (${doctor.specialty})` : ""}
                  {doctor.department ? ` - ${doctor.department}` : ""}
                  {doctor.rating
                    ? ` - ⭐ ${doctor.rating.toFixed(1)}`
                    : ""}
                </option>
              ))}
            </select>
          )}
        </div>
        
        {/* Date Selection */}
        <div>
          <label className={`block text-sm font-semibold ${textClass} mb-2`}>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              Select Date
            </div>
          </label>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={!selectedDoctor}
            min={getTodayDate()}
            max={getMaxDate()}
            className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${inputClass} focus:ring-2 focus:ring-teal-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <p className="text-xs text-slate-500 mt-1">
            You can book up to 30 days in advance
          </p>
        </div>
        
        {/* Time Selection */}
        <div>
          <label className={`block text-sm font-semibold ${textClass} mb-2`}>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              Select Time
            </div>
          </label>
          
          {!selectedDate ? (
            <div className={`p-4 rounded-lg border ${borderClass} text-center text-slate-500`}>
              Select a date first
            </div>
          ) : loadingSlots ? (
            <div className={`p-4 rounded-lg border ${borderClass} flex items-center gap-2`}>
              <Loader className="animate-spin" size={16} />
              <span className={textClass}>Loading available times...</span>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className={`p-4 rounded-lg border ${borderClass} text-center`}>
              <AlertCircle
                className="mx-auto mb-2 text-amber-600"
                size={20}
              />
              <p className={`text-sm ${textClass}`}>
                ❌ No available time slots
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Please select a different date
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`p-2 rounded-lg border font-medium text-sm transition ${
                    selectedTime === time
                      ? "bg-teal-600 border-teal-600 text-white"
                      : `border ${borderClass} ${textClass} ${hoverClass}`
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
          
          {bookedSlots.length > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              ℹ️ {bookedSlots.length} slots are already booked for this date
            </p>
          )}
        </div>
        
        {/* Appointment Type */}
        <div>
          <label className={`block text-sm font-semibold ${textClass} mb-2`}>
            Appointment Type
          </label>
          
          <select
            value={appointmentType}
            onChange={(e) => setAppointmentType(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${inputClass} focus:ring-2 focus:ring-teal-600 focus:border-transparent`}
          >
            <option value="Consultation">Consultation</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Check-up">Check-up</option>
            <option value="Treatment">Treatment</option>
          </select>
        </div>
        
        {/* Summary */}
        {selectedDoctor && selectedDate && selectedTime && (
          <div className={`p-4 rounded-lg border ${borderClass} bg-opacity-50`}>
            <p className={`text-sm font-semibold ${textClass} mb-2`}>
              📋 Booking Summary:
            </p>
            <div className="space-y-1 text-sm text-slate-600">
              {selectedDepartment && (
                <p>
                  <span className="font-medium">Department:</span> {selectedDepartment}
                </p>
              )}
              <p>
                <span className="font-medium">Doctor:</span> Dr.{" "}
                {selectedDoctor.name}
                {selectedDoctor.specialty && ` (${selectedDoctor.specialty})`}
              </p>
              <p>
                <span className="font-medium">Date:</span>{" "}
                {formatDate(selectedDate)}
              </p>
              <p>
                <span className="font-medium">Time:</span> {selectedTime}
              </p>
              <p>
                <span className="font-medium">Type:</span> {appointmentType}
              </p>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting || !selectedDoctor || !selectedDate || !selectedTime}
            className="flex-1 px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader className="animate-spin" size={18} />
                Booking...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Book Appointment
              </>
            )}
          </button>
          
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 rounded-lg border ${borderClass} font-semibold hover:${hoverClass} transition`}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
