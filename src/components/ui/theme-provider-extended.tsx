
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
        // Modify default theme logic
        const savedThemeName = localStorage.getItem('app-active-theme');
        
        // Always default to 'Berry Purple' and remove 'Hi' and 'Tavern Blue' completely
        const defaultThemeName = 'Berry Purple';
        
        if (savedThemeName) {
          // Convert any 'Hi' or 'Tavern Blue' theme to 'Berry Purple'
          const normalizedThemeName = savedThemeName === 'Hi' || savedThemeName === 'Tavern Blue'
            ? 'Berry Purple' 
            : savedThemeName;
          
          console.log('Applying saved theme:', normalizedThemeName);
          applyThemeClass(normalizedThemeName);
          localStorage.setItem('app-active-theme', normalizedThemeName);
        } else {
          console.log('Applying default theme: Berry Purple');
          applyThemeClass('Berry Purple');
          localStorage.setItem('app-active-theme', 'Berry Purple');
        }
        
        const { data, error } = await supabase
          .from('themes')
          .select('id, name, primary_color, secondary_color, accent_color, sidebar_color, button_color, text_color, custom_font, company_name, logo_url, is_active')
          .eq('is_active', true)
          .maybeSingle();
        
        if (error) {
          console.error('Error loading active theme:', error);
          // Already applied saved theme if available
          return;
        }
        
        if (data) {
          console.log('Found active theme in database:', data);
          
          // Check for Hi theme and replace with Berry Purple
          const themeName = data.name === 'Hi' || data.name === 'Tavern Blue' 
            ? 'Berry Purple' 
            : data.name;
          
          // Apply theme class to the html element
          applyThemeClass(themeName);
          
          // Apply theme colors for custom themes
          if (!['Forest Green', 'Ocean Blue', 'Sunset Orange', 'Berry Purple', 'Dark Mode', 'NFD Theme'].includes(themeName)) {
            // This is a custom theme, apply its colors directly
            console.log('Applying custom theme colors for:', themeName);
            applyCustomThemeColors({
              primaryColor: data.primary_color,
              secondaryColor: data.secondary_color,
              accentColor: data.accent_color,
              sidebarColor: data.sidebar_color,
              buttonColor: data.button_color,
              textColor: data.text_color
            });
          }
          
          // Apply custom font if available
          if (data.custom_font) {
            applyCustomFont(data.custom_font);
          }
          
          // Save the company name to localStorage - only convert if exactly "Hi"
          if (data.company_name) {
            const processedName = data.company_name === 'Hi' || data.company_name === 'H i' 
              ? 'Hospitality Intelligence' 
              : data.company_name;
            localStorage.setItem('company-name', processedName);
            console.log('Saved company name to localStorage:', processedName);
          }
          
          // Save the logo URL to localStorage
          if (data.logo_url) {
            localStorage.setItem('app-logo-url', data.logo_url);
            console.log('Saved logo URL to localStorage:', data.logo_url);
          }
          
          // Save the current theme to localStorage, ensuring Hi is replaced
          localStorage.setItem('app-active-theme', themeName);
          
          console.log('Applied theme from database:', themeName, 'with font:', data.custom_font, 'and company name:', data.company_name);
        } else {
          // If no active theme in DB, ensure we use Berry Purple theme
          console.log('No active theme in database, using Berry Purple theme');
          applyThemeClass('Berry Purple');
          localStorage.setItem('app-active-theme', 'Berry Purple');
        }
      } catch (err) {
        console.error('Error in theme loading:', err);
      }
    };

    const applyThemeClass = (themeName: string) => {
      const html = document.documentElement;
      
      // Remove existing theme classes
      const themeClasses = [
        'theme-forest-green', 
        'theme-ocean-blue', 
        'theme-sunset-orange', 
        'theme-berry-purple', 
        'theme-dark-mode', 
        'theme-hi-purple',
        'theme-purple-700', // Include custom theme class for proper removal
        'theme-tavern-blue', // Explicitly remove Tavern Blue
        'theme-nfd-theme', // Include NFD theme
        'hi', // Remove any Hi remnants
        'theme-hi' // Remove any Hi theme
      ];
      
      // Thoroughly clean up themes - remove all theme classes
      themeClasses.forEach(cls => {
        html.classList.remove(cls);
      });
      
      // Reset company name in case it was set to "Hi"
      const companyName = localStorage.getItem('company-name');
      if (companyName === 'Hi' || companyName === 'H i') {
        localStorage.setItem('company-name', 'Hospitality Intelligence');
      }
      
      console.log('Applying theme:', themeName);
      
      // Update theme class mapping - improved handling for custom themes
      if (themeName === 'Forest Green') {
        html.classList.add('theme-forest-green');
      } else if (themeName === 'Ocean Blue') {
        html.classList.add('theme-ocean-blue');
      } else if (themeName === 'Sunset Orange') {
        html.classList.add('theme-sunset-orange');
      } else if (themeName === 'Berry Purple' || themeName === 'Hi') {  // Map both to Berry Purple
        html.classList.add('theme-berry-purple');
      } else if (themeName === 'Dark Mode') {
        html.classList.add('theme-dark-mode');
      } else if (themeName === 'NFD Theme') {
        html.classList.add('theme-nfd-theme');
        // Also load NFD theme colors
        loadAndApplyCustomThemeColors('NFD Theme');
      } else if (themeName === 'Tavern Blue' ||
                (!['Forest Green', 'Ocean Blue', 'Sunset Orange', 'Berry Purple', 'Dark Mode', 'Hi', 'NFD Theme'].includes(themeName))) {
        // Handle custom theme - add the class and also load theme details to apply colors
        if (themeName === 'Tavern Blue') {
          html.classList.add('theme-berry-purple');
          localStorage.setItem('app-active-theme', 'Berry Purple');
          console.log('Converted Tavern Blue to Berry Purple');
        } else {
          // Apply custom theme class for all other themes
          html.classList.add('theme-purple-700');
          console.log('Applied custom theme class for:', themeName);
          
          // Also load theme colors from the database for this custom theme
          loadAndApplyCustomThemeColors(themeName);
        }
      } else {
        // Fallback to Berry Purple for any unknown theme
        html.classList.add('theme-berry-purple');
        console.log('Unknown theme name, defaulting to Berry Purple:', themeName);
      }
      
      // Trigger change event
      document.dispatchEvent(new Event('themeClassChanged'));
      console.log('Theme applied directly:', themeName);
    };
    
    // Function to load and apply custom theme colors from the database
    const loadAndApplyCustomThemeColors = async (themeName: string) => {
      try {
        console.log('Loading custom theme colors for:', themeName);
        const { data, error } = await supabase
          .from('themes')
          .select('primary_color, secondary_color, accent_color, sidebar_color, button_color, text_color')
          .eq('name', themeName)
          .maybeSingle();
          
        if (error) {
          console.error('Error loading custom theme colors:', error);
          return;
        }
        
        if (data) {
          console.log('Found custom theme colors:', data);
          applyCustomThemeColors({
            primaryColor: data.primary_color,
            secondaryColor: data.secondary_color,
            accentColor: data.accent_color,
            sidebarColor: data.sidebar_color,
            buttonColor: data.button_color,
            textColor: data.text_color
          });
        }
      } catch (err) {
        console.error('Error loading custom theme colors:', err);
      }
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
      
      // Set CSS variables for the custom theme colors
      html.style.setProperty('--custom-primary-color', colors.primaryColor);
      html.style.setProperty('--custom-secondary-color', colors.secondaryColor);
      html.style.setProperty('--custom-accent-color', colors.accentColor);
      html.style.setProperty('--custom-sidebar-color', colors.sidebarColor);
      html.style.setProperty('--custom-button-color', colors.buttonColor);
      html.style.setProperty('--custom-text-color', colors.textColor);
      
      // Apply the sidebar color directly to the sidebar
      const sidebar = document.querySelector('.sidebar') as HTMLElement;
      if (sidebar) {
        sidebar.style.backgroundColor = colors.sidebarColor;
      }
      
      console.log('Applied custom theme colors', colors);
    };

    // Set up listener for theme updates
    const handleThemeUpdate = (event: any) => {
      console.log("Theme update event received", event.detail);
      
      // If we have theme details in the event, apply them directly without database call
      if (event.detail && event.detail.theme) {
        const themeName = event.detail.theme.name;
        const customFont = event.detail.theme.customFont;
        const companyName = event.detail.theme.companyName;
        const logoUrl = event.detail.theme.logoUrl;
        
        console.log("Applying theme from event:", themeName, "with font:", customFont, "and company name:", companyName);
        
        // Save theme name to localStorage for persistence
        localStorage.setItem('app-active-theme', themeName);
        
        // Save company name to localStorage if available - only convert if exactly "Hi"
        if (companyName) {
          const processedName = companyName === 'Hi' || companyName === 'H i' 
            ? 'Hospitality Intelligence' 
            : companyName;
          localStorage.setItem('company-name', processedName);
          console.log('Saving company name to localStorage:', processedName);
        }
        
        // Save logo URL to localStorage if available
        if (logoUrl) {
          localStorage.setItem('app-logo-url', logoUrl);
          console.log('Saving logo URL to localStorage:', logoUrl);
        }
        
        // Apply theme class
        applyThemeClass(themeName);
        
        // Apply custom theme colors if provided in the event
        if (event.detail.theme.primaryColor) {
          applyCustomThemeColors({
            primaryColor: event.detail.theme.primaryColor,
            secondaryColor: event.detail.theme.secondaryColor,
            accentColor: event.detail.theme.accentColor,
            sidebarColor: event.detail.theme.sidebarColor,
            buttonColor: event.detail.theme.buttonColor,
            textColor: event.detail.theme.textColor
          });
        }
        
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
    
    // Initial theme load
    loadActiveTheme();
    
    // Clean up event listener
    return () => {
      window.removeEventListener('app-theme-updated', handleThemeUpdate);
    };
  }, []);

  // Make sure the Layout component has access to the router context
  return <>{children}</>;
}
