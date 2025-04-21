
import React, { useEffect, useState } from 'react';
import TeamChat from './components/TeamChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChatRooms } from '@/services/team-service';

const Chat: React.FC = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(location.search);
  const roomSlug = searchParams.get('room') || 'general';
  const { user } = useAuthStore();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Fetch chat rooms with better error handling
  const { data: rooms = [], isLoading: isLoadingRooms, error: roomsError } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: getChatRooms,
    staleTime: 60000, // 1 minute
    retry: 2,
    meta: {
      onSuccess: (data: any) => {
        console.log('Successfully fetched chat rooms:', data);
      },
      onError: (error: Error) => {
        console.error('Error fetching chat rooms:', error);
        toast.error('Failed to load chat rooms');
      }
    }
  });
  
  // Additional debugging
  useEffect(() => {
    console.log('Chat component rendered with slug:', roomSlug);
    console.log('Available rooms:', rooms);
  }, [roomSlug, rooms]);
  
  // Find the room ID based on the slug in the URL with improved error handling
  useEffect(() => {
    if (!rooms || rooms.length === 0) {
      console.log('No rooms available yet');
      return;
    }
    
    // First check if roomSlug is already a UUID (might be passed directly)
    if (roomSlug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomSlug)) {
      console.log('Room ID is already a UUID:', roomSlug);
      setRoomId(roomSlug);
      setIsReady(true);
      return;
    }
    
    // Otherwise look for a room by slug
    const room = rooms.find(r => r.slug === roomSlug || r.name.toLowerCase() === roomSlug.toLowerCase());
    console.log('Finding room by slug or name:', roomSlug, 'Found:', room);
    
    // If we found a room by slug, use its ID
    if (room) {
      setRoomId(room.id);
      setIsReady(true);
      return;
    }
    
    // Fall back to first room if available
    if (rooms.length > 0) {
      console.log('Falling back to first room:', rooms[0]);
      setRoomId(rooms[0].id);
      setIsReady(true);
      return;
    }
    
    console.log('No rooms available, returning null');
    setRoomId(null);
    setIsReady(true);
  }, [rooms, roomSlug]);
  
  // Setup Supabase realtime subscription for message mentions
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
  
  // Setup Supabase realtime subscription for message reactions and updates
  useEffect(() => {
    if (!roomId) return;

    console.log(`Setting up realtime subscription for room: ${roomId}`);
    
    // Subscribe to all changes in the team_messages table for the current room
    const channel = supabase
      .channel('room-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public', 
          table: 'team_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Message updated in realtime:', payload);
          // Invalidate the query to update the UI
          queryClient.invalidateQueries({
            queryKey: ['teamMessages', roomId]
          });
        }
      )
      .subscribe((status) => {
        console.log(`Supabase channel status: ${status}`);
      });
      
    return () => {
      console.log('Removing realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);
  
  return (
    <div className={cn("container mx-auto overflow-hidden", isMobile ? "p-0 max-w-full" : "p-4")}>
      <div className="overflow-hidden h-[calc(100vh-130px)] border border-gray-100 rounded-lg">
        {isLoadingRooms ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Loading chat rooms...</p>
          </div>
        ) : roomsError ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-red-500">Error loading chat rooms: {roomsError instanceof Error ? roomsError.message : 'Unknown error'}</p>
          </div>
        ) : !isReady ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Preparing chat interface...</p>
          </div>
        ) : roomId ? (
          <TeamChat key={`chat-${roomId}`} initialRoomId={roomId} />
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
