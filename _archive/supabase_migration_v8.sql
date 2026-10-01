-- ============================================================
-- JX Portfolio — Supabase Migration v8  (AUTHORITATIVE)
-- Aligns the database with the live v3.0 front-end + admin code.
-- Run this whole file in your Supabase SQL Editor. Idempotent.
--
-- WHY: the v3.0 app reads/writes columns and tables that
-- supabase_init.sql (v2.0) never created, so nothing loaded or
-- saved. This makes the DB match the code exactly.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROJECTS — every column the app actually uses
-- ------------------------------------------------------------
DO $$ BEGIN
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS title       text;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category    text;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS year        text;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority    integer DEFAULT 0;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS image_url   text;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tools       jsonb DEFAULT '[]'::jsonb;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS url         text;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS github_url  text;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description text;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS content     text;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS case_study  text;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS featured    boolean DEFAULT false;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now();

    -- Admin inserts send no id and no name → make them auto/optional
    ALTER TABLE public.projects ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    BEGIN
        ALTER TABLE public.projects ALTER COLUMN name DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ------------------------------------------------------------
-- 2. CONTACT_SUBMISSIONS — app writes project_type
-- ------------------------------------------------------------
DO $$ BEGIN
    ALTER TABLE public.contact_submissions ADD COLUMN IF NOT EXISTS project_type text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ------------------------------------------------------------
-- 3. SITE_SETTINGS — app uses a simple key/value store.
--    The old v2.0 single-row table is incompatible, so replace it
--    ONLY if it is still in the old shape (no `key` column).
--    NOTE: this drops the old table, which the app never read from.
-- ------------------------------------------------------------
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'key'
    ) THEN
        DROP TABLE public.site_settings CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.site_settings (
    key        text PRIMARY KEY,
    value      text,
    updated_at timestamptz DEFAULT now()
);

-- Seed availability so the HUD + nav have something to read
INSERT INTO public.site_settings (key, value)
VALUES ('availability_status', 'available')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE public.projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings       ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    -- PROJECTS: world-readable, only authenticated may write
    DROP POLICY IF EXISTS "projects_select" ON public.projects;
    CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (true);
    DROP POLICY IF EXISTS "projects_write" ON public.projects;
    CREATE POLICY "projects_write" ON public.projects FOR ALL
        USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

    -- CONTACT: anyone may submit, only authenticated may read/manage
    DROP POLICY IF EXISTS "contact_insert" ON public.contact_submissions;
    CREATE POLICY "contact_insert" ON public.contact_submissions FOR INSERT WITH CHECK (true);
    DROP POLICY IF EXISTS "contact_read" ON public.contact_submissions;
    CREATE POLICY "contact_read" ON public.contact_submissions FOR SELECT USING (auth.role() = 'authenticated');
    DROP POLICY IF EXISTS "contact_manage" ON public.contact_submissions;
    CREATE POLICY "contact_manage" ON public.contact_submissions FOR UPDATE USING (auth.role() = 'authenticated');

    -- SETTINGS: world-readable, only authenticated may change
    DROP POLICY IF EXISTS "settings_select" ON public.site_settings;
    CREATE POLICY "settings_select" ON public.site_settings FOR SELECT USING (true);
    DROP POLICY IF EXISTS "settings_write" ON public.site_settings;
    CREATE POLICY "settings_write" ON public.site_settings FOR ALL
        USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
END $$;
