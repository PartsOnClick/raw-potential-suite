import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PromptTemplate {
  title: string;
  short_description: string;
  long_description: string;
  meta_description: string;
}

const defaultPrompts: PromptTemplate = {
  title: `Generate a concise, SEO-optimized product title for this auto part:
Brand: {brand}
SKU: {sku}
Category: {category}
Price: £{price}
OEM Numbers: {oem_numbers}
Technical Specs: {technical_specs}

Requirements:
- Maximum 60 characters
- Include brand, SKU only
- Professional format: "Brand SKU - Part Type"
- No extra descriptions or marketing text

Return only the clean title, no explanations or formatting.`,

  short_description: `Create a concise product description for this auto part:
Brand: {brand}
SKU: {sku}
Category: {category}
Price: £{price}
OEM Numbers: {oem_numbers}
Technical Specs: {technical_specs}
Product Name: {product_name}

Requirements:
- Maximum 155 characters
- Focus on key benefits and compatibility
- Professional tone
- No extra formatting or quotes

Return only the description text, no explanations.`,

  long_description: `Write a professional product description for this auto part:
Brand: {brand}
SKU: {sku}
Category: {category}
Price: £{price}
OEM Numbers: {oem_numbers}
Technical Specs: {technical_specs}
Product Name: {product_name}
Short Description: {short_description}

Requirements:
- 200-300 words
- Professional, informative tone
- Include technical specifications in bullet points
- Mention OEM numbers for compatibility
- Focus on quality and fitment
- Use clean HTML formatting
- No marketing fluff

Return only the HTML description, no explanations.`,

  meta_description: `Create an SEO meta description for this automotive part:

Brand: {brand}
SKU: {sku}
Category: {category}
Product Name: {product_name}
Price: {price}

Requirements:
- Exactly 150-160 characters
- Include brand, part type, and key benefit
- Call to action
- Primary keywords
- Compelling and click-worthy

Format: [Brand] [Part Type] [SKU] - [Key Benefit]. [Price] with [Quality/Delivery benefit]. [CTA]`
};

const PromptSettings = () => {
  const [prompts, setPrompts] = useState<PromptTemplate>(defaultPrompts);
  const [isModified, setIsModified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved prompts from Supabase database
    const loadPrompts = async () => {
      try {
        const { data, error } = await supabase
          .from('prompt_settings')
          .select('prompts')
          .limit(1)
          .single();
        
        if (error) {
          console.log('No saved prompts found, using defaults');
          return;
        }
        
        if (data?.prompts && typeof data.prompts === 'object' && data.prompts !== null) {
          const loadedPrompts = data.prompts as Record<string, string>;
          setPrompts({ ...defaultPrompts, ...loadedPrompts });
        }
      } catch (error) {
        console.error('Error loading saved prompts:', error);
      }
    };
    
    loadPrompts();
  }, []);

  const handlePromptChange = (type: keyof PromptTemplate, value: string) => {
    setPrompts(prev => ({
      ...prev,
      [type]: value
    }));
    setIsModified(true);
  };

  const savePrompts = async () => {
    try {
      // First try to update existing record
      const { data: existingData, error: fetchError } = await supabase
        .from('prompt_settings')
        .select('id')
        .limit(1)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('prompt_settings')
          .update({ 
            prompts: prompts as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
        
        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('prompt_settings')
          .insert({ prompts: prompts as any });
        
        if (insertError) throw insertError;
      }
      
      setIsModified(false);
      toast({
        title: "Prompts saved",
        description: "Your custom prompts have been saved and will be used for all future processing.",
      });
    } catch (error) {
      console.error('Error saving prompts:', error);
      toast({
        title: "Error saving prompts",
        description: "Failed to save your custom prompts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetToDefaults = () => {
    setPrompts(defaultPrompts);
    setIsModified(true);
    toast({
      title: "Prompts reset",
      description: "All prompts have been reset to default values.",
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Prompt Settings</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Customize the prompts used for DeepSeek AI content generation
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              onClick={savePrompts}
              disabled={!isModified}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="title" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="title">Title</TabsTrigger>
            <TabsTrigger value="short_description">Short Description</TabsTrigger>
            <TabsTrigger value="long_description">Long Description</TabsTrigger>
            <TabsTrigger value="meta_description">Meta Description</TabsTrigger>
          </TabsList>

          <TabsContent value="title" className="space-y-4">
            <div>
              <Label htmlFor="title-prompt">Title Generation Prompt</Label>
              <Textarea
                id="title-prompt"
                value={prompts.title}
                onChange={(e) => handlePromptChange('title', e.target.value)}
                rows={8}
                className="mt-2"
                placeholder="Enter your custom prompt for title generation..."
              />
            </div>
          </TabsContent>

          <TabsContent value="short_description" className="space-y-4">
            <div>
              <Label htmlFor="short-desc-prompt">Short Description Generation Prompt</Label>
              <Textarea
                id="short-desc-prompt"
                value={prompts.short_description}
                onChange={(e) => handlePromptChange('short_description', e.target.value)}
                rows={8}
                className="mt-2"
                placeholder="Enter your custom prompt for short description generation..."
              />
            </div>
          </TabsContent>

          <TabsContent value="long_description" className="space-y-4">
            <div>
              <Label htmlFor="long-desc-prompt">Long Description Generation Prompt</Label>
              <Textarea
                id="long-desc-prompt"
                value={prompts.long_description}
                onChange={(e) => handlePromptChange('long_description', e.target.value)}
                rows={8}
                className="mt-2"
                placeholder="Enter your custom prompt for long description generation..."
              />
            </div>
          </TabsContent>

          <TabsContent value="meta_description" className="space-y-4">
            <div>
              <Label htmlFor="meta-desc-prompt">Meta Description Generation Prompt</Label>
              <Textarea
                id="meta-desc-prompt"
                value={prompts.meta_description}
                onChange={(e) => handlePromptChange('meta_description', e.target.value)}
                rows={8}
                className="mt-2"
                placeholder="Enter your custom prompt for meta description generation..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Available Variables</h4>
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Product Data:</strong> <code>{"{brand}"}</code>, <code>{"{sku}"}</code>, <code>{"{category}"}</code>, 
            <code>{"{price}"}</code>, <code>{"{oem_numbers}"}</code>, <code>{"{technical_specs}"}</code>, 
            <code>{"{product_name}"}</code>, <code>{"{short_description}"}</code>
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Original CSV Data:</strong> <code>{"{csv_brand}"}</code>, <code>{"{csv_sku}"}</code>, <code>{"{csv_oe_number}"}</code>, <code>{"{csv_title}"}</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptSettings;