
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, MessageCircle, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface ChatRoom {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
  icon?: string;
  color?: string;
}

interface ChatRoomSidebarProps {
  selectedRoomId: string;
  onRoomSelect: (roomId: string) => void;
  rooms: ChatRoom[];
  isLoading: boolean;
  error: any;
  compact?: boolean;
  sidebarMinimized: boolean;
  setSidebarMinimized: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatRoomSidebar: React.FC<ChatRoomSidebarProps> = ({
  selectedRoomId,
  onRoomSelect,
  rooms,
  isLoading,
  error,
  compact = false,
  sidebarMinimized,
  setSidebarMinimized
}) => {
  const getRoomInitials = (name: string) => {
    if (!name) return 'CH';
    const words = name.split(' ');
    if (words.length === 1) {
      return name.substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const getRoomColor = (room: ChatRoom) => {
    if (room.color) return room.color;
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-amber-100 text-amber-700',
      'bg-purple-100 text-purple-700',
      'bg-rose-100 text-rose-700',
      'bg-cyan-100 text-cyan-700',
    ];
    const index = room.name.length % colors.length;
    return colors[index];
  };

  if (sidebarMinimized) {
    return (
      <div className={`flex flex-col ${compact ? 'w-10' : 'w-12'} border-r bg-gray-50/80 relative overflow-hidden`}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 z-10 h-8 w-8"
          onClick={() => setSidebarMinimized(false)}
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center pt-10 gap-3 overflow-y-auto">
          {rooms.map(room => (
            <Button
              key={room.id}
              variant="ghost"
              className={`h-8 w-8 rounded-full p-0 ${selectedRoomId === room.id ? 'bg-blue-100' : ''}`}
              onClick={() => onRoomSelect(room.id)}
              title={room.name}
            >
              <Avatar className="h-8 w-8">
                {room.icon ? (
                  <AvatarImage src={room.icon} alt={room.name} />
                ) : (
                  <AvatarFallback className={getRoomColor(room)}>
                    {getRoomInitials(room.name)}
                  </AvatarFallback>
                )}
              </Avatar>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${compact ? 'w-36' : 'w-60'} border-r bg-gray-50/80 relative overflow-hidden`}>
      <div className="p-3 flex justify-between items-center border-b">
        <h3 className="font-medium flex items-center">
          <MessageCircle className="h-4 w-4 mr-2" /> 
          Rooms
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSidebarMinimized(true)}
          title="Minimize sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <p className="text-sm text-gray-500">Loading rooms...</p>
          </div>
        ) : error ? (
          <div className="p-3 text-center">
            <p className="text-sm text-red-500">Error loading rooms</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-3 text-center">
            <p className="text-sm text-gray-500">No rooms available</p>
          </div>
        ) : (
          <div className="p-2">
            {rooms.map(room => (
              <Button
                key={room.id}
                variant="ghost"
                className={`w-full justify-start mb-1 ${selectedRoomId === room.id ? 'bg-blue-100 hover:bg-blue-200' : ''}`}
                onClick={() => onRoomSelect(room.id)}
              >
                <Avatar className="h-6 w-6 mr-2">
                  {room.icon ? (
                    <AvatarImage src={room.icon} alt={room.name} />
                  ) : (
                    <AvatarFallback className={`text-xs ${getRoomColor(room)}`}>
                      {getRoomInitials(room.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="truncate">{room.name}</span>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
      
      {!compact && (
        <div className="p-3 border-t">
          <Button variant="outline" size="sm" className="w-full flex items-center" disabled>
            <Users className="h-4 w-4 mr-2" />
            Team Members
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatRoomSidebar;
