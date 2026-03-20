"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  const { tier, isPro } = useSubscription();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      {isPro ? (
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">BoardFoot Pro</p>
              <p className="text-sm text-muted-foreground">$9/month</p>
            </div>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            You have access to all Pro features including unlimited projects,
            PDF export, and labor tracking.
          </p>
          <form action="/api/stripe/portal" method="post">
            <Button variant="outline" type="submit" className="cursor-pointer">
              Manage subscription
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <p className="font-semibold">Free Plan</p>
              <p className="text-sm text-muted-foreground">
                3 projects, branded PDF export
              </p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ 3 saved projects</li>
              <li>✓ Full BOM calculator</li>
              <li>✓ Branded PDF export</li>
              <li>✗ Labor & overhead tracking</li>
              <li>✗ Shopping list export</li>
              <li>✗ Unlimited projects</li>
            </ul>
          </div>

          <div className="border border-primary rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">BoardFoot Pro</p>
                <p className="text-2xl font-bold mt-1">
                  $9
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </p>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Recommended
              </span>
            </div>
            <ul className="text-sm space-y-1">
              <li>✓ Unlimited projects</li>
              <li>✓ Clean unbranded PDF export</li>
              <li>✓ Labor & overhead tracking</li>
              <li>✓ Shopping list export</li>
              <li>✓ Unlimited photos</li>
            </ul>
            <form action="/api/stripe/create-checkout" method="post">
              <Button type="submit" className="w-full cursor-pointer">
                Upgrade to Pro — $9/month
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
