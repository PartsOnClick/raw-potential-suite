-- Update products table to support new eBay-first workflow
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS oe_number text,
ADD COLUMN IF NOT EXISTS original_title text,
ADD COLUMN IF NOT EXISTS ebay_item_id text,
ADD COLUMN IF NOT EXISTS ebay_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS part_number_tags text[],
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS seo_title text;

-- Update processing logs to track eBay operations
ALTER TABLE public.processing_logs 
ADD COLUMN IF NOT EXISTS operation_details jsonb DEFAULT '{}'::jsonb;

-- Add index for better performance on eBay item lookups
CREATE INDEX IF NOT EXISTS idx_products_ebay_item_id ON public.products(ebay_item_id);
CREATE INDEX IF NOT EXISTS idx_products_oe_number ON public.products(oe_number);
CREATE INDEX IF NOT EXISTS idx_products_brand_sku ON public.products(brand, sku);