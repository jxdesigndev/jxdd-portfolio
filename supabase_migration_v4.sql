-- ============================================================
-- JX Portfolio — Supabase Migration v4.0
-- Adding social platform columns for Dribbble, Instagram,
-- Contra, and Upwork to site_settings
-- ============================================================

DO $$ BEGIN
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS dribbble text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS instagram text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contra text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS upwork text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
