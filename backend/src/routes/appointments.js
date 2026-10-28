import { Elysia } from "elysia";
import { supabase } from "../supabase.js";
import {
  sendAppointmentEmail,
  sendAppointmentConfirmedEmail
}
from "../utils/email.js";
import {
  logActivity
} from "../utils/logActivity.js";

async function recalculateAppointmentTotals(
  appointmentId
)
{
  const {
    data: services
  } =
  await supabase
    .from("appointment_services")
    .select("price")
    .eq(
      "appointment_id",
      appointmentId
    )
    .eq(
      "service_status",
      "performed"
    );

  const total =
    services.reduce(
      (sum, s) =>
        sum + Number(s.price),
      0
    );

  const {
    data: appointment
  } =
  await supabase
    .from("appointments")
    .select("amount_paid")
    .eq(
      "id",
      appointmentId
    )
    .single();

  const remaining =
    Math.max(
      0,
      total -
      Number(
        appointment.amount_paid || 0
      )
    );

  await supabase
    .from("appointments")
    .update({
      total_amount: total,
      remaining_balance:
        remaining
    })
    .eq(
      "id",
      appointmentId
    );
}

export const appointmentRoutes =
new Elysia({
  prefix: "/appointments"
})

.post("/",
async ({ body, set }) => {

  console.log(
  "BODY RECEIVED:",
  body
);

  const {
    patient_id,

    guest_name,
    guest_contact,
    guest_email,

    dentist_id,

    branch_id,

    selected_services,

    appointment_date,
    appointment_time,
    appointment_end_time,

    receipt_url,
    cancellation_deadline,

    payment_method,
    payment_status,
    status,

    total_amount,
    downpayment_amount,

    notes,
    reason_for_visit
  } = body;

  // ----------------------------------
  // PREVENT PAST APPOINTMENT BOOKINGS
  // Philippine Time (Asia/Manila)
  // ----------------------------------

  const now = new Date();

  const manilaDate = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(now);

  const manilaTime = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }
  ).format(now);

  if (
    !appointment_date ||
    !appointment_time ||
    appointment_date < manilaDate ||
    (
      appointment_date === manilaDate &&
      appointment_time.slice(0, 5) <= manilaTime
    )
  ) {
    set.status = 400;

    return {
      success: false,
      message:
        "Cannot book an appointment for a past date or time."
    };
  }

  // ----------------------------------
  // CHECK DENTIST WORKING HOURS
  // ----------------------------------

const appointmentDay =
new Date(appointment_date)
.toLocaleDateString(
  "en-US",
  {
    weekday: "long"
  }
);

const {
  data: workingHours
}
=
await supabase
.from("dentist_working_hours")
.select("*")
.eq(
  "dentist_id",
  dentist_id
)
.eq(
  "day_name",
  appointmentDay
)
.single();

if(
  !workingHours
)
{
  set.status = 400;

  return {
    success:false,
    message:
      "Dentist schedule not found."
  };
}

if(
  workingHours.is_off
)
{
  set.status = 400;

  return {
    success:false,
    message:
      "Dentist is off on this day."
  };
}

// ----------------------------------
// CHECK LUNCH BREAK
// ----------------------------------

const {
  data: lunchBreak
}
=
await supabase
  .from("dentist_lunch_breaks")
  .select("*")
  .eq(
    "dentist_id",
    dentist_id
  )
  .maybeSingle();

if(lunchBreak)
{
  const appliesTo =
    lunchBreak.applies_to;

  let checkLunch = false;

  if (
  appliesTo === "all_days" ||
  appliesTo === "All Days"
) {
  checkLunch = true;
}

else if (
  appliesTo === "weekdays" ||
  appliesTo === "Weekdays Only"
) {
  checkLunch =
    !["Saturday", "Sunday"].includes(appointmentDay);
}

else if (
  appliesTo === "weekends" ||
  appliesTo === "Weekends Only"
) {
  checkLunch =
    ["Saturday", "Sunday"].includes(appointmentDay);
}

else if (
  appliesTo?.startsWith("custom:")
) {
  const customDays = appliesTo
    .slice("custom:".length)
    .split(",")
    .map(day => day.trim());

  checkLunch = customDays.includes(appointmentDay);
}

if (checkLunch) {
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const appointmentStart = toMinutes(appointment_time);
  const appointmentEnd = toMinutes(appointment_end_time);

  const lunchStart = toMinutes(lunchBreak.lunch_start);
  const lunchEnd = toMinutes(lunchBreak.lunch_end);

  if (
    appointmentStart < lunchEnd &&
    appointmentEnd > lunchStart
  ) {
    set.status = 400;

    return {
      success: false,
      message: "Selected appointment overlaps the dentist's lunch break."
    };
  }
}
}

// ----------------------------------
// CHECK APPROVED LEAVE
// ----------------------------------

const {
  data: approvedLeave,
  error: leaveError
} =
await supabase
  .from("dentist_leave_requests")
  .select("*")
  .eq("dentist_id", dentist_id)
  .eq("status", "approved")
  .lte("leave_from", appointment_date)
  .gte("leave_to", appointment_date)
  .maybeSingle();

if(leaveError)
{
  set.status = 500;

  return {
    success: false,
    message: leaveError.message
  };
}

if(approvedLeave)
{
  set.status = 400;

  return {
    success: false,
    message:
      "Dentist is on approved leave for this date."
  };
}

// ----------------------------------
// CHECK WITHIN WORKING HOURS
// ----------------------------------

if(
  appointment_time <
    workingHours.start_time ||
  appointment_time >=
    workingHours.end_time
)
{
  set.status = 400;

  return {
    success: false,
    message:
      `Dentist only accepts appointments between ${workingHours.start_time} and ${workingHours.end_time}.`
  };
}

  const cancellation_token =
  crypto.randomUUID();

  if (
    !patient_id &&
    !guest_name
  ) {
    set.status = 400;

    return {
      success: false,
      message:
        "Patient information required"
    };
  }

  console.log(
  "STATUS RECEIVED:",
  status
);

  const {
    data: appointment,
    error: appointmentError
  } =
    await supabase
      .from("appointments")
      .insert([
        {
          patient_id,

          guest_name,
          guest_contact,
          guest_email,

          dentist_id,

          branch_id,

          appointment_date,
          appointment_time,
          appointment_end_time,
          
          receipt_url,
          cancellation_deadline,
          cancellation_token,

          payment_method,
          payment_status,
          status,

          total_amount,
          downpayment_amount,

          amount_paid: 0,

          remaining_balance: total_amount,

          notes,
          reason_for_visit
          
        }
      ])
      .select()
      .single();

      console.log(
  "APPOINTMENT ERROR:",
  appointmentError
);

if (appointmentError)
{
  set.status = 500;

  return {
    success: false,
    message:
      appointmentError.message
  };
}

console.log(
  "APPOINTMENT CREATED:",
  appointment.id
);

await logActivity({

  user:
    body.performed_by,

  action:
    "Create Appointment",

  description:
    `Created appointment for ${
      guest_name ||
      "Registered Patient"
    }.`

});

  if (
    selected_services?.length
  ) {

    console.log(
  "INSERTING SERVICES..."
);

    const servicesPayload =
      selected_services.map(
        (service) => ({
          appointment_id:
            appointment.id,

          service_id:
            service.id,

          service_name:
            service.name,

          price:
            service.price,

          duration_minutes:
            service.duration_minutes
        })
      );

    const {
      error:
        servicesError
    } =
      await supabase
        .from(
          "appointment_services"
        )
        .insert(
          servicesPayload
        );

    if (servicesError) {

      set.status = 500;

      return {
        success: false,
        message:
          servicesError.message
      };
    }

  }

  const {
  data: dentist
} =
await supabase
  .from("users")
  .select("first_name,last_name")
  .eq("id", dentist_id)
  .single();

const dentistName =
  dentist
    ? `Dr. ${dentist.first_name} ${dentist.last_name}`
    : "Assigned Dentist";

  const cancelLink =
`${process.env.FRONTEND_URL}/cancel/${cancellation_token}`;

try {

  console.log(
  "SENDING EMAIL..."
);

  await sendAppointmentEmail({

    to: guest_email,

    name:
      guest_name ||
      "Patient",

    dentist:
      dentistName,

    date:
      appointment_date,

    time:
      appointment_time,

    totalAmount:
      total_amount,

    downpayment:
      downpayment_amount,

    cancelLink

  });

  console.log(
    "Appointment email sent."
  );

}
catch(emailError)
{
  console.error(
    "EMAIL ERROR:",
    emailError
  );
}

console.log(
  "RETURNING SUCCESS"
);

  return {
    success: true,
    message:
      "Appointment booked successfully"
  };
})

.get(
"/dentists/:dentistId/my-patients",
async ({ params, set }) => {

  const {
  data,
  error
} = await supabase
  .from("appointments")
  .select(`
  id,
  patient_id,
  guest_name,
  guest_contact,
  guest_email,
  appointment_date,
  reason_for_visit,

  users:patient_id (
    id,
    first_name,
    last_name,
    email,
    contact_number,
    avatar_url,
    is_archived
  )
`)
  .eq(
    "dentist_id",
    params.dentistId
  )
  .eq(
    "status",
    "completed"
  );
  const patients =
(data || []).map(appt =>
({
  id:
  appt.patient_id
    ? appt.patient_id
    : appt.guest_email
      ? `guest-email-${appt.guest_email}`
      : `guest-contact-${appt.guest_contact}`,

  is_guest:
    !appt.patient_id,

  name:
    appt.users
      ? `${appt.users.first_name}
         ${appt.users.last_name}`
      : appt.guest_name,

  email:
    appt.users?.email ||
    appt.guest_email,

  contact:
  appt.users?.contact_number ||
  appt.guest_contact,

contact_number:
  appt.users?.contact_number ||
  appt.guest_contact,

  avatar_url:
    appt.users?.avatar_url || null,

  is_archived:
    appt.users?.is_archived || false,

  patient_id:
    appt.patient_id,

  appointment_date:
    appt.appointment_date,

  reason_for_visit:
    appt.reason_for_visit
}));
const uniquePatients =
Object.values(
  patients.reduce(
    (acc, patient) =>
    {
      const key =
        patient.patient_id ||
        patient.id;

      if(
        !acc[key] ||
        patient.appointment_date >
        acc[key].appointment_date
      )
      {
        acc[key] = patient;
      }

      return acc;
    },
    {}
  )
);

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  return {
    success: true,
    patients: uniquePatients
  };
})

.get(
"/dentists/:dentistId/earnings",
async ({ params, set }) =>
{
  // Get completed appointments
  const {
    data: appointments,
    error: appointmentsError
  } =
  await supabase
    .from("appointments")
    .select(`
      id,
      appointment_date,
      total_amount,
      guest_name,
      patient_id,

      users:patient_id(
        first_name,
        last_name
      ),

      appointment_services(
        service_name,
        price,
        service_status
      )
    `)
    .eq(
      "dentist_id",
      params.dentistId
    )
    .eq(
      "status",
      "completed"
    )
    .order(
      "appointment_date",
      {
        ascending: false
      }
    );

  if(appointmentsError)
  {
    set.status = 500;

    return {
      success: false,
      message: appointmentsError.message
    };
  }

  // Get saved commissions
  const {
    data: commissions,
    error: commissionsError
  } =
  await supabase
    .from("dentist_commissions")
    .select(`
      appointment_id,
      commission,
      earnings
    `)
    .eq(
      "dentist_id",
      params.dentistId
    );

  if(commissionsError)
  {
    set.status = 500;

    return {
      success: false,
      message: commissionsError.message
    };
  }

  // Build commission table
  const detailedEarnings =
    (appointments || []).map(appt =>
    {
      const commissionRow =
        (commissions || []).find(
          c =>
            c.appointment_id ===
            appt.id
        );

      return {

        appointment_date:
          appt.appointment_date,

        patient_name:
          appt.guest_name ||

          `${appt.users?.first_name ?? ""}
           ${appt.users?.last_name ?? ""}`.trim(),

        treatments:
          (appt.appointment_services || [])
          .filter(
            s =>
              s.service_status ===
              "performed"
          )
          .map(
            s =>
              s.service_name
          )
          .join(", "),

        earnings:
          Number(
            commissionRow?.earnings ??
            appt.total_amount ??
            0
          ),

        commission:
          Number(
            commissionRow?.commission ??
            0
          )
      };
    });

  // Totals
  const totalCommission =
    detailedEarnings.reduce(
      (sum, row) =>
        sum + row.commission,
      0
    );

  const totalEarnings =
    detailedEarnings.reduce(
      (sum, row) =>
        sum + row.earnings,
      0
    );

    console.log("COMMISSIONS TABLE:", commissions);

    console.log("DETAILS:", detailedEarnings);

    console.log("TOTAL COMMISSION:", totalCommission);

    console.log("TOTAL EARNINGS:", totalEarnings);

  return {
    success: true,

    detailedEarnings,

    totalCommission,

    totalEarnings
  };
})

.get(
"/patients/:patientId/last-visit",
async ({ params, set }) =>
{
  const {
    data,
    error
  } = await supabase
    .from("appointments")
    .select("appointment_date")
    .eq(
      "patient_id",
      params.patientId
    )
    .eq(
      "status",
      "completed"
    )
    .order(
      "appointment_date",
      {
        ascending: false
      }
    )
    .limit(1);

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  return {
    success: true,
    lastVisit:
      data?.[0]?.appointment_date ||
      null
  };
})

.get("/payments",
async ({ set }) => {

  const { data, error } =
  await supabase
    .from("appointments")
    .select(`
  id,
  guest_name,
  total_amount,
  amount_paid,
  remaining_balance,
  payment_method,
  payment_status,
  status,
  rejection_reason,
  appointment_date,
  branch_id,
  invoice_number,
  receipt_url
`)
    .gt("total_amount", 0)
    .not("guest_name", "is", null)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

    console.log(
  "PAYMENTS:",
  data
);

console.log(
  "ERROR:",
  error
);

  return {
    success: true,
    payments: data
  };

})

