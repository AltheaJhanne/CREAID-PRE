import { useState, useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/calendar.css";
import
{
  getAppointmentsApi,
  updateAppointmentStatusApi,
  confirmDownpaymentApi,
  getAppointmentServicesApi,
  rescheduleAppointmentApi,
  rejectAppointmentApi,
  getDentistScheduleApi
}
from "../api/appointments";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { isHoliday, getHoliday } from "../lib/holidays";

function convert12To24(time)
{
  if (!time) return "";

  const [clock, period] = time.split(" ");

  let [hours, minutes] =
    clock.split(":").map(Number);

  if (period === "PM" && hours !== 12)
  {
    hours += 12;
  }

  if (period === "AM" && hours === 12)
  {
    hours = 0;
  }

  return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:00`;
}

function Calendar()
{
  const navigate = useNavigate();
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentServices, setAppointmentServices] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [clinicFilter, setClinicFilter] = useState("All");
  const [showReschedule, setShowReschedule] = useState(false);
  const [dentistSchedule, setDentistSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
  if (!showReschedule || !selectedAppointment?.dentist_id) {
    setDentistSchedule(null);
    setScheduleLoading(false);
    return;
  }

  let cancelled = false;

  const fetchDentistSchedule = async () => {
    setScheduleLoading(true);
    setDentistSchedule(null);

    try {
      const response = await getDentistScheduleApi(
        selectedAppointment.dentist_id
      );

      if (!cancelled) {
        if (!response.success) {
          throw new Error(response.message || "Failed to load schedule.");
        }

        setDentistSchedule(response);
      }
    } catch (error) {
      if (!cancelled) {
        console.error("Dentist schedule error:", error);
        setDentistSchedule(null);
      }
    } finally {
      if (!cancelled) {
        setScheduleLoading(false);
      }
    }
  };

  fetchDentistSchedule();

  return () => {
    cancelled = true;
  };
}, [showReschedule, selectedAppointment?.dentist_id]);

  useEffect(() =>
  {
    const savedFilter = localStorage.getItem("calendarFilter");
    if (savedFilter)
    {
      setStatusFilter(savedFilter);
      localStorage.removeItem("calendarFilter");
    }
  }, []);

  useEffect(() =>
  {
    fetchAppointments();
  }, []);

  useEffect(() =>
  {
    const appointmentId = localStorage.getItem("calendarAppointmentId");
    if (!appointmentId || appointments.length === 0) return;

    const appointment = appointments.find(appt => appt.id === appointmentId);
    if (appointment)
    {
      const apptDate = new Date(appointment.appointment_date);
      setCurrentDate(apptDate);
      setView("day");
      setTimeout(() =>
      {
        setSelectedAppointment(appointment);
        loadAppointmentServices(appointment.id);
      }, 300);
    }
    localStorage.removeItem("calendarAppointmentId");
  }, [appointments]);

  const fetchAppointments = async () =>
  {
    try
    {
      const result = await getAppointmentsApi();
      setAppointments(result.appointments || []);
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const loadAppointmentServices = async (appointmentId) =>
  {
    try
    {
      const response = await getAppointmentServicesApi(appointmentId);
      setAppointmentServices(response.services || []);
    }
    catch (error)
    {
      console.error(error);
      setAppointmentServices([]);
    }
  };

  const getStatusClass = (status) =>
  {
    switch (status)
    {
      case "pending_payment": return "pending-payment";
      case "pending_verification": return "pending-verification";
      case "rejected": return "rejected";
      case "scheduled": return "scheduled";
      case "completed": return "completed";
      case "cancelled": return "cancelled";
      case "no_show": return "no-show";
      default: return "";
    }
  };

  const convertTimeToMinutes = (timeString) => {
  if (!timeString) return NaN;

  const match = String(timeString).trim().match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i
  );

  if (!match) return NaN;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (minutes > 59) return NaN;

  if (period) {
    if (hours < 1 || hours > 12) return NaN;
    hours = (hours % 12) + (period === "PM" ? 12 : 0);
  } else if (hours > 23) {
    return NaN;
  }

  return hours * 60 + minutes;
};

  const convertMinutesToTime = (minutes) =>
  {
    let hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return `${hours}:${String(mins).padStart(2, "0")} ${period}`;
  };

  const rescheduleDuration = appointmentServices.length > 0
    ? appointmentServices.reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0)
    : 60;

  const availableSlots = (() => {
  if (
    !newDate ||
    !selectedAppointment?.dentist_id ||
    !dentistSchedule ||
    scheduleLoading
  ) {
    return [];
  }

  // Supports both "13:00:00" and "1:00 PM"
  const toMinutes = (value) => {
    if (!value) return NaN;

    const text = String(value).trim();
    const match = text.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i
    );

    if (!match) return NaN;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3]?.toUpperCase();

    if (minutes > 59) return NaN;

    if (period) {
      if (hours < 1 || hours > 12) return NaN;
      hours = (hours % 12) + (period === "PM" ? 12 : 0);
    } else if (hours > 23) {
      return NaN;
    }

    return hours * 60 + minutes;
  };

  const dateParts = newDate.split("-").map(Number);

  if (dateParts.length !== 3) return [];

  const [year, month, day] = dateParts;

  const appointmentDay = new Date(
    Date.UTC(year, month - 1, day)
  ).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC"
  });

  const workingHours = dentistSchedule.hours?.find(
    (row) =>
      row.day_name?.toLowerCase() ===
      appointmentDay.toLowerCase()
  );

  if (!workingHours || workingHours.is_off) {
    return [];
  }

  const onApprovedLeave = dentistSchedule.leaves?.some(
    (leave) =>
      newDate >= leave.leave_from &&
      newDate <= leave.leave_to
  );

  if (onApprovedLeave || isHoliday(newDate)) {
    return [];
  }

  const workingStart = toMinutes(workingHours.start_time);
  const workingEnd = toMinutes(workingHours.end_time);

  if (
    !Number.isFinite(workingStart) ||
    !Number.isFinite(workingEnd) ||
    workingEnd <= workingStart
  ) {
    return [];
  }

  const lunch = dentistSchedule.lunch;

  let lunchApplies = false;

  if (lunch) {
    const appliesTo = lunch.applies_to || "";

    if (["all_days", "All Days"].includes(appliesTo)) {
      lunchApplies = true;
    } else if (
      ["weekdays", "Weekdays Only"].includes(appliesTo)
    ) {
      lunchApplies = !["Saturday", "Sunday"].includes(
        appointmentDay
      );
    } else if (
      ["weekends", "Weekends Only"].includes(appliesTo)
    ) {
      lunchApplies = ["Saturday", "Sunday"].includes(
        appointmentDay
      );
    } else if (appliesTo.startsWith("custom:")) {
      lunchApplies = appliesTo
        .slice("custom:".length)
        .split(",")
        .map((day) => day.trim())
        .includes(appointmentDay);
    }
  }

  const lunchStart = lunchApplies
    ? toMinutes(lunch.lunch_start)
    : NaN;

  const lunchEnd = lunchApplies
    ? toMinutes(lunch.lunch_end)
    : NaN;

  const duration = Number(rescheduleDuration);

  if (!Number.isFinite(duration) || duration <= 0) {
    return [];
  }

  // Generate slots every 30 minutes.
  const slots = [];

  const firstSlot = Math.ceil(workingStart / 30) * 30;

  for (
    let start = firstSlot;
    start + duration <= workingEnd;
    start += 30
  ) {
    const end = start + duration;

    if (
      lunchApplies &&
      Number.isFinite(lunchStart) &&
      Number.isFinite(lunchEnd) &&
      start < lunchEnd &&
      end > lunchStart
    ) {
      continue;
    }

    const hasConflict = appointments.some((appt) => {
      if (appt.id === selectedAppointment.id) return false;

      if (appt.dentist_id !== selectedAppointment.dentist_id) {
        return false;
      }

      if (appt.appointment_date !== newDate) return false;

      const blockingStatuses = [
        "scheduled",
        "confirmed",
        "pending_verification",
        "pending_payment"
      ];

      if (!blockingStatuses.includes(appt.status)) {
        return false;
      }

      const existingStart = toMinutes(appt.appointment_time);
      const existingEnd = toMinutes(appt.appointment_end_time);

      // Missing appointment times should not be treated
      // as proof that the slot is available.
      if (
        !Number.isFinite(existingStart) ||
        !Number.isFinite(existingEnd)
      ) {
        return true;
      }

      return start < existingEnd && end > existingStart;
    });

    if (hasConflict) continue;

    // Exclude slots that have already passed today
    const nowInManila = new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }
    ).formatToParts(new Date());

    const parts = Object.fromEntries(
      nowInManila.map((part) => [part.type, part.value])
    );

    const today = `${parts.year}-${parts.month}-${parts.day}`;
    const currentMinutes =
      Number(parts.hour) * 60 + Number(parts.minute);

    if (
      newDate < today ||
      (newDate === today && start <= currentMinutes)
    ) {
      continue;
    }

    slots.push(convertMinutesToTime(start));
  }

  return slots;
})();

  const markAsDone = async () =>
  {
    try
    {
      await updateAppointmentStatusApi(selectedAppointment.id, "completed");
      setAppointments(prev => prev.map(appt => appt.id === selectedAppointment.id ? { ...appt, status: "completed" } : appt));
      setSelectedAppointment(null);
    }
    catch (err) { console.error(err); }
  };

  const markAsNoShow = async () =>
  {
    if (!window.confirm("Are you sure you want to mark this appointment as No Show?")) return;
    try
    {
      await updateAppointmentStatusApi(selectedAppointment.id, "no_show");
      await fetchAppointments();
      setSelectedAppointment(null);
    }
    catch (err) { console.error(err); }
  };

  const markAsIncomplete = async () =>
  {
    try
    {
      await confirmDownpaymentApi(selectedAppointment.id);
      setAppointments(prev => prev.map(appt => appt.id === selectedAppointment.id ? { ...appt, status: "scheduled" } : appt));
      setSelectedAppointment(null);
    }
    catch (err) { console.error(err); }
  };

  const cancelAppointment = async () =>
  {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try
    {
      await updateAppointmentStatusApi(selectedAppointment.id, "cancelled");
      await fetchAppointments();
      setSelectedAppointment(null);
    }
    catch (err) { console.error(err); }
  };

  const undoCancel = async () =>
  {
    try
    {
      await confirmDownpaymentApi(selectedAppointment.id);
      await fetchAppointments();
      setSelectedAppointment(null);
    }
    catch (err) { console.error(err); }
  };

  const undoNoShow = async () =>
  {
    try
    {
      await confirmDownpaymentApi(selectedAppointment.id);
      setAppointments(prev => prev.map(appt => appt.id === selectedAppointment.id ? { ...appt, status: "scheduled" } : appt));
      setSelectedAppointment(null);
    }
    catch (err) { console.error(err); }
  };

  const rejectBooking = async () =>
  {
    try
    {
      await rejectAppointmentApi(selectedAppointment.id, rejectReason);
      await fetchAppointments();
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedAppointment(null);
    }
    catch (error) { console.error(error); }
  };

  const handleReschedule = async () => {
  if (!newDate || !newTime) {
    alert("Please select a new date and time.");
    return;
  }

  if (
    scheduleLoading ||
    !dentistSchedule ||
    !availableSlots.includes(newTime)
  ) {
    alert("This time slot is no longer available. Please select another.");
    return;
  }

  try {
    const newStartMinutes = convertTimeToMinutes(newTime);

    const newEndTime = convertMinutesToTime(
      newStartMinutes + rescheduleDuration
    );

    const response = await rescheduleAppointmentApi(
      selectedAppointment.id,
      {
        appointment_date: newDate,
        appointment_time: convert12To24(newTime),
        appointment_end_time: convert12To24(newEndTime)
      }
    );

    if (!response.success) {
      throw new Error(
        response.message || "Unable to reschedule appointment."
      );
    }

    await fetchAppointments();

    setShowReschedule(false);
    setSelectedAppointment(null);
    setNewDate("");
    setNewTime("");

    alert("Appointment rescheduled successfully!");
  } catch (error) {
    console.error("Reschedule failed:", error);

    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to reschedule appointment. Please try again.";

    alert(message);

    // Keep the modal open so the user can choose another slot.
    await fetchAppointments();
  }
};

  const navigate_to_day = (date) =>
  {
    setCurrentDate(date);
    setView("day");
  };

  const stepDate = (dir) =>
  {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + 7 * dir);
    else if (view === "month") d.setMonth(d.getMonth() + dir);
    else d.setFullYear(d.getFullYear() + dir);
    setCurrentDate(d);
  };

  let filteredAppointments = statusFilter
    ? appointments.filter(appt => appt.status === statusFilter)
    : appointments;

  if (clinicFilter !== "All")
{
  filteredAppointments =
    filteredAppointments.filter(
      appt =>
        (appt.branch_id || "")
          .trim()
          .toLowerCase() ===
        clinicFilter
          .trim()
          .toLowerCase()
    );
}

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const dayNumber = currentDate.getDate();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const weekdayName = currentDate.toLocaleString("default", { weekday: "long" });
  const firstDayOfMonth = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const getDayStatuses = (dayAppointments) =>
  {
    const order = ["pending_verification", "scheduled", "completed", "no_show", "cancelled", "rejected"];
    const present = order.filter(status => dayAppointments.some(a => a.status === status));
    return present.map(status => getStatusClass(status));
  };

  const isRejected = selectedAppointment?.status === "cancelled" && selectedAppointment?.rejection_reason;

  const activeServices = appointmentServices.filter(s => s.service_status !== "not_performed");

  return (
    <div className="calendar-content">
      <div className="calendar-card">

        <div className="calendar-header">
          <div className="calendar-title-row">
            <span className="calendar-arrow" onClick={() => stepDate(-1)}>‹</span>
            <h2 className="calendar-title">
              {view === "year" && year}
              {view === "month" && `${monthName} ${year}`}
              {(view === "week" || view === "day") && `${weekdayName}, ${monthName} ${dayNumber}`}
            </h2>
            <span className="calendar-arrow" onClick={() => stepDate(1)}>›</span>
          </div>

          <div className="calendar-filters">
            <select className="clinic-select" value={clinicFilter} onChange={(e) => setClinicFilter(e.target.value)}>
              <option value="All">All Clinics</option>
              <option value="Hagonoy">Hagonoy</option>
              <option value="Paombong">Paombong</option>
            </select>
            {["year", "month", "week", "day"].map(v => (
              <button key={v} className={view === v ? "active" : ""} onClick={() => setView(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-dot pending-verification" />
            Pending Verification
          </div>
          <div className="legend-item">
            <span className="legend-dot scheduled" />
            Scheduled
          </div>
          <div className="legend-item">
            <span className="legend-dot completed" />
            Completed
          </div>
          <div className="legend-item">
            <span className="legend-dot no-show" />
            No Show
          </div>
          <div className="legend-item">
            <span className="legend-dot cancelled" />
            Cancelled
          </div>
          <div className="legend-item">
            <span className="legend-dot rejected" />
            Rejected
          </div>
        </div>

        {statusFilter === "pending_verification" && (
          <div className="calendar-alert">Showing Pending Verification Appointments</div>
        )}

        {view === "year" && (
          <div className="year-grid">
            {Array.from({ length: 12 }, (_, i) =>
            {
              const now = new Date();
              const isCurrentMonth = year === now.getFullYear() && i === now.getMonth();
              return (
                <div key={i} className={`month-card ${isCurrentMonth ? "current" : ""}`} onClick={() => { setCurrentDate(new Date(year, i, 1)); setView("month"); }}>
                  {new Date(year, i).toLocaleString("default", { month: "long" })}
                </div>
              );
            })}
          </div>
        )}

        {view === "month" && (
          <div className="month-calendar">
            <div className="weekday-row">
              {weekDays.map(d => <div key={d} className="weekday-cell">{d}</div>)}
            </div>
            <div className="calendar-grid">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`s-${i}`} className="calendar-cell empty" />)}
              {Array.from({ length: daysInMonth }, (_, i) =>
              {
                const dateString = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                const dayAppointments = filteredAppointments.filter(appt => appt.appointment_date === dateString);
                const dayStatuses = getDayStatuses(dayAppointments);
                const cellDate = new Date(year, monthIndex, i + 1);
                const isToday = cellDate.toDateString() === new Date().toDateString();
                const holiday = getHoliday(cellDate);
              const isHolidayDate = !!holiday;
                return (
                  <div key={i} className={`calendar-cell
                  ${isToday ? "today" : ""}
                  ${isHolidayDate ? "holiday" : ""}`} 
                  onClick={() => navigate_to_day(cellDate)}>
                    <div className="calendar-date">
                      {i + 1}
                    </div>

                    {isHolidayDate && (
                      <>
                        <div className="holiday-badge">
                          🎉 Holiday
                        </div>

                        <div className="holiday-name">
                          {holiday.name}
                        </div>
                      </>
                    )}
                    {dayStatuses.length > 0 && (
                      <div className="calendar-cell-dots">
                        {dayStatuses.map(status => <span key={status} className={`calendar-cell-dot ${status}`} />)}
                      </div>
                    )}
                  </div>
                );
              })}
              {Array.from({ length: (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7 }).map((_, i) => <div key={`e-${i}`} className="calendar-cell empty" />)}
            </div>
          </div>
        )}

        {view === "week" && (
          <div className="week-calendar">
            <div className="week-header">
              <div className="time-col-header" />
              {Array.from({ length: 7 }, (_, i) =>
              {
                const d = new Date(currentDate);
                d.setDate(dayNumber - d.getDay() + i);
                return (
                  <div key={i} className={`week-day-header ${d.toDateString() === new Date().toDateString() ? "today" : ""}`}>
                    <strong>{d.toLocaleString("default", { weekday: "long" })}</strong>
                    <div className="week-date">{d.toLocaleString("default", { month: "short" })} {d.getDate()}</div>
                  </div>
                );
              })}
            </div>
            <div className="week-body">
              <div className="time-column">
                {Array.from({ length: 16 }, (_, i) => <div key={i} className="time-cell">{7 + i}:00</div>)}
              </div>
              <div className="week-grid-columns">
                {Array.from({ length: 7 }).map((_, dayIndex) =>
                {
                  const dayDate = new Date(currentDate);
                  dayDate.setDate(currentDate.getDate() - currentDate.getDay() + dayIndex);
                  const dateString = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`;
                  const dayAppointments = filteredAppointments.filter(appt => appt.appointment_date === dateString);
                  return (
                    <div key={dayIndex} className="week-day-column">
                      {dayAppointments.map(appt =>
                      {
                        const startMinutes = convertTimeToMinutes(appt.appointment_time);
                        const endMinutes = convertTimeToMinutes(appt.appointment_end_time);
                        const clinicStart = 7 * 60;
                        const slotHeight = 44;
                        const top = ((startMinutes - clinicStart) / 60) * slotHeight;
                        const height = Math.max(((endMinutes - startMinutes) / 60) * slotHeight, 40);
                        return (
                          <div key={appt.id} className={`week-appointment ${getStatusClass(appt.status)}`} style={{ top: `${top}px`, height: `${height}px` }} onClick={() => { setSelectedAppointment(appt); loadAppointmentServices(appt.id); }}>
                            <strong>{appt.appointment_time}</strong>
                            <div>{appt.patient?.full_name || appt.guest_name}</div>
                            <div>{appt.service?.name}</div>
                            <span className="week-appointment-badge">{appt.status?.replaceAll("_", " ")}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {view === "day" && (
          <div className="day-grid">
            {filteredAppointments
              .filter(appt =>
              {
                const selectedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
                return appt.appointment_date === selectedDate;
              })
              .map(appt => (
                <div key={appt.id} className={`hour-row ${getStatusClass(appt.status)}`} onClick={() => { setSelectedAppointment(appt); loadAppointmentServices(appt.id); }}>
                  <div className="hour-row-main">
                    <span className="hour-row-time">{appt.appointment_time}</span>
                    <span className="hour-row-patient">{appt.patient?.full_name || appt.guest_name}</span>
                    <span className="hour-row-service">{appt.service?.name || "Service"}</span>
                  </div>
                  <span className={`hour-row-badge ${getStatusClass(appt.status)}`}>
                    {appt.status?.replaceAll("_", " ")}
                  </span>
                </div>
              ))}
          </div>
        )}

        
{selectedAppointment && (
  <div className="appointment-modal-overlay">
    <div className="appointment-modal dc-appointment-modal">

      {/* HEADER */}
      <div className="appt-modal-header">
        <h2>Appointment Details</h2>
        <button
          type="button"
          className="appt-modal-close-x"
          onClick={() => setSelectedAppointment(null)}
          aria-label="Close"
        >
          <i className="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="dc-appt-body">
        <div className="dc-appt-grid">

          {/* PATIENT INFORMATION */}
          <section className="dc-appt-card">
            <div className="dc-appt-card-heading dc-appt-pink">
              <i className="bi bi-person-circle"></i>
              <h3>Patient Information</h3>
            </div>

            <div className="dc-appt-card-content">
              <div className="appt-detail-item">
                <span className="appt-detail-label">Name</span>
                <span className="appt-detail-value">
                  {selectedAppointment.patient?.full_name ||
                    selectedAppointment.guest_name}
                </span>
              </div>

              <div className="appt-detail-item">
                <span className="appt-detail-label">Email</span>
                <span className="appt-detail-value">
                  {selectedAppointment.patient?.email ||
                    selectedAppointment.guest_email || "N/A"}
                </span>
              </div>

              <div className="appt-detail-item">
                <span className="appt-detail-label">Contact Number</span>
                <span className="appt-detail-value">
                  {selectedAppointment.patient?.contact_number ||
                    selectedAppointment.guest_contact || "N/A"}
                </span>
              </div>

              {!selectedAppointment.patient_id && (
                <span className="appt-guest-badge">
                  Guest Booking
                </span>
              )}
            </div>
          </section>

          {/* SCHEDULE */}
          <section className="dc-appt-card">
            <div className="dc-appt-card-heading dc-appt-purple">
              <i className="bi bi-calendar-event"></i>
              <h3>Schedule</h3>
            </div>

            <div className="dc-appt-card-content dc-appt-fields-grid">
              <div className="appt-detail-item">
                <span className="appt-detail-label">Dentist</span>
                <span className="appt-detail-value">
                  {selectedAppointment.dentist?.full_name || "N/A"}
                </span>
              </div>

              <div className="appt-detail-item">
                <span className="appt-detail-label">Date</span>
                <span className="appt-detail-value">
                  {selectedAppointment.appointment_date}
                </span>
              </div>

              <div className="appt-detail-item">
                <span className="appt-detail-label">Time</span>
                <span className="appt-detail-value">
                  {selectedAppointment.appointment_time}
                </span>
              </div>

              <div className="appt-detail-item">
                <span className="appt-detail-label">
                  Reason for Visit
                </span>
                <span className="appt-detail-value">
                  {selectedAppointment.reason_for_visit ||
                    "Not provided"}
                </span>
              </div>
            </div>
          </section>

          {/* PAYMENT INFORMATION */}
          <section className="dc-appt-card">
            <div className="dc-appt-card-heading dc-appt-pink">
              <i className="bi bi-credit-card"></i>
              <h3>Payment Information</h3>
            </div>

            <div className="dc-appt-card-content">
              <div className="appt-detail-item">
                <span className="appt-detail-label">
                  Payment Status
                </span>
                <span className="appt-detail-value dc-appt-capitalize">
                  {selectedAppointment.payment_status?.replaceAll(
                    "_", " "
                  ) || "N/A"}
                </span>
              </div>

              <div className="appt-detail-item">
                <span className="appt-detail-label">
                  Payment Method
                </span>
                <span className="appt-detail-value">
                  {selectedAppointment.payment_method || "N/A"}
                </span>
              </div>

              <div className="dc-appt-payment-links">
                {selectedAppointment.receipt_url && (
                  <a
                    href={
                      supabase.storage
                        .from("receipts")
                        .getPublicUrl(
                          selectedAppointment.receipt_url
                        ).data.publicUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dc-appt-link"
                  >
                    <i className="bi bi-receipt"></i>
                    View Downpayment Receipt
                  </a>
                )}

                <a
                  href="#"
                  className="dc-appt-link"
                  onClick={(e) => {
                    e.preventDefault();
                    localStorage.setItem(
                      "highlightPaymentId",
                      selectedAppointment.id
                    );
                    navigate("/payments");
                  }}
                >
                  <i className="bi bi-credit-card-2-front"></i>
                  View Payment Details
                </a>
              </div>
            </div>
          </section>

          {/* STATUS AND NOTES */}
          <section className="dc-appt-card">
            <div className="dc-appt-card-heading dc-appt-purple">
              <i className="bi bi-clipboard-check"></i>
              <h3>Status &amp; Notes</h3>
            </div>

            <div className="dc-appt-card-content">
              <div className="appt-detail-item">
                <span className="appt-detail-label">
                  Appointment Status
                </span>
                <span
                  className={`appt-status-pill ${
                    isRejected
                      ? "rejected"
                      : getStatusClass(selectedAppointment.status)
                  }`}
                >
                  {isRejected
                    ? "Rejected"
                    : selectedAppointment.status?.replaceAll("_", " ")}
                </span>
              </div>

              <div className="appt-detail-item">
                <span className="appt-detail-label">Notes</span>
                <p className="dc-appt-notes">
                  {selectedAppointment.notes || "No notes provided"}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* SERVICES AVAILED */}
        <section className="dc-appt-card dc-appt-services">
          <div className="dc-appt-card-heading dc-appt-pink">
            <i className="bi bi-clipboard2-pulse"></i>
            <h3>Services Availed</h3>
          </div>

          <div className="dc-appt-services-content">
            {activeServices.length > 0 ? (
              activeServices.map((service) => (
                <div
                  key={service.id}
                  className="dc-appt-service-row"
                >
                  <span>{service.service_name}</span>
                  <strong>
                    ₱{Number(service.price).toLocaleString()}
                  </strong>
                </div>
              ))
            ) : (
              <p className="dc-appt-empty">
                No services found
              </p>
            )}
          </div>
        </section>
      </div>

      {/* FOOTER - EXISTING CONDITIONS AND HANDLERS */}
      <div className="appointment-modal-actions dc-appt-actions">

        {selectedAppointment.status === "pending_verification" && (
          <>
            <button
              className="btn-confirm-payment"
              onClick={async () => {
                try {
                  await confirmDownpaymentApi(selectedAppointment.id);
                  fetchAppointments();
                  setSelectedAppointment(null);
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              <i className="bi bi-check-circle"></i>
              Confirm Payment
            </button>

            <button
              className="btn-reject-booking"
              onClick={() => setShowRejectModal(true)}
            >
              <i className="bi bi-x-circle"></i>
              Reject Booking
            </button>
          </>
        )}

        {selectedAppointment.status === "scheduled" && (
          <>
            <button className="btn-done" onClick={markAsDone}>
              <i className="bi bi-check-circle"></i>
              Mark as Done
            </button>

            <button className="btn-no-show" onClick={markAsNoShow}>
              <i className="bi bi-person-x"></i>
              No Show
            </button>

            <button
              className="btn-cancel-b"
              onClick={cancelAppointment}
            >
              <i className="bi bi-x-circle"></i>
              Cancel
            </button>

            <button
              className="btn-reschedule"
              onClick={async () => {
                const response = await getAppointmentServicesApi(
                  selectedAppointment.id
                );
                setAppointmentServices(response.services || []);
                setNewDate(selectedAppointment.appointment_date);
                setNewTime("");
                setShowReschedule(true);
              }}
            >
              <i className="bi bi-calendar-event"></i>
              Reschedule
            </button>
          </>
        )}

        {selectedAppointment.status === "cancelled" &&
          !selectedAppointment.rejection_reason && (
            <button className="btn-incomplete" onClick={undoCancel}>
              <i className="bi bi-arrow-counterclockwise"></i>
              Undo Cancel
            </button>
          )}

        {isRejected && (
          <button
            className="btn-incomplete"
            onClick={async () => {
              try {
                await confirmDownpaymentApi(selectedAppointment.id);
                await fetchAppointments();
                setSelectedAppointment(null);
              } catch (error) {
                console.error(error);
              }
            }}
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            Undo Rejection
          </button>
        )}

        {selectedAppointment.status === "completed" && (
          <button
            className="btn-incomplete"
            onClick={markAsIncomplete}
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            Mark as Incomplete
          </button>
        )}

        {selectedAppointment.status === "no_show" && (
          <button className="btn-incomplete" onClick={undoNoShow}>
            <i className="bi bi-arrow-counterclockwise"></i>
            Undo No Show
          </button>
        )}
      </div>

    </div>
  </div>
)}

        {showRejectModal && (
          <div className="appointment-modal-overlay">
            <div className="reject-modal">
              <div className="reject-header">
                <h2>Reject Booking</h2>
                <p className="reject-description">Select the reason for rejecting this appointment.</p>
              </div>
              <div className="reject-body">
                <div className="reject-field">
                  <label className="reject-label">Reason for Rejection</label>
                  <select className="reject-select" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
                    <option value="">Select Reason</option>
                    <option value="Fake Receipt">Fake Receipt</option>
                    <option value="Wrong Amount">Wrong Amount</option>
                    <option value="Duplicate Booking">Duplicate Booking</option>
                    <option value="Spam Booking">Spam Booking</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="reject-actions">
                <button className="btn-reject-booking" onClick={rejectBooking}>Confirm Reject</button>
                <button className="modal-close-btn" onClick={() => { setShowRejectModal(false); setRejectReason(""); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        
{showReschedule && (
  <div className="appointment-modal-overlay">
    <div className="reschedule-modal dc-reschedule-modal">

      <div className="dc-reschedule-header">
        <div className="dc-reschedule-heading">
          <span className="dc-reschedule-icon">
            <i className="bi bi-calendar2-week"></i>
          </span>

          <div>
            <h2>Reschedule Appointment</h2>
            <p>Choose a new date and available time slot.</p>
          </div>
        </div>

        <button
          type="button"
          className="dc-reschedule-close"
          onClick={() => setShowReschedule(false)}
          aria-label="Close"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <div className="dc-reschedule-body">
        <div className="dc-reschedule-current">
          <span className="dc-reschedule-section-label">
            <i className="bi bi-clock-history"></i>
            Current Appointment
          </span>

          <div className="dc-reschedule-current-grid">
            <div>
              <small>Date</small>
              <strong>{selectedAppointment?.appointment_date}</strong>
            </div>
            <div>
              <small>Time</small>
              <strong>{selectedAppointment?.appointment_time}</strong>
            </div>
          </div>
        </div>

        <div className="dc-reschedule-field">
          <label htmlFor="dc-new-date">
            <i className="bi bi-calendar-event"></i>
            New Appointment Date
          </label>

          <input
            id="dc-new-date"
            type="date"
            value={newDate}
            min={new Date().toLocaleDateString("en-CA")}
            onChange={(e) => {
              setNewDate(e.target.value);
              setNewTime("");
            }}
          />
        </div>

        <div className="dc-reschedule-field">
          <label htmlFor="dc-new-time">
            <i className="bi bi-clock"></i>
            Available Time Slots
          </label>

          <select
            id="dc-new-time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            disabled={!newDate || availableSlots.length === 0}
          >
            <option value="">Select an available time</option>
            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>

          {newDate && availableSlots.length === 0 && (
            <p className="dc-reschedule-empty">
              No available time slots for this date.
            </p>
          )}
        </div>
      </div>

      <div className="dc-reschedule-footer">
        <button
          type="button"
          className="dc-reschedule-cancel"
          onClick={() => setShowReschedule(false)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="dc-reschedule-save"
          onClick={handleReschedule}
          disabled={!newDate || !newTime || !availableSlots.includes(newTime)}
        >
          <i className="bi bi-check2-circle"></i>
          Save Changes
        </button>
      </div>

    </div>
  </div>
)}

      </div>
    </div>
  );
}

export default Calendar;