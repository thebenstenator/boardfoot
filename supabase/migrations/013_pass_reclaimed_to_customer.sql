ALTER TABLE projects ADD COLUMN IF NOT EXISTS pass_reclaimed_to_customer BOOLEAN NOT NULL DEFAULT false;
