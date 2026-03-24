"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AiGenerateModal } from "@/components/bom/AiGenerateModal";

interface AiGenerateButtonProps {
  projectId: string;
}

export function AiGenerateButton({ projectId }: AiGenerateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="cursor-pointer"
      >
        ✦ Generate with AI
      </Button>
      <AiGenerateModal
        projectId={projectId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
