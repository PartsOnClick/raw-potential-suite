import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload as UploadIcon, File, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    rowCount: number;
    data?: any[];
  } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      validateCSV(selectedFile);
    }
  };

  const validateCSV = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const errors: string[] = [];
      
      if (lines.length < 2) {
        errors.push("CSV must contain at least a header row and one data row");
      }
      
      const header = lines[0].toLowerCase();
      const headerRow = header.split(',').map(h => h.trim());
      
      // Check for required columns with flexible matching
      const hasBrand = headerRow.some(h => h.includes('brand'));
      const hasSku = headerRow.some(h => h.includes('sku'));
      const hasOE = headerRow.some(h => h.includes('oe') || h.includes('oenumber'));
      const hasTitle = headerRow.some(h => h.includes('title'));
      
      const missingColumns = [];
      if (!hasBrand) missingColumns.push('brand');
      if (!hasSku) missingColumns.push('sku');
      if (!hasOE) missingColumns.push('oe_number');
      if (!hasTitle) missingColumns.push('title');
      
      if (missingColumns.length > 0) {
        errors.push(`CSV must contain these columns: brand, sku, oe_number, title. Missing: ${missingColumns.join(', ')}`);
      }
      
      // Parse CSV data
      const headerColumns = lines[0].split(',').map(h => h.trim().toLowerCase());
      const brandIndex = headerColumns.findIndex(h => h.includes('brand'));
      const skuIndex = headerColumns.findIndex(h => h.includes('sku'));
      const oeIndex = headerColumns.findIndex(h => h.includes('oe') || h.includes('oenumber'));
      const titleIndex = headerColumns.findIndex(h => h.includes('title'));
      
      const csvData: any[] = [];
      const dataRows = lines.slice(1);
      
      dataRows.forEach((line, index) => {
        const columns = line.split(',').map(col => col.trim());
        if (columns.length < 4) {
          errors.push(`Row ${index + 2}: Insufficient columns (need at least 4)`);
        } else {
          const brand = columns[brandIndex]?.replace(/['"]/g, '') || '';
          const sku = columns[skuIndex]?.replace(/['"]/g, '') || '';
          const oeNumber = columns[oeIndex]?.replace(/['"]/g, '') || '';
          const title = columns[titleIndex]?.replace(/['"]/g, '') || '';
          
          if (!brand || !sku || !title) {
            errors.push(`Row ${index + 2}: Empty brand, SKU, or title`);
          } else {
            csvData.push({ 
              brand, 
              sku, 
              oe_number: oeNumber,
              original_title: title
            });
          }
        }
      });
      
      setValidationResult({
        isValid: errors.length === 0,
        errors,
        rowCount: csvData.length,
        data: csvData
      });
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: ["Failed to read CSV file"],
        rowCount: 0
      });
    }
  };

  const handleUpload = async () => {
    if (!file || !validationResult?.isValid || !validationResult.data) return;
    
    setIsProcessing(true);
    try {
      console.log('Creating batch with data:', validationResult.data);
      
      // Create batch in database
      const { data: batch, error: batchError } = await supabase
        .from('import_batches')
        .insert({
          name: `${file.name} - ${new Date().toLocaleString()}`,
          status: 'pending',
          total_items: validationResult.rowCount,
          csv_data: validationResult.data
        })
        .select()
        .single();

      if (batchError) {
        console.error('Batch creation error:', batchError);
        throw new Error('Failed to create batch: ' + batchError.message);
      }

      console.log('Batch created:', batch);

      // Create products in database
      const productsToInsert = validationResult.data.map(item => ({
        batch_id: batch.id,
        brand: item.brand.toLowerCase(),
        sku: item.sku,
        oe_number: item.oe_number,
        original_title: item.original_title,
        scraping_status: 'pending',
        ai_content_status: 'pending'
      }));

      const { error: productsError } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (productsError) {
        console.error('Products creation error:', productsError);
        throw new Error('Failed to create products: ' + productsError.message);
      }

      console.log('Products created, starting batch processing...');

      // Start batch processing
      const response = await supabase.functions.invoke('batch-processor', {
        body: { batchId: batch.id }
      });

      if (response.error) {
        console.error('Batch processing error:', response.error);
        throw new Error('Failed to start processing: ' + response.error.message);
      }

      console.log('Batch processing started successfully');
      
      toast({
        title: "Upload Successful",
        description: `Created batch with ${validationResult.rowCount} items. Processing started in background!`,
      });
      
      // Reset form
      setFile(null);
      setValidationResult(null);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) input.value = '';
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to create processing batch",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Upload & Process</h1>
            <p className="text-muted-foreground">
              Upload your CSV file with brand, SKU, OE number, and title data for eBay-first processing
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>CSV File Upload</CardTitle>
              <CardDescription>
                Select a CSV file with 'brand', 'sku', 'oe_number', and 'title' columns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="csv-file"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <UploadIcon className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to select CSV file or drag and drop
                    </span>
                  </label>
                </div>
              </div>

              {file && (
                <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                  <File className="w-4 h-4" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}

              {validationResult && (
                <Alert variant={validationResult.isValid ? "default" : "destructive"}>
                  {validationResult.isValid ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {validationResult.isValid ? (
                      <div>
                        <p className="font-medium">Validation Successful</p>
                        <p>Found {validationResult.rowCount} products ready for processing</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">Validation Errors:</p>
                        <ul className="list-disc list-inside mt-1">
                          {validationResult.errors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file || !validationResult?.isValid || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? "Creating Batch & Starting Processing..." : "Start Processing"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CSV Format Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Required Columns:</p>
                  <ul className="list-disc list-inside ml-4 text-muted-foreground">
                    <li><code>brand</code> - Manufacturer name (e.g., Febi, Monroe)</li>
                    <li><code>sku</code> - Part number/SKU (e.g., 2205000049)</li>
                    <li><code>oe_number</code> - OE/OEM number (e.g., A2205000049)</li>
                    <li><code>title</code> - Original product title</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Example:</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
brand,sku,oe_number,title{'\n'}Febi,2205000049,A2205000049,Shock Absorber Rear{'\n'}Monroe,376047SP,37143,Front Strut Assembly
                  </pre>
                </div>
                <div>
                  <p className="font-medium text-blue-600">eBay-First Processing:</p>
                  <p className="text-sm text-muted-foreground">
                    The system will search eBay using Brand+SKU, then Brand+OE, then OE only. 
                    If eBay data is found, it will be used to generate optimized content. 
                    Otherwise, DeepSeek will work with the original title.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Upload;