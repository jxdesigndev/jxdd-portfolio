-- ============================================================
-- JX Portfolio — Supabase Migration v3.0
-- Migrating Services, Hero, About, and Template to Supabase
-- ============================================================

-- 1. Create services table
CREATE TABLE IF NOT EXISTS public.services (
    id text primary key,
    name text not null,
    icon text default '',
    headline text,
    "desc" text,
    tools text[],
    status text default 'Available',
    steps jsonb default '[]'::jsonb
);

-- 2. Add content columns to site_settings
DO $$ BEGIN
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_content jsonb;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS about_content jsonb;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS template_content jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ============================================================
-- ROW LEVEL SECURITY FOR SERVICES
-- ============================================================

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    -- SERVICES POLICIES
    DROP POLICY IF EXISTS "Services are viewable by everyone." ON public.services;
    CREATE POLICY "Services are viewable by everyone." ON public.services FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Only authenticated users can insert services" ON public.services;
    CREATE POLICY "Only authenticated users can insert services" ON public.services FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Only authenticated users can update services" ON public.services;
    CREATE POLICY "Only authenticated users can update services" ON public.services FOR UPDATE USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Only authenticated users can delete services" ON public.services;
    CREATE POLICY "Only authenticated users can delete services" ON public.services FOR DELETE USING (auth.role() = 'authenticated');
END $$;
