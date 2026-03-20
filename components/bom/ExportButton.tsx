"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  projectId: string;
}

export function ExportButton({ projectId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const response = await fetch(`/api/pdf/${projectId}`);
      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bom-${projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="cursor-pointer"
    >
      {loading ? "Generating..." : "Export PDF"}
    </Button>
  );
}
