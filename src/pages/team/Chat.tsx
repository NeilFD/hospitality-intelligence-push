
import React from 'react';
import TeamChat from './components/TeamChat';
import { MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const Chat: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn("container mx-auto", isMobile ? "p-2 max-w-full overflow-hidden" : "p-4")}>
      <div className={cn(
        "bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg", 
        isMobile ? "p-3 mb-3" : "p-6 mb-6"
      )}>
        <h1 className="text-3xl font-bold mb-2 text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-6 w-6" /> Team Chat
        </h1>
        {!isMobile && (
          <p className="text-gray-600">
            Real-time messaging with your team members.
          </p>
        )}
      </div>
      <TeamChat />
    </div>
  );
};

export default Chat;
