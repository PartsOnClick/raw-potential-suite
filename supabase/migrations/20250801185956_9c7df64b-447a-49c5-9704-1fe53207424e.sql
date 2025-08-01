-- Create import_batches table to track CSV uploads and processing
CREATE TABLE public.import_batches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'paused')),
    total_items INTEGER NOT NULL DEFAULT 0,
    processed_items INTEGER NOT NULL DEFAULT 0,
    successful_items INTEGER NOT NULL DEFAULT 0,
    failed_items INTEGER NOT NULL DEFAULT 0,
    csv_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create products table to store scraped and processed product data
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID REFERENCES public.import_batches(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    sku TEXT NOT NULL,
    product_name TEXT,
    category TEXT,
    short_description TEXT,
    long_description TEXT,
    price DECIMAL(10,2),
    images JSONB DEFAULT '[]'::jsonb,
    oem_numbers JSONB DEFAULT '[]'::jsonb,
    technical_specs JSONB DEFAULT '{}'::jsonb,
    weight TEXT,
    dimensions TEXT,
    autodoc_url TEXT,
    scraping_status TEXT DEFAULT 'pending' CHECK (scraping_status IN ('pending', 'scraped', 'failed', 'manual')),
    ai_content_status TEXT DEFAULT 'pending' CHECK (ai_content_status IN ('pending', 'generated', 'failed', 'manual')),
    raw_scraped_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(brand, sku)
);

-- Create processing_logs table for error tracking and retry management
CREATE TABLE public.processing_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID REFERENCES public.import_batches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('scraping', 'ai_generation', 'validation')),
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'retry')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_generations table to cache AI-generated content
CREATE TABLE public.ai_generations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    prompt_type TEXT NOT NULL CHECK (prompt_type IN ('title', 'short_description', 'long_description', 'meta_description')),
    prompt_input JSONB NOT NULL,
    generated_content TEXT NOT NULL,
    model_used TEXT NOT NULL,
    generation_cost DECIMAL(10,6),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a standalone tool)
CREATE POLICY "Allow all operations on import_batches" ON public.import_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on processing_logs" ON public.processing_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ai_generations" ON public.ai_generations FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_import_batches_status ON public.import_batches(status);
CREATE INDEX idx_import_batches_created_at ON public.import_batches(created_at DESC);
CREATE INDEX idx_products_batch_id ON public.products(batch_id);
CREATE INDEX idx_products_brand_sku ON public.products(brand, sku);
CREATE INDEX idx_products_scraping_status ON public.products(scraping_status);
CREATE INDEX idx_products_ai_content_status ON public.products(ai_content_status);
CREATE INDEX idx_processing_logs_batch_id ON public.processing_logs(batch_id);
CREATE INDEX idx_processing_logs_product_id ON public.processing_logs(product_id);
CREATE INDEX idx_processing_logs_operation_type ON public.processing_logs(operation_type);
CREATE INDEX idx_ai_generations_product_id ON public.ai_generations(product_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_import_batches_updated_at
    BEFORE UPDATE ON public.import_batches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();