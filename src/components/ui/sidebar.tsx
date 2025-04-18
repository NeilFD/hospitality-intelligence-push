
import React, { useEffect, useState } from "react";

export const Sidebar = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [sidebarColor, setSidebarColor] = useState<string | null>(null);

  useEffect(() => {
    // Function to update sidebar color based on current theme
    const updateSidebarColor = () => {
      const html = document.documentElement;
      
      // Get from localStorage first (most reliable source)
      const storedColor = localStorage.getItem('custom-sidebar-color');
      
      if (storedColor && storedColor !== '') {
        setSidebarColor(storedColor);
        console.log('Applied sidebar color from localStorage:', storedColor);
        return;
      }
      
      // NFD theme gets highest priority
      if (html.classList.contains('theme-nfd-theme')) {
        setSidebarColor('#ec193a');
        console.log('Applied NFD theme sidebar color: #ec193a');
        return;
      }
      
      // Then check theme classes
      if (html.classList.contains('theme-forest-green')) {
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
      } else if (html.classList.contains('theme-berry-purple')) {
        setSidebarColor('#8e24aa');
        console.log('Applied Berry Purple sidebar color: #8e24aa');
      } else if (html.classList.contains('theme-purple-700')) {
        // For custom themes, try to get from CSS variable
        const cssVarColor = getComputedStyle(html).getPropertyValue('--custom-sidebar-color').trim();
        if (cssVarColor && cssVarColor !== '') {
          setSidebarColor(cssVarColor);
          console.log('Applied custom sidebar color from CSS var:', cssVarColor);
        } else {
          // Fallback to Berry Purple
          setSidebarColor('#8e24aa');
          console.log('Fallback to Berry Purple sidebar color: #8e24aa');
        }
      } else {
        // Default fallback to Berry Purple if no theme class matches
        setSidebarColor('#8e24aa');
        console.log('Applied Berry Purple fallback sidebar color: #8e24aa');
      }
    };
    
    // Update color on mount
    updateSidebarColor();
    
    // Create a function to forcefully apply the sidebar color to DOM elements
    const forceApplySidebarColor = () => {
      if (sidebarColor) {
        const sidebarElements = document.querySelectorAll('.sidebar');
        sidebarElements.forEach(sidebar => {
          (sidebar as HTMLElement).style.setProperty('background-color', sidebarColor, 'important');
        });
      }
    };
    
    // Run the force apply function whenever sidebarColor changes
    if (sidebarColor) {
      forceApplySidebarColor();
      
      // Also store in localStorage for persistence
      localStorage.setItem('custom-sidebar-color', sidebarColor);
    }
    
    // Update on theme changes
    const handleThemeChange = () => {
      updateSidebarColor();
      // Short delay to ensure DOM is updated
      setTimeout(forceApplySidebarColor, 50);
    };
    
    // Listen for theme class changes
    document.addEventListener('themeClassChanged', handleThemeChange);
    
    // Listen for the app theme updated event
    window.addEventListener('app-theme-updated', handleThemeChange);
    
    // Set up a MutationObserver to watch for class changes on the html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });
    
    // Start observing the html element
    observer.observe(document.documentElement, { attributes: true });
    
    return () => {
      document.removeEventListener('themeClassChanged', handleThemeChange);
      window.removeEventListener('app-theme-updated', handleThemeChange);
      observer.disconnect();
    };
  }, [sidebarColor]);

  return (
    <div 
      className={`sidebar ${className}`} 
      style={{ backgroundColor: sidebarColor || '#8e24aa', transition: 'background-color 0.3s ease' }}
    >
      {children}
    </div>
  );
};
