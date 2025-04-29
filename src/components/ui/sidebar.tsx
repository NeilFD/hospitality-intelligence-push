import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useCurrentModule, useSetCurrentModule } from "@/lib/store";

export const Sidebar = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [sidebarColor, setSidebarColor] = useState<string | null>(null);
  const location = useLocation();
  const currentModule = useCurrentModule();
  const setCurrentModule = useSetCurrentModule();

  // Add a new useEffect to ensure the sidebar module selection matches the current route
  useEffect(() => {
    // Synchronize current module with the URL path
    const path = location.pathname;
    
    if (path.includes('/home')) {
      setCurrentModule('home');
    } else if (path.includes('/food')) {
      setCurrentModule('food');
    } else if (path.includes('/beverage')) {
      setCurrentModule('beverage');
    } else if (path.includes('/pl')) {
      setCurrentModule('pl');
    } else if (path.includes('/wages')) {
      setCurrentModule('wages');
    } else if (path.includes('/performance')) {
      setCurrentModule('performance');
    } else if (path.includes('/master')) {
      setCurrentModule('master');
    } else if (path.includes('/team')) {
      setCurrentModule('team');
    } else if (path.includes('/hiq')) {
      setCurrentModule('hiq');
    }
    
    console.log('Sidebar URL path check:', path, 'Current module set to:', currentModule);
  }, [location.pathname, setCurrentModule]);

  useEffect(() => {
    // Special handling for Control Centre page
    const isControlCentrePage = window.location.pathname.includes('control-centre');
    if (isControlCentrePage) {
      console.log('Sidebar component detected Control Centre page');
    }
    
    // Force NFD as highest priority
    const forceNFDTheme = () => {
      // Check if theme is NFD in localStorage
      const activeTheme = localStorage.getItem('app-active-theme');
      if (activeTheme === 'NFD' || activeTheme === 'NFD Theme') {
        const nfdColor = '#ec193a';
        applySidebarColorDirectly(nfdColor);
        setSidebarColor(nfdColor);
        localStorage.setItem('custom-sidebar-color', nfdColor);
        console.log('Forced NFD theme color:', nfdColor);
        return true;
      }
      return false;
    };

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
      
      // Check for Tavern Blue theme and convert to Berry Purple
      if (localStorage.getItem('app-active-theme') === 'Tavern Blue') {
        localStorage.setItem('app-active-theme', 'Berry Purple');
        console.log('Converted Tavern Blue to Berry Purple');
        
        const berryPurpleColor = '#8e24aa';
        setSidebarColor(berryPurpleColor);
        localStorage.setItem('custom-sidebar-color', berryPurpleColor);
        applySidebarColorDirectly(berryPurpleColor);
        
        // Dispatch event for theme update
        window.dispatchEvent(new CustomEvent('app-theme-updated', {
          detail: { 
            theme: { name: 'Berry Purple' },
            colors: { sidebarColor: berryPurpleColor }
          }
        }));
        
        return;
      }
      
      // Force NFD theme as highest priority
      if (forceNFDTheme()) return;
      
      // Get active theme name - critical for theme selection in Control Centre
      const activeName = localStorage.getItem('app-active-theme');
      console.log('Sidebar updating with active theme name:', activeName);
      
      // Don't default to Berry Purple - use the actual saved theme
      if (activeName) {
        // Get theme data
        const themeData = localStorage.getItem(`theme-${activeName}`);
        
        // Handle known theme names directly
        const knownThemes: Record<string, string> = {
          'Forest Green': '#2e7d32',
          'Ocean Blue': '#1976d2',
          'Sunset Orange': '#ef6c00',
          'Berry Purple': '#8e24aa',
          'Dark Mode': '#333333',
          'NFD': '#ec193a',
          'NFD Theme': '#ec193a'
        };
        
        if (activeName in knownThemes) {
          const themeColor = knownThemes[activeName];
          console.log(`Applying known theme color for ${activeName}:`, themeColor);
          
          // Set sidebar color
          setSidebarColor(themeColor);
          localStorage.setItem('custom-sidebar-color', themeColor);
          applySidebarColorDirectly(themeColor);
          
          // Get and apply the correct theme class
          const themeClassMap: Record<string, string> = {
            'Berry Purple': 'theme-berry-purple',
            'Forest Green': 'theme-forest-green',
            'Ocean Blue': 'theme-ocean-blue',
            'Sunset Orange': 'theme-sunset-orange',
            'Dark Mode': 'theme-dark-mode',
            'NFD': 'theme-nfd-theme',
            'NFD Theme': 'theme-nfd-theme'
          };
          
          // Remove current theme classes
          themeClasses.forEach(cls => {
            html.classList.remove(cls);
          });
          
          // Add the correct theme class
          if (activeName in themeClassMap) {
            html.classList.add(themeClassMap[activeName]);
            console.log(`Applied theme class for ${activeName}:`, themeClassMap[activeName]);
          }
          
          return;
        }
        
        // For custom themes, try to load from theme data
        if (themeData) {
          try {
            const parsedData = JSON.parse(themeData);
            if (parsedData && parsedData.sidebarColor) {
              console.log('Found custom theme data for:', activeName, parsedData);
              setSidebarColor(parsedData.sidebarColor);
              localStorage.setItem('custom-sidebar-color', parsedData.sidebarColor);
              applySidebarColorDirectly(parsedData.sidebarColor);
              
              // For custom themes, use the theme-custom class instead of purple-700
              themeClasses.forEach(cls => {
                html.classList.remove(cls);
              });
              html.classList.add('theme-custom');
              
              return;
            }
          } catch (e) {
            console.error('Error parsing theme data:', e);
          }
        }
      }
      
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
        
        // Force apply NFD theme class
        document.documentElement.classList.remove(
          'theme-forest-green', 
          'theme-ocean-blue', 
          'theme-sunset-orange', 
          'theme-berry-purple', 
          'theme-dark-mode',
          'theme-custom'
        );
        document.documentElement.classList.add('theme-nfd-theme');
        
        return;
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
      
      // Handle custom theme
      if (html.classList.contains('theme-custom')) {
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
        
        // Fallback to Berry Purple only if no other theme is found
        if (!activeName || activeName === 'Berry Purple') {
          const fallbackColor = '#8e24aa';
          setSidebarColor(fallbackColor);
          localStorage.setItem('custom-sidebar-color', fallbackColor);
          applySidebarColorDirectly(fallbackColor);
          console.log('Applied Berry Purple fallback sidebar color:', fallbackColor);
        }
      } else {
        // Default fallback to Berry Purple only if no other theme is specified
        if (!activeName || activeName === 'Berry Purple') {
          const defaultColor = '#8e24aa';
          setSidebarColor(defaultColor);
          localStorage.setItem('custom-sidebar-color', defaultColor);
          applySidebarColorDirectly(defaultColor);
          console.log('Applied Berry Purple default sidebar color:', defaultColor);
        }
      }
    };
    
    // List of all theme classes to manage
    const themeClasses = [
      'theme-forest-green', 
      'theme-ocean-blue', 
      'theme-sunset-orange', 
      'theme-berry-purple', 
      'theme-dark-mode',
      'theme-nfd-theme',
      'theme-custom',
      'theme-tavern-blue',
      'tavern-blue',
      'theme-hi',
      'theme-hi-purple'
    ];
    
    // Update color on mount and whenever the state changes
    updateSidebarColor();
    
    // Listen for theme updates from other components
    const handleThemeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      // Always get the active theme name first
      const activeName = localStorage.getItem('app-active-theme');
      console.log('Theme update event received with active theme:', activeName);
      
      if (customEvent.detail) {
        // Check if there's a specific theme name in the event
        if (customEvent.detail.theme && customEvent.detail.theme.name) {
          console.log('Theme update has theme name:', customEvent.detail.theme.name);
          // Store theme name in localStorage
          localStorage.setItem('app-active-theme', customEvent.detail.theme.name);
        }
        
        // Check if there's a specific sidebar color
        if (customEvent.detail.colors && customEvent.detail.colors.sidebarColor) {
          console.log('Theme update has sidebar color:', customEvent.detail.colors.sidebarColor);
          setSidebarColor(customEvent.detail.colors.sidebarColor);
          localStorage.setItem('custom-sidebar-color', customEvent.detail.colors.sidebarColor);
          
          // Apply color directly after a short delay
          setTimeout(() => {
            const color = customEvent.detail.colors.sidebarColor;
            const sidebarElement = document.querySelector('.sidebar') as HTMLElement;
            if (sidebarElement) {
              sidebarElement.style.setProperty('background-color', color, 'important');
            }
          }, 50);
        }
      }
      
      // Always recompute after an event
      updateSidebarColor();
    };
    
    // Apply a purge function to remove Tavern Blue
    const purgeTavernBlue = () => {
      // Check if we're currently using Tavern Blue
      if (localStorage.getItem('app-active-theme') === 'Tavern Blue') {
        localStorage.setItem('app-active-theme', 'Berry Purple');
        console.log('Purged Tavern Blue theme from localStorage');
        
        // Force Berry Purple theme
        const berryColor = '#8e24aa';
        setSidebarColor(berryColor);
        localStorage.setItem('custom-sidebar-color', berryColor);
        applySidebarColorDirectly(berryColor);
        
        // Also update CSS classes
        document.documentElement.classList.remove('theme-tavern-blue', 'tavern-blue');
        document.documentElement.classList.add('theme-berry-purple');
        
        // Dispatch theme update event
        window.dispatchEvent(new CustomEvent('app-theme-updated', {
          detail: { 
            theme: { name: 'Berry Purple' },
            colors: { sidebarColor: berryColor }
          }
        }));
      }
    };
    
    // Run purge immediately
    purgeTavernBlue();
    
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
    
    // Special handling for Control Centre page
    if (window.location.pathname.includes('control-centre')) {
      console.log('Control Centre page detected, applying extra sidebar color enforcement');
      
      // Apply immediately and again after short delays
      updateSidebarColor();
      setTimeout(updateSidebarColor, 200);
      setTimeout(updateSidebarColor, 500);
      setTimeout(updateSidebarColor, 1000);
      
      // Add extra event listeners for theme changes in Control Centre
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        
        // Look for potential theme selection clicks
        if (target.closest('button') || 
            target.closest('a') || 
            target.closest('div[role="button"]') || 
            target.closest('[class*="theme"]') || 
            target.closest('[class*="card"]')) {
          
          console.log('Potential theme click detected in Control Centre');
          
          // Apply color with delays to catch theme changes
          setTimeout(updateSidebarColor, 100);
          setTimeout(updateSidebarColor, 300);
          setTimeout(updateSidebarColor, 500);
          
          // Check for the current theme name
          setTimeout(() => {
            const themeName = localStorage.getItem('app-active-theme');
            console.log('After click, active theme is:', themeName);
            
            // If there's a specific theme, force it
            if (themeName && themeName !== 'Tavern Blue') {
              // Handle known themes
              const knownThemes: Record<string, string> = {
                'Forest Green': '#2e7d32',
                'Ocean Blue': '#1976d2',
                'Sunset Orange': '#ef6c00',
                'Berry Purple': '#8e24aa',
                'Dark Mode': '#333333',
                'NFD': '#ec193a',
                'NFD Theme': '#ec193a'
              };
              
              if (themeName in knownThemes) {
                const themeColor = knownThemes[themeName];
                setSidebarColor(themeColor);
                localStorage.setItem('custom-sidebar-color', themeColor);
                applySidebarColorDirectly(themeColor);
                console.log(`Applied clicked theme ${themeName} color:`, themeColor);
              }
            }
          }, 200);
        }
      });
    }
    
    // Force periodic color checks to ensure it stays applied
    const forceCheckInterval = setInterval(() => {
      // Get current active theme
      const activeName = localStorage.getItem('app-active-theme');
      
      // Check if we have a color stored for current sidebar
      if (sidebarColor) {
        const sidebarElement = document.querySelector('.sidebar') as HTMLElement;
        if (sidebarElement && sidebarElement.style.backgroundColor !== sidebarColor) {
          sidebarElement.style.setProperty('background-color', sidebarColor, 'important');
        }
      }
      
      // Also run the Tavern Blue purge periodically
      purgeTavernBlue();
    }, 1000);
    
    return () => {
      clearInterval(forceCheckInterval);
      document.removeEventListener('themeClassChanged', updateSidebarColor);
      window.removeEventListener('app-theme-updated', handleThemeUpdate);
      observer.disconnect();
    };
  }, [sidebarColor]);

  // Add a special effect for Control Centre page to ensure theme is correctly applied
  useEffect(() => {
    if (window.location.pathname.includes('control-centre')) {
      // For the Control Centre page specifically, enforce sidebar color more aggressively
      const enforceInterval = setInterval(() => {
        // Get current active theme from localStorage
        const activeName = localStorage.getItem('app-active-theme');
        console.log('Control Centre sidebar enforcer checking theme:', activeName);
        
        // Apply theme-specific colors
        if (activeName) {
          // Check for known themes
          const knownThemes: Record<string, string> = {
            'Forest Green': '#2e7d32',
            'Ocean Blue': '#1976d2',
            'Sunset Orange': '#ef6c00',
            'Berry Purple': '#8e24aa',
            'Dark Mode': '#333333',
            'NFD': '#ec193a',
            'NFD Theme': '#ec193a'
          };
          
          if (activeName in knownThemes) {
            const color = knownThemes[activeName];
            const sidebarEl = document.querySelector('.sidebar') as HTMLElement;
            if (sidebarEl) {
              sidebarEl.style.setProperty('background-color', color, 'important');
            }
          } else {
            // Check for custom theme data
            const themeData = localStorage.getItem(`theme-${activeName}`);
            if (themeData) {
              try {
                const parsedData = JSON.parse(themeData);
                if (parsedData && parsedData.sidebarColor) {
                  const sidebarEl = document.querySelector('.sidebar') as HTMLElement;
                  if (sidebarEl) {
                    sidebarEl.style.setProperty('background-color', parsedData.sidebarColor, 'important');
                  }
                }
              } catch (e) {
                console.error('Error parsing theme data in enforcer:', e);
              }
            }
          }
        }
        
        // Also check for sidebar color in localStorage
        const storedColor = localStorage.getItem('custom-sidebar-color');
        if (storedColor) {
          const sidebarEl = document.querySelector('.sidebar') as HTMLElement;
          if (sidebarEl) {
            sidebarEl.style.setProperty('background-color', storedColor, 'important');
          }
        }
      }, 500);
      
      return () => clearInterval(enforceInterval);
    }
  }, []);

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
