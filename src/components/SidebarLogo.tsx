
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
}

export default function SidebarLogo({ size = 'md', className }: SidebarLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string>(
    localStorage.getItem('app-logo-url') || "/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png"
  );
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
    '2xl': 'h-32 w-32',
    '3xl': 'h-48 w-48',
    '4xl': 'h-64 w-64'
  };
  
  useEffect(() => {
    const handleLogoUpdate = (event: any) => {
      if (event.detail && event.detail.logoUrl) {
        console.log('Logo update received:', event.detail.logoUrl);
        setLogoUrl(event.detail.logoUrl);
        localStorage.setItem('app-logo-url', event.detail.logoUrl);
      }
    };
    
    window.addEventListener('app-logo-updated', handleLogoUpdate);
    
    return () => {
      window.removeEventListener('app-logo-updated', handleLogoUpdate);
    };
  }, []);
  
  return (
    <div className={cn("mb-6 px-4 flex justify-center", className)}>
      <Link to="/dashboard" className="flex items-center justify-center">
        <img
          src={logoUrl}
          alt="Logo"
          className={cn(sizeClasses[size], "object-contain")}
          onError={(e) => {
            console.error('Failed to load logo:', e);
            setLogoUrl("/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png");
          }}
        />
      </Link>
    </div>
  );
}

