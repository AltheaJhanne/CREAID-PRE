import { Elysia } from "elysia";
import { supabase } from "../supabase.js";

export const patientRoutes =
new Elysia({
  prefix: "/patients"
})

/* GET ALL PATIENTS */
.get("/", async ({ set }) =>
{
  /* REGISTERED PATIENTS */
  const {
    data: users,
    error: usersError
  } = await supabase
    .from("users")
    .select("*")
    .eq("role", "patient")
    .eq("is_archived", false)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if(usersError)
  {
    set.status = 500;

    return {
      success: false,
      message: usersError.message
    };
  }

  /* GUEST PATIENTS */
  const {
    data: guests,
    error: guestsError
  } = await supabase
    .from("appointments")
    .select(`
      guest_name,
      guest_email,
      guest_contact
    `)
    .not(
      "guest_name",
      "is",
      null
    );

  if(guestsError)
  {
    set.status = 500;

    return {
      success: false,
      message: guestsError.message
    };
  }

  /* REMOVE DUPLICATES */
  const uniqueGuests =
    Object.values(
      (guests || []).reduce(
        (acc, guest) =>
        {
          const key =
            guest.guest_email ||
            guest.guest_contact ||
            guest.guest_name;

          acc[key] = guest;

          return acc;
        },
        {}
      )
    );

  /* FORMAT GUESTS TO MATCH USERS */
  const guestPatients =
    uniqueGuests.map(
      (guest) =>
      {
        const parts =
          (
            guest.guest_name ||
            ""
          ).split(" ");

        return {
          id:
    guest.guest_email
    ? `guest-email-${guest.guest_email}`
    : `guest-contact-${guest.guest_contact}`,

          first_name:
            parts[0] || "",

          last_name:
            parts
              .slice(1)
              .join(" "),

          email:
            guest.guest_email || "",

          contact_number:
            guest.guest_contact || "",

          role: "guest",

          is_guest: true,

          is_archived: false,

          created_at: null
        };
      }
    );

  const patients =
  [
    ...(users || []),
    ...guestPatients
  ];

  console.log(
    "REGISTERED:",
    users?.length
  );

  console.log(
    "GUESTS:",
    guestPatients.length
  );

  console.log(
    "TOTAL:",
    patients.length
  );

  return {
  success: true,
  patients
};
})



/* GET ONE PATIENT WITH RECORDS */
.get("/:id", async ({ params, set }) => {

  const { data: patient, error: patientError } =
    await supabase
      .from("users")
      .select("*")
      .eq("id", params.id)
      .single();

  if (patientError) {
    set.status = 500;

    return {
      success: false,
      message: patientError.message
    };
  }

  const { data: records, error: recordsError } =
    await supabase
      .from("patient_records")
      .select(`
        *,
        dentist:dentist_id (
          id,
          full_name,
          first_name,
          last_name
        )
      `)
      .eq("patient_id", params.id)
      .order("record_date", {
        ascending: false
      });

  if (recordsError) {
    set.status = 500;

    return {
      success: false,
      message: recordsError.message
    };
  }

  return {
    success: true,
    patient,
    records: records || []
  };
})

/* ADD TREATMENT RECORD */
.post("/:id/records", async ({ params, body, set }) => {

  const { data, error } =
    await supabase
      .from("patient_records")
      .insert([
        {
          patient_id: params.id,
          dentist_id: body.dentist_id || null,
          treatment_name: body.treatment_name,
          diagnosis: body.diagnosis,
          prescription: body.prescription,
          notes: body.notes,
          record_date: body.record_date
        }
      ])
      .select()
      .single();

  if (error) {
    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  return {
    success: true,
    record: data
  };
})

.get(
"/:id/records",
async ({ params, set }) =>
{
  if(
    params.id.startsWith("guest-")
  )
  {
    return {
      success: true,
      records: []
    };
  }

  const {
    data,
    error
  } =
  await supabase
    .from("patient_records")
    .select("*")
    .eq(
      "patient_id",
      params.id
    )
    .order(
      "record_date",
      {
        ascending: false
      }
    );

  if(error)
  {
    console.error(error);

    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  return {
    success: true,
    records: data || []
  };
})

.get(
"/:id/notes",
async ({ params, set }) =>
{
  const {
    data,
    error
  } =
  await supabase
    .from("patient_notes")
    .select("note")
    .eq(
      "patient_id",
      params.id
    )
    .maybeSingle();

  if(error)
  {
    set.status = 500;

    return {
      success:false,
      message:error.message
    };
  }

  return {
    success:true,
    note:data?.note || ""
  };
})

.post(
"/:id/notes",
async ({ params, body, set }) =>
{
  const { note } = body;

  const {
    data: existing
  } =
  await supabase
    .from("patient_notes")
    .select("id")
    .eq(
      "patient_id",
      params.id
    )
    .maybeSingle();

  let result;
  let error;

  if(existing)
  {
    ({
      data: result,
      error
    } =
      await supabase
        .from("patient_notes")
        .update({
          note,
          updated_at:
            new Date()
        })
        .eq(
          "id",
          existing.id
        )
        .select()
        .single());
  }
  else
  {
    ({
      data: result,
      error
    } =
      await supabase
        .from("patient_notes")
        .insert([
  {
    patient_id:
      params.id,

    dentist_id:
      null,

    note
  }
])
        .select()
        .single());
  }

  if(error)
  {
    set.status = 500;

    return {
      success:false,
      message:error.message
    };
  }

  return {
    success:true,
    note:result.note
  };
});