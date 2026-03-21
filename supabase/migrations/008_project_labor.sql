CREATE TABLE project_labor (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  hourly_rate   NUMERIC(10,2),
  estimated_hrs NUMERIC(8,2) DEFAULT 0,
  target_margin NUMERIC(4,3) DEFAULT 0.30,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_labor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their project labor"
  ON project_labor FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );