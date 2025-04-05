
import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Settings, 
  Calendar, 
  ChartBar, 
  ChevronLeft, 
  ChevronRight
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const Layout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const navItems = [
    { name: "Dashboard", path: "/", icon: <Home className="mr-2 h-4 w-4" /> },
    { name: "Input Settings", path: "/input-settings", icon: <Settings className="mr-2 h-4 w-4" /> },
    { name: "Month Summary", path: "/month/2025/4", icon: <Calendar className="mr-2 h-4 w-4" /> },
    { name: "Annual Summary", path: "/annual-summary", icon: <ChartBar className="mr-2 h-4 w-4" /> },
  ];

  const Sidebar = (
    <div className="h-full flex flex-col bg-tavern-blue">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-white">The Tavern</h1>
        <p className="text-tavern-blue-light text-sm">Kitchen Ledger</p>
      </div>
      <Separator className="bg-tavern-blue-light/20" />
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
              location.pathname === item.path
                ? "bg-white text-tavern-blue font-medium"
                : "text-white hover:bg-white/10"
            )}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="p-4">
        <p className="text-xs text-tavern-blue-light">© 2025 The Tavern</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {isMobile ? (
        <>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="fixed left-4 top-4 z-40 md:hidden"
              >
                {sidebarOpen ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              {Sidebar}
            </SheetContent>
          </Sheet>
          <div className="flex-1 overflow-auto pt-16">
            <Outlet />
          </div>
        </>
      ) : (
        <>
          <div className="hidden md:flex w-64 flex-shrink-0">
            {Sidebar}
          </div>
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </>
      )}
    </div>
  );
};

export default Layout;
