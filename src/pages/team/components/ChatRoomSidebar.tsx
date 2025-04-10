
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChatRooms, ChatRoom } from '@/services/team-service';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hash, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  if (isLoading) {
    return (
      <div className="p-4 text-center text-tavern-blue-light/50">
        Loading rooms...
      </div>
    );
  }

  return (
    <div className="w-64 bg-tavern-blue-light/90 h-full border-r border-white/10">
      <h2 className="text-lg font-semibold p-4 border-b border-white/10 text-tavern-blue-dark">Chat Rooms</h2>
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
                  : "hover:text-tavern-blue"
              )}
              onClick={() => onRoomSelect(room.id)}
            >
              {room.is_announcement_only ? (
                <AlertCircle className="mr-2 h-4 w-4 text-white" />
              ) : (
                <Hash className="mr-2 h-4 w-4 opacity-60 text-tavern-blue-dark" />
              )}
              {room.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatRoomSidebar;
