-- Migration: Fix branches table schema
-- Add missing map_url column to branches table if it doesn't exist

DO $$
BEGIN
  -- Add map_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'map_url'
  ) THEN
    ALTER TABLE branches ADD COLUMN map_url TEXT;
    RAISE NOTICE 'Added map_url column to branches table';
  ELSE
    RAISE NOTICE 'map_url column already exists in branches table';
  END IF;

  -- Verify all required columns exist in branches table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'name'
  ) THEN
    RAISE EXCEPTION 'Column branches.name is missing!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'address'
  ) THEN
    RAISE EXCEPTION 'Column branches.address is missing!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'phone'
  ) THEN
    RAISE EXCEPTION 'Column branches.phone is missing!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'is_active'
  ) THEN
    RAISE EXCEPTION 'Column branches.is_active is missing!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'created_at'
  ) THEN
    RAISE EXCEPTION 'Column branches.created_at is missing!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'updated_at'
  ) THEN
    RAISE EXCEPTION 'Column branches.updated_at is missing!';
  END IF;

  -- Now verify map_url exists after potential addition
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'map_url'
  ) THEN
    RAISE EXCEPTION 'Column branches.map_url is still missing after migration!';
  END IF;

  RAISE NOTICE 'All required columns in branches table verified successfully!';
END $$;
