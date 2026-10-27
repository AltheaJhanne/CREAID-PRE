import { Elysia } from "elysia";
import { supabase } from "../supabase.js";

export const dailyReportsRoutes =
new Elysia({
  prefix: "/reports"
})

.get("/daily",
async ({ query, set }) =>
{
  try
  {
    const {
  from,
  to,
  clinic
} = query;

    let appointmentQuery =
      supabase
        .from("appointments")
        .select("*");

    if(from)
    {
      appointmentQuery =
        appointmentQuery.gte(
          "appointment_date",
          from
        );
    }

    if(to)
    {
      appointmentQuery =
        appointmentQuery.lte(
          "appointment_date",
          to
        );
    }

    const {
      data: appointments,
      error: appointmentError
    } = await appointmentQuery;

    if(appointmentError)
    {
      throw appointmentError;
    }

    const validAppointments =
  (appointments || []).filter(
    appointment =>
      appointment.status !==
      "rejected"
  );

      let filteredAppointments =
  validAppointments;

if(
  clinic &&
  clinic !== "All Clinics"
)
{
  filteredAppointments =
  filteredAppointments.filter(
    appointment =>
      (appointment.branch_id || "")
        .trim()
        .toLowerCase() ===
      clinic
        .trim()
        .toLowerCase()
  );
}

    const {
      data: services,
      error: serviceError
    } = await supabase
      .from("appointment_services")
      .select("*");

    if(serviceError)
    {
      throw serviceError;
    }

    let expensesQuery =
  supabase
    .from("expenses")
    .select("*")
    .eq(
      "is_archived",
      false
    );

    if(from)
    {
      expensesQuery =
        expensesQuery.gte(
          "expense_date",
          from
        );
    }

    if(to)
    {
      expensesQuery =
        expensesQuery.lte(
          "expense_date",
          to
        );
    }

    const {
      data: expenses,
      error: expenseError
    } =
      await expensesQuery;

    if(expenseError)
    {
      throw expenseError;
    }

    let filteredExpenses =
  expenses || [];

if(
  clinic &&
  clinic !== "All Clinics"
)
{
  filteredExpenses =
  filteredExpenses.filter(
    expense =>
      (expense.branch_id || "")
        .trim()
        .toLowerCase() ===
      clinic
        .trim()
        .toLowerCase()
  );
}

    // Get appointment history across both branches
const { data: appointmentHistory, error: historyError } =
  await supabase
    .from("appointments")
    .select(`
      id,
      patient_id,
      guest_name,
      guest_contact,
      appointment_date,
      appointment_time,
      created_at,
      status
    `);

if (historyError) {
  throw historyError;
}

const normalizeName = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const normalizeContact = (contact) => {
  let number = String(contact || "").replace(/\D/g, "");

  if (number.startsWith("63") && number.length === 12) {
    number = "0" + number.slice(2);
  }

  return number;
};

const isValidAppointment = (appointment) =>
  !["cancelled", "rejected"].includes(
    String(appointment.status || "").toLowerCase()
  );

const getPatientKey = (appointment) => {
  if (appointment.patient_id) {
    return `patient:${appointment.patient_id}`;
  }

  const name = normalizeName(appointment.guest_name);
  const contact = normalizeContact(appointment.guest_contact);

  if (name && contact.length === 11) {
    return `walkin:${name}:${contact}`;
  }

  return null;
};

const historyByPatient = new Map();

(appointmentHistory || [])
  .filter(isValidAppointment)
  .forEach((appointment) => {
    const key = getPatientKey(appointment);

    if (!key) return;

    if (!historyByPatient.has(key)) {
      historyByPatient.set(key, []);
    }

    historyByPatient.get(key).push(appointment);
  });

const getAppointmentOrder = (appointment) =>
  `${appointment.appointment_date || ""}T${appointment.appointment_time || "00:00:00"}`;

const rebookedCount = filteredAppointments.filter(
  (appointment) => {
    if (!isValidAppointment(appointment)) return false;

    const key = getPatientKey(appointment);
    if (!key) return false;

    const history = historyByPatient.get(key) || [];
    const currentOrder = getAppointmentOrder(appointment);

    return history.some((previous) =>
      previous.id !== appointment.id &&
      (
        getAppointmentOrder(previous) < currentOrder ||
        (
          getAppointmentOrder(previous) === currentOrder &&
          String(previous.created_at || "") <
            String(appointment.created_at || "")
        )
      )
    );
  }
).length;

const stats = {
  appointments: filteredAppointments.length,

  recalls: rebookedCount,

  patients:
    filteredAppointments.filter(
      appointment =>
        Number(appointment.amount_paid || 0) > 0
    ).length
};

    const patientAppointments =
filteredAppointments.map(
  appointment => ({
    date:
      appointment.appointment_date,

    patientName:
      appointment.guest_name,

    clinic:
      appointment.branch_id,

    associate:
      appointment.dentist_id,

    reason:
      appointment.reason_for_visit,

    status:
      appointment.status === "cancelled" &&
      appointment.rejection_reason
        ? "rejected"
        : appointment.status
  })
);

    const groupedProcedures = {};

    services.forEach(service =>
{
  // Exclude procedures that were not performed
  if (service.service_status !== "performed") {
    return;
  }

  const appointment =
    filteredAppointments.find(
      appointment =>
        appointment.id ===
        service.appointment_id
    );

  if (!appointment) {
    return;
  }

      if(
        !groupedProcedures[
          service.appointment_id
        ]
      )
      {
        groupedProcedures[
          service.appointment_id
        ] =
        {
          date:
            appointment.appointment_date,

          patientName:
            appointment.guest_name,

          clinic:
            appointment.branch_id,

          procedures: [],

          totalBill: 0,

          totalPaid:
            appointment.amount_paid || 0
        };
      }

      groupedProcedures[
        service.appointment_id
      ].procedures.push(
        service.service_name
      );

      groupedProcedures[
        service.appointment_id
      ].totalBill +=
        Number(
          service.price || 0
        );
    });

    const patientProcedures =
      Object.values(
        groupedProcedures
      ).map(item => ({
        ...item,

        procedure:
          item.procedures.join(", ")
      }));

    const collections =
  filteredAppointments
    .filter(
  appointment =>
    Number(
      appointment.amount_paid || 0
    ) > 0
    &&
    !(
      appointment.status === "cancelled" &&
      appointment.rejection_reason
    )
    &&
    appointment.status !== "cancelled"
)
    .map(
      appointment => ({
        date:
          appointment.appointment_date,

        patient:
          appointment.guest_name,

        clinic:
          appointment.branch_id,

        paymentType:
          appointment.payment_method,

        amount:
          appointment.amount_paid,

        remarks:
          appointment.payment_status
      })
    );

    const outstandingBalances =
      filteredAppointments
        .filter(
  appointment =>
    Number(
      appointment.remaining_balance || 0
    ) > 0
    &&
    !(
      appointment.status === "cancelled" &&
      appointment.rejection_reason
    )
    &&
    appointment.status !== "cancelled"
)
        .map(
          appointment => ({
            date:
              appointment.appointment_date,

            patient:
              appointment.guest_name,

            totalBill:
              appointment.total_amount,

            amountPaid:
              appointment.amount_paid,

            balance:
              appointment.remaining_balance,

            status:
              appointment.payment_status
          })
        );

    const expenseRows =
    filteredExpenses.map(
    expense => ({
      date: expense.expense_date,
      clinic: expense.branch_id,
      description: expense.expense_name,
      type: expense.expense_type,
      category: expense.category,
      amount: expense.amount
    })
  );

    const billingAmount =
      filteredAppointments.reduce(
        (sum, appointment) =>
          sum +
          Number(
            appointment.total_amount || 0
          ),
        0
      );

    const collectionAmount =
  filteredAppointments
    .filter(
      appointment =>
        Number(
          appointment.amount_paid || 0
        ) > 0 &&
        !(
          appointment.status === "cancelled" &&
          appointment.rejection_reason
        ) &&
        appointment.status !== "cancelled"
    )
    .reduce(
      (sum, appointment) =>
        sum +
        Number(
          appointment.amount_paid || 0
        ),
      0
    );

    const expenseAmount =
      filteredExpenses
        .filter(
          expense =>
            expense.expense_type ===
            "expense"
        )
        .reduce(
          (sum, expense) =>
            sum +
            Number(
              expense.amount || 0
            ),
          0
        );

    const billAmount =
      filteredExpenses
        .filter(
          expense =>
            expense.expense_type ===
            "bill"
        )
        .reduce(
          (sum, expense) =>
            sum +
            Number(
              expense.amount || 0
            ),
          0
        );

    const income =
    {
      netIncome:
        collectionAmount -
        expenseAmount -
        billAmount,

      billingAmount,

      billingCount:
      filteredAppointments.length,

      expenseAmount,

      billAmount,

      expenseCount:
        filteredExpenses.filter(
          expense =>
            expense.expense_type ===
            "expense"
        ).length,

      billCount:
        filteredExpenses.filter(
          expense =>
            expense.expense_type ===
            "bill"
        ).length
    };

    return {
      success: true,
      stats,
      appointments: patientAppointments,
      procedures: patientProcedures,
      collections,
      outstandingBalances,
      expenses: expenseRows,
      income
    };
  }
  catch(error)
  {
    console.log(
      "DAILY REPORT ERROR:",
      error
    );

    set.status = 500;

    return {
      success: false,
      message:
        error.message
    };
  }
})

