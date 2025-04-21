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
  
  useEffect(() => {
    console.log('Chat component rendered with slug:', roomSlug);
    console.log('Available rooms:', rooms);
  }, [roomSlug, rooms]);
  
  useEffect(() => {
    if (!rooms || rooms.length === 0) {
      console.log('No rooms available yet');
      return;
    }
    
    if (roomSlug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomSlug)) {
      console.log('Room ID is already a UUID:', roomSlug);
      setRoomId(roomSlug);
      setIsReady(true);
      return;
    }
    
    const room = rooms.find(r => r.slug === roomSlug || r.name.toLowerCase() === roomSlug.toLowerCase());
    console.log('Finding room by slug or name:', roomSlug, 'Found:', room);
    
    if (room) {
      setRoomId(room.id);
      setIsReady(true);
      return;
    }
    
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
  
  useEffect(() => {
    if (!user) return;
    
    console.log('Setting up mention notifications in Chat component for user:', user.id);
    
    const channel = supabase
      .channel('public:team_messages:mentions')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'team_messages',
          filter: `mentioned_users=cs.{${user.id}}`
        },
        (payload) => {
          console.log('Mention notification received in Chat component:', payload);
          if (payload.new) {
            const message = payload.new as any;
            if (message.author_id !== user.id) {
              const readBy = Array.isArray(message.read_by) ? message.read_by : [];
              
              // Immediately show in-app notification
              toast.info('You have been mentioned in a message', {
                duration: 6000,
                action: {
                  label: 'View',
                  onClick: () => {
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
              
              // Trigger push notification via edge function
              try {
                console.log('Triggering push notification for mention');
                supabase.functions.invoke('send-push-notification', {
                  body: {
                    notification: {
                      title: 'New mention',
                      body: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
                      data: {
                        url: `/team/chat?room=${message.room_id}`
                      }
                    },
                    userIds: [user.id]
                  }
                }).then(response => {
                  console.log('Push notification response:', response);
                }).catch(error => {
                  console.error('Error sending push notification:', error);
                });
              } catch (error) {
                console.error('Error triggering push notification:', error);
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Mention notification channel status in Chat.tsx:', status);
      });
      
    return () => {
      console.log('Removing mention notification channel in Chat.tsx');
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  useEffect(() => {
    if (!roomId) return;

    console.log(`Setting up reactions realtime subscription in Chat.tsx for room: ${roomId}`);
    
    // This channel will listen for ANY updates to messages in the current room
    const channel = supabase
      .channel(`chat-reactions-${roomId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'team_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log(`Realtime change detected in Chat.tsx:`, payload);
          
          if (payload.new && payload.old) {
            // Type assertion to ensure TypeScript knows these properties exist
            const oldPayload = payload.old as Record<string, any>;
            const newPayload = payload.new as Record<string, any>;
            
            // Extract reactions or default to empty arrays if undefined
            const oldReactions = oldPayload.reactions || [];
            const newReactions = newPayload.reactions || [];
            
            // Stringify to compare the actual data structures
            if (JSON.stringify(oldReactions) !== JSON.stringify(newReactions)) {
              console.log('👉 REACTION CHANGE DETECTED in Chat.tsx, refreshing messages');
              
              // Force a refresh of the messages query
              queryClient.invalidateQueries({
                queryKey: ['teamMessages', roomId],
                exact: true
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Reactions realtime channel status in Chat.tsx: ${status}`);
      });
      
    return () => {
      console.log('Removing reactions realtime subscription in Chat.tsx');
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);
  
  useEffect(() => {
    const ensureStorage = async () => {
      try {
        console.log('Ensuring storage buckets exist from Chat component...');
        
        // Check if the team_files bucket exists
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error('Error checking storage buckets:', error);
          return;
        }
        
        if (!buckets.some(bucket => bucket.name === 'team_files')) {
          console.log('Creating team_files bucket from Chat component...');
          
          // Try creating the bucket with explicit public access
          const { error: createError } = await supabase.storage.createBucket('team_files', {
            public: true,
            fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
          });
          
          if (createError) {
            console.error('Error creating team_files bucket:', createError);
            
            // If we get a permissions error, we'll try to create a unique file to test access
            if (createError.message.includes('permission')) {
              console.log('Testing bucket access differently due to permission error...');
              try {
                // Try to upload a test file to see if bucket exists but we just can't create it
                const testFile = new Blob(['test'], { type: 'text/plain' });
                await supabase.storage.from('team_files').upload(`test-${Date.now()}.txt`, testFile);
                console.log('Successfully uploaded test file, bucket exists and is accessible');
              } catch (testError) {
                console.error('Error testing bucket access:', testError);
              }
            }
          } else {
            console.log('team_files bucket created successfully from Chat component');
          }
        } else {
          console.log('team_files bucket already exists (confirmed from Chat component)');
        }
      } catch (error) {
        console.error('Error in ensureStorage from Chat component:', error);
      }
    };
    
    if (user) {
      ensureStorage();
    }
  }, [user]);
  
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
          <TeamChat key={`chat-${roomId}`} initialRoomId={roomId} initialMinimizeSidebar={false} />
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
