
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Users, ArrowLeft, Calendar } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Check what kind of page this might be
  const isProfilePage = path.startsWith('/profile/');
  const isWeeklyPage = path.includes('/week/'); 
  const isMonthlyPage = path.includes('/month/');
  
  // Determine which module we're in
  const getModuleFromPath = () => {
    const parts = path.split('/');
    if (parts.length > 1) {
      return parts[1]; // First part after leading slash
    }
    return null;
  };
  
  const module = getModuleFromPath();

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold mb-4 text-tavern-blue">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          {isProfilePage 
            ? "Oops! This team member profile was not found."
            : isWeeklyPage
            ? "Oops! This weekly view was not found."
            : isMonthlyPage
            ? "Oops! This monthly view was not found."
            : "Oops! This page was not found on the menu."}
        </p>
        
        <div className="space-y-4">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> Return to Dashboard
            </Link>
          </Button>
          
          {isProfilePage && (
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link to="/team/dashboard">
                  <Users className="mr-2 h-4 w-4" /> Back to Team Dashboard
                </Link>
              </Button>
            </div>
          )}
          
          {isWeeklyPage && module && (
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link to={`/${module}/dashboard`}>
                  <Calendar className="mr-2 h-4 w-4" /> Back to {module.charAt(0).toUpperCase() + module.slice(1)} Dashboard
                </Link>
              </Button>
            </div>
          )}
          
          {isMonthlyPage && module && (
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link to={`/${module}/dashboard`}>
                  <Calendar className="mr-2 h-4 w-4" /> Back to {module.charAt(0).toUpperCase() + module.slice(1)} Dashboard
                </Link>
              </Button>
            </div>
          )}
          
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link to="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
