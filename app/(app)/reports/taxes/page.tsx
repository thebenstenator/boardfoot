import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TaxReportUploadButton } from "@/components/project/TaxReportUploadButton";

interface ReceiptRow {
  id: string;
  project_id: string | null;
  amount: number | null;
  tax_amount: number | null;
  receipt_date: string | null;
}

interface ProjectRow {
  id: string;
  name: string;
  created_at: string;
  project_receipts: ReceiptRow[];
}

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function receiptYear(r: ReceiptRow, fallback: string): string {
  return (r.receipt_date ?? fallback).slice(0, 4);
}

export default async function TaxReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_tier !== "pro") redirect("/settings/billing");

  const [projectsResult, generalResult] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, name, created_at, project_receipts(id, project_id, amount, tax_amount, receipt_date)",
      )
      .eq("user_id", user.id)
      .neq("status", "deleted")
      .order("created_at", { ascending: false }),
    supabase
      .from("project_receipts")
      .select("id, project_id, amount, tax_amount, receipt_date")
      .eq("user_id", user.id)
      .is("project_id", null)
      .order("receipt_date", { ascending: false }),
  ]);

  const projects = (projectsResult.data ?? []) as unknown as ProjectRow[];
  const generalReceipts = (generalResult.data ?? []) as unknown as ReceiptRow[];

  const allProjects = projects;
  const currentYear = new Date().getFullYear().toString();

  // ── Aggregate per year ────────────────────────────────────────────────────
  interface YearEntry {
    projectRows: Array<{
      id: string;
      name: string;
      receiptCount: number;
      totalAmount: number;
      totalTax: number;
    }>;
    generalCount: number;
    generalAmount: number;
    generalTax: number;
  }

  const byYear = new Map<string, YearEntry>();

  function ensureYear(y: string) {
    if (!byYear.has(y)) {
      byYear.set(y, {
        projectRows: [],
        generalCount: 0,
        generalAmount: 0,
        generalTax: 0,
      });
    }
    return byYear.get(y)!;
  }

  for (const project of allProjects) {
    const receipts = project.project_receipts ?? [];
    if (receipts.length === 0) {
      // Still list the project under its created_at year so users can upload to it
      const year = project.created_at.slice(0, 4);
      ensureYear(year).projectRows.push({
        id: project.id,
        name: project.name,
        receiptCount: 0,
        totalAmount: 0,
        totalTax: 0,
      });
    } else {
      // Group individual receipts by their own date year so a project can span years
      const receiptsByYear = new Map<string, ReceiptRow[]>();
      for (const r of receipts) {
        const y = receiptYear(r, project.created_at.slice(0, 4));
        if (!receiptsByYear.has(y)) receiptsByYear.set(y, []);
        receiptsByYear.get(y)!.push(r);
      }
      for (const [year, yearReceipts] of receiptsByYear) {
        ensureYear(year).projectRows.push({
          id: project.id,
          name: project.name,
          receiptCount: yearReceipts.length,
          totalAmount: yearReceipts.reduce((s, r) => s + (r.amount ?? 0), 0),
          totalTax: yearReceipts.reduce((s, r) => s + (r.tax_amount ?? 0), 0),
        });
      }
    }
  }

  for (const r of generalReceipts) {
    const year = receiptYear(r, currentYear);
    const entry = ensureYear(year);
    entry.generalCount += 1;
    entry.generalAmount += r.amount ?? 0;
    entry.generalTax += r.tax_amount ?? 0;
  }

  const years = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a));
  const projectsForModal = allProjects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track purchase receipts and taxes paid. Use for year-end filing.
          </p>
        </div>
        <TaxReportUploadButton userId={user.id} projects={projectsForModal} />
      </div>

      {years.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No receipts yet. Use &ldquo;Upload receipt&rdquo; to add your first
          one, or upload from any{" "}
          <Link href="/dashboard" className="underline hover:text-foreground">
            project page
          </Link>
          .
        </p>
      )}

      {years.map((year) => {
        const { projectRows, generalCount, generalAmount, generalTax } =
          byYear.get(year)!;

        const yearTotalAmount =
          projectRows.reduce((s, p) => s + p.totalAmount, 0) + generalAmount;
        const yearTotalTax =
          projectRows.reduce((s, p) => s + p.totalTax, 0) + generalTax;
        const totalReceipts =
          projectRows.reduce((s, p) => s + p.receiptCount, 0) + generalCount;

        return (
          <div key={year} className="space-y-3">
            <h2 className="text-lg font-semibold">{year}</h2>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="border rounded-lg p-3 sm:p-4 space-y-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                  Receipts
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {totalReceipts}
                </p>
              </div>
              <div className="border rounded-lg p-3 sm:p-4 space-y-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                  Spend
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {formatCurrency(yearTotalAmount)}
                </p>
              </div>
              <div className="border rounded-lg p-3 sm:p-4 space-y-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                  Tax paid
                </p>
                <p className="text-lg sm:text-xl font-semibold text-primary">
                  {formatCurrency(yearTotalTax)}
                </p>
              </div>
            </div>

            {/* Breakdown table — horizontally scrollable on mobile */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[440px]">
                  <div
                    className="grid grid-cols-[1fr_80px_90px_90px] gap-3 px-4 py-2
                    bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    <span>Project</span>
                    <span className="text-right">Receipts</span>
                    <span className="text-right">Total</span>
                    <span className="text-right">Tax paid</span>
                  </div>

                  {projectRows.map((p) => (
                    <div
                      key={p.id}
                      className="grid grid-cols-[1fr_80px_90px_90px] gap-3 px-4 py-2.5 border-t text-sm items-center"
                    >
                      <Link
                        href={`/projects/${p.id}`}
                        className="hover:underline truncate"
                      >
                        {p.name}
                      </Link>
                      <span className="text-right text-muted-foreground">
                        {p.receiptCount}
                      </span>
                      <span className="text-right">
                        {p.totalAmount > 0 ? (
                          formatCurrency(p.totalAmount)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                      <span className="text-right">
                        {p.totalTax > 0 ? (
                          formatCurrency(p.totalTax)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                    </div>
                  ))}

                  {/* General (unlinked) receipts row */}
                  {generalCount > 0 && (
                    <div className="grid grid-cols-[1fr_80px_90px_90px] gap-3 px-4 py-2.5 border-t text-sm items-center">
                      <span className="text-muted-foreground italic truncate">
                        General (no project)
                      </span>
                      <span className="text-right text-muted-foreground">
                        {generalCount}
                      </span>
                      <span className="text-right">
                        {generalAmount > 0 ? (
                          formatCurrency(generalAmount)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                      <span className="text-right">
                        {generalTax > 0 ? (
                          formatCurrency(generalTax)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Year totals */}
                  <div
                    className="grid grid-cols-[1fr_80px_90px_90px] gap-3 px-4 py-2.5
                    border-t bg-muted/20 text-sm font-semibold"
                  >
                    <span>Total</span>
                    <span className="text-right">{totalReceipts}</span>
                    <span className="text-right">
                      {formatCurrency(yearTotalAmount)}
                    </span>
                    <span className="text-right text-primary">
                      {formatCurrency(yearTotalTax)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
