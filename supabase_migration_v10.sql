-- ============================================================
-- JX Portfolio — Supabase Migration v10
-- Adds the `tools` table for the Tech Stack / Tools system.
-- Run this entire file in your Supabase SQL Editor.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- ------------------------------------------------------------
-- 1. CREATE tools TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tools (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name        text NOT NULL,
    logo_url    text,
    category    text,           -- e.g. 'design' | 'dev' | 'automation' | 'security' | 'other'
    priority    integer DEFAULT 0,
    is_active   boolean DEFAULT true,
    created_at  timestamptz DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. ROW LEVEL SECURITY
--    Matches the exact pattern used for the experience table:
--    public SELECT, authenticated-only write (single ALL policy)
-- ------------------------------------------------------------
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    -- Public SELECT — anyone can read the tools list
    DROP POLICY IF EXISTS "tools_select" ON public.tools;
    CREATE POLICY "tools_select" ON public.tools FOR SELECT USING (true);

    -- Authenticated-only INSERT / UPDATE / DELETE
    DROP POLICY IF EXISTS "tools_write" ON public.tools;
    CREATE POLICY "tools_write" ON public.tools FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
END $$;
