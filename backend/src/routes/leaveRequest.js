import { Elysia } from "elysia";
import { supabase } from "../supabase.js";
import { logActivity } from "../utils/logActivity.js";


export const leaveRequestRoutes = new Elysia({
  prefix: "/leave-requests"
})

.post(
"/dentists/:dentistId/leave-request",
async ({ params, body, set }) =>
{
  const {
    leave_type,
    leave_from,
    leave_to,
    reason
  } = body;

  const {
    data,
    error
  } =
  await supabase
    .from(
      "dentist_leave_requests"
    )
    .insert([
      {
        dentist_id:
          params.dentistId,

        leave_type,
        leave_from,
        leave_to,
        reason,

        status:
          "pending"
      }
    ])
    .select()
    .single();

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
    request: data
  };
})

.get(
"/dentists/:dentistId/leave-requests",
async ({ params, set }) =>
{
  const {
    data,
    error
  } =
  await supabase
    .from(
      "dentist_leave_requests"
    )
    .select("*")
    .eq(
      "dentist_id",
      params.dentistId
    )
    .order(
  "leave_from",
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
    requests:
      data || []
  };
})
.patch(
"/:id",
async ({ params, body, set }) =>
{
  const {
  status,
  staff_note,
  performed_by
} = body;

  const normalizedStatus =
    status.toLowerCase();

  const {
    data,
    error
  } =
  await supabase
    .from("dentist_leave_requests")
    .update({
      status: normalizedStatus,
      staff_note
    })
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

  const {
  data: dentist
} =
await supabase
  .from("users")
  .select("first_name,last_name")
  .eq("id", data.dentist_id)
  .single();

const dentistName =
  dentist
    ? `Dr. ${dentist.first_name} ${dentist.last_name}`
    : "Unknown Dentist";

await logActivity({

  user:
    performed_by,

  action:
    normalizedStatus === "approved"
      ? "Approve Leave"
      : "Decline Leave",

  description:
    `${
      normalizedStatus === "approved"
        ? "Approved"
        : "Declined"
    } leave request of ${dentistName}.`

});

  return {
    success:true,
    request:data
  };
})
