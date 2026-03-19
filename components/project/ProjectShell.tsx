"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { createClient } from "@/lib/supabase/client";
import { LumberSection } from "@/components/bom/LumberSection";
import { HardwareSection } from "@/components/bom/HardwareSection";
import { FinishSection } from "@/components/bom/FinishSection";
import { CostSummary } from "@/components/bom/CostSummary";

interface ProjectShellProps {
  projectId: string;
}

export function ProjectShell({ projectId }: ProjectShellProps) {
  const { loadProject, project, isLoading, setProject } = useProjectStore();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    loadProject(projectId);
  }, [projectId, loadProject]);

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
      {/* Editable project name */}
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
          className="text-2xl font-bold bg-transparent border-b border-ring focus:outline-none w-full"
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
        <div className="space-y-10">
          <LumberSection projectId={projectId} />
          <HardwareSection projectId={projectId} />
          <FinishSection projectId={projectId} />
        </div>
        <div className="lg:sticky lg:top-8">
          <CostSummary />
        </div>
      </div>
    </div>
  );
}
