
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import ChatInterface from '@/components/performance/ChatInterface';
import { Card } from '@/components/ui/card';
import { PerformanceLogo } from '@/components/PerformanceLogo';
import { Brain } from 'lucide-react';
import { useSetCurrentModule } from '@/lib/store';

export default function HiQChat() {
  const setCurrentModule = useSetCurrentModule();
  
  // Force set current module to 'hiq' when component mounts
  useEffect(() => {
    console.log('HiQChat: Setting current module to hiq');
    setCurrentModule('hiq');
    
    // Also update localStorage directly
    try {
      // Update tavern-kitchen-ledger store
      const storeData = localStorage.getItem('tavern-kitchen-ledger');
      if (storeData) {
        const parsedData = JSON.parse(storeData);
        if (parsedData.state) {
          parsedData.state.currentModule = 'hiq';
          localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
        }
      }
      
      // Update hospitality-intelligence store
      const hiData = localStorage.getItem('hospitality-intelligence');
      if (hiData) {
        const parsedData = JSON.parse(hiData);
        if (parsedData.state) {
          parsedData.state.currentModule = 'hiq';
          localStorage.setItem('hospitality-intelligence', JSON.stringify(parsedData));
        }
      }
    } catch (e) {
      console.error('HiQChat: Error updating localStorage:', e);
    }
    
    // Add a class to the body to help with debugging
    document.body.classList.add('hiq-chat-page');
    
    return () => {
      document.body.classList.remove('hiq-chat-page');
    };
  }, [setCurrentModule]);
  
  return (
    <div className="container max-w-7xl py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-[#806cac]/60 to-[#705b9b]/80 rounded-lg shadow-glass">
            <MessageSquare className="h-5 w-5 text-white/90" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#806cac] via-[#705b9b] to-[#806cac] bg-clip-text text-transparent">HiQ Chat Assistant</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="hidden sm:flex items-center gap-2 glass-button" asChild>
            <Link to="/hiq/performance">
              <ArrowLeft className="h-4 w-4 text-[#705b9b]" />
              <span>Back to Performance</span>
            </Link>
          </Button>
          <PerformanceLogo size="md" className="hidden md:block animate-float" />
        </div>
      </div>
      
      <Card className="overflow-hidden border-none shadow-glass rounded-xl bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-md">
        <ChatInterface className="w-full" />
      </Card>
    </div>
  );
}
