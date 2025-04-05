import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Settings, 
  Calendar, 
  ChartBar, 
  ChevronLeft, 
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  User
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { TavernLogo } from "./TavernLogo";
import { useAuthStore } from "@/services/auth-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const { user, profile, isAuthenticated, logout } = useAuthStore();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!profile) return '?';
    
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: <Home className="mr-2 h-4 w-4" /> },
    { name: "Input Settings", path: "/input-settings", icon: <Settings className="mr-2 h-4 w-4" /> },
    { name: "Month Summary", path: "/month/2025/4", icon: <Calendar className="mr-2 h-4 w-4" /> },
    { name: "Annual Summary", path: "/annual-summary", icon: <ChartBar className="mr-2 h-4 w-4" /> },
  ];

  const Sidebar = (
    <div className="h-full flex flex-col bg-[#48495E]">
      <div className="p-4 flex flex-col items-center">
        <TavernLogo size="sm" className="mb-3" />
        {!sidebarCollapsed && <p className="text-tavern-blue-light text-sm mt-1">Kitchen Tracker</p>}
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
                ? "bg-white text-[#48495E] font-medium"
                : "text-white hover:bg-white/10"
            )}
            title={sidebarCollapsed ? item.name : undefined}
          >
            <div className={sidebarCollapsed ? "mx-auto" : ""}>
              {item.icon}
            </div>
            {!sidebarCollapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>
      <div className="p-4">
        {!sidebarCollapsed && <p className="text-xs text-tavern-blue-light">© 2025 The Tavern</p>}
      </div>
    </div>
  );

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return <Outlet />;
  }

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
            <div className="absolute top-4 left-0 right-0 flex justify-center">
              <TavernLogo size="sm" />
            </div>
            <Outlet />
          </div>
        </>
      ) : (
        <>
          <div className={cn("flex-shrink-0 transition-all duration-300", 
            sidebarCollapsed ? "w-20" : "w-64")}>
            {Sidebar}
          </div>
          <div className="flex-1 overflow-auto relative">
            <div className="flex items-center justify-between px-8 py-4">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSidebar}
                className="z-40"
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
              <TavernLogo size="sm" />
              
              {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9 bg-tavern-blue text-white">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-0.5 leading-none">
                        <p className="text-sm font-medium">
                          {profile?.first_name} {profile?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer flex w-full items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <Outlet />
          </div>
        </>
      )}
    </div>
  );
}

export default Layout;
