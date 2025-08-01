import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, TrendingUp, Cog, History, FileText, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Auto Parts Data Processor
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your CSV data into WooCommerce-ready product listings with automated Autodoc scraping and AI-powered content generation
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/upload">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Upload & Process</CardTitle>
                <CardDescription>
                  Upload your CSV file with brand and SKU data to start processing
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/status">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition-colors">
                  <Activity className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>Processing Status</CardTitle>
                <CardDescription>
                  Monitor real-time progress of your data processing batches
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/products">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                  <Cog className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Product Review</CardTitle>
                <CardDescription>
                  Review and edit scraped product data before export
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/export">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-3 group-hover:bg-success/20 transition-colors">
                  <FileText className="w-6 h-6 text-success" />
                </div>
                <CardTitle>Export Manager</CardTitle>
                <CardDescription>
                  Generate WooCommerce-compatible CSV files for import
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/history">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mb-3 group-hover:bg-warning/20 transition-colors">
                  <History className="w-6 h-6 text-warning" />
                </div>
                <CardTitle>Import History</CardTitle>
                <CardDescription>
                  View past imports and processing statistics
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/analytics">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center mb-3 group-hover:bg-info/20 transition-colors">
                  <TrendingUp className="w-6 h-6 text-info" />
                </div>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Performance metrics and processing insights
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Active Batches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">0</div>
                  <div className="text-sm text-muted-foreground">Products Processed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                No recent activity. Upload your first CSV to get started!
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
