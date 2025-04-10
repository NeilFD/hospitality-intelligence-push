
import React, { useEffect } from 'react';
import TeamChat from './components/TeamChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';

const Chat: React.FC = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const roomId = searchParams.get('room');
  const { user } = useAuthStore();
  
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
              // Ensure read_by is always an array
              message.read_by = Array.isArray(message.read_by) ? message.read_by : [];
              
              toast.info('You have been mentioned in a message', {
                action: {
                  label: 'View',
                  onClick: () => {
                    window.location.href = `/team/chat?room=${message.room_id}`;
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
        <TeamChat initialRoomId={roomId} />
      </div>
    </div>
  );
};

export default Chat;
