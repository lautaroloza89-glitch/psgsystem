import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";

export default async function Home() {
  const profile = await getCurrentUserProfile();
  redirect(profile ? "/dashboard" : "/login");
}
