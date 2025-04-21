
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TeamMessage } from '@/services/team-service';
import { useAuthStore } from '@/services/auth-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, Trash2, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const NotificationsDropdown = () => {
  const [hasUnread, setHasUnread] = useState(false);
  const [notifications, setNotifications] = useState<TeamMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const { data: mentionedMessages, refetch: refetchMentions } = useQuery({
    queryKey: ['mentionedMessages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching mentioned messages for user:', user.id);
      
      const { data, error } = await supabase
        .from('team_messages')
        .select('*')
        .contains('mentioned_users', [user.id])
        .eq('deleted', false)
        .eq('notification_state', 'live')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error('Error fetching mentioned messages:', error);
        return [];
      }
      
      console.log('Fetched mentioned messages:', data);
      return data as TeamMessage[];
    },
    enabled: !!user,
    staleTime: 5000,
    refetchInterval: 10000, // Poll every 10 seconds
  });
  
  const { data: profiles = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
        
      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }
      
      return data;
    },
  });
  
  useEffect(() => {
    if (!user) return;
    
    console.log('Setting up notification subscription for user:', user.id);
    
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
          console.log('Received mention notification:', payload);
          if (payload.new && (payload.new as any).author_id !== user.id) {
            const authorId = (payload.new as any).author_id;
            const content = (payload.new as any).content;
            
            // Show toast notification
            toast.info('You have been mentioned in a message', {
              duration: 6000,
              action: {
                label: 'View',
                onClick: () => {
                  navigate(`/team/chat?room=${(payload.new as any).room_id}`);
                }
              }
            });
            
            // Force immediate refresh of notifications
            refetchMentions();
            
            // Flash the icon
            setHasUnread(true);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'team_messages',
          filter: `mentioned_users=cs.{${user.id}}`
        },
        (payload) => {
          console.log('Mention update detected:', payload);
          refetchMentions();
        }
      )
      .subscribe((status) => {
        console.log('Mention notification subscription status:', status);
      });
    
    return () => {
      console.log('Cleaning up notification subscription');
      supabase.removeChannel(channel);
    };
  }, [user, refetchMentions, navigate]);
  
  useEffect(() => {
    if (!user) return;
    
    const pollInterval = setInterval(() => {
      console.log('Polling for new notifications');
      refetchMentions();
    }, 15000); // Poll every 15 seconds as a backup
    
    return () => clearInterval(pollInterval);
  }, [user, refetchMentions]);
  
  useEffect(() => {
    if (mentionedMessages && user) {
      console.log('Updating notifications state with:', mentionedMessages);
      setNotifications(mentionedMessages);
      setHasUnread(mentionedMessages.length > 0);
      
      if (mentionedMessages.length > 0 && !isOpen) {
        const latestMessage = mentionedMessages[0];
        const isAlreadyRead = Array.isArray(latestMessage.read_by) && 
          latestMessage.read_by.includes(user.id);
          
        if (!isAlreadyRead) {
          toast.info('You have new notifications', {
            duration: 3000,
            action: {
              label: 'View',
              onClick: () => setIsOpen(true)
            }
          });
        }
      }
    }
  }, [mentionedMessages, user, isOpen]);
  
  const handleNotificationClick = async (message: TeamMessage) => {
    if (!user) return;
    
    try {
      const currentReadBy = Array.isArray(message.read_by) ? message.read_by : [];
      if (!currentReadBy.includes(user.id)) {
        const updatedReadBy = [...currentReadBy, user.id];
        
        const { error } = await supabase
          .from('team_messages')
          .update({ 
            read_by: updatedReadBy,
            notification_state: 'dismissed'
          })
          .eq('id', message.id);
          
        if (error) {
          console.error('Error marking message as read:', error);
          toast.error('Failed to mark notification as read');
          return;
        }
        
        queryClient.invalidateQueries({ queryKey: ['mentionedMessages'] });
      }
    } catch (error) {
      console.error('Error in handleNotificationClick:', error);
      toast.error('Failed to process notification');
    }
    
    setIsOpen(false);
    navigate(`/team/chat?room=${message.room_id}`);
  };
  
  const handleClearAllNotifications = async () => {
    if (!user) {
      toast.error('User not logged in');
      return;
    }
    
    if (!notifications || notifications.length === 0) {
      return;
    }
    
    try {
      setHasUnread(false);
      
      const { error } = await supabase
        .from('team_messages')
        .update({ notification_state: 'dismissed' })
        .in('id', notifications.map(n => n.id));
      
      if (error) {
        console.error('Error clearing notifications:', error);
        toast.error('Failed to clear notifications');
        await refetchMentions();
        return;
      }
      
      toast.success('All notifications cleared');
      
      const updatePromises = notifications.map(async (notification) => {
        const currentReadBy = Array.isArray(notification.read_by) ? notification.read_by : [];
        if (!currentReadBy.includes(user.id)) {
          const updatedReadBy = [...currentReadBy, user.id];
          
          return await supabase
            .from('team_messages')
            .update({ read_by: updatedReadBy })
            .eq('id', notification.id);
        }
        return { error: null };
      });
      
      await Promise.all(updatePromises);
      queryClient.invalidateQueries({ 
        queryKey: ['mentionedMessages', user.id],
        exact: true
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
      await refetchMentions();
    }
  };
  
  const handleDeleteNotification = async (event: React.MouseEvent, message: TeamMessage) => {
    event.stopPropagation();
    
    if (!user) {
      toast.error('User not logged in');
      return;
    }
    
    try {
      setNotifications(prev => prev.filter(n => n.id !== message.id));
      
      const remainingUnread = notifications
        .filter(n => n.id !== message.id)
        .length > 0;
      
      setHasUnread(remainingUnread);
      
      console.log('Dismissing notification with ID:', message.id);
      
      const { error } = await supabase
        .from('team_messages')
        .update({ notification_state: 'dismissed' })
        .eq('id', message.id);
          
      if (error) {
        console.error('Error dismissing notification:', error);
        toast.error('Failed to dismiss notification');
        await refetchMentions();
        return;
      }
      
      const currentReadBy = Array.isArray(message.read_by) ? message.read_by : [];
      if (!currentReadBy.includes(user.id)) {
        const updatedReadBy = [...currentReadBy, user.id];
        
        await supabase
          .from('team_messages')
          .update({ read_by: updatedReadBy })
          .eq('id', message.id);
      }
      
      queryClient.invalidateQueries({ 
        queryKey: ['mentionedMessages', user.id],
        exact: true
      });
      
      toast.success('Notification dismissed');
      
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast.error('Failed to dismiss notification');
      await refetchMentions();
    }
  };
  
  const getAuthorName = (authorId: string) => {
    const author = profiles.find(p => p.id === authorId);
    if (author) {
      return `${author.first_name} ${author.last_name}`.trim();
    }
    return 'Unknown User';
  };
  
  const getInitials = (authorId: string) => {
    const author = profiles.find(p => p.id === authorId);
    if (author) {
      return `${(author.first_name?.[0] || '').toUpperCase()}${(author.last_name?.[0] || '').toUpperCase()}`;
    }
    return '?';
  };
  
  const getAuthorAvatar = (authorId: string) => {
    const author = profiles.find(p => p.id === authorId);
    return author?.avatar_url || '';
  };
  
  const formatContent = (content: string) => {
    return content;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative p-0 h-auto bg-transparent hover:bg-transparent">
          <Bell className={`h-5 w-5 ${hasUnread ? 'text-red-500' : 'text-tavern-blue'}`} />
          {hasUnread && (
            <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex justify-between items-center p-2 border-b">
          <h4 className="text-sm font-medium">Notifications</h4>
          {notifications && notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 p-0 flex items-center gap-1 hover:bg-red-50" 
              onClick={handleClearAllNotifications}
            >
              <Trash2 className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Clear All</span>
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications && notifications.length > 0 ? (
            <div className="py-1">
              {notifications.map((notification) => {
                return (
                  <div key={notification.id} className="relative group">
                    <Button
                      variant="ghost"
                      className={`
                        w-full justify-start rounded-none py-2 px-3 h-auto flex items-start gap-2 
                        bg-blue-50
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {getAuthorAvatar(notification.author_id) ? (
                          <AvatarImage 
                            src={getAuthorAvatar(notification.author_id)} 
                            alt={getAuthorName(notification.author_id)} 
                          />
                        ) : (
                          <AvatarFallback>
                            {getInitials(notification.author_id)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col items-start text-left w-full">
                        <p className="text-xs font-medium w-full break-words">
                          {getAuthorName(notification.author_id)}
                          <span className="font-normal ml-2 text-gray-500">
                            mentioned you
                          </span>
                        </p>
                        <p className="text-xs text-gray-600 mt-1 w-full break-words whitespace-normal">
                          {formatContent(notification.content)}
                        </p>
                        <span className="text-xs text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 h-6 w-6 p-1 transition-opacity"
                      onClick={(e) => handleDeleteNotification(e, notification)}
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No new notifications</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;
