// Utility functions for export functionality

export const cleanOemNumbers = (oemArray: any[]) => {
  if (!Array.isArray(oemArray)) return [];
  
  return oemArray
    .filter(item => {
      if (!item || typeof item !== 'string') return false;
      
      // Remove items that are clearly not OEM numbers
      const cleanItem = item.trim().toUpperCase();
      
      // Skip brand names and common words
      const excludeWords = ['BILSTEIN', 'FEBI', 'BOSCH', 'SACHS', 'PIERBURG', 'REINZ', 'BMW', 'MERCEDES', 'AUDI', 'VW', 'VOLKSWAGEN', 'NUMBERS', 'PART', 'AUTO', 'PARTS', 'GENUINE', 'OEM', 'ORIGINAL'];
      if (excludeWords.some(word => cleanItem === word)) return false;
      
      // Skip items that are too short (less than 4 characters) or too long (more than 20)
      if (cleanItem.length < 4 || cleanItem.length > 20) return false;
      
      // Skip items with too many dots or special characters
      if ((cleanItem.match(/\./g) || []).length > 1) return false;
      if (cleanItem.includes('...')) return false;
      
      // Skip incomplete numbers (ending with dots or having weird patterns)
      if (cleanItem.endsWith('.') && cleanItem.length < 8) return false;
      
      // Must contain at least some numbers
      if (!/\d/.test(cleanItem)) return false;
      
      return true;
    })
    .map(item => item.trim().replace(/\.$/, '')) // Remove trailing dots
    .filter((item, index, arr) => arr.indexOf(item) === index); // Remove duplicates
};

export const extractWeight = (rawData: any, specs: any) => {
  // Try multiple sources and patterns for weight
  const weightSources = [
    rawData.weight,
    specs.weight,
    rawData.Weight,
    specs.Weight,
    rawData.weightKg,
    specs.weightKg,
    rawData['Weight (kg)'],
    specs['Weight (kg)'],
    rawData.extractedData?.weight,
    rawData.extractedData?.Weight
  ];
  
  for (let weight of weightSources) {
    if (weight && typeof weight === 'string') {
      // Extract numeric value from weight strings like "1.5 kg", "2kg", "500g"
      const match = weight.match(/(\d+\.?\d*)\s*(kg|g)?/i);
      if (match) {
        let value = parseFloat(match[1]);
        // Convert grams to kg
        if (match[2] && match[2].toLowerCase() === 'g') {
          value = value / 1000;
        }
        return value.toString();
      }
    } else if (weight && typeof weight === 'number') {
      return weight.toString();
    }
  }
  return '1'; // Default weight
};

export const extractDimensions = (rawData: any, specs: any) => {
  const dimensionFields = ['length', 'width', 'height'];
  const dimensions: any = {};
  
  dimensionFields.forEach(field => {
    const sources = [
      rawData[field],
      specs[field],
      rawData[field + '_cm'],
      specs[field + '_cm'],
      rawData[field.charAt(0).toUpperCase() + field.slice(1)],
      specs[field.charAt(0).toUpperCase() + field.slice(1)],
      rawData[`${field} (cm)`],
      specs[`${field} (cm)`],
      rawData.extractedData?.[field],
      rawData.extractedData?.[field + '_cm']
    ];
    
    for (let value of sources) {
      if (value && typeof value === 'string') {
        const match = value.match(/(\d+\.?\d*)\s*(cm|mm)?/i);
        if (match) {
          let numValue = parseFloat(match[1]);
          // Convert mm to cm
          if (match[2] && match[2].toLowerCase() === 'mm') {
            numValue = numValue / 10;
          }
          dimensions[field] = numValue.toString();
          break;
        }
      } else if (value && typeof value === 'number') {
        dimensions[field] = value.toString();
        break;
      }
    }
  });
  
  return dimensions;
};

export const extractItemSpecificsKeys = (products: any[]) => {
  const allItemSpecificsKeys = new Set<string>();
  products.forEach(product => {
    const itemSpecifics = product.ebay_data?.itemDetails?.itemSpecifics || {};
    Object.keys(itemSpecifics).forEach(key => {
      // Clean up the key name (remove <Name> prefix if present)
      const cleanKey = key.replace(/^<Name>/, '').trim();
      if (cleanKey) allItemSpecificsKeys.add(cleanKey);
    });
  });
  return allItemSpecificsKeys;
};

export const getItemSpecificValue = (itemSpecifics: any, key: string) => {
  const cleanKey = key.replace(/^<Name>/, '').trim();
  return itemSpecifics[key] || itemSpecifics[cleanKey] || itemSpecifics[`<Name>${cleanKey}`] || '';
};

export const extractEbayImages = (product: any) => {
  const ebayImages = product.ebay_data?.itemDetails?.thumbnailImages || [];
  const imageUrls = ebayImages.map((img: any) => img.imageUrl).filter((url: string) => url);
  const allImages = [...(product.images || []), ...imageUrls];
  return [...new Set(allImages)]; // Remove duplicates
};