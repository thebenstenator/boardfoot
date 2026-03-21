"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates/templates";
import { Button } from "@/components/ui/button";

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cloning, setCloningId] = useState<string | null>(null);

  const filtered =
    selectedCategory === "All"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  async function handleClone(templateId: string) {
    setCloningId(templateId);
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Create project
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: template.name,
        waste_factor: template.wasteFactor,
      })
      .select()
      .single();

    if (error || !project) {
      console.error("Failed to create project:", error);
      setCloningId(null);
      return;
    }

    // Insert lumber items
    if (template.lumberItems.length > 0) {
      await supabase.from("lumber_items").insert(
        template.lumberItems.map((item, i) => ({
          project_id: project.id,
          ...item,
          sort_order: i,
        })),
      );
    }

    // Insert hardware items
    if (template.hardwareItems.length > 0) {
      await supabase.from("hardware_items").insert(
        template.hardwareItems.map((item, i) => ({
          project_id: project.id,
          ...item,
          sort_order: i,
        })),
      );
    }

    // Insert finish items
    if (template.finishItems.length > 0) {
      await supabase.from("finish_items").insert(
        template.finishItems.map((item, i) => ({
          project_id: project.id,
          ...item,
          sort_order: i,
        })),
      );
    }

    router.push(`/projects/${project.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start from a pre-built BOM and customize it for your project.
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {["All", ...TEMPLATE_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`cursor-pointer text-sm px-3 py-1 rounded-full border transition-colors
              ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-accent border-border"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="border rounded-lg p-4 space-y-3 hover:bg-accent/30 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{template.name}</h3>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full shrink-0">
                  {template.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {template.description}
              </p>
            </div>

            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                {template.lumberItems.length} lumber{" "}
                {template.lumberItems.length === 1 ? "item" : "items"}
              </p>
              <p>
                {template.hardwareItems.length} hardware{" "}
                {template.hardwareItems.length === 1 ? "item" : "items"}
              </p>
              <p>
                {template.finishItems.length} consumable{" "}
                {template.finishItems.length === 1 ? "item" : "items"}
              </p>
              <p>{Math.round(template.wasteFactor * 100)}% waste factor</p>
            </div>

            <Button
              size="sm"
              className="w-full cursor-pointer"
              onClick={() => handleClone(template.id)}
              disabled={cloning === template.id}
            >
              {cloning === template.id ? "Creating..." : "Use this template"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
