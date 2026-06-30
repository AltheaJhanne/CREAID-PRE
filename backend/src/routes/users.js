import { Elysia } from "elysia";
import { supabase } from "../supabase.js";

const PAGE_SIZE = 5;

export const userRoutes = new Elysia({
  prefix: "/users"
})

/* =========================
   GET USERS
========================= */
.get("/", async ({ query, set }) => {

  console.log(
  "USERS QUERY:",
  query
);

const page =
  Number.isFinite(
    Number(query.page)
  )
    ? Number(query.page)
    : 1;

const noPagination =
  query.all === "true";

  const from =
    (page - 1) * PAGE_SIZE;

  const to =
    from + PAGE_SIZE - 1;

  let dbQuery = supabase
  .from("users")
  .select("*", {
    count: "exact"
  });

if(query.archived !== undefined)
{
  const archived =
    query.archived === "true";

  dbQuery =
    dbQuery.eq(
      "is_archived",
      archived
    );
}

  // NAME FILTER
  if(query.name)
{
  const searchName =
    query.name.trim();

  dbQuery =
    dbQuery.or(
      `first_name.ilike.%${searchName}%,middle_name.ilike.%${searchName}%,last_name.ilike.%${searchName}%`
    );
}

  // ROLE FILTER
  if (query.role) {

    dbQuery = dbQuery.ilike(
      "role",
      `%${query.role}%`
    );
  }

  // YEAR FILTER
  if (query.year) {

    dbQuery = dbQuery
      .gte(
        "created_at",
        `${query.year}-01-01`
      )
      .lte(
        "created_at",
        `${query.year}-12-31`
      );
  }

  /* Pagination */

if(!noPagination)
{
  dbQuery =
    dbQuery.range(
      from,
      to
    );
}

const {
  data,
  error,
  count
} =
await dbQuery;

  if (error) {

    set.status = 500;

    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    users: data || [],
    total: count ?? 0,
  };
})

/* =========================
   CREATE USER / PATIENT
========================= */
.post("/", async ({ body, set }) => {
  const { data, error } = await supabase
    .from("users")
    .insert([body])
    .select()
    .single();

    /* Attach Last Visit */

const {
  data: visits
} =
await supabase
  .from("appointments")
  .select(
    "appointment_date"
  )
  .eq(
    "patient_id",
    data.id
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

data.last_visit =
  visits?.[0]
    ?.appointment_date ||
  null;

  if (error) {
    set.status = 500;

    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    user: data,
  };
})

/* =========================
   ARCHIVE USER
========================= */
.patch("/:id/archive",
async ({ params, set }) => {

  const { error } =
    await supabase
      .from("users")
      .update({
        is_archived: true
      })
      .eq("id", params.id);

  if (error) {

    set.status = 500;

    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
})

/* =========================
   RESTORE USER
========================= */
.patch("/:id/restore",
async ({ params, set }) => {

  const { error } =
    await supabase
      .from("users")
      .update({
        is_archived: false
      })
      .eq("id", params.id);

  if (error) {

    set.status = 500;

    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
})

/* =========================
   UPDATE USER
========================= */
.patch("/:id",
async ({ params, body, set }) => {

  const { error } =
    await supabase
      .from("users")
      .update(body)
      .eq("id", params.id);

  if (error) {

    set.status = 500;

    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
})

.patch(
"/:id/schedule",
async ({ params, body, set }) =>
{
  console.log(
    "BODY RECEIVED:",
    body
  );

  const {
    workingHours,
    lunchBreak
  } = body;

  if(!workingHours)
  {
    set.status = 400;

    return {
      success: false,
      message: "workingHours missing"
    };
  }

  const {
    error: deleteLunchError
  } =
  await supabase
    .from("dentist_lunch_breaks")
    .delete()
    .eq(
      "dentist_id",
      params.id
    );

  if(deleteLunchError)
  {
    set.status = 500;

    return {
      success: false,
      message:
        deleteLunchError.message
    };
  }

  console.log(
  "LUNCH BREAK:",
  lunchBreak
);

const {
  error: insertLunchError
} =
await supabase
  .from("dentist_lunch_breaks")
  .insert([
    {
      dentist_id:
        params.id,

      lunch_start:
        `${lunchBreak.start}:00`,

      lunch_end:
        `${lunchBreak.end}:00`,

      applies_to:
        lunchBreak.applies_to
    }
  ]);

  if(insertLunchError)
  {
    set.status = 500;

    return {
      success: false,
      message:
        insertLunchError.message
    };
  }

  const {
    error: deleteHoursError
  } =
  await supabase
    .from("dentist_working_hours")
    .delete()
    .eq(
      "dentist_id",
      params.id
    );

  if(deleteHoursError)
  {
    set.status = 500;

    return {
      success: false,
      message:
        deleteHoursError.message
    };
  }

  const rows =
    Object.entries(
      workingHours
    ).map(
      ([day, value]) => ({
        dentist_id:
          params.id,

        day_name:
          day,

        start_time:
          value.start,

        end_time:
          value.end,

        is_off:
          value.is_off
      })
    );

  const {
    error: insertHoursError
  } =
  await supabase
    .from("dentist_working_hours")
    .insert(rows);

  if(insertHoursError)
  {
    set.status = 500;

    return {
      success: false,
      message:
        insertHoursError.message
    };
  }

  return {
    success:true
  };
})

.get(
"/:id/schedule",
async ({ params, set }) =>
{
  const {
    data: hours,
    error: hoursError
  } =
  await supabase
    .from(
      "dentist_working_hours"
    )
    .select("*")
    .eq(
      "dentist_id",
      params.id
    )
    .order(
      "id",
      {
        ascending:true
      }
    );

  const {
    data: lunch,
    error: lunchError
  } =
  await supabase
    .from(
      "dentist_lunch_breaks"
    )
    .select("*")
    .eq(
      "dentist_id",
      params.id
    )
    .maybeSingle();

  if(hoursError)
  {
    set.status = 500;

    return {
      success:false,
      message:
        hoursError.message
    };
  }

  if(lunchError)
  {
    set.status = 500;

    return {
      success:false,
      message:
        lunchError.message
    };
  }

  const {
  data: leaves,
  error: leaveError
} =
await supabase
  .from(
    "dentist_leave_requests"
  )
  .select(
    "leave_from, leave_to"
  )
  .eq(
    "dentist_id",
    params.id
  )
  .eq(
  "status",
  "approved"
);

if(leaveError)
{
  set.status = 500;

  return {
    success:false,
    message:
      leaveError.message
  };
}

return {
  success:true,

  hours:
    hours || [],

  lunch:
    lunch || null,

  leaves:
    leaves || []
};

console.log(
  "LEAVES:",
  leaves
);
});