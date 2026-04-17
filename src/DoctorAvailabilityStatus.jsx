/**
 * DoctorAvailabilityStatus.jsx
 * Simple component for doctors to update their availability status
 */

import { useState, useEffect } from "react";
import { Activity, Clock, AlertCircle, CheckCircle } from "lucide-react";
import api from "./api";

export default function DoctorAvailabilityStatus({ doctorId, darkMode }) {
  const [status, setStatus] = useState("Available");
  const [workHours, setWorkHours] = useState({ start: "09:00", end: "18:00" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetchDoctorAvailability();
  }, [doctorId]);

  const fetchDoctorAvailability = async () => {
    try {
      const response = await api.get(`/api/doctor/${doctorId}/availability`);
      setStatus(response.data.doctor.status);
      setWorkHours({
        start: response.data.doctor.workingHours.start.slice(0, 5),
        end: response.data.doctor.workingHours.end.slice(0, 5),
      });
    } catch (error) {
      console.error("Error fetching availability:", error);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await api.put(`/api/doctor/status/${doctorId}`, {
        status: newStatus,
      });

      setStatus(newStatus);
      setMessage(response.data.message || "✅ Status updated");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || "❌ Error updating status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (st) => {
    switch (st) {
      case "Available":
        return "bg-green-100 text-green-800 border-green-300";
      case "Busy":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Off-duty":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const bgClasses = darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";
  const textClasses = darkMode ? "text-slate-100" : "text-slate-900";

  return (
    <div className={`${bgClasses} border rounded-lg p-6 max-w-md`}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-6 w-6 text-teal-600" />
        <h3 className={`text-lg font-bold ${textClasses}`}>Your Availability</h3>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded flex items-center gap-2 ${
            isError
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {isError ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {message}
        </div>
      )}

      {/* Current Status */}
      <div className="mb-6">
        <p className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-600"} mb-2`}>
          Current Status
        </p>
        <div className={`p-3 rounded-lg border-2 ${getStatusColor(status)}`}>
          <p className="font-semibold text-center">{status}</p>
        </div>
      </div>

      {/* Status Options */}
      <div className="space-y-2 mb-6">
        <p className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          Update Status
        </p>
        <button
          onClick={() => handleStatusUpdate("Available")}
          disabled={loading}
          className={`w-full px-4 py-2 rounded-lg font-medium transition ${
            status === "Available"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          } disabled:opacity-50`}
        >
          ✓ Available
        </button>

        <button
          onClick={() => handleStatusUpdate("Busy")}
          disabled={loading}
          className={`w-full px-4 py-2 rounded-lg font-medium transition ${
            status === "Busy"
              ? "bg-yellow-600 text-white"
              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          } disabled:opacity-50`}
        >
          ⏳ Busy
        </button>

        <button
          onClick={() => handleStatusUpdate("Off-duty")}
          disabled={loading}
          className={`w-full px-4 py-2 rounded-lg font-medium transition ${
            status === "Off-duty"
              ? "bg-red-600 text-white"
              : "bg-red-100 text-red-800 hover:bg-red-200"
          } disabled:opacity-50`}
        >
          ✕ Off-duty
        </button>
      </div>

      {/* Working Hours */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-teal-600" />
          <p className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Working Hours
          </p>
        </div>
        <p className={textClasses}>
          {workHours.start} - {workHours.end}
        </p>
      </div>
    </div>
  );
}
