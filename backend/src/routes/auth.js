import { Elysia } from "elysia";
import { supabase } from "../supabase.js";
import {
  logActivity
} from "../utils/logActivity.js";

export const authRoutes =
  new Elysia({
    prefix: "/auth"
  })

.post("/login",
async ({ body, set }) => {

  const {
    email,
    password
  } = body;

  // LOGIN
  const {
    data,
    error
  } =
    await supabase.auth
      .signInWithPassword({
        email,
        password
      });

  if (error) {

    set.status = 401;

    return {
      success: false,
      message: error.message,
    };
  }

  // GET USER
  const {
    data: userData,
    error: userError
  } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (userError || !userData) {

    set.status = 404;

    return {
      success: false,
      message:
        "User profile not found",
    };
  }

  // BLOCK ARCHIVED USERS
  if (userData.is_archived) {

    set.status = 403;

    return {
      success: false,
      message:
        "Account archived",
    };
  }

  /* UPDATE ONLINE STATUS */

const {
  error: presenceError
} =
await supabase
  .from("users")
  .update({
    is_online: true,
    last_seen_at: new Date().toISOString()
  })
  .eq("id", userData.id);

if(presenceError)
{
  console.error(
    "Presence update failed:",
    presenceError
  );
}

  await logActivity({

  user:
    userData,

  action:
    "Login",

  description:
    "Logged into the system."

});

  return {
    success: true,

    user: userData,

    session:
      data.session,
  };
});