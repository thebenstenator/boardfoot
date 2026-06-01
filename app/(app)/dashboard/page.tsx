"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { Button } from "@/components/ui/button";
import { AiGenerateModal } from "@/components/bom/AiGenerateModal";
import type { Project } from "@/types/bom";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tier } = useSubscription();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get("upgrade") === "true") setShowUpgrade(true);
  }, [searchParams]);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  async function loadProjects() {
    const supabase = createClient();

    // Seed demo project for new users
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_seen_demo')
        .eq('id', user.id)
        .single();
      if (profile && !profile.has_seen_demo) {
        await fetch('/api/demo', { method: 'POST' });
      }
    }

    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "active")
      .order("updated_at", { ascending: false });
    setProjects((data as Project[]) ?? []);
    setLoading(false);
  }

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
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("projects").update({ status: "deleted" }).eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  const filtered = projects.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

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

        {!loading && projects.length > 3 && (
          <input
            type="search"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search projects"
            className="w-full max-w-sm px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        )}

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : filtered.length > 0 ? (
          <div className="grid gap-3">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="group flex items-center gap-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors overflow-hidden"
              >
                {renamingId === project.id ? (
                  <input
                    ref={renameInputRef}
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={() => handleRename(project.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(project.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="flex-1 bg-transparent border-b border-ring focus:outline-none text-sm font-medium"
                  />
                ) : (
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium truncate min-w-0">{project.name}</span>
                      <span className="text-sm text-muted-foreground shrink-0">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                )}

                {renamingId !== project.id && (
                  <>
                    {/* Mobile: trash icon only, always visible */}
                    <button
                      onClick={(e) => { e.preventDefault(); setConfirmDeleteId(project.id); }}
                      disabled={deletingId === project.id}
                      aria-label={`Delete ${project.name}`}
                      className="sm:hidden shrink-0 text-destructive/70 hover:text-destructive p-1 rounded focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>

                    {/* Desktop: rename + delete on hover */}
                    <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setRenameDraft(project.name);
                          setRenamingId(project.id);
                        }}
                        aria-label={`Rename ${project.name}`}
                        className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-1 rounded hover:bg-accent focus:outline-none"
                      >
                        Rename
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); setConfirmDeleteId(project.id); }}
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
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
