-- Receipt storage for tracking purchase taxes paid (Pro feature).
-- Receipts are per-project; files live in the project-receipts storage bucket.

CREATE TABLE project_receipts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  amount        NUMERIC(10,2),     -- total receipt amount
  tax_amount    NUMERIC(10,2),     -- taxes paid on this receipt
  receipt_date  DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their receipts"
  ON project_receipts FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Storage bucket: project-receipts (private, owner-only)
-- Run this or create via Supabase dashboard / CLI:
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-receipts', 'project-receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "receipts owner upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "receipts owner read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "receipts owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
