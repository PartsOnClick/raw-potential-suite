import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// eBay API Configuration
const EBAY_CONFIG = {
  client_id: Deno.env.get('EBAY_CLIENT_ID')!,
  client_secret: Deno.env.get('EBAY_CLIENT_SECRET')!,
  dev_id: Deno.env.get('EBAY_DEV_ID')!,
  access_token: Deno.env.get('EBAY_ACCESS_TOKEN')!,
  refresh_token: Deno.env.get('EBAY_REFRESH_TOKEN')!,
  sandbox_mode: false
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, brand, sku, oeNumber } = await req.json();
    
    console.log(`[eBay Search] Starting search for product ${productId}: Brand=${brand}, SKU=${sku}, OE=${oeNumber}`);

    // Log the start of eBay processing
    await supabase.from('processing_logs').insert({
      product_id: productId,
      operation_type: 'ebay_search',
      status: 'started',
      operation_details: { brand, sku, oeNumber }
    });

    let searchResults = null;
    let searchStrategy = '';

    // Strategy 1: Brand + SKU
    if (brand && sku) {
      console.log(`[eBay Search] Trying Brand + SKU: ${brand} ${sku}`);
      searchResults = await searchEbayItems(`${brand} ${sku}`);
      if (searchResults?.itemSummaries?.length > 0) {
        searchStrategy = 'brand_sku';
        console.log(`[eBay Search] Found ${searchResults.itemSummaries.length} items with Brand + SKU`);
      }
    }

    // Strategy 2: Brand + OE Number (if Strategy 1 failed)
    if (!searchResults?.itemSummaries?.length && brand && oeNumber) {
      console.log(`[eBay Search] Trying Brand + OE Number: ${brand} ${oeNumber}`);
      searchResults = await searchEbayItems(`${brand} ${oeNumber}`);
      if (searchResults?.itemSummaries?.length > 0) {
        searchStrategy = 'brand_oe';
        console.log(`[eBay Search] Found ${searchResults.itemSummaries.length} items with Brand + OE`);
      }
    }

    // Strategy 3: OE Number only (if previous strategies failed)
    if (!searchResults?.itemSummaries?.length && oeNumber) {
      console.log(`[eBay Search] Trying OE Number only: ${oeNumber}`);
      searchResults = await searchEbayItems(oeNumber);
      if (searchResults?.itemSummaries?.length > 0) {
        searchStrategy = 'oe_only';
        console.log(`[eBay Search] Found ${searchResults.itemSummaries.length} items with OE only`);
      }
    }

    let ebayData = {};
    let ebayItemId = null;
    let partNumberTags: string[] = [];

    if (searchResults?.itemSummaries?.length > 0) {
      // Get the best matching item (prioritize brand match)
      const bestItem = getBestMatchingItem(searchResults.itemSummaries, brand);
      ebayItemId = extractItemId(bestItem.itemId);
      
      console.log(`[eBay Search] Selected best item: ${ebayItemId}`);

      // Get detailed item information
      const itemDetails = await getEbayItemDetails(ebayItemId);
      
      if (itemDetails && !itemDetails.error) {
        ebayData = {
          searchStrategy,
          searchResults: searchResults.itemSummaries.slice(0, 5), // Keep top 5 results
          selectedItem: bestItem,
          itemDetails: itemDetails,
          timestamp: new Date().toISOString()
        };

        // Extract part numbers for tags
        partNumberTags = extractPartNumberTags(itemDetails);
        console.log(`[eBay Search] Extracted ${partNumberTags.length} part number tags`);
      }
    }

    // Update product with eBay data
    const updateData: any = {
      scraping_status: searchResults?.itemSummaries?.length > 0 ? 'completed' : 'no_results',
      ebay_item_id: ebayItemId,
      ebay_data: ebayData,
      part_number_tags: partNumberTags,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error('[eBay Search] Error updating product:', updateError);
      throw updateError;
    }

    // Log success
    await supabase.from('processing_logs').insert({
      product_id: productId,
      operation_type: 'ebay_search',
      status: 'completed',
      operation_details: { 
        searchStrategy, 
        resultsFound: searchResults?.itemSummaries?.length || 0,
        ebayItemId,
        partNumberTagsCount: partNumberTags.length
      }
    });

    console.log(`[eBay Search] Completed for product ${productId}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      strategy: searchStrategy,
      resultsFound: searchResults?.itemSummaries?.length || 0,
      ebayItemId,
      partNumberTags: partNumberTags.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[eBay Search] Error:', error);
    
    // Log error
    const { productId } = await req.json().catch(() => ({}));
    if (productId) {
      await supabase.from('processing_logs').insert({
        product_id: productId,
        operation_type: 'ebay_search',
        status: 'failed',
        error_message: error.message,
        operation_details: { error: error.toString() }
      });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function searchEbayItems(query: string) {
  const endpoint = "https://api.ebay.com/buy/browse/v1/item_summary/search";
  
  const params = new URLSearchParams({
    q: query,
    category_ids: '6030', // Motor Parts & Accessories
    fieldgroups: 'COMPATIBILITY,MATCHING_ITEMS',
    limit: '10',
    offset: '0'
  });

  const url = `${endpoint}?${params}`;
  
  const headers = {
    "Authorization": `Bearer ${EBAY_CONFIG.access_token}`,
    "Content-Type": "application/json",
    "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    "Accept-Language": "en-US,en;q=0.9"
  };

  const response = await fetch(url, {
    method: 'GET',
    headers: headers
  });

  if (response.status !== 200) {
    console.error(`[eBay Search] Search API returned HTTP ${response.status}`);
    return { error: `Search API returned HTTP ${response.status}` };
  }

  const data = await response.json();
  
  // Filter English listings only
  if (data.itemSummaries) {
    data.itemSummaries = filterEnglishListings(data.itemSummaries);
    data.total = data.itemSummaries.length;
  }

  return data;
}

function filterEnglishListings(items: any[]) {
  return items.filter(item => {
    const title = item.title || '';
    const sellerCountry = item.itemLocation?.country || '';
    
    // Priority: English-speaking countries
    const englishCountries = ['US', 'GB', 'CA', 'AU', 'IE', 'NZ'];
    if (englishCountries.includes(sellerCountry)) {
      return true;
    }
    
    // Check for non-English characters
    if (hasNonEnglishCharacters(title)) {
      return false;
    }
    
    // Check for non-English words
    if (hasNonEnglishWords(title)) {
      return false;
    }
    
    // Title length check
    if (title.trim().length < 10) {
      return false;
    }
    
    return true;
  });
}

function hasNonEnglishCharacters(text: string) {
  // Check for non-Latin characters
  const patterns = [
    /[\u4e00-\u9fff]/g, // Chinese
    /[\u3040-\u309f]/g, // Hiragana
    /[\u30a0-\u30ff]/g, // Katakana
    /[\uac00-\ud7af]/g, // Korean
    /[\u0600-\u06ff]/g, // Arabic
    /[\u0400-\u04ff]/g, // Cyrillic
    /[\u0370-\u03ff]/g  // Greek
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

function hasNonEnglishWords(text: string) {
  const lowerText = text.toLowerCase();
  const nonEnglishPatterns = [
    // German
    'für', 'mit', 'und', 'der', 'die', 'das', 'von', 'zu', 'im', 'am',
    // French  
    'pour', 'avec', 'et', 'le', 'la', 'les', 'de', 'du', 'au', 'aux',
    // Spanish
    'para', 'con', 'y', 'el', 'la', 'los', 'las', 'de', 'del', 'al',
    // Italian
    'per', 'con', 'e', 'il', 'lo', 'la', 'i', 'gli', 'le', 'di', 'del'
  ];
  
  return nonEnglishPatterns.some(pattern => lowerText.includes(pattern));
}

function getBestMatchingItem(items: any[], targetBrand: string) {
  if (!targetBrand) return items[0];
  
  const brandLower = targetBrand.toLowerCase();
  
  // Look for exact brand match first
  for (const item of items) {
    const title = (item.title || '').toLowerCase();
    if (title.includes(brandLower)) {
      return item;
    }
  }
  
  // Return first item if no brand match
  return items[0];
}

function extractItemId(fullItemId: string) {
  const parts = fullItemId.split('|');
  return parts.length > 1 ? parts[1] : fullItemId;
}

async function getEbayItemDetails(itemId: string) {
  const endpoint = "https://api.ebay.com/ws/api.dll";
  
  const headers = {
    'Content-Type': 'text/xml',
    'X-EBAY-API-CALL-NAME': 'GetItem',
    'X-EBAY-API-SITEID': '0',
    'X-EBAY-API-DEV-NAME': EBAY_CONFIG.dev_id,
    'X-EBAY-API-APP-NAME': EBAY_CONFIG.client_id,
    'X-EBAY-API-CERT-NAME': EBAY_CONFIG.client_secret,
    'X-EBAY-API-COMPATIBILITY-LEVEL': '967'
  };
  
  const requestXml = `<?xml version="1.0" encoding="utf-8"?>
    <GetItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${EBAY_CONFIG.access_token}</eBayAuthToken>
      </RequesterCredentials>
      <ErrorLanguage>en_US</ErrorLanguage>
      <WarningLevel>High</WarningLevel>
      <IncludeItemCompatibilityList>true</IncludeItemCompatibilityList>
      <IncludeItemSpecifics>true</IncludeItemSpecifics>
      <ItemID>${itemId}</ItemID>
    </GetItemRequest>`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: requestXml
  });

  if (response.status !== 200) {
    console.error(`[eBay Details] API returned HTTP ${response.status}`);
    return { error: `Details API returned HTTP ${response.status}` };
  }

  const xmlText = await response.text();
  
  try {
    // Parse XML response (simplified parsing)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for errors
    const errors = xmlDoc.getElementsByTagName('Errors');
    if (errors.length > 0) {
      const errorMsg = xmlDoc.getElementsByTagName('LongMessage')[0]?.textContent;
      return { error: `eBay API Error: ${errorMsg}` };
    }

    // Extract relevant data
    const item = xmlDoc.getElementsByTagName('Item')[0];
    if (!item) {
      return { error: 'No item data found' };
    }

    return {
      title: getXmlValue(xmlDoc, 'Title'),
      description: getXmlValue(xmlDoc, 'Description'),
      condition: getXmlValue(xmlDoc, 'ConditionDisplayName'),
      price: getXmlValue(xmlDoc, 'CurrentPrice'),
      currency: getXmlValue(xmlDoc, 'CurrencyID'),
      itemSpecifics: extractItemSpecifics(xmlDoc),
      compatibility: extractCompatibility(xmlDoc),
      images: extractImages(xmlDoc),
      seller: {
        username: getXmlValue(xmlDoc, 'UserID'),
        feedback: getXmlValue(xmlDoc, 'FeedbackScore')
      }
    };

  } catch (error) {
    console.error('[eBay Details] XML parsing error:', error);
    return { error: 'Failed to parse eBay response' };
  }
}

function getXmlValue(doc: Document, tagName: string): string {
  const element = doc.getElementsByTagName(tagName)[0];
  return element?.textContent || '';
}

function extractItemSpecifics(doc: Document) {
  const specifics: Record<string, string> = {};
  const nameValueList = doc.getElementsByTagName('NameValueList');
  
  for (let i = 0; i < nameValueList.length; i++) {
    const name = nameValueList[i].getElementsByTagName('Name')[0]?.textContent;
    const value = nameValueList[i].getElementsByTagName('Value')[0]?.textContent;
    if (name && value) {
      specifics[name] = value;
    }
  }
  
  return specifics;
}

function extractCompatibility(doc: Document) {
  // Extract vehicle compatibility data
  const compatibility: any[] = [];
  // Implementation would parse compatibility data from XML
  return compatibility;
}

function extractImages(doc: Document) {
  const images: string[] = [];
  const pictureURLs = doc.getElementsByTagName('PictureURL');
  
  for (let i = 0; i < pictureURLs.length; i++) {
    const url = pictureURLs[i].textContent;
    if (url) images.push(url);
  }
  
  return images;
}

function extractPartNumberTags(itemDetails: any): string[] {
  const tags = new Set<string>();
  const specifics = itemDetails.itemSpecifics || {};
  
  // Common part number fields in eBay motor parts
  const partNumberFields = [
    'OE/OEM Part Number',
    'Other Part Number', 
    'Interchange Part Number',
    'Manufacturer Part Number',
    'Part Number',
    'OEM Part Number',
    'Reference OE/OEM Number',
    'Superseded Part Number'
  ];
  
  partNumberFields.forEach(field => {
    const value = specifics[field];
    if (value && typeof value === 'string') {
      // Split by common separators and clean up
      const parts = value.split(/[,;|\/\s]+/)
        .map(part => part.trim())
        .filter(part => part.length > 2 && !/^[a-zA-Z]+$/.test(part)); // Filter out too short or only letters
      
      parts.forEach(part => tags.add(part));
    }
  });
  
  return Array.from(tags);
}