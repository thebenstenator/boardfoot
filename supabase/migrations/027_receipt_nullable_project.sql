-- Allow receipts to exist without a project (general pool).
-- Add user_id for direct RLS ownership check (needed when project_id is null).

ALTER TABLE project_receipts
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from the linked project
UPDATE project_receipts pr
SET user_id = p.user_id
FROM projects p
WHERE pr.project_id = p.id;

-- Now enforce NOT NULL and make project_id nullable
ALTER TABLE project_receipts
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN project_id DROP NOT NULL;

-- Replace the policy with a simpler direct ownership check
DROP POLICY "Users access their receipts" ON project_receipts;

CREATE POLICY "Users access their receipts"
  ON project_receipts FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users insert their receipts"
  ON project_receipts FOR INSERT
  WITH CHECK (user_id = auth.uid());
