-- ============================================================
-- JX Portfolio — Supabase Schema v2.0
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id text primary key,
    name text not null,
    category text,
    status text,
    "shortDesc" text,
    tools jsonb,
    story jsonb,
    image text,
    gradient text,
    client text,
    flag text,
    url text,
    featured boolean default false,
    priority integer default 5,
    date text,
    "lastUpdated" text
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id text primary key,
    name text not null,
    icon text default '📁',
    available boolean default true,
    "desc" text
);

-- Create site_settings table (expanded with all fields)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id integer primary key default 1,
    -- Availability
    "workAvailability" text,
    available boolean default false,
    -- Identity
    name text,
    brand text,
    tagline text,
    location text,
    -- Contact & Socials
    whatsapp text,
    email text,
    email2 text,
    linkedin text,
    twitter text,
    github text,
    -- Timestamps
    "lastUpdated" text
);

-- Create contact_submissions table (with status tracking)
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    email text not null,
    subject text,
    budget text,
    message text not null,
    status text default 'New',
    read_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- ============================================================
-- MIGRATION: If tables already exist, add new columns
-- (Safe to run multiple times — uses IF NOT EXISTS)
-- ============================================================

-- Add status tracking to contact_submissions
DO $$ BEGIN
    ALTER TABLE public.contact_submissions ADD COLUMN IF NOT EXISTS status text DEFAULT 'New';
    ALTER TABLE public.contact_submissions ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add icon to categories
DO $$ BEGIN
    ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text DEFAULT '📁';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add expanded fields to site_settings
DO $$ BEGIN
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS name text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS brand text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tagline text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS location text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS whatsapp text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS email text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS email2 text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS linkedin text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS twitter text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS github text;
    ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS available boolean DEFAULT false;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS POLICIES (uses CREATE OR REPLACE via DO blocks)
-- ============================================================

-- Drop existing policies to avoid conflicts, then recreate
DO $$ BEGIN
    -- PROJECTS
    DROP POLICY IF EXISTS "Public projects are viewable by everyone." ON public.projects;
    CREATE POLICY "Public projects are viewable by everyone." ON public.projects FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Only authenticated users can insert projects" ON public.projects;
    CREATE POLICY "Only authenticated users can insert projects" ON public.projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Only authenticated users can update projects" ON public.projects;
    CREATE POLICY "Only authenticated users can update projects" ON public.projects FOR UPDATE USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Only authenticated users can delete projects" ON public.projects;
    CREATE POLICY "Only authenticated users can delete projects" ON public.projects FOR DELETE USING (auth.role() = 'authenticated');

    -- CATEGORIES
    DROP POLICY IF EXISTS "Categories are viewable by everyone." ON public.categories;
    CREATE POLICY "Categories are viewable by everyone." ON public.categories FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Only authenticated users can insert categories" ON public.categories;
    CREATE POLICY "Only authenticated users can insert categories" ON public.categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Only authenticated users can update categories" ON public.categories;
    CREATE POLICY "Only authenticated users can update categories" ON public.categories FOR UPDATE USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Only authenticated users can delete categories" ON public.categories;
    CREATE POLICY "Only authenticated users can delete categories" ON public.categories FOR DELETE USING (auth.role() = 'authenticated');

    -- SITE_SETTINGS
    DROP POLICY IF EXISTS "Settings are viewable by everyone." ON public.site_settings;
    CREATE POLICY "Settings are viewable by everyone." ON public.site_settings FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Only authenticated users can insert settings" ON public.site_settings;
    CREATE POLICY "Only authenticated users can insert settings" ON public.site_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Only authenticated users can update settings" ON public.site_settings;
    CREATE POLICY "Only authenticated users can update settings" ON public.site_settings FOR UPDATE USING (auth.role() = 'authenticated');

    -- CONTACT_SUBMISSIONS
    DROP POLICY IF EXISTS "Anyone can submit a contact form." ON public.contact_submissions;
    CREATE POLICY "Anyone can submit a contact form." ON public.contact_submissions FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Only authenticated users can view contact submissions" ON public.contact_submissions;
    CREATE POLICY "Only authenticated users can view contact submissions" ON public.contact_submissions FOR SELECT USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Only authenticated users can update contact submissions" ON public.contact_submissions;
    CREATE POLICY "Only authenticated users can update contact submissions" ON public.contact_submissions FOR UPDATE USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Only authenticated users can delete contact submissions" ON public.contact_submissions;
    CREATE POLICY "Only authenticated users can delete contact submissions" ON public.contact_submissions FOR DELETE USING (auth.role() = 'authenticated');
END $$;
