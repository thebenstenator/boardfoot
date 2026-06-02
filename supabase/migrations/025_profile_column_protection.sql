-- Prevent authenticated (browser) clients from writing privileged profile columns.
--
-- The overhead settings page legitimately updates:
--   hourly_rate, monthly_overhead, projects_per_month, tax_rate, display_name
-- The demo route legitimately updates:
--   has_seen_demo
--
-- Everything else must only be written by:
--   subscription_tier, stripe_customer_id  → Stripe webhook (service_role)
--   ai_generations_used                    → try_increment_ai_generation() RPC (SECURITY DEFINER)
--   last_feedback_sent_at                  → record_feedback_sent() RPC below (SECURITY DEFINER)
--   created_at                             → set on insert, never changed

REVOKE UPDATE(subscription_tier, stripe_customer_id, ai_generations_used, last_feedback_sent_at, created_at)
  ON public.profiles
  FROM authenticated;

-- SECURITY DEFINER function so the feedback route can stamp the rate-limit
-- timestamp without needing direct UPDATE access to the protected column.
CREATE OR REPLACE FUNCTION public.record_feedback_sent(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET last_feedback_sent_at = NOW()
  WHERE id = user_uuid;
END;
$$;

-- Only authenticated users may call this; anon cannot send feedback at all.
REVOKE EXECUTE ON FUNCTION public.record_feedback_sent(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.record_feedback_sent(uuid) TO authenticated;
