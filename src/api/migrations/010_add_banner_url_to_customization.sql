-- Migration: Add banner image support to app_customization

ALTER TABLE app_customization
  ADD COLUMN IF NOT EXISTS banner_url TEXT;
