"use client";

import { useProjectLabor } from "@/hooks/useLineItems";
import { useProjectStore } from "@/store/projectStore";
import { useSubscription } from "@/hooks/useSubscription";
import { CurrencyCell } from "@/components/bom/BomCells";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { useState } from "react";

interface LaborSectionProps {
  projectId: string;
}

export function LaborSection({ projectId }: LaborSectionProps) {
  const { labor, updateLabor } = useProjectLabor(projectId);
  const { isPro } = useSubscription();
  const totals = useProjectStore((state) => state.totals);
  const profile = useProjectStore((state) => state.profile);
  const [showUpgrade, setShowUpgrade] = useState(false);

  function formatCurrency(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  if (!isPro) {
    return (
      <>
        {showUpgrade && (
          <UpgradeModal
            feature="Labor & overhead tracking"
            onClose={() => setShowUpgrade(false)}
          />
        )}
        <div
          onClick={() => setShowUpgrade(true)}
          className="border border-dashed rounded-lg p-6 text-center cursor-pointer
            hover:bg-accent/30 transition-colors space-y-1"
        >
          <p className="font-medium text-sm">Labor & Overhead Tracking</p>
          <p className="text-xs text-muted-foreground">
            Track hours, set your rate, and calculate suggested retail. Pro
            feature.
          </p>
          <p className="text-xs text-primary font-medium mt-2">
            Upgrade to Pro →
          </p>
        </div>
      </>
    );
  }

  const effectiveRate = labor?.hourly_rate ?? profile.hourly_rate;
  const estimatedHrs = labor?.estimated_hrs ?? 0;
  const targetMargin = labor?.target_margin ?? 0.3;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Labor & Overhead</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Hourly rate */}
        <div className="border rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Hourly Rate
          </p>
          <div className="flex items-center gap-1">
            <CurrencyCell
              value={effectiveRate}
              onChange={(v) => updateLabor({ hourly_rate: parseFloat(v) || 0 })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Default: ${profile.hourly_rate}/hr from shop settings
          </p>
        </div>

        {/* Estimated hours */}
        <div className="border rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Estimated Hours
          </p>
          <input
            type="text"
            inputMode="decimal"
            value={estimatedHrs}
            onChange={(e) =>
              updateLabor({ estimated_hrs: parseFloat(e.target.value) || 0 })
            }
            className="w-full bg-transparent border border-transparent rounded px-1 py-0.5
              text-sm focus:outline-none focus:border-ring focus:bg-background
              hover:border-border"
          />
          <p className="text-xs text-muted-foreground">
            Labor cost: {formatCurrency(totals.labor.total)}
          </p>
        </div>

        {/* Target margin */}
        <div className="border rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Target Margin
          </p>
          <div className="flex items-center gap-1">
            <input
              type="text"
              inputMode="decimal"
              value={Math.round(targetMargin * 100)}
              onChange={(e) =>
                updateLabor({
                  target_margin: (parseFloat(e.target.value) || 0) / 100,
                })
              }
              className="w-full bg-transparent border border-transparent rounded px-1 py-0.5
                text-sm focus:outline-none focus:border-ring focus:bg-background
                hover:border-border"
            />
            <span className="text-sm text-muted-foreground shrink-0">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Suggested retail: {formatCurrency(totals.suggestedRetail)}
          </p>
        </div>
      </div>

      {/* Summary row */}
      <div className="border rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Materials</p>
          <p className="font-medium">{formatCurrency(totals.subtotal)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Labor</p>
          <p className="font-medium">{formatCurrency(totals.labor.total)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Overhead</p>
          <p className="font-medium">{formatCurrency(totals.overhead.share)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Suggested retail</p>
          <p className="font-semibold text-primary">
            {formatCurrency(totals.suggestedRetail)}
          </p>
        </div>
      </div>
    </div>
  );
}
