-- Migration: Ensure courses table has all fields used by the API
DO $$
BEGIN
  -- channel column for delivery mode
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'channel'
  ) THEN
    ALTER TABLE courses ADD COLUMN channel VARCHAR(50) DEFAULT 'offline';
    UPDATE courses SET channel = 'offline' WHERE channel IS NULL;
    RAISE NOTICE 'Added channel column to courses table';
  ELSE
    UPDATE courses SET channel = COALESCE(channel, 'offline');
  END IF;

  -- access_times column to track how many times a learner can access the course
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'access_times'
  ) THEN
    ALTER TABLE courses ADD COLUMN access_times INTEGER NOT NULL DEFAULT 1;
    UPDATE courses SET access_times = 1 WHERE access_times IS NULL;
    RAISE NOTICE 'Added access_times column to courses table';
  ELSE
    ALTER TABLE courses ALTER COLUMN access_times SET DEFAULT 1;
    UPDATE courses SET access_times = 1 WHERE access_times IS NULL;
  END IF;

  -- duration_minutes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE courses ADD COLUMN duration_minutes INTEGER;
    RAISE NOTICE 'Added duration_minutes column to courses table';
  END IF;

  -- level column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'level'
  ) THEN
    ALTER TABLE courses ADD COLUMN level VARCHAR(50);
    RAISE NOTICE 'Added level column to courses table';
  END IF;

  -- tags column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'tags'
  ) THEN
    ALTER TABLE courses ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];
    UPDATE courses SET tags = ARRAY[]::TEXT[] WHERE tags IS NULL;
    RAISE NOTICE 'Added tags column to courses table';
  ELSE
    ALTER TABLE courses ALTER COLUMN tags SET DEFAULT ARRAY[]::TEXT[];
    UPDATE courses SET tags = ARRAY[]::TEXT[] WHERE tags IS NULL;
  END IF;

  -- is_featured column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE courses ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE;
    UPDATE courses SET is_featured = FALSE WHERE is_featured IS NULL;
    RAISE NOTICE 'Added is_featured column to courses table';
  ELSE
    ALTER TABLE courses ALTER COLUMN is_featured SET DEFAULT FALSE;
    UPDATE courses SET is_featured = FALSE WHERE is_featured IS NULL;
  END IF;

  -- Final verification
  PERFORM 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'channel';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column courses.channel is missing after migration!';
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'access_times';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column courses.access_times is missing after migration!';
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'duration_minutes';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column courses.duration_minutes is missing after migration!';
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'level';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column courses.level is missing after migration!';
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'tags';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column courses.tags is missing after migration!';
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_featured';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column courses.is_featured is missing after migration!';
  END IF;

  RAISE NOTICE 'Courses schema verified successfully!';
END $$;
