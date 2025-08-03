-- Reset the current batch to retry processing
UPDATE import_batches 
SET status = 'pending', 
    processed_items = 0,
    successful_items = 0,
    failed_items = 0,
    updated_at = now() 
WHERE id = '2425d203-046d-4f92-a18a-9ce07a18996d';

-- Reset all products in the batch to pending status
UPDATE products 
SET scraping_status = 'pending',
    ai_content_status = 'pending',
    updated_at = now()
WHERE batch_id = '2425d203-046d-4f92-a18a-9ce07a18996d';