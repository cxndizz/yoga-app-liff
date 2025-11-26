-- Add QR check-in code to courses
DO $$
DECLARE
  rec RECORD;
  new_code TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'qr_checkin_code'
  ) THEN
    ALTER TABLE courses ADD COLUMN qr_checkin_code TEXT;
  END IF;

  -- Generate codes for existing courses
  FOR rec IN SELECT id FROM courses WHERE qr_checkin_code IS NULL LOOP
    new_code := md5(random()::text || clock_timestamp()::text);
    UPDATE courses SET qr_checkin_code = new_code WHERE id = rec.id;
  END LOOP;

  -- Ensure uniqueness
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_qr_checkin_code_key'
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT courses_qr_checkin_code_key UNIQUE (qr_checkin_code);
  END IF;
END $$;
