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
    const { brand, sku, productId } = await req.json();
    
    console.log(`Starting scrape for ${brand} ${sku}, productId: ${productId}`);
    
    if (!brand || !sku || !productId) {
      throw new Error('Missing required parameters: brand, sku, or productId');
    }
    
    // Build Autodoc URL
    const autodocUrl = `https://www.autodoc.co.uk/spares-search?keyword=${encodeURIComponent(brand)}+${encodeURIComponent(sku)}`;
    console.log(`Fetching URL: ${autodocUrl}`);
    
    // Add random delay to avoid rate limiting (increase the delay)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
    
    // Use rotating user agents to avoid detection
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    ];
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // Fetch the page with enhanced browser-like headers
    const response = await fetch(autodocUrl, {
      headers: {
        'User-Agent': randomUA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,en-GB;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Referer': 'https://www.google.com/',
      },
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}, URL: ${autodocUrl}`);
      
      // If we get a 403, try to provide mock data instead of failing completely
      if (response.status === 403) {
        console.log(`Website blocking detected for ${brand} ${sku}, creating placeholder data...`);
        
        // Update product with placeholder data
        const { error: updateError } = await supabase
          .from('products')
          .update({
            product_name: `${brand} ${sku} Auto Part`,
            category: 'Auto Parts',
            images: [],
            technical_specs: {},
            oem_numbers: [sku],
            price: null,
            autodoc_url: autodocUrl,
            scraping_status: 'failed_blocked',
            raw_scraped_data: { error: 'Website blocking detected', status: 403 },
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId);

        if (updateError) {
          throw updateError;
        }

        // Log partial success
        await supabase.from('processing_logs').insert({
          product_id: productId,
          operation_type: 'scraping',
          status: 'blocked',
          error_message: `Website returned 403 Forbidden - created placeholder data`,
        });

        console.log(`Created placeholder data for blocked ${brand} ${sku}`);

        return new Response(JSON.stringify({ 
          success: true, 
          data: {
            productName: `${brand} ${sku} Auto Part`,
            category: 'Auto Parts',
            images: [],
            technicalSpecs: {},
            oemNumbers: [sku],
            price: null,
            availability: 'Unknown'
          },
          url: autodocUrl,
          blocked: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract product data using regex patterns
    const extractedData = {
      productName: extractProductName(html, brand, sku),
      category: extractCategory(html),
      images: extractImages(html),
      technicalSpecs: extractTechnicalSpecs(html),
      oemNumbers: extractOemNumbers(html),
      price: extractPrice(html),
      availability: extractAvailability(html),
    };

    // Update product in database
    const { error: updateError } = await supabase
      .from('products')
      .update({
        product_name: extractedData.productName,
        category: extractedData.category,
        images: extractedData.images,
        technical_specs: extractedData.technicalSpecs,
        oem_numbers: extractedData.oemNumbers,
        price: extractedData.price,
        autodoc_url: autodocUrl,
        scraping_status: 'scraped',
        raw_scraped_data: extractedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (updateError) {
      throw updateError;
    }

    // Log success
    await supabase.from('processing_logs').insert({
      product_id: productId,
      operation_type: 'scraping',
      status: 'success',
    });

    console.log(`Successfully scraped ${brand} ${sku}`);

    return new Response(JSON.stringify({ 
      success: true, 
      data: extractedData,
      url: autodocUrl 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Scraping error for', { brand: 'unknown', sku: 'unknown' }, ':', error);
    
    // Try to get productId from request for logging
    let productId = null;
    try {
      const requestData = await req.json();
      productId = requestData.productId;
      console.error(`Error details - ProductID: ${productId}, Error: ${error.message}`);
    } catch (parseError) {
      console.error('Could not parse request for error logging:', parseError);
    }
    
    // Log error if productId available
    if (productId) {
      try {
        await supabase.from('processing_logs').insert({
          product_id: productId,
          operation_type: 'scraping',
          status: 'error',
          error_message: error.message,
        });
      } catch (logError) {
        console.error('Failed to log error to database:', logError);
      }
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions for data extraction
function extractProductName(html: string, brand: string, sku: string): string {
  // Look for product titles in common HTML patterns
  const patterns = [
    /<h1[^>]*class="[^"]*listing-title__name[^"]*"[^>]*>([^<]+)</i,
    /<h1[^>]*>([^<]*(?:${brand}|${sku})[^<]*)</i,
    /<title>([^<]*(?:${brand}|${sku})[^<]*)</i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim().replace(/\s+/g, ' ');
    }
  }
  
  return `${brand} ${sku}`;
}

function extractCategory(html: string): string {
  const patterns = [
    /<span[^>]*class="[^"]*filter-listing__item-title[^"]*"[^>]*>([^<]+)</i,
    /<h2[^>]*>([^<]*(?:category|part|type)[^<]*)</i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }
  
  return 'Auto Parts';
}

function extractImages(html: string): string[] {
  const images: string[] = [];
  const patterns = [
    /src="(https:\/\/cdn\.autodoc\.[^"]+)"/gi,
    /data-src="(https:\/\/cdn\.autodoc\.[^"]+)"/gi,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1] && !images.includes(match[1])) {
        images.push(match[1]);
      }
    }
  });
  
  return images.slice(0, 5); // Limit to 5 images
}

function extractTechnicalSpecs(html: string): Record<string, string> {
  const specs: Record<string, string> = {};
  
  // Extract specifications from common patterns
  const specPattern = /<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/gi;
  let match;
  
  while ((match = specPattern.exec(html)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();
    if (key && value) {
      specs[key] = value;
    }
  }
  
  return specs;
}

function extractOemNumbers(html: string): string[] {
  const oemNumbers: string[] = [];
  const patterns = [
    /OEM[^:]*:\s*([A-Z0-9\-\s,]+)/gi,
    /Part\s*Number[^:]*:\s*([A-Z0-9\-\s,]+)/gi,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const numbers = match[1].split(/[,\s]+/).filter(n => n.trim().length > 3);
      oemNumbers.push(...numbers);
    }
  });
  
  return [...new Set(oemNumbers)].slice(0, 10);
}

function extractPrice(html: string): number | null {
  const patterns = [
    /£(\d+\.?\d*)/,
    /price[^>]*>.*?(\d+\.?\d*)/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const price = parseFloat(match[1]);
      if (!isNaN(price)) {
        return price;
      }
    }
  }
  
  return null;
}

function extractAvailability(html: string): string {
  const patterns = [
    /in\s*stock/i,
    /available/i,
    /delivery/i,
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(html)) {
      return 'Available';
    }
  }
  
  return 'Unknown';
}