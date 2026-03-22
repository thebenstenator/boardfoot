import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ShoppingListDocument } from "@/lib/pdf/ShoppingListDocument";
import { buildShoppingList } from "@/lib/calculations/shoppingList";
import { NextResponse } from "next/server";
import type {
  LumberItem,
  HardwareItem,
  FinishItem,
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

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const isPro = profile?.subscription_tier === "pro";

  const [
    { data: lumberItems },
    { data: hardwareItems },
    { data: finishItems },
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
  ]);

  const shoppingList = buildShoppingList(
    (lumberItems ?? []) as LumberItem[],
    (hardwareItems ?? []) as HardwareItem[],
    (finishItems ?? []) as FinishItem[],
    project.waste_factor,
  );

  const pdfBuffer = await renderToBuffer(
    ShoppingListDocument({
      project: project as Project,
      shoppingList,
      isPro,
    }),
  );

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${project.name}-shopping-list.pdf"`,
    },
  });
}
