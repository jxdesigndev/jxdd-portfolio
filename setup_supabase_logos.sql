-- Run this in your Supabase SQL Editor to add the logo and URL columns to your existing experience table

ALTER TABLE public.experience 
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS company_url text;
