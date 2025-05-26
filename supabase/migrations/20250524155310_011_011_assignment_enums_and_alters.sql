-- assignment_source ENUM
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_source') THEN
    CREATE TYPE assignment_source AS ENUM ('tenant','owner');
  END IF;
END
$$;

-- Add columns to dog_assignments
ALTER TABLE dog_assignments
  ADD COLUMN IF NOT EXISTS source assignment_source NOT NULL DEFAULT 'tenant',
  ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 100;

-- One-tenant-default per dog index
CREATE UNIQUE INDEX IF NOT EXISTS one_tenant_default_per_dog
  ON dog_assignments(dog_id)
  WHERE source = 'tenant' AND end_date IS NULL AND priority = 1;

-- One-owner-default per dog index
CREATE UNIQUE INDEX IF NOT EXISTS one_owner_default_per_dog
  ON dog_assignments(dog_id)
  WHERE source = 'owner' AND end_date IS NULL AND priority = 1;
