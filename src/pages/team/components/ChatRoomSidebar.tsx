
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChatRooms } from '@/services/team-service';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Hash, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  MessageSquare, 
  Bell, 
  Users, 
  Coffee, 
  Beer, 
  Utensils 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChatRoom } from '@/services/team-service';

interface ChatRoomSidebarProps {
  selectedRoomId: string;
  onRoomSelect: (roomId: string) => void;
  minimized: boolean;
  setMinimized: (minimized: boolean) => void;
}

const getRoomIcon = (room: ChatRoom) => {
  if (room.is_announcement_only) return Bell;
  
  switch (room.slug.toLowerCase()) {
    case 'general':
      return MessageSquare;
    case 'food':
      return Utensils;
    case 'beverage':
      return Beer;
    case 'team':
      return Users;
    case 'coffee':
      return Coffee;
    default:
      return Hash;
  }
};

const ChatRoomSidebar: React.FC<ChatRoomSidebarProps> = ({ 
  selectedRoomId, 
  onRoomSelect,
  minimized,
  setMinimized
}) => {
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: getChatRooms
  });
  const isMobile = useIsMobile();

  const [themeColors, setThemeColors] = React.useState(() => {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('theme-forest-green')) {
      return {
        selectedBg: 'bg-forest-green/90',
        selectedHover: 'hover:bg-forest-green/80',
        selectedText: 'text-white',
        hoverBg: 'hover:bg-forest-green/10',
        hoverText: 'hover:text-forest-green-dark'
      };
    } else if (htmlElement.classList.contains('theme-ocean-blue')) {
      return {
        selectedBg: 'bg-[#1565c0]/90',
        selectedHover: 'hover:bg-[#1565c0]/80',
        selectedText: 'text-white',
        hoverBg: 'hover:bg-[#1565c0]/10',
        hoverText: 'hover:text-[#1565c0]'
      };
    } else if (htmlElement.classList.contains('theme-sunset-orange')) {
      return {
        selectedBg: 'bg-[#e65100]/90',
        selectedHover: 'hover:bg-[#e65100]/80',
        selectedText: 'text-white',
        hoverBg: 'hover:bg-[#e65100]/10',
        hoverText: 'hover:text-[#e65100]'
      };
    } else if (htmlElement.classList.contains('theme-berry-purple')) {
      return {
        selectedBg: 'bg-[#6a1b9a]/90',
        selectedHover: 'hover:bg-[#6a1b9a]/80',
        selectedText: 'text-white',
        hoverBg: 'hover:bg-[#6a1b9a]/10',
        hoverText: 'hover:text-[#6a1b9a]'
      };
    } else if (htmlElement.classList.contains('theme-dark-mode')) {
      return {
        selectedBg: 'bg-[#333333]/90',
        selectedHover: 'hover:bg-[#333333]/80',
        selectedText: 'text-white',
        hoverBg: 'hover:bg-[#333333]/10',
        hoverText: 'hover:text-[#333333]'
      };
    } else if (htmlElement.classList.contains('theme-hi-purple')) {
      return {
        selectedBg: 'bg-[#7E69AB]/90',
        selectedHover: 'hover:bg-[#7E69AB]/80',
        selectedText: 'text-white',
        hoverBg: 'hover:bg-[#7E69AB]/10',
        hoverText: 'hover:text-[#7E69AB]'
      };
    }
    return {
      selectedBg: 'bg-[#7E69AB]/90',
      selectedHover: 'hover:bg-[#7E69AB]/80',
      selectedText: 'text-white',
      hoverBg: 'hover:bg-[#86e0b3]',
      hoverText: 'hover:text-[#48495E]'
    };
  });

  React.useEffect(() => {
    const handleThemeChange = () => {
      const htmlElement = document.documentElement;
      if (htmlElement.classList.contains('theme-forest-green')) {
        setThemeColors({
          selectedBg: 'bg-forest-green',
          selectedHover: 'hover:bg-forest-green-dark',
          selectedText: 'text-white',
          hoverBg: 'hover:bg-forest-green-light/30',
          hoverText: 'hover:text-white'
        });
      } else if (htmlElement.classList.contains('theme-ocean-blue')) {
        setThemeColors({
          selectedBg: 'bg-[#1565c0]',
          selectedHover: 'hover:bg-[#1565c0]/90',
          selectedText: 'text-white',
          hoverBg: 'hover:bg-[#64b5f6]/30',
          hoverText: 'hover:text-white'
        });
      } else if (htmlElement.classList.contains('theme-sunset-orange')) {
        setThemeColors({
          selectedBg: 'bg-[#e65100]',
          selectedHover: 'hover:bg-[#e65100]/90',
          selectedText: 'text-white',
          hoverBg: 'hover:bg-[#ffb74d]/30',
          hoverText: 'hover:text-white'
        });
      } else if (htmlElement.classList.contains('theme-berry-purple')) {
        setThemeColors({
          selectedBg: 'bg-[#6a1b9a]',
          selectedHover: 'hover:bg-[#6a1b9a]/90',
          selectedText: 'text-white',
          hoverBg: 'hover:bg-[#ce93d8]/30',
          hoverText: 'hover:text-white'
        });
      } else if (htmlElement.classList.contains('theme-dark-mode')) {
        setThemeColors({
          selectedBg: 'bg-[#333333]',
          selectedHover: 'hover:bg-[#333333]/90',
          selectedText: 'text-white',
          hoverBg: 'hover:bg-[#555555]/30',
          hoverText: 'hover:text-white'
        });
      } else if (htmlElement.classList.contains('theme-hi-purple')) {
        setThemeColors({
          selectedBg: 'bg-[#7E69AB]',
          selectedHover: 'hover:bg-[#7E69AB]/90',
          selectedText: 'text-white',
          hoverBg: 'hover:bg-[#86e0b3]',
          hoverText: 'hover:text-[#48495E]'
        });
      } else {
        setThemeColors({
          selectedBg: 'bg-[#7E69AB]',
          selectedHover: 'hover:bg-[#7E69AB]/90',
          selectedText: 'text-white',
          hoverBg: 'hover:bg-[#86e0b3]',
          hoverText: 'hover:text-[#48495E]'
        });
      }
    };
    
    document.addEventListener('themeClassChanged', handleThemeChange);
    return () => {
      document.removeEventListener('themeClassChanged', handleThemeChange);
    };
  }, []);

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

  const handleRoomClick = (roomId: string) => {
    console.log('Room clicked:', roomId, 'Previous selected:', selectedRoomId);
    onRoomSelect(roomId);
  };

  return (
    <div className={cn(
      "transition-all duration-300 bg-transparent backdrop-blur-sm h-full border-r border-white/20 flex-shrink-0 relative",
      isMobile && minimized ? "w-12" : (isMobile ? "w-64" : "w-64")
    )}>
      <div className="flex items-center justify-between border-b border-white/30 p-3 bg-white/10 backdrop-blur-sm sticky top-0 z-10">
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
        <div className="p-2 pt-5">
          {rooms.map((room) => {
            const RoomIcon = getRoomIcon(room);
            return (
              <Button
                key={room.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start mb-3 font-medium text-left px-3 py-2", 
                  selectedRoomId === room.id 
                    ? `${themeColors.selectedBg} ${themeColors.selectedText} ${themeColors.selectedHover} rounded-md` 
                    : `bg-white/20 text-tavern-blue-dark ${themeColors.hoverBg} ${themeColors.hoverText}`,
                  isMobile && minimized ? "p-2" : "",
                  isMobile ? "h-12" : "h-10"
                )}
                onClick={() => handleRoomClick(room.id)}
                title={room.name}
              >
                {room.is_announcement_only ? (
                  <AlertCircle className={cn(
                    "h-4 w-4 mr-2", 
                    selectedRoomId === room.id ? themeColors.selectedText : "text-tavern-blue-dark",
                    minimized ? "mx-auto" : ""
                  )} />
                ) : (
                  <RoomIcon className={cn(
                    "h-4 w-4 mr-2",
                    selectedRoomId === room.id ? themeColors.selectedText : "text-tavern-blue-dark", 
                    minimized ? "mx-auto" : ""
                  )} />
                )}
                {(!isMobile || !minimized) && (
                  <span className={cn(
                    "truncate text-sm text-left", 
                    selectedRoomId === room.id ? themeColors.selectedText : "text-tavern-blue-dark"
                  )}>{room.name}</span>
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatRoomSidebar;
