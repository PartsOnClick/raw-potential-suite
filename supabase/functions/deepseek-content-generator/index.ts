import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, contentType, productData, hasEbayData } = await req.json();
    
    console.log(`Generating ${contentType} for product ${productId}`);
    
    // Generate content based on type
    let generatedContent = '';
    let prompt = '';
    
    switch (contentType) {
      case 'seo_title':
        prompt = createSeoTitlePrompt(productData, hasEbayData);
        break;
      case 'short_description':
        prompt = createShortDescriptionPrompt(productData, hasEbayData);
        break;
      case 'long_description':
        prompt = createLongDescriptionPrompt(productData, hasEbayData);
        break;
      case 'meta_description':
        prompt = createMetaDescriptionPrompt(productData, hasEbayData);
        break;
      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }

    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert automotive parts copywriter specializing in SEO-optimized product descriptions for auto parts e-commerce. Write compelling, technical, and search-friendly content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: contentType === 'long_description' ? 800 : 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    generatedContent = aiResponse.choices[0].message.content.trim();

    // Save to ai_generations table
    const { error: insertError } = await supabase
      .from('ai_generations')
      .insert({
        product_id: productId,
        prompt_type: contentType,
        prompt_input: { prompt, productData },
        generated_content: generatedContent,
        model_used: 'deepseek-chat',
      });

    if (insertError) {
      console.warn('Failed to save AI generation:', insertError);
    }

    // Update product with generated content
    const updateData: Record<string, any> = {
      ai_content_status: 'generated',
      updated_at: new Date().toISOString(),
    };
    
    // Map content types to correct column names
    if (contentType === 'seo_title') {
      updateData.seo_title = generatedContent;
    } else if (contentType === 'short_description') {
      updateData.short_description = generatedContent;
    } else if (contentType === 'long_description') {
      updateData.long_description = generatedContent;
    } else if (contentType === 'meta_description') {
      updateData.meta_description = generatedContent;
    }

    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      throw updateError;
    }

    // Log success
    await supabase.from('processing_logs').insert({
      product_id: productId,
      operation_type: 'ai_generation',
      status: 'success',
    });

    console.log(`Successfully generated ${contentType} for product ${productId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      content: generatedContent,
      contentType 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI generation error:', error);
    
    const { productId } = await req.json().catch(() => ({}));
    if (productId) {
      await supabase.from('processing_logs').insert({
        product_id: productId,
        operation_type: 'ai_generation',
        status: 'error',
        error_message: error.message,
      });
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

function createSeoTitlePrompt(productData: any, hasEbayData: boolean): string {
  // Use custom prompts if available
  const customPrompts = getCustomPrompts();
  if (customPrompts?.title) {
    return replacePromptVariables(customPrompts.title, productData, hasEbayData);
  }

  // Default behavior as fallback
  if (hasEbayData && productData.ebay_data?.itemDetails) {
    const ebayTitle = productData.ebay_data.itemDetails.title || '';
    const ebaySpecs = JSON.stringify(productData.ebay_data.itemDetails.itemSpecifics || {});
    
    return `Create an SEO-optimized product title based on this eBay data:

eBay Title: ${ebayTitle}
Brand: ${productData.brand}
SKU: ${productData.sku}  
OE Number: ${productData.oe_number || 'N/A'}
eBay Item Specifics: ${ebaySpecs}
Part Number Tags: ${productData.part_number_tags?.join(', ') || 'N/A'}

Requirements:
- Maximum 60 characters
- Format: "Brand SKU - Part Type"
- Use eBay data to determine accurate part type
- Professional, clean title
- Include main part number if space allows

Return only the optimized title, no explanations.`;
  } else {
    // Fallback: Use original title only
    return `Create an SEO-optimized product title from this basic information:

Original Title: ${productData.original_title || ''}
Brand: ${productData.brand}
SKU: ${productData.sku}
OE Number: ${productData.oe_number || 'N/A'}

Requirements:
- Maximum 60 characters
- Format: "Brand SKU - Part Type"
- Extract part type from original title if possible
- Professional, clean format

Return only the optimized title, no explanations.`;
  }
}

function createShortDescriptionPrompt(productData: any, hasEbayData: boolean): string {
  // Use custom prompts if available
  const customPrompts = getCustomPrompts();
  if (customPrompts?.short_description) {
    return replacePromptVariables(customPrompts.short_description, productData, hasEbayData);
  }

  // Default behavior as fallback
  if (hasEbayData && productData.ebay_data?.itemDetails) {
    const ebayDesc = productData.ebay_data.itemDetails.description || '';
    const ebaySpecs = JSON.stringify(productData.ebay_data.itemDetails.itemSpecifics || {});
    
    return `Create a concise product description using this eBay data:

Brand: ${productData.brand}
SKU: ${productData.sku}
eBay Description: ${ebayDesc.substring(0, 500)}...
Item Specifics: ${ebaySpecs}
Part Numbers: ${productData.part_number_tags?.join(', ') || 'N/A'}

Requirements:
- Maximum 155 characters
- Focus on key benefits and compatibility
- Professional, engaging tone
- Include main part numbers for searchability

Return only the description text, no explanations.`;
  } else {
    return `Create a product description from basic information:

Original Title: ${productData.original_title || ''}
Brand: ${productData.brand}
SKU: ${productData.sku}
OE Number: ${productData.oe_number || 'N/A'}

Requirements:
- Maximum 155 characters
- Focus on brand and compatibility
- Professional tone
- Extract part type from title

Return only the description text, no explanations.`;
  }
}

function createLongDescriptionPrompt(productData: any, hasEbayData: boolean): string {
  // Use custom prompts if available
  const customPrompts = getCustomPrompts();
  if (customPrompts?.long_description) {
    return replacePromptVariables(customPrompts.long_description, productData, hasEbayData);
  }

  // Default behavior as fallback
  if (hasEbayData && productData.ebay_data?.itemDetails) {
    const ebayDetails = productData.ebay_data.itemDetails;
    const itemSpecs = JSON.stringify(ebayDetails.itemSpecifics || {});
    
    return `Write a comprehensive product description using this eBay data:

Brand: ${productData.brand}
SKU: ${productData.sku}
eBay Title: ${ebayDetails.title || ''}
eBay Description: ${ebayDetails.description?.substring(0, 800) || ''}
Item Specifics: ${itemSpecs}
Part Numbers: ${productData.part_number_tags?.join(', ') || 'N/A'}
Condition: ${ebayDetails.condition || 'N/A'}

Requirements:
- 200-300 words
- Use eBay data to create accurate, detailed description
- Include technical specifications in bullet points
- Mention all relevant part numbers for compatibility
- Professional, informative tone
- Focus on fitment and quality
- Use clean HTML formatting

Return only the HTML description, no explanations.`;
  } else {
    return `Write a product description from basic information:

Original Title: ${productData.original_title || ''}
Brand: ${productData.brand}
SKU: ${productData.sku}
OE Number: ${productData.oe_number || 'N/A'}

Requirements:
- 200-300 words
- Create informative description from available data
- Include part numbers for compatibility
- Professional tone focusing on brand reliability
- Use clean HTML formatting
- Emphasize quality and fitment

Return only the HTML description, no explanations.`;
  }
}

function createMetaDescriptionPrompt(productData: any, hasEbayData: boolean): string {
  // Use custom prompts if available
  const customPrompts = getCustomPrompts();
  if (customPrompts?.meta_description) {
    return replacePromptVariables(customPrompts.meta_description, productData, hasEbayData);
  }

  // Default behavior as fallback
  if (hasEbayData && productData.ebay_data?.itemDetails) {
    const ebayTitle = productData.ebay_data.itemDetails.title || '';
    const price = productData.ebay_data.itemDetails.price || productData.price;
    
    return `Create an SEO meta description using eBay data:

Brand: ${productData.brand}
SKU: ${productData.sku}
eBay Title: ${ebayTitle}
Price: ${price ? '£' + price : 'N/A'}
Part Numbers: ${productData.part_number_tags?.slice(0, 3).join(', ') || 'N/A'}

Requirements:
- Exactly 150-160 characters
- Include brand, part type from eBay title
- Mention key part numbers
- Price and call to action
- Compelling and click-worthy

Format: [Brand] [Part Type] [SKU] - [Key Part Numbers]. From £[Price]. Fast delivery. Shop now!`;
  } else {
    return `Create an SEO meta description from basic data:

Brand: ${productData.brand}
SKU: ${productData.sku}
Original Title: ${productData.original_title || ''}
OE Number: ${productData.oe_number || 'N/A'}

Requirements:
- Exactly 150-160 characters
- Include brand and part type
- Mention OE number
- Professional call to action

Format: [Brand] [Part Type] [SKU] - OE ${productData.oe_number}. Quality auto parts with fast delivery. Shop now!`;
  }
}

// Get custom prompts from Supabase settings (using environment variable workaround)
function getCustomPrompts(): any {
  // Since we can't access localStorage from edge function, we'll use default prompts
  // The frontend will need to pass custom prompts through the request body
  return null;
}

function replacePromptVariables(template: string, productData: any, hasEbayData: boolean): string {
  let replacedTemplate = template
    .replace(/{brand}/g, productData.brand || 'N/A')
    .replace(/{sku}/g, productData.sku || 'N/A')
    .replace(/{category}/g, productData.category || 'Auto Part')
    .replace(/{price}/g, productData.price ? '£' + productData.price : 'N/A')
    .replace(/{oem_numbers}/g, productData.oem_numbers?.join(', ') || 'N/A')
    .replace(/{technical_specs}/g, JSON.stringify(productData.technical_specs || {}))
    .replace(/{product_name}/g, productData.product_name || 'N/A')
    .replace(/{short_description}/g, productData.short_description || 'N/A');

  // Add eBay-specific data if available
  if (hasEbayData && productData.ebay_data?.itemDetails) {
    const ebayDetails = productData.ebay_data.itemDetails;
    replacedTemplate = replacedTemplate
      .replace(/{ebay_title}/g, ebayDetails.title || 'N/A')
      .replace(/{ebay_description}/g, ebayDetails.description?.substring(0, 500) || 'N/A')
      .replace(/{item_specifics}/g, JSON.stringify(ebayDetails.itemSpecifics || {}))
      .replace(/{part_number_tags}/g, productData.part_number_tags?.join(', ') || 'N/A');
  }

  return replacedTemplate;
}