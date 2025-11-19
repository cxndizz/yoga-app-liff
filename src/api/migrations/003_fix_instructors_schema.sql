-- Migration: Ensure instructors table contains all fields required by the admin UI
-- This adds any missing optional columns and enforces sane defaults so INSERT/UPDATE statements succeed

DO $$
BEGIN
  -- Add email column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructors' AND column_name = 'email'
  ) THEN
    ALTER TABLE instructors ADD COLUMN email VARCHAR(255);
    RAISE NOTICE 'Added email column to instructors table';
  ELSE
    RAISE NOTICE 'email column already exists in instructors table';
  END IF;

  -- Add phone column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructors' AND column_name = 'phone'
  ) THEN
    ALTER TABLE instructors ADD COLUMN phone VARCHAR(50);
    RAISE NOTICE 'Added phone column to instructors table';
  ELSE
    RAISE NOTICE 'phone column already exists in instructors table';
  END IF;

  -- Add specialties column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructors' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE instructors ADD COLUMN specialties TEXT[] DEFAULT ARRAY[]::TEXT[];
    UPDATE instructors SET specialties = ARRAY[]::TEXT[] WHERE specialties IS NULL;
    RAISE NOTICE 'Added specialties column to instructors table';
  ELSE
    -- Ensure the column always has a default empty array
    ALTER TABLE instructors ALTER COLUMN specialties SET DEFAULT ARRAY[]::TEXT[];
    UPDATE instructors SET specialties = ARRAY[]::TEXT[] WHERE specialties IS NULL;
    RAISE NOTICE 'specialties column already exists – default enforced';
  END IF;

  -- Add is_active column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructors' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE instructors ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    UPDATE instructors SET is_active = TRUE WHERE is_active IS NULL;
    RAISE NOTICE 'Added is_active column to instructors table';
  ELSE
    ALTER TABLE instructors ALTER COLUMN is_active SET DEFAULT TRUE;
    UPDATE instructors SET is_active = TRUE WHERE is_active IS NULL;
    RAISE NOTICE 'is_active column already exists – default enforced';
  END IF;

  -- Add created_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructors' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE instructors ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    UPDATE instructors SET created_at = NOW() WHERE created_at IS NULL;
    RAISE NOTICE 'Added created_at column to instructors table';
  ELSE
    ALTER TABLE instructors ALTER COLUMN created_at SET DEFAULT NOW();
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructors' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE instructors ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    UPDATE instructors SET updated_at = NOW() WHERE updated_at IS NULL;
    RAISE NOTICE 'Added updated_at column to instructors table';
  ELSE
    ALTER TABLE instructors ALTER COLUMN updated_at SET DEFAULT NOW();
  END IF;

  -- Final verification
  PERFORM 1 FROM information_schema.columns WHERE table_name = 'instructors' AND column_name = 'email';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column instructors.email is missing after migration!';
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'instructors' AND column_name = 'phone';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column instructors.phone is missing after migration!';
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'instructors' AND column_name = 'specialties';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column instructors.specialties is missing after migration!';
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'instructors' AND column_name = 'is_active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column instructors.is_active is missing after migration!';
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'instructors' AND column_name = 'created_at';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column instructors.created_at is missing after migration!';
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'instructors' AND column_name = 'updated_at';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column instructors.updated_at is missing after migration!';
  END IF;

  RAISE NOTICE 'All required instructor columns verified successfully!';
END $$;
