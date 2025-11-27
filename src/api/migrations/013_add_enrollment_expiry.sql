-- Add countdown-based expiry tracking for enrollments
ALTER TABLE course_enrollments
  ADD COLUMN IF NOT EXISTS first_attended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_enrollments_expires_at ON course_enrollments(expires_at);