.get(
  "/monthly-summary",
  async ({ query, set }) =>
{
  try
  {
    const {
      month,
      year,
      clinic
    } = query;

    const startDate =
      `${year}-${String(month)
        .padStart(2,"0")}-01`;

    const endDate =
      new Date(
        Number(year),
        Number(month),
        0
      )
      .toISOString()
      .split("T")[0];

    const {
      data: appointments
    } =
      await supabase
        .from("appointments")
        .select("*")
        .gte(
          "appointment_date",
          startDate
        )
        .lte(
          "appointment_date",
          endDate
        );

    const validAppointments =
  (appointments || [])
    .filter(
      appointment =>
        !(
          appointment.status === "cancelled" &&
          appointment.rejection_reason
        )
    );

    let filteredAppointments =
      validAppointments;

    if(
      clinic &&
      clinic !== "All Clinics"
    )
    {
      filteredAppointments =
  filteredAppointments.filter(
    appointment =>
      (appointment.branch_id || "")
        .trim()
        .toLowerCase() ===
      clinic
        .trim()
        .toLowerCase()
  );
    }

    const {
      data: expenses
    } =
      await supabase
        .from("expenses")
        .select("*")
        .eq(
          "is_archived",
          false
        )
        .gte(
          "expense_date",
          startDate
        )
        .lte(
          "expense_date",
          endDate
        );

    let filteredExpenses =
      expenses || [];

    if(
      clinic &&
      clinic !== "All Clinics"
    )
    {
      filteredExpenses =
  filteredExpenses.filter(
    expense =>
      (expense.branch_id || "")
        .trim()
        .toLowerCase() ===
      clinic
        .trim()
        .toLowerCase()
  );
    }

    const billingAmount =
      filteredAppointments.reduce(
        (sum,a)=>
          sum +
          Number(
            a.total_amount || 0
          ),
        0
      );

    const collectionAmount =
  filteredAppointments
    .filter(
      appointment =>
        Number(
          appointment.amount_paid || 0
        ) > 0 &&
        !(
          appointment.status === "cancelled" &&
          appointment.rejection_reason
        ) &&
        appointment.status !== "cancelled"
    )
    .reduce(
      (sum, appointment) =>
        sum +
        Number(
          appointment.amount_paid || 0
        ),
      0
    );

    const expenseAmount =
      filteredExpenses
        .filter(
          expense =>
            expense.expense_type ===
            "expense"
        )
        .reduce(
          (sum,e)=>
            sum +
            Number(
              e.amount || 0
            ),
          0
        );

    const billAmount =
      filteredExpenses
        .filter(
          expense =>
            expense.expense_type ===
            "bill"
        )
        .reduce(
          (sum,e)=>
            sum +
            Number(
              e.amount || 0
            ),
          0
        );

    return {
      success: true,

      billingAmount,

      collectionAmount,

      expenseAmount,

      billAmount,

      expenseCount:
        filteredExpenses
          .filter(
            e =>
              e.expense_type ===
              "expense"
          ).length,

      billCount:
        filteredExpenses
          .filter(
            e =>
              e.expense_type ===
              "bill"
          ).length,

      operatingCost:
        expenseAmount +
        billAmount,

      netIncome:
        collectionAmount -
        expenseAmount -
        billAmount
    };
  }
  catch(error)
  {
    set.status = 500;

    return {
      success: false,
      message:
        error.message
    };
  }
});
