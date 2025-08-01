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

    // Process products sequentially to handle large file sets better
    let successfullyProcessed = 0;
    let errors = [];

    for (const product of products) {
      try {
        console.log(`Processing product ${product.id} - ${product.brand} ${product.sku}`);
        
        // Step 1: Google Search for product data with enhanced technical specs search
        try {
          const { data: searchResult, error: searchError } = await supabaseAdmin.functions.invoke(
            'google-product-search',
            {
              body: {
                brand: product.brand,
                sku: product.sku,
                productId: product.id,
              },
            }
          );

          if (searchError) {
            console.error(`Google search failed for ${product.brand} ${product.sku}:`, searchError);
          } else {
            console.log(`Google search completed for ${product.brand} ${product.sku}`);
          }
        } catch (searchErr) {
          console.error(`Google search error for ${product.brand} ${product.sku}:`, searchErr);
        }

        // Get updated product data
        const { data: updatedProduct } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('id', product.id)
          .single();

        // Step 2: Generate AI content (title, short description, long description) sequentially
        const contentTypes = ['title', 'short_description', 'long_description'];
        
        for (const contentType of contentTypes) {
          try {
            const { data: contentResult, error: contentError } = await supabaseAdmin.functions.invoke(
              'deepseek-content-generator',
              {
                body: {
                  productId: product.id,
                  contentType: contentType,
                  productData: updatedProduct || product,
                },
              }
            );

            if (contentError) {
              console.error(`Content generation failed for ${contentType}:`, contentError);
              errors.push(`${product.brand} ${product.sku} - ${contentType}: ${contentError.message}`);
            } else {
              console.log(`Successfully generated ${contentType} for ${product.brand} ${product.sku}`);
            }

            // Small delay between content generation calls
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (error) {
            console.error(`Error generating ${contentType}:`, error);
            errors.push(`${product.brand} ${product.sku} - ${contentType}: ${error.message}`);
          }
        }

        // Update product status to completed
        await supabaseAdmin
          .from('products')
          .update({ 
            scraping_status: 'scraped',
            ai_content_status: 'generated'
          })
          .eq('id', product.id);

        successfullyProcessed++;
        console.log(`Completed processing product ${product.id}`);
        
        // Add delay between products to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        errors.push(`${product.brand} ${product.sku}: ${error.message}`);
        
        // Update product status to failed
        await supabaseAdmin
          .from('products')
          .update({ 
            scraping_status: 'failed',
            ai_content_status: 'failed'
          })
          .eq('id', product.id);
      }
    }

    // Update batch status
    await supabaseAdmin
      .from('import_batches')
      .update({ 
        status: 'completed',
        successful_items: successfullyProcessed,
        failed_items: products.length - successfullyProcessed,
        error_details: errors.length > 0 ? errors.join('; ') : null
      })
      .eq('id', batchId);

    console.log(`Batch processing completed. Successful: ${successfullyProcessed}, Failed: ${products.length - successfullyProcessed}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: successfullyProcessed,
        failed: products.length - successfullyProcessed,
        errors: errors 
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