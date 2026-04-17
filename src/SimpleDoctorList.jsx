/**
 * SimpleDoctorList.jsx
 * Fallback component that works without availability system
 * Shows all doctors of selected specialty
 */

import { useState, useEffect } from "react";
import { Users, AlertCircle } from "lucide-react";
import api from "./api";

export default function SimpleDoctorList({ selectedSpecialty, darkMode, onDoctorSelect }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (selectedSpecialty) {
      fetchDoctors();
    }
  }, [selectedSpecialty]);

  const fetchDoctors = async () => {
    setLoading(true);
    setMessage("");
    try {
      // Try to use availability API first
      try {
        console.log(`🔍 Fetching doctors for department: ${selectedSpecialty}`);
        const response = await api.get("/api/available-doctors", {
          params: {
            specialty: selectedSpecialty,
            date: new Date().toISOString().split("T")[0],
          },
        });
        console.log(`✅ API Response:`, response.data);
        const doctorsArray = response.data.doctors || [];
        setDoctors(doctorsArray);
        
        if (doctorsArray.length === 0) {
          setMessage(`No available doctors for ${selectedSpecialty}`);
        }
      } catch (apiError) {
        console.error("🔴 API Error:", apiError.message);
        // Fallback: Get all doctors and filter by department
        try {
          const response = await api.get("/doctors");
          const allDoctors = response.data.doctors || [];
          const filteredDoctors = allDoctors.filter(
            (doc) => doc.department === selectedSpecialty
          );
          setDoctors(filteredDoctors);
          
          if (filteredDoctors.length === 0) {
            setMessage(`No doctors found for ${selectedSpecialty}`);
          }
        } catch (fallbackError) {
          console.error("🔴 Fallback Error:", fallbackError.message);
          setMessage(`Error fetching doctors: ${fallbackError.message}`);
        }
      }
    } catch (error) {
      setMessage(`Error fetching doctors: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    if (onDoctorSelect) {
      onDoctorSelect(doctor);
    }
  };

  const bgClasses = darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";
  const textClasses = darkMode ? "text-slate-100" : "text-slate-900";
  const cardBg = darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-50 hover:bg-slate-100";

  return (
    <div>
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-amber-100 text-amber-800 flex items-center gap-2">
          <AlertCircle size={18} />
          {message}
        </div>
      )}

      {loading && (
        <div className="text-center py-6">
          <div className={`inline-block animate-spin h-6 w-6 border-2 border-teal-600 ${darkMode ? "border-slate-300" : "border-slate-600"}`} />
          <p className={`mt-2 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Loading doctors...</p>
        </div>
      )}

      {!loading && doctors.length > 0 && (
        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
          {doctors.map((doctor) => (
            <button
              key={doctor.id}
              type="button"
              onClick={() => handleDoctorSelect(doctor)}
              className={`p-4 rounded-lg border text-left transition ${
                selectedDoctor?.id === doctor.id
                  ? "bg-teal-100 border-teal-600 ring-2 ring-teal-600"
                  : `${cardBg} ${darkMode ? "border-slate-600" : "border-slate-200"}`
              }`}
            >
              <p className={`font-semibold ${textClasses}`}>{doctor.name}</p>
              <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                {doctor.specialty || doctor.department || "General"}
              </p>
              {doctor.rating && (
                <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  ⭐ {doctor.rating} rating
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && doctors.length === 0 && !message && (
        <div className={`text-center py-6 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          <p className="text-sm">No doctors available</p>
        </div>
      )}
    </div>
  );
}
