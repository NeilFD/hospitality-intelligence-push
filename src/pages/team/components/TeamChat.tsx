import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send, Image, Mic, Smile, Paperclip, AtSign, Heart, ThumbsUp, Laugh, Angry, Frown, PartyPopper, ThumbsDown, Bookmark, MoreVertical, Trash2 } from 'lucide-react';
import { TeamMessage, getMessages, createMessage, markMessageAsRead, uploadTeamFile, getTeamMembers, getChatRooms, addMessageReaction, MessageReaction, deleteMessage } from '@/services/team-service';
import { useAuthStore } from '@/services/auth-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile } from '@/types/supabase-types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ChatRoomSidebar from './ChatRoomSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface MessageProps {
  message: TeamMessage;
  isOwnMessage: boolean;
  author: UserProfile | undefined;
  onAddReaction: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  teamMembers: UserProfile[];
  currentUserId: string;
}

interface TeamChatProps {
  initialRoomId?: string | null;
  compact?: boolean;
}

const EMOJI_CATEGORIES = [{
  name: "Smileys",
  emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "☺️", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "😵‍💫", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐"]
}, {
  name: "Gestures",
  emojis: ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴"]
}, {
  name: "Love",
  emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "💌", "💋", "👨‍❤️‍💋‍👨", "👩‍❤️‍💋‍👩", "👨‍❤️‍👨", "👩‍❤️‍👩"]
}, {
  name: "Celebration",
  emojis: ["🎉", "🎊", "🎂", "🍰", "🧁", "🍾", "🥂", "🥳", "🎈", "🎁", "🎀", "🎐", "🎆", "🎇", "🎃", "🎄", "🎋", "🎍", "🎎", "🎏", "🎑", "🧧", "🎭", "🎪", "🎡", "🎢", "🎨"]
}, {
  name: "Activities",
  emojis: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "����", "🥍", "���", "🪃", "������", "⛳", "🪁", "����", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "����", "⛸️", "🥌", "🎿", "⛷️", "🏂", "���"]
}];

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
  
  const getThemeHighlightColor = () => {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('theme-forest-green')) {
      return 'bg-forest-green/10 text-forest-green font-medium';
    } else if (htmlElement.classList.contains('theme-ocean-blue')) {
      return 'bg-[#1565c0]/10 text-[#1565c0] font-medium';
    } else if (htmlElement.classList.contains('theme-sunset-orange')) {
      return 'bg-[#e65100]/10 text-[#e65100] font-medium';
    } else if (htmlElement.classList.contains('theme-berry-purple')) {
      return 'bg-[#6a1b9a]/10 text-[#6a1b9a] font-medium';
    } else if (htmlElement.classList.contains('theme-dark-mode')) {
      return 'bg-[#333333]/10 text-[#333333] font-medium';
    } else if (htmlElement.classList.contains('theme-hi-purple')) {
      return 'bg-[#7E69AB]/10 text-[#7E69AB] font-medium';
    } else {
      return 'bg-[#7E69AB]/10 text-[#7E69AB] font-medium';
    }
  };
  
  const mentionClass = getThemeHighlightColor();
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    
    if (part.startsWith('all ') || part.startsWith('all\n')) {
      result.push(<span key={`mention-all-${i}`} className={`${mentionClass} rounded px-1`}>@all</span>);
      result.push(part.substring(3));
      continue;
    }
    
    let found = false;
    
    for (const [userId, name] of userMap.entries()) {
      if (part.startsWith(`${userId} `) || part.startsWith(`${userId}\n`)) {
        result.push(<span key={`mention-${userId}-${i}`} className={`${mentionClass} rounded px-1`}>@{name}</span>);
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

const getUserNames = (userIds: string[]): string => {
  if (!userIds || userIds.length === 0) return "No users";
  return userIds.join(", ");
};

const getUserNamesList = (userIds: string[], teamMembers: UserProfile[]): string => {
  if (!userIds || userIds.length === 0) return "No users";
  const names = userIds.map(id => {
    const member = teamMembers.find(member => member.id === id);
    return member ? `${member.first_name} ${member.last_name}`.trim() : "Unknown user";
  }).filter(name => name !== "Unknown user");
  return names.length > 0 ? names.join(", ") : "Unknown users";
};

const Message: React.FC<MessageProps> = ({
  message,
  isOwnMessage,
  author,
  onAddReaction,
  onDeleteMessage,
  teamMembers,
  currentUserId
}) => {
  const messageContainerClass = isOwnMessage ? "flex justify-end mb-4" : "flex justify-start mb-4";
  const [themeColors, setThemeColors] = useState(() => {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('theme-forest-green')) {
      return {
        ownMessageBg: 'bg-forest-green',
        otherMessageBg: 'bg-white',
        otherMessageBorder: 'border border-forest-green'
      };
    } else if (htmlElement.classList.contains('theme-ocean-blue')) {
      return {
        ownMessageBg: 'bg-[#1565c0]',
        otherMessageBg: 'bg-white',
        otherMessageBorder: 'border border-[#1565c0]'
      };
    } else if (htmlElement.classList.contains('theme-sunset-orange')) {
      return {
        ownMessageBg: 'bg-[#e65100]',
        otherMessageBg: 'bg-white',
        otherMessageBorder: 'border border-[#e65100]'
      };
    } else if (htmlElement.classList.contains('theme-berry-purple')) {
      return {
        ownMessageBg: 'bg-[#6a1b9a]',
        otherMessageBg: 'bg-white',
        otherMessageBorder: 'border border-[#6a1b9a]'
      };
    } else if (htmlElement.classList.contains('theme-dark-mode')) {
      return {
        ownMessageBg: 'bg-[#333333]',
        otherMessageBg: 'bg-white',
        otherMessageBorder: 'border border-[#333333]'
      };
    } else if (htmlElement.classList.contains('theme-hi-purple')) {
      return {
        ownMessageBg: 'bg-[#7E69AB]',
        otherMessageBg: 'bg-white',
        otherMessageBorder: 'border border-[#7E69AB]'
      };
    } else {
      return {
        ownMessageBg: 'bg-[#7E69AB]',
        otherMessageBg: 'bg-white',
        otherMessageBorder: 'border border-[#7E69AB]'
      };
    }
  });
  
  useEffect(() => {
    const handleThemeChange = () => {
      const htmlElement = document.documentElement;
      if (htmlElement.classList.contains('theme-forest-green')) {
        setThemeColors({
          ownMessageBg: 'bg-forest-green',
          otherMessageBg: 'bg-white',
          otherMessageBorder: 'border border-forest-green'
        });
      } else if (htmlElement.classList.contains('theme-ocean-blue')) {
        setThemeColors({
          ownMessageBg: 'bg-[#1565c0]',
          otherMessageBg: 'bg-white',
          otherMessageBorder: 'border border-[#1565c0]'
        });
      } else if (htmlElement.classList.contains('theme-sunset-orange')) {
        setThemeColors({
          ownMessageBg: 'bg-[#e65100]',
          otherMessageBg: 'bg-white',
          otherMessageBorder: 'border border-[#e65100]'
        });
      } else if (htmlElement.classList.contains('theme-berry-purple')) {
        setThemeColors({
          ownMessageBg: 'bg-[#6a1b9a]',
          otherMessageBg: 'bg-white',
          otherMessageBorder: 'border border-[#6a1b9a]'
        });
      } else if (htmlElement.classList.contains('theme-dark-mode')) {
        setThemeColors({
          ownMessageBg: 'bg-[#333333]',
          otherMessageBg: 'bg-white',
          otherMessageBorder: 'border border-[#333333]'
        });
      } else if (htmlElement.classList.contains('theme-hi-purple')) {
        setThemeColors({
          ownMessageBg: 'bg-[#7E69AB]',
          otherMessageBg: 'bg-white',
          otherMessageBorder: 'border border-[#7E69AB]'
        });
      } else {
        setThemeColors({
          ownMessageBg: 'bg-[#7E69AB]',
          otherMessageBg: 'bg-white',
          otherMessageBorder: 'border border-[#7E69AB]'
        });
      }
    };
    
    document.addEventListener('themeClassChanged', handleThemeChange);
    return () => {
      document.removeEventListener('themeClassChanged', handleThemeChange);
    };
  }, []);
  
  const messageBubbleClass = isOwnMessage 
    ? `${themeColors.ownMessageBg} text-white rounded-3xl rounded-tr-sm p-3 min-w-[120px] max-w-xs lg:max-w-md text-left pr-10` 
    : `${themeColors.otherMessageBg} ${themeColors.otherMessageBorder} text-gray-800 rounded-3xl rounded-tl-sm p-3 min-w-[120px] max-w-xs lg:max-w-md text-left pr-10`;
  
  const getInitials = () => {
    if (!author) return '?';
    return `${(author.first_name?.[0] || '').toUpperCase()}${(author.last_name?.[0] || '').toUpperCase()}`;
  };
  const [selectedCategory, setSelectedCategory] = useState(0);
  const commonEmojis = [{
    icon: <Heart className="h-4 w-4" />,
    emoji: "❤️"
  }, {
    icon: <ThumbsUp className="h-4 w-4" />,
    emoji: "👍"
  }, {
    icon: <Laugh className="h-4 w-4" />,
    emoji: "😂"
  }, {
    icon: <PartyPopper className="h-4 w-4" />,
    emoji: "🎉"
  }, {
    icon: <ThumbsDown className="h-4 w-4" />,
    emoji: "👎"
  }, {
    icon: <Frown className="h-4 w-4" />,
    emoji: "😢"
  }, {
    icon: <Angry className="h-4 w-4" />,
    emoji: "😡"
  }, {
    icon: <Bookmark className="h-4 w-4" />,
    emoji: "🔖"
  }];
  
  return <div className={messageContainerClass}>
      {!isOwnMessage && <div className="flex-shrink-0 mr-2">
          <Avatar className="h-8 w-8">
            {author?.avatar_url ? <AvatarImage src={author.avatar_url} alt={`${author.first_name} ${author.last_name}`} /> : <AvatarFallback>{getInitials()}</AvatarFallback>}
          </Avatar>
        </div>}
      
      <div className="flex flex-col relative">
        <div className={`${messageBubbleClass} shadow-sm hover:shadow-md transition-shadow duration-200`}>
          {!isOwnMessage && author && <p className="font-semibold text-xs mb-1">
              {author.first_name} {author.last_name}
            </p>}
          
          {message.type === 'text' && <p className="whitespace-pre-wrap">{highlightMentions(message.content, teamMembers)}</p>}
          
          {message.type === 'image' && <div>
              {message.content && <p className="mb-2 whitespace-pre-wrap">{highlightMentions(message.content, teamMembers)}</p>}
              <img src={message.attachment_url} alt="Image" className="rounded-md max-h-60 w-auto" loading="lazy" />
            </div>}
          
          {message.type === 'gif' && <div>
              {message.content && <p className="mb-2 whitespace-pre-wrap">{highlightMentions(message.content, teamMembers)}</p>}
              <img src={message.attachment_url} alt="GIF" className="rounded-md max-h-60 w-auto" loading="lazy" />
            </div>}
          
          {message.type === 'voice' && <div>
              {message.content && <p className="mb-2 whitespace-pre-wrap">{highlightMentions(message.content, teamMembers)}</p>}
              <audio controls className="w-full">
                <source src={message.attachment_url} type="audio/webm" />
                Your browser does not support the audio element.
              </audio>
            </div>}
          
          {message.type === 'file' && <div>
              {message.content && <p className="mb-2 whitespace-pre-wrap">{highlightMentions(message.content, teamMembers)}</p>}
              <div className="flex items-center space-x-2">
                <Paperclip className="h-4 w-4" />
                <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Download File
                </a>
              </div>
            </div>}
          
          <div className="text-xs mt-1 opacity-70">
            {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-white shadow-sm hover:bg-gray-50 opacity-70 hover:opacity-100">
                <Smile className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align={isOwnMessage ? "end" : "start"} side="top" sideOffset={5} alignOffset={isOwnMessage ? -40 : 40}>
              <div className="flex mb-2 gap-1 justify-between border-b pb-2 overflow-x-auto scrollbar-hide">
                {EMOJI_CATEGORIES.map((category, index) => <Button key={index} variant={selectedCategory === index ? "secondary" : "ghost"} className="h-7 px-2 text-xs min-w-max flex-shrink-0" onClick={() => setSelectedCategory(index)}>
                    {category.name}
                  </Button>)}
              </div>
              
              <div className="grid grid-cols-8 gap-1.5 max-h-[150px] overflow-y-auto py-1">
                {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji, index) => <Button key={index} variant="ghost" size="sm" className="h-7 w-7 p-0 text-lg" onClick={() => onAddReaction(message.id, emoji)}>
                    {emoji}
                  </Button>)}
              </div>
              
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1.5">Frequently Used</p>
                <div className="flex gap-1 flex-wrap">
                  {commonEmojis.map((item, index) => <Button key={index} variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onAddReaction(message.id, item.emoji)}>
                      {item.emoji}
                    </Button>)}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {isOwnMessage && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full hover:bg-blue-600 opacity-70 hover:opacity-100 p-0">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600 cursor-pointer flex items-center gap-2 hover:bg-red-50" 
                  onClick={() => onDeleteMessage(message.id)}
                >
                  <Trash2 className="h-5 w-5 text-white mr-2" strokeWidth={2.5} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>}
        </div>

        {message.reactions && message.reactions.length > 0 && <div className="flex mt-1 ml-1 flex-wrap gap-1">
            {message.reactions.map((reaction, index) => <HoverCard key={`${reaction.emoji}-${index}`}>
                <HoverCardTrigger asChild>
                  <button className={`flex items-center rounded-full px-2 text-xs ${reaction.user_ids.includes(currentUserId) ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100 border border-gray-200'}`} onClick={() => onAddReaction(message.id, reaction.emoji)}>
                    <span className="mr-1">{reaction.emoji}</span>
                    <span>{reaction.user_ids.length}</span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="p-2 w-48">
                  <p className="text-xs font-medium">Reacted with {reaction.emoji}:</p>
                  <p className="text-xs mt-1">
                    {getUserNamesList(reaction.user_ids, teamMembers)}
                  </p>
                </HoverCardContent>
              </HoverCard>)}
          </div>}
      </div>
      
      {isOwnMessage && <div className="flex-shrink-0 ml-2">
          <Avatar className="h-8 w-8">
            {author?.avatar_url ? <AvatarImage src={author.avatar_url} alt={`${author.first_name} ${author.last_name}`} /> : <AvatarFallback>{getInitials()}</AvatarFallback>}
          </Avatar>
        </div>}
    </div>;
};

const TeamChat: React.FC<TeamChatProps> = ({ initialRoomId, compact }) => {
  const [messageText, setMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionSelector, setShowMentionSelector] = useState(false);
  const [mentionStart, setMentionStart] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMessageAreaReady, setIsMessageAreaReady] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  
  const {
    data: rooms = [],
    isLoading: isLoadingRooms
  } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: getChatRooms
  });
  
  useEffect(() => {
    if (initialRoomId && !selectedRoomId) {
      console.log('Setting initial room ID:', initialRoomId);
      setSelectedRoomId(initialRoomId);
    } else if (!selectedRoomId && rooms.length > 0) {
      console.log('No selected room, setting first room:', rooms[0].id);
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, initialRoomId, selectedRoomId]);
  
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
    error: messagesError
  } = useQuery({
    queryKey: ['teamMessages', selectedRoomId],
    queryFn: () => {
      if (!selectedRoomId) {
        console.log('No selected room ID, skipping message fetch');
        return Promise.resolve([]);
      }
      console.log('Fetching messages for room ID:', selectedRoomId);
      return getMessages(selectedRoomId);
    },
    enabled: !!selectedRoomId,
    retry: 1,
    staleTime: 5000,
    refetchInterval: 10000,
    meta: {
      onSettled: () => {
        setTimeout(() => {
          setIsMessageAreaReady(true);
          setShouldScrollToBottom(true);
        }, 100);
      }
    }
  });
  
  useEffect(() => {
    if (selectedRoomId) {
      setIsMessageAreaReady(false);
      setShouldScrollToBottom(true);
      refetchMessages();
    }
  }, [selectedRoomId, refetchMessages]);
  
  const {
    data: teamMembers = []
  } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getTeamMembers
  });
  
  const createMessageMutation = useMutation({
    mutationFn: createMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teamMessages', selectedRoomId]
      });
    }
  });
  
  const addReactionMutation = useMutation({
    mutationFn: async ({
      messageId,
      emoji
    }: {
      messageId: string;
      emoji: string;
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      console.log(`Adding reaction ${emoji} to message ${messageId} by user ${user.id}`);
      await addMessageReaction(messageId, user.id, emoji);
      return { success: true };
    },
    onSuccess: () => {
      console.log('Successfully added reaction, invalidating queries');
      queryClient.invalidateQueries({
        queryKey: ['teamMessages', selectedRoomId]
      });
    },
    onError: (error) => {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  });
  
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teamMessages', selectedRoomId]
      });
      toast.success("Message deleted");
    },
    onError: error => {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  });
  
  const scrollToBottom = () => {
    if (!scrollContainerRef.current || !shouldScrollToBottom) return;
    
    try {
      const scrollContainer = scrollContainerRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      setShouldScrollToBottom(false);
    } catch (error) {
      console.error("Error scrolling to bottom:", error);
    }
  };
  
  useEffect(() => {
    if (messages.length > 0 && isMessageAreaReady && shouldScrollToBottom) {
      scrollToBottom();
      
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [messages, isMessageAreaReady, shouldScrollToBottom]);
  
  useEffect(() => {
    const handleResize = () => {
      if (isMessageAreaReady) {
        setShouldScrollToBottom(true);
        scrollToBottom();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMessageAreaReady]);
  
  const findMessageAuthor = (authorId: string) => {
    return teamMembers.find(member => member.id === authorId);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageText(value);
    const lastAtSymbol = value.lastIndexOf('@');
    if (lastAtSymbol >= 0) {
      const afterAt = value.substring(lastAtSymbol + 1);
      if (lastAtSymbol === value.length - 1 || /^\s*$/.test(afterAt) || /^[a-zA-Z0-9\s]*$/.test(afterAt)) {
        setMentionStart(lastAtSymbol);
        setMentionQuery(afterAt.trim().toLowerCase());
        setShowMentionSelector(true);
        return;
      }
    }
    setShowMentionSelector(false);
  };
  
  const insertMention = (userId: string, displayName: string) => {
    if (textareaRef.current) {
      const before = messageText.substring(0, mentionStart);
      const after = messageText.substring(mentionStart + mentionQuery.length + 1);
      
      const newText = `${before}@${displayName} ${after}`;
      setMessageText(newText);
      
      textareaRef.current.focus();
      setShowMentionSelector(false);
      
      const mentionsMap = new Map(Object.entries(textareaRef.current.dataset.mentions || '{}'));
      mentionsMap.set(displayName, userId);
      textareaRef.current.dataset.mentions = JSON.stringify(Object.fromEntries(mentionsMap));
    }
  };
  
  const insertAllMention = () => {
    if (textareaRef.current) {
      const before = messageText.substring(0, mentionStart);
      const after = messageText.substring(mentionStart + mentionQuery.length + 1);
      const newText = `${before}@all ${after}`;
      setMessageText(newText);
      textareaRef.current.focus();
      setShowMentionSelector(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !selectedRoomId) return;
    
    try {
      setIsSubmitting(true);
      
      const mentionedUserIds: string[] = [];
      const mentionAll = messageText.includes('@all');
      
      let mentionsMap = {};
      if (textareaRef.current?.dataset.mentions) {
        try {
          mentionsMap = JSON.parse(textareaRef.current.dataset.mentions);
        } catch (e) {
          console.error('Error parsing mentions map:', e);
        }
      }
      
      teamMembers.forEach(member => {
        const fullName = `${member.first_name} ${member.last_name}`.trim();
        if (messageText.includes(`@${fullName}`)) {
          mentionedUserIds.push(member.id);
        }
      });
      
      for (const [displayName, userId] of Object.entries(mentionsMap)) {
        if (messageText.includes(`@${displayName}`) && !mentionedUserIds.includes(userId as string)) {
          mentionedUserIds.push(userId as string);
        }
      }
      
      if (mentionAll) {
        teamMembers.forEach(member => {
          if (!mentionedUserIds.includes(member.id)) {
            mentionedUserIds.push(member.id);
          }
        });
      }
      
      await createMessageMutation.mutateAsync({
        content: messageText,
        author_id: user.id,
        type: 'text',
        room_id: selectedRoomId,
        read_by: [user.id],
        mentioned_users: mentionedUserIds.length > 0 ? mentionedUserIds : undefined
      });
      
      setMessageText('');
      
      if (textareaRef.current) {
        textareaRef.current.dataset.mentions = '{}';
      }
      
      toast.success('Message sent');
      
      setShouldScrollToBottom(true);
      
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!user) return;
    
    console.log(`Handling reaction: ${emoji} for message ${messageId}`);
    
    addReactionMutation.mutate({
      messageId,
      emoji
    });
  };
  
  const handleDeleteMessage = (messageId: string) => {
    if (!user) return;
    deleteMessageMutation.mutate(messageId);
  };
  
  const handleRoomSelect = (roomId: string) => {
    console.log('Room clicked:', roomId, 'Previous selected:', selectedRoomId);
    if (roomId !== selectedRoomId) {
      console.log('Changing selected room from', selectedRoomId, 'to', roomId);
      setSelectedRoomId(roomId);
      setShouldScrollToBottom(true);
      queryClient.invalidateQueries({
        queryKey: ['teamMessages', roomId]
      });
    }
  };
  
  const handleImageUpload = () => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file && user && selectedRoomId) {
          try {
            setIsSubmitting(true);
            toast.loading('Uploading image...');
            const attachmentUrl = await uploadTeamFile(file, 'messages');
            await createMessageMutation.mutateAsync({
              content: messageText,
              author_id: user.id,
              type: 'image',
              attachment_url: attachmentUrl,
              room_id: selectedRoomId,
              read_by: [user.id],
              mentioned_users: []
            });
            setMessageText('');
            toast.dismiss();
            toast.success('Image sent');
          } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
          } finally {
            setIsSubmitting(false);
          }
        }
      };
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } else {
      fileInputRef.current.click();
    }
  };
  
  const handleVoiceRecording = async () => {
    if (isRecording) {
      if (voiceRecorderRef.current) {
        voiceRecorderRef.current.stop();
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorder.ondataavailable = e => {
          if (e.data.size > 0) {
            chunks.push(e.data);
            setAudioChunks([...chunks]);
          }
        };
        recorder.onstop = async () => {
          setIsRecording(false);
          const audioBlob = new Blob(audioChunks, {
            type: 'audio/webm'
          });
          const audioFile = new File([audioBlob], 'voice-message.webm', {
            type: 'audio/webm'
          });
          if (user && selectedRoomId) {
            try {
              setIsSubmitting(true);
              toast.loading('Uploading voice message...');
              const attachmentUrl = await uploadTeamFile(audioFile, 'messages');
              await createMessageMutation.mutateAsync({
                content: messageText,
                author_id: user.id,
                type: 'voice',
                attachment_url: attachmentUrl,
                room_id: selectedRoomId,
                read_by: [user.id],
                mentioned_users: []
              });
              setMessageText('');
              setAudioChunks([]);
              toast.dismiss();
              toast.success('Voice message sent');
            } catch (error) {
              console.error('Error uploading voice message:', error);
              toast.error('Failed to upload voice message');
            } finally {
              setIsSubmitting(false);
            }
          }
          stream.getTracks().forEach(track => track.stop());
        };
        voiceRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
        toast.info('Recording voice message... Click again to stop.');
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast.error('Could not access microphone');
      }
    }
  };
  
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && user && selectedRoomId) {
        try {
          setIsSubmitting(true);
          toast.loading('Uploading file...');
          const attachmentUrl = await uploadTeamFile(file, 'messages');
          await createMessageMutation.mutateAsync({
            content: messageText || `File: ${file.name}`,
            author_id: user.id,
            type: 'file',
            attachment_url: attachmentUrl,
            room_id: selectedRoomId,
            read_by: [user.id],
            mentioned_users: []
          });
          setMessageText('');
          toast.dismiss();
          toast.success('File sent');
        } catch (error) {
          console.error('Error uploading file:', error);
          toast.error('Failed to upload file');
        } finally {
          setIsSubmitting(false);
        }
      }
    };
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };
  
  const renderMentionSelector = () => {
    if (!showMentionSelector) return null;
    
    const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];
    const filteredMembers = safeTeamMembers.filter(member => {
      if (!member || typeof member !== 'object') return false;
      const firstName = member.first_name || '';
      const lastName = member.last_name || '';
      const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
      return mentionQuery === '' || fullName.includes(mentionQuery.toLowerCase());
    });
    
    return (
      <div className="absolute bottom-[calc(100%)] left-3 w-64 bg-white shadow-lg rounded-lg z-10 border overflow-hidden">
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Search people..." value={mentionQuery} onValueChange={setMentionQuery} />
          <CommandList>
            <CommandEmpty className="text-gray-600">No users found</CommandEmpty>
            <CommandGroup>
              <CommandItem 
                key="mention-all" 
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-100 text-gray-800" 
                onSelect={insertAllMention}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800">
                  <AtSign className="w-4 h-4" />
                </div>
                <span className="font-medium">everyone</span>
              </CommandItem>
              
              {filteredMembers.map(member => (
                <CommandItem 
                  key={member.id}
                  onSelect={() => insertMention(member.id, `${member.first_name || ''} ${member.last_name || ''}`.trim())}
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-100 text-gray-800"
                >
                  <Avatar className="h-8 w-8">
                    {member.avatar_url ? (
                      <AvatarImage src={member.avatar_url} alt={member.first_name || 'User'} />
                    ) : (
                      <AvatarFallback>
                        {member.first_name?.[0] || ''}{member.last_name?.[0] || ''}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span>{member.first_name || ''} {member.last_name || ''}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    );
  };

  const componentClasses = compact 
    ? "flex h-full overflow-hidden" 
    : "flex h-[calc(100vh-120px)] overflow-hidden";
  
  const mainChatClasses = compact
    ? "flex-1 flex flex-col bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden"
    : "flex-1 flex flex-col bg-white/10 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden";
  
  const chatContentClasses = compact
    ? "flex-1 p-2 overflow-y-auto"
    : "flex-1 p-4 overflow-y-auto";
  
  const inputAreaClasses = compact
    ? "p-2 border-t"
    : "p-3 border-t";
  
  const renderMessages = () => {
    if (isLoadingMessages) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500">Loading messages...</p>
        </div>
      );
    }
    
    if (messagesError) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-red-500">Error loading messages. Please try again.</p>
        </div>
      );
    }
    
    if (!messages || messages.length === 0) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500">No messages yet. Start the conversation!</p>
        </div>
      );
    }
    
    try {
      const safeMessages = Array.isArray(messages) 
        ? messages.filter(msg => msg && typeof msg === 'object' && !msg.deleted)
        : [];
        
      if (safeMessages.length === 0) {
        return (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No messages to display.</p>
          </div>
        );
      }
      
      return (
        <>
          {safeMessages.map(message => (
            <Message 
              key={message.id} 
              message={message} 
              isOwnMessage={message.author_id === user?.id} 
              author={findMessageAuthor(message.author_id)} 
              onAddReaction={(messageId, emoji) => handleAddReaction(messageId, emoji)} 
              onDeleteMessage={handleDeleteMessage} 
              teamMembers={teamMembers || []} 
              currentUserId={user?.id || ''} 
            />
          ))}
          <div ref={messagesEndRef} className="h-1 w-full" />
        </>
      );
    } catch (error) {
      console.error("Error rendering messages:", error);
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-red-500">Something went wrong displaying messages.</p>
        </div>
      );
    }
  };

  return (
    <div className={componentClasses}>
      <ChatRoomSidebar selectedRoomId={selectedRoomId} onRoomSelect={handleRoomSelect} />
      
      <div className={mainChatClasses}>
        <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-none">
          <CardContent className="p-0 flex flex-col h-full">
            {!compact && (
              <div className="bg-white/10 backdrop-blur-sm p-3 border-b border-white/30 flex items-center justify-between h-[52px]">
                {selectedRoomId && rooms.length > 0 && (
                  <h2 className="text-lg font-semibold text-tavern-blue-dark pl-2 mx-0 py-px my-0">
                    {rooms.find(room => room.id === selectedRoomId)?.name || 'Chat Room'}
                  </h2>
                )}
              </div>
            )}
            
            <div 
              ref={scrollContainerRef}
              className={chatContentClasses} 
              style={{maxHeight: compact ? '320px' : undefined}}
              onScroll={(e) => {
                const element = e.target as HTMLDivElement;
                const isScrolledToBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 10;
                if (!isScrolledToBottom) {
                  setShouldScrollToBottom(false);
                }
              }}
            >
              {renderMessages()}
            </div>
            
            <div className={`relative ${inputAreaClasses}`}>
              {renderMentionSelector()}
              
              <div className="flex items-end gap-2">
                <Textarea 
                  placeholder="Type a message... Use @ to mention users or @all for everyone" 
                  value={messageText} 
                  onChange={handleInputChange} 
                  ref={textareaRef} 
                  className="min-h-[60px] max-h-[120px] resize-none" 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    } else if (e.key === 'Escape' && showMentionSelector) {
                      e.preventDefault();
                      setShowMentionSelector(false);
                    }
                  }} 
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isSubmitting || !messageText.trim()} 
                  size="icon" 
                  className="h-10 w-10 rounded-full"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              
              {!compact && (
                <div className="flex justify-between w-full gap-1 mt-2">
                  <Button variant="ghost" size="icon" className="flex-1 text-gray-500 hover:text-gray-700" title="Add image" onClick={handleImageUpload}>
                    <Image className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className={`flex-1 text-gray-500 hover:text-gray-700 ${isRecording ? 'bg-red-100' : ''}`} title={isRecording ? "Stop recording" : "Record voice"} onClick={handleVoiceRecording}>
                    <Mic className={`h-5 w-5 ${isRecording ? 'text-red-500' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="flex-1 text-gray-500 hover:text-gray-700" title="Attach file" onClick={handleFileUpload}>
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="flex-1 text-gray-500 hover:text-gray-700" title="Mention" onClick={() => {
                    if (textareaRef.current) {
                      const cursorPosition = textareaRef.current.selectionStart;
                      const textBefore = messageText.substring(0, cursorPosition);
                      const textAfter = messageText.substring(cursorPosition);
                      const newText = `${textBefore}@${textAfter}`;
                      setMessageText(newText);
                      setMentionStart(cursorPosition);
                      setMentionQuery('');
                      setShowMentionSelector(true);
                      textareaRef.current.focus();
                      setTimeout(() => {
                        if (textareaRef.current) {
                          textareaRef.current.selectionStart = cursorPosition + 1;
                          textareaRef.current.selectionEnd = cursorPosition + 1;
                        }
                      }, 0);
                    }
                  }}>
                    <AtSign className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={async e => {
          const file = e.target.files?.[0];
          if (file && user && selectedRoomId) {
            try {
              setIsSubmitting(true);
              toast.loading('Uploading image...');
              const attachmentUrl = await uploadTeamFile(file, 'messages');
              await createMessageMutation.mutateAsync({
                content: messageText,
                author_id: user.id,
                type: 'image',
                attachment_url: attachmentUrl,
                room_id: selectedRoomId,
                read_by: [user.id],
                mentioned_users: []
              });
              setMessageText('');
              toast.dismiss();
              toast.success('Image sent');
            } catch (error) {
              console.error('Error uploading image:', error);
              toast.error('Failed to upload image');
            } finally {
              setIsSubmitting(false);
            }
          }
        }} 
      />
    </div>
  );
};

export default TeamChat;
