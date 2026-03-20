import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import { BomDocument } from "@/lib/pdf/BomDocument";
import { calculateProjectTotals } from "@/lib/calculations/projectTotals";
import { NextResponse } from "next/server";
import type {
  LumberItem,
  HardwareItem,
  FinishItem,
  ProjectLabor,
  UserProfile,
  Project,
} from "@/types/bom";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch project
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const isPro = profile.subscription_tier === "pro";

  // Fetch all line items
  const [
    { data: lumberItems },
    { data: hardwareItems },
    { data: finishItems },
    { data: labor },
  ] = await Promise.all([
    supabase
      .from("lumber_items")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order"),
    supabase
      .from("hardware_items")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order"),
    supabase
      .from("finish_items")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order"),
    supabase
      .from("project_labor")
      .select("*")
      .eq("project_id", projectId)
      .single(),
  ]);

  const totals = calculateProjectTotals(
    (lumberItems ?? []) as LumberItem[],
    (hardwareItems ?? []) as HardwareItem[],
    (finishItems ?? []) as FinishItem[],
    (labor ?? null) as ProjectLabor | null,
    profile as UserProfile,
    project.waste_factor,
  );

  const pdfBuffer = await renderToBuffer(
    BomDocument({
      project: project as Project,
      lumberItems: (lumberItems ?? []) as LumberItem[],
      hardwareItems: (hardwareItems ?? []) as HardwareItem[],
      finishItems: (finishItems ?? []) as FinishItem[],
      labor: (labor ?? null) as ProjectLabor | null,
      profile: profile as UserProfile,
      totals,
      isPro,
    }),
  );

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${project.name}.pdf"`,
    },
  });
}
