import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface ReceiptRow {
  id: string;
  project_id: string;
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

function getYear(dateStr: string | null, fallback: string): string {
  if (!dateStr) return fallback;
  return dateStr.slice(0, 4);
}

export default async function TaxReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_tier !== "pro") redirect("/settings/billing");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, created_at, project_receipts(id, project_id, amount, tax_amount, receipt_date)")
    .eq("user_id", user.id)
    .neq("status", "deleted")
    .order("created_at", { ascending: false }) as { data: ProjectRow[] | null };

  const allProjects = projects ?? [];

  // Group by year (use earliest receipt date, fallback to project created_at)
  const byYear = new Map<string, {
    projects: Array<{
      id: string;
      name: string;
      created_at: string;
      receiptCount: number;
      totalAmount: number;
      totalTax: number;
    }>;
  }>();

  for (const project of allProjects) {
    const receipts = project.project_receipts ?? [];
    const year = getYear(project.created_at, new Date().getFullYear().toString());

    if (!byYear.has(year)) byYear.set(year, { projects: [] });

    const totalAmount = receipts.reduce((s, r) => s + (r.amount ?? 0), 0);
    const totalTax = receipts.reduce((s, r) => s + (r.tax_amount ?? 0), 0);

    byYear.get(year)!.projects.push({
      id: project.id,
      name: project.name,
      created_at: project.created_at,
      receiptCount: receipts.length,
      totalAmount,
      totalTax,
    });
  }

  const years = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Tax Report</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload receipts to each project to track purchase taxes paid. Use this for year-end filing.
        </p>
      </div>

      {years.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No projects yet.{" "}
          <Link href="/dashboard" className="underline hover:text-foreground">
            Create a project
          </Link>{" "}
          and upload receipts to start tracking taxes.
        </p>
      )}

      {years.map((year) => {
        const { projects: yearProjects } = byYear.get(year)!;
        const yearTotalAmount = yearProjects.reduce((s, p) => s + p.totalAmount, 0);
        const yearTotalTax = yearProjects.reduce((s, p) => s + p.totalTax, 0);
        const totalReceipts = yearProjects.reduce((s, p) => s + p.receiptCount, 0);

        return (
          <div key={year} className="space-y-3">
            {/* Year header + summary cards */}
            <h2 className="text-lg font-semibold">{year}</h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="border rounded-lg p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Receipts uploaded</p>
                <p className="text-xl font-semibold">{totalReceipts}</p>
              </div>
              <div className="border rounded-lg p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total spend</p>
                <p className="text-xl font-semibold">{formatCurrency(yearTotalAmount)}</p>
              </div>
              <div className="border rounded-lg p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Taxes paid</p>
                <p className="text-xl font-semibold text-primary">{formatCurrency(yearTotalTax)}</p>
              </div>
            </div>

            {/* Project breakdown */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_90px_90px] gap-3 px-4 py-2
                bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span>Project</span>
                <span className="text-right">Receipts</span>
                <span className="text-right">Spend</span>
                <span className="text-right">Tax paid</span>
              </div>

              {yearProjects.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[1fr_80px_90px_90px] gap-3 px-4 py-2.5
                    border-t text-sm items-center"
                >
                  <Link
                    href={`/projects/${p.id}`}
                    className="hover:underline truncate"
                  >
                    {p.name}
                  </Link>
                  <span className="text-right text-muted-foreground">{p.receiptCount}</span>
                  <span className="text-right">
                    {p.totalAmount > 0 ? formatCurrency(p.totalAmount) : <span className="text-muted-foreground">—</span>}
                  </span>
                  <span className="text-right">
                    {p.totalTax > 0 ? formatCurrency(p.totalTax) : <span className="text-muted-foreground">—</span>}
                  </span>
                </div>
              ))}

              {/* Year totals row */}
              <div className="grid grid-cols-[1fr_80px_90px_90px] gap-3 px-4 py-2.5
                border-t bg-muted/20 text-sm font-semibold">
                <span>Total</span>
                <span className="text-right">{totalReceipts}</span>
                <span className="text-right">{formatCurrency(yearTotalAmount)}</span>
                <span className="text-right text-primary">{formatCurrency(yearTotalTax)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
