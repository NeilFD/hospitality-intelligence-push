
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserProfile } from "@/types/supabase-types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Send, Smile, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeamMembers, getChatRooms, getMessages, createMessage as sendChatMessage, addMessageReaction as addReaction, deleteMessage } from '@/services/team-service';
import { useAuthStore } from '@/services/auth-service';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ChatRoomSidebar from './ChatRoomSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { TeamMessage, MessageReaction } from "@/services/team-service"; // Import from team-service instead

interface MessageProps {
  message: TeamMessage;
  isOwnMessage: boolean;
  author: UserProfile | undefined;
  onAddReaction: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  teamMembers: UserProfile[];
  currentUserId: string;
}

const EMOJI_CATEGORIES = [
  "Smileys & Emotion",
  "People & Body",
  "Animals & Nature",
  "Food & Drink",
  "Travel & Places",
  "Activities",
  "Objects",
  "Symbols",
  "Flags",
];

const Message: React.FC<MessageProps> = ({
  message,
  isOwnMessage,
  author,
  onAddReaction,
  onDeleteMessage,
  teamMembers,
  currentUserId,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

  const handleReaction = (emoji: string) => {
    onAddReaction(message.id, emoji);
    setShowEmojiPicker(false);
  };

  const getAuthorProfile = (userId: string) => {
    return teamMembers.find(member => member.id === userId);
  };

  const messageAuthor = author || getAuthorProfile(message.user_id || message.author_id);

  return (
    <div className={`mb-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors duration-200 ${isOwnMessage ? 'bg-blue-50 text-right' : ''}`}>
      <div className="flex items-start">
        {!isOwnMessage && (
          <Avatar className="w-7 h-7 mr-2">
            <AvatarImage src={messageAuthor?.avatar_url || ""} />
            <AvatarFallback>{messageAuthor?.first_name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">
              {messageAuthor?.first_name} {messageAuthor?.last_name || ''}
              {!isOwnMessage && <span className="text-xs text-gray-500 ml-1">({timeAgo})</span>}
            </div>
            {isOwnMessage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-6 w-6 p-0 rounded-full hover:bg-gray-200">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onDeleteMessage(message.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="text-sm text-gray-700 break-words">
            {message.content}
          </div>
          <div className="flex items-center mt-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2 py-1 rounded-full hover:bg-gray-200">
                  <Smile className="h-4 w-4 mr-1" />
                  Add Reaction
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2">
                <Tabs defaultValue="Smileys & Emotion" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    {EMOJI_CATEGORIES.map((category) => (
                      <TabsTrigger value={category} key={category}>{category}</TabsTrigger>
                    ))}
                  </TabsList>
                  {EMOJI_CATEGORIES.map((category) => (
                    <TabsContent value={category} key={category} className="mt-2">
                      <div className="grid grid-cols-8 gap-2">
                        {/* Render emojis based on category - this is just a placeholder */}
                        {Array.from({ length: 8 }, (_, i) => {
                          const emoji = String.fromCodePoint(0x1f600 + i);
                          return (
                            <Button
                              key={i}
                              variant="ghost"
                              className="w-6 h-6 p-0"
                              onClick={() => handleReaction(emoji)}
                            >
                              {emoji}
                            </Button>
                          );
                        })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </PopoverContent>
            </Popover>
            {message.reactions && Object.entries(message.reactions as Record<string, string[]>).map(([emoji, userIds]) => (
              <Badge key={emoji} variant="secondary" className="ml-1">
                {emoji} {userIds.length}
              </Badge>
            ))}
          </div>
        </div>
        {isOwnMessage && (
          <Avatar className="w-7 h-7 ml-2">
            <AvatarImage src={messageAuthor?.avatar_url || ""} />
            <AvatarFallback>{messageAuthor?.first_name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};

const TeamChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [isManager, setIsManager] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const queryClient = useQueryClient();

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getTeamMembers
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: getChatRooms
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', selectedRoomId],
    queryFn: () => getMessages(selectedRoomId || ''),
    enabled: !!selectedRoomId
  });

  useEffect(() => {
    if (user) {
      setIsManager(user.user_metadata?.role === 'manager');
    }
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: (data: { roomId: string; content: string }) => sendChatMessage(data),
    onSuccess: () => {
      setInput('');
      queryClient.invalidateQueries({ queryKey: ['chatMessages', selectedRoomId] });
    }
  });

  const addReactionMutation = useMutation({
    mutationFn: (data: { messageId: string; emoji: string }) => addReaction(data.messageId, data.emoji, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', selectedRoomId] });
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', selectedRoomId] });
    }
  });

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleSend = () => {
    if (input.trim() && selectedRoomId) {
      sendMessageMutation.mutate({
        roomId: selectedRoomId,
        content: input,
      });
    }
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    addReactionMutation.mutate({
      messageId,
      emoji,
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessageMutation.mutate(messageId);
  };

  const currentRoom = rooms.find(room => room.id === selectedRoomId);

  return <div className="flex h-[calc(100vh-120px)]">
      <ChatRoomSidebar selectedRoomId={selectedRoomId} onRoomSelect={handleRoomSelect} />
      
      <div className="flex-1 flex flex-col bg-white/10 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-none">
          <CardContent className="p-0 flex flex-col h-full">
            <div className="bg-white/10 backdrop-blur-sm p-3 border-b border-white/30 flex items-center justify-between h-[52px]">
              {selectedRoomId && rooms.length > 0 && <h2 className="text-lg font-semibold text-tavern-blue-dark pl-2 mx-0 py-px my-0">
                  {rooms.find(room => room.id === selectedRoomId)?.name || 'Chat Room'}
                </h2>}
              <div className="flex items-center gap-2">
                {currentRoom?.is_announcement_only && !isManager && <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    Announcement Channel
                  </Badge>}
                {currentRoom?.is_announcement_only && isManager && <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    Manager Only
                  </Badge>}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map(message => {
                const author = teamMembers.find(member => member.id === (message.user_id || message.author_id));
                return (
                  <Message
                    key={message.id}
                    message={message}
                    isOwnMessage={(message.user_id || message.author_id) === user?.id}
                    author={author}
                    onAddReaction={handleAddReaction}
                    onDeleteMessage={handleDeleteMessage}
                    teamMembers={teamMembers}
                    currentUserId={user?.id || ''}
                  />
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t border-white/30 bg-white/10 backdrop-blur-sm">
              <div className="flex items-center">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSend();
                    }
                  }}
                  className="rounded-l-md flex-1"
                />
                <Button onClick={handleSend} className="rounded-r-md">
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};

export default TeamChat;
