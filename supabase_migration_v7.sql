-- Create template_clones table
CREATE TABLE IF NOT EXISTS public.template_clones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_name TEXT NOT NULL,
    client_brand TEXT,
    download_url TEXT
);

-- Add RLS policies (assuming authenticated users can manage)
ALTER TABLE public.template_clones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON public.template_clones
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
