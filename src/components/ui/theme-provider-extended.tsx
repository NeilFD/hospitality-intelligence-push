
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
        // First, check localStorage for a persisted theme
        const savedThemeName = localStorage.getItem('app-active-theme');
        console.log('Saved theme from localStorage:', savedThemeName);
        
        // Apply saved theme immediately while waiting for DB response
        if (savedThemeName) {
          console.log('Applying saved theme from localStorage immediately:', savedThemeName);
          applyThemeClass(savedThemeName);
        }
        
        const { data, error } = await supabase
          .from('themes')
          .select('name, primary_color, secondary_color, accent_color, custom_font')
          .eq('is_active', true)
          .maybeSingle();
        
        if (error) {
          console.error('Error loading active theme:', error);
          // Already applied saved theme if available
          return;
        }
        
        if (data) {
          // Apply theme class to the html element
          applyThemeClass(data.name);
          
          // Apply custom font if available
          if (data.custom_font) {
            applyCustomFont(data.custom_font);
          }
          
          // Save the current theme to localStorage
          localStorage.setItem('app-active-theme', data.name);
          
          console.log('Applied theme from database:', data.name, 'with font:', data.custom_font);
        }
      } catch (err) {
        console.error('Error in theme loading:', err);
        
        // Recover using localStorage if DB fetch fails
        const savedThemeName = localStorage.getItem('app-active-theme');
        if (savedThemeName) {
          console.log('Recovering with saved theme from localStorage:', savedThemeName);
          applyThemeClass(savedThemeName);
        }
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
        const customFont = event.detail.theme.customFont;
        
        console.log("Applying theme from event:", themeName, "with font:", customFont);
        
        // Save theme to localStorage for persistence
        localStorage.setItem('app-active-theme', themeName);
        
        // Apply theme class
        applyThemeClass(themeName);
        
        // Apply custom font if available
        if (customFont) {
          applyCustomFont(customFont);
        }
        
        // Force a rerender of components that depend on theme classes
        document.dispatchEvent(new Event('themeClassChanged'));
        
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
      const themeClasses = ['theme-forest-green', 'theme-ocean-blue', 'theme-sunset-orange', 'theme-berry-purple', 'theme-dark-mode', 'theme-hi-purple'];
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
      } else if (themeName === 'Hi Purple') {
        html.classList.add('theme-hi-purple');
      }
      
      // Trigger change event
      document.dispatchEvent(new Event('themeClassChanged'));
    };
    
    // Helper function to apply custom font
    const applyCustomFont = (fontFamily: string) => {
      // Check if we need to load specific Google Fonts
      const loadGoogleFonts = () => {
        const fontName = fontFamily.split(',')[0].trim().replace(/["']/g, '');
        
        // Only add the link if it doesn't exist yet
        if (!document.querySelector(`link[href*="${fontName}"]`)) {
          // Convert spaces to + for URL
          const formattedFontName = fontName.replace(/\s+/g, '+');
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${formattedFontName}:wght@400;700&display=swap`;
          document.head.appendChild(link);
          console.log(`Added Google Font link for: ${fontName}`);
        }
      };
      
      // Load Google Fonts for specific font families
      if (
        fontFamily.includes('Playfair Display') || 
        fontFamily.includes('Roboto') || 
        fontFamily.includes('Open Sans') ||
        fontFamily.includes('Montserrat') ||
        fontFamily.includes('Poppins') ||
        fontFamily.includes('Lato') ||
        fontFamily.includes('Source Sans Pro') ||
        fontFamily.includes('Courier Prime')
      ) {
        loadGoogleFonts();
      }
      
      // Add the font to the html element style and :root CSS variables
      document.documentElement.style.setProperty('--app-font-family', fontFamily);
      document.documentElement.style.fontFamily = fontFamily;
      
      // Apply to body as well to ensure it propagates
      document.body.style.fontFamily = fontFamily;
      
      console.log('Applied custom font:', fontFamily);
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
