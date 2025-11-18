CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  line_user_id VARCHAR(128) UNIQUE,
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff',
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_users (email, full_name, password_hash, role, permissions)
SELECT 'admin@yoga.local', 'Default Admin',
       'f06db095439d2679fde2f373031ba1aa:f1187743adaa9c286e1bb0625dbea07e806fcf931cd7e10274c2db1b83cb6952c102eaa653edb4ac9141a6c5c7f29944b59e93bd86379fbe19b03ef8997459a8',
       'super_admin', ARRAY['*']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@yoga.local');

CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  map_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instructors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  specialties TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  branch_id INTEGER REFERENCES branches(id),
  instructor_id INTEGER REFERENCES instructors(id),
  capacity INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  price_cents INTEGER NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  access_times INTEGER NOT NULL DEFAULT 1,
  channel VARCHAR(50) DEFAULT 'offline',
  status VARCHAR(50) NOT NULL DEFAULT 'published',
  duration_minutes INTEGER,
  level VARCHAR(50),
  tags TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  total_price_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  omise_charge_id VARCHAR(255),
  amount_cents INTEGER,
  currency VARCHAR(16),
  status VARCHAR(32),
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Sessions (รอบเรียน)
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

-- Course Enrollments (การลงทะเบียนเรียน)
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

-- Content Pages (หน้า Content Management)
CREATE TABLE IF NOT EXISTS content_pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  meta_description TEXT,
  page_type VARCHAR(50) DEFAULT 'general',
  is_published BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings (ตั้งค่าระบบ)
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default content pages
INSERT INTO content_pages (slug, title, content, page_type, display_order)
SELECT 'how-to-use', 'วิธีใช้งาน', 'เนื้อหาวิธีใช้งานระบบ', 'guide', 1
WHERE NOT EXISTS (SELECT 1 FROM content_pages WHERE slug = 'how-to-use');

INSERT INTO content_pages (slug, title, content, page_type, display_order)
SELECT 'contact-us', 'ติดต่อเรา', 'ข้อมูลติดต่อ', 'contact', 2
WHERE NOT EXISTS (SELECT 1 FROM content_pages WHERE slug = 'contact-us');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public)
SELECT 'site_name', 'Yoga Studio', 'string', 'ชื่อเว็บไซต์', true
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE setting_key = 'site_name');

INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public)
SELECT 'contact_email', 'info@yoga.local', 'string', 'อีเมลติดต่อ', true
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE setting_key = 'contact_email');

INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public)
SELECT 'contact_phone', '02-xxx-xxxx', 'string', 'เบอร์โทรติดต่อ', true
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE setting_key = 'contact_phone');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_branch ON courses(branch_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_course ON course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_date ON course_sessions(start_date);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
