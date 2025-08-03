-- Fix database constraints that are causing insertion failures

-- Drop and recreate the products scraping_status check constraint to allow more statuses
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_scraping_status_check;
ALTER TABLE products ADD CONSTRAINT products_scraping_status_check 
CHECK (scraping_status IN ('pending', 'processing', 'scraped', 'completed', 'failed', 'no_results'));

-- Drop and recreate the processing_logs operation_type check constraint to allow eBay operations
ALTER TABLE processing_logs DROP CONSTRAINT IF EXISTS processing_logs_operation_type_check;
ALTER TABLE processing_logs ADD CONSTRAINT processing_logs_operation_type_check 
CHECK (operation_type IN ('ebay_search', 'google_search', 'content_generation', 'batch_processing', 'data_extraction'));

-- Also ensure scraping_status has proper default and update current failed records
UPDATE products SET scraping_status = 'pending' WHERE scraping_status = 'failed' AND ebay_item_id IS NULL;