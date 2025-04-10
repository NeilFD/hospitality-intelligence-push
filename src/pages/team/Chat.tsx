
import React from 'react';
import TeamChat from './components/TeamChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const Chat: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn("container mx-auto overflow-hidden", isMobile ? "p-0 max-w-full" : "p-4")}>
      <div className="overflow-hidden h-[calc(100vh-130px)] border border-gray-100 rounded-lg">
        <TeamChat />
      </div>
    </div>
  );
};

export default Chat;
