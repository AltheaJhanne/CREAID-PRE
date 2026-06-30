import { Elysia } from "elysia";
import { supabase } from "../supabase.js";

export const servicesRoutes =
new Elysia({
  prefix: "/services"
})

.get("/",
async () => {

  const { data, error } =
    await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("name");

  return {
    success: !error,
    services: data || []
  };
});