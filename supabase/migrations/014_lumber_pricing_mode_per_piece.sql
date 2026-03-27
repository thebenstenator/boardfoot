-- Add per_piece to the pricing_mode check constraint on lumber_items
ALTER TABLE lumber_items DROP CONSTRAINT IF EXISTS lumber_items_pricing_mode_check;
ALTER TABLE lumber_items ADD CONSTRAINT lumber_items_pricing_mode_check
  CHECK (pricing_mode IN ('per_bf', 'per_lf', 'per_piece'));
