import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const googleApiKey = Deno.env.get('GOOGLE_API_KEY')!;
const googleSearchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand, sku, productId } = await req.json();
    
    console.log(`Starting Google search for ${brand} ${sku}, productId: ${productId}`);
    
    if (!brand || !sku || !productId) {
      throw new Error('Missing required parameters: brand, sku, or productId');
    }
    
    if (!googleApiKey || !googleSearchEngineId) {
      throw new Error('Google API Key or Search Engine ID not configured');
    }
    
    // Enhanced search queries for better technical specifications
    const queries = [
      `"${brand}" "${sku}" auto parts specifications`,
      `"${brand}" "${sku}" "Packaging length [cm]"`,
      `"${brand}" "${sku}" "Packaging width [cm]"`,
      `"${brand}" "${sku}" "Packaging height [cm]"`,
      `"${brand}" "${sku}" "EAN number"`,
      `"${brand}" "${sku}" "fitting position"`
    ];
    
    let allResults: any[] = [];
    let extractedData: any = null;
    
    // Search with multiple queries to get comprehensive data
    for (const query of queries) {
      console.log(`Searching Google for: ${query}`);
      
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(query)}&num=3`;
      
      try {
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
          console.warn(`Search API error for query "${query}": ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          allResults.push(...data.items);
        }
        
        // Add delay between API calls to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (searchError) {
        console.error(`Search error for query "${query}":`, searchError);
      }
    }
    
    if (allResults.length === 0) {
      console.log(`No search results found for ${brand} ${sku}`);
      throw new Error('No search results found');
    }
    
    // Remove duplicates and create consolidated search data
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex((t) => t.link === item.link)
    ).slice(0, 8);
    
    const consolidatedSearchData = {
      items: uniqueResults
    };

    // Extract product data from all search results
    extractedData = extractDataFromSearchResults(consolidatedSearchData, brand, sku);

    // Update product in database
    const updateData: any = {
      product_name: extractedData.productName,
      category: extractedData.category,
      images: extractedData.images,
      technical_specs: extractedData.technicalSpecs,
      oem_numbers: extractedData.oemNumbers,
      price: extractedData.price,
      scraping_status: 'scraped',
      raw_scraped_data: {
        searchResults: consolidatedSearchData,
        extractedData: extractedData
      },
      updated_at: new Date().toISOString(),
    };

    // Add EAN number to separate field if found
    if (extractedData.technicalSpecs?.EAN) {
      updateData.ean_number = extractedData.technicalSpecs.EAN;
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
      operation_type: 'google_search',
      status: 'success',
    });

    console.log(`Successfully found data for ${brand} ${sku} via Google Search`);

    return new Response(JSON.stringify({ 
      success: true, 
      data: extractedData,
      searchResults: uniqueResults.length
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
          operation_type: 'google_search',
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

// Helper function to extract data from Google search results
function extractDataFromSearchResults(searchData: any, brand: string, sku: string) {
  const items = searchData.items || [];
  
  // Extract product name from search results
  let productName = `${brand} ${sku}`;
  if (items.length > 0) {
    const firstResult = items[0];
    if (firstResult.title && firstResult.title.toLowerCase().includes(brand.toLowerCase()) && firstResult.title.toLowerCase().includes(sku.toLowerCase())) {
      productName = firstResult.title;
    }
  }
  
  // Extract category from search snippets with enhanced patterns
  let category = 'Auto Parts';
  const categoryKeywords = [
    'brake', 'engine', 'suspension', 'filter', 'pump', 'sensor', 'bearing', 
    'clutch', 'transmission', 'radiator', 'gasket', 'seal', 'timing', 'belt',
    'coolant', 'thermostat', 'alternator', 'starter', 'ignition', 'fuel'
  ];
  for (const item of items) {
    const text = `${item.title} ${item.snippet}`.toLowerCase();
    for (const keyword of categoryKeywords) {
      if (text.includes(keyword)) {
        category = keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' Parts';
        break;
      }
    }
    if (category !== 'Auto Parts') break;
  }
  
  // Extract images from search results
  const images: string[] = [];
  if (searchData.items) {
    for (const item of searchData.items) {
      if (item.pagemap?.cse_image?.[0]?.src) {
        images.push(item.pagemap.cse_image[0].src);
      }
      if (item.pagemap?.metatags?.[0]?.['og:image']) {
        images.push(item.pagemap.metatags[0]['og:image']);
      }
    }
  }
  
  // Enhanced technical specs extraction
  const technicalSpecs: Record<string, string> = {};
  for (const item of items) {
    const text = `${item.title} ${item.snippet}`;
    
    // Enhanced specification patterns including new requested fields
    const specPatterns = [
      // Existing patterns
      /weight[:\s]+([0-9.,]+\s*(?:kg|g|lbs|oz))/i,
      /dimension[s]?[:\s]+([0-9.,x\s]+(?:mm|cm|inch))/i,
      /diameter[:\s]+([0-9.,]+\s*(?:mm|cm|inch))/i,
      /length[:\s]+([0-9.,]+\s*(?:mm|cm|inch))/i,
      /width[:\s]+([0-9.,]+\s*(?:mm|cm|inch))/i,
      /height[:\s]+([0-9.,]+\s*(?:mm|cm|inch))/i,
      
      // New requested patterns
      /EAN[:\s]+([0-9]{8,14})/i,
      /fitting\s*position[:\s]+([^,\n.]+)/i,
      /packaging\s*length[:\s]*([0-9.,]+\s*(?:cm|mm))/i,
      /packaging\s*width[:\s]*([0-9.,]+\s*(?:cm|mm))/i,
      /packaging\s*height[:\s]*([0-9.,]+\s*(?:cm|mm))/i,
      /package\s*dimension[s]?[:\s]*([0-9.,x\s]+(?:cm|mm))/i,
      
      // Additional automotive specs
      /inner\s*diameter[:\s]+([0-9.,]+\s*(?:mm|cm))/i,
      /outer\s*diameter[:\s]+([0-9.,]+\s*(?:mm|cm))/i,
      /thickness[:\s]+([0-9.,]+\s*(?:mm|cm))/i,
      /material[:\s]+([^,\n.]+)/i,
      /manufacturer[:\s]+([^,\n.]+)/i,
    ];
    
    for (const pattern of specPatterns) {
      const match = text.match(pattern);
      if (match) {
        let key = pattern.source.split('[')[0].replace(/[^a-zA-Z\s]/g, '').trim();
        key = key.charAt(0).toUpperCase() + key.slice(1);
        
        // Clean up specific keys
        if (key.includes('packaging')) {
          key = key.replace(/packaging\s*/i, 'Packaging ');
        }
        if (key.includes('fitting')) {
          key = 'Fitting Position';
        }
        
        technicalSpecs[key] = match[1].trim();
      }
    }
  }
  
  // Enhanced OEM numbers extraction
  const oemNumbers: string[] = [sku]; // Always include the original SKU
  for (const item of items) {
    const text = `${item.title} ${item.snippet}`;
    const oemPatterns = [
      /(?:OEM|OE|part\s*number|article\s*number|reference)[:\s#№]*([A-Z0-9\-\.]{4,})/gi,
      /№[:\s]*([A-Z0-9\-\.]{4,})/gi,
      /([A-Z0-9\-\.]{6,})/g, // Generic alphanumeric patterns
    ];
    
    for (const pattern of oemPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const number = match[1];
        if (number && number.length >= 4 && number.length <= 25 && 
            !oemNumbers.includes(number) && 
            !/^(http|www|com|org)/.test(number.toLowerCase())) {
          oemNumbers.push(number);
        }
      }
    }
  }
  
  // Extract EAN specifically
  let eanNumber = null;
  for (const item of items) {
    const text = `${item.title} ${item.snippet}`;
    const eanMatch = text.match(/EAN[:\s]*([0-9]{8,14})/i);
    if (eanMatch) {
      eanNumber = eanMatch[1];
      break;
    }
  }
  
  // Extract price from snippets
  let price: number | null = null;
  for (const item of items) {
    const text = `${item.title} ${item.snippet}`;
    const pricePatterns = [
      /[£$€](\d+\.?\d*)/,
      /(\d+\.?\d*)\s*[£$€]/,
      /price[:\s]*[£$€]?(\d+\.?\d*)/i,
    ];
    
    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        const extractedPrice = parseFloat(match[1]);
        if (!isNaN(extractedPrice) && extractedPrice > 0 && extractedPrice < 10000) {
          price = extractedPrice;
          break;
        }
      }
    }
    if (price) break;
  }
  
  // Add EAN to technical specs if found
  if (eanNumber) {
    technicalSpecs['EAN'] = eanNumber;
  }
  
  return {
    productName: productName.length > 100 ? productName.substring(0, 100) + '...' : productName,
    category,
    images: [...new Set(images)].slice(0, 5), // Remove duplicates and limit to 5
    technicalSpecs,
    oemNumbers: [...new Set(oemNumbers)].slice(0, 15), // Increased limit for more OE numbers
    price,
    availability: 'Check with supplier',
  };
}