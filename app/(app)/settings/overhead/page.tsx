"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/types/bom";

export default function OverheadPage() {
  const { profile, setProfile } = useUserStore();
  const [hourlyRate, setHourlyRate] = useState("");
  const [monthlyOverhead, setMonthlyOverhead] = useState("");
  const [projectsPerMonth, setProjectsPerMonth] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setHourlyRate(String(profile.hourly_rate));
      setMonthlyOverhead(String(profile.monthly_overhead));
      setProjectsPerMonth(String(profile.projects_per_month));
      setTaxRate(String(Math.round(profile.tax_rate * 100)));
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const updates = {
      hourly_rate: parseFloat(hourlyRate) || 0,
      monthly_overhead: parseFloat(monthlyOverhead) || 0,
      projects_per_month: parseInt(projectsPerMonth) || 1,
      tax_rate: (parseFloat(taxRate) || 0) / 100,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates } as UserProfile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }

    setSaving(false);
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shop Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          These defaults apply to all your projects and affect cost
          calculations.
        </p>
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Labor</h2>

        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Default hourly rate ($)</Label>
          <Input
            id="hourlyRate"
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="25.00"
          />
          <p className="text-xs text-muted-foreground">
            Used when no per-project rate is set.
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Monthly Overhead</h2>
        <p className="text-xs text-muted-foreground">
          Total monthly shop costs divided across your projects. Includes
          rent/mortgage share, utilities, tool payments, insurance.
        </p>

        <div className="space-y-2">
          <Label htmlFor="monthlyOverhead">Monthly overhead ($)</Label>
          <Input
            id="monthlyOverhead"
            type="number"
            value={monthlyOverhead}
            onChange={(e) => setMonthlyOverhead(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectsPerMonth">Projects per month</Label>
          <Input
            id="projectsPerMonth"
            type="number"
            value={projectsPerMonth}
            onChange={(e) => setProjectsPerMonth(e.target.value)}
            placeholder="4"
          />
        </div>

        {monthlyOverhead && projectsPerMonth && (
          <p className="text-sm text-muted-foreground">
            = $
            {(parseFloat(monthlyOverhead) / parseInt(projectsPerMonth)).toFixed(
              2,
            )}{" "}
            overhead per project
          </p>
        )}
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Tax</h2>

        <div className="space-y-2">
          <Label htmlFor="taxRate">Sales tax rate (%)</Label>
          <Input
            id="taxRate"
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Applied to grand total in cost summary.
          </p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
        {saved ? "Saved!" : saving ? "Saving..." : "Save settings"}
      </Button>
    </div>
  );
}