.get("/",
async ({ set }) => {

  const { data, error } =
    await supabase
      .from("appointments")
      .select(`
        *,
        patient:users!appointments_patient_id_fkey(
          id,
          full_name,
          contact_number
        ),
        dentist:users!appointments_dentist_id_fkey(
          id,
          full_name
        ),
        service:services(
          id,
          name,
          price
        )
      `)
      .order("created_at", {
        ascending: false
      });

  if (error) {

    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  return {
    success: true,
    appointments: data || []
  };
})

.get("/stats",
async ({ query, set }) => {

  const period =
    query.period || "week";

  const clinic =
  query.clinic || "All";

    console.log(
  "PERIOD:",
  period
);

  const { data, error } =
    await supabase
      .from("appointments")
      .select(`
      status,
      payment_status,
      total_amount,
      downpayment_amount,
      appointment_date,
      branch_id
`)

console.log("ALL APPOINTMENTS:");
console.table(data);

  if (error) {

    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }
  let filteredData = data;

  console.log(
  "FILTERED:",
  filteredData
);

  if(clinic !== "All")
{
  filteredData =
    filteredData.filter(
      a =>
        a.branch_id === clinic
    );
}

if(period !== "All")
{
  const today =
    new Date();

  if(period === "day")
  {
    const todayString =
      today
        .toISOString()
        .split("T")[0];

    filteredData =
      filteredData.filter(
        a =>
          a.appointment_date ===
          todayString
      );
  }

  else if(period === "week")
{
  const startOfWeek =
    new Date(today);

  const day =
    today.getDay();

  const diff =
    day === 0
      ? -6
      : 1 - day;

  startOfWeek.setDate(
    today.getDate() + diff
  );

  startOfWeek.setHours(
    0,0,0,0
  );

  const endOfWeek =
    new Date(startOfWeek);

  endOfWeek.setDate(
    startOfWeek.getDate() + 6
  );

  endOfWeek.setHours(
    23,59,59,999
  );

  filteredData =
    filteredData.filter(a =>
    {
      const apptDate =
        new Date(
          a.appointment_date + "T00:00:00"
        );

      return (
        apptDate >= startOfWeek &&
        apptDate <= endOfWeek
      );
    });
}

  else if(period === "month")
  {
    filteredData =
      filteredData.filter(a =>
      {
        const appt =
          new Date(
            a.appointment_date
          );

        return (
          appt.getMonth() ===
          today.getMonth()
          &&
          appt.getFullYear() ===
          today.getFullYear()
        );
      });
  }
}
  const pendingVerification =
  filteredData.filter(
    a =>
      a.status ===
      "pending_verification"
  ).length;

  const totalAppointments =
    filteredData.length;

  const scheduled =
    filteredData.filter(
      a =>
        a.status ===
        "scheduled"
    ).length;

  const completed =
    filteredData.filter(
      a =>
        a.status ===
        "completed"
    ).length;

  const cancelled =
    filteredData.filter(
      a =>
        a.status ===
        "cancelled"
    ).length;

  const noShow =
    filteredData.filter(
      a =>
        a.status ===
        "no_show"
    ).length;

  const revenue =
filteredData
  .filter(
    a =>
      a.status ===
      "completed"
  )
  .reduce(
    (sum, a) =>
      sum +
      Number(
        a.total_amount || 0
      ),
    0
  );

  console.log("FINAL STATS:", {
  totalAppointments,
  scheduled,
  completed,
  cancelled,
  noShow,
  pendingVerification,
  revenue
});

  return {
    success: true,

    stats: {
  totalAppointments,
  scheduled,
  completed,
  cancelled,
  noShow,
  pendingVerification,
  revenue
}
  };

  console.log({
  scheduled,
  completed,
  cancelled,
  noShow,
  pendingVerification,
  revenue
});

})

.get("/treatment-stats",
async ({ query, set }) => {

  const period =
    query.period || "week";

  const clinic =
  query.clinic || "All";

  const { data, error } =
  await supabase
    .from("appointment_services")
    .select(`
      service_name,
      appointments!inner(
      appointment_date,
      status,
      branch_id
)
    `)
    .eq(
      "service_status",
      "performed"
    );

if(error)
{
  set.status = 500;

  return {
    success: false,
    message: error.message
  };
}

let filteredData = data;

if(clinic !== "All")
{
  filteredData =
    filteredData.filter(
      item =>
        item.appointments
          ?.branch_id === clinic
    );
}

const today =
  new Date();

if(period === "day")
{
  const todayString =
    today
      .toISOString()
      .split("T")[0];

  filteredData =
  filteredData.filter(
      item =>
        item.appointments
          ?.appointment_date ===
        todayString
    );
}

else if(period === "week")
{
  const startOfWeek =
    new Date(today);

  const day =
    today.getDay();

  const diff =
    day === 0
      ? -6
      : 1 - day;

  startOfWeek.setDate(
    today.getDate() + diff
  );

  startOfWeek.setHours(
    0,0,0,0
  );

  const endOfWeek =
    new Date(startOfWeek);

  endOfWeek.setDate(
    startOfWeek.getDate() + 6
  );

  endOfWeek.setHours(
    23,59,59,999
  );

  filteredData =
  filteredData.filter(item => {

      const apptDate =
        new Date(
          item.appointments
            ?.appointment_date
        );

      return (
        apptDate >= startOfWeek &&
        apptDate <= endOfWeek
      );

    });
}

else if(period === "month")
{
  filteredData =
  filteredData.filter(item => {

      const apptDate =
        new Date(
          item.appointments
            ?.appointment_date
        );

      return (
        apptDate.getMonth() ===
          today.getMonth()
        &&
        apptDate.getFullYear() ===
          today.getFullYear()
      );

    });
}

filteredData =
  filteredData.filter(
    item =>
      item.appointments?.status ===
      "completed"
  );


const counts = {};

filteredData.forEach(item => {

  const name =
    item.service_name ||
    "Unknown";

  counts[name] =
    (counts[name] || 0) + 1;

});

const treatments =
  Object.entries(counts).map(
    ([name, count]) => ({
      name,
      count
    })
  );

return {
  success: true,
  treatments
};
})

.get("/balances",
async ({ query, set }) => {

  const clinic =
    query.clinic || "All";

  let balancesQuery =
    supabase
      .from("appointments")
      .select(`
        id,
        guest_name,
        total_amount,
        amount_paid,
        remaining_balance,
        payment_method,
        payment_status,
        status,
        branch_id
      `)
      .gt(
        "remaining_balance",
        0
      )
      .or(
        "status.eq.scheduled,status.eq.completed"
      );

  if(clinic !== "All")
  {
    balancesQuery =
      balancesQuery.eq(
        "branch_id",
        clinic
      );
  }

  const {
    data,
    error
  } =
    await balancesQuery;

  console.log(
    "CLINIC:",
    clinic
  );

  console.log(
    "BALANCES:",
    data
  );

  console.log(
    "BALANCE ERROR:",
    error
  );

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message:
        error.message
    };
  }

  return {
    success: true,
    patients: data || []
  };
})

