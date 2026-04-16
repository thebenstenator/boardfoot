"use client";

import { useEffect, useRef, useState } from "react";
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
import { CutListButton } from "@/components/bom/CutListButton";

interface ProjectShellProps {
  projectId: string;
  userId: string;
}

export function ProjectShell({ projectId, userId }: ProjectShellProps) {
  const { loadProject, project, isLoading, setProject, passSavingsToCustomer, setPassSavingsToCustomer } = useProjectStore();
  const hasReclaimed = useProjectStore((state) => state.lumberItems.some((i) => i.is_reclaimed));
  const pendingSaves = useProjectStore((state) => state.pendingSaves);
  const totals = useProjectStore((state) => state.totals);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const justSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pendingSaves === 0 && !isLoading) {
      setJustSaved(true);
      if (justSavedTimer.current) clearTimeout(justSavedTimer.current);
      justSavedTimer.current = setTimeout(() => setJustSaved(false), 2000);
    }
    return () => {
      if (justSavedTimer.current) clearTimeout(justSavedTimer.current);
    };
  }, [pendingSaves, isLoading]);
  // Surface area inputs: L ft+in, W ft+in
  const [dimLft, setDimLft] = useState('');
  const [dimLin, setDimLin] = useState('');
  const [dimWft, setDimWft] = useState('');
  const [dimWin, setDimWin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProject(projectId);
  }, [projectId, loadProject]);

  useEffect(() => {
    // Reset dimension inputs when project changes (can't reverse-calculate L×W)
    if (!project?.surface_area_sqft) {
      setDimLft(''); setDimLin(''); setDimWft(''); setDimWin('');
    }
  }, [project?.id]);

  async function handleShareToggle() {
    if (!project) return;
    const supabase = createClient();
    const newIsPublic = !project.is_public;
    const { error } = await supabase
      .from("projects")
      .update({ is_public: newIsPublic })
      .eq("id", projectId);
    if (!error) {
      setProject({ ...project, is_public: newIsPublic });
    }
  }

  async function handleSurfaceSave(lft: string, lin: string, wft: string, win: string) {
    if (!project) return;
    const lVal = (parseFloat(lft) || 0) + (parseFloat(lin) || 0) / 12;
    const wVal = (parseFloat(wft) || 0) + (parseFloat(win) || 0) / 12;
    const parsed = lVal > 0 && wVal > 0 ? parseFloat((lVal * wVal).toFixed(2)) : null;
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

  // Compute displayed sqft from current inputs
  const lVal = (parseFloat(dimLft) || 0) + (parseFloat(dimLin) || 0) / 12;
  const wVal = (parseFloat(dimWft) || 0) + (parseFloat(dimWin) || 0) / 12;
  const computedSqft = lVal > 0 && wVal > 0 ? parseFloat((lVal * wVal).toFixed(2)) : null;

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

  function formatCurrency(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  return (
    <div className="space-y-10 pb-16 lg:pb-0">
      {/* Project name + export button */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          {editingName ? (
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
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
          {project.is_public && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground font-mono">
                {typeof window !== 'undefined' ? `${window.location.origin}/share/${projectId}` : ''}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/share/${projectId}`)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Copy share link"
                title="Copy link"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
          {/* Surface area — ft+in inputs */}
          <div className="flex flex-nowrap items-center gap-1 text-sm text-muted-foreground mt-1">
            <span className="shrink-0">$/sq ft — L:</span>
            <input
              type="text"
              inputMode="decimal"
              value={dimLft}
              placeholder="0"
              onChange={(e) => setDimLft(e.target.value)}
              onBlur={() => handleSurfaceSave(dimLft, dimLin, dimWft, dimWin)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
              className="w-9 bg-transparent border-b border-transparent hover:border-border
                         focus:border-ring focus:outline-none text-sm text-foreground text-right"
            />
            <span>ft</span>
            <input
              type="text"
              inputMode="decimal"
              value={dimLin}
              placeholder="0"
              onChange={(e) => setDimLin(e.target.value)}
              onBlur={() => handleSurfaceSave(dimLft, dimLin, dimWft, dimWin)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
              className="w-9 bg-transparent border-b border-transparent hover:border-border
                         focus:border-ring focus:outline-none text-sm text-foreground text-right"
            />
            <span className="shrink-0">in × W:</span>
            <input
              type="text"
              inputMode="decimal"
              value={dimWft}
              placeholder="0"
              onChange={(e) => setDimWft(e.target.value)}
              onBlur={() => handleSurfaceSave(dimLft, dimLin, dimWft, dimWin)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
              className="w-9 bg-transparent border-b border-transparent hover:border-border
                         focus:border-ring focus:outline-none text-sm text-foreground text-right"
            />
            <span>ft</span>
            <input
              type="text"
              inputMode="decimal"
              value={dimWin}
              placeholder="0"
              onChange={(e) => setDimWin(e.target.value)}
              onBlur={() => handleSurfaceSave(dimLft, dimLin, dimWft, dimWin)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
              className="w-9 bg-transparent border-b border-transparent hover:border-border
                         focus:border-ring focus:outline-none text-sm text-foreground text-right"
            />
            <span>in</span>
            {computedSqft !== null && (
              <span className="text-xs text-muted-foreground">
                = {computedSqft} sq ft
              </span>
            )}
            {!computedSqft && project?.surface_area_sqft && project.surface_area_sqft > 0 && (
              <span className="text-xs text-muted-foreground">
                = {project.surface_area_sqft} sq ft (saved)
              </span>
            )}
          </div>
          {/* Reclaimed savings toggle — only shown when at least one lumber item is reclaimed */}
          {hasReclaimed && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={passSavingsToCustomer}
                onChange={async (e) => {
                  const val = e.target.checked;
                  setPassSavingsToCustomer(val);
                  const supabase = createClient();
                  await supabase
                    .from("projects")
                    .update({ pass_reclaimed_to_customer: val })
                    .eq("id", projectId);
                }}
                className="rounded"
              />
              Pass reclaimed savings to customer
            </label>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Save status indicator */}
          {pendingSaves > 0 ? (
            <span className="text-xs text-muted-foreground">Saving…</span>
          ) : justSaved ? (
            <span className="text-xs text-muted-foreground">Saved ✓</span>
          ) : null}

          <button
            onClick={handleShareToggle}
            className={`text-xs border rounded px-2 py-1 transition-colors cursor-pointer
              ${project.is_public
                ? 'bg-green-500/20 border-green-500/50 text-green-700 hover:bg-green-500/30'
                : 'hover:bg-accent text-muted-foreground'
              }`}
            aria-label={project.is_public ? 'Project is public — click to make private' : 'Make project shareable'}
            title={project.is_public ? 'Project is public — click to make private' : 'Make project shareable'}
          >
            {project.is_public ? '🔗 Shared' : 'Share'}
          </button>

          <CutListButton projectId={projectId} />
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

      {/* Mobile sticky cost bar — hidden on lg+ where sidebar is visible */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm px-4 py-3 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Grand total</span>
        <span className="text-sm font-semibold">{formatCurrency(totals.grandTotal)}</span>
      </div>
    </div>
  );
}
