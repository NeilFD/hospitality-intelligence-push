
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChatRooms } from '@/services/team-service';
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
      isMobile && minimized ? "w-12" : (isMobile ? "w-64" : "w-64")
    )}>
      <div className="flex items-center justify-between border-b border-white/30 p-3 bg-tavern-blue/10 sticky top-0 z-10">
        {!isMobile || !minimized ? (
          <h2 className="text-lg font-semibold text-tavern-blue-dark pl-1">
            {isMobile ? "Chat Rooms" : "Chat Rooms"}
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
      
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-2 pt-3">
          {rooms.map((room) => (
            <Button
              key={room.id}
              variant="ghost"
              className={cn(
                "w-full justify-start mb-2 font-medium text-left px-3 py-2", // Reduced padding and margin
                selectedRoomId === room.id 
                  ? "bg-[#7E69AB] text-white hover:bg-[#7E69AB]/90 rounded-md" 
                  : "bg-white/20 text-tavern-blue-dark hover:bg-white/40",
                isMobile && minimized ? "p-2" : "",
                isMobile ? "h-12" : "h-10" // Slightly reduced height
              )}
              onClick={() => onRoomSelect(room.id)}
              title={room.name}
            >
              {room.is_announcement_only ? (
                <AlertCircle className={cn(
                  "h-4 w-4 mr-2", 
                  selectedRoomId === room.id ? "text-white" : "text-tavern-blue-dark",
                  minimized ? "mx-auto" : ""
                )} />
              ) : (
                <Hash className={cn(
                  "h-4 w-4 mr-2",
                  selectedRoomId === room.id ? "text-white" : "text-tavern-blue-dark", 
                  minimized ? "mx-auto" : ""
                )} />
              )}
              {(!isMobile || !minimized) && (
                <span className="truncate text-sm">{room.name}</span>
              )}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Mobile expand/collapse tab with improved visibility */}
      {isMobile && minimized && (
        <div 
          className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-[#7E69AB] text-white rounded-r-md p-1 shadow-lg cursor-pointer"
          onClick={toggleMinimize}
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-5 w-5" />
        </div>
      )}
    </div>
  );
};

export default ChatRoomSidebar;
