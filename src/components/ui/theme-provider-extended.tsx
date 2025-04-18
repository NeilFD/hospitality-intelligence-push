
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "react-router-dom";

export function ThemeProviderExtended({ children }: { children: React.ReactNode }) {
  const [themeLoaded, setThemeLoaded] = useState(false);
  const location = useLocation();

  console.log("ThemeProviderExtended rendered", location.pathname);

  useEffect(() => {
    const loadActiveTheme = async () => {
      try {
        // ALWAYS default to Berry Purple
        const defaultThemeName = 'Berry Purple';
        
        // Get saved theme name, default to Berry Purple
        const savedThemeName = localStorage.getItem('app-active-theme') || 'Berry Purple';
        
        console.log('Loading theme:', savedThemeName, 'with Berry Purple as fallback');
        
        // First apply Berry Purple as initial fallback
        applyThemeClass('Berry Purple');
        
        // Apply Berry Purple theme colors as initial values
        applyBerryPurpleThemeColors();
        
        // Special handling for NFD theme
        if (savedThemeName === 'NFD' || savedThemeName === 'NFD Theme') {
          console.log('NFD theme detected, applying NFD-specific settings');
          applyThemeClass('nfd-theme');
          
          // Apply NFD theme colors directly
          applyCustomThemeColors({
            primaryColor: '#ec193a',
            secondaryColor: '#ffebee',
            accentColor: '#d81b60',
            sidebarColor: '#ec193a',
            buttonColor: '#ec193a',
            textColor: '#212121'
          });
          
          // Save NFD theme data to localStorage for persistence
          localStorage.setItem('custom-sidebar-color', '#ec193a');
          localStorage.setItem('theme-NFD Theme', JSON.stringify({
            primaryColor: '#ec193a',
            secondaryColor: '#ffebee',
            accentColor: '#d81b60',
            sidebarColor: '#ec193a',
            buttonColor: '#ec193a',
            textColor: '#212121'
          }));
          
          // Dispatch theme updated event for components to react
          window.dispatchEvent(new CustomEvent('app-theme-updated', {
            detail: { colors: {
              primaryColor: '#ec193a',
              secondaryColor: '#ffebee',
              accentColor: '#d81b60',
              sidebarColor: '#ec193a',
              buttonColor: '#ec193a',
              textColor: '#212121'
            }}
          }));
          
          return; // Exit early for NFD theme
        }
        
        // Then try to load the requested theme from database
        let themeNameToLoad = savedThemeName;
        let isCustomTheme = false;
        
        // Check if this is a custom theme (not one of the preset themes)
        const presetThemes = ['Berry Purple', 'Forest Green', 'Ocean Blue', 'Sunset Orange', 'Dark Mode', 'NFD Theme', 'NFD'];
        if (!presetThemes.includes(themeNameToLoad)) {
          isCustomTheme = true;
          console.log('Custom theme detected:', themeNameToLoad);
        }
        
        // For other themes, try to load from database
        const { data, error } = await supabase
          .from('themes')
          .select('*')
          .eq('name', themeNameToLoad)
          .maybeSingle();
        
        if (error || !data) {
          console.error('Error loading theme or theme not found:', error);
          console.log('Keeping Berry Purple theme as fallback');
          
          // If there was an error loading the theme, explicitly load Berry Purple
          const { data: berryPurpleData } = await supabase
            .from('themes')
            .select('*')
            .eq('name', 'Berry Purple')
            .maybeSingle();
            
          if (berryPurpleData) {
            // Apply Berry Purple theme class
            applyThemeClass('Berry Purple');
            localStorage.setItem('app-active-theme', 'Berry Purple');
            
            // Apply Berry Purple theme colors
            applyCustomThemeColors({
              primaryColor: berryPurpleData.primary_color || '#9d89c9',
              secondaryColor: berryPurpleData.secondary_color || '#f3e5f5',
              accentColor: berryPurpleData.accent_color || '#ab47bc',
              sidebarColor: berryPurpleData.sidebar_color || '#8e24aa',
              buttonColor: berryPurpleData.button_color || '#7e57c2',
              textColor: berryPurpleData.text_color || '#333333'
            });
          } else {
            // If no Berry Purple in database, use hardcoded values
            applyBerryPurpleThemeColors();
          }
          return;
        }
        
        console.log('Found theme in database:', data);
        
        // Apply the theme class
        if (isCustomTheme) {
          // For custom themes, use the theme-custom class
          applyThemeClass('Custom Theme');
          
          // Save theme data to localStorage with this specific name
          localStorage.setItem(`theme-${data.name}`, JSON.stringify({
            primaryColor: data.primary_color || '#9d89c9',
            secondaryColor: data.secondary_color || '#f3e5f5',
            accentColor: data.accent_color || '#ab47bc',
            sidebarColor: data.sidebar_color || '#8e24aa',
            buttonColor: data.button_color || '#7e57c2',
            textColor: data.text_color || '#333333'
          }));
        } else {
          applyThemeClass(data.name);
        }
        
        // Apply theme colors
        applyCustomThemeColors({
          primaryColor: data.primary_color || '#9d89c9',
          secondaryColor: data.secondary_color || '#f3e5f5',
          accentColor: data.accent_color || '#ab47bc',
          sidebarColor: data.sidebar_color || '#8e24aa',
          buttonColor: data.button_color || '#7e57c2',
          textColor: data.text_color || '#333333'
        });
        
        // For custom themes, save the color data to localStorage
        if (isCustomTheme) {
          localStorage.setItem(`theme-${data.name}`, JSON.stringify({
            primaryColor: data.primary_color || '#9d89c9',
            secondaryColor: data.secondary_color || '#f3e5f5',
            accentColor: data.accent_color || '#ab47bc',
            sidebarColor: data.sidebar_color || '#8e24aa',
            buttonColor: data.button_color || '#7e57c2',
            textColor: data.text_color || '#333333'
          }));
        }
      } catch (err) {
        console.error('Error in theme loading:', err);
        // Apply Berry Purple theme colors as fallback in case of any error
        applyBerryPurpleThemeColors();
      }
    };

    const applyThemeClass = (themeName: string) => {
      const html = document.documentElement;
      
      // Remove all existing theme classes
      const themeClasses = [
        'theme-forest-green', 
        'theme-ocean-blue', 
        'theme-sunset-orange', 
        'theme-berry-purple', 
        'theme-dark-mode',
        'theme-hi-purple',
        'theme-tavern-blue',
        'theme-nfd-theme',
        'theme-custom'
      ];
      
      themeClasses.forEach(cls => {
        html.classList.remove(cls);
      });
      
      // Map theme names to theme classes
      const themeClassMap: {[key: string]: string} = {
        'Berry Purple': 'theme-berry-purple',
        'Forest Green': 'theme-forest-green',
        'Ocean Blue': 'theme-ocean-blue',
        'Sunset Orange': 'theme-sunset-orange',
        'Dark Mode': 'theme-dark-mode',
        'NFD Theme': 'theme-nfd-theme',
        'NFD': 'theme-nfd-theme',
        'Hi': 'theme-berry-purple', // Force Hi theme to use Berry Purple
        'Tavern Blue': 'theme-berry-purple', // Force Tavern Blue to use Berry Purple
        'Custom Theme': 'theme-custom', // Use theme-custom for custom themes
        'nfd-theme': 'theme-nfd-theme' // Handle special case for NFD theme
      };
      
      // Get the theme class or default to custom theme class
      const themeClass = themeClassMap[themeName] || 'theme-custom';
      html.classList.add(themeClass);
      
      // Trigger change event
      document.dispatchEvent(new Event('themeClassChanged'));
      console.log('Theme applied directly:', themeName, 'with class:', themeClass);
    };
    
    // Function to apply Berry Purple theme colors as fallback
    const applyBerryPurpleThemeColors = () => {
      applyCustomThemeColors({
        primaryColor: '#9d89c9',
        secondaryColor: '#f3e5f5',
        accentColor: '#ab47bc',
        sidebarColor: '#8e24aa',
        buttonColor: '#7e57c2',
        textColor: '#333333'
      });
    };
    
    // Function to apply custom theme colors using CSS variables
    const applyCustomThemeColors = (colors: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      sidebarColor: string;
      buttonColor: string;
      textColor: string;
    }) => {
      const html = document.documentElement;
      
      // Set CSS variables with !important to ensure they override any other styles
      html.style.setProperty('--custom-primary-color', colors.primaryColor, 'important');
      html.style.setProperty('--custom-secondary-color', colors.secondaryColor, 'important');
      html.style.setProperty('--custom-accent-color', colors.accentColor, 'important');
      html.style.setProperty('--custom-sidebar-color', colors.sidebarColor, 'important');
      html.style.setProperty('--custom-button-color', colors.buttonColor, 'important');
      html.style.setProperty('--custom-text-color', colors.textColor, 'important');
      html.style.setProperty('--sidebar-color', colors.sidebarColor, 'important');
      
      // Store sidebar color in localStorage
      localStorage.setItem('custom-sidebar-color', colors.sidebarColor);
      
      // Apply the sidebar color directly to any existing sidebar element
      const sidebarElements = document.querySelectorAll('.sidebar');
      if (sidebarElements && sidebarElements.length > 0) {
        sidebarElements.forEach(sidebar => {
          (sidebar as HTMLElement).style.setProperty('background-color', colors.sidebarColor, 'important');
        });
      }
      
      // Dispatch event for theme color updates
      window.dispatchEvent(new CustomEvent('app-theme-updated', {
        detail: { colors }
      }));
    };
    
    // Initial theme load
    loadActiveTheme();
    
    // Add a specialized mechanism for immediate sidebar updates when the DOM changes
    const observeForSidebar = () => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const sidebarElements = document.querySelectorAll('.sidebar');
            if (sidebarElements && sidebarElements.length > 0) {
              const currentColor = localStorage.getItem('custom-sidebar-color');
              if (currentColor) {
                sidebarElements.forEach(sidebar => {
                  (sidebar as HTMLElement).style.setProperty('background-color', currentColor, 'important');
                });
                console.log('Applied immediate color to new sidebar elements:', currentColor);
              }
            }
          }
        });
      });
      
      // Start observing the document.body for DOM changes
      observer.observe(document.body, { childList: true, subtree: true });
      
      return observer;
    };
    
    // Start the sidebar observer
    const sidebarObserver = observeForSidebar();
    
    // Force an additional theme color application after a short delay
    // to catch any elements that might load after the initial application
    const forceThemeTimer = setTimeout(() => {
      // Re-trigger theme class changed event
      document.dispatchEvent(new Event('themeClassChanged'));
      // Re-trigger theme updated event
      window.dispatchEvent(new Event('app-theme-updated'));
      
      // Apply any saved sidebar color directly to elements
      const savedColor = localStorage.getItem('custom-sidebar-color');
      if (savedColor) {
        const sidebarElements = document.querySelectorAll('.sidebar');
        if (sidebarElements && sidebarElements.length > 0) {
          sidebarElements.forEach(sidebar => {
            (sidebar as HTMLElement).style.setProperty('background-color', savedColor, 'important');
          });
          console.log('Force-applied sidebar color after delay:', savedColor);
        }
      }
    }, 500);
    
    return () => {
      clearTimeout(forceThemeTimer);
      if (sidebarObserver) {
        sidebarObserver.disconnect();
      }
    };
  }, []);

  // Make sure the Layout component has access to the router context
  return <>{children}</>;
}
