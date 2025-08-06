-- Create prompt_settings table for storing custom AI prompts
CREATE TABLE public.prompt_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompts JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prompt_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (allow everyone to read/write for now, as this is admin settings)
CREATE POLICY "Allow all access to prompt settings" 
ON public.prompt_settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Insert default row for prompt settings
INSERT INTO public.prompt_settings (prompts) VALUES ('{}');