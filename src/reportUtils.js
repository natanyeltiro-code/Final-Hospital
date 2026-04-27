export const parseDateSafe = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getReportPeriodRange = (period, now = new Date()) => {
  const current = new Date(now);
  current.setHours(23, 59, 59, 999);

  let start;
  let end;
  let previousStart;
  let previousEnd;

  if (period === "This Month") {
    start = new Date(current.getFullYear(), current.getMonth(), 1);
    end = new Date(current);
    previousStart = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    previousEnd = new Date(current.getFullYear(), current.getMonth(), 0, 23, 59, 59, 999);
  } else if (period === "Last Month") {
    start = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    end = new Date(current.getFullYear(), current.getMonth(), 0, 23, 59, 59, 999);
    previousStart = new Date(current.getFullYear(), current.getMonth() - 2, 1);
    previousEnd = new Date(current.getFullYear(), current.getMonth() - 1, 0, 23, 59, 59, 999);
  } else if (period === "Last Quarter") {
    const currentQuarter = Math.floor(current.getMonth() / 3);
    const quarterStartMonth = currentQuarter * 3;
    start = new Date(current.getFullYear(), quarterStartMonth - 3, 1);
    end = new Date(current.getFullYear(), quarterStartMonth, 0, 23, 59, 59, 999);
    previousStart = new Date(current.getFullYear(), quarterStartMonth - 6, 1);
    previousEnd = new Date(current.getFullYear(), quarterStartMonth - 3, 0, 23, 59, 59, 999);
  } else {
    start = new Date(current.getFullYear(), 0, 1);
    end = new Date(current);
    previousStart = new Date(current.getFullYear() - 1, 0, 1);
    previousEnd = new Date(
      current.getFullYear() - 1,
      current.getMonth(),
      current.getDate(),
      23,
      59,
      59,
      999
    );
  }

  start.setHours(0, 0, 0, 0);
  previousStart.setHours(0, 0, 0, 0);

  return { start, end, previousStart, previousEnd };
};

export const isDateWithinRange = (value, start, end) => {
  const date = parseDateSafe(value);
  if (!date) return false;
  return date >= start && date <= end;
};

export const formatTrendChange = (currentValue, previousValue) => {
  if (!previousValue) {
    if (!currentValue) return "0.0%";
    return "+100.0%";
  }

  const change = ((currentValue - previousValue) / previousValue) * 100;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
};

export const buildReportAnalytics = ({
  period,
  adminAppointments,
  adminMedicalRecords,
  adminPatients,
  doctors,
}) => {
  const { start, end, previousStart, previousEnd } = getReportPeriodRange(period);

  const filteredAppointments = adminAppointments.filter((apt) =>
    isDateWithinRange(apt.date, start, end)
  );
  const previousAppointments = adminAppointments.filter((apt) =>
    isDateWithinRange(apt.date, previousStart, previousEnd)
  );

  const filteredRecords = adminMedicalRecords.filter((record) =>
    isDateWithinRange(record.record_date, start, end)
  );
  const previousRecords = adminMedicalRecords.filter((record) =>
    isDateWithinRange(record.record_date, previousStart, previousEnd)
  );

  const uniquePatientIds = new Set(
    filteredAppointments.map((apt) => apt.patient_id).filter(Boolean)
  );
  const previousUniquePatientIds = new Set(
    previousAppointments.map((apt) => apt.patient_id).filter(Boolean)
  );

  const totalDoctors = doctors.length;
  const avgRating =
    totalDoctors > 0
      ? (
          doctors.reduce((sum, doctor) => sum + (parseFloat(doctor.rating) || 0), 0) / totalDoctors
        ).toFixed(1)
      : "0.0";

  const appointmentTypeData = {
    Checkup: filteredAppointments.filter((apt) => apt.type === "Checkup").length,
    Consultation: filteredAppointments.filter((apt) => apt.type === "Consultation").length,
    "Follow-up": filteredAppointments.filter((apt) => apt.type === "Follow-up").length,
    Emergency: filteredAppointments.filter((apt) => apt.type === "Emergency").length,
  };
  const totalTypes = Object.values(appointmentTypeData).reduce((sum, value) => sum + value, 0) || 1;
  const appointmentTypes = Object.fromEntries(
    Object.entries(appointmentTypeData).map(([key, value]) => [key, Math.round((value / totalTypes) * 100)])
  );

  const deptPatientIds = {};
  filteredAppointments.forEach((apt) => {
    const doctor = doctors.find((doc) => doc.id === apt.doctor_id);
    const department = doctor?.department || "General";
    if (!deptPatientIds[department]) {
      deptPatientIds[department] = new Set();
    }
    if (apt.patient_id) {
      deptPatientIds[department].add(apt.patient_id);
    }
  });

  const deptLoad = Object.fromEntries(
    Object.entries(deptPatientIds).map(([department, patientIds]) => [department, patientIds.size])
  );

  const ageGroups = {
    "0-18": 0,
    "19-35": 0,
    "36-50": 0,
    "51-65": 0,
    "65+": 0,
  };
  adminPatients.forEach((patient) => {
    const dob = patient.dateOfBirth || patient.date_of_birth;
    const birthDate = parseDateSafe(dob);
    if (!birthDate) return;

    let age = end.getFullYear() - birthDate.getFullYear();
    const hadBirthdayThisYear =
      end.getMonth() > birthDate.getMonth() ||
      (end.getMonth() === birthDate.getMonth() && end.getDate() >= birthDate.getDate());
    if (!hadBirthdayThisYear) age -= 1;

    if (age <= 18) ageGroups["0-18"] += 1;
    else if (age <= 35) ageGroups["19-35"] += 1;
    else if (age <= 50) ageGroups["36-50"] += 1;
    else if (age <= 65) ageGroups["51-65"] += 1;
    else ageGroups["65+"] += 1;
  });

  const trendMonths = [];
  const trendBase =
    period === "This Year"
      ? new Date(end.getFullYear(), 0, 1)
      : new Date(end.getFullYear(), end.getMonth() - 5, 1);
  const trendCount = period === "This Year" ? 12 : 6;

  for (let i = 0; i < trendCount; i += 1) {
    const bucketDate = new Date(trendBase.getFullYear(), trendBase.getMonth() + i, 1);
    const label = bucketDate.toLocaleString("en-US", { month: "short" });
    trendMonths.push({
      label,
      year: bucketDate.getFullYear(),
      month: bucketDate.getMonth(),
      value: 0,
    });
  }

  filteredAppointments.forEach((apt) => {
    const aptDate = parseDateSafe(apt.date);
    if (!aptDate) return;
    const bucket = trendMonths.find(
      (item) => item.year === aptDate.getFullYear() && item.month === aptDate.getMonth()
    );
    if (bucket) bucket.value += 1;
  });

  const conditionCounts = {};
  adminPatients.forEach((patient) => {
    const condition = patient.condition || "No Condition";
    conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
  });

  return {
    period,
    range: { start, end, previousStart, previousEnd },
    filteredAppointments,
    previousAppointments,
    filteredRecords,
    previousRecords,
    totalAppointments: filteredAppointments.length,
    activePatients: uniquePatientIds.size,
    totalDoctors,
    avgRating,
    appointmentTypeData,
    appointmentTypes,
    deptLoad,
    ageGroups,
    trendMonths,
    conditionCounts,
    changes: {
      appointments: formatTrendChange(filteredAppointments.length, previousAppointments.length),
      patients: formatTrendChange(uniquePatientIds.size, previousUniquePatientIds.size),
      doctors: "0.0%",
      records: formatTrendChange(filteredRecords.length, previousRecords.length),
    },
  };
};
