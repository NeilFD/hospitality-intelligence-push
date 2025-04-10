
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChatRooms, ChatRoom } from '@/services/team-service';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hash, AlertCircle } from 'lucide-react';

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
      <div className="p-4 text-center">
        Loading rooms...
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-100 border-r h-full">
      <h2 className="text-lg font-semibold p-4 border-b">Chat Rooms</h2>
      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="p-2">
          {rooms.map((room) => (
            <Button
              key={room.id}
              variant={selectedRoomId === room.id ? 'default' : 'ghost'}
              className="w-full justify-start mb-2"
              onClick={() => onRoomSelect(room.id)}
            >
              {room.is_announcement_only ? (
                <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
              ) : (
                <Hash className="mr-2 h-4 w-4" />
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
