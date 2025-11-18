-- Migration: Add missing tables and ensure schema is up to date
-- This script safely adds missing tables if they don't exist

-- Ensure courses table has status column (should already exist, but adding if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'status'
  ) THEN
    ALTER TABLE courses ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'published';
    CREATE INDEX idx_courses_status ON courses(status);
  END IF;
END $$;

-- Create course_sessions table if not exists
CREATE TABLE IF NOT EXISTS course_sessions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  session_name VARCHAR(255),
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  day_of_week VARCHAR(20),
  max_capacity INTEGER,
  current_enrollments INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for course_sessions if not exists
CREATE INDEX IF NOT EXISTS idx_course_sessions_course ON course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_date ON course_sessions(start_date);

-- Create course_enrollments table if not exists
CREATE TABLE IF NOT EXISTS course_enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES course_sessions(id) ON DELETE SET NULL,
  order_id INTEGER REFERENCES orders(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active',
  remaining_access INTEGER,
  last_attended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id, session_id)
);

-- Create indexes for course_enrollments if not exists
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);

-- Verify all required columns exist
DO $$
BEGIN
  -- Verify courses.status exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'status'
  ) THEN
    RAISE EXCEPTION 'Column courses.status is missing!';
  END IF;

  -- Verify course_sessions exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'course_sessions'
  ) THEN
    RAISE EXCEPTION 'Table course_sessions is missing!';
  END IF;

  -- Verify course_enrollments exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'course_enrollments'
  ) THEN
    RAISE EXCEPTION 'Table course_enrollments is missing!';
  END IF;

  RAISE NOTICE 'All required tables and columns verified successfully!';
END $$;
