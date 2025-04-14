
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface SidebarLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
}

export function SidebarLogo({ size = 'md', className }: SidebarLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string>(
    localStorage.getItem('app-logo-url') || "/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png"
  );
  const [companyName, setCompanyName] = useState<string>('Hospitality Intelligence');
  
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
    const fetchCompanyName = async () => {
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('company_name')
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching company name:', error);
          return;
        }
        
        if (data) {
          setCompanyName(data.company_name);
        }
      } catch (err) {
        console.error('Error in fetchCompanyName:', err);
      }
    };
    
    const handleCompanyNameUpdate = (event: any) => {
      if (event.detail && event.detail.companyName) {
        setCompanyName(event.detail.companyName);
      }
    };
    
    window.addEventListener('company-name-updated', handleCompanyNameUpdate);
    
    fetchCompanyName();
    
    return () => {
      window.removeEventListener('company-name-updated', handleCompanyNameUpdate);
    };
  }, []);
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
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
      {companyName && (
        <div className="mt-2 text-center">
          <span className="text-white text-sm font-medium">{companyName}</span>
        </div>
      )}
    </div>
  );
}

export default SidebarLogo;
