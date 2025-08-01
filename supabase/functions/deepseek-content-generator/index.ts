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
  return `Create an SEO-optimized product title for this automotive part:

Brand: ${productData.brand}
SKU: ${productData.sku}
Category: ${productData.category || 'Auto Part'}
Current Name: ${productData.product_name || 'N/A'}
OEM Numbers: ${productData.oem_numbers?.join(', ') || 'N/A'}
Technical Specs: ${JSON.stringify(productData.technical_specs || {})}

Requirements:
- Include brand and SKU
- 60-80 characters maximum
- Include main keywords for SEO
- Mention compatibility if known
- Professional and clear

Format: Brand SKU - Part Type - Key Feature/Compatibility`;
}

function createShortDescriptionPrompt(productData: any): string {
  return `Write a compelling short product description (150-160 characters) for this automotive part:

Brand: ${productData.brand}
SKU: ${productData.sku}
Category: ${productData.category || 'Auto Part'}
Product Name: ${productData.product_name || 'N/A'}
Key Specs: ${JSON.stringify(productData.technical_specs || {})}
Price: ${productData.price ? '£' + productData.price : 'N/A'}

Requirements:
- 150-160 characters maximum
- Highlight key benefits
- Include main keywords
- Persuasive and informative
- No technical jargon`;
}

function createLongDescriptionPrompt(productData: any): string {
  return `Write a comprehensive, SEO-optimized product description for this automotive part:

Brand: ${productData.brand}
SKU: ${productData.sku}
Category: ${productData.category || 'Auto Part'}
Product Name: ${productData.product_name || 'N/A'}
Technical Specifications: ${JSON.stringify(productData.technical_specs || {})}
OEM Numbers: ${productData.oem_numbers?.join(', ') || 'N/A'}
Images Available: ${productData.images?.length || 0}

Requirements:
- 400-600 words
- Include H2/H3 headings for structure
- Technical specifications section
- Installation/compatibility information
- Benefits and features
- SEO keywords naturally integrated
- Professional tone
- Include OEM numbers if available

Structure:
1. Overview paragraph
2. Key Features & Benefits
3. Technical Specifications  
4. Compatibility Information
5. Quality & Warranty`;
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