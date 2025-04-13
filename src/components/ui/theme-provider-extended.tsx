
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function ThemeProviderExtended({ children }: { children: React.ReactNode }) {
  const [themeLoaded, setThemeLoaded] = useState(false);

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
          } else if (data.name === 'Ocean Blue') {
            // Add other theme classes as needed
            // For now, we're just implementing Forest Green
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

  return <>{children}</>;
}
