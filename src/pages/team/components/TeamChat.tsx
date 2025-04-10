import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send, Image, Mic, Smile, Paperclip, AtSign, Heart, ThumbsUp, Laugh, Angry, Frown, PartyPopper, ThumbsDown, Bookmark } from 'lucide-react';
import { TeamMessage, getMessages, createMessage, markMessageAsRead, uploadTeamFile, getTeamMembers, getChatRooms, addMessageReaction, MessageReaction } from '@/services/team-service';
import { useAuthStore } from '@/services/auth-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile } from '@/types/supabase-types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import ChatRoomSidebar from './ChatRoomSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface MessageProps {
  message: TeamMessage;
  isOwnMessage: boolean;
  author: UserProfile | undefined;
  onAddReaction: (messageId: string, emoji: string) => void;
  teamMembers: UserProfile[];
  currentUserId: string;
}

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "☺️", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "😵‍💫", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐"]
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴"]
  },
  {
    name: "Love",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "💌", "💋", "👨‍❤️‍💋‍👨", "👩‍❤️‍💋‍👩", "👨‍❤️‍👨", "👩‍❤️‍👩"]
  },
  {
    name: "Celebration",
    emojis: ["🎉", "🎊", "🎂", "🍰", "🧁", "🍾", "🥂", "🥳", "🎈", "🎁", "🎀", "🎐", "🎆", "🎇", "🎃", "🎄", "🎋", "🎍", "🎎", "🎏", "🎑", "🧧", "🎭", "🎪", "🎡", "🎢", "🎨"]
  },
  {
    name: "Activities",
    emojis: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂"]
  }
];

const Message: React.FC<MessageProps> = ({ 
  message, 
  isOwnMessage, 
  author, 
  onAddReaction,
  teamMembers,
  currentUserId
}) => {
  const messageContainerClass = isOwnMessage 
    ? "flex justify-end mb-4" 
    : "flex justify-start mb-4";
    
  const messageBubbleClass = isOwnMessage
    ? "bg-blue-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg p-3 max-w-xs lg:max-w-md"
    : "bg-gray-200 text-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg p-3 max-w-xs lg:max-w-md";
  
  const getInitials = () => {
    if (!author) return '?';
    return `${(author.first_name?.[0] || '').toUpperCase()}${(author.last_name?.[0] || '').toUpperCase()}`;
  };

  const [selectedCategory, setSelectedCategory] = useState(0);

  const commonEmojis = [
    { icon: <Heart className="h-4 w-4" />, emoji: "❤️" },
    { icon: <ThumbsUp className="h-4 w-4" />, emoji: "👍" },
    { icon: <Laugh className="h-4 w-4" />, emoji: "😂" },
    { icon: <PartyPopper className="h-4 w-4" />, emoji: "🎉" },
    { icon: <ThumbsDown className="h-4 w-4" />, emoji: "👎" },
    { icon: <Frown className="h-4 w-4" />, emoji: "😢" },
    { icon: <Angry className="h-4 w-4" />, emoji: "😡" },
    { icon: <Bookmark className="h-4 w-4" />, emoji: "🔖" }
  ];

  // Get user names for reactions
  const getUserNames = (userIds: string[]) => {
    return userIds.map(userId => {
      const user = teamMembers.find(member => member.id === userId);
      return user ? `${user.first_name} ${user.last_name}` : 'Unknown user';
    }).join(', ');
  };
  
  return (
    <div className={messageContainerClass}>
      {!isOwnMessage && (
        <div className="flex-shrink-0 mr-2">
          <Avatar className="h-8 w-8">
            {author?.avatar_url ? (
              <AvatarImage src={author.avatar_url} alt={`${author.first_name} ${author.last_name}`} />
            ) : (
              <AvatarFallback>{getInitials()}</AvatarFallback>
            )}
          </Avatar>
        </div>
      )}
      
      <div className="flex flex-col relative">
        <div className={`${messageBubbleClass} shadow-sm hover:shadow-md transition-shadow duration-200`}>
          {!isOwnMessage && author && (
            <p className="font-semibold text-xs mb-1">
              {author.first_name} {author.last_name}
            </p>
          )}
          
          {message.type === 'text' && <p className="whitespace-pre-wrap">{message.content}</p>}
          
          {message.type === 'image' && (
            <div>
              {message.content && <p className="mb-2 whitespace-pre-wrap">{message.content}</p>}
              <img 
                src={message.attachment_url}
                alt="Image" 
                className="rounded-md max-h-60 w-auto" 
                loading="lazy"
              />
            </div>
          )}
          
          {message.type === 'gif' && (
            <div>
              {message.content && <p className="mb-2 whitespace-pre-wrap">{message.content}</p>}
              <img 
                src={message.attachment_url}
                alt="GIF" 
                className="rounded-md max-h-60 w-auto" 
                loading="lazy"
              />
            </div>
          )}
          
          {message.type === 'voice' && (
            <div>
              {message.content && <p className="mb-2 whitespace-pre-wrap">{message.content}</p>}
              <audio controls className="w-full">
                <source src={message.attachment_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          
          {message.type === 'file' && (
            <div>
              {message.content && <p className="mb-2 whitespace-pre-wrap">{message.content}</p>}
              <div className="flex items-center space-x-2">
                <Paperclip className="h-4 w-4" />
                <a 
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-blue-600 underline"
                >
                  Download File
                </a>
              </div>
            </div>
          )}
          
          <div className="text-xs mt-1 opacity-70">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Emoji reaction button - Now positioned on corner of message bubble */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-white shadow-sm hover:bg-gray-50 opacity-70 hover:opacity-100"
              >
                <Smile className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3">
              {/* Tab buttons for emoji categories */}
              <div className="flex mb-2 gap-1 justify-between border-b pb-2">
                {EMOJI_CATEGORIES.map((category, index) => (
                  <Button
                    key={index}
                    variant={selectedCategory === index ? "secondary" : "ghost"}
                    className="h-8 px-2 text-xs"
                    onClick={() => setSelectedCategory(index)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
              
              {/* Emoji grid */}
              <div className="grid grid-cols-8 gap-1.5 max-h-[150px] overflow-y-auto py-1">
                {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-lg"
                    onClick={() => onAddReaction(message.id, emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
              
              {/* Frequently used emojis */}
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1.5">Frequently Used</p>
                <div className="flex gap-1 flex-wrap">
                  {commonEmojis.map((item, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onAddReaction(message.id, item.emoji)}
                    >
                      {item.emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Emoji reactions display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex mt-1 ml-1 flex-wrap gap-1">
            {message.reactions.map((reaction, index) => (
              <HoverCard key={`${reaction.emoji}-${index}`}>
                <HoverCardTrigger asChild>
                  <button 
                    className={`flex items-center rounded-full px-2 text-xs ${
                      reaction.user_ids.includes(currentUserId) 
                        ? 'bg-blue-100 border border-blue-300' 
                        : 'bg-gray-100 border border-gray-200'
                    }`}
                    onClick={() => onAddReaction(message.id, reaction.emoji)}
                  >
                    <span className="mr-1">{reaction.emoji}</span>
                    <span>{reaction.user_ids.length}</span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="p-2 w-48">
                  <p className="text-xs font-medium">Reacted with {reaction.emoji}:</p>
                  <p className="text-xs mt-1">{getUserNames(reaction.user_ids)}</p>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        )}
      </div>
      
      {isOwnMessage && (
        <div className="flex-shrink-0 ml-2">
          <Avatar className="h-8 w-8">
            {author?.avatar_url ? (
              <AvatarImage src={author.avatar_url} alt={`${author.first_name} ${author.last_name}`} />
            ) : (
              <AvatarFallback>{getInitials()}</AvatarFallback>
            )}
          </Avatar>
        </div>
      )}
    </div>
  );
};

const TeamChat: React.FC = () => {
  const [content, setContent] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'image' | 'voice' | 'gif' | 'file'>('text');
  const [file, setFile] = useState<File | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  const { data: rooms = [] } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: getChatRooms
  });
  
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);
  
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['teamMessages', selectedRoomId],
    queryFn: () => getMessages(selectedRoomId),
    enabled: !!selectedRoomId,
    refetchInterval: 5000 // Poll every 5 seconds
  });
  
  const { data: teamMembers = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getTeamMembers
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const messageMutation = useMutation({
    mutationFn: async (messageData: Omit<TeamMessage, 'id' | 'created_at' | 'updated_at'> & { room_id: string }) => {
      let attachmentUrl = '';
      if (file && messageType !== 'text') {
        try {
          attachmentUrl = await uploadTeamFile(file, 'messages');
        } catch (error) {
          console.error('Error uploading file:', error);
          toast.error('Failed to upload file. Please try again.');
          throw error;
        }
      }
      
      return await createMessage({
        ...messageData,
        attachment_url: attachmentUrl || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMessages'] });
      setContent('');
      setFile(null);
      setMessageType('text');
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && messageType === 'text') {
      return;
    }
    
    if ((messageType !== 'text') && !file) {
      toast.error('Please select a file');
      return;
    }
    
    if (user && selectedRoomId) {
      messageMutation.mutate({
        content,
        author_id: user.id,
        type: messageType,
        read_by: [user.id],
        room_id: selectedRoomId
      });
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === '@') {
      setShowMentions(true);
      setMentionSearch('');
      const textarea = e.currentTarget;
      setCursorPosition(textarea.selectionStart + 1);
    }
  };
  
  const handleMentionSelect = (member: UserProfile) => {
    const beforeMention = content.slice(0, cursorPosition - 1);
    const afterMention = content.slice(cursorPosition);
    const mentionText = `@${member.first_name} `;
    
    setContent(`${beforeMention}${mentionText}${afterMention}`);
    setShowMentions(false);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = cursorPosition + mentionText.length - 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };
  
  const filteredMembers = teamMembers.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(mentionSearch.toLowerCase())
  );
  
  const reactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error("User not authenticated");
      return await addMessageReaction(messageId, emoji, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMessages'] });
    },
    onError: (error) => {
      toast.error(`Failed to add reaction: ${error.message}`);
    }
  });
  
  const handleAddReaction = (messageId: string, emoji: string) => {
    reactionMutation.mutate({ messageId, emoji });
  };
  
  return (
    <div className="h-full flex overflow-hidden w-full max-w-full">
      <ChatRoomSidebar 
        selectedRoomId={selectedRoomId} 
        onRoomSelect={setSelectedRoomId} 
      />
      <div className="flex-grow overflow-hidden w-full max-w-full">
        <Card className="flex-grow flex flex-col overflow-hidden rounded-xl shadow-lg border-none h-full">
          <CardContent className="p-2 flex-grow flex flex-col overflow-hidden h-full">
            <div 
              className="flex-grow overflow-y-auto p-2 overflow-x-hidden" 
              style={{ 
                scrollBehavior: 'smooth', 
                height: 'calc(100vh - 340px)' 
              }}
            >
              {isLoadingMessages ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start">
                      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse mr-2"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/4"></div>
                        <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isOwnMessage = message.author_id === user?.id;
                    const author = teamMembers.find(m => m.id === message.author_id);
                    
                    return (
                      <Message
                        key={message.id}
                        message={message}
                        isOwnMessage={isOwnMessage}
                        author={author}
                        onAddReaction={handleAddReaction}
                        teamMembers={teamMembers}
                        currentUserId={user?.id || ''}
                      />
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            
            <div className="pt-2 border-t mt-auto">
              <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
                <div className="flex space-x-1 mb-1 overflow-x-auto pb-1 scrollbar-hide">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className={messageType === 'text' ? 'bg-blue-100' : ''}
                    onClick={() => {
                      setMessageType('text');
                      setFile(null);
                    }}
                  >
                    Text
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className={messageType === 'image' ? 'bg-blue-100' : ''}
                    onClick={() => {
                      setMessageType('image');
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = 'image/*';
                      }
                      triggerFileInput();
                    }}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className={messageType === 'voice' ? 'bg-blue-100' : ''}
                    onClick={() => {
                      setMessageType('voice');
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = 'audio/*';
                      }
                      triggerFileInput();
                    }}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className={messageType === 'gif' ? 'bg-blue-100' : ''}
                    onClick={() => {
                      setMessageType('gif');
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = 'image/gif';
                      }
                      triggerFileInput();
                    }}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className={messageType === 'file' ? 'bg-blue-100' : ''}
                    onClick={() => {
                      setMessageType('file');
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = '*/*';
                      }
                      triggerFileInput();
                    }}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder={messageType === 'text' ? "Type your message..." : `Add a caption to your ${messageType}...`}
                    className="min-h-[80px] pr-12"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setCursorPosition(e.target.selectionStart);
                      
                      if (showMentions) {
                        const lastAtPos = e.target.value.lastIndexOf('@', cursorPosition - 1);
                        if (lastAtPos !== -1) {
                          const searchText = e.target.value.slice(lastAtPos + 1, cursorPosition);
                          setMentionSearch(searchText.trim());
                        }
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    onClick={() => setShowMentions(false)}
                  />
                  
                  <Button 
                    type="submit" 
                    size="icon"
                    className="absolute bottom-2 right-2"
                    disabled={messageMutation.isPending || (messageType === 'text' && !content.trim()) || (messageType !== 'text' && !file)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {file && messageType !== 'text' && (
                  <div className="flex items-center space-x-2 bg-blue-100 p-2 rounded">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      ✕
                    </Button>
                  </div>
                )}
                
                {showMentions && (
                  <div className="absolute bottom-[100px] left-0 bg-white rounded-md shadow-lg border p-2 max-h-40 overflow-y-auto w-64">
                    {filteredMembers.length === 0 ? (
                      <div className="p-2 text-gray-500">No matching team members</div>
                    ) : (
                      filteredMembers.map(member => (
                        <div
                          key={member.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                          onClick={() => handleMentionSelect(member)}
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            {member.avatar_url ? (
                              <AvatarImage src={member.avatar_url} alt={`${member.first_name} ${member.last_name}`} />
                            ) : (
                              <AvatarFallback>{`${(member.first_name?.[0] || '').toUpperCase()}${(member.last_name?.[0] || '').toUpperCase()}`}</AvatarFallback>
                            )}
                          </Avatar>
                          <span>{member.first_name} {member.last_name}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamChat;
