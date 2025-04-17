
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
        // First try to get from localStorage (for immediate display while DB loads)
        const cachedName = localStorage.getItem('company-name');
        
        // Never display "Hi" or "H i" as company name
        if (cachedName && cachedName !== 'Hi' && cachedName !== 'H i') {
          console.log('Using company name from localStorage:', cachedName);
          setCompanyName(cachedName);
        } else {
          // Set default name - always Hospitality Intelligence
          console.log('Using default company name: Hospitality Intelligence');
          setCompanyName('Hospitality Intelligence');
          localStorage.setItem('company-name', 'Hospitality Intelligence');
        }
        
        // Then fetch from database for most up-to-date value
        const { data, error } = await supabase
          .from('company_settings')
          .select('company_name')
          .eq('id', 1)
          .single();
        
        if (error) {
          console.error('Error fetching company name:', error);
          return;
        }
        
        if (data && data.company_name) {
          // Never use "Hi" or "H i" as company name
          const companyNameFromDB = data.company_name;
          const properName = (companyNameFromDB === 'Hi' || companyNameFromDB === 'H i') 
            ? 'Hospitality Intelligence' 
            : companyNameFromDB;
          
          console.log('Fetched company name from database:', properName);
          setCompanyName(properName);
          
          // Update localStorage cache
          localStorage.setItem('company-name', properName);
          
          // If the database had "Hi" as company name, update it
          if (companyNameFromDB === 'Hi' || companyNameFromDB === 'H i') {
            try {
              const { error: updateError } = await supabase
                .from('company_settings')
                .update({ company_name: 'Hospitality Intelligence' })
                .eq('id', 1);
                
              if (updateError) {
                console.error('Error updating company name in DB:', updateError);
              } else {
                console.log('Successfully updated company name in DB to Hospitality Intelligence');
              }
            } catch (err) {
              console.error('Error updating company name:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error in fetchCompanyName:', err);
      }
    };
    
    const handleCompanyNameUpdate = (event: any) => {
      if (event.detail && event.detail.companyName) {
        const newName = event.detail.companyName;
        
        // Never use "Hi" or "H i" as company name
        if (newName === 'Hi' || newName === 'H i') {
          console.log('Rejecting company name update to Hi, using Hospitality Intelligence instead');
          setCompanyName('Hospitality Intelligence');
          localStorage.setItem('company-name', 'Hospitality Intelligence');
        } else {
          console.log('Company name updated via event:', newName);
          setCompanyName(newName);
          localStorage.setItem('company-name', newName);
        }
      }
    };
    
    window.addEventListener('company-name-updated', handleCompanyNameUpdate);
    
    fetchCompanyName();
    
    return () => {
      window.removeEventListener('company-name-updated', handleCompanyNameUpdate);
    };
  }, []);
  
  useEffect(() => {
    const handleLogoUpdate = (event: any) => {
      if (event.detail && event.detail.logoUrl) {
        setLogoUrl(event.detail.logoUrl);
      }
    };
    
    window.addEventListener('app-logo-updated', handleLogoUpdate);
    
    return () => {
      window.removeEventListener('app-logo-updated', handleLogoUpdate);
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
      {companyName && companyName !== 'Hi' && companyName !== 'H i' && (
        <div className="mt-2 text-center">
          <span className="text-white text-sm font-medium">{companyName}</span>
        </div>
      )}
    </div>
  );
}

export default SidebarLogo;
