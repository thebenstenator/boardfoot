"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/bom";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tier } = useSubscription();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (searchParams.get("upgrade") === "true") {
      setShowUpgrade(true);
    }
  }, [searchParams]);

  useEffect(() => {
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

    loadProjects();
  }, []);

  async function handleCreateProject() {
    if (tier === "free" && projects.length >= 3) {
      setShowUpgrade(true);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: project } = await supabase
      .from("projects")
      .insert({ user_id: user.id, name: "Untitled Project" })
      .select()
      .single();

    if (project) {
      router.push(`/projects/${project.id}`);
    }
  }

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

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : projects.length > 0 ? (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{project.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>
                {project.notes && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.notes}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No projects yet.</p>
            <p className="text-sm mt-1">
              Create your first project to get started.
            </p>
          </div>
        )}

        {tier === "free" && (
          <p className="text-xs text-muted-foreground text-center">
            {projects.length}/3 projects used on free plan.{" "}
            <Link
              href="/settings/billing"
              className="underline hover:text-foreground"
            >
              Upgrade to Pro
            </Link>{" "}
            for unlimited projects.
          </p>
        )}
      </div>
    </>
  );
}
