-- Fix the ai_generations table constraint to allow 'seo_title'
ALTER TABLE ai_generations DROP CONSTRAINT ai_generations_prompt_type_check;

-- Add the updated constraint with 'seo_title' included
ALTER TABLE ai_generations ADD CONSTRAINT ai_generations_prompt_type_check 
CHECK (prompt_type = ANY (ARRAY['title'::text, 'seo_title'::text, 'short_description'::text, 'long_description'::text, 'meta_description'::text]));

-- Add eBay token management table for dynamic token updates
CREATE TABLE ebay_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    dev_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sandbox_mode BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for eBay tokens (admin only for now)
ALTER TABLE ebay_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy allowing all operations (since there's no user auth context, allow all for now)
CREATE POLICY "Allow eBay token management" ON ebay_tokens FOR ALL USING (true);