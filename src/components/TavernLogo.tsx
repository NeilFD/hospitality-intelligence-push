
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TavernLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const TavernLogo: React.FC<TavernLogoProps> = ({
  className,
  size = 'lg'
}) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(
    localStorage.getItem('app-logo-url')
  );
  
  useEffect(() => {
    // Function to handle logo updates
    const handleLogoUpdate = (event: CustomEvent) => {
      const newLogoUrl = event.detail?.logoUrl;
      setLogoUrl(newLogoUrl);
    };
    
    // Add event listener
    window.addEventListener('app-logo-updated', handleLogoUpdate as EventListener);
    
    // Check localStorage on mount
    const storedLogoUrl = localStorage.getItem('app-logo-url');
    if (storedLogoUrl) {
      setLogoUrl(storedLogoUrl);
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
      />
    </div>
  );
};
