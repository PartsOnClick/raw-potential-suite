import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Filter, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ExportManager = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<string>("woocommerce");
  const [includeImages, setIncludeImages] = useState(true);
  const [includeSpecs, setIncludeSpecs] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data: batchData, error: batchError } = await supabase
        .from('import_batches')
        .select('*')
        .in('status', ['completed', 'processing'])
        .order('created_at', { ascending: false });
      
      if (batchError) throw batchError;

      const batchesWithProducts = await Promise.all(
        (batchData || []).map(async (batch) => {
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('batch_id', batch.id);
          
          if (productsError) throw productsError;
          
          return {
            ...batch,
            products: products || [],
            successfulItems: products?.filter(p => 
              p.scraping_status === "scraped" && p.ai_content_status === "generated"
            ).length || 0
          };
        })
      );

      setBatches(batchesWithProducts);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to load export batches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentBatch = batches.find(b => b.id === selectedBatch);
  const readyProducts = currentBatch?.products.filter(p => 
    p.scraping_status === "scraped" && p.ai_content_status === "generated"
  ) || [];

  const handleSelectAll = () => {
    if (selectedProducts.length === readyProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(readyProducts.map(p => p.id));
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const cleanOemNumbers = (oemArray) => {
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

  const extractWeight = (rawData, specs) => {
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

  const extractDimensions = (rawData, specs) => {
    const dimensionFields = ['length', 'width', 'height'];
    const dimensions = {};
    
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

  const generateWooCommerceCSV = () => {
    const selectedProductData = readyProducts.filter(p => selectedProducts.includes(p.id));
    
    const headers = [
      'Type',
      'SKU',
      'Name',
      'Published',
      'Featured',
      'Visibility',
      'Short description',
      'Description',
      'Date sale price starts',
      'Date sale price ends',
      'Tax status',
      'Tax class',
      'In stock?',
      'Stock',
      'Backorders allowed?',
      'Sold individually?',
      'Weight (kg)',
      'Length (cm)',
      'Width (cm)',
      'Height (cm)',
      'Allow customer reviews?',
      'Purchase note',
      'Sale price',
      'Regular price',
      'Categories',
      'Tags',
      'Shipping class',
      'Images',
      'Download limit',
      'Download expiry days',
      'Parent',
      'Grouped products',
      'Upsells',
      'Cross-sells',
      'External URL',
      'Button text',
      'Position',
      'EAN Number',
      'Packing Length (cm)',
      'Packing Width (cm)', 
      'Packing Height (cm)',
      'Fitting Position',
      'Attribute 1 name',
      'Attribute 1 value(s)',
      'Attribute 1 visible',
      'Attribute 1 global',
      'Attribute 2 name',
      'Attribute 2 value(s)',
      'Attribute 2 visible',
      'Attribute 2 global',
      'Meta: brand',
      'Meta: oem_numbers',
      'Meta: technical_specs'
    ];

    const rows = selectedProductData.map(product => {
      // Extract data from technical_specs and raw_scraped_data
      const specs = product.technical_specs || {};
      const rawData = product.raw_scraped_data || {};
      
      // Clean OEM numbers
      const cleanedOemNumbers = cleanOemNumbers(product.oem_numbers || []);
      
      // Try to get EAN from multiple sources
      const eanNumber = rawData.ean_number || specs.ean_number || product.ean_number || '';
      
      // Try to get packing dimensions from scraped data
      const packingLength = rawData.packing_length_cm || specs.packing_length_cm || '';
      const packingWidth = rawData.packing_width_cm || specs.packing_width_cm || '';
      const packingHeight = rawData.packing_height_cm || specs.packing_height_cm || '';
      
      // Try to get fitting position
      const fittingPosition = rawData.fitting_position || specs.fitting_position || '';
      
      // Extract weight using improved method
      const weight = extractWeight(rawData, specs);
      
      // Extract dimensions using improved method
      const dimensions = extractDimensions(rawData, specs);
      
      return [
        'simple', // Type
        product.sku, // SKU
        product.product_name || `${product.brand} ${product.sku}`, // Name
        '1', // Published
        '0', // Featured
        'visible', // Visibility
        product.short_description || '', // Short description
        product.long_description || '', // Description
        '', // Date sale price starts
        '', // Date sale price ends
        'taxable', // Tax status
        '', // Tax class
        '1', // In stock?
        '100', // Stock
        '0', // Backorders allowed?
        '0', // Sold individually?
        weight, // Weight (kg)
        (dimensions as any).length || '', // Length
        (dimensions as any).width || '', // Width
        (dimensions as any).height || '', // Height
        '1', // Allow customer reviews?
        '', // Purchase note
        '', // Sale price
        product.price || '', // Regular price
        product.category || 'Auto Parts', // Categories
        `${product.brand}, auto parts`, // Tags
        '', // Shipping class
        includeImages ? (product.images && product.images.length > 0 ? product.images.join(', ') : '') : '', // Images
        '', // Download limit
        '', // Download expiry days
        '', // Parent
        '', // Grouped products
        '', // Upsells
        '', // Cross-sells
        '', // External URL
        '', // Button text
        '0', // Position
        eanNumber, // EAN Number
        packingLength, // Packing Length (cm)
        packingWidth, // Packing Width (cm)
        packingHeight, // Packing Height (cm)
        fittingPosition, // Fitting Position
        'Brand', // Attribute 1 name
        product.brand, // Attribute 1 value(s)
        '1', // Attribute 1 visible
        '0', // Attribute 1 global
        'OEM Numbers', // Attribute 2 name
        cleanedOemNumbers.length > 0 ? cleanedOemNumbers.join(', ') : '', // Attribute 2 value(s)
        '1', // Attribute 2 visible
        '0', // Attribute 2 global
        product.brand, // Meta: brand
        cleanedOemNumbers.length > 0 ? cleanedOemNumbers.join(', ') : '', // Meta: oem_numbers
        includeSpecs ? JSON.stringify(Object.assign({}, product.technical_specs || {}, product.raw_scraped_data || {})) : '' // Meta: technical_specs
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const handleExport = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select at least one product to export.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      const csvContent = generateWooCommerceCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `woocommerce-products-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Export Successful",
        description: `Exported ${selectedProducts.length} products to WooCommerce CSV`,
      });

    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate CSV file",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading export data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Export Manager</h1>
          <p className="text-muted-foreground">
            Generate WooCommerce-compatible CSV files for import
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Batch Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Select Batch</CardTitle>
                <CardDescription>
                  Choose a completed batch to export
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {batches.filter(b => b.successfulItems > 0).map(batch => (
                  <div
                    key={batch.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedBatch === batch.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      setSelectedBatch(batch.id);
                      setSelectedProducts([]);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{batch.name}</h4>
                        <p className="text-sm text-muted-foreground">{formatDate(batch.created_at)}</p>
                      </div>
                      <Badge variant={batch.status === 'completed' ? 'secondary' : 'outline'}>
                        {batch.status === 'completed' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Processing
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {batch.successfulItems} products ready for export
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Export Configuration */}
          <div className="lg:col-span-2">
            {selectedBatch ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Export Configuration</CardTitle>
                    <CardDescription>
                      Configure your WooCommerce export settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Export Format</label>
                        <Select value={exportFormat} onValueChange={setExportFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="woocommerce">WooCommerce CSV</SelectItem>
                            <SelectItem value="shopify">Shopify CSV</SelectItem>
                            <SelectItem value="magento">Magento CSV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium block">Include Options</label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="include-images"
                            checked={includeImages}
                            onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                          />
                          <label htmlFor="include-images" className="text-sm">Include product images</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="include-specs"
                            checked={includeSpecs}
                            onCheckedChange={(checked) => setIncludeSpecs(checked as boolean)}
                          />
                          <label htmlFor="include-specs" className="text-sm">Include technical specifications</label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Products ({readyProducts.length})</CardTitle>
                        <CardDescription>
                          Select products to include in export
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAll}
                        >
                          {selectedProducts.length === readyProducts.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        <Button
                          onClick={handleExport}
                          disabled={selectedProducts.length === 0 || isExporting}
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {isExporting ? 'Exporting...' : `Export (${selectedProducts.length})`}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {readyProducts.map(product => (
                        <div
                          key={product.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => handleProductSelect(product.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{product.brand} {product.sku}</h4>
                              <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {product.product_name}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm font-medium">£{product.price}</span>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-muted-foreground">Ready</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Batch</h3>
                  <p className="text-muted-foreground">
                    Choose a completed batch from the left to start configuring your export
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Export Summary */}
        {selectedBatch && selectedProducts.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Export Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{selectedProducts.length}</div>
                  <div className="text-sm text-muted-foreground">Products Selected</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">{exportFormat}</div>
                  <div className="text-sm text-muted-foreground">Export Format</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">
                    {includeImages && includeSpecs ? 'Full' : 'Basic'}
                  </div>
                  <div className="text-sm text-muted-foreground">Data Level</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">Ready</div>
                  <div className="text-sm text-muted-foreground">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExportManager;