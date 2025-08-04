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
    const requestBody = await req.json();
    const { batchId } = requestBody;
    
    console.log(`Starting batch processing for batch ${batchId}`);

    // Set timeout to prevent 504 errors
    const timeoutMs = 300000; // 5 minutes
    const startTime = Date.now();

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all products in the batch that need scraping
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('batch_id', batchId)
      .eq('scraping_status', 'pending');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      console.log('No products found to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No products to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${products.length} products to process`);

    // Update batch status to processing
    await supabaseAdmin
      .from('import_batches')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', batchId);

    // Process products in smaller batches to prevent timeouts
    let successfullyProcessed = 0;
    let errors = [];
    const batchSize = 3; // Process 3 products at a time
    
    // Return early response for async processing
    const processInBackground = async () => {
      for (let i = 0; i < products.length; i += batchSize) {
        // Check timeout
        if (Date.now() - startTime > timeoutMs - 30000) { // Leave 30s buffer
          console.log(`Timeout approaching, stopping batch processing`);
          await supabaseAdmin
            .from('import_batches')
            .update({ 
              status: 'completed',
              successful_items: successfullyProcessed,
              failed_items: Math.max(0, products.length - successfullyProcessed),
              error_details: errors.length > 0 ? errors.join('; ') : null
            })
            .eq('id', batchId);
          break;
        }

        const currentBatch = products.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)} (${currentBatch.length} products)`);
        
        // Process current batch concurrently
        await Promise.allSettled(currentBatch.map(async (product) => {
          try {
            console.log(`Processing product ${product.id} - ${product.brand} ${product.sku}`);
            
            // Step 1: eBay Search
            console.log(`[Batch] Starting eBay search for ${product.brand} ${product.sku} (${product.oe_number})`);
            
            const { data: searchResult, error: searchError } = await supabaseAdmin.functions.invoke(
              'ebay-search',
              { 
                body: {
                  productId: product.id,
                  brand: product.brand,
                  sku: product.sku,
                  oeNumber: product.oe_number,
                }
              }
            );

            if (searchError) {
              console.error(`[Batch] eBay search failed for ${product.brand} ${product.sku}:`, searchError);
              throw new Error(`eBay search failed: ${searchError.message}`);
            }

            // Wait for eBay data processing and fetch updated product
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const { data: updatedProduct } = await supabaseAdmin
              .from('products')
              .select('*')
              .eq('id', product.id)
              .single();

            // Step 2: Generate AI content
            console.log(`[Batch] Starting AI content generation for ${product.brand} ${product.sku}`);
            const contentTypes = ['seo_title', 'short_description', 'long_description', 'meta_description'];
            
            for (const contentType of contentTypes) {
              const { error: contentError } = await supabaseAdmin.functions.invoke(
                'deepseek-content-generator',
                { 
                  body: {
                    productId: product.id,
                    contentType: contentType,
                    productData: updatedProduct || product,
                  }
                }
              );

              if (contentError) {
                console.error(`[Batch] Content generation failed for ${contentType}:`, contentError);
                errors.push(`${product.brand} ${product.sku} - ${contentType}: ${contentError.message}`);
              }

              await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Update product status
            await supabaseAdmin
              .from('products')
              .update({ 
                scraping_status: 'scraped',
                ai_content_status: 'generated'
              })
              .eq('id', product.id);

            successfullyProcessed++;
            console.log(`Completed processing product ${product.id}`);
            
          } catch (error) {
            console.error(`Error processing product ${product.id}:`, error);
            errors.push(`${product.brand} ${product.sku}: ${error.message}`);
            
            await supabaseAdmin
              .from('products')
              .update({ 
                scraping_status: 'failed',
                ai_content_status: 'failed'
              })
              .eq('id', product.id);
          }
        }));

        // Update batch progress after each batch
        await supabaseAdmin
          .from('import_batches')
          .update({ 
            processed_items: Math.min(i + batchSize, products.length),
            successful_items: successfullyProcessed,
            failed_items: Math.max(0, (i + batchSize) - successfullyProcessed),
          })
          .eq('id', batchId);

        // Delay between batches
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Final batch status update
      await supabaseAdmin
        .from('import_batches')
        .update({ 
          status: 'completed',
          successful_items: successfullyProcessed,
          failed_items: Math.max(0, products.length - successfullyProcessed),
          error_details: errors.length > 0 ? errors.join('; ') : null,
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId);

      console.log(`Batch processing completed. Successful: ${successfullyProcessed}, Failed: ${products.length - successfullyProcessed}`);
    };

    // Start background processing
    EdgeRuntime.waitUntil(processInBackground());

    // Return immediate response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Started processing ${products.length} products in background`,
        batchId: batchId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Batch processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});