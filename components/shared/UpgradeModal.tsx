"use client";

import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  feature: string;
  onClose: () => void;
}

export function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg p-6 max-w-sm w-full space-y-4">
        <h2 className="text-lg font-semibold">Upgrade to Pro</h2>
        <p className="text-sm text-muted-foreground">
          {feature} is a Pro feature. Upgrade to unlock unlimited projects, PDF
          export, labor tracking, and more.
        </p>

        <div className="border rounded-lg p-4 space-y-2">
          <p className="font-medium">BoardFoot Pro</p>
          <p className="text-2xl font-bold">
            $9
            <span className="text-sm font-normal text-muted-foreground">
              /month
            </span>
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Unlimited projects</li>
            <li>✓ PDF export (clean, unbranded)</li>
            <li>✓ Labor & overhead tracking</li>
            <li>✓ Shopping list export</li>
            <li>✓ Unlimited photos</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <form
            action="/api/stripe/create-checkout"
            method="post"
            className="flex-1"
          >
            <Button type="submit" className="w-full cursor-pointer">
              Upgrade to Pro
            </Button>
          </form>
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}
