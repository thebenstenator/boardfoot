CREATE TABLE finish_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description     TEXT NOT NULL DEFAULT '',
  container_cost  NUMERIC(10,2) NOT NULL DEFAULT 0,
  fraction_used   NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  notes           TEXT NOT NULL DEFAULT '',
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE finish_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their finish items"
  ON finish_items FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );