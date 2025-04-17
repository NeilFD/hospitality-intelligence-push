
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface TavernLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const TavernLogo: React.FC<TavernLogoProps> = ({
  className,
  size = 'lg'
}) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(
    localStorage.getItem('app-logo-url') || "/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png"
  );
  
  useEffect(() => {
    // Check if logo exists in localStorage
    const storedLogoUrl = localStorage.getItem('app-logo-url');
    
    // Function to load the active theme/logo from Supabase
    const loadActiveTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('themes')
          .select('logo_url, name')
          .eq('is_active', true)
          .single();
        
        if (error) {
          console.error('Error fetching active theme:', error);
          return;
        }
        
        // If the active theme is "Hi", change it to Berry Purple
        if (data && data.name === 'Hi') {
          // Get Berry Purple theme
          const { data: berryTheme } = await supabase
            .from('themes')
            .select('id, logo_url')
            .eq('name', 'Berry Purple')
            .single();
            
          if (berryTheme) {
            // Deactivate all themes
            await supabase
              .from('themes')
              .update({ is_active: false })
              .neq('id', 0);
              
            // Activate Berry Purple
            await supabase
              .from('themes')
              .update({ is_active: true })
              .eq('id', berryTheme.id);
              
            // Use Berry Purple logo
            if (berryTheme.logo_url) {
              localStorage.setItem('app-logo-url', berryTheme.logo_url);
              setLogoUrl(berryTheme.logo_url);
              
              // Dispatch logo update event
              const logoEvent = new CustomEvent('app-logo-updated', {
                detail: { logoUrl: berryTheme.logo_url }
              });
              window.dispatchEvent(logoEvent);
            }
          }
        }
        // Normal case - use the active theme's logo
        else if (data && data.logo_url) {
          // Save to localStorage and update state
          localStorage.setItem('app-logo-url', data.logo_url);
          setLogoUrl(data.logo_url);
          
          // Dispatch event for other components
          const logoEvent = new CustomEvent('app-logo-updated', {
            detail: { logoUrl: data.logo_url }
          });
          window.dispatchEvent(logoEvent);
        }
      } catch (err) {
        console.error('Error in loadActiveTheme:', err);
      }
    };
    
    // Function to handle logo updates
    const handleLogoUpdate = (event: CustomEvent) => {
      const newLogoUrl = event.detail?.logoUrl;
      if (newLogoUrl) {
        setLogoUrl(newLogoUrl);
      }
    };
    
    // Add event listener
    window.addEventListener('app-logo-updated', handleLogoUpdate as EventListener);
    
    // Initialize with localStorage if available
    if (storedLogoUrl) {
      setLogoUrl(storedLogoUrl);
    } else {
      // Otherwise load from database
      loadActiveTheme();
    }
    
    // Clean up event listener
    return () => {
      window.removeEventListener('app-logo-updated', handleLogoUpdate as EventListener);
    };
  }, []);
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-24 w-24',
    xl: 'h-24 w-24',
    '2xl': 'h-40 w-40',
    '3xl': 'h-64 w-64',
    '4xl': 'h-96 w-96'
  };

  return (
    <div 
      className={cn(
        sizeClasses[size], 
        'flex items-center justify-center', 
        className
      )}
    >
      <img 
        src={logoUrl || "/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png"} 
        alt="Logo" 
        className="w-3/4 h-3/4 object-contain"
        onError={(e) => {
          console.error('Failed to load logo:', e);
          setLogoUrl("/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png");
        }}
      />
    </div>
  );
};
