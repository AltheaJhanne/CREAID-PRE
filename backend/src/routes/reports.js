import { Elysia } from "elysia";
import { supabase } from "../supabase.js";

export const reportsRoutes =
new Elysia({
  prefix: "/reports"
})

.get("/summary",
async ({ query, set }) =>
{
  const {
    clinic,
    from,
    to
  } = query;

  let dbQuery =
    supabase
      .from("appointments")
      .select(`
  id,
  patient_id,
  status,
  payment_status,
  payment_method,
  total_amount,
  amount_paid,
  remaining_balance,
  appointment_date,
  branch_id
`)

  if (
    clinic &&
    clinic !== "All"
  )
  {
    dbQuery =
      dbQuery.eq(
        "branch_id",
        clinic
      );
  }

  if (from)
  {
    dbQuery =
      dbQuery.gte(
        "appointment_date",
        from
      );
  }

  if (to)
  {
    dbQuery =
      dbQuery.lte(
        "appointment_date",
        to
      );
  }

  const {
    data,
    error
  } = await dbQuery;

  let expensesQuery =
  supabase
    .from("expenses")
    .select("*")
    .eq(
      "is_archived",
      false
    );

if (
  clinic &&
  clinic !== "All"
)
{
  expensesQuery =
    expensesQuery.eq(
      "branch_id",
      clinic
    );
}

if (from)
{
  expensesQuery =
    expensesQuery.gte(
      "expense_date",
      from
    );
}

if (to)
{
  expensesQuery =
    expensesQuery.lte(
      "expense_date",
      to
    );
}

const {
  data: expensesData,
  error: expensesError
} =
  await expensesQuery;

if(expensesError)
{
  set.status = 500;

  return {
    success: false,
    message:
      expensesError.message
  };
}

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  const validAppointments =
    data.filter(
      appointment =>
        appointment.status !==
        "rejected"
    );

  const collectionAmount =
  validAppointments
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
    .reduce(
      (sum, appointment) =>
        sum +
        Number(
          appointment.amount_paid || 0
        ),
      0
    );

  const collectionCount =
  validAppointments.filter(
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
  ).length;

  const completedRevenue =
  validAppointments
    .filter(
      appointment =>
        appointment.status === "completed"
    )
    .reduce(
      (sum, appointment) =>
        sum +
        Number(
          appointment.total_amount || 0
        ),
      0
    );

const noShowRevenue =
  validAppointments
    .filter(
      appointment =>
        appointment.status === "no_show"
    )
    .reduce(
      (sum, appointment) =>
        sum +
        Number(
          appointment.amount_paid || 0
        ),
      0
    );

  const pendingBalance =
  validAppointments
    .filter(
      appointment =>
        (
          appointment.status === "scheduled" ||
          appointment.status === "completed"
        )
        &&
        Number(
          appointment.remaining_balance || 0
        ) > 0
    )
    .reduce(
      (sum, appointment) =>
        sum +
        Number(
          appointment.remaining_balance || 0
        ),
      0
    );

  const pendingCount =
  validAppointments.filter(
    appointment =>
      (
        appointment.status === "scheduled" ||
        appointment.status === "completed"
      )
      &&
      Number(
        appointment.remaining_balance || 0
      ) > 0
  ).length;

  const rejectedCount =
    data.filter(
      appointment =>
        appointment.status ===
        "rejected"
    ).length;

  const expenseAmount =
  (expensesData || [])
    .filter(
      expense =>
        expense.expense_type ===
        "expense"
    )
    .reduce(
      (sum, expense) =>
        sum +
        Number(expense.amount || 0),
      0
    );

const billAmount =
  (expensesData || [])
    .filter(
      expense =>
        expense.expense_type ===
        "bill"
    )
    .reduce(
      (sum, expense) =>
        sum +
        Number(expense.amount || 0),
      0
    );

const patientTypes =
{
  guest:
    validAppointments.filter(
      appointment =>
        !appointment.patient_id
    ).length,

  registered:
    validAppointments.filter(
      appointment =>
        appointment.patient_id
    ).length
};

const paymentMethods = {};

validAppointments.forEach(
  appointment =>
  {
    const method =
      appointment.payment_method ||
      "Unknown";

    paymentMethods[method] =
      (paymentMethods[method] || 0) + 1;
  }
);

const expenseCategories = {};

(expensesData || []).forEach(
  expense =>
  {
    const category =
      expense.category ||
      "Other";

    expenseCategories[category] =
      (expenseCategories[category] || 0) +
      Number(expense.amount || 0);
  }
);

  return {
  success: true,

  completedRevenue:
  completedRevenue +
  noShowRevenue,

  summary: {
    collectionAmount,
    collectionCount,
    completedRevenue,
    pendingBalance,
    pendingCount,
    rejectedCount,

    expenseAmount,
    billAmount,

    netIncome:
      collectionAmount -
      expenseAmount -
      billAmount
  },

  charts: {
    patientTypes: [
      {
        name: "Guest",
        value: patientTypes.guest
      },
      {
        name: "Registered",
        value: patientTypes.registered
      }
    ],

    paymentMethods:
      Object.entries(paymentMethods)
        .map(([name, value]) => ({
          name,
          value
        })),

    expenseCategories:
      Object.entries(expenseCategories)
        .map(([name, value]) => ({
          name,
          value
        }))
  }
};
})

.get("/collections",
async ({ query, set }) =>
{
  try
  {
    const {
      clinic,
      paymentType,
      from,
      to,
      patient
    } = query;

    console.log(
  "CLINIC:",
  clinic
);

console.log(
  "PAYMENT TYPE:",
  paymentType
);

console.log(
  "FROM:",
  from
);

console.log(
  "TO:",
  to
);

console.log(
  "PATIENT:",
  patient
);

    let queryBuilder =
  supabase
    .from("appointments")
    .select(`
      id,
      guest_name,
      branch_id,
      appointment_date,
      payment_method,
      payment_status,
      amount_paid,
      status
    `)
    .gt(
      "amount_paid",
      0
    )
    .not(
      "status",
      "in",
      "(cancelled,rejected)"
    );

    if(
      clinic &&
      clinic !== "All Clinics"
    )
    {
      queryBuilder =
        queryBuilder.eq(
          "branch_id",
          clinic
        );
    }

    if(
  paymentType &&
  paymentType !== "All Payment Types"
)
{
  queryBuilder =
    queryBuilder.eq(
      "payment_method",
      paymentType.toLowerCase()
    );
}

    if(from)
    {
      queryBuilder =
        queryBuilder.gte(
          "appointment_date",
          from
        );
    }

    if(to)
    {
      queryBuilder =
        queryBuilder.lte(
          "appointment_date",
          to
        );
    }

    const {
      data,
      error
    } =
      await queryBuilder.order(
        "appointment_date",
        {
          ascending: false
        }
      );

    if(error)
    {
      set.status = 500;

      return {
        success: false,
        message: error.message
      };
    }

    let collections =
      (data || [])
        .map(item => ({
          date:
            item.appointment_date,

          patient:
            item.guest_name || "Guest",

          clinic:
            item.branch_id || "-",

          referenceNo:
            item.id,

          paymentType:
            item.payment_method || "-",

          amount:
            Number(
              item.amount_paid || 0
            ),

          remarks:
            item.payment_status || "-"
        }));

    if(patient)
    {
      collections =
        collections.filter(row =>
          row.patient
            .toLowerCase()
            .includes(
              patient.toLowerCase()
            )
        );
    }

    const totalAmount =
      collections.reduce(
        (sum, row) =>
          sum + Number(
            row.amount || 0
          ),
        0
      );

    return {
      success: true,
      collections,
      totalAmount,
      rowsCount:
        collections.length
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
})

.get("/appointments",
async ({ query, set }) =>
{
  try
  {
    const {
      clinic,
      status,
      from,
      to,
      patient
    } = query;

    let queryBuilder =
      supabase
        .from("appointments")
        .select(`
        id,
        guest_name,
        branch_id,
        appointment_date,
        appointment_time,
        dentist_id,
        reason_for_visit,
        status,
        rejection_reason
`);

    if(
      clinic &&
      clinic !== "All Clinics"
    )
    {
      queryBuilder =
        queryBuilder.eq(
          "branch_id",
          clinic
        );
    }

    if(
      status &&
      status !== "All"
    )
    {
      queryBuilder =
        queryBuilder.eq(
          "status",
          status.toLowerCase()
        );
    }

    if(from)
    {
      queryBuilder =
        queryBuilder.gte(
          "appointment_date",
          from
        );
    }

    if(to)
    {
      queryBuilder =
        queryBuilder.lte(
          "appointment_date",
          to
        );
    }

    const {
      data,
      error
    } =
      await queryBuilder.order(
        "appointment_date",
        {
          ascending: false
        }
      );

    if(error)
    {
      set.status = 500;

      return {
        success: false,
        message: error.message
      };
    }

    let appointments =
      (data || []).map(item => ({
        dateTime:
          `${item.appointment_date || ""} ${item.appointment_time || ""}`,

        patient:
          item.guest_name || "Guest",

        clinic:
          item.branch_id || "-",

        associate:
          item.dentist_id || "-",

        reason:
          item.reason_for_visit || "-",

        status:
        item.status === "cancelled" &&
        item.rejection_reason
        ? "rejected"
        : item.status
    }));

    if(patient)
    {
      appointments =
        appointments.filter(row =>
          row.patient
            .toLowerCase()
            .includes(
              patient.toLowerCase()
            )
        );
    }

    return {
      success: true,
      appointments,
      rowsCount:
        appointments.length
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

