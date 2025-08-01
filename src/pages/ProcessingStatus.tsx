import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RefreshCw, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BatchData {
  id: string;
  name: string;
  status: string;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  created_at: string;
  updated_at: string;
}

const ProcessingStatus = () => {
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('import_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching batches:', error);
        throw error;
      }

      console.log('Fetched batches:', data);
      setBatches(data || []);
    } catch (error: any) {
      console.error('Failed to fetch batches:', error);
      toast({
        title: "Error",
        description: "Failed to load processing batches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('batch_updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'import_batches' 
        }, 
        () => {
          console.log('Batch update detected, refetching...');
          fetchBatches();
        }
      )
      .subscribe();

    // Polling for updates every 10 seconds
    const interval = setInterval(fetchBatches, 10000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "failed": return "bg-red-500";
      case "paused": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "processing": return "default";
      case "completed": return "secondary";
      case "failed": return "destructive";
      case "paused": return "outline";
      default: return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleRetryBatch = async (batchId: string) => {
    try {
      const response = await supabase.functions.invoke('batch-processor', {
        body: { batchId }
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Batch Retry Started",
        description: "The batch processing has been restarted",
      });

      fetchBatches();
    } catch (error: any) {
      console.error('Retry error:', error);
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to retry batch",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    try {
      const { error } = await supabase
        .from('import_batches')
        .delete()
        .eq('id', batchId);

      if (error) {
        throw error;
      }

      toast({
        title: "Batch Deleted",
        description: "The batch has been removed",
      });

      fetchBatches();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete batch",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Processing Status</h1>
            <p className="text-muted-foreground mb-8">Loading batches...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Processing Status</h1>
          <p className="text-muted-foreground">
            Monitor real-time progress of your data processing batches
          </p>
        </div>

        <div className="space-y-6">
          {batches.map((batch) => {
            const progressPercentage = batch.total_items > 0 ? (batch.processed_items / batch.total_items) * 100 : 0;
            const successRate = batch.processed_items > 0 ? (batch.successful_items / batch.processed_items) * 100 : 0;

            return (
              <Card key={batch.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(batch.status)}`} />
                        {batch.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Created {formatDate(batch.created_at)} • Last updated {formatDate(batch.updated_at)}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(batch.status)} className="capitalize">
                      {batch.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{batch.processed_items} / {batch.total_items} items</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progressPercentage.toFixed(1)}% complete</span>
                      <span>{successRate.toFixed(1)}% success rate</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-3 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{batch.successful_items}</div>
                      <div className="text-xs text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{batch.failed_items}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {batch.total_items - batch.processed_items}
                      </div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t">
                    {batch.status === "failed" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRetryBatch(batch.id)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Failed
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteBatch(batch.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {batches.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-muted-foreground">
                  No processing batches found. Upload a CSV file to get started.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;