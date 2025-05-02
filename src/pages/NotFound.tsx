
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Users, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Check if this is a profile page that wasn't found
  const isProfilePage = path.startsWith('/profile/');

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold mb-4 text-tavern-blue">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          {isProfilePage 
            ? "Oops! This team member profile was not found."
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
        </div>
      </div>
    </div>
  );
};

export default NotFound;
