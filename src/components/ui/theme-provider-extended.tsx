
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "react-router-dom";

export function ThemeProviderExtended({ children }: { children: React.ReactNode }) {
  const [themeLoaded, setThemeLoaded] = useState(false);
  const location = useLocation();

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
          const html = document.documentElement;
          
          // Remove any existing theme classes
          const themeClasses = ['theme-forest-green', 'theme-ocean-blue', 'theme-sunset-orange', 'theme-berry-purple', 'theme-dark-mode'];
          themeClasses.forEach(cls => {
            html.classList.remove(cls);
          });
          
          // Add the new theme class based on the theme name
          if (data.name === 'Forest Green') {
            html.classList.add('theme-forest-green');
            console.log('Applied Forest Green theme');
          } else if (data.name === 'Ocean Blue') {
            html.classList.add('theme-ocean-blue');
            console.log('Applied Ocean Blue theme');
          } else if (data.name === 'Sunset Orange') {
            html.classList.add('theme-sunset-orange');
            console.log('Applied Sunset Orange theme');
          } else if (data.name === 'Berry Purple') {
            html.classList.add('theme-berry-purple');
            console.log('Applied Berry Purple theme');
          } else if (data.name === 'Dark Mode') {
            html.classList.add('theme-dark-mode');
            console.log('Applied Dark Mode theme');
          }
          
          console.log('Applied theme:', data.name);
        }
      } catch (err) {
        console.error('Error in theme loading:', err);
      } finally {
        setThemeLoaded(true);
      }
    };

    loadActiveTheme();
  }, []);

  // We need to force a re-render when the location changes
  // to ensure the theme is properly applied after navigation
  useEffect(() => {
    console.log('Current route:', location.pathname);
  }, [location]);

  return <>{children}</>;
}
