import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchId } = await req.json();
    
    console.log(`Starting batch processing for batch ${batchId}`);
    
    // Get batch data
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      throw new Error('Batch not found');
    }

    // Update batch status to processing
    await supabase
      .from('import_batches')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', batchId);

    // Get products for this batch
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('batch_id', batchId)
      .eq('scraping_status', 'pending');

    if (productsError) {
      throw productsError;
    }

    console.log(`Processing ${products.length} products`);

    let processedCount = 0;
    let successCount = 0;
    let failureCount = 0;

    // Process each product
    for (const product of products) {
      try {
        console.log(`Processing ${product.brand} ${product.sku}`);
        
        // Step 1: Scrape Autodoc data
        const scrapeResponse = await fetch(`${supabaseUrl}/functions/v1/autodoc-scraper`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brand: product.brand,
            sku: product.sku,
            productId: product.id,
          }),
        });

        if (!scrapeResponse.ok) {
          throw new Error(`Scraping failed: ${scrapeResponse.status}`);
        }

        // Wait a bit to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Generate AI content
        const updatedProduct = await supabase
          .from('products')
          .select('*')
          .eq('id', product.id)
          .single();

        if (updatedProduct.data && updatedProduct.data.scraping_status === 'scraped') {
          // Generate title
          await fetch(`${supabaseUrl}/functions/v1/deepseek-content-generator`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: product.id,
              contentType: 'title',
              productData: updatedProduct.data,
            }),
          });

          await new Promise(resolve => setTimeout(resolve, 1000));

          // Generate short description
          await fetch(`${supabaseUrl}/functions/v1/deepseek-content-generator`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: product.id,
              contentType: 'short_description',
              productData: updatedProduct.data,
            }),
          });

          await new Promise(resolve => setTimeout(resolve, 1000));

          // Generate long description
          await fetch(`${supabaseUrl}/functions/v1/deepseek-content-generator`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: product.id,
              contentType: 'long_description',
              productData: updatedProduct.data,
            }),
          });
        }

        successCount++;
        console.log(`Successfully processed ${product.brand} ${product.sku}`);

      } catch (error) {
        console.error(`Failed to process ${product.brand} ${product.sku}:`, error);
        
        // Mark product as failed
        await supabase
          .from('products')
          .update({ 
            scraping_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        failureCount++;
      }

      processedCount++;

      // Update batch progress
      await supabase
        .from('import_batches')
        .update({
          processed_items: processedCount,
          successful_items: successCount,
          failed_items: failureCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchId);
    }

    // Mark batch as completed
    const finalStatus = failureCount === 0 ? 'completed' : 'failed';
    await supabase
      .from('import_batches')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    console.log(`Batch processing completed: ${successCount} success, ${failureCount} failed`);

    return new Response(JSON.stringify({ 
      success: true,
      processed: processedCount,
      successful: successCount,
      failed: failureCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Batch processing error:', error);

    // Mark batch as failed
    const { batchId } = await req.json().catch(() => ({}));
    if (batchId) {
      await supabase
        .from('import_batches')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchId);
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});