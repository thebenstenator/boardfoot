-- Atomically check and increment ai_generations_used for free users.
-- Returns true if the request is allowed (incremented, or user is not on free tier).
-- Returns false if the free-tier limit has been reached.
-- Using a single UPDATE prevents the read-increment-write race condition.
CREATE OR REPLACE FUNCTION try_increment_ai_generation(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_updated integer;
BEGIN
  -- Atomic: only updates if the user is on the free tier AND under the limit.
  UPDATE profiles
  SET ai_generations_used = ai_generations_used + 1
  WHERE id = user_uuid
    AND subscription_tier = 'free'
    AND ai_generations_used < 5;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  -- A row was updated → free user who was under the limit. Allow.
  IF rows_updated > 0 THEN
    RETURN true;
  END IF;

  -- No row updated: either the user is not free (allow without incrementing)
  -- or they are free but at the limit (deny).
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid
      AND subscription_tier != 'free'
  );
END;
$$;
