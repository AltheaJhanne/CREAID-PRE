import { Elysia } from "elysia";
import { supabase } from "../supabase.js";

export const profileRoutes =
new Elysia({
  prefix: "/profile"
})

/* =========================
   GET PROFILE
========================= */
.get("/:id",
async ({ params, set }) => {

  const { data, error } =
    await supabase
      .from("users")
      .select("*")
      .eq("id", params.id)
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
    user: data
  };
})

/* =========================
   UPDATE PROFILE
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
      message: error.message
    };
  }

  return {
    success: true
  };
});