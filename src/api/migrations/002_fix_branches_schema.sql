-- Migration: Fix branches table schema
-- Ensure all required columns exist on branches table and add missing ones safely

DO $$
BEGIN
  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'address'
  ) THEN
    ALTER TABLE branches ADD COLUMN address TEXT;
    RAISE NOTICE 'Added address column to branches table';
  ELSE
    RAISE NOTICE 'address column already exists in branches table';
  END IF;

  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'phone'
  ) THEN
    ALTER TABLE branches ADD COLUMN phone VARCHAR(50);
    RAISE NOTICE 'Added phone column to branches table';
  ELSE
    RAISE NOTICE 'phone column already exists in branches table';
  END IF;

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

  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE branches ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    UPDATE branches SET is_active = TRUE WHERE is_active IS NULL;
    RAISE NOTICE 'Added is_active column to branches table';
  ELSE
    RAISE NOTICE 'is_active column already exists in branches table';
  END IF;

  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE branches ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    UPDATE branches SET created_at = NOW() WHERE created_at IS NULL;
    RAISE NOTICE 'Added created_at column to branches table';
  ELSE
    RAISE NOTICE 'created_at column already exists in branches table';
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE branches ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    UPDATE branches SET updated_at = NOW() WHERE updated_at IS NULL;
    RAISE NOTICE 'Added updated_at column to branches table';
  ELSE
    RAISE NOTICE 'updated_at column already exists in branches table';
  END IF;

  -- Verify required columns that should already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'name'
  ) THEN
    RAISE EXCEPTION 'Column branches.name is missing!';
  END IF;

  -- Verify address column exists (after potential addition)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'address'
  ) THEN
    RAISE EXCEPTION 'Column branches.address is missing!';
  END IF;

  -- Verify phone column exists (after potential addition)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'phone'
  ) THEN
    RAISE EXCEPTION 'Column branches.phone is missing!';
  END IF;

  -- Verify is_active column exists (after potential addition)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'is_active'
  ) THEN
    RAISE EXCEPTION 'Column branches.is_active is missing!';
  END IF;

  -- Verify created_at column exists (after potential addition)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'created_at'
  ) THEN
    RAISE EXCEPTION 'Column branches.created_at is missing!';
  END IF;

  -- Verify updated_at column exists (after potential addition)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'updated_at'
  ) THEN
    RAISE EXCEPTION 'Column branches.updated_at is missing!';
  END IF;

  -- Verify map_url exists (after potential addition)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'map_url'
  ) THEN
    RAISE EXCEPTION 'Column branches.map_url is still missing after migration!';
  END IF;

  RAISE NOTICE 'All required columns in branches table verified successfully!';
END $$;
