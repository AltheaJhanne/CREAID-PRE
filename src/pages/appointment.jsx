import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
 ChevronRight,
 ArrowLeft,
 Wallet,
 CreditCard,
 Landmark,
 Phone,
 Clock,
} from 'lucide-react'
import '../styles/appointment.css'
import { supabase } from '../lib/supabase'
import {
  getDentistsApi,
  getDentistScheduleApi
} from "../api/users";
import {
  createAppointmentApi,
  getServicesApi
} from "../api/appointments";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { isHoliday } from "../lib/holidays";
import {
  getGoogleSession,
  signInWithGoogle,
  signOutGoogle
} from "../api/googleAuth";


const branches = [
 {
   id: 'b1',
   name: 'Hagonoy Branch',
   location: 'Poblacion, Hagonoy, Bulacan',
   mapUrl: 'https://maps.app.goo.gl/FCKufAx8g5DLVuVH9',
   tel: '0912-345-6789',
   openHours: "Depends on dentist schedule",
   icon: '🏥',
 },
 {
   id: 'b2',
   name: 'Paombong Branch',
   location: 'San Isidro I, Paombong, Bulacan',
   mapUrl: 'https://maps.app.goo.gl/DjCAagRUW3uZ7VWw5',
   tel: '0912-345-6789',
   openHours: "Depends on dentist schedule",
   icon: '🏢',
 },
]
const fallback_services = [
 {
   id: '1e2c940e-7294-40c9-9f12-f5c411f49e90',
   name: 'Teeth Cleaning',
   price: 800,
   duration_minutes: 45,
   icon: '🦷',
 },
 {
   id: '1136250c-c5de-429e-b7a5-19cdad5f1268',
   name: 'Tooth Extraction',
   price: 1000,
   duration_minutes: 60,
   icon: '🩹',
 },
 {
   id: '48f860bc-8d02-4257-b7f0-2f732b4337fd',
   name: 'Root Canal',
   price: 5000,
   duration_minutes: 120,
   icon: '💉',
 },
 {
   id: '30f014ae-91d9-4fb2-83b3-8af851e3e52e',
   name: 'Braces Checkup',
   price: 500,
   duration_minutes: 30,
   icon: '😬',
 },
]

function convertMinutesToTime(minutes)
{
  let hours =
    Math.floor(minutes / 60);

  const mins =
    minutes % 60;

  const period =
    hours >= 12
      ? "PM"
      : "AM";

  if(hours > 12)
  {
    hours -= 12;
  }

  if(hours === 0)
  {
    hours = 12;
  }

  return `${hours}:${String(mins).padStart(2, "0")} ${period}`;
}

function convertToMinutes(timeString) {

  const [time, period] =
    timeString.split(" ");

  let [hours, minutes] =
    time.split(":").map(Number);

  if (
    period === "PM" &&
    hours !== 12
  ) {
    hours += 12;
  }

  if (
    period === "AM" &&
    hours === 12
  ) {
    hours = 0;
  }

  return (
    hours * 60 +
    minutes
  );
}

function convert24To12(time)
{
  const [h, m] =
    time.split(":");

  let hour =
    Number(h);

  const suffix =
    hour >= 12
      ? "PM"
      : "AM";

  if(hour > 12)
  {
    hour -= 12;
  }

  if(hour === 0)
  {
    hour = 12;
  }

  return `${hour}:${m} ${suffix}`;
}
 
function generateTimeSlots(
  dentistSchedule,
  selectedDate
)
{
  if(
    !dentistSchedule ||
    !selectedDate
  )
  {
    return [];
  }

  const weekday =
    new Date(selectedDate)
      .toLocaleDateString(
        "en-US",
        {
          weekday: "long"
        }
      );

  const day =
    dentistSchedule.hours.find(
      h => h.day_name === weekday
    );

  if(
    !day ||
    day.is_off
  )
  {
    return [];
  }

  const slots = [];

  const start =
    convertToMinutes(
      convert24To12(
        day.start_time
      )
    );

  const end =
    convertToMinutes(
      convert24To12(
        day.end_time
      )
    );

  let lunchStart = null;
  let lunchEnd = null;

  if(dentistSchedule.lunch)
  {
    lunchStart =
      convertToMinutes(
        convert24To12(
          dentistSchedule.lunch.lunch_start
        )
      );

    lunchEnd =
      convertToMinutes(
        convert24To12(
          dentistSchedule.lunch.lunch_end
        )
      );
  }

  for(
    let mins = start;
    mins < end;
    mins += 30
  )
  {
    if(
      lunchStart !== null &&
      mins >= lunchStart &&
      mins < lunchEnd
    )
    {
      continue;
    }

    slots.push(
      convertMinutesToTime(mins)
    );
  }

  return slots;
}

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

function parseTimeToMinutes(time)
{
  if(!time)
  {
    return 0;
  }

  // 24-hour format (e.g. 13:00:00)
  if(!time.includes("AM") && !time.includes("PM"))
  {
    const [hours, minutes] =
      time.split(":").map(Number);

    return hours * 60 + minutes;
  }

  // 12-hour format (e.g. 1:00 PM)
  return convertToMinutes(time);
}

export default function Appointment() {
 const navigate = useNavigate()
 const [googleSession, setGoogleSession] =
  useState(null);
const [checkingGoogle, setCheckingGoogle] =
  useState(true);
 const [step, setStep] = useState(1)
 const [dentists, setDentists] = useState([])
 const [services, setServices] = useState([])
 const [selectedBranch, setSelectedBranch] =
   useState(null)
 const [selectedDentist, setSelectedDentist] =
   useState(null)
 const [selectedServices, setSelectedServices] =
  useState([])
 const [selectedDate, setSelectedDate] =
useState(null);
 const [selectedTime, setSelectedTime] =
   useState('')
const [guestName, setGuestName] =
  useState('');

const [guestContact, setGuestContact] =
  useState('');

const [guestEmail, setGuestEmail] =
  useState('');

const [reasonForVisit, setReasonForVisit] =
  useState('');

const [notes, setNotes] =
  useState('');
const [receiptFile, setReceiptFile] =
  useState(null);
 const [paymentMethod, setPaymentMethod] =
 useState('visa')
 const [appointments, setAppointments] = useState([]);
 const [dentistSchedule, setDentistSchedule] =
useState(null);
const times =
generateTimeSlots(
  dentistSchedule,
  selectedDate
);
 const [loading, setLoading] =
   useState(true)
 const [submitting, setSubmitting] =
   useState(false)
  
  const totalAmount =
  selectedServices.reduce(
    (sum, service) =>
      sum + Number(service.price),
    0
  )

const totalDuration =
  selectedServices.reduce(
    (sum, service) =>
      sum +
      Number(
        service.duration_minutes || 0
      ),
    0
  )
  console.log("SERVICES:", selectedServices);
console.log("TOTAL DURATION:", totalDuration);

const downpayment =
  totalAmount * 0.50

const appointmentEndTime =
  calculateEndTime(
    selectedTime,
    totalDuration
  );

const cancellationDeadline =
  calculateCancellationDeadline(
    selectedDate,
    selectedTime
  );

  console.log("TOTAL DURATION:", totalDuration);

const unavailableTimes =
  times.filter((time) => {

    if (
      !selectedDate ||
      selectedServices.length === 0
    ) {
      return false;
    }

    const candidateStart =
  convertToMinutes(time);

const candidateEnd =
  candidateStart +
  totalDuration;

if(!dentistSchedule)
{
  return true;
}

const weekday =
  new Date(selectedDate)
    .toLocaleDateString(
      "en-US",
      {
        weekday: "long"
      }
    );

const workingDay =
  dentistSchedule.hours.find(
    h =>
      h.day_name === weekday
  );

if(
  !workingDay ||
  workingDay.is_off
)
{
  return true;
}

const clinicOpen =
  convertToMinutes(
    convert24To12(
      workingDay.start_time
    )
  );

const clinicClose =
  convertToMinutes(
    convert24To12(
      workingDay.end_time
    )
  );

if(
  candidateStart < clinicOpen ||
  candidateEnd > clinicClose
)
{
  return true;
}

if(dentistSchedule.lunch)
{
  const lunchStart =
    convertToMinutes(
      convert24To12(
        dentistSchedule.lunch.lunch_start
      )
    );

  const lunchEnd =
    convertToMinutes(
      convert24To12(
        dentistSchedule.lunch.lunch_end
      )
    );

  if(
    candidateStart < lunchEnd &&
    candidateEnd > lunchStart
  )
  {
    return true;
  }
}
const selectedDateString =
  [
    selectedDate.getFullYear(),
    String(selectedDate.getMonth() + 1).padStart(2, "0"),
    String(selectedDate.getDate()).padStart(2, "0")
  ].join("-");

    return appointments.some(
  (appointment) => {

    if (
  appointment.appointment_date !==
  selectedDateString
)
{
  return false;
}

if (
  appointment.branch_id?.toLowerCase() !==
  selectedBranch?.name
    ?.replace(" Branch", "")
    ?.toLowerCase()
) {
  return false;
}

if (
  appointment.dentist_id !==
  selectedDentist?.id
) {
  return false;
}

    const blockedStatuses =
[
  "scheduled",
  "pending_verification",
  "pending_payment",
  "confirmed"
];

if(
  !blockedStatuses.includes(
    appointment.status
  )
)
{
  return false;
}

    const existingStart =
  parseTimeToMinutes(
    appointment.appointment_time
  );

const existingEnd =
  parseTimeToMinutes(
    appointment.appointment_end_time
  );

    return (
      candidateStart <
        existingEnd &&
      candidateEnd >
        existingStart
    );
  }
);
  });
   console.log("APPOINTMENTS", appointments);
  console.table(
  appointments.map(a => ({
    date: a.appointment_date,
    start: a.appointment_time,
    end: a.appointment_end_time,
    status: a.status,
    dentist: a.dentist_id,
    branch: a.branch_id
  }))
);
 // =========================
 // LOAD MOCK DATA
 // =========================
 async function loadServices()
{
  try
  {
    const response =
      await getServicesApi();

    console.log(
      "MASTERFILE SERVICES:",
      response.services
    );

    setServices(
      response.services || []
    );
  }
  catch(error)
  {
    console.error(error);

    setServices(
      fallback_services
    );
  }
}

 async function loadDentists()
{
  try
  {
    const response =
      await getDentistsApi();

    console.log(
  "DENTISTS:",
  response.dentists
);

const mappedDentists =
  (response.dentists || [])
  .map(d => ({
    id: d.id,
    full_name: `Dr. ${d.first_name} ${d.last_name}`,
    branch_key: d.branch_key,
    img: d.avatar_url || ""
  }));

  console.log(
  "MAPPED DENTISTS:",
  mappedDentists
);

    setDentists(
      mappedDentists
    );
  }
  catch(error)
  {
    console.error(
      "LOAD DENTISTS ERROR:",
      error
    );
  }
}

 useEffect(() => {

  async function loadAppointments() {

    try {

      const response =
      await fetch(
        `${import.meta.env.VITE_API_URL}/appointments`
      );

    const result =
      await response.json();

      setAppointments(
        result.appointments || []
      );

    } catch (err) {

      console.log(err);

    }

  }

  loadAppointments();

}, []);

useEffect(() =>
{
  async function loadData()
  {
    await loadDentists();
    await loadServices();

    setLoading(false);
  }

  loadData();
}, []);

useEffect(() =>
{
  async function checkGoogleLogin()
  {
    const session =
      await getGoogleSession();

    setGoogleSession(session);

    if(session?.user)
    {
      setGuestName(
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        ""
      );

      setGuestEmail(
        session.user.email || ""
      );
    }

    setCheckingGoogle(false);
  }

  checkGoogleLogin();
}, []);

 // =========================
 // MOCK BOOKING
 // =========================

 function calculateEndTime(
  startTime,
  durationMinutes
) {
  if (!startTime) return "";

  const [time, period] =
    startTime.split(" ");

  let [hours, minutes] =
    time.split(":").map(Number);

  if (
    period === "PM" &&
    hours !== 12
  ) {
    hours += 12;
  }

  if (
    period === "AM" &&
    hours === 12
  ) {
    hours = 0;
  }

  const totalMinutes =
    hours * 60 +
    minutes +
    durationMinutes;

  const endHours =
    Math.floor(totalMinutes / 60);

  const endMinutes =
    totalMinutes % 60;

  const displayHours =
    endHours % 12 || 12;

  const displayPeriod =
    endHours >= 12
      ? "PM"
      : "AM";

  return `${displayHours}:${String(
    endMinutes
  ).padStart(2, "0")} ${displayPeriod}`;
}

function calculateCancellationDeadline(
  appointmentDate,
  appointmentTime
) {

  if (
    !appointmentDate ||
    !appointmentTime
  ) {
    return null;
  }

  const [time, period] =
    appointmentTime.split(" ");

  let [hours, minutes] =
    time.split(":").map(Number);

  if (
    period === "PM" &&
    hours !== 12
  ) {
    hours += 12;
  }

  if (
    period === "AM" &&
    hours === 12
  ) {
    hours = 0;
  }

  const appointment =
    new Date(appointmentDate);

  appointment.setHours(
    hours,
    minutes,
    0,
    0
  );

  appointment.setHours(
    appointment.getHours() - 24
  );

  return appointment.toISOString();
}

function isDateOffDay(dateValue)
{
  if(
    !dateValue ||
    !dentistSchedule
  )
  {
    return false;
  }

  const weekday =
    new Date(dateValue)
      .toLocaleDateString(
        "en-US",
        {
          weekday: "long"
        }
      );

  const workingDay =
    dentistSchedule.hours.find(
      h => h.day_name === weekday
    );

  if(
    !workingDay ||
    workingDay.is_off
  )
  {
    return true;
  }

  const onLeave =
    (dentistSchedule.leaves || [])
      .some(leave =>
      {
        return (
          dateValue >= leave.leave_from &&
          dateValue <= leave.leave_to
        );
      });

  return onLeave;
}

function isDateUnavailable(date)
{
  if(!dentistSchedule)
  {
    return false;
  }

  const formatted =
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");

  const weekday =
    date.toLocaleDateString(
      "en-US",
      {
        weekday:"long"
      }
    );

  const workingDay =
    dentistSchedule.hours.find(
      h =>
        h.day_name === weekday
    );

  if(
    !workingDay ||
    workingDay.is_off
  )
  {
    return true;
  }

  return (
    dentistSchedule.leaves || []
  ).some(leave =>
  {
    return (
      formatted >= leave.leave_from &&
      formatted <= leave.leave_to
    );
  });

  console.log({
  formatted,
  leaves: dentistSchedule.leaves
});
}

async function handleBooking() {
 try {
   setSubmitting(true)

  let receiptUrl = null;

if (receiptFile) {

  const fileName =
    `${Date.now()}-${receiptFile.name}`;

  const { error } =
    await supabase.storage
      .from("receipts")
      .upload(
        fileName,
        receiptFile
      );

  if (error) {
    throw error;
  }

  receiptUrl = fileName;
}
   // CREATE APPOINTMENT

   console.log(
  "SELECTED BRANCH:",
  selectedBranch
);
   const appointmentDate =
  `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  console.log({
  selectedServices,
  totalDuration,
  appointmentEndTime
});

const appointmentPayload = {
  patient_id: null,
  guest_name: guestName,
  guest_contact: guestContact,
  guest_email: guestEmail,
  reason_for_visit: reasonForVisit,
  notes: notes,
  selected_services: selectedServices,
  dentist_id: selectedDentist.id,

  branch_id: selectedBranch?.name
    .replace(" Branch", ""),

  appointment_date: appointmentDate,

  appointment_time:
    convert12To24(selectedTime),

  appointment_end_time:
    convert12To24(appointmentEndTime),

  payment_method: paymentMethod,
  payment_status: "pending",

  status:
    receiptFile
      ? "pending_verification"
      : "pending_payment",

  total_amount: totalAmount,
  downpayment_amount: downpayment,
  cancellation_deadline: cancellationDeadline,
  receipt_url: receiptUrl,
};
  console.log(
  "BOOKING PAYLOAD:",
  appointmentPayload
);

const response =
  await createAppointmentApi(
    appointmentPayload
  );

console.log(
  "BOOKING RESPONSE:",
  response
);

   alert(
     'Appointment booked successfully!'
   )
   // RESET
   setStep(1)
   setSelectedBranch(null)
   setSelectedDentist(null)
   setSelectedServices([])
   setSelectedDate('')
   setSelectedTime('')
   setPaymentMethod('visa')
   setSubmitting(false)
   // GO HOME
   navigate('/')
 } catch (err) {

  console.log(
    "FULL ERROR:",
    err
  );

  console.log(
    "RESPONSE:",
    err.response
  );

  console.log(
    "DATA:",
    err.response?.data
  );

  alert(
    err.response?.data?.message ||
    err.message ||
    "Booking failed"
  );

  setSubmitting(false);
}
}
 // =========================
 // FILTER DENTISTS
 // =========================
const filteredDentists =
  selectedBranch
    ? dentists.filter(
    dentist =>
    dentist.branch_key ===
    selectedBranch?.name.replace(" Branch", "")
)
    : dentists;
 // =========================
 // LOADING
 // =========================
 if (loading) {
   return (
<div className="appointment-loading">
       Loading booking system...
</div>
   )
 }
 // =========================
 // UI
 // =========================
return (
<div className="appointment-page">

  {!checkingGoogle && !googleSession && (
  <div className="google-booking-gate">
    <h2>
      Continue with Google
    </h2>

    <p>
      Please verify your Google account before booking an online appointment.
    </p>

    <button
      type="button"
      onClick={signInWithGoogle}
      className="submit-appointment-btn"
    >
      Continue with Google
    </button>
  </div>
)}

{googleSession && (
  <div className="appointment-form-container">

<div className="appointment-form-container">
<div className="appointment-header-section">
<h1>Book Appointment</h1>
<p>
           Please complete the form below
           to schedule your dental
           appointment.
</p>

<button
  type="button"
  onClick={async () =>
  {
    await signOutGoogle();

    setGoogleSession(null);
    setGuestName("");
    setGuestEmail("");
  }}
>
  Use another Google account
</button>

</div>
<div className="appointment-form-content">
 {/* LEFT SIDE */}
<div className="appointment-left">
   {/* BRANCH */}
<div className="form-group">
<label>Select Branch</label>
<select
       value={selectedBranch?.id || ''}
       onChange={(e) => {
         const branch =
           branches.find(
             (b) =>
b.id === e.target.value
           )
         setSelectedBranch(branch)
         setSelectedDentist(null)
       }}
>
<option value="">
         Select branch
</option>
       {branches.map((branch) => (
<option
           key={branch.id}
           value={branch.id}
>
           {branch.name}
</option>
       ))}
</select>
</div>

   {/* DENTIST */}
<div className="form-group">
<label>Select Dentist</label>
<select
  value={selectedDentist?.id || ''}
  onChange={async (e) =>
{
  const dentist =
    dentists.find(
      d => d.id === e.target.value
    );

  setSelectedDentist(dentist);
  setSelectedDate("");
  setSelectedTime("");
  setDentistSchedule(null);

  if(dentist)
  {
    try
    {
      const schedule =
        await getDentistScheduleApi(
          dentist.id
        );

      console.log(
        "DENTIST SCHEDULE:",
        schedule
      );

      setDentistSchedule(schedule);
    }
    catch(error)
    {
      console.error(error);

      setDentistSchedule(null);
    }
  }
}}
       disabled={!selectedBranch}
>
<option value="">
         Select dentist
</option>
       {filteredDentists.map((d) => (
<option
  key={d.id}
  value={d.id}
>
  {d.full_name}
</option>
       ))}
</select>
</div>
   {/* SERVICE */}
<div className="form-group">
  <label>Select Services</label>

  <select
  onChange={(e) =>
  {
    const service =
      services.find(
        s => s.id === e.target.value
      );

    if(
      service &&
      !selectedServices.some(
        s => s.id === service.id
      )
    )
    {
      setSelectedServices(
        prev => [
          ...prev,
          service
        ]
      );
    }
  }}
>
  <option value="">
    Select Service
  </option>

  {services.map(service => (
    <option
      key={service.id}
      value={service.id}
    >
      {service.name}
      {" - ₱"}
      {service.price}
    </option>
  ))}
</select>
<div className="selected-services">
  {selectedServices.map(service => (

    <div
      key={service.id}
      className="selected-service-chip"
    >
      {service.name}

      <button
  type="button"
  className="remove-service-btn"
  onClick={() =>
    setSelectedServices(
      prev =>
        prev.filter(
          s => s.id !== service.id
        )
    )
  }
>
  ✕
</button>

    </div>

  ))}
</div>
</div>

<div className="form-group">
  <label>Full Name</label>

  <input
    type="text"
    value={guestName}
    readOnly
    onChange={(e) =>
      setGuestName(e.target.value)
    }
    placeholder="Juan Dela Cruz"
  />
</div>

<div className="form-row">

  <div className="form-group">
    <label>Contact Number</label>

    <input
      type="text"
      value={guestContact}
      onChange={(e) =>
        setGuestContact(e.target.value)
      }
      placeholder="09123456789"
    />
  </div>

  <div className="form-group">
    <label>Email</label>

    <input
      type="email"
      value={guestEmail}
      readOnly
      onChange={(e) =>
        setGuestEmail(e.target.value)
      }
      placeholder="juan@email.com"
    />
  </div>

</div>

<div className="form-group">
  <label>Reason for Visit</label>

  <input
    type="text"
    value={reasonForVisit}
    onChange={(e) =>
      setReasonForVisit(
        e.target.value
      )
    }
    placeholder="Toothache"
  />
</div>

<div className="form-group">
  <label>Additional Notes</label>

  <input
    type="text"
    value={notes}
    onChange={(e) =>
      setNotes(e.target.value)
    }
    placeholder="Optional"
  />
</div>

   {/* DATE + TIME */}
<div className="form-row">
<div className="form-group">
<label>Date</label>

<DatePicker
  selected={selectedDate}

  onChange={(date)=>
  {
    setSelectedDate(date);
    setSelectedTime("");
  }}

  minDate={new Date()}

  filterDate={(date) =>
{
  return (
    !isDateUnavailable(date) &&
    !isHoliday(date)
  );
}}

  dateFormat="MMMM d, yyyy"

  placeholderText="Select appointment date"

  className="appointment-datepicker"
/>

</div>
<div className="form-group">
<label>Time</label>
<select
         value={selectedTime}
         onChange={(e) =>
           setSelectedTime(
             e.target.value
           )
         }
>
<option value="">
           Select time
</option>
         {times.map((time) => {
           const taken =
              unavailableTimes.includes(time)
           return (
<option
               key={time}
               value={time}
               disabled={taken}
>
               {time}
               {taken
                 ? ' (Unavailable)'
                 : ''}
</option>
           )
         })}
</select>
</div>
</div>
   {/* PAYMENT */}
<div className="form-group">
<label>Card Type</label>
<select
       value={paymentMethod}
       onChange={(e) =>
         setPaymentMethod(
           e.target.value
         )
       }
>
<option value="visa">
         Visa
</option>
<option value="mastercard">
         Mastercard
</option>
<option value="jcb">
         JCB
</option>
</select>
</div>
<div className="form-group">
  <label>
    Upload Downpayment Receipt
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setReceiptFile(
        e.target.files[0]
      )
    }
  />
</div>
</div>
 {/* RIGHT SIDE */}
<div className="appointment-right">
<div className="appointment-summary">
<h3>
       Appointment Summary
</h3>
<div className="summary-item">
<span>Branch</span>
<strong>
         {selectedBranch?.name || '-'}
</strong>
</div>
<div className="summary-item">
<span>Dentist</span>
<strong>
         {selectedDentist?.full_name || "-"}
</strong>
</div>
<div className="summary-item">
<span>Services</span>

<strong>

{
selectedServices.length
? selectedServices
    .map(s => s.name)
    .join(", ")
: "-"
}

</strong>
</div>
<div className="summary-item">
<span>Date</span>
<strong>
         {
selectedDate
? selectedDate.toLocaleDateString(
    "en-US",
    {
      year:"numeric",
      month:"long",
      day:"numeric"
    }
  )
: "-"
}
</strong>
</div>
<div className="summary-item">
  <span>Time</span>
  <strong>
    {selectedTime || '-'}
  </strong>
</div>

<div className="summary-item">
  <span>End Time</span>
  <strong>
    {appointmentEndTime || '-'}
  </strong>
</div>
<div className="summary-item">
<span>Payment</span>
<strong>
         {paymentMethod}
</strong>
</div>
<div className="summary-item">
  <span>
    Total Duration
  </span>

  <strong>
    {totalDuration} mins
  </strong>
</div>

<div className="summary-item">
  <span>
    Total Amount
  </span>

  <strong>
    ₱{totalAmount}
  </strong>
</div>

<div className="summary-item">
  <span>
    Required Downpayment
  </span>

  <strong>
    ₱{downpayment}
  </strong>
</div>

<button
       className="submit-appointment-btn"
       onClick={handleBooking}
       disabled={
  !guestName ||
  !guestContact ||
  !guestEmail ||
  !reasonForVisit ||
  !selectedBranch ||
  !selectedDentist ||
  selectedServices.length === 0 ||
  !selectedDate ||
  !selectedTime ||
  !receiptFile
}
>
       {submitting
         ? 'BOOKING...'
         : 'BOOK APPOINTMENT'}
</button>
</div>
</div>
</div>
</div>
</div>
 )
}
  </div>
)}
