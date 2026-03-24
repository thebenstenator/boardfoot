"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjectStore } from "@/store/projectStore";
import { useSubscription } from "@/hooks/useSubscription";
import { BomDocument } from "@/lib/pdf/BomDocument";
import { PDFViewer } from "@react-pdf/renderer";

// ─── Inner viewer (named export so the dynamic import can target it) ──────────

export function PdfViewerInner() {
  const project = useProjectStore((s) => s.project);
  const lumberItems = useProjectStore((s) => s.lumberItems);
  const hardwareItems = useProjectStore((s) => s.hardwareItems);
  const finishItems = useProjectStore((s) => s.finishItems);
  const labor = useProjectStore((s) => s.labor);
  const profile = useProjectStore((s) => s.profile);
  const totals = useProjectStore((s) => s.totals);
  const { isPro } = useSubscription();

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No project loaded.
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <PDFViewer
        width="100%"
        height="100%"
        showToolbar={false}
        style={{ border: "none" }}
      >
        <BomDocument
          project={project}
          lumberItems={lumberItems}
          hardwareItems={hardwareItems}
          finishItems={finishItems}
          labor={labor}
          profile={profile}
          totals={totals}
          isPro={isPro}
        />
      </PDFViewer>
    </div>
  );
}

// ─── Dynamic import (no SSR) ──────────────────────────────────────────────────

const PdfViewerInnerDynamic = dynamic(
  () =>
    import("@/components/bom/BomPreviewModal").then((m) => m.PdfViewerInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Rendering PDF...
      </div>
    ),
  }
);

// ─── Modal ────────────────────────────────────────────────────────────────────

interface BomPreviewModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function BomPreviewModal({
  open,
  onClose,
  projectId,
}: BomPreviewModalProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const response = await fetch(`/api/pdf/${projectId}`);
      if (!response.ok) throw new Error("Failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bom-${projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-full max-w-4xl h-[85vh] flex flex-col p-0 gap-0 sm:max-w-4xl">
        <DialogHeader className="flex-row items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <DialogTitle>BOM Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="cursor-pointer"
            >
              {downloading ? "Downloading..." : "Download PDF"}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="cursor-pointer"
              aria-label="Close preview"
            >
              ✕
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <PdfViewerInnerDynamic />
        </div>
      </DialogContent>
    </Dialog>
  );
}
