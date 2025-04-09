
import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";

// Main landing page - redirects to appropriate dashboard
const Index = () => {
  const navigate = useNavigate();
  const currentModule = useStore(state => state.currentModule);
  const modules = useStore(state => state.modules);
  
  useEffect(() => {
    // Log available modules to help diagnose issues
    console.log("Available modules on Index page:", modules);
    console.log("Current module:", currentModule);
    
    // Ensure master module is properly recognized
    if (modules.some(m => m.type === 'master')) {
      console.log("Master module is available");
    } else {
      console.error("Master module is missing from modules list");
    }
  }, [modules, currentModule]);

  // Default redirect
  return <Navigate to={`/${currentModule}/dashboard`} replace />;
};

export default Index;
