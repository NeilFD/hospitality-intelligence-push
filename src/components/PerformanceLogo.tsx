import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface PerformanceLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const PerformanceLogo: React.FC<PerformanceLogoProps> = ({
  className,
  size = 'md'
}) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(
    localStorage.getItem('app-logo-url')
  );
  
  useEffect(() => {
    const storedLogoUrl = localStorage.getItem('app-logo-url');
    
    const loadActiveTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('themes')
          .select('logo_url')
          .eq('is_active', true)
          .single();
        
        if (error) {
          console.error('Error fetching active theme:', error);
          return;
        }
        
        if (data && data.logo_url) {
          localStorage.setItem('app-logo-url', data.logo_url);
          setLogoUrl(data.logo_url);
        }
      } catch (err) {
        console.error('Error in loadActiveTheme:', err);
      }
    };
    
    const handleLogoUpdate = (event: CustomEvent) => {
      const newLogoUrl = event.detail?.logoUrl;
      if (newLogoUrl) {
        setLogoUrl(newLogoUrl);
      }
    };
    
    window.addEventListener('app-logo-updated', handleLogoUpdate as EventListener);
    
    if (storedLogoUrl) {
      setLogoUrl(storedLogoUrl);
    } else {
      loadActiveTheme();
    }
    
    return () => {
      window.removeEventListener('app-logo-updated', handleLogoUpdate as EventListener);
    };
  }, []);
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20',
    '2xl': 'h-24 w-24'
  };

  return (
    <div 
      className={cn(
        sizeClasses[size], 
        'flex items-center justify-center relative animate-float', 
        className
      )}
    >
      <img 
        src={logoUrl || "/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png"} 
        alt="Logo" 
        className="w-3/4 h-3/4 object-contain absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        onError={(e) => {
          console.error('Failed to load logo:', e);
          setLogoUrl("/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png");
        }}
      />
    </div>
  );
};
