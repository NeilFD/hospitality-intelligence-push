
import React from 'react';
import TeamChat from './components/TeamChat';
import { MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const Chat: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "container mx-auto overflow-hidden", 
      isMobile ? "p-0 max-w-full" : "p-4"
    )}>
      <div className={cn(
        "bg-[#E5DEFF] rounded-lg", 
        isMobile ? "p-1 mb-1" : "p-2 mb-2"  // Reduced padding and margin significantly
      )}>
        <h1 className={cn(
          "font-bold text-slate-900 flex items-center gap-2",
          isMobile ? "text-sm mb-0 py-0" : "text-base mb-1"  // Further reduced text size, margin, and padding
        )}>
          <MessageSquare className={cn(
            isMobile ? "h-3 w-3" : "h-4 w-4"  // Smaller icon
          )} /> 
          Team Chat
        </h1>
        {!isMobile && (
          <p className="text-gray-600 text-xs mb-0">  {/* Reduced text size and margin */}
            Real-time messaging with your team members.
          </p>
        )}
      </div>
      <div className="overflow-hidden h-[calc(100vh-130px)] border border-gray-100 rounded-lg">
        <TeamChat />
      </div>
    </div>
  );
};

export default Chat;
