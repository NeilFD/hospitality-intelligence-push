
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function SidebarLogo() {
  const [logoUrl, setLogoUrl] = useState<string>(
    localStorage.getItem('app-logo-url') || "/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png"
  );
  
  useEffect(() => {
    // Listen for logo updates
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
    <div className="mb-6 px-4">
      <Link to="/dashboard" className="flex items-center justify-center">
        <img
          src={logoUrl}
          alt="Logo"
          className="h-12 object-contain"
          onError={(e) => {
            console.error('Failed to load logo:', e);
            // Fallback to default logo
            setLogoUrl("/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png");
          }}
        />
      </Link>
    </div>
  );
}
