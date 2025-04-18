import React, { useEffect } from "react";

// You would replace this with your actual sidebar component or just add the useEffect logic to your existing sidebar
export const Sidebar = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  useEffect(() => {
    // Function to update sidebar color based on current theme
    const updateSidebarColor = () => {
      const sidebar = document.querySelector('.sidebar') as HTMLElement;
      if (!sidebar) return;
      
      const html = document.documentElement;
      
      // For custom themes, apply the custom sidebar color directly
      if (html.classList.contains('theme-purple-700')) {
        const sidebarColor = getComputedStyle(html).getPropertyValue('--custom-sidebar-color').trim();
        if (sidebarColor) {
          sidebar.style.backgroundColor = sidebarColor;
          console.log('Applied custom sidebar color:', sidebarColor);
        }
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
    <div className={`sidebar ${className}`}>
      {children}
    </div>
  );
};
