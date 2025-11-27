-- Add course_checkin_logs table to keep scan history
CREATE TABLE IF NOT EXISTS course_checkin_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id INTEGER REFERENCES course_enrollments(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES course_sessions(id) ON DELETE SET NULL,
  attended_at TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(50),
  raw_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkin_logs_user ON course_checkin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_logs_course ON course_checkin_logs(course_id);
CREATE INDEX IF NOT EXISTS idx_checkin_logs_enrollment ON course_checkin_logs(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_checkin_logs_attended_at ON course_checkin_logs(attended_at DESC);
