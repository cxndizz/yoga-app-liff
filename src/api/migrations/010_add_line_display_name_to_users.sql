-- Add line_display_name to users to separate LINE display names from real names
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'line_display_name'
  ) THEN
    ALTER TABLE users ADD COLUMN line_display_name VARCHAR(255);
  END IF;
END $$;

-- Backfill line display names from full_name when missing
UPDATE users
SET line_display_name = full_name
WHERE (line_display_name IS NULL OR line_display_name = '')
  AND full_name IS NOT NULL;
