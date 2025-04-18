
import React, { useEffect, useState } from "react";

// You would replace this with your actual sidebar component or just add the useEffect logic to your existing sidebar
export const Sidebar = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [sidebarColor, setSidebarColor] = useState<string | null>(null);

  useEffect(() => {
    // Function to update sidebar color based on current theme
    const updateSidebarColor = () => {
      const html = document.documentElement;
      
      // For custom themes, apply the custom sidebar color directly
      if (html.classList.contains('theme-purple-700')) {
        // Get the sidebar color from CSS variable or localStorage
        const cssVarColor = getComputedStyle(html).getPropertyValue('--custom-sidebar-color').trim();
        const localStorageColor = localStorage.getItem('custom-sidebar-color');
        
        // Use either the CSS variable or localStorage value, preferring localStorage for immediate updates
        const color = localStorageColor || cssVarColor;
        
        if (color) {
          setSidebarColor(color);
          console.log('Applied custom sidebar color from stored value:', color);
        }
      } else if (html.classList.contains('theme-nfd-theme')) {
        setSidebarColor('#ec193a');
        console.log('Applied NFD theme sidebar color');
      } else if (html.classList.contains('theme-berry-purple')) {
        setSidebarColor('#8e24aa');
        console.log('Applied Berry Purple sidebar color');
      } else if (html.classList.contains('theme-forest-green')) {
        setSidebarColor('#2e7d32');
        console.log('Applied Forest Green sidebar color');
      } else if (html.classList.contains('theme-ocean-blue')) {
        setSidebarColor('#1976d2');
        console.log('Applied Ocean Blue sidebar color');
      } else if (html.classList.contains('theme-sunset-orange')) {
        setSidebarColor('#ef6c00');
        console.log('Applied Sunset Orange sidebar color');
      } else if (html.classList.contains('theme-dark-mode')) {
        setSidebarColor('#333333');
        console.log('Applied Dark Mode sidebar color');
      } else {
        // Default fallback
        setSidebarColor('#7e57c2');
        console.log('Applied default sidebar color');
      }
    };
    
    // Update color on mount
    updateSidebarColor();
    
    // Update on theme changes
    const handleThemeChange = () => {
      updateSidebarColor();
    };
    
    // Listen for theme class changes
    document.addEventListener('themeClassChanged', handleThemeChange);
    
    // Listen for the app theme updated event
    window.addEventListener('app-theme-updated', handleThemeChange);
    
    return () => {
      document.removeEventListener('themeClassChanged', handleThemeChange);
      window.removeEventListener('app-theme-updated', handleThemeChange);
    };
  }, []);

  return (
    <div 
      className={`sidebar ${className}`} 
      style={{ backgroundColor: sidebarColor || undefined }}
    >
      {children}
    </div>
  );
};
