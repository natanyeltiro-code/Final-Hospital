/**
 * AvailableSlotsSelector.jsx
 * Component to select available time slots for appointments
 */

import { useState, useEffect } from "react";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import api from "./api";

export default function AvailableSlotsSelector({
  doctorId,
  selectedDate,
  onSlotSelected,
  darkMode,
}) {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (doctorId && selectedDate) {
      fetchAvailableSlots();
    }
  }, [doctorId, selectedDate]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const response = await api.get(`/api/available-slots/${doctorId}`, {
        params: { date: selectedDate },
      });

      const availableSlots = response.data.slots.filter((slot) => slot.is_available);
      setSlots(availableSlots);

      if (availableSlots.length === 0) {
        setMessage("No available slots for the selected date");
        setError(true);
      }
    } catch (err) {
      setMessage("Error fetching available slots");
      setError(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    onSlotSelected(slot);
  };

  const bgClasses = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-white border-slate-200";
  const textClasses = darkMode ? "text-slate-100" : "text-slate-900";
  const slotBg = darkMode ? "bg-slate-700" : "bg-slate-50";

  return (
    <div className={`${bgClasses} border rounded-lg p-6`}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-6 w-6 text-teal-600" />
        <h3 className={`text-lg font-bold ${textClasses}`}>Select Time Slot</h3>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            error
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {error ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {message}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div
            className={`inline-block animate-spin h-6 w-6 border-2 border-teal-600 ${
              darkMode ? "border-slate-300" : "border-slate-600"
            }`}
          />
          <p
            className={`mt-2 ${
              darkMode ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Loading slots...
          </p>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <div>
          <p
            className={`text-sm font-medium mb-3 ${
              darkMode ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Available times for {selectedDate}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => handleSlotSelect(slot)}
                className={`px-4 py-3 rounded-lg font-medium text-sm transition border ${
                  selectedSlot?.id === slot.id
                    ? "bg-teal-600 text-white border-teal-700"
                    : `${slotBg} ${
                        darkMode
                          ? "border-slate-600 text-slate-100 hover:bg-slate-600"
                          : "border-slate-300 text-slate-900 hover:bg-slate-100"
                      }`
                }`}
              >
                {slot.slot_time || slot.time}
              </button>
            ))}
          </div>
          {selectedSlot && (
            <div className="mt-4 p-3 rounded-lg bg-teal-50 border border-teal-200">
              <p className="text-teal-800 font-medium">
                ✓ Selected: {selectedSlot.slot_time || selectedSlot.time}
              </p>
            </div>
          )}
        </div>
      )}

      {!loading && slots.length === 0 && !message && (
        <div
          className={`text-center py-8 ${
            darkMode ? "text-slate-400" : "text-slate-600"
          }`}
        >
          <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Select a doctor and date to see available times</p>
        </div>
      )}
    </div>
  );
}
