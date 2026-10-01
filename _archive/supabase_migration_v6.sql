-- Add navigation_settings JSONB column to site_settings
DO $$ BEGIN
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS navigation_settings jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
