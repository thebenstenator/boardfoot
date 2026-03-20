import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/client";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Use service role client — bypasses RLS for server-to-server calls
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const isActive =
        subscription.status === "active" || subscription.status === "trialing";

      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_tier: isActive ? "pro" : "free",
        })
        .eq("stripe_customer_id", customerId);

      if (error) console.error("Failed to update subscription tier:", error);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { error } = await supabase
        .from("profiles")
        .update({ subscription_tier: "free" })
        .eq("stripe_customer_id", customerId);

      if (error) console.error("Failed to revert subscription tier:", error);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