.get("/:id/services",
async ({ params, set }) => {

  const { data, error } =
    await supabase
      .from(
        "appointment_services"
      )
      .select(`
  id,
  service_name,
  price,
  duration_minutes,
  service_status
`)
      .eq(
        "appointment_id",
        params.id
      );

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message:
        error.message
    };
  }

  return {
    success: true,
    services: data
  };
})

.get("/services",
async () => {

  const { data, error } =
    await supabase
      .from("services")
      .select("*")
      .order("name");

  return {
    success: !error,
    services: data || []
  };
})

.patch(
"/:id/reject",
async ({ params, body, set }) =>
{
  const {
    rejection_reason
  } = body;

  const { error } =
    await supabase
      .from("appointments")
      .update({
  status: "cancelled",
  payment_status: "cancelled",
  amount_paid: 0,
  remaining_balance: 0,
  refund_status: "not_required",
  rejection_reason
})
      .eq(
        "id",
        params.id
      );

      if(error)
{
  console.log(
"REJECT ERROR:",
error
);

  set.status = 500;

  return {
    success: false,
    message:
      error.message
  };
}

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message:
        error.message
    };
  }

  return {
    success: true
  };
})

.patch("/:id/mark-paid",
async ({ params, set }) => {

  const {
    data: appointment,
    error: fetchError
  } =
    await supabase
      .from("appointments")
      .select(`
        total_amount,
        receipt_url,
        payment_status,
        previous_payment_status
      `)
      .eq("id", params.id)
      .single();

  if(fetchError)
  {
    set.status = 500;

    return {
      success: false,
      message:
        fetchError.message
    };
  }

  const invoiceNumber =
  `INV-${Date.now()}`;

  const { error } =
    await supabase
      .from("appointments")
      .update({
        previous_payment_status:
          appointment.payment_status === "paid"
            ? appointment.previous_payment_status
            : appointment.payment_status,

        payment_status: "paid",

        amount_paid:
          appointment.total_amount,

        remaining_balance: 0,

        invoice_number:
          invoiceNumber
      })
      .eq("id", params.id);

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message:
        error.message
    };
  }

  return {
  success:true,
  invoice_number:
    invoiceNumber,
  receipt_url:
    appointment.receipt_url,
  remaining_balance:0
};
})

.patch("/:id/undo-paid",
async ({ params }) => {

  console.log(
    "🔥 NEW UNDO-PAID ENDPOINT IS RUNNING:",
    params.id
  );

  await recalculateAppointmentTotals(
    params.id
  );

  const {
    data: appointment
  } =
    await supabase
      .from("appointments")
      .select(`
        total_amount,
        downpayment_amount,
        payment_status,
        previous_payment_status
      `)
      .eq("id", params.id)
      .single();

  const previousStatus =
  appointment.previous_payment_status;

if (
  appointment.payment_status !== "paid" ||
  !["pending", "downpayment_paid"].includes(previousStatus)
) {
  return {
    success: false,
    message:
      "Cannot undo payment because the previous payment status is unavailable."
  };
}

const restoredAmount =
  previousStatus === "downpayment_paid"
    ? Number(appointment.downpayment_amount || 0)
    : 0;

const { error } =
  await supabase
    .from("appointments")
    .update({
      payment_status: previousStatus,

      previous_payment_status: null,

      amount_paid: restoredAmount,

      remaining_balance:
        Math.max(
          0,
          Number(appointment.total_amount || 0) -
            restoredAmount
        )
    })
    .eq("id", params.id);

if (error) {
  return {
    success: false,
    message: error.message
  };
}

  return {
    success: true
  };
})

.patch("/:id/cancel-payment",
async ({ params }) => {

  const { error } =
    await supabase
      .from("appointments")
      .update({
        payment_status:
          "cancelled",

        status:
          "cancelled"
      })
      .eq("id", params.id);

  return {
    success: !error
  };
})

.patch("/:id/reinstate-payment",
async ({ params }) => {

  const { error } =
    await supabase
      .from("appointments")
      .update({
        payment_status:
          "downpayment_paid",

        status:
          "scheduled"
      })
      .eq("id", params.id);

  return {
    success: !error
  };
})

