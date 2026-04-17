/**
 * AvailableDoctorsList.jsx
 * Component for patients to see available doctors and book appointments
 */

import { useState, useEffect } from "react";
import { Users, Calendar, MapPin, Star, AlertCircle } from "lucide-react";
import api from "./api";

export default function AvailableDoctorsList({ selectedSpecialty, darkMode, onDoctorSelect }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (selectedSpecialty && selectedDate) {
      fetchAvailableDoctors();
    }
  }, [selectedSpecialty, selectedDate]);

  const fetchAvailableDoctors = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await api.get("/api/available-doctors", {
        params: {
          specialty: selectedSpecialty,
          date: selectedDate,
        },
      });

      setDoctors(response.data.doctors || []);
      if (!response.data.doctors || response.data.doctors.length === 0) {
        setMessage("No available doctors for the selected department and date");
      }
    } catch (error) {
      setMessage("Error fetching available doctors");
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
    <div className={`${bgClasses} border rounded-lg p-6`}>
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-teal-600" />
        <h3 className={`text-lg font-bold ${textClasses}`}>Available Doctors</h3>
      </div>

      {/* Date Selector */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className={`w-full px-4 py-2 rounded-lg border ${
            darkMode
              ? "bg-slate-700 border-slate-600 text-slate-100"
              : "bg-white border-slate-300 text-slate-900"
          }`}
        />
      </div>

      {/* Message */}
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-amber-100 text-amber-800 flex items-center gap-2">
          <AlertCircle size={18} />
          {message}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className={`inline-block animate-spin h-6 w-6 ${darkMode ? "border-slate-300" : "border-slate-600"} border-2 border-teal-600`} />
          <p className={`mt-2 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Loading doctors...</p>
        </div>
      )}

      {/* Doctors List */}
      {!loading && doctors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              onClick={() => handleDoctorSelect(doctor)}
              className={`${cardBg} p-4 rounded-lg border cursor-pointer transition ${
                darkMode ? "border-slate-600" : "border-slate-200"
              } ${selectedDoctor?.id === doctor.id ? "ring-2 ring-teal-600" : ""}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className={`font-semibold ${textClasses}`}>{doctor.name}</h4>
                  <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                    {doctor.specialty}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    doctor.status === "Available"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {doctor.status}
                </span>
              </div>

              {doctor.rating && (
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                    {doctor.rating} rating
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1 mb-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {doctor.hospital || "Hospital"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-slate-400" />
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {doctor.workingHours?.start || "09:00"} - {doctor.workingHours?.end || "18:00"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && doctors.length === 0 && !message && (
        <div className={`text-center py-8 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Select a specialty to see available doctors</p>
        </div>
      )}
    </div>
  );
}
