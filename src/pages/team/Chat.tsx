
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
        isMobile ? "p-3 mb-2" : "p-6 mb-6"
      )}>
        <h1 className={cn(
          "font-bold text-slate-900 flex items-center gap-2",
          isMobile ? "text-xl mb-0 py-2" : "text-3xl mb-2"
        )}>
          <MessageSquare className={cn(
            isMobile ? "h-5 w-5" : "h-6 w-6"
          )} /> 
          Team Chat
        </h1>
        {!isMobile && (
          <p className="text-gray-600">
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
