"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/bom";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tier } = useSubscription();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  return (
    <>
      {showUpgrade && (
        <UpgradeModal
          feature="Unlimited projects"
          onClose={() => setShowUpgrade(false)}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Projects</h1>
          <Button onClick={handleCreateProject} className="cursor-pointer">
            + New Project
          </Button>
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
                className="group flex items-center gap-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
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
                      <span className="font-medium truncate">{project.name}</span>
                      <span className="text-sm text-muted-foreground shrink-0">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                )}

                {renamingId !== project.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
                          handleDelete(project.id);
                        }
                      }}
                      disabled={deletingId === project.id}
                      aria-label={`Delete ${project.name}`}
                      className="text-xs text-muted-foreground hover:text-destructive px-1.5 py-1 rounded hover:bg-accent focus:outline-none"
                    >
                      Delete
                    </button>
                  </div>
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
