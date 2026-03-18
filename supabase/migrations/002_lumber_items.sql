CREATE TABLE lumber_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  species         TEXT,
  thickness_in    NUMERIC(6,3) NOT NULL DEFAULT 1.0,
  width_in        NUMERIC(6,3) NOT NULL DEFAULT 6.0,
  length_ft       NUMERIC(8,3) NOT NULL DEFAULT 8.0,
  length_unit     TEXT NOT NULL DEFAULT 'ft' CHECK (length_unit IN ('ft', 'in')),
  quantity        INTEGER NOT NULL DEFAULT 1,
  pricing_mode    TEXT DEFAULT 'per_bf' CHECK (pricing_mode IN ('per_bf', 'per_lf')),
  price_per_unit  NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_reclaimed    BOOLEAN DEFAULT FALSE,
  waste_override  NUMERIC(4,3),
  notes           TEXT NOT NULL DEFAULT '',
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lumber_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their lumber items"
  ON lumber_items FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );