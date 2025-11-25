-- Migration: Add secondary and background theme colors to app_customization

ALTER TABLE app_customization
  ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(50) DEFAULT '#4cafb9';

ALTER TABLE app_customization
  ADD COLUMN IF NOT EXISTS background_color VARCHAR(50) DEFAULT '#f7f8fb';
