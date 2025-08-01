-- Fix processing_logs constraint to allow google_search operation type
ALTER TABLE processing_logs DROP CONSTRAINT IF EXISTS processing_logs_operation_type_check;

-- Add new constraint that includes google_search
ALTER TABLE processing_logs ADD CONSTRAINT processing_logs_operation_type_check 
CHECK (operation_type IN ('autodoc_scraping', 'google_search', 'ai_generation', 'batch_processing'));