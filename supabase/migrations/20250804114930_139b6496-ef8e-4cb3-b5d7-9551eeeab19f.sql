-- Reset stuck processing batch to pending status
UPDATE import_batches 
SET status = 'pending', 
    processed_items = 0, 
    successful_items = 0, 
    failed_items = 0,
    updated_at = now()
WHERE status = 'processing' AND updated_at < now() - interval '30 minutes';

-- Also reset any products stuck in processing
UPDATE products 
SET scraping_status = 'pending', 
    ai_content_status = 'pending',
    updated_at = now()
WHERE batch_id IN (
  SELECT id FROM import_batches WHERE status = 'pending'
) AND (scraping_status = 'processing' OR ai_content_status = 'processing');