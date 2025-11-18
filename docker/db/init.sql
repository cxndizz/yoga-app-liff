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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instructors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW()
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