.patch("/:id/confirm-downpayment",
async ({ params, body, set }) => {

   console.log(
    "CONFIRMING:",
    params.id
  );

  const {
    data: appointment,
    error: fetchError
  } =
    await supabase
      .from("appointments")
      .select(`
      total_amount,
      downpayment_amount,
      guest_name,
      guest_email,
      appointment_date,
      appointment_time,
      dentist_id
    `)
      .eq("id", params.id)
      .single();

       console.log(
    "APPOINTMENT:",
    appointment
  );

  console.log(
    "FETCH ERROR:",
    fetchError
  );

  if(fetchError)
  {
    set.status = 500;

    return {
      success: false,
      message:
        fetchError.message
    };
  }

  const {
  data,
  error
} =
await supabase
  .from("appointments")
  .update({
    payment_status: "downpayment_paid",
    status: "scheduled",
    amount_paid:
      appointment.downpayment_amount,
    remaining_balance:
      appointment.total_amount -
      appointment.downpayment_amount
  })
  .eq("id", params.id)
  .select();

console.log(
  "UPDATE DATA:",
  data
);

console.log(
  "UPDATE ERROR:",
  error
);

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message:
        error.message
    };
  }

  try
{
  const {
    data: dentist
  } =
  await supabase
    .from("users")
    .select("first_name,last_name")
    .eq(
      "id",
      appointment.dentist_id
    )
    .single();

  const dentistName =
    dentist
      ? `Dr. ${dentist.first_name} ${dentist.last_name}`
      : "Assigned Dentist";

  await sendAppointmentConfirmedEmail({

    to:
      appointment.guest_email,

    name:
      appointment.guest_name,

    dentist:
      dentistName,

    date:
      appointment.appointment_date,

    time:
      appointment.appointment_time,

    totalAmount:
      appointment.total_amount

  });

  console.log(
    "CONFIRMATION EMAIL SENT"
  );
}
catch(emailError)
{
  console.error(
    "CONFIRM EMAIL ERROR:",
    emailError
  );
}

const {
  data: patient
} =
await supabase
  .from("appointments")
  .select("guest_name")
  .eq("id", params.id)
  .single();

await logActivity({

  user:
    body.performed_by,

  action:
    "Confirm Downpayment",

  description:
    `Verified downpayment of ${patient.guest_name}.`

});

let patientName =
  appointment.guest_name;

if(!patientName && appointment.patient_id)
{
  const {
    data: patient
  } =
  await supabase
    .from("users")
    .select("first_name,last_name")
    .eq("id", appointment.patient_id)
    .single();

  patientName =
    patient
      ? `${patient.first_name} ${patient.last_name}`
      : "Registered Patient";
}

await logActivity({

  user:
    body.performed_by,

  action:
    "Confirm Downpayment",

  description:
    `Verified downpayment of ${patientName}.`

});

  return {
    success: true
  };
})


.patch("/:id/reschedule", async ({ params, body, set }) => {
  const fail = (status, message) => {
    set.status = status;
    return { success: false, message };
  };

  const toMinutes = (value) => {
    const match = String(value ?? "").match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

    if (!match) return NaN;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours > 23 || minutes > 59) return NaN;

    return hours * 60 + minutes;
  };

  const {
    appointment_date,
    appointment_time,
    appointment_end_time
  } = body ?? {};

  if (
    typeof appointment_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)
  ) {
    return fail(400, "Invalid appointment date.");
  }

  const start = toMinutes(appointment_time);
  const end = toMinutes(appointment_end_time);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return fail(400, "Invalid appointment time range.");
  }

  const [year, month, day] = appointment_date.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return fail(400, "Invalid appointment date.");
  }

  const manilaParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    })
      .formatToParts(new Date())
      .map(part => [part.type, part.value])
  );

  const today = `${manilaParts.year}-${manilaParts.month}-${manilaParts.day}`;
  const currentMinutes =
    Number(manilaParts.hour) * 60 + Number(manilaParts.minute);

  if (
    appointment_date < today ||
    (appointment_date === today && start <= currentMinutes)
  ) {
    return fail(400, "Please select a future appointment time.");
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, dentist_id, status")
    .eq("id", params.id)
    .single();

  if (appointmentError || !appointment) {
    return fail(404, "Appointment not found.");
  }

  if (appointment.status !== "scheduled") {
    return fail(400, "Only scheduled appointments can be rescheduled.");
  }

  if (!appointment.dentist_id) {
    return fail(400, "No dentist assigned to this appointment.");
  }

  const dentistId = appointment.dentist_id;

  const dayName = date.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC"
  });

  const [
    hoursResult,
    lunchResult,
    leaveResult,
    bookingsResult
  ] = await Promise.all([
    supabase
      .from("dentist_working_hours")
      .select("start_time, end_time, is_off")
      .eq("dentist_id", dentistId)
      .eq("day_name", dayName)
      .maybeSingle(),

    supabase
      .from("dentist_lunch_breaks")
      .select("lunch_start, lunch_end, applies_to")
      .eq("dentist_id", dentistId)
      .maybeSingle(),

    supabase
      .from("dentist_leave_requests")
      .select("leave_from, leave_to")
      .eq("dentist_id", dentistId)
      .eq("status", "approved")
      .lte("leave_from", appointment_date)
      .gte("leave_to", appointment_date),

    supabase
      .from("appointments")
      .select("id, appointment_time, appointment_end_time, status")
      .eq("dentist_id", dentistId)
      .eq("appointment_date", appointment_date)
      .neq("id", params.id)
      .in("status", [
        "scheduled",
        "confirmed",
        "pending_verification",
        "pending_payment"
      ])
  ]);

  const queryError = [
    hoursResult,
    lunchResult,
    leaveResult,
    bookingsResult
  ].find(result => result.error);

  if (queryError) {
    console.error("Reschedule validation error:", queryError.error);
    return fail(500, "Unable to verify dentist availability.");
  }

  const hours = hoursResult.data;

  if (!hours || hours.is_off) {
    return fail(409, "Dentist is not working on this date.");
  }

  const workingStart = toMinutes(hours.start_time);
  const workingEnd = toMinutes(hours.end_time);

  if (
    !Number.isFinite(workingStart) ||
    !Number.isFinite(workingEnd) ||
    start < workingStart ||
    end > workingEnd
  ) {
    return fail(409, "Time is outside the dentist's working hours.");
  }

  if (leaveResult.data?.length > 0) {
    return fail(409, "Dentist is on approved leave.");
  }

  const lunch = lunchResult.data;

  if (lunch) {
    const appliesTo = lunch.applies_to || "";
    const weekend = ["Saturday", "Sunday"].includes(dayName);

    const lunchApplies =
      ["all_days", "All Days"].includes(appliesTo) ||
      (["weekdays", "Weekdays Only"].includes(appliesTo) && !weekend) ||
      (["weekends", "Weekends Only"].includes(appliesTo) && weekend) ||
      (
        appliesTo.startsWith("custom:") &&
        appliesTo.slice(7).split(",").map(d => d.trim()).includes(dayName)
      );

    if (lunchApplies) {
      const lunchStart = toMinutes(lunch.lunch_start);
      const lunchEnd = toMinutes(lunch.lunch_end);

      if (
        !Number.isFinite(lunchStart) ||
        !Number.isFinite(lunchEnd)
      ) {
        return fail(500, "Dentist lunch schedule is invalid.");
      }

      if (start < lunchEnd && end > lunchStart) {
        return fail(409, "Selected time overlaps the dentist's lunch break.");
      }
    }
  }

  const conflict = (bookingsResult.data || []).some(booking => {
    const bookedStart = toMinutes(booking.appointment_time);
    const bookedEnd = toMinutes(booking.appointment_end_time);

    if (
      !Number.isFinite(bookedStart) ||
      !Number.isFinite(bookedEnd)
    ) {
      return true;
    }

    return start < bookedEnd && end > bookedStart;
  });

  if (conflict) {
    return fail(409, "Dentist already has an appointment at this time.");
  }

  const { data: updated, error: updateError } = await supabase
    .from("appointments")
    .update({
      appointment_date,
      appointment_time,
      appointment_end_time
    })
    .eq("id", params.id)
    .eq("status", "scheduled")
    .select("id");

  if (updateError) {
    return fail(500, updateError.message);
  }

  if (!updated?.length) {
    return fail(409, "Appointment status changed. Please refresh.");
  }

  return {
    success: true,
    message: "Appointment rescheduled successfully."
  };
})


.patch(
"/:id/status",
async ({ params, body, set }) =>
{
  const {
  status,
  performed_by
} = body;

  // Update appointment status
  const {
    data: appointment,
    error
  } =
  await supabase
    .from("appointments")
    .update({ status })
    .eq("id", params.id)
    .select()
    .single();

  if(error)
  {
    set.status = 500;

    return {
      success:false,
      message:error.message
    };
  }

  // Only calculate commission when completed
  if(status === "completed")
  {
    const {
      data: services
    } =
    await supabase
      .from("appointment_services")
      .select(
        "service_name, price, service_status"
      )
      .eq(
        "appointment_id",
        params.id
      )
      .eq(
        "service_status",
        "performed"
      );

    const earnings =
      (services || []).reduce(
        (sum, s) =>
          sum + Number(s.price || 0),
        0
      );

    const commission =
    Number(
      (earnings * 0.30).toFixed(2)
    );


    let patientName =
  appointment.guest_name;

if(!patientName && appointment.patient_id)
{
  const {
    data: patient
  } =
  await supabase
    .from("users")
    .select("first_name,last_name")
    .eq("id", appointment.patient_id)
    .single();

  patientName =
    patient
      ? `${patient.first_name} ${patient.last_name}`
      : "Registered Patient";
}

    const serviceNames =
      (services || [])
        .map(
          s => s.service_name
        )
        .join(", ");

    // Prevent duplicate commission records
    const {
      data: existing
    } =
    await supabase
      .from("dentist_commissions")
      .select("id")
      .eq(
        "appointment_id",
        params.id
      )
      .maybeSingle();

      console.log("INSERTING COMMISSION...");
console.log({
  appointment,
  earnings,
  commission,
  patientName,
  serviceNames
});

    if(existing)
    {
      await supabase
        .from("dentist_commissions")
        .update({
          earnings,
          commission,
          service_name:
            serviceNames
        })
        .eq(
          "appointment_id",
          params.id
        );
    }
    else
    {
      const {
  data: inserted,
  error: insertError
} =
await supabase
  .from("dentist_commissions")
  .insert({
    dentist_id: appointment.dentist_id,
    appointment_id: appointment.id,
    appointment_date: appointment.appointment_date,
    patient_name: patientName,
    service_name: serviceNames,
    earnings,
    commission
  })
  .select();

console.log("INSERT RESULT:", inserted);
console.log("INSERT ERROR:", insertError);
    }
  }

  return {
    success:true,
    message:
      "Appointment status updated"
  };
})

.post("/:id/add-service",
async ({ params, body, set }) => {

  const { service_id } = body;

  const {
    data: existing
  } =
  await supabase
    .from("appointment_services")
    .select("*")
    .eq("appointment_id", params.id)
    .eq("service_id", service_id)
    .maybeSingle();

  if(existing)
  {
    if(existing.service_status === "not_performed")
    {
      await supabase
        .from("appointment_services")
        .update({
          service_status: "performed"
        })
        .eq("id", existing.id);

      await recalculateAppointmentTotals(params.id);

      return {
        success: true,
        message: "Service restored"
      };
    }

    return {
      success: false,
      message: "Service already added"
    };
  }

  const {
    data: service,
    error: serviceError
  } =
  await supabase
    .from("services")
    .select("*")
    .eq("id", service_id)
    .single();

  if(serviceError)
  {
    set.status = 500;

    return {
      success: false,
      message: serviceError.message
    };
  }

  const {
    error: insertError
  } =
  await supabase
    .from("appointment_services")
    .insert([
      {
        appointment_id: params.id,
        service_id: service.id,
        service_name: service.name,
        price: service.price,
        duration_minutes: service.duration_minutes,
        service_status: "performed"
      }
    ]);

  if(insertError)
  {
    set.status = 500;

    return {
      success: false,
      message: insertError.message
    };
  }

  await recalculateAppointmentTotals(params.id);

  return {
    success: true
  };
})

.patch(
"/services/:serviceRecordId/not-performed",
async ({ params }) => {

  const {
    data: service
  } =
  await supabase
    .from("appointment_services")
    .select("*")
    .eq(
      "id",
      params.serviceRecordId
    )
    .single();

  if(
    service.service_status ===
    "not_performed"
  )
  {
    return {
      success: false
    };
  }

  await supabase
    .from("appointment_services")
    .update({
      service_status:
        "not_performed"
    })
    .eq(
      "id",
      params.serviceRecordId
    );

  await recalculateAppointmentTotals(
    service.appointment_id
  );

  return {
    success: true
  };
})

.patch(
"/services/:serviceRecordId/performed",
async ({ params }) => {

  const {
    data: service
  } =
  await supabase
    .from("appointment_services")
    .select("*")
    .eq(
      "id",
      params.serviceRecordId
    )
    .single();

  if(
    service.service_status ===
    "performed"
  )
  {
    return {
      success: false,
      message:
        "Already performed"
    };
  }

  await supabase
    .from("appointment_services")
    .update({
      service_status:
        "performed"
    })
    .eq(
      "id",
      params.serviceRecordId
    );

  await recalculateAppointmentTotals(
    service.appointment_id
  );

  return {
    success: true
  };
})

.get(
"/cancel/:token",
async ({ params, set }) =>
{
  const {
    data,
    error
  } =
  await supabase
    .from("appointments")
    .select(`
      id,
      guest_name,
      appointment_date,
      appointment_time,
      payment_status,
      status
    `)
    .eq(
      "cancellation_token",
      params.token
    )
    .maybeSingle();

  if(error || !data)
  {
    set.status = 404;

    return {
      success:false,
      message:
        "Invalid cancellation link."
    };
  }

  return {
    success:true,
    appointment:data
  };
})

.patch(
"/cancel/:token",
async ({ params, set }) =>
{
  const {
    data: appointment,
    error
  } =
  await supabase
    .from("appointments")
    .select(`
    id,
    status
  `)
    .eq(
      "cancellation_token",
      params.token
    )
    .maybeSingle();

  if(error || !appointment)
  {
    set.status = 404;

    return {
      success:false,
      message:
        "Invalid cancellation link."
    };
  }

  if(
  appointment.status !==
  "pending_verification"
)
{
  set.status = 400;

  return {
    success:false,
    message:
      "Your appointment has already been confirmed by the clinic and can no longer be cancelled online."
  };
}

  await supabase
    .from("appointments")
    .update({
      status:"cancelled",
      payment_status:"cancelled"
    })
    .eq(
      "id",
      appointment.id
    );

    await logActivity({

  user:
    body.performed_by,

  action:
    "Cancel Appointment",

  description:
    `Cancelled booking request of ${appointment.guest_name}.`

});

  return {
    success:true
  };
});



