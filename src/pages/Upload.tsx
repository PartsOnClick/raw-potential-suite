import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload as UploadIcon, File, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    rowCount: number;
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
      if (!header.includes('brand') || !header.includes('sku')) {
        errors.push("CSV must contain 'brand' and 'sku' columns");
      }
      
      const dataRows = lines.slice(1);
      dataRows.forEach((line, index) => {
        const columns = line.split(',');
        if (columns.length < 2) {
          errors.push(`Row ${index + 2}: Insufficient columns`);
        }
        if (columns.some(col => !col.trim())) {
          errors.push(`Row ${index + 2}: Empty brand or SKU`);
        }
      });
      
      setValidationResult({
        isValid: errors.length === 0,
        errors,
        rowCount: dataRows.length
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
    if (!file || !validationResult?.isValid) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement actual upload and batch creation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      toast({
        title: "Upload Successful",
        description: `Created batch with ${validationResult.rowCount} items`,
      });
      
      // Reset form
      setFile(null);
      setValidationResult(null);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) input.value = '';
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to create processing batch",
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
              Upload your CSV file containing brand and SKU data to start the processing pipeline
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>CSV File Upload</CardTitle>
              <CardDescription>
                Select a CSV file with 'brand' and 'sku' columns
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
                {isProcessing ? "Creating Batch..." : "Start Processing"}
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
                    <li><code>brand</code> - Manufacturer name (e.g., monroe, bosch)</li>
                    <li><code>sku</code> - Part number (e.g., 376047SP, 0986424502)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Example:</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
brand,sku{'\n'}monroe,376047SP{'\n'}bosch,0986424502{'\n'}sachs,311513
                  </pre>
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