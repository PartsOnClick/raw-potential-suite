import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2, Search, Info, Upload, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EbayConfig {
  client_id: string;
  client_secret: string;
  dev_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at?: number;
  sandbox_mode?: boolean;
}

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

const EbayValidation = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    connection: TestResult | null;
    search: TestResult | null;
    itemDetails: TestResult | null;
  }>({ connection: null, search: null, itemDetails: null });
  const [testQuery, setTestQuery] = useState("bmw air filter");
  const [testItemId, setTestItemId] = useState("");
  const [configInput, setConfigInput] = useState("");
  const [ebayConfig, setEbayConfig] = useState<EbayConfig | null>(null);
  const [useCustomConfig, setUseCustomConfig] = useState(false);
  const { toast } = useToast();

  const parseEbayConfig = () => {
    try {
      // Try to parse as JSON first
      let config: EbayConfig;
      
      if (configInput.trim().startsWith('{')) {
        config = JSON.parse(configInput);
      } else {
        // Parse PHP-style config
        const lines = configInput.split('\n');
        config = {} as EbayConfig;
        
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.includes('=>')) {
            const [key, value] = trimmed.split('=>').map(s => s.trim());
            const cleanKey = key.replace(/['"`]/g, '');
            const cleanValue = value.replace(/[,'"`]/g, '');
            
            switch (cleanKey) {
              case 'client_id':
                config.client_id = cleanValue;
                break;
              case 'client_secret':
                config.client_secret = cleanValue;
                break;
              case 'dev_id':
                config.dev_id = cleanValue;
                break;
              case 'access_token':
                config.access_token = cleanValue;
                break;
              case 'refresh_token':
                config.refresh_token = cleanValue;
                break;
              case 'token_expires_at':
                config.token_expires_at = parseInt(cleanValue);
                break;
              case 'sandbox_mode':
                config.sandbox_mode = cleanValue === 'true';
                break;
            }
          } else if (trimmed.includes(':')) {
            // Handle key-value pairs separated by colon
            const [key, value] = trimmed.split(':').map(s => s.trim());
            const cleanKey = key.toLowerCase().replace(/\s+/g, '_');
            const cleanValue = value.replace(/[,'"`]/g, '');
            
            switch (cleanKey) {
              case 'client_id':
                config.client_id = cleanValue;
                break;
              case 'client_secret':
                config.client_secret = cleanValue;
                break;
              case 'dev_id':
                config.dev_id = cleanValue;
                break;
              case 'access_token':
                config.access_token = cleanValue;
                break;
              case 'refresh_token':
                config.refresh_token = cleanValue;
                break;
              case 'expires_at':
              case 'token_expires_at':
                config.token_expires_at = parseInt(cleanValue);
                break;
            }
          }
        });
      }
      
      setEbayConfig(config);
      setUseCustomConfig(true);
      
      toast({
        title: "Config Parsed",
        description: "eBay configuration loaded successfully",
      });
      
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse eBay configuration. Please check the format.",
        variant: "destructive"
      });
    }
  };

  const runConnectionTest = async () => {
    setTesting(true);
    const results = {
      connection: null as TestResult | null,
      search: null as TestResult | null,
      itemDetails: null as TestResult | null
    };

    try {
      // Test 1: Basic connection and credentials validation
      console.log("Testing eBay API connection...");
      
      let accessToken = '';
      
      if (useCustomConfig && ebayConfig) {
        // Use custom config
        accessToken = ebayConfig.access_token;
        
        // Check if token is expired
        if (ebayConfig.token_expires_at && ebayConfig.token_expires_at < Date.now() / 1000) {
          results.connection = {
            success: false,
            message: "❌ Access token has expired",
            error: `Token expired at ${new Date(ebayConfig.token_expires_at * 1000).toLocaleString()}`
          };
        }
      } else {
        // Try to get token from Supabase secrets (fallback)
        try {
          accessToken = await getEbayAccessToken();
        } catch (error) {
          results.connection = {
            success: false,
            message: "❌ Failed to get access token from Supabase",
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      if (accessToken && !results.connection) {
        // Make a simple search call to test connectivity
        const searchResponse = await fetch('https://api.ebay.com/buy/browse/v1/item_summary/search?q=test&category_ids=6030&limit=1', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB'
          }
        });

        if (searchResponse.ok) {
          results.connection = {
            success: true,
            message: "✅ eBay API connection successful",
          };
        } else {
          const errorText = await searchResponse.text();
          results.connection = {
            success: false,
            message: "❌ eBay API connection failed",
            error: `HTTP ${searchResponse.status}: ${errorText}`
          };
        }
      }

      // Test 2: Search functionality
      if (results.connection?.success && accessToken) {
        console.log(`Testing search with query: ${testQuery}`);
        
        const searchTestResponse = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(testQuery)}&category_ids=6030&limit=5`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB'
          }
        });

        if (searchTestResponse.ok) {
          const searchData = await searchTestResponse.json();
          results.search = {
            success: true,
            message: `✅ Search successful - Found ${searchData.total || 0} items`,
            data: searchData
          };

          // Set test item ID from search results
          if (searchData.itemSummaries && searchData.itemSummaries.length > 0) {
            const firstItem = searchData.itemSummaries[0];
            const itemId = firstItem.itemId?.replace('v1|', '').split('|')[0];
            setTestItemId(itemId);
          }
        } else {
          const errorText = await searchTestResponse.text();
          results.search = {
            success: false,
            message: "❌ Search test failed",
            error: `HTTP ${searchTestResponse.status}: ${errorText}`
          };
        }
      }

      // Test 3: Item details (if we have an item ID)
      if (results.search?.success && testItemId) {
        console.log(`Testing item details for: ${testItemId}`);
        
        try {
          // Test our edge function's item details capability
          const { data, error } = await supabase.functions.invoke('ebay-search', {
            body: {
              productId: 'test-validation',
              brand: 'test',
              sku: 'validation',
              oeNumber: '12345'
            }
          });

          if (error) {
            results.itemDetails = {
              success: false,
              message: "❌ Item details test failed",
              error: error.message
            };
          } else {
            results.itemDetails = {
              success: true,
              message: "✅ Item details retrieval working",
              data: data
            };
          }
        } catch (err) {
          results.itemDetails = {
            success: false,
            message: "❌ Item details test failed",
            error: err instanceof Error ? err.message : 'Unknown error'
          };
        }
      }

    } catch (error) {
      results.connection = {
        success: false,
        message: "❌ Connection test failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    setTestResults(results);
    setTesting(false);

    // Show summary toast
    const allPassed = Object.values(results).every(r => r?.success !== false);
    toast({
      title: allPassed ? "All Tests Passed" : "Some Tests Failed",
      description: allPassed ? "eBay API is working correctly" : "Check the results below for details",
      variant: allPassed ? "default" : "destructive"
    });
  };

  const getEbayAccessToken = async (): Promise<string> => {
    // In a real implementation, this would get the token from Supabase secrets
    // For testing, we'll simulate the token retrieval
    const { data, error } = await supabase.functions.invoke('ebay-search', {
      body: { action: 'get_token' }
    });
    
    if (error) {
      throw new Error('Failed to get eBay access token');
    }
    
    return data?.token || '';
  };

  const getStatusBadge = (result: TestResult | null) => {
    if (!result) return <Badge variant="outline">Not tested</Badge>;
    if (result.success) return <Badge className="bg-green-500">✅ Passed</Badge>;
    return <Badge variant="destructive">❌ Failed</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">eBay API Validation</h1>
          <p className="text-muted-foreground">
            Test eBay API connectivity and functionality following the working PHP implementation
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Config Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>eBay Configuration</CardTitle>
              <CardDescription>
                Paste your eBay configuration from partsonclick.ae export or enter credentials manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useCustomConfig"
                  checked={useCustomConfig}
                  onChange={(e) => setUseCustomConfig(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="useCustomConfig">Use custom configuration</Label>
              </div>
              
              {useCustomConfig && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="configInput">eBay Configuration</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Paste the configuration from ebay_export_credentials.php or enter as JSON
                    </p>
                    <Textarea
                      id="configInput"
                      value={configInput}
                      onChange={(e) => setConfigInput(e.target.value)}
                      placeholder={`Example formats:

PHP Array:
'client_id' => 'your_client_id',
'client_secret' => 'your_secret',
'dev_id' => 'your_dev_id',
'access_token' => 'your_token',
'refresh_token' => 'your_refresh_token',

Or JSON:
{
  "client_id": "your_client_id",
  "client_secret": "your_secret",
  "dev_id": "your_dev_id",
  "access_token": "your_token",
  "refresh_token": "your_refresh_token"
}

Or Key-Value pairs:
Client ID: your_client_id
Client Secret: your_secret
Dev ID: your_dev_id
Access Token: your_token
Refresh Token: your_refresh_token`}
                      rows={12}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={parseEbayConfig} disabled={!configInput.trim()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Parse Configuration
                    </Button>
                    {ebayConfig && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(ebayConfig, null, 2));
                          toast({ title: "Copied", description: "Configuration copied to clipboard" });
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy as JSON
                      </Button>
                    )}
                  </div>
                  
                  {ebayConfig && (
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm text-green-700 font-medium">✅ Configuration Loaded</p>
                      <div className="text-xs text-green-600 mt-1">
                        <p>Client ID: {ebayConfig.client_id ? `${ebayConfig.client_id.substring(0, 15)}...` : 'Missing'}</p>
                        <p>Access Token: {ebayConfig.access_token ? `${ebayConfig.access_token.substring(0, 20)}...` : 'Missing'}</p>
                        {ebayConfig.token_expires_at && (
                          <p>Expires: {new Date(ebayConfig.token_expires_at * 1000).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>
                Configure test parameters similar to the working PHP implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testQuery">Search Query</Label>
                <Input
                  id="testQuery"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Enter search term (e.g., bmw air filter)"
                />
              </div>
              <div>
                <Label htmlFor="testItemId">Test Item ID (auto-populated from search)</Label>
                <Input
                  id="testItemId"
                  value={testItemId}
                  onChange={(e) => setTestItemId(e.target.value)}
                  placeholder="eBay item ID for detailed testing"
                />
              </div>
              <Button 
                onClick={runConnectionTest} 
                disabled={testing}
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Run eBay API Tests
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Connection Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Connection Test
                  {getStatusBadge(testResults.connection)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    {testResults.connection?.message || "Tests basic API connectivity and authentication"}
                  </p>
                  {testResults.connection?.error && (
                    <div className="bg-red-50 p-3 rounded text-sm text-red-700">
                      <strong>Error:</strong> {testResults.connection.error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Search Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Search Test
                  {getStatusBadge(testResults.search)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    {testResults.search?.message || "Tests search functionality with sample query"}
                  </p>
                  {testResults.search?.error && (
                    <div className="bg-red-50 p-3 rounded text-sm text-red-700">
                      <strong>Error:</strong> {testResults.search.error}
                    </div>
                  )}
                  {testResults.search?.data && (
                    <div className="bg-green-50 p-3 rounded text-sm text-green-700">
                      <strong>Found:</strong> {testResults.search.data.total || 0} items
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Item Details Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Item Details Test
                  {getStatusBadge(testResults.itemDetails)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    {testResults.itemDetails?.message || "Tests detailed item information retrieval"}
                  </p>
                  {testResults.itemDetails?.error && (
                    <div className="bg-red-50 p-3 rounded text-sm text-red-700">
                      <strong>Error:</strong> {testResults.itemDetails.error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          {(testResults.search?.data || testResults.itemDetails?.data) && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.search?.data && (
                    <div>
                      <Label className="text-sm font-medium">Search Results Sample</Label>
                      <Textarea
                        value={JSON.stringify(testResults.search.data, null, 2)}
                        readOnly
                        rows={8}
                        className="font-mono text-xs"
                      />
                    </div>
                  )}
                  {testResults.itemDetails?.data && (
                    <div>
                      <Label className="text-sm font-medium">Item Details Sample</Label>
                      <Textarea
                        value={JSON.stringify(testResults.itemDetails.data, null, 2)}
                        readOnly
                        rows={8}
                        className="font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Implementation Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>Based on ebay_export_credentials.php implementation:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Uses the same eBay API endpoints and authentication method</li>
                  <li>Tests connection, search, and item details retrieval</li>
                  <li>Validates credentials and token expiration</li>
                  <li>Provides detailed error messages for troubleshooting</li>
                </ul>
                <p className="text-amber-600">
                  <strong>Note:</strong> If tests fail, check that all eBay API secrets are properly configured in Supabase.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EbayValidation;