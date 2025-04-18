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
        
        // Override any saved theme to Berry Purple
        const savedThemeName = localStorage.getItem('app-active-theme') || 'Berry Purple';
        
        console.log('Applying theme:', savedThemeName, 'with Berry Purple as fallback');
        
        // First apply Berry Purple as initial fallback
        applyThemeClass('Berry Purple');
        
        // Apply Berry Purple theme colors as initial values
        applyBerryPurpleThemeColors();
        
        // Then try to load the requested theme from database
        let themeNameToLoad = savedThemeName;
        
        // For problematic themes like NFD, we'll still try to load them but keep Berry Purple ready
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
              sidebarColor: berryPurpleData.sidebar_color || '#7e57c2',
              buttonColor: berryPurpleData.button_color || '#7e57c2',
              textColor: berryPurpleData.text_color || '#333333'
            });
          }
          return;
        }
        
        console.log('Found theme in database:', data);
        
        // Handle NFD theme specifically
        if (data.name === 'NFD Theme' || data.name === 'NFD') {
          console.log('Applying NFD theme colors');
          applyThemeClass('nfd-theme');
          
          // Apply NFD theme colors specifically
          applyCustomThemeColors({
            primaryColor: '#ec193a',
            secondaryColor: '#ffebee',
            accentColor: '#d81b60',
            sidebarColor: '#ec193a',
            buttonColor: '#ec193a',
            textColor: '#212121'
          });
        } else {
          // Apply the theme class
          applyThemeClass(data.name);
          
          // Apply theme colors
          applyCustomThemeColors({
            primaryColor: data.primary_color || '#9d89c9',
            secondaryColor: data.secondary_color || '#f3e5f5',
            accentColor: data.accent_color || '#ab47bc',
            sidebarColor: data.sidebar_color || '#7e57c2',
            buttonColor: data.button_color || '#7e57c2',
            textColor: data.text_color || '#333333'
          });
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
        'theme-purple-700'
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
        'Custom Theme': 'theme-purple-700'
      };
      
      // Get the theme class or default to Berry Purple theme class
      const themeClass = themeClassMap[themeName] || 'theme-berry-purple';
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
      
      // Set CSS variables
      html.style.setProperty('--custom-primary-color', colors.primaryColor);
      html.style.setProperty('--custom-secondary-color', colors.secondaryColor);
      html.style.setProperty('--custom-accent-color', colors.accentColor);
      html.style.setProperty('--custom-sidebar-color', colors.sidebarColor);
      html.style.setProperty('--custom-button-color', colors.buttonColor);
      html.style.setProperty('--custom-text-color', colors.textColor);
      
      // Store sidebar color in localStorage
      localStorage.setItem('custom-sidebar-color', colors.sidebarColor);
      
      // Apply the sidebar color directly to any existing sidebar element
      const sidebarElements = document.querySelectorAll('.sidebar');
      if (sidebarElements && sidebarElements.length > 0) {
        sidebarElements.forEach(sidebar => {
          (sidebar as HTMLElement).style.backgroundColor = colors.sidebarColor;
        });
      }
      
      // Dispatch event for theme color updates
      window.dispatchEvent(new CustomEvent('app-theme-updated', {
        detail: { colors }
      }));
    };
    
    // Initial theme load
    loadActiveTheme();
  }, []);

  // Make sure the Layout component has access to the router context
  return <>{children}</>;
}
