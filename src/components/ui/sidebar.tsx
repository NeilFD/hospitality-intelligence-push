
import React, { useEffect, useState } from "react";

export const Sidebar = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [sidebarColor, setSidebarColor] = useState<string | null>(null);

  useEffect(() => {
    // Function to update sidebar color based on current theme
    const updateSidebarColor = () => {
      const html = document.documentElement;
      
      // Berry Purple fallback color - will be used if nothing else works
      let fallbackColor = '#8e24aa';
      
      if (html.classList.contains('theme-nfd-theme')) {
        // Specific handling for NFD theme - highest priority
        setSidebarColor('#ec193a');
        console.log('Applied NFD theme sidebar color: #ec193a');
      } else if (html.classList.contains('theme-purple-700')) {
        // Custom theme handling
        const cssVarColor = getComputedStyle(html).getPropertyValue('--custom-sidebar-color').trim();
        const localStorageColor = localStorage.getItem('custom-sidebar-color');
        
        // Use either the CSS variable or localStorage value, preferring localStorage
        const color = localStorageColor || cssVarColor || fallbackColor;
        setSidebarColor(color);
        console.log('Applied custom sidebar color:', color);
      } else if (html.classList.contains('theme-berry-purple')) {
        setSidebarColor('#8e24aa');
        console.log('Applied Berry Purple sidebar color: #8e24aa');
      } else if (html.classList.contains('theme-forest-green')) {
        setSidebarColor('#2e7d32');
        console.log('Applied Forest Green sidebar color: #2e7d32');
      } else if (html.classList.contains('theme-ocean-blue')) {
        setSidebarColor('#1976d2');
        console.log('Applied Ocean Blue sidebar color: #1976d2');
      } else if (html.classList.contains('theme-sunset-orange')) {
        setSidebarColor('#ef6c00');
        console.log('Applied Sunset Orange sidebar color: #ef6c00');
      } else if (html.classList.contains('theme-dark-mode')) {
        setSidebarColor('#333333');
        console.log('Applied Dark Mode sidebar color: #333333');
      } else {
        // Default fallback to Berry Purple if no theme class matches
        setSidebarColor(fallbackColor);
        console.log('Applied Berry Purple fallback sidebar color: #8e24aa');
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
      style={{ backgroundColor: sidebarColor || '#8e24aa' }}
    >
      {children}
    </div>
  );
};
