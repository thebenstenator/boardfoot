ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Allow anyone to read public projects
CREATE POLICY "Public projects are viewable by anyone"
  ON projects FOR SELECT
  USING (is_public = true);

-- Allow anyone to read line items of public projects
CREATE POLICY "Lumber items of public projects are viewable"
  ON lumber_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = lumber_items.project_id AND projects.is_public = true)
  );

CREATE POLICY "Hardware items of public projects are viewable"
  ON hardware_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = hardware_items.project_id AND projects.is_public = true)
  );

CREATE POLICY "Finish items of public projects are viewable"
  ON finish_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = finish_items.project_id AND projects.is_public = true)
  );
