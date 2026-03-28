CREATE TABLE cut_parts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label        TEXT NOT NULL DEFAULT '',
  thickness_in NUMERIC(6,3) NOT NULL DEFAULT 0.75,
  width_in     NUMERIC(6,3) NOT NULL DEFAULT 3.5,
  length_in    NUMERIC(8,3) NOT NULL DEFAULT 24,
  quantity     INTEGER NOT NULL DEFAULT 1,
  notes        TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cut_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their cut parts"
  ON cut_parts FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
