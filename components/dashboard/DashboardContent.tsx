"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { Button } from "@/components/ui/button";
import { AiGenerateModal } from "@/components/bom/AiGenerateModal";
import type { Project } from "@/types/bom";

interface DashboardContentProps {
  initialProjects: Project[];
  tier: "free" | "pro";
  needsDemoSeed: boolean;
}

export function DashboardContent({ initialProjects, tier, needsDemoSeed }: DashboardContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Seed demo project for new users, mark for welcome banner, then refresh
  useEffect(() => {
    if (needsDemoSeed) {
      localStorage.setItem("boardfoot_new_user", "true");
      fetch("/api/demo", { method: "POST" }).then(() => router.refresh());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show welcome banner for new users until dismissed
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isNew = localStorage.getItem("boardfoot_new_user") === "true";
    const dismissed = localStorage.getItem("boardfoot_welcome_dismissed") === "true";
    setShowWelcome(isNew && !dismissed);
  }, []);

  useEffect(() => {
    if (searchParams.get("upgrade") === "true") setShowUpgrade(true);
  }, [searchParams]);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  async function handleCreateProject() {
    if (tier === "free" && projects.length >= 3) {
      setShowUpgrade(true);
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: project } = await supabase
      .from("projects")
      .insert({ user_id: user.id, name: "Untitled Project" })
      .select()
      .single();
    if (project) router.push(`/projects/${project.id}`);
  }

  function handleOpenAiModal() {
    if (tier === "free" && projects.length >= 3) {
      setShowUpgrade(true);
      return;
    }
    setShowAiModal(true);
  }

  async function handleRename(id: string) {
    const name = renameDraft.trim();
    setRenamingId(null);
    if (!name) return;
    const supabase = createClient();
    await supabase.from("projects").update({ name }).eq("id", id);
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name } : p));
    toast.success("Project renamed");
  }

  async function handleDelete(id: string) {
    const project = projects.find((p) => p.id === id);
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("projects").update({ status: "deleted" }).eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
    toast.success(`"${project?.name ?? "Project"}" deleted`);
  }

  async function handleArchive(id: string) {
    const project = projects.find((p) => p.id === id);
    const supabase = createClient();
    await supabase.from("projects").update({ status: "archived" }).eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (project) setArchivedProjects((prev) => [{ ...project, status: "archived" }, ...prev]);
    toast.success(`"${project?.name ?? "Project"}" archived`);
  }

  async function handleUnarchive(id: string) {
    const project = archivedProjects.find((p) => p.id === id);
    const supabase = createClient();
    await supabase.from("projects").update({ status: "active" }).eq("id", id);
    const restored = archivedProjects.find((p) => p.id === id);
    setArchivedProjects((prev) => prev.filter((p) => p.id !== id));
    if (restored) setProjects((prev) => [{ ...restored, status: "active" }, ...prev]);
    toast.success(`"${project?.name ?? "Project"}" restored`);
  }

  async function loadArchived() {
    setLoadingArchived(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "archived")
      .order("updated_at", { ascending: false });
    setArchivedProjects((data ?? []) as Project[]);
    setLoadingArchived(false);
  }

  function toggleShowArchived() {
    if (!showArchived && archivedProjects.length === 0) loadArchived();
    setShowArchived((prev) => !prev);
  }

  function dismissWelcome() {
    localStorage.setItem("boardfoot_welcome_dismissed", "true");
    setShowWelcome(false);
  }

  const filtered = projects.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const demoProject = projects.find((p) => p.name.startsWith("Demo:"));
  const confirmDeleteProject = projects.find((p) => p.id === confirmDeleteId);

  return (
    <>
      {showUpgrade && (
        <UpgradeModal
          feature="Unlimited projects"
          onClose={() => setShowUpgrade(false)}
        />
      )}
      <AiGenerateModal
        open={showAiModal}
        onClose={() => setShowAiModal(false)}
        onCreated={(id) => router.push(`/projects/${id}`)}
      />

      {/* Delete confirmation modal */}
      {confirmDeleteId && confirmDeleteProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteId(null); }}
        >
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-sm mx-4 p-6 space-y-4">
            <h2 className="font-semibold text-base">Delete project?</h2>
            <p className="text-sm text-muted-foreground">
              &ldquo;{confirmDeleteProject.name}&rdquo; will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={deletingId === confirmDeleteId}
                onClick={() => {
                  handleDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
              >
                {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Welcome banner for new users */}
        {showWelcome && (
          <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Welcome to BoardFoot!</p>
              <p className="text-sm text-muted-foreground">
                We&apos;ve created a demo project to show you how everything works. Open it to explore, then start your first real project when you&apos;re ready.
              </p>
              {demoProject && (
                <Link href={`/projects/${demoProject.id}`} className="text-sm text-primary hover:underline font-medium">
                  Open demo project →
                </Link>
              )}
            </div>
            <button
              onClick={dismissWelcome}
              className="cursor-pointer text-muted-foreground hover:text-foreground shrink-0 text-lg leading-none"
              aria-label="Dismiss welcome message"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold shrink-0">Your Projects</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenAiModal} className="cursor-pointer">
              ✦ Generate<span className="hidden sm:inline"> with AI</span>
            </Button>
            <Button size="sm" onClick={handleCreateProject} className="cursor-pointer">
              + <span className="hidden sm:inline">New </span>Project
            </Button>
          </div>
        </div>

        {projects.length > 3 && (
          <input
            type="search"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search projects"
            className="w-full max-w-sm px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        )}

        {/* Active projects */}
        {filtered.length > 0 ? (
          <div className="grid gap-3">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                renamingId={renamingId}
                renameDraft={renameDraft}
                deletingId={deletingId}
                renameInputRef={renameInputRef}
                onRenameDraftChange={setRenameDraft}
                onRenameStart={(id) => { setRenameDraft(project.name); setRenamingId(id); }}
                onRenameCommit={handleRename}
                onRenameCancel={() => setRenamingId(null)}
                onDeleteRequest={(id) => setConfirmDeleteId(id)}
                onArchive={handleArchive}
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No projects yet.</p>
            <p className="text-sm mt-1">Create your first project to get started.</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No projects match &ldquo;{search}&rdquo;.</p>
        )}

        {tier === "free" && (
          <p className="text-xs text-muted-foreground text-center">
            {projects.length}/3 projects used on free plan.{" "}
            <Link href="/settings/billing" className="underline hover:text-foreground">
              Upgrade to Pro
            </Link>{" "}
            for unlimited projects.
          </p>
        )}

        {/* Archived projects toggle */}
        <div className="border-t pt-4">
          <button
            onClick={toggleShowArchived}
            className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showArchived ? "▾" : "▸"} Archived projects
            {archivedProjects.length > 0 && ` (${archivedProjects.length})`}
          </button>

          {showArchived && (
            <div className="mt-3 space-y-2">
              {loadingArchived ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
              ) : archivedProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No archived projects.</p>
              ) : (
                archivedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex items-center gap-2 p-3 border rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium truncate">{project.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                    {/* Mobile: restore icon always visible */}
                    <button
                      onClick={(e) => { e.preventDefault(); handleUnarchive(project.id); }}
                      aria-label={`Restore ${project.name}`}
                      className="sm:hidden shrink-0 text-muted-foreground/70 hover:text-foreground p-1 rounded focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                      </svg>
                    </button>

                    <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => { e.preventDefault(); handleUnarchive(project.id); }}
                        className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-1 rounded hover:bg-accent"
                      >
                        Restore
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); setConfirmDeleteId(project.id); }}
                        className="text-xs text-muted-foreground hover:text-destructive px-1.5 py-1 rounded hover:bg-accent"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  renamingId: string | null;
  renameDraft: string;
  deletingId: string | null;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  onRenameDraftChange: (v: string) => void;
  onRenameStart: (id: string) => void;
  onRenameCommit: (id: string) => void;
  onRenameCancel: () => void;
  onDeleteRequest: (id: string) => void;
  onArchive: (id: string) => void;
}

function ProjectCard({
  project, renamingId, renameDraft, deletingId, renameInputRef,
  onRenameDraftChange, onRenameStart, onRenameCommit, onRenameCancel,
  onDeleteRequest, onArchive,
}: ProjectCardProps) {
  const isRenaming = renamingId === project.id;

  return (
    <div className="group flex items-center gap-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors overflow-hidden">
      {isRenaming ? (
        <input
          ref={renameInputRef}
          value={renameDraft}
          onChange={(e) => onRenameDraftChange(e.target.value)}
          onBlur={() => onRenameCommit(project.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRenameCommit(project.id);
            if (e.key === "Escape") onRenameCancel();
          }}
          className="flex-1 bg-transparent border-b border-ring focus:outline-none text-sm font-medium"
        />
      ) : (
        <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium truncate min-w-0">{project.name}</span>
            <span className="text-sm text-muted-foreground shrink-0">
              {new Date(project.updated_at).toLocaleDateString()}
            </span>
          </div>
        </Link>
      )}

      {!isRenaming && (
        <>
          {/* Mobile: archive + delete icons always visible */}
          <div className="sm:hidden flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.preventDefault(); onArchive(project.id); }}
              aria-label={`Archive ${project.name}`}
              className="text-muted-foreground/70 hover:text-foreground p-1 rounded focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); onDeleteRequest(project.id); }}
              disabled={deletingId === project.id}
              aria-label={`Delete ${project.name}`}
              className="text-destructive/70 hover:text-destructive p-1 rounded focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>

          {/* Desktop: rename + archive + delete on hover */}
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => { e.preventDefault(); onRenameStart(project.id); }}
              aria-label={`Rename ${project.name}`}
              className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-1 rounded hover:bg-accent focus:outline-none"
            >
              Rename
            </button>
            <button
              onClick={(e) => { e.preventDefault(); onArchive(project.id); }}
              aria-label={`Archive ${project.name}`}
              className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-1 rounded hover:bg-accent focus:outline-none"
            >
              Archive
            </button>
            <button
              onClick={(e) => { e.preventDefault(); onDeleteRequest(project.id); }}
              disabled={deletingId === project.id}
              aria-label={`Delete ${project.name}`}
              className="text-xs text-muted-foreground hover:text-destructive px-1.5 py-1 rounded hover:bg-accent focus:outline-none"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
