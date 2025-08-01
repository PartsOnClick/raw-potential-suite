import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RefreshCw, Eye, Trash2 } from "lucide-react";

// Mock data for demonstration
const mockBatches = [
  {
    id: "1",
    name: "Auto Parts Batch 2024-01-15",
    status: "processing" as const,
    totalItems: 150,
    processedItems: 89,
    successfulItems: 82,
    failedItems: 7,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T11:45:00Z"
  },
  {
    id: "2", 
    name: "Monroe Parts Import",
    status: "completed" as const,
    totalItems: 50,
    processedItems: 50,
    successfulItems: 48,
    failedItems: 2,
    createdAt: "2024-01-14T09:15:00Z",
    updatedAt: "2024-01-14T09:45:00Z"
  },
  {
    id: "3",
    name: "Bosch Products Q1",
    status: "failed" as const,
    totalItems: 75,
    processedItems: 25,
    successfulItems: 20,
    failedItems: 5,
    createdAt: "2024-01-13T14:20:00Z",
    updatedAt: "2024-01-13T14:35:00Z"
  },
  {
    id: "4",
    name: "Paused Test Batch",
    status: "paused" as const,
    totalItems: 30,
    processedItems: 15,
    successfulItems: 14,
    failedItems: 1,
    createdAt: "2024-01-12T16:10:00Z",
    updatedAt: "2024-01-12T16:25:00Z"
  }
];

const ProcessingStatus = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "failed": return "bg-red-500";
      case "paused": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string) => {
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
          {mockBatches.map((batch) => {
            const progressPercentage = (batch.processedItems / batch.totalItems) * 100;
            const successRate = batch.processedItems > 0 ? (batch.successfulItems / batch.processedItems) * 100 : 0;

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
                        Created {formatDate(batch.createdAt)} • Last updated {formatDate(batch.updatedAt)}
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
                      <span>{batch.processedItems} / {batch.totalItems} items</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progressPercentage.toFixed(1)}% complete</span>
                      <span>{successRate.toFixed(1)}% success rate</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-3 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{batch.successfulItems}</div>
                      <div className="text-xs text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{batch.failedItems}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {batch.totalItems - batch.processedItems}
                      </div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t">
                    {batch.status === "processing" && (
                      <Button size="sm" variant="outline">
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    {batch.status === "paused" && (
                      <Button size="sm" variant="outline">
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    {batch.status === "failed" && (
                      <Button size="sm" variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Failed
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {mockBatches.length === 0 && (
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