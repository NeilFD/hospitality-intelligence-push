
import React, { useEffect, useState } from "react";

export const Sidebar = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [sidebarColor, setSidebarColor] = useState<string | null>(null);

  useEffect(() => {
    // Special handling for Control Centre page
    const isControlCentrePage = window.location.pathname.includes('control-centre');
    if (isControlCentrePage) {
      console.log('Sidebar component detected Control Centre page');
    }
    
    // Force NFD as highest priority with more aggressive approach
    const forceNFDTheme = () => {
      // Check if theme is NFD in localStorage
      const activeTheme = localStorage.getItem('app-active-theme');
      if (activeTheme === 'NFD' || activeTheme === 'NFD Theme') {
        console.log('Enforcing NFD theme with priority');
        const nfdColor = '#ec193a';
        
        // Apply to sidebar element
        applySidebarColorDirectly(nfdColor);
        setSidebarColor(nfdColor);
        localStorage.setItem('custom-sidebar-color', nfdColor);
        
        // Force remove any purple-700 classes
        const html = document.documentElement;
        html.classList.remove('theme-purple-700', 'purple-700');
        html.classList.add('theme-nfd-theme');
        
        // Force update CSS variables
        html.style.setProperty('--custom-sidebar-color', nfdColor, 'important');
        html.style.setProperty('--sidebar-color', nfdColor, 'important');
        
        // Dispatch NFD theme event
        window.dispatchEvent(new CustomEvent('app-theme-updated', {
          detail: { 
            theme: { name: 'NFD Theme' },
            colors: { sidebarColor: nfdColor }
          }
        }));
        
        console.log('NFD theme color enforced:', nfdColor);
        return true;
      }
      return false;
    };

    // Function to directly apply the sidebar color to the DOM element
    const applySidebarColorDirectly = (color: string) => {
      try {
        // Get the current sidebar element
        const sidebarElement = document.querySelector('.sidebar') as HTMLElement;
        if (sidebarElement) {
          sidebarElement.style.setProperty('background-color', color, 'important');
          console.log('Applied sidebar color directly to DOM element:', color);
        }
      } catch (error) {
        console.error('Error applying sidebar color:', error);
      }
    };

    // Function to update sidebar color based on current theme
    const updateSidebarColor = () => {
      try {
        const html = document.documentElement;
        
        // Explicitly remove purple-700 classes
        html.classList.remove('theme-purple-700', 'purple-700');
        
        // Force NFD theme as highest priority
        if (forceNFDTheme()) return;
        
        // Get active theme name - critical for theme selection in Control Centre
        const activeName = localStorage.getItem('app-active-theme');
        console.log('Sidebar updating with active theme name:', activeName);
        
        // Don't default to Berry Purple - use the actual saved theme
        if (activeName) {
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
              'theme-hi-purple',
              'theme-purple-700',
              'purple-700'
            ];
            
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
            'theme-custom',
            'theme-purple-700',
            'purple-700'
          );
          document.documentElement.classList.add('theme-nfd-theme');
          
          return;
        }
        
        // For custom themes, handle separately
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
        }
        
        // Default fallback to Berry Purple only if no other theme is specified
        if (!activeName || activeName === 'Berry Purple') {
          const defaultColor = '#8e24aa';
          setSidebarColor(defaultColor);
          localStorage.setItem('custom-sidebar-color', defaultColor);
          applySidebarColorDirectly(defaultColor);
          console.log('Applied Berry Purple default sidebar color:', defaultColor);
        }
      } catch (error) {
        console.error('Error in updateSidebarColor:', error);
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
      'theme-hi-purple',
      'theme-purple-700',
      'purple-700'
    ];
    
    try {
      // Update color on mount and whenever the state changes
      updateSidebarColor();
      
      // Listen for theme updates from other components
      const handleThemeUpdate = (event: Event) => {
        try {
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
              
              // Remove purple-700 classes if this is the NFD theme
              if (customEvent.detail.theme.name === 'NFD' || customEvent.detail.theme.name === 'NFD Theme') {
                document.documentElement.classList.remove('theme-purple-700', 'purple-700');
              }
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
        } catch (error) {
          console.error('Error handling theme update event:', error);
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
            
            // Remove purple-700 classes explicitly
            document.documentElement.classList.remove('theme-purple-700', 'purple-700');
            
            // Apply color with delays to catch theme changes
            setTimeout(updateSidebarColor, 100);
            setTimeout(updateSidebarColor, 300);
            setTimeout(updateSidebarColor, 500);
          }
        });
      }
      
      // Force periodic color checks to ensure it stays applied
      const forceCheckInterval = setInterval(() => {
        try {
          // Explicitly remove purple-700 classes
          document.documentElement.classList.remove('theme-purple-700', 'purple-700');
          
          // Check if we have a color stored for current sidebar
          if (sidebarColor) {
            const sidebarElement = document.querySelector('.sidebar') as HTMLElement;
            if (sidebarElement && sidebarElement.style.backgroundColor !== sidebarColor) {
              sidebarElement.style.setProperty('background-color', sidebarColor, 'important');
            }
          }
        } catch (error) {
          console.error('Error in force check interval:', error);
        }
      }, 1000);
      
      return () => {
        clearInterval(forceCheckInterval);
        document.removeEventListener('themeClassChanged', updateSidebarColor);
        window.removeEventListener('app-theme-updated', handleThemeUpdate);
        observer.disconnect();
      };
    } catch (error) {
      console.error('Error in sidebar effect:', error);
    }
  }, [sidebarColor]);

  // Add a special effect for Control Centre page
  useEffect(() => {
    if (window.location.pathname.includes('control-centre')) {
      // For the Control Centre page specifically, enforce theme more aggressively
      const enforceInterval = setInterval(() => {
        try {
          // Get current active theme from localStorage
          const activeName = localStorage.getItem('app-active-theme');
          console.log('Control Centre sidebar enforcer checking theme:', activeName);
          
          // Extra removal of purple-700 classes
          document.documentElement.classList.remove('theme-purple-700', 'purple-700');
          
          // Apply theme-specific colors for NFD
          if (activeName === 'NFD' || activeName === 'NFD Theme') {
            const nfdColor = '#ec193a';
            const sidebarEl = document.querySelector('.sidebar') as HTMLElement;
            if (sidebarEl) {
              sidebarEl.style.setProperty('background-color', nfdColor, 'important');
            }
            document.documentElement.classList.add('theme-nfd-theme');
          }
        } catch (error) {
          console.error('Error in Control Centre enforce interval:', error);
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
