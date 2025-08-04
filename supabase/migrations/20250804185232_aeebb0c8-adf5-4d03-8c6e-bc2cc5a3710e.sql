-- Fix batch status calculation and processing logs constraints
UPDATE import_batches 
SET 
  status = CASE 
    WHEN processed_items >= total_items THEN 'completed'
    WHEN processed_items > 0 THEN 'processing'
    ELSE 'pending'
  END,
  failed_items = GREATEST(0, total_items - successful_items),
  completed_at = CASE 
    WHEN processed_items >= total_items AND completed_at IS NULL THEN now()
    ELSE completed_at
  END
WHERE id = '2ef06707-adcb-47bc-a86c-2b27d9c93171';

-- Clean up invalid processing logs that violate constraints
DELETE FROM processing_logs 
WHERE operation_type NOT IN ('scraping', 'ai_generation', 'batch_processing')
OR status NOT IN ('started', 'completed', 'failed');