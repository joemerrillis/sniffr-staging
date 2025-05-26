-- Add phone, address, unit_access, lockbox_code, notes to users (idempotently)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='address'
  ) THEN
    ALTER TABLE users ADD COLUMN address JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='unit_access'
  ) THEN
    ALTER TABLE users ADD COLUMN unit_access TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='lockbox_code'
  ) THEN
    ALTER TABLE users ADD COLUMN lockbox_code TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='notes'
  ) THEN
    ALTER TABLE users ADD COLUMN notes TEXT;
  END IF;
END
$$;
