"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { createClient } from "@/lib/supabase/client";
import { LumberSection } from "@/components/bom/LumberSection";
import { HardwareSection } from "@/components/bom/HardwareSection";
import { FinishSection } from "@/components/bom/FinishSection";
import { CostSummary } from "@/components/bom/CostSummary";
import { ExportButton } from "@/components/bom/ExportButton";
import { LaborSection } from "@/components/bom/LaborSection";
import { ShoppingListButton } from "@/components/bom/ShoppingListbutton";
import { PhotoGallery } from "@/components/project/PhotoGallery";

interface ProjectShellProps {
  projectId: string;
  userId: string;
}

export function ProjectShell({ projectId, userId }: ProjectShellProps) {
  const { loadProject, project, isLoading, setProject } = useProjectStore();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [surfaceDraft, setSurfaceDraft] = useState<string>('');

  useEffect(() => {
    loadProject(projectId);
  }, [projectId, loadProject]);

  useEffect(() => {
    setSurfaceDraft(String(project?.surface_area_sqft ?? ''));
  }, [project]);

  async function handleSurfaceSave() {
    if (!project) return;
    const parsed = parseFloat(surfaceDraft) || null;
    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .update({ surface_area_sqft: parsed })
      .eq("id", projectId);
    if (!error) {
      setProject({ ...project, surface_area_sqft: parsed });
    }
  }

  async function handleNameSave() {
    if (!project || !nameDraft.trim()) {
      setEditingName(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .update({ name: nameDraft.trim() })
      .eq("id", projectId)
      .select()
      .single();

    if (!error && data) {
      setProject({ ...project, name: data.name });
    }

    setEditingName(false);
  }

  if (isLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Loading project...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Project not found.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Project name + export button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          {editingName ? (
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSave();
                if (e.key === "Escape") setEditingName(false);
              }}
              autoFocus
              className="text-2xl font-bold bg-transparent border-b border-ring focus:outline-none flex-1"
            />
          ) : (
            <h1
              onClick={() => {
                setNameDraft(project.name);
                setEditingName(true);
              }}
              className="text-2xl font-bold cursor-text hover:opacity-70 transition-opacity"
              title="Click to rename"
            >
              {project.name}
            </h1>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <span>Surface area:</span>
            <input
              type="number"
              inputMode="decimal"
              value={surfaceDraft}
              placeholder="sq ft"
              onChange={(e) => setSurfaceDraft(e.target.value)}
              onBlur={handleSurfaceSave}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
              className="w-20 bg-transparent border-b border-transparent hover:border-border
                         focus:border-ring focus:outline-none text-sm text-foreground"
            />
            <span>sq ft</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShoppingListButton projectId={projectId} />
          <ExportButton projectId={projectId} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
        <div className="space-y-10">
          <LumberSection projectId={projectId} />
          <HardwareSection projectId={projectId} />
          <FinishSection projectId={projectId} />
          <LaborSection projectId={projectId} />
          <PhotoGallery projectId={projectId} userId={userId} />
        </div>
        <div className="lg:sticky lg:top-8">
          <CostSummary />
        </div>
      </div>
    </div>
  );
}
