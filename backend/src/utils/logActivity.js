import { supabase } from "../supabase.js";

export async function logActivity({
  user,
  action,
  description
})
{
  if(!user)
  {
    console.log(
      "No user supplied for log."
    );

    return;
  }

  const { error } =
    await supabase
      .from("user_logs")
      .insert([
        {
          user_id:
            user.id,

          user_name:
            `${user.first_name} ${user.last_name}`,

          role:
            user.role,

          action,

          description
        }
      ]);

  if(error)
  {
    console.error(
      "LOG ERROR:",
      error
    );
  }
}