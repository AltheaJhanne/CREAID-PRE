import { Elysia } from "elysia";
import { supabase } from "../supabase.js";

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

  if(appliesTo === "All Days")
  {
    checkLunch = true;
  }

  else if(
    appliesTo === "Weekdays Only"
  )
  {
    checkLunch =
      !["Saturday","Sunday"]
      .includes(appointmentDay);
  }

  else if(
    appliesTo === "Weekends Only"
  )
  {
    checkLunch =
      ["Saturday","Sunday"]
      .includes(appointmentDay);
  }

  else if(
    appliesTo === "Custom"
  )
  {
    checkLunch = true;
  }

  if(checkLunch)
  {
    if(
      appointment_time >= lunchBreak.lunch_start &&
      appointment_time < lunchBreak.lunch_end
    )
    {
      set.status = 400;

      return {
        success:false,
        message:
          "Selected time falls during lunch break."
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

console.log(
  "APPOINTMENT CREATED:",
  appointment.id
);

  if (appointmentError) {

    set.status = 500;

    return {
      success: false,
      message:
        appointmentError.message
    };
  }

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
      dentist_id,

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
        receipt_url
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
        downpayment_amount
      `)
      .eq("id", params.id)
      .single();

  await supabase
    .from("appointments")
    .update({
      payment_status:
        "downpayment_paid",

      amount_paid:
        appointment.downpayment_amount,

      remaining_balance:
        Math.max(
          0,
          appointment.total_amount -
          appointment.downpayment_amount
        )
    })
    .eq("id", params.id);

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
async ({ params, set }) => {

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
        downpayment_amount
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

  return {
    success: true
  };
})

.patch("/:id/reschedule",
async ({ params, body, set }) => {

  const {
    appointment_date,
    appointment_time,
    appointment_end_time
  } = body;

  const { error } =
    await supabase
      .from("appointments")
      .update({
        appointment_date,
        appointment_time,
        appointment_end_time
      })
      .eq("id", params.id);

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
    message:
      "Appointment rescheduled"
  };
})

.patch(
"/:id/status",
async ({ params, body, set }) =>
{
  const { status } = body;

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
});

