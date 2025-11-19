-- Migration: ensure course_sessions records store branch and instructor references
-- Adds branch_id and instructor_id columns (if missing), backfills from courses,
-- and creates supporting indexes for faster filtering

ALTER TABLE course_sessions
  ADD COLUMN IF NOT EXISTS instructor_id INTEGER REFERENCES instructors(id),
  ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id);

-- Backfill existing sessions with data from the parent course
UPDATE course_sessions cs
SET instructor_id = c.instructor_id
FROM courses c
WHERE cs.course_id = c.id AND cs.instructor_id IS NULL;

UPDATE course_sessions cs
SET branch_id = c.branch_id
FROM courses c
WHERE cs.course_id = c.id AND cs.branch_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_course_sessions_instructor ON course_sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_branch ON course_sessions(branch_id);
