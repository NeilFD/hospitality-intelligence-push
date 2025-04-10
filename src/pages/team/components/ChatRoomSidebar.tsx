
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChatRooms, ChatRoom } from '@/services/team-service';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hash, AlertCircle, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatRoomSidebarProps {
  selectedRoomId: string;
  onRoomSelect: (roomId: string) => void;
}

const ChatRoomSidebar: React.FC<ChatRoomSidebarProps> = ({ 
  selectedRoomId, 
  onRoomSelect 
}) => {
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: getChatRooms
  });
  const isMobile = useIsMobile();
  const [minimized, setMinimized] = React.useState(false);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-tavern-blue-light/50">
        Loading rooms...
      </div>
    );
  }

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  return (
    <div className={cn(
      "transition-all duration-300 bg-pastel-blue h-full border-r border-white/10",
      isMobile && minimized ? "w-14" : "w-64"
    )}>
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        {!isMobile || !minimized ? (
          <h2 className="text-lg font-semibold text-tavern-blue-dark">Chat Rooms</h2>
        ) : null}
        
        {isMobile && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleMinimize} 
            className={cn("ml-auto", minimized ? "mx-auto" : "")}
          >
            {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        )}
      </div>
      
      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="p-2">
          {rooms.map((room) => (
            <Button
              key={room.id}
              variant="ghost"
              className={cn(
                "w-full justify-start mb-2 text-tavern-blue-dark hover:bg-white/10 transition-colors duration-200",
                selectedRoomId === room.id 
                  ? "bg-[#7E69AB] text-white hover:bg-[#7E69AB]/90" 
                  : "hover:text-tavern-blue",
                isMobile && minimized ? "px-2" : ""
              )}
              onClick={() => onRoomSelect(room.id)}
            >
              {room.is_announcement_only ? (
                <AlertCircle className="mr-2 h-4 w-4 text-white" />
              ) : (
                <Hash className="mr-2 h-4 w-4 opacity-60 text-tavern-blue-dark" />
              )}
              {(!isMobile || !minimized) && room.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatRoomSidebar;
