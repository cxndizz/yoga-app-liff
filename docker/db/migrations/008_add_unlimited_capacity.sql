-- Migration: Add unlimited_capacity field for standalone courses
-- This allows courses to have unlimited enrollment slots (no max_students limit)
-- while still preventing duplicate purchases per user
DO $$
BEGIN
  -- Add unlimited_capacity column for standalone courses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'unlimited_capacity'
  ) THEN
    ALTER TABLE courses ADD COLUMN unlimited_capacity BOOLEAN DEFAULT false;

    -- Backfill existing courses as having limited capacity (false)
    UPDATE courses SET unlimited_capacity = false WHERE unlimited_capacity IS NULL;

    -- Set NOT NULL constraint after backfilling
    ALTER TABLE courses ALTER COLUMN unlimited_capacity SET NOT NULL;

    RAISE NOTICE 'Added unlimited_capacity column to courses table';
  ELSE
    -- Ensure default and backfill if column already exists
    ALTER TABLE courses ALTER COLUMN unlimited_capacity SET DEFAULT false;
    UPDATE courses SET unlimited_capacity = false WHERE unlimited_capacity IS NULL;

    -- Ensure NOT NULL constraint
    BEGIN
      ALTER TABLE courses ALTER COLUMN unlimited_capacity SET NOT NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Column unlimited_capacity is already NOT NULL';
    END;
  END IF;

  -- Create index for filtering unlimited capacity courses
  CREATE INDEX IF NOT EXISTS idx_courses_unlimited_capacity ON courses(unlimited_capacity);
  RAISE NOTICE 'Created index on courses.unlimited_capacity';

  -- Final verification
  PERFORM 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'unlimited_capacity';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column courses.unlimited_capacity is missing after migration!';
  END IF;

  RAISE NOTICE 'Unlimited capacity migration completed successfully!';
END $$;
