
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '@/types/supabase-types';
import { getTeamMembers, getMessages, createMessage, markMessageAsRead, addMessageReaction, TeamMessage, deleteMessage } from '@/services/team-service';
import { useAuthStore } from '@/services/auth-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Send, Smile, MoreHorizontal, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const highlightMentions = (content: string, teamMembers: UserProfile[]): React.ReactNode => {
  if (!content.includes('@')) return content;
  
  const userMap = new Map();
  const userNameMap = new Map();
  
  teamMembers.forEach(member => {
    const fullName = `${member.first_name} ${member.last_name}`.trim();
    userMap.set(member.id, fullName);
    
    userNameMap.set(fullName.toLowerCase(), member.id);
  });
  
  const parts = content.split('@');
  const result: React.ReactNode[] = [parts[0]];
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    
    if (part.startsWith('all ') || part.startsWith('all\n')) {
      result.push(<span key={`mention-all-${i}`} className="bg-[#86e0b3] text-black rounded px-1">@all</span>);
      result.push(part.substring(3));
      continue;
    }
    
    let found = false;
    
    for (const [userId, name] of userMap.entries()) {
      if (part.startsWith(`${userId} `) || part.startsWith(`${userId}\n`)) {
        result.push(<span key={`mention-${userId}-${i}`} className="bg-[#86e0b3] text-black rounded px-1">@{name}</span>);
        result.push(part.substring(userId.length));
        found = true;
        break;
      }
    }
    
    if (!found) {
      result.push('@' + part);
    }
  }
  
  return result;
};

interface TeamChatProps {
  initialRoomId: string | null;
}

const emojis = ['👍', '❤️', '😂', '😮', '👏', '🎉', '🙏', '🔥'];

const TeamChat: React.FC<TeamChatProps> = ({ initialRoomId }) => {
  const [message, setMessage] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId || 'general');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const queryClient = useQueryClient();

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getTeamMembers
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['teamMessages', roomId],
    queryFn: () => getMessages(roomId),
    enabled: !!roomId
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel('team_messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['teamMessages', roomId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'team_messages',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['teamMessages', roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  // Mark messages as read
  useEffect(() => {
    if (!user) return;

    const markMessagesAsRead = async () => {
      try {
        for (const msg of messages) {
          if (!msg.read_by.includes(user.id)) {
            await markMessageAsRead(msg.id, user.id);
          }
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markMessagesAsRead();
  }, [messages, user]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    try {
      // Check for mentions using @
      const mentionedUsers: string[] = [];
      let content = message;

      // Extract @user mentions
      const mentions = message.match(/@[a-zA-Z0-9\s]+/g);
      if (mentions) {
        mentions.forEach(mention => {
          const name = mention.substring(1).trim().toLowerCase(); // Remove @ and trim
          teamMembers.forEach(member => {
            const fullName = `${member.first_name} ${member.last_name}`.trim().toLowerCase();
            if (fullName === name || fullName.startsWith(name)) {
              mentionedUsers.push(member.id);
              content = content.replace(mention, `@${member.id} `);
            }
          });

          // Special case for @all
          if (name === 'all') {
            content = content.replace('@all', '@all ');
            teamMembers.forEach(member => {
              if (member.id !== user.id) { // Don't include current user
                mentionedUsers.push(member.id);
              }
            });
          }
        });
      }

      await createMessage({
        content,
        author_id: user.id,
        room_id: roomId,
        type: 'text',
        mentioned_users: mentionedUsers.length > 0 ? mentionedUsers : undefined,
        read_by: [user.id]
      });

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toast.success('Message deleted');
      queryClient.invalidateQueries({ queryKey: ['teamMessages', roomId] });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleReactionClick = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      await addMessageReaction(messageId, emoji, user.id);
      queryClient.invalidateQueries({ queryKey: ['teamMessages', roomId] });
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const renderMessageContent = (msg: TeamMessage) => {
    return highlightMentions(msg.content, teamMembers);
  };

  const getUserInitials = (userId: string) => {
    const member = teamMembers.find(m => m.id === userId);
    if (!member) return '?';
    return `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase();
  };

  const getUserName = (userId: string) => {
    const member = teamMembers.find(m => m.id === userId);
    if (!member) return 'Unknown User';
    return `${member.first_name || ''} ${member.last_name || ''}`.trim();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Team Chat {roomId !== 'general' ? `- ${roomId}` : ''}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter(msg => !msg.deleted).map(msg => (
          <div key={msg.id} className="flex gap-2 group">
            <Avatar className="h-8 w-8 mt-1">
              {teamMembers.find(m => m.id === msg.author_id)?.avatar_url ? (
                <AvatarImage src={teamMembers.find(m => m.id === msg.author_id)?.avatar_url || ''} />
              ) : (
                <AvatarFallback>{getUserInitials(msg.author_id)}</AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{getUserName(msg.author_id)}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                
                {user?.id === msg.author_id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <div className="text-gray-800 pr-10">{renderMessageContent(msg)}</div>
              
              <div className="flex gap-1 flex-wrap mt-1">
                {/* Display existing reactions */}
                {msg.reactions?.map((reaction, idx) => (
                  <Button
                    key={`${reaction.emoji}-${idx}`}
                    variant="outline"
                    size="sm"
                    className={`h-6 px-2 py-0 text-xs rounded-full ${
                      reaction.user_ids.includes(user?.id || '') ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleReactionClick(msg.id, reaction.emoji)}
                  >
                    {reaction.emoji} {reaction.user_ids.length}
                  </Button>
                ))}
                
                {/* Add reaction button */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100"
                    >
                      <Smile className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="grid grid-cols-8 gap-1">
                      {emojis.map(emoji => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            handleReactionClick(msg.id, emoji);
                          }}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            ref={messageInputRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="resize-none"
            rows={3}
          />
          <Button onClick={handleSendMessage} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;

