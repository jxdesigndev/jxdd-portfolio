-- ============================================================
-- JX Portfolio — Supabase Migration v9
-- Adds structured meta fields to the projects table for 
-- enhanced case study rendering (Role, Timeline, Type).
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROJECTS — New Meta Fields
-- ------------------------------------------------------------
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_role text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS timeline     text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_type text;
