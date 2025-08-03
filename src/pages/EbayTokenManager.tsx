import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface EbayToken {
  id: string;
  client_id: string;
  client_secret: string;
  dev_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  sandbox_mode: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const EbayTokenManager = () => {
  const [tokens, setTokens] = useState<EbayToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [newToken, setNewToken] = useState({
    client_id: '',
    client_secret: '',
    dev_id: '',
    access_token: '',
    refresh_token: '',
    token_expires_at: '',
    sandbox_mode: false
  });
  const [configText, setConfigText] = useState('');

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('ebay_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error('Error loading tokens:', error);
      toast.error('Failed to load eBay tokens');
    } finally {
      setLoading(false);
    }
  };

  const parseConfigFromText = () => {
    try {
      // Try to extract values from PHP array format
      const config: any = {};
      
      // Extract client_id
      const clientIdMatch = configText.match(/'client_id'\s*=>\s*'([^']+)'/);
      if (clientIdMatch) config.client_id = clientIdMatch[1];
      
      // Extract client_secret  
      const clientSecretMatch = configText.match(/'client_secret'\s*=>\s*'([^']+)'/);
      if (clientSecretMatch) config.client_secret = clientSecretMatch[1];
      
      // Extract dev_id
      const devIdMatch = configText.match(/'dev_id'\s*=>\s*'([^']+)'/);
      if (devIdMatch) config.dev_id = devIdMatch[1];
      
      // Extract access_token
      const accessTokenMatch = configText.match(/'access_token'\s*=>\s*'([^']+)'/);
      if (accessTokenMatch) config.access_token = accessTokenMatch[1];
      
      // Extract refresh_token
      const refreshTokenMatch = configText.match(/'refresh_token'\s*=>\s*'([^']+)'/);
      if (refreshTokenMatch) config.refresh_token = refreshTokenMatch[1];
      
      // Extract token_expires_at
      const expiresMatch = configText.match(/'token_expires_at'\s*=>\s*(\d+)/);
      if (expiresMatch) {
        const timestamp = parseInt(expiresMatch[1]);
        config.token_expires_at = new Date(timestamp * 1000).toISOString();
      }
      
      // Extract sandbox_mode
      const sandboxMatch = configText.match(/'sandbox_mode'\s*=>\s*(true|false)/);
      if (sandboxMatch) config.sandbox_mode = sandboxMatch[1] === 'true';

      setNewToken({ ...newToken, ...config });
      toast.success('Configuration parsed successfully');
    } catch (error) {
      toast.error('Failed to parse configuration');
    }
  };

  const saveToken = async () => {
    setSaving(true);
    try {
      // First, deactivate all existing tokens
      await supabase
        .from('ebay_tokens')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      // Insert new token as active
      const { error } = await supabase
        .from('ebay_tokens')
        .insert({
          ...newToken,
          is_active: true
        });

      if (error) throw error;

      toast.success('eBay token saved successfully');
      loadTokens();
      setNewToken({
        client_id: '',
        client_secret: '',
        dev_id: '',
        access_token: '',
        refresh_token: '',
        token_expires_at: '',
        sandbox_mode: false
      });
      setConfigText('');
    } catch (error) {
      console.error('Error saving token:', error);
      toast.error('Failed to save eBay token');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ebay-search', {
        body: {
          productId: 'test-validation-connection',
          action: 'test-connection',
          testQuery: 'BMW oil filter',
          brand: 'BMW',
          sku: 'test',
          oeNumber: 'test'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`eBay connection successful! Found ${data.resultsFound} items`);
      } else if (data?.error?.includes('authentication')) {
        toast.error('eBay authentication failed - please check your tokens');
      } else {
        toast.error(data?.error || 'eBay connection test failed');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      toast.error('Failed to test eBay connection');
    } finally {
      setTesting(false);
    }
  };

  const activateToken = async (tokenId: string) => {
    try {
      // Deactivate all tokens
      await supabase
        .from('ebay_tokens')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Activate selected token
      await supabase
        .from('ebay_tokens')
        .update({ is_active: true })
        .eq('id', tokenId);

      toast.success('Token activated successfully');
      loadTokens();
    } catch (error) {
      console.error('Error activating token:', error);
      toast.error('Failed to activate token');
    }
  };

  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatExpiresAt = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      return `Expired ${Math.abs(diffHours)} hours ago`;
    } else if (diffHours < 24) {
      return `Expires in ${diffHours} hours`;
    } else {
      return `Expires ${date.toLocaleDateString()}`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading eBay tokens...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">eBay Token Manager</h1>
        <p className="text-muted-foreground">
          Manage your eBay API credentials for product scraping
        </p>
      </div>

      <Tabs defaultValue="tokens" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tokens">Current Tokens</TabsTrigger>
          <TabsTrigger value="add">Add New Token</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Saved Tokens</h2>
            <Button onClick={testConnection} disabled={testing} variant="outline">
              {testing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>

          {tokens.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No eBay tokens found. Add a new token to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {tokens.map((token) => (
                <Card key={token.id} className={token.is_active ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          Client ID: {token.client_id.substring(0, 20)}...
                        </CardTitle>
                        <CardDescription>
                          {formatExpiresAt(token.token_expires_at)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {token.sandbox_mode && (
                          <Badge variant="secondary">Sandbox</Badge>
                        )}
                        {token.is_active ? (
                          <Badge variant="default">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => activateToken(token.id)}
                          >
                            Activate
                          </Button>
                        )}
                        {isTokenExpired(token.token_expires_at) && (
                          <Badge variant="destructive">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Expired
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Dev ID:</span> {token.dev_id.substring(0, 20)}...
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(token.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New eBay Token</CardTitle>
              <CardDescription>
                Add your eBay API credentials. You can paste a PHP config array or enter fields manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Config Text Area */}
              <div className="space-y-2">
                <Label htmlFor="config-text">Paste eBay Config (Optional)</Label>
                <Textarea
                  id="config-text"
                  placeholder="Paste your eBay config array here (PHP format)..."
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                  rows={8}
                />
                <Button 
                  onClick={parseConfigFromText} 
                  variant="outline" 
                  disabled={!configText.trim()}
                >
                  Parse Configuration
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    value={newToken.client_id}
                    onChange={(e) => setNewToken({ ...newToken, client_id: e.target.value })}
                    placeholder="Your eBay client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <Input
                    id="client_secret"
                    type="password"
                    value={newToken.client_secret}
                    onChange={(e) => setNewToken({ ...newToken, client_secret: e.target.value })}
                    placeholder="Your eBay client secret"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dev_id">Developer ID</Label>
                  <Input
                    id="dev_id"
                    value={newToken.dev_id}
                    onChange={(e) => setNewToken({ ...newToken, dev_id: e.target.value })}
                    placeholder="Your eBay developer ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token_expires_at">Token Expires At</Label>
                  <Input
                    id="token_expires_at"
                    type="datetime-local"
                    value={newToken.token_expires_at ? new Date(newToken.token_expires_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setNewToken({ ...newToken, token_expires_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="access_token">Access Token</Label>
                <Textarea
                  id="access_token"
                  value={newToken.access_token}
                  onChange={(e) => setNewToken({ ...newToken, access_token: e.target.value })}
                  placeholder="Your eBay access token"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh_token">Refresh Token</Label>
                <Textarea
                  id="refresh_token"
                  value={newToken.refresh_token}
                  onChange={(e) => setNewToken({ ...newToken, refresh_token: e.target.value })}
                  placeholder="Your eBay refresh token"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sandbox_mode"
                  checked={newToken.sandbox_mode}
                  onChange={(e) => setNewToken({ ...newToken, sandbox_mode: e.target.checked })}
                />
                <Label htmlFor="sandbox_mode">Sandbox Mode</Label>
              </div>

              <Button 
                onClick={saveToken} 
                disabled={saving || !newToken.client_id || !newToken.access_token}
                className="w-full"
              >
                {saving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save eBay Token'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EbayTokenManager;