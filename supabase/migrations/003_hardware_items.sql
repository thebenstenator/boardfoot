CREATE TABLE hardware_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description   TEXT NOT NULL DEFAULT '',
  quantity      NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit          TEXT NOT NULL DEFAULT 'each',
  unit_cost     NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes         TEXT NOT NULL DEFAULT '',
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hardware_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their hardware items"
  ON hardware_items FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );