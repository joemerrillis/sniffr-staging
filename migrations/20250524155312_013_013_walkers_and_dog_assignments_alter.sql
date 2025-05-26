-- Update dog_assignments to use employees as walker_id
ALTER TABLE dog_assignments
  DROP CONSTRAINT IF EXISTS dog_assignments_walker_id_fkey,
  DROP COLUMN    IF EXISTS walker_id;

ALTER TABLE dog_assignments
  ADD COLUMN IF NOT EXISTS walker_id UUID
    REFERENCES employees(id) ON DELETE CASCADE;

-- Walks: Add requested_start, requested_end, is_confirmed, client_id
ALTER TABLE walks
  ADD COLUMN IF NOT EXISTS requested_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_end   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_confirmed    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Allow scheduled_at to be nullable
ALTER TABLE walks
  ALTER COLUMN scheduled_at DROP NOT NULL;
