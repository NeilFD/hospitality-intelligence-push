
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
        const savedThemeName = 'Berry Purple';
        
        console.log('Applying Berry Purple theme as fallback');
        applyThemeClass(savedThemeName);
        localStorage.setItem('app-active-theme', savedThemeName);
        
        const { data, error } = await supabase
          .from('themes')
          .select('*')
          .eq('name', 'Berry Purple')
          .maybeSingle();
        
        if (error) {
          console.error('Error loading active theme:', error);
          return;
        }
        
        if (data) {
          console.log('Found Berry Purple theme in database:', data);
          
          // Apply theme class to the html element
          applyThemeClass('Berry Purple');
          
          // Apply Berry Purple theme colors
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
      
      // ALWAYS apply Berry Purple theme class
      html.classList.add('theme-berry-purple');
      
      // Trigger change event
      document.dispatchEvent(new Event('themeClassChanged'));
      console.log('Theme applied directly:', themeName);
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
      
      // Set CSS variables for Berry Purple colors
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
    };
    
    // Initial theme load
    loadActiveTheme();
  }, []);

  // Make sure the Layout component has access to the router context
  return <>{children}</>;
}
