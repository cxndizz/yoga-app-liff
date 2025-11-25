-- Migration: Add app_customization table for branding settings
-- This table stores customization settings for the LIFF app

CREATE TABLE IF NOT EXISTS app_customization (
  id SERIAL PRIMARY KEY,
  app_name VARCHAR(255) NOT NULL DEFAULT 'Yoga Luxe',
  app_description VARCHAR(500) DEFAULT 'Boutique LIFF Studio',
  logo_url TEXT,
  logo_initials VARCHAR(10) DEFAULT 'YL',
  primary_color VARCHAR(50) DEFAULT '#0b1a3c',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_customization (app_name, app_description, logo_initials)
VALUES ('Yoga Luxe', 'Boutique LIFF Studio', 'YL')
ON CONFLICT DO NOTHING;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_customization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_app_customization_updated_at
  BEFORE UPDATE ON app_customization
  FOR EACH ROW
  EXECUTE FUNCTION update_app_customization_updated_at();
