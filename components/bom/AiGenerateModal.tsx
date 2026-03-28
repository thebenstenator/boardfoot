"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProjectStore } from "@/store/projectStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LumberItem, HardwareItem, FinishItem } from "@/types/bom";

interface GeneratedBom {
  projectName: string;
  lumberItems: Array<{
    species: string;
    thickness_in: number;
    width_in: number;
    length_ft: number;
    quantity: number;
    pricing_mode: "per_bf" | "per_lf" | "per_piece";
    price_per_unit: number;
  }>;
  hardwareItems: Array<{
    description: string;
    quantity: number;
    unit: string;
    unit_cost: number;
  }>;
  finishItems: Array<{
    description: string;
    container_size: number;
    container_cost: number;
    amount_used: number;
    fraction_used: number;
    unit: string;
  }>;
}

interface AiGenerateModalProps {
  projectId?: string;
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
}

export function AiGenerateModal({
  projectId,
  open,
  onClose,
  onCreated,
}: AiGenerateModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [preview, setPreview] = useState<GeneratedBom | null>(null);
  const [applying, setApplying] = useState(false);

  const { addLumberItem, addHardwareItem, addFinishItem, lumberItems, hardwareItems, finishItems } =
    useProjectStore();

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-bom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, projectId }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error === "limit_reached") {
          setLimitReached(true);
          return;
        }
        throw new Error(data.error ?? "Generation failed");
      }

      const data = await response.json() as GeneratedBom;
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!preview) return;
    setApplying(true);

    const supabase = createClient();

    try {
      // If no projectId, create a new project first
      let targetProjectId = projectId;
      if (!targetProjectId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const name = preview.projectName || prompt.trim().slice(0, 60) || "Untitled Project";
        const { data: newProject, error: projectError } = await supabase
          .from("projects")
          .insert({ user_id: user.id, name })
          .select()
          .single();
        if (projectError || !newProject) throw new Error("Failed to create project");
        targetProjectId = newProject.id;
      }

      // Insert lumber items
      for (let i = 0; i < preview.lumberItems.length; i++) {
        const item = preview.lumberItems[i];
        const newItem = {
          project_id: targetProjectId,
          species: item.species,
          thickness_in: item.thickness_in,
          width_in: item.width_in,
          length_ft: item.length_ft,
          length_unit: "ft" as const,
          quantity: item.quantity,
          pricing_mode: item.pricing_mode,
          price_per_unit: item.price_per_unit,
          is_reclaimed: false,
          waste_override: null,
          notes: "",
          sort_order: lumberItems.length + i,
        };

        const { data, error } = await supabase
          .from("lumber_items")
          .insert(newItem)
          .select()
          .single();

        if (!error && data) {
          addLumberItem(data as LumberItem);
        }
      }

      // Insert hardware items
      for (let i = 0; i < preview.hardwareItems.length; i++) {
        const item = preview.hardwareItems[i];
        const newItem = {
          project_id: targetProjectId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unit_cost,
          notes: "",
          sort_order: hardwareItems.length + i,
        };

        const { data, error } = await supabase
          .from("hardware_items")
          .insert(newItem)
          .select()
          .single();

        if (!error && data) {
          addHardwareItem(data as HardwareItem);
        }
      }

      // Insert finish items
      for (let i = 0; i < preview.finishItems.length; i++) {
        const item = preview.finishItems[i];
        const newItem = {
          project_id: targetProjectId,
          description: item.description,
          container_size: item.container_size ?? null,
          container_cost: item.container_cost,
          amount_used: item.amount_used ?? null,
          fraction_used: item.fraction_used,
          unit: item.unit ?? "",
          notes: "",
          sort_order: finishItems.length + i,
        };

        const { data, error } = await supabase
          .from("finish_items")
          .insert(newItem)
          .select()
          .single();

        if (!error && data) {
          addFinishItem(data as FinishItem);
        }
      }

      if (onCreated && targetProjectId) {
        onCreated(targetProjectId);
      } else {
        onClose();
      }
    } catch (err) {
      console.error("Failed to apply BOM:", err);
    } finally {
      setApplying(false);
    }
  }

  function handleBack() {
    setPreview(null);
    setError(null);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        {limitReached ? (
          <>
            <DialogHeader>
              <DialogTitle>You've used your 5 free builds</DialogTitle>
              <DialogDescription>
                Upgrade to Pro for unlimited AI BOM generation, plus PDF export,
                labor tracking, and more.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 border rounded-lg p-4 space-y-2">
              <p className="font-medium">BoardFoot Pro</p>
              <p className="text-2xl font-bold">$9<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Unlimited AI BOM generation</li>
                <li>✓ Unlimited projects</li>
                <li>✓ PDF export (clean, unbranded)</li>
                <li>✓ Labor & overhead tracking</li>
                <li>✓ Shopping list export</li>
              </ul>
            </div>
            <DialogFooter className="mt-4 p-0">
              <Button variant="outline" size="sm" onClick={onClose}>Maybe later</Button>
              <form action="/api/stripe/create-checkout" method="post">
                <Button size="sm" type="submit">Upgrade to Pro</Button>
              </form>
            </DialogFooter>
          </>
        ) : preview === null ? (
          <>
            <DialogHeader>
              <DialogTitle>Generate BOM with AI</DialogTitle>
              <DialogDescription>
                Describe your project and Claude will draft a bill of materials
                for you to review.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex flex-col gap-3">
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g. "Floating walnut shelf, 48 inches wide, 10 inches deep, two L-brackets"'
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter className="mt-4 p-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={!prompt.trim() || loading}
              >
                {loading ? "Generating..." : "Generate"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Review Generated BOM</DialogTitle>
              <DialogDescription>
                Review the items below before adding them to your project.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex flex-col gap-5 text-sm">
              {/* Lumber */}
              {preview.lumberItems.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">
                    Lumber ({preview.lumberItems.length} item
                    {preview.lumberItems.length !== 1 ? "s" : ""})
                  </h3>
                  <ul className="space-y-1 text-muted-foreground">
                    {preview.lumberItems.map((item, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span>
                          {item.quantity}× {item.species} —{" "}
                          {item.thickness_in}" × {item.width_in}" ×{" "}
                          {item.length_ft}ft
                        </span>
                        <span className="shrink-0 text-foreground">
                          ${item.price_per_unit.toFixed(2)}/
                          {item.pricing_mode === "per_bf" ? "BF" : item.pricing_mode === "per_lf" ? "LF" : "piece"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hardware */}
              {preview.hardwareItems.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">
                    Hardware ({preview.hardwareItems.length} item
                    {preview.hardwareItems.length !== 1 ? "s" : ""})
                  </h3>
                  <ul className="space-y-1 text-muted-foreground">
                    {preview.hardwareItems.map((item, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span>
                          {item.quantity} {item.unit} — {item.description}
                        </span>
                        <span className="shrink-0 text-foreground">
                          ${item.unit_cost.toFixed(2)} each
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Finish */}
              {preview.finishItems.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">
                    Finishing ({preview.finishItems.length} item
                    {preview.finishItems.length !== 1 ? "s" : ""})
                  </h3>
                  <ul className="space-y-1 text-muted-foreground">
                    {preview.finishItems.map((item, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span>
                          {item.description}
                          {item.container_size
                            ? ` — ${item.amount_used ?? Math.round(item.fraction_used * item.container_size)}/${item.container_size} ${item.unit}`
                            : ` — ${Math.round(item.fraction_used * 100)}% used`}
                        </span>
                        <span className="shrink-0 text-foreground">
                          ${(item.container_cost * item.fraction_used).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 p-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={applying}
              >
                ← Back
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={applying}
              >
                {applying ? "Adding..." : "Add to project"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
