import { Elysia } from "elysia";
import { supabase } from "../supabase.js";
import {
  logActivity
} from "../utils/logActivity.js";

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
.post("/", async ({ body, set }) =>
{
  const {
    user,
    guardian,
    medical
  } = body;

  /* -----------------------
     CREATE USER
  ----------------------- */

  const {
    data: createdUser,
    error: userError
  } =
  await supabase
    .from("users")
    .insert([user])
    .select()
    .single();

  if(userError)
  {
    set.status = 500;

    return {
      success:false,
      message:userError.message
    };
  }

  /* -----------------------
     CREATE GUARDIAN
  ----------------------- */

  if(guardian)
  {
    const {
      error: guardianError
    } =
    await supabase
      .from("patient_guardians")
      .insert([
        {
          patient_id:
            createdUser.id,

          ...guardian
        }
      ]);

    if(guardianError)
    {
      set.status = 500;

      return {
        success:false,
        message:guardianError.message
      };
    }
  }

  /* -----------------------
     CREATE MEDICAL
  ----------------------- */

  if(medical)
  {
    const {
      error: medicalError
    } =
    await supabase
      .from("patient_medical_records")
      .insert([
        {
          patient_id:
            createdUser.id,

          ...medical,

          last_dental_visit:
            medical.last_dental_visit || null
        }
      ]);

    if(medicalError)
    {
      set.status = 500;

      return {
        success:false,
        message:medicalError.message
      };
    }
  }

  return {
    success:true,
    user:createdUser
  };
})

/* =========================
   ARCHIVE USER
========================= */
.patch("/:id/archive",
async ({ params, body, set }) => {

  const { error } =
    await supabase
      .from("users")
      .update({
        is_archived: true
      })
      .eq("id", params.id);

      const {
  data: archivedUser
} =
await supabase
  .from("users")
  .select("first_name,last_name")
  .eq(
    "id",
    params.id
  )
  .single();

await logActivity({

  user:
    body.performed_by,

  action:
    "Archive User",

  description:
    `Archived ${archivedUser.first_name} ${archivedUser.last_name}.`

});

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
async ({ params, body, set }) => {

  const { error } =
    await supabase
      .from("users")
      .update({
        is_archived: false
      })
      .eq("id", params.id);

      const {
  data: restoredUser
} =
await supabase
  .from("users")
  .select("first_name,last_name")
  .eq(
    "id",
    params.id
  )
  .single();

await logActivity({

  user:
    body.performed_by,

  action:
    "Restore User",

  description:
    `Restored ${restoredUser.first_name} ${restoredUser.last_name}.`

});

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
async ({ params, body, set }) =>
{
  const {
    performed_by,
    user,
    guardian,
    medical
  } = body;

  /* -------------------------
     UPDATE USER
  ------------------------- */

  const {
    error: userError
  } =
  await supabase
    .from("users")
    .update({
    ...user,

    birthdate:
      user.birthdate || null
  })
    .eq("id", params.id);

  if(userError)
  {
    set.status = 500;

    return {
      success:false,
      message:userError.message
    };
  }

  /* -------------------------
     UPDATE GUARDIAN
  ------------------------- */

  if(guardian)
  {
    const {
      data: existingGuardian
    } =
    await supabase
      .from("patient_guardians")
      .select("id")
      .eq("patient_id", params.id)
      .maybeSingle();

    if(existingGuardian)
    {
      const {
        error
      } =
      await supabase
        .from("patient_guardians")
        .update(guardian)
        .eq("patient_id", params.id);

      if(error)
      {
        set.status = 500;

        return {
          success:false,
          message:error.message
        };
      }
    }
    else
    {
      const {
        error
      } =
      await supabase
        .from("patient_guardians")
        .insert([
          {
            ...guardian,
            patient_id: params.id
          }
        ]);

      if(error)
      {
        set.status = 500;

        return {
          success:false,
          message:error.message
        };
      }
    }
  }

  /* -------------------------
     UPDATE MEDICAL
  ------------------------- */

  if(medical)
  {
    const {
      data: existingMedical
    } =
    await supabase
      .from("patient_medical_records")
      .select("id")
      .eq("patient_id", params.id)
      .maybeSingle();

    if(existingMedical)
    {
      const {
        error
      } =
      await supabase
        .from("patient_medical_records")
        .update({
        ...medical,

        last_dental_visit:
          medical.last_dental_visit || null
      })
        .eq("patient_id", params.id);

      if(error)
      {
        set.status = 500;

        return {
          success:false,
          message:error.message
        };
      }
    }
    else
    {
      const {
        error
      } =
      await supabase
        .from("patient_medical_records")
        .insert([
  {
    ...medical,

    last_dental_visit:
      medical.last_dental_visit || null,

    patient_id: params.id
  }
]);

      if(error)
      {
        set.status = 500;

        return {
          success:false,
          message:error.message
        };
      }
    }
  }

  const {
    data: updatedUser
  } =
  await supabase
    .from("users")
    .select("first_name,last_name")
    .eq("id", params.id)
    .single();

  await logActivity({
    user: performed_by,

    action: "Update User",

    description:
      `Updated profile of ${updatedUser.first_name} ${updatedUser.last_name}.`
  });

  return {
    success:true
  };
})

.patch(
  "/:id/presence",
  async ({ params, body, set }) =>
  {
    console.log("========== PRESENCE UPDATE ==========");
    console.log("User ID:", params.id);
    console.log("Request Body:", body);

    const {
      data: updatedRows,
      error
    } =
    await supabase
      .from("users")
      .update({
        is_online: body.is_online,
        last_seen_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select();

    console.log("UPDATED ROW:", updatedRows);
    console.log("UPDATE ERROR:", error);

    const {
      data: currentUser,
      error: checkError
    } =
    await supabase
      .from("users")
      .select("id, first_name, is_online, last_seen_at")
      .eq("id", params.id)
      .single();

    console.log("DATABASE VALUE:", currentUser);
    console.log("CHECK ERROR:", checkError);
    console.log("====================================");

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
      user: currentUser
    };
  }
)

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
})

.get(
"/logs",
async ({ set }) =>
{
  const {
    data,
    error
  } =
  await supabase
    .from("user_logs")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
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
    logs:
      data || []
  };
})

.get("/:id/full", async ({ params, set }) =>
{
  /* -------------------------
     USER
  -------------------------- */

  const {
    data: user,
    error: userError
  } =
  await supabase
    .from("users")
    .select("*")
    .eq("id", params.id)
    .single();

  if(userError)
  {
    set.status = 404;

    return {
      success:false,
      message:userError.message
    };
  }

  /* -------------------------
     GUARDIAN
  -------------------------- */

  const {
    data: guardian
  } =
  await supabase
    .from("patient_guardians")
    .select("*")
    .eq("patient_id", params.id)
    .maybeSingle();

  /* -------------------------
     MEDICAL
  -------------------------- */

  const {
    data: medical
  } =
  await supabase
    .from("patient_medical_records")
    .select("*")
    .eq("patient_id", params.id)
    .maybeSingle();

  return {
    success:true,
    user,
    guardian,
    medical
  };
});