"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { PLAN_LIMITS } from "@/lib/stripe/plans";
import type { ProjectReceipt } from "@/types/bom";

interface ReceiptUploadProps {
  projectId: string;
  userId: string;
}

export function ReceiptUpload({ projectId, userId }: ReceiptUploadProps) {
  const [receipts, setReceipts] = useState<ProjectReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tier, isPro } = useSubscription();

  const canUpload = PLAN_LIMITS[tier].receiptUpload;

  useEffect(() => {
    loadReceipts();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadReceipts() {
    const supabase = createClient();
    const { data: rows } = await supabase
      .from("project_receipts")
      .select("*")
      .eq("project_id", projectId)
      .order("receipt_date", { ascending: false, nullsFirst: false });

    if (!rows) { setLoading(false); return; }

    const withUrls = await Promise.all(
      rows.map(async (row) => {
        const { data } = await supabase.storage
          .from("project-receipts")
          .createSignedUrl(row.storage_path, 3600);
        return { ...row, url: data?.signedUrl ?? "" } as ProjectReceipt;
      })
    );

    setReceipts(withUrls);
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canUpload) { setShowUpgrade(true); return; }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG, WEBP, and PDF files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be under 10MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const storagePath = `${userId}/${projectId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("project-receipts")
      .upload(storagePath, file);

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      setUploading(false);
      return;
    }

    const { data: row, error: dbError } = await supabase
      .from("project_receipts")
      .insert({ project_id: projectId, storage_path: storagePath, description: file.name })
      .select()
      .single();

    if (dbError || !row) {
      console.error("Failed to save receipt:", dbError);
      setUploading(false);
      return;
    }

    const { data: signed } = await supabase.storage
      .from("project-receipts")
      .createSignedUrl(storagePath, 3600);

    setReceipts((prev) => [
      { ...row, url: signed?.signedUrl ?? "" } as ProjectReceipt,
      ...prev,
    ]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFieldUpdate(id: string, field: keyof ProjectReceipt, value: string) {
    const supabase = createClient();
    const numericFields: Array<keyof ProjectReceipt> = ["amount", "tax_amount"];
    const patch = {
      [field]: numericFields.includes(field) ? (parseFloat(value) || null) : value || null,
    };
    setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    await supabase.from("project_receipts").update(patch).eq("id", id);
  }

  async function handleDelete(receipt: ProjectReceipt) {
    const supabase = createClient();
    await supabase.storage.from("project-receipts").remove([receipt.storage_path]);
    await supabase.from("project_receipts").delete().eq("id", receipt.id);
    setReceipts((prev) => prev.filter((r) => r.id !== receipt.id));
  }

  if (loading) return null;

  return (
    <>
      {showUpgrade && (
        <UpgradeModal
          feature="Receipt upload for tax tracking"
          onClose={() => setShowUpgrade(false)}
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Receipts</h2>
            <p className="text-xs text-muted-foreground">Track purchase taxes for year-end filing.</p>
          </div>
          <button
            onClick={() => {
              if (!canUpload) { setShowUpgrade(true); return; }
              fileInputRef.current?.click();
            }}
            disabled={uploading}
            className="cursor-pointer text-sm border rounded px-3 py-1
              hover:bg-accent transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading..." : !isPro ? "Upgrade to upload" : "+ Add receipt"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleUpload}
          className="hidden"
        />

        {receipts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {isPro
              ? "No receipts yet. Upload PDFs or photos of purchase receipts."
              : "Upgrade to Pro to upload receipts and track taxes paid."}
          </p>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[1fr_90px_90px_100px_28px] gap-2 px-2 text-xs text-muted-foreground font-medium">
              <span>Description</span>
              <span>Amount</span>
              <span>Tax paid</span>
              <span>Date</span>
              <span></span>
            </div>

            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="grid grid-cols-[1fr_90px_90px_100px_28px] gap-2 items-center
                  px-2 py-1.5 rounded border border-transparent hover:border-border hover:bg-muted/20"
              >
                {/* Description / filename — clickable to open */}
                <a
                  href={receipt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm truncate hover:underline text-foreground"
                  title={receipt.description || receipt.storage_path}
                >
                  {receipt.description || receipt.storage_path.split("/").pop()}
                </a>

                {/* Amount */}
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={receipt.amount ?? ""}
                  onChange={(e) => handleFieldUpdate(receipt.id, "amount", e.target.value)}
                  className="w-full text-sm bg-transparent border-b border-transparent
                    hover:border-border focus:border-ring focus:outline-none text-right"
                />

                {/* Tax paid */}
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={receipt.tax_amount ?? ""}
                  onChange={(e) => handleFieldUpdate(receipt.id, "tax_amount", e.target.value)}
                  className="w-full text-sm bg-transparent border-b border-transparent
                    hover:border-border focus:border-ring focus:outline-none text-right"
                />

                {/* Date */}
                <input
                  type="date"
                  value={receipt.receipt_date ?? ""}
                  onChange={(e) => handleFieldUpdate(receipt.id, "receipt_date", e.target.value)}
                  className="w-full text-sm bg-transparent border-b border-transparent
                    hover:border-border focus:border-ring focus:outline-none"
                />

                {/* Delete */}
                <button
                  onClick={() => handleDelete(receipt)}
                  className="cursor-pointer text-muted-foreground hover:text-destructive
                    text-xs focus:outline-none rounded"
                  aria-label="Delete receipt"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Totals row */}
            {receipts.some((r) => r.amount != null || r.tax_amount != null) && (
              <div className="grid grid-cols-[1fr_90px_90px_100px_28px] gap-2 px-2 pt-1
                border-t text-sm font-semibold">
                <span className="text-muted-foreground">Totals</span>
                <span className="text-right">
                  ${receipts.reduce((s, r) => s + (r.amount ?? 0), 0).toFixed(2)}
                </span>
                <span className="text-right">
                  ${receipts.reduce((s, r) => s + (r.tax_amount ?? 0), 0).toFixed(2)}
                </span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
