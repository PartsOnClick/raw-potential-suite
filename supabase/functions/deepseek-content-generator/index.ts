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
    const { productId, contentType, productData } = await req.json();
    
    console.log(`Generating ${contentType} for product ${productId}`);
    
    // Generate content based on type
    let generatedContent = '';
    let prompt = '';
    
    switch (contentType) {
      case 'title':
        prompt = createTitlePrompt(productData);
        break;
      case 'short_description':
        prompt = createShortDescriptionPrompt(productData);
        break;
      case 'long_description':
        prompt = createLongDescriptionPrompt(productData);
        break;
      case 'meta_description':
        prompt = createMetaDescriptionPrompt(productData);
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
    if (contentType === 'title') {
      updateData.product_name = generatedContent; // Use product_name instead of title
    } else if (contentType === 'short_description') {
      updateData.short_description = generatedContent;
    } else if (contentType === 'long_description') {
      updateData.long_description = generatedContent;
    } else if (contentType === 'meta_description') {
      // Note: meta_description column doesn't exist in products table
      // We could add it to technical_specs instead
      updateData.technical_specs = {
        ...productData.technical_specs,
        meta_description: generatedContent
      };
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

function createTitlePrompt(productData: any): string {
  return `Generate a concise, SEO-optimized product title for this auto part:
Brand: ${productData.brand}
SKU: ${productData.sku}
Category: ${productData.category || 'Auto Part'}
Price: £${productData.price || 'N/A'}
OEM Numbers: ${productData.oem_numbers?.join(', ') || 'N/A'}
Technical Specs: ${JSON.stringify(productData.technical_specs || {})}

Requirements:
- Maximum 60 characters
- Include brand, SKU only
- Professional format: "Brand SKU - Part Type"
- No extra descriptions or marketing text

Return only the clean title, no explanations or formatting.`;
}

function createShortDescriptionPrompt(productData: any): string {
  return `Create a concise product description for this auto part:
Brand: ${productData.brand}
SKU: ${productData.sku}
Category: ${productData.category || 'Auto Part'}
Price: £${productData.price || 'N/A'}
OEM Numbers: ${productData.oem_numbers?.join(', ') || 'N/A'}
Technical Specs: ${JSON.stringify(productData.technical_specs || {})}
Product Name: ${productData.product_name || ''}

Requirements:
- Maximum 155 characters
- Focus on key benefits and compatibility
- Professional tone
- No extra formatting or quotes

Return only the description text, no explanations.`;
}

function createLongDescriptionPrompt(productData: any): string {
  return `Write a professional product description for this auto part:
Brand: ${productData.brand}
SKU: ${productData.sku}
Category: ${productData.category || 'Auto Part'}
Price: £${productData.price || 'N/A'}
OEM Numbers: ${productData.oem_numbers?.join(', ') || 'N/A'}
Technical Specs: ${JSON.stringify(productData.technical_specs || {})}
Product Name: ${productData.product_name || ''}
Short Description: ${productData.short_description || ''}

Requirements:
- 200-300 words
- Professional, informative tone
- Include technical specifications in bullet points
- Mention OEM numbers for compatibility
- Focus on quality and fitment
- Use clean HTML formatting
- No marketing fluff

Return only the HTML description, no explanations.`;
}

function createMetaDescriptionPrompt(productData: any): string {
  return `Create an SEO meta description for this automotive part:

Brand: ${productData.brand}
SKU: ${productData.sku}
Category: ${productData.category || 'Auto Part'}
Product Name: ${productData.product_name || 'N/A'}
Price: ${productData.price ? '£' + productData.price : 'N/A'}

Requirements:
- Exactly 150-160 characters
- Include brand, part type, and key benefit
- Call to action
- Primary keywords
- Compelling and click-worthy

Format: [Brand] [Part Type] [SKU] - [Key Benefit]. [Price] with [Quality/Delivery benefit]. [CTA]`;
}