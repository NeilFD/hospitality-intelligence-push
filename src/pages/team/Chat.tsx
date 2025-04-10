
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
        isMobile ? "p-2 mb-1" : "p-4 mb-3"  // Reduced padding and margin
      )}>
        <h1 className={cn(
          "font-bold text-slate-900 flex items-center gap-2",
          isMobile ? "text-base mb-0 py-1" : "text-2xl mb-2"  // Reduced text size, margin, and padding
        )}>
          <MessageSquare className={cn(
            isMobile ? "h-4 w-4" : "h-5 w-5"  // Slightly reduced icon size
          )} /> 
          Team Chat
        </h1>
        {!isMobile && (
          <p className="text-gray-600 mb-1">  {/* Reduced bottom margin */}
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
