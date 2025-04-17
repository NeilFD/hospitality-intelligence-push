
import React, { useEffect } from 'react';
import TeamChat from './components/TeamChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { getChatRooms } from '@/services/team-service';

const Chat: React.FC = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const roomSlug = searchParams.get('room') || 'general';
  const { user } = useAuthStore();
  
  // Fetch chat rooms
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: getChatRooms
  });
  
  // Find the room ID based on the slug in the URL
  const roomId = React.useMemo(() => {
    // First check if roomSlug is already a UUID (might be passed directly)
    if (roomSlug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomSlug)) {
      console.log('Room ID is already a UUID:', roomSlug);
      return roomSlug;
    }
    
    // Otherwise look for a room by slug
    const room = rooms.find(r => r.slug === roomSlug);
    console.log('Finding room by slug:', roomSlug, 'Found:', room);
    
    // If we found a room by slug, use its ID
    if (room) return room.id;
    
    // Fall back to first room if available
    if (rooms.length > 0) {
      console.log('Falling back to first room:', rooms[0]);
      return rooms[0].id;
    }
    
    console.log('No rooms available, returning null');
    return null;
  }, [rooms, roomSlug]);
  
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to messages where current user is mentioned
    const channel = supabase
      .channel('public:team_messages')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'team_messages',
          filter: `mentioned_users=cs.{${user.id}}`
        },
        (payload) => {
          if (payload.new) {
            const message = payload.new as any;
            if (message.author_id !== user.id) {  // Don't notify for own messages
              // Ensure the read_by array is properly initialized
              const readBy = Array.isArray(message.read_by) ? message.read_by : [];
              
              toast.info('You have been mentioned in a message', {
                action: {
                  label: 'View',
                  onClick: () => {
                    // Mark as read when clicking on the notification toast
                    supabase
                      .from('team_messages')
                      .update({ 
                        read_by: [...readBy, user.id] 
                      })
                      .eq('id', message.id)
                      .then(() => {
                        window.location.href = `/team/chat?room=${message.room_id}`;
                      });
                  }
                }
              });
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  return (
    <div className={cn("container mx-auto overflow-hidden", isMobile ? "p-0 max-w-full" : "p-4")}>
      <div className="overflow-hidden h-[calc(100vh-130px)] border border-gray-100 rounded-lg">
        {isLoadingRooms ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Loading chat rooms...</p>
          </div>
        ) : roomId ? (
          <TeamChat initialRoomId={roomId} />
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No chat rooms available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
