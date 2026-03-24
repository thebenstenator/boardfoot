"use client";

import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  projectId: string;
}

export function ExportButton({ projectId }: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(`/api/pdf/${projectId}`, "_blank")}
      className="cursor-pointer"
    >
      Export BOM
    </Button>
  );
}
