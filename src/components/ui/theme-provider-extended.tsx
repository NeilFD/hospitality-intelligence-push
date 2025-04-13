
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "react-router-dom";

export function ThemeProviderExtended({ children }: { children: React.ReactNode }) {
  const [themeLoaded, setThemeLoaded] = useState(false);
  const location = useLocation();

  console.log("ThemeProviderExtended rendered", location.pathname);

  useEffect(() => {
    // Load the active theme from the database
    const loadActiveTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('themes')
          .select('name, primary_color, secondary_color, accent_color')
          .eq('is_active', true)
          .single();
        
        if (error) {
          console.error('Error loading active theme:', error);
          return;
        }
        
        if (data) {
          // Apply theme class to the html element
          applyThemeClass(data.name);
          
          console.log('Applied theme:', data.name);
        }
      } catch (err) {
        console.error('Error in theme loading:', err);
      } finally {
        setThemeLoaded(true);
      }
    };

    loadActiveTheme();

    // Set up listener for theme updates
    const handleThemeUpdate = (event: any) => {
      console.log("Theme update event received", event.detail);
      
      // If we have theme details in the event, apply them directly without database call
      if (event.detail && event.detail.theme && event.detail.theme.name) {
        const themeName = event.detail.theme.name;
        console.log("Applying theme from event:", themeName);
        
        // Apply theme class
        applyThemeClass(themeName);
        
        console.log('Theme applied immediately from event:', themeName);
      } else {
        // Fallback to database call if no theme in event
        loadActiveTheme();
      }
    };
    
    // Helper function to apply theme class
    const applyThemeClass = (themeName: string) => {
      const html = document.documentElement;
      
      // Remove any existing theme classes
      const themeClasses = ['theme-forest-green', 'theme-ocean-blue', 'theme-sunset-orange', 'theme-berry-purple', 'theme-dark-mode'];
      themeClasses.forEach(cls => {
        html.classList.remove(cls);
      });
      
      // Add the new theme class based on the theme name
      if (themeName === 'Forest Green') {
        html.classList.add('theme-forest-green');
      } else if (themeName === 'Ocean Blue') {
        html.classList.add('theme-ocean-blue');
      } else if (themeName === 'Sunset Orange') {
        html.classList.add('theme-sunset-orange');
      } else if (themeName === 'Berry Purple') {
        html.classList.add('theme-berry-purple');
      } else if (themeName === 'Dark Mode') {
        html.classList.add('theme-dark-mode');
      }
    };
    
    // Listen for custom theme update event
    window.addEventListener('app-theme-updated', handleThemeUpdate);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('app-theme-updated', handleThemeUpdate);
    };
  }, []);

  // Make sure the Layout component has access to the router context
  return <>{children}</>;
}
