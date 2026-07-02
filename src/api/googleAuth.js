import { supabase } from "../lib/supabase";

export async function signInWithGoogle()
{
  const { error } =
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          window.location.origin +
          "/appointment"
      }
    });

  if(error)
  {
    throw error;
  }
}

export async function getGoogleSession()
{
  const {
    data: { session }
  } =
    await supabase.auth.getSession();

  return session;
}

export async function signOutGoogle()
{
  await supabase.auth.signOut();
}