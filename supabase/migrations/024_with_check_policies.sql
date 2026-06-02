-- Add explicit WITH CHECK to all FOR ALL policies.
--
-- Without WITH CHECK, PostgreSQL only enforces the USING predicate on SELECT /
-- UPDATE (old row) / DELETE. INSERT and UPDATE (new row) have NO constraint,
-- meaning a user could INSERT a lumber_item with any project_id (even one they
-- don't own), or UPDATE an item to point at another user's project.
--
-- WITH CHECK (same expression as USING) closes both gaps.

-- projects: prevent inserting/updating a project with a different user_id
ALTER POLICY "Users own their projects"
  ON projects
  WITH CHECK (auth.uid() = user_id);

-- lumber_items
ALTER POLICY "Users access their lumber items"
  ON lumber_items
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- hardware_items
ALTER POLICY "Users access their hardware items"
  ON hardware_items
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- finish_items
ALTER POLICY "Users access their finish items"
  ON finish_items
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- project_labor
ALTER POLICY "Users access their project labor"
  ON project_labor
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- project_photos
ALTER POLICY "Users access their photos"
  ON project_photos
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- cut_parts
ALTER POLICY "Users access their cut parts"
  ON cut_parts
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- user_species_prices
ALTER POLICY "Users own their price overrides"
  ON user_species_prices
  WITH CHECK (auth.uid() = user_id);

-- profiles UPDATE: belt-and-suspenders alongside the column REVOKE in 025
ALTER POLICY "Users can update their own profile"
  ON profiles
  WITH CHECK (auth.uid() = id);

-- email_subscribers: belt-and-suspenders on top of USING (false)
-- Revoke any direct table access from client roles so it truly is service-role-only.
REVOKE ALL ON email_subscribers FROM anon, authenticated;
