-- Drop the existing check constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_scraping_status_check;

-- Add updated check constraint to allow 'failed_blocked' status
ALTER TABLE products ADD CONSTRAINT products_scraping_status_check 
CHECK (scraping_status IN ('pending', 'scraped', 'failed', 'failed_blocked'));