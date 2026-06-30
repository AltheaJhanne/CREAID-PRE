import {
  useEffect,
  useState
}
from "react";

import {
  createAppointmentApi,
  getAppointmentsApi
}
from "../api/appointments";

import {
  getDentistsApi
}
from "../api/users";

import {
  getServicesApi
}
from "../api/services";

import "../styles/WalkInAppointmentModal.css";

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

function convertToMinutes(timeString)
{
  const [time, period] =
    timeString.split(" ");

  let [hours, minutes] =
    time.split(":").map(Number);

  if(period === "PM" && hours !== 12)
  {
    hours += 12;
  }

  if(period === "AM" && hours === 12)
  {
    hours = 0;
  }

  return (
    hours * 60 +
    minutes
  );
}

const generateTimeSlots = () =>
{
  const slots = [];

  const ranges = [
    {
      start: 10 * 60,
      end: 12 * 60
    },
    {
      start: 13 * 60,
      end: 17 * 60
    }
  ];

  ranges.forEach(range =>
  {
    for(
      let minutes = range.start;
      minutes < range.end;
      minutes += 30
    )
    {
      slots.push(
        convertMinutesToTime(
          minutes
        )
      );
    }
  });

  return slots;
};

const times =
  generateTimeSlots();

function calculateEndTime(
  startTime,
  durationMinutes
)
{
  if(!startTime)
  {
    return "";
  }

  const [time, period] =
    startTime.split(" ");

  let [hours, minutes] =
    time.split(":").map(Number);

  if(period === "PM" && hours !== 12)
  {
    hours += 12;
  }

  if(period === "AM" && hours === 12)
  {
    hours = 0;
  }

  const totalMinutes =
    hours * 60 +
    minutes +
    durationMinutes;

  return convertMinutesToTime(
    totalMinutes
  );
}

function WalkInAppointmentModal({
  open,
  onClose
})
{
  const [dentists,
  setDentists] =
  useState([]);

  const [services,
  setServices] =
  useState([]);

  const [appointments,
  setAppointments] =
  useState([]);

  const [selectedServices,
  setSelectedServices] =
  useState([]);

  const [form,
  setForm] =
  useState({
    guest_name: "",
    guest_contact: "",
    guest_email: "",

    dentist_id: "",
    branch_id: "Hagonoy",

    appointment_date: "",
    appointment_time: "",

    payment_method: "Cash",

    reason_for_visit: "",
    notes: ""
  });

  useEffect(() =>
  {
    if(!open)
      return;

    loadData();
  },
  [open]);

  async function loadData()
  {
    try
    {
      const dentistsResponse =
        await getDentistsApi();

        console.log(
  "DENTISTS:",
  dentistsResponse
);

      const servicesResponse =
        await getServicesApi();

      const appointmentsResponse =
        await getAppointmentsApi();

      setDentists(
        dentistsResponse.dentists || []
      );

      setServices(
        servicesResponse.services || []
      );

      setAppointments(
        appointmentsResponse.appointments || []
      );
    }
    catch(error)
    {
      console.error(error);
    }
  }

  function toggleService(service)
  {
    const exists =
      selectedServices.find(
        s =>
          s.id === service.id
      );

    if(exists)
    {
      setSelectedServices(
        prev =>
          prev.filter(
            s =>
              s.id !== service.id
          )
      );
    }
    else
    {
      setSelectedServices(
        prev => [
          ...prev,
          service
        ]
      );
    }
  }

  const totalAmount =
    selectedServices.reduce(
      (sum, service) =>
        sum +
        Number(service.price || 0),
      0
    );

  const totalDuration =
    selectedServices.reduce(
      (sum, service) =>
        sum +
        Number(
          service.duration_minutes || 0
        ),
      0
    );

    const appointmentEndTime =
  calculateEndTime(
    form.appointment_time,
    totalDuration
  );

const unavailableTimes =
  times.filter((time) =>
{
  if(
    !form.appointment_date ||
    selectedServices.length === 0 ||
    !form.dentist_id
  )
  {
    return false;
  }

  const candidateStart =
    convertToMinutes(time);

  const candidateEnd =
    candidateStart +
    totalDuration;

  const lunchStart =
    12 * 60;

  const lunchEnd =
    13 * 60;

  const clinicClose =
    17 * 60;

  if(candidateEnd > clinicClose)
  {
    return true;
  }

  if(
    candidateStart < lunchStart &&
    candidateEnd > lunchStart
  )
  {
    return true;
  }

  if(
    candidateStart >= lunchStart &&
    candidateStart < lunchEnd
  )
  {
    return true;
  }

  return appointments.some(
    appointment =>
    {
      if(
        appointment.appointment_date !==
        form.appointment_date
      )
      {
        return false;
      }

      if(
        appointment.branch_id !==
        form.branch_id
      )
      {
        return false;
      }

      if(
        appointment.dentist_id !==
        form.dentist_id
      )
      {
        return false;
      }

      if(
        appointment.status !== "scheduled" &&
        appointment.status !== "pending_verification" &&
        appointment.status !== "pending_payment"
      )
      {
        return false;
      }

      const existingStart =
        convertToMinutes(
          appointment.appointment_time
        );

      const existingEnd =
        convertToMinutes(
          appointment.appointment_end_time
        );

      return (
        candidateStart < existingEnd &&
        candidateEnd > existingStart
      );
    }
  );
});


  async function handleSubmit()
  {
    try
    {
      const appointment_end_time =
  appointmentEndTime;

const payload =
{
  patient_id: null,

  guest_name:
    form.guest_name,

  guest_contact:
    form.guest_contact,

  guest_email:
    form.guest_email,

  dentist_id:
    form.dentist_id,

  branch_id:
    form.branch_id,

  appointment_date:
    form.appointment_date,

  appointment_time:
    form.appointment_time,

  appointment_end_time,

  selected_services:
    selectedServices,

  payment_method:
    form.payment_method,

  reason_for_visit:
    form.reason_for_visit,

  notes:
    form.notes,

  total_amount:
    totalAmount,

  downpayment_amount: 0,

  receipt_url: null,

  cancellation_deadline: null,

  payment_status: "pending",

  status: "scheduled"
};

await createAppointmentApi(
  payload
);

setForm({
  guest_name: "",
  guest_contact: "",
  guest_email: "",

  dentist_id: "",
  branch_id: "Hagonoy",

  appointment_date: "",
  appointment_time: "",

  payment_method: "Cash",

  reason_for_visit: "",
  notes: ""
});

setSelectedServices([]);

      window.dispatchEvent(
        new Event(
          "appointment-created"
        )
      );

      alert(
        "Appointment created successfully."
      );

      onClose();
    }
    catch(error)
    {
      console.error(error);

      alert(
        "Failed to create appointment."
      );
    }
  }

  if(!open)
    return null;

  const filteredDentists =
  dentists.filter(
    dentist =>
      dentist.branch_id ===
      form.branch_id
  );

  const selectedDentist =
  filteredDentists.find(
    d => d.id === form.dentist_id
  );

  return (
    <div
      className="walkin-overlay"
      onClick={(e) =>
      {
        if(
          e.target ===
          e.currentTarget
        )
        {
          onClose();
        }
      }}
    >
      <div className="walkin-modal">

        <div className="walkin-header">
          <h2>
            Make Appointment
          </h2>
        </div>

        <div className="walkin-grid">

          <input
            placeholder="Full Name"
            value={form.guest_name}
            onChange={(e) =>
              setForm({
                ...form,
                guest_name:
                  e.target.value
              })
            }
          />

          <input
            placeholder="Contact Number"
            value={form.guest_contact}
            onChange={(e) =>
              setForm({
                ...form,
                guest_contact:
                  e.target.value
              })
            }
          />

          <input
            placeholder="Email"
            value={form.guest_email}
            onChange={(e) =>
              setForm({
                ...form,
                guest_email:
                  e.target.value
              })
            }
          />

          <select
            value={form.branch_id}
            onChange={(e) =>
            setForm({
            ...form,
            branch_id:
            e.target.value,

            dentist_id: ""
        })
    }
>
            <option value="Hagonoy">
              Hagonoy
            </option>

            <option value="Paombong">
              Paombong
            </option>
          </select>

          <select
            value={form.dentist_id}
            onChange={(e) =>
              setForm({
                ...form,
                dentist_id:
                  e.target.value
              })
            }
          >
            <option value="">
              Select Dentist
            </option>

            {filteredDentists.map(
            dentist => (
                <option
                  key={dentist.id}
                  value={dentist.id}
                >
                  {`${dentist.first_name || ""} ${dentist.last_name || ""}`}
                </option>
              )
            )}
          </select>

          <input
            type="date"
            value={form.appointment_date}
            onChange={(e) =>
              setForm({
                ...form,
                appointment_date:
                  e.target.value
              })
            }
          />

          <select
  value={form.appointment_time}
  onChange={(e)=>
    setForm({
      ...form,
      appointment_time:
        e.target.value
    })
  }
>

<option value="">
  Select Time
</option>

{
times.map(time =>
{
  const taken =
    unavailableTimes.includes(time);

  return(
    <option
      key={time}
      value={time}
      disabled={taken}
    >
      {time}
      {taken
        ? " (Unavailable)"
        : ""}
    </option>
  );
})
}

</select>

          <select
            value={form.payment_method}
            onChange={(e) =>
              setForm({
                ...form,
                payment_method:
                  e.target.value
              })
            }
          >
            <option>
              Cash
            </option>

            <option>
              Visa
            </option>

            <option>
              Mastercard
            </option>

            <option>
              JCB
            </option>
          </select>

        </div>

        <textarea
          placeholder="Reason for Visit"
          value={form.reason_for_visit}
          onChange={(e) =>
            setForm({
              ...form,
              reason_for_visit:
                e.target.value
            })
          }
        />

        <textarea
          placeholder="Notes"
          value={form.notes}
          onChange={(e) =>
            setForm({
              ...form,
              notes:
                e.target.value
            })
          }
        />

        <div className="walkin-services">

          <h4>
            Services
          </h4>

          {services.map(
            service => (
              <label
                key={service.id}
                className="service-chip"
              >
                <input
                  type="checkbox"
                  checked={
                    selectedServices.some(
                      s =>
                        s.id ===
                        service.id
                    )
                  }
                  onChange={() =>
                    toggleService(
                      service
                    )
                  }
                />

                {service.name}
              </label>
            )
          )}

        </div>

        <div className="walkin-summary">

  <h3>
    Appointment Summary
  </h3>

  <div className="summary-row">
    <span>Branch</span>

    <strong>
      {form.branch_id || "-"}
    </strong>
  </div>

  <div className="summary-row">
    <span>Dentist</span>

    <strong>
  {selectedDentist
    ? `${selectedDentist.first_name} ${selectedDentist.last_name}`
    : "-"
  }
</strong>
  </div>

  <div className="summary-row">
    <span>Services</span>

    <strong>
      {
        selectedServices.length > 0
          ? selectedServices
              .map(
                s =>
                  s.name
              )
              .join(", ")
          : "-"
      }
    </strong>
  </div>

  <div className="summary-row">
    <span>Date</span>

    <strong>
      {form.appointment_date || "-"}
    </strong>
  </div>

  <div className="summary-row">
    <span>Time</span>

    <strong>
      {form.appointment_time || "-"}
    </strong>
  </div>

  <div className="summary-row">
    <span>End Time</span>

    <strong>
      {appointmentEndTime || "-"}
    </strong>
  </div>

  <div className="summary-row">
    <span>Payment</span>

    <strong>
      {form.payment_method}
    </strong>
  </div>

  <div className="summary-row">
    <span>Total Duration</span>

    <strong>
      {totalDuration} mins
    </strong>
  </div>

  <div className="summary-row total">
    <span>Total Amount</span>

    <strong>
      ₱{totalAmount.toLocaleString()}
    </strong>
  </div>

</div>

        <div className="walkin-actions">

          <button
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="create-btn"
            onClick={handleSubmit}
          >
            Create Appointment
          </button>

        </div>

      </div>
    </div>
  );
}

export default WalkInAppointmentModal;