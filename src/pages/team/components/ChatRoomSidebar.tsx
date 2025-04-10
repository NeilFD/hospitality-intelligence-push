
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChatRooms, ChatRoom } from '@/services/team-service';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hash, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
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
  const [minimized, setMinimized] = React.useState(isMobile ? true : false);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-tavern-blue-dark">
        Loading rooms...
      </div>
    );
  }

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  return (
    <div className={cn(
      "transition-all duration-300 bg-pastel-blue h-full border-r border-white/20 flex-shrink-0 relative",
      isMobile && minimized ? "w-12" : (isMobile ? "w-32" : "w-64")
    )}>
      <div className="flex items-center justify-between border-b border-white/30 p-2 bg-tavern-blue/10">
        {!isMobile || !minimized ? (
          <h2 className="text-lg font-semibold text-tavern-blue-dark truncate pl-1">
            {isMobile ? "Rooms" : "Chat Rooms"}
          </h2>
        ) : null}
        
        {isMobile && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleMinimize} 
            className={cn(
              "bg-white/30 hover:bg-white/50 text-tavern-blue-dark",
              minimized ? "mx-auto" : "ml-auto"
            )}
            aria-label={minimized ? "Expand sidebar" : "Collapse sidebar"}
          >
            {minimized ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
      
      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="p-1">
          {rooms.map((room) => (
            <Button
              key={room.id}
              variant="ghost"
              className={cn(
                "w-full justify-start mb-1 font-medium",
                selectedRoomId === room.id 
                  ? "bg-[#7E69AB] text-white hover:bg-[#7E69AB]/90" 
                  : "bg-white/20 text-tavern-blue-dark hover:bg-white/40",
                isMobile && minimized ? "p-2" : "",
                isMobile ? "h-10" : ""
              )}
              onClick={() => onRoomSelect(room.id)}
              title={room.name}
            >
              {room.is_announcement_only ? (
                <AlertCircle className={cn(
                  "h-4 w-4", 
                  selectedRoomId === room.id ? "text-white" : "text-tavern-blue-dark",
                  minimized ? "mx-auto" : "mr-2"
                )} />
              ) : (
                <Hash className={cn(
                  "h-4 w-4",
                  selectedRoomId === room.id ? "text-white" : "text-tavern-blue-dark", 
                  minimized ? "mx-auto" : "mr-2"
                )} />
              )}
              {(!isMobile || !minimized) && (
                <span className="truncate">{room.name}</span>
              )}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Mobile expand/collapse tab for better visibility */}
      {isMobile && minimized && (
        <div 
          className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-tavern-blue/90 text-white rounded-r-md p-1 cursor-pointer shadow-md"
          onClick={toggleMinimize}
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export default ChatRoomSidebar;
