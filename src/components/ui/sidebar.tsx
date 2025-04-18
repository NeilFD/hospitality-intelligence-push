
import React, { useEffect, useState } from "react";

export const Sidebar = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [sidebarColor, setSidebarColor] = useState<string | null>(null);

  useEffect(() => {
    // Function to directly apply the sidebar color to the DOM element
    const applySidebarColorDirectly = (color: string) => {
      // Get the current sidebar element
      const sidebarElement = document.querySelector('.sidebar') as HTMLElement;
      if (sidebarElement) {
        sidebarElement.style.setProperty('background-color', color, 'important');
        console.log('Applied sidebar color directly to DOM element:', color);
      }
    };

    // Function to update sidebar color based on current theme
    const updateSidebarColor = () => {
      const html = document.documentElement;
      
      // Get from localStorage first (most reliable source)
      const storedColor = localStorage.getItem('custom-sidebar-color');
      
      if (storedColor && storedColor !== '') {
        setSidebarColor(storedColor);
        applySidebarColorDirectly(storedColor);
        console.log('Applied sidebar color from localStorage:', storedColor);
        return;
      }
      
      // Check for NFD theme - highest priority
      if (html.classList.contains('theme-nfd-theme') || 
          localStorage.getItem('app-active-theme') === 'NFD' || 
          localStorage.getItem('app-active-theme') === 'NFD Theme') {
        const nfdColor = '#ec193a';
        setSidebarColor(nfdColor);
        localStorage.setItem('custom-sidebar-color', nfdColor);
        applySidebarColorDirectly(nfdColor);
        console.log('Applied NFD theme sidebar color:', nfdColor);
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
              localStorage.setItem('custom-sidebar-color', parsedData.sidebarColor);
              applySidebarColorDirectly(parsedData.sidebarColor);
              console.log('Applied sidebar color from theme data:', parsedData.sidebarColor);
              return;
            }
          } catch (e) {
            console.error('Error parsing theme data:', e);
          }
        }
      }
      
      // Then check theme classes
      const themeColorMap: Record<string, string> = {
        'theme-forest-green': '#2e7d32',
        'theme-ocean-blue': '#1976d2',
        'theme-sunset-orange': '#ef6c00', 
        'theme-berry-purple': '#8e24aa',
        'theme-dark-mode': '#333333',
        'theme-nfd-theme': '#ec193a'
      };
      
      // Check for theme class match
      for (const [themeClass, color] of Object.entries(themeColorMap)) {
        if (html.classList.contains(themeClass)) {
          setSidebarColor(color);
          localStorage.setItem('custom-sidebar-color', color);
          applySidebarColorDirectly(color);
          console.log(`Applied ${themeClass} sidebar color:`, color);
          return;
        }
      }
      
      // Handle custom theme (theme-purple-700)
      if (html.classList.contains('theme-purple-700')) {
        // For custom themes, try to get from CSS variable
        const cssVarColor = getComputedStyle(html).getPropertyValue('--custom-sidebar-color').trim();
        if (cssVarColor && cssVarColor !== '') {
          const cleanColor = cssVarColor.replace(/['"]/g, '');
          setSidebarColor(cleanColor);
          localStorage.setItem('custom-sidebar-color', cleanColor);
          applySidebarColorDirectly(cleanColor);
          console.log('Applied custom sidebar color from CSS var:', cleanColor);
          return;
        }
        
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
                localStorage.setItem('custom-sidebar-color', parsedData.sidebarColor);
                applySidebarColorDirectly(parsedData.sidebarColor);
                console.log('Found theme sidebar color in localStorage:', parsedData.sidebarColor);
                return;
              }
            } catch (e) {
              console.error('Error parsing theme data:', e);
            }
          }
        }
        
        // Fallback to Berry Purple
        const fallbackColor = '#8e24aa';
        setSidebarColor(fallbackColor);
        localStorage.setItem('custom-sidebar-color', fallbackColor);
        applySidebarColorDirectly(fallbackColor);
        console.log('Applied Berry Purple fallback sidebar color:', fallbackColor);
      } else {
        // Default fallback to Berry Purple if no theme class matches
        const defaultColor = '#8e24aa';
        setSidebarColor(defaultColor);
        localStorage.setItem('custom-sidebar-color', defaultColor);
        applySidebarColorDirectly(defaultColor);
        console.log('Applied Berry Purple default sidebar color:', defaultColor);
      }
    };
    
    // Update color on mount and whenever the state changes
    updateSidebarColor();
    
    // Listen for theme updates from other components
    const handleThemeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.colors && customEvent.detail.colors.sidebarColor) {
        setSidebarColor(customEvent.detail.colors.sidebarColor);
        localStorage.setItem('custom-sidebar-color', customEvent.detail.colors.sidebarColor);
        setTimeout(() => {
          // Force reapply after a short delay to ensure it takes precedence
          const color = customEvent.detail.colors.sidebarColor;
          const sidebarElement = document.querySelector('.sidebar') as HTMLElement;
          if (sidebarElement) {
            sidebarElement.style.setProperty('background-color', color, 'important');
          }
        }, 50);
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
    
    // Force periodic color checks to ensure it stays applied
    const forceCheckInterval = setInterval(() => {
      if (sidebarColor) {
        const sidebarElement = document.querySelector('.sidebar') as HTMLElement;
        if (sidebarElement && sidebarElement.style.backgroundColor !== sidebarColor) {
          sidebarElement.style.setProperty('background-color', sidebarColor, 'important');
        }
      }
    }, 1000);
    
    return () => {
      clearInterval(forceCheckInterval);
      document.removeEventListener('themeClassChanged', updateSidebarColor);
      window.removeEventListener('app-theme-updated', handleThemeUpdate);
      observer.disconnect();
    };
  }, [sidebarColor]);

  // We'll use inline style with !important to ensure it overrides any other styles
  return (
    <div 
      className={`sidebar ${className}`} 
      style={{ 
        backgroundColor: sidebarColor || '#8e24aa', 
        transition: 'background-color 0.3s ease',
      }}
      data-theme-sidebar="true"
    >
      {children}
    </div>
  );
};
