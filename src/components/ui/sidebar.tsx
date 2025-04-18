
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
      
      // Check for active theme name
      const activeName = localStorage.getItem('app-active-theme');
      
      // If we have an active theme, try to get its theme data
      if (activeName) {
        const themeData = localStorage.getItem(`theme-${activeName}`);
        if (themeData) {
          try {
            const parsedData = JSON.parse(themeData);
            if (parsedData && parsedData.sidebarColor) {
              setSidebarColor(parsedData.sidebarColor);
              console.log('Applied sidebar color from theme data:', parsedData.sidebarColor);
              return;
            }
          } catch (e) {
            console.error('Error parsing theme data:', e);
          }
        }
      }
      
      // NFD theme gets highest priority if no specific color found
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
          // Check for active theme data again
          const themeName = localStorage.getItem('app-active-theme');
          if (themeName) {
            console.log('Looking for theme data for:', themeName);
            const themeData = localStorage.getItem(`theme-${themeName}`);
            if (themeData) {
              try {
                const parsedData = JSON.parse(themeData);
                if (parsedData && parsedData.sidebarColor) {
                  setSidebarColor(parsedData.sidebarColor);
                  console.log('Found theme sidebar color in localStorage:', parsedData.sidebarColor);
                  return;
                }
              } catch (e) {
                console.error('Error parsing theme data:', e);
              }
            }
          }
          
          // Fallback to Berry Purple
          setSidebarColor('#8e24aa');
          console.log('Applied Berry Purple fallback sidebar color: #8e24aa');
        }
      } else {
        // Default fallback to Berry Purple if no theme class matches
        setSidebarColor('#8e24aa');
        console.log('Applied Berry Purple fallback sidebar color: #8e24aa');
      }
    };
    
    // Update color on mount
    updateSidebarColor();
    
    // Apply color to DOM directly when it changes
    const forceApplySidebarColor = () => {
      if (sidebarColor) {
        // Also store in localStorage for persistence across all components
        localStorage.setItem('custom-sidebar-color', sidebarColor);
        
        // Force CSS var update on html element
        document.documentElement.style.setProperty('--custom-sidebar-color', sidebarColor, 'important');
        document.documentElement.style.setProperty('--sidebar-color', sidebarColor, 'important');
      }
    };
    
    // Run the force apply function whenever sidebarColor changes
    if (sidebarColor) {
      forceApplySidebarColor();
    }
    
    // Function to handle theme updates
    const handleThemeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.colors && customEvent.detail.colors.sidebarColor) {
        setSidebarColor(customEvent.detail.colors.sidebarColor);
        console.log('Theme update event with sidebar color:', customEvent.detail.colors.sidebarColor);
      } else {
        // If no specific color, recompute
        updateSidebarColor();
      }
    };
    
    // Update on theme class changes and app-theme-updated events
    document.addEventListener('themeClassChanged', updateSidebarColor);
    window.addEventListener('app-theme-updated', handleThemeUpdate);
    
    // Set up MutationObserver to watch HTML class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateSidebarColor();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true
    });
    
    return () => {
      document.removeEventListener('themeClassChanged', updateSidebarColor);
      window.removeEventListener('app-theme-updated', handleThemeUpdate);
      observer.disconnect();
    };
  }, [sidebarColor]);

  return (
    <div 
      className={`sidebar ${className}`} 
      style={{ 
        backgroundColor: sidebarColor || '#8e24aa', 
        transition: 'background-color 0.3s ease',
      }}
    >
      {children}
    </div>
  );
};
