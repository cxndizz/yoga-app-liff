-- Migration: Add course_type to support standalone and scheduled courses
-- This allows courses to either have sessions (scheduled) or be directly enrollable (standalone)
DO $$
BEGIN
  -- Add course_type column for differentiating between standalone and scheduled courses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'course_type'
  ) THEN
    ALTER TABLE courses ADD COLUMN course_type VARCHAR(50) DEFAULT 'scheduled';

    -- Backfill existing courses as 'scheduled' for backward compatibility
    UPDATE courses SET course_type = 'scheduled' WHERE course_type IS NULL;

    -- Add constraint to ensure only valid values
    ALTER TABLE courses ADD CONSTRAINT courses_type_check
      CHECK (course_type IN ('standalone', 'scheduled'));

    RAISE NOTICE 'Added course_type column to courses table';
  ELSE
    -- Ensure default and backfill
    ALTER TABLE courses ALTER COLUMN course_type SET DEFAULT 'scheduled';
    UPDATE courses SET course_type = 'scheduled' WHERE course_type IS NULL;

    -- Add constraint if it doesn't exist
    BEGIN
      ALTER TABLE courses ADD CONSTRAINT courses_type_check
        CHECK (course_type IN ('standalone', 'scheduled'));
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Constraint courses_type_check already exists';
    END;
  END IF;

  -- Add max_students column for standalone courses (total enrollment limit)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'max_students'
  ) THEN
    ALTER TABLE courses ADD COLUMN max_students INTEGER;
    RAISE NOTICE 'Added max_students column to courses table';
  END IF;

  -- Add enrollment_deadline column for standalone courses (optional)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'enrollment_deadline'
  ) THEN
    ALTER TABLE courses ADD COLUMN enrollment_deadline TIMESTAMPTZ;
    RAISE NOTICE 'Added enrollment_deadline column to courses table';
  END IF;

  -- Create index on course_type for faster filtering
  CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(course_type);
  RAISE NOTICE 'Created index on courses.course_type';

  -- Create index on enrollment_deadline for filtering active courses
  CREATE INDEX IF NOT EXISTS idx_courses_enrollment_deadline ON courses(enrollment_deadline);
  RAISE NOTICE 'Created index on courses.enrollment_deadline';

  -- Final verification
  PERFORM 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'course_type';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column courses.course_type is missing after migration!';
  END IF;

  PERFORM 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'max_students';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column courses.max_students is missing after migration!';
  END IF;

  PERFORM 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'enrollment_deadline';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column courses.enrollment_deadline is missing after migration!';
  END IF;

  RAISE NOTICE 'Course type schema migration completed successfully!';
END $$;
