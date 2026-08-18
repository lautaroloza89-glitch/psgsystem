import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";

export async function getCurrentUserProfile(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, nombre, rol, created_at")
    .eq("id", authUser.id)
    .single();

  return profile as User | null;
}
