import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Edit, Eye, Download, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockProducts = [
  {
    id: "1",
    brand: "monroe",
    sku: "376047SP",
    product_name: "Monroe Original Gas Pressure Shock Absorber 376047SP",
    category: "Shock Absorber",
    short_description: "Premium gas pressure shock absorber for enhanced vehicle stability and comfort.",
    long_description: "The Monroe Original Gas Pressure Shock Absorber delivers superior ride control...",
    price: 45.99,
    scraping_status: "scraped",
    ai_content_status: "generated",
    images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    oem_numbers: ["5764005", "96653230", "352020"],
    technical_specs: {
      "Fitting Position": "Front Axle",
      "Shock Absorber Design": "Gas Pressure",
      "Shock Absorber System": "Twin-Tube",
      "Weight": "2.1 kg"
    },
    created_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    brand: "bosch",
    sku: "0986424502",
    product_name: "Bosch Brake Pad Set Front Axle 0986424502",
    category: "Brake Pads",
    short_description: "High-performance brake pads for optimal stopping power and safety.",
    long_description: "Bosch brake pads are engineered for maximum performance...",
    price: 32.50,
    scraping_status: "scraped",
    ai_content_status: "pending",
    images: ["https://example.com/brake1.jpg"],
    oem_numbers: ["1613282780", "425467"],
    technical_specs: {
      "Fitting Position": "Front Axle",
      "Brake System": "ATE",
      "Height": "52.9 mm",
      "Thickness": "17.5 mm"
    },
    created_at: "2024-01-14T09:15:00Z"
  }
];

const ProductReview = () => {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const filteredProducts = products.filter(product =>
    product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scraped": return "bg-green-500";
      case "generated": return "bg-blue-500";
      case "pending": return "bg-yellow-500";
      case "failed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const handleSaveProduct = () => {
    toast({
      title: "Product Updated",
      description: "Product information has been saved successfully.",
    });
    setIsEditing(false);
  };

  const handleRegenerateContent = (productId: string, contentType: string) => {
    toast({
      title: "Content Regeneration Started",
      description: `Regenerating ${contentType} for product...`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Product Review</h1>
          <p className="text-muted-foreground">
            Review and edit scraped product data before export
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Products</CardTitle>
                  <Badge variant="secondary">{filteredProducts.length}</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedProduct?.id === product.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{product.brand} {product.sku}</h4>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(product.scraping_status)}`} 
                               title={`Scraping: ${product.scraping_status}`} />
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(product.ai_content_status)}`}
                               title={`AI Content: ${product.ai_content_status}`} />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.product_name || 'No title generated'}
                      </p>
                      {product.price && (
                        <p className="text-sm font-medium mt-1">£{product.price}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <div className="lg:col-span-2">
            {selectedProduct ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{selectedProduct.brand} {selectedProduct.sku}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(!isEditing)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {isEditing ? 'Cancel' : 'Edit'}
                        </Button>
                        {isEditing && (
                          <Button size="sm" onClick={handleSaveProduct}>
                            Save Changes
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Brand</Label>
                        <Input value={selectedProduct.brand} disabled />
                      </div>
                      <div>
                        <Label>SKU</Label>
                        <Input value={selectedProduct.sku} disabled />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Product Title</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerateContent(selectedProduct.id, 'title')}
                        >
                          Regenerate
                        </Button>
                      </div>
                      <Input
                        value={selectedProduct.product_name || ''}
                        disabled={!isEditing}
                        placeholder="AI-generated product title will appear here..."
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Short Description</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerateContent(selectedProduct.id, 'short_description')}
                        >
                          Regenerate
                        </Button>
                      </div>
                      <Textarea
                        value={selectedProduct.short_description || ''}
                        disabled={!isEditing}
                        placeholder="AI-generated short description will appear here..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Long Description</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerateContent(selectedProduct.id, 'long_description')}
                        >
                          Regenerate
                        </Button>
                      </div>
                      <Textarea
                        value={selectedProduct.long_description || ''}
                        disabled={!isEditing}
                        placeholder="AI-generated long description will appear here..."
                        rows={8}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Input
                          value={selectedProduct.category || ''}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Price (£)</Label>
                        <Input
                          type="number"
                          value={selectedProduct.price || ''}
                          disabled={!isEditing}
                          step="0.01"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Technical Specifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(selectedProduct.technical_specs || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-sm font-medium">{key}:</span>
                            <span className="text-sm text-muted-foreground">{value as string}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>OEM Numbers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.oem_numbers?.map((oem: string, index: number) => (
                          <Badge key={index} variant="outline">{oem}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedProduct.images?.map((image: string, index: number) => (
                        <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">Image {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Product</h3>
                  <p className="text-muted-foreground">
                    Choose a product from the list to review and edit its details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReview;