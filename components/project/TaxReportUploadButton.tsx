"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
}

interface TaxReportUploadButtonProps {
  userId: string;
  projects: Project[];
}

export function TaxReportUploadButton({ userId, projects }: TaxReportUploadButtonProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setProjectId("");
    setFile(null);
    setDescription("");
    setAmount("");
    setTaxAmount("");
    setReceiptDate(new Date().toISOString().split("T")[0]);
    setError("");
    setScanning(false);
    setScanDone(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpen() {
    resetForm();
    setOpen(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(f.type)) {
      setError("Only JPG, PNG, WEBP, and PDF files are allowed.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }
    setError("");
    setFile(f);
    setDescription(f.name);
    setScanDone(false);

    // Run OCR / PDF text extraction and pre-fill fields
    setScanning(true);
    try {
      const { extractReceiptData } = await import("@/lib/ocr/extractReceiptData");
      const extracted = await extractReceiptData(f);
      if (extracted.description) setDescription(extracted.description);
      if (extracted.amount != null) setAmount(String(extracted.amount));
      if (extracted.taxAmount != null) setTaxAmount(String(extracted.taxAmount));
      if (extracted.receiptDate) setReceiptDate(extracted.receiptDate);
      setScanDone(true);
    } catch {
      // Silent — user fills in manually
    } finally {
      setScanning(false);
    }
  }

  async function handleUpload() {
    if (!file) { setError("Please choose a file."); return; }
    setUploading(true);
    setError("");

    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const folder = projectId || "general";
    const storagePath = `${userId}/${folder}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("project-receipts")
      .upload(storagePath, file);

    if (uploadError) {
      setError("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const insertPayload: Record<string, unknown> = {
      user_id: userId,
      storage_path: storagePath,
      description: description || file.name,
      amount: parseFloat(amount) || null,
      tax_amount: parseFloat(taxAmount) || null,
      receipt_date: receiptDate || null,
    };
    if (projectId) insertPayload.project_id = projectId;

    const { error: dbError } = await supabase
      .from("project_receipts")
      .insert(insertPayload);

    if (dbError) {
      setError("Failed to save receipt. Please try again.");
      setUploading(false);
      return;
    }

    setUploading(false);
    setOpen(false);
    resetForm();
    router.refresh();
  }

  const inputClass =
    "w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <>
      <button
        onClick={handleOpen}
        className="cursor-pointer text-sm border rounded px-3 py-1.5
          hover:bg-accent transition-colors font-medium shrink-0"
      >
        Upload receipt
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogClose className="absolute right-4 top-4 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring rounded" aria-label="Close">
            ✕
          </DialogClose>
          <DialogHeader>
            <DialogTitle>Upload Receipt</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Project selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={inputClass}
              >
                <option value="">General (not project-specific)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* File chooser */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">File <span className="text-muted-foreground font-normal">(PDF, JPG, PNG, WEBP · max 10 MB)</span></label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer text-sm border-2 border-primary rounded px-3 py-1.5
                    text-primary font-medium hover:bg-primary/10 transition-colors shrink-0"
                >
                  Choose file
                </button>
                <span className="text-sm text-muted-foreground truncate">
                  {file ? file.name : "No file chosen"}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-primary/80">
                {scanning
                  ? "Scanning receipt…"
                  : scanDone
                  ? "Auto-filled — verify before saving."
                  : "Fields auto-fill on select — verify before saving."}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Lumber Liquidators — oak boards"
                className={inputClass}
              />
            </div>

            {/* Amount + Tax — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Total amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tax paid ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => { setOpen(false); resetForm(); }}
                className="cursor-pointer text-sm border rounded px-4 py-1.5 hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || scanning}
                className="cursor-pointer text-sm rounded px-4 py-1.5 bg-primary text-primary-foreground
                  hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading…" : scanning ? "Scanning…" : "Upload"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
