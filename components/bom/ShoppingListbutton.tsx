"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ShoppingListButtonProps {
  projectId: string;
}

export function ShoppingListButton({ projectId }: ShoppingListButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const response = await fetch(`/api/pdf/shopping-list/${projectId}`);
      if (!response.ok) throw new Error("Failed to generate shopping list");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shopping-list-${projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Shopping list export failed:", error);
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
      {loading ? "Generating..." : "Shopping List"}
    </Button>
  );
}
