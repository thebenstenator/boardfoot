import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { PRO_MONTHLY_PRICE_ID } from "@/lib/stripe/plans";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, subscription_tier")
    .eq("id", user.id)
    .single();

  // If already pro, redirect to portal instead
  if (profile?.subscription_tier === "pro") {
    return NextResponse.redirect(new URL("/api/stripe/portal", request.url), {
      status: 303,
    });
  }

  // Create or reuse Stripe customer
  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: PRO_MONTHLY_PRICE_ID,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=cancelled`,
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
