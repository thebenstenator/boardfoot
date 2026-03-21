CREATE TABLE species_prices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_name  TEXT NOT NULL UNIQUE,
  price_low     NUMERIC(10,2),
  price_high    NUMERIC(10,2),
  notes         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Public read, no user filter needed
ALTER TABLE species_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read species prices"
  ON species_prices FOR SELECT USING (true);