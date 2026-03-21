CREATE TABLE user_species_prices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species_name  TEXT NOT NULL,
  my_price      NUMERIC(10,2) NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, species_name)
);

ALTER TABLE user_species_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their price overrides"
  ON user_species_prices FOR ALL USING (auth.uid() = user_id);