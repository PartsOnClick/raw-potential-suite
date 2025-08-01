import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import ProcessingStatus from "./pages/ProcessingStatus";
import ProductReview from "./pages/ProductReview";
import ExportManager from "./pages/ExportManager";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/status" element={<ProcessingStatus />} />
          <Route path="/products" element={<ProductReview />} />
          <Route path="/export" element={<ExportManager />} />
          <Route path="/history" element={<div className="p-8 text-center">History page coming soon...</div>} />
          <Route path="/analytics" element={<div className="p-8 text-center">Analytics page coming soon...</div>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
