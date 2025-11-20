-- Migration: Ensure courses table has updated_at column
DO $$
BEGIN
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE courses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    UPDATE courses SET updated_at = NOW() WHERE updated_at IS NULL;
    RAISE NOTICE 'Added updated_at column to courses table';
  ELSE
    -- Ensure the column has a default and backfill any nulls
    ALTER TABLE courses ALTER COLUMN updated_at SET DEFAULT NOW();
    UPDATE courses SET updated_at = NOW() WHERE updated_at IS NULL;
  END IF;

  -- Verify column exists after migration
  PERFORM 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'updated_at';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column courses.updated_at is missing after migration!';
  END IF;

  RAISE NOTICE 'courses.updated_at verified successfully!';
END $$;
