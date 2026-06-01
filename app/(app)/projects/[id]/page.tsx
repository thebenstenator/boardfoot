import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProjectShell } from "@/components/project/ProjectShell";
import type { Project, LumberItem, HardwareItem, FinishItem, CutPart, ProjectLabor } from "@/types/bom";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: project },
    { data: lumberItems },
    { data: hardwareItems },
    { data: finishItems },
    { data: cutParts },
    { data: labor },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("lumber_items").select("*").eq("project_id", id).order("sort_order"),
    supabase.from("hardware_items").select("*").eq("project_id", id).order("sort_order"),
    supabase.from("finish_items").select("*").eq("project_id", id).order("sort_order"),
    supabase.from("cut_parts").select("*").eq("project_id", id).order("sort_order"),
    supabase.from("project_labor").select("*").eq("project_id", id).maybeSingle(),
  ]);

  if (!project) notFound();

  return (
    <ProjectShell
      projectId={id}
      userId={user.id}
      initialData={{
        project: project as Project,
        lumberItems: (lumberItems ?? []) as LumberItem[],
        hardwareItems: (hardwareItems ?? []) as HardwareItem[],
        finishItems: (finishItems ?? []) as FinishItem[],
        cutParts: (cutParts ?? []) as CutPart[],
        labor: (labor ?? null) as ProjectLabor | null,
      }}
    />
  );
}
