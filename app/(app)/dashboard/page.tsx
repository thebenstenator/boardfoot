import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import type { Project } from "@/types/bom";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: projects },
  ] = await Promise.all([
    supabase.from("profiles").select("has_seen_demo, subscription_tier").eq("id", user.id).single(),
    supabase.from("projects").select("*").eq("status", "active").order("updated_at", { ascending: false }),
  ]);

  return (
    <Suspense>
      <DashboardContent
        initialProjects={(projects ?? []) as Project[]}
        tier={(profile?.subscription_tier ?? "free") as "free" | "pro"}
        needsDemoSeed={!profile?.has_seen_demo}
      />
    </Suspense>
  );
}
