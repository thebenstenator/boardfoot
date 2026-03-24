"use client";

import { Button } from "@/components/ui/button";

interface ShoppingListButtonProps {
  projectId: string;
}

export function ShoppingListButton({ projectId }: ShoppingListButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(`/api/pdf/shopping-list/${projectId}`, "_blank")}
      className="cursor-pointer"
    >
      Shopping List
    </Button>
  );
}
