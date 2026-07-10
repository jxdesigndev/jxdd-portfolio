-- ============================================================
-- JX Portfolio — Supabase Migration v5
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add global_styles JSONB column to site_settings
DO $$ BEGIN
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS global_styles jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
