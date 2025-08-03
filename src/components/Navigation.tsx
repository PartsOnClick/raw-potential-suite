import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Upload, 
  Activity, 
  Cog, 
  FileText, 
  History, 
  TrendingUp,
  Shield
} from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/upload", label: "Upload", icon: Upload },
    { to: "/status", label: "Status", icon: Activity },
    { to: "/products", label: "Products", icon: Cog },
    { to: "/export", label: "Export", icon: FileText },
    { to: "/ebay-validation", label: "eBay Test", icon: Shield },
    { to: "/history", label: "History", icon: History },
    { to: "/analytics", label: "Analytics", icon: TrendingUp },
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AP</span>
            </div>
            <span className="font-semibold text-lg hidden sm:block">Auto Parts Processor</span>
          </Link>
          
          <div className="flex items-center space-x-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Button
                key={to}
                variant={location.pathname === to ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-10",
                  location.pathname === to && "bg-primary text-primary-foreground"
                )}
                asChild
              >
                <Link to={to}>
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;