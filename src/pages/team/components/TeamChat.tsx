import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendMessage, getTeamMembers, getChatRooms, updateMessageReaction } from '@/services/team-service';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/services/auth-service';
import { toast } from 'sonner';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { AtSign, Paperclip, Mic, Image as ImageIcon, Send, Smile, Calendar, ChevronDown, Hash, Pin, Clock, CheckCircle2, Pencil, X, Heart, ThumbsUp, Fire, Party, Frown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatRoomSidebar from './ChatRoomSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { ChatRoom } from '@/services/team-service';
import ReactDOMServer from 'react-dom/server';

interface Message {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  room_id: string;
  attachments?: {
    type: 'image' | 'file' | 'audio';
    url: string;
    name?: string;
    size?: number;
    duration?: number;
  }[];
  mentioned_users?: string[];
  read_by?: string[];
  reactions?: {
    emoji: string;
    users: string[];
  }[];
  is_pinned?: boolean;
  is_announcement?: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  email?: string;
}

const InfoIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const MessageReactions = ({ 
  message, 
  onReactionClick 
}: { 
  message: Message, 
  onReactionClick: (messageId: string, emoji: string) => void 
}) => {
  const { user } = useAuthStore();
  
  if (!message.reactions || message.reactions.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {message.reactions.map((reaction, index) => {
        const hasReacted = reaction.users.includes(user?.id || '');
        return (
          <Button
            key={`${message.id}-${reaction.emoji}-${index}`}
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 rounded-full px-2 text-xs",
              hasReacted ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            onClick={() => onReactionClick(message.id, reaction.emoji)}
          >
            {reaction.emoji} {reaction.users.length}
          </Button>
        );
      })}
    </div>
  );
};

const MessageAttachments = ({ attachments }: { attachments: Message['attachments'] }) => {
  if (!attachments || attachments.length === 0) return null;
  
  return (
    <div className="space-y-2 mt-2">
      {attachments.map((attachment, index) => {
        if (attachment.type === 'image') {
          return (
            <div key={index} className="relative rounded-lg overflow-hidden">
              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                <img 
                  src={attachment.url} 
                  alt="Attachment" 
                  className="max-h-60 rounded-lg object-cover"
                />
              </a>
            </div>
          );
        } else if (attachment.type === 'file') {
          return (
            <div key={index} className="bg-gray-100 rounded-lg p-3 flex items-center space-x-3">
              <Paperclip className="h-4 w-4 text-gray-500" />
              <div className="flex-1 min-w-0">
                <a 
                  href={attachment.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm font-medium truncate block"
                >
                  {attachment.name || 'Attachment'}
                </a>
                {attachment.size && (
                  <p className="text-xs text-gray-500">
                    {Math.round(attachment.size / 1024)} KB
                  </p>
                )}
              </div>
            </div>
          );
        } else if (attachment.type === 'audio') {
          return (
            <div key={index} className="bg-gray-100 rounded-lg p-3">
              <audio controls className="w-full">
                <source src={attachment.url} />
                Your browser does not support the audio element.
              </audio>
              {attachment.duration && (
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {Math.floor(attachment.duration / 60)}:{(attachment.duration % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

const MessageOptions = ({ 
  message, 
  onPinMessage, 
  onDeleteMessage, 
  onReactionSelect 
}: { 
  message: Message, 
  onPinMessage: (messageId: string, isPinned: boolean) => void,
  onDeleteMessage: (messageId: string) => void,
  onReactionSelect: (messageId: string, emoji: string) => void
}) => {
  const { user } = useAuthStore();
  const isAuthor = message.author_id === user?.id;
  
  const quickReactions = ['👍', '❤️', '🔥', '🎉', '😢'];
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        <div className="flex justify-center space-x-1 p-1 border-b">
          {quickReactions.map(emoji => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              onClick={() => onReactionSelect(message.id, emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs h-8"
          onClick={() => onPinMessage(message.id, !message.is_pinned)}
        >
          <Pin className="h-3 w-3 mr-2" />
          {message.is_pinned ? 'Unpin message' : 'Pin message'}
        </Button>
        
        {isAuthor && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDeleteMessage(message.id)}
          >
            <X className="h-3 w-3 mr-2" />
            Delete message
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
};

interface TeamChatProps {
  initialRoomId?: string | null;
  initialMessage?: string;
  compact?: boolean;
  initialMinimizeSidebar?: boolean;
  showControls?: boolean;
}

export default function TeamChat({
  initialRoomId = null,
  initialMessage = '',
  compact = false,
  initialMinimizeSidebar = false,
  showControls = true
}: TeamChatProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId);
  const [messageText, setMessageText] = useState(initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minimizeSidebar, setMinimizeSidebar] = useState(initialMinimizeSidebar);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottomRef = useRef(true);
  
  const { data: messages = [], isLoading: isLoadingMessages, error: messagesError } = useQuery({
    queryKey: ['teamMessages', selectedRoomId],
    queryFn: () => selectedRoomId ? getMessages(selectedRoomId) : Promise.resolve([]),
    enabled: !!selectedRoomId,
    staleTime: 10000, // 10 seconds
  });
  
  const { data: teamMembers = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getTeamMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: getChatRooms,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMessages', selectedRoomId] });
      setMessageText('');
      setIsSubmitting(false);
      shouldScrollToBottomRef.current = true;
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsSubmitting(false);
    }
  });
  
  const pinMessageMutation = useMutation({
    mutationFn: async ({ messageId, isPinned }: { messageId: string, isPinned: boolean }) => {
      const { error } = await supabase
        .from('team_messages')
        .update({ is_pinned: isPinned })
        .eq('id', messageId);
      
      if (error) throw error;
      return { messageId, isPinned };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teamMessages', selectedRoomId] });
      toast.success(data.isPinned ? 'Message pinned' : 'Message unpinned');
    },
    onError: (error) => {
      console.error('Error pinning/unpinning message:', error);
      toast.error('Failed to pin/unpin message');
    }
  });
  
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('team_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      return messageId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMessages', selectedRoomId] });
      toast.success('Message deleted');
    },
    onError: (error) => {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  });
  
  const reactionMutation = useMutation({
    mutationFn: updateMessageReaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMessages', selectedRoomId] });
    },
    onError: (error) => {
      console.error('Error updating reaction:', error);
      toast.error('Failed to update reaction');
    }
  });
  
  useEffect(() => {
    if (initialRoomId) {
      setSelectedRoomId(initialRoomId);
    } else if (rooms && rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [initialRoomId, rooms, selectedRoomId]);
  
  useEffect(() => {
    if (rooms && selectedRoomId) {
      const room = rooms.find(r => r.id === selectedRoomId);
      if (room) {
        setCurrentRoom(room);
      }
    }
  }, [rooms, selectedRoomId]);
  
  useEffect(() => {
    if (selectedRoomId) {
      const channel = supabase
        .channel(`room-${selectedRoomId}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'team_messages',
            filter: `room_id=eq.${selectedRoomId}`
          },
          (payload) => {
            console.log('New message received:', payload);
            queryClient.invalidateQueries({ queryKey: ['teamMessages', selectedRoomId] });
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedRoomId, queryClient]);
  
  useEffect(() => {
    if (shouldScrollToBottomRef.current && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
      shouldScrollToBottomRef.current = false;
    }
  }, [messages]);
  
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    shouldScrollToBottomRef.current = true;
    setPage(1);
    setHasMoreMessages(true);
  };
  
  const handleSendClick = async () => {
    if ((!messageText.trim() && !audioBlob && !isFileUploading && !isImageUploading) || !selectedRoomId || !user) return;
    
    setIsSubmitting(true);
    
    try {
      let attachments = [];
      
      if (audioBlob) {
        setIsAudioUploading(true);
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        const { data: audioData, error: audioError } = await supabase.storage
          .from('chat-attachments')
          .upload(`audio/${Date.now()}-${audioFile.name}`, audioFile);
        
        if (audioError) throw audioError;
        
        const audioUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-attachments/${audioData.path}`;
        attachments.push({
          type: 'audio',
          url: audioUrl,
          duration: recordingDuration
        });
        
        setAudioBlob(null);
        setIsAudioUploading(false);
      }
      
      await sendMessageMutation.mutateAsync({
        content: messageText,
        roomId: selectedRoomId,
        attachments
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
      setIsAudioUploading(false);
      setIsFileUploading(false);
      setIsImageUploading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };
  
  const handleMentionClick = () => {
    setMessageText(prev => prev + '@');
  };
  
  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoomId || !user) return;
    
    setIsFileUploading(true);
    
    try {
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(`files/${Date.now()}-${file.name}`, file);
      
      if (error) throw error;
      
      const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-attachments/${data.path}`;
      
      await sendMessageMutation.mutateAsync({
        content: messageText || 'Shared a file',
        roomId: selectedRoomId,
        attachments: [{
          type: 'file',
          url: fileUrl,
          name: file.name,
          size: file.size
        }]
      });
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsFileUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleImageClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoomId || !user) return;
    
    setIsImageUploading(true);
    
    try {
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(`images/${Date.now()}-${file.name}`, file);
      
      if (error) throw error;
      
      const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-attachments/${data.path}`;
      
      await sendMessageMutation.mutateAsync({
        content: messageText || 'Shared an image',
        roomId: selectedRoomId,
        attachments: [{
          type: 'image',
          url: imageUrl,
          name: file.name,
          size: file.size
        }]
      });
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsImageUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };
  
  const handleVoiceClick = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  };
  
  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
  };
  
  const handleReactionClick = (messageId: string, emoji: string) => {
    if (!user) return;
    
    reactionMutation.mutate({
      messageId,
      emoji,
      userId: user.id
    });
  };
  
  const handleScroll = useCallback(() => {
    if (isLoadingMore || !hasMoreMessages || !scrollContainerRef.current) return;
    
    const scrollContainer = scrollContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;
    
    const { scrollTop } = scrollContainer;
    
    if (scrollTop === 0) {
      loadMoreMessages();
    }
  }, [isLoadingMore, hasMoreMessages]);
  
  const loadMoreMessages = async () => {
    if (!selectedRoomId || isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    
    try {
      const nextPage = page + 1;
      const olderMessages = await getMessages(selectedRoomId, nextPage);
      
      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
      } else {
        setPage(nextPage);
        queryClient.setQueryData(['teamMessages', selectedRoomId], (oldData: Message[] = []) => {
          return [...oldData, ...olderMessages];
        });
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Failed to load more messages');
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  };
  
  const renderMessageContent = (content: string) => {
    // Replace URLs with clickable links
    let formattedContent = content.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
    );
    
    // Replace @mentions with styled spans
    teamMembers.forEach(member => {
      const mentionRegex = new RegExp(`@${member.name}`, 'g');
      formattedContent = formattedContent.replace(
        mentionRegex,
        `<span class="bg-blue-100 text-blue-800 px-1 rounded">@${member.name}</span>`
      );
    });
    
    return { __html: formattedContent };
  };
  
  return (
    <>
      <ChatRoomSidebar
        selectedRoomId={selectedRoomId}
        onRoomSelect={handleRoomSelect}
        minimized={minimizeSidebar}
        setMinimized={setMinimizeSidebar}
      />
    
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/80">
        <div className="border-b border-gray-100 p-3 bg-white/50 backdrop-blur-sm flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-gray-800">
              {currentRoom?.name || 'Chat'}
            </h2>
            {currentRoom?.description && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 rounded-full p-0">
                    <InfoIcon className="h-3 w-3 text-gray-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 text-sm">
                  <p>{currentRoom.description}</p>
                </PopoverContent>
              </Popover>
            )}
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Room Options</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                >
                  <Calendar className="h-3 w-3 mr-2" />
                  View Calendar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                >
                  <Pin className="h-3 w-3 mr-2" />
                  Pinned Messages
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <ScrollArea 
          className="flex-1 p-4" 
          ref={scrollContainerRef} 
          onScroll={handleScroll}
        >
          {isLoadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin h-6 w-6 border-2 border-gray-500 border-t-transparent rounded-full" />
            </div>
          ) : messagesError ? (
            <div className="flex justify-center items-center h-full text-red-500">
              Error loading messages
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-gray-500">
              <MessageSquare className="h-12 w-12 mb-2 text-gray-300" />
              <p>No messages yet</p>
              <p className="text-sm">Be the first to send a message!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoadingMore && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full" />
                </div>
              )}
              
              {!hasMoreMessages && messages.length > 10 && (
                <div className="text-center text-xs text-gray-500 py-2">
                  You've reached the beginning of this conversation
                </div>
              )}
              
              {messages.map((message, index) => {
                const isLastMessage = index === messages.length - 1;
                const showDate = index === 0 || new Date(messages[index - 1].created_at).toDateString() !== new Date(message.created_at).toDateString();
                
                return (
                  <React.Fragment key={message.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {format(new Date(message.created_at), 'EEEE, MMMM d, yyyy')}
                        </div>
                      </div>
                    )}
                    
                    <div 
                      className={cn("group flex gap-3", message.is_announcement && "bg-amber-50 p-3 rounded-lg")}
                      ref={isLastMessage ? lastMessageRef : undefined}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {message.author_avatar ? (
                          <AvatarImage src={message.author_avatar} alt={message.author_name} />
                        ) : (
                          <AvatarFallback className="bg-gray-200 text-gray-700">
                            {message.author_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{message.author_name}</span>
                          <span className="text-xs text-gray-500">{formatMessageDate(message.created_at)}</span>
                          
                          {message.is_pinned && (
                            <Pin className="h-3 w-3 text-amber-500" />
                          )}
                          
                          <MessageOptions 
                            message={message} 
                            onPinMessage={(messageId, isPinned) => pinMessageMutation.mutate({ messageId, isPinned })}
                            onDeleteMessage={(messageId) => deleteMessageMutation.mutate(messageId)}
                            onReactionSelect={handleReactionClick}
                          />
                        </div>
                        
                        <div 
                          className="text-gray-800 break-words"
                          dangerouslySetInnerHTML={renderMessageContent(message.content)}
                        />
                        
                        <MessageAttachments attachments={message.attachments} />
                        
                        <MessageReactions 
                          message={message} 
                          onReactionClick={handleReactionClick} 
                        />
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t border-gray-100 p-3 bg-white/80 backdrop-blur-sm">
          {isRecording ? (
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-100 rounded-lg p-3 flex items-center space-x-3">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                <p className="text-gray-500 flex-1">Recording... {recordingDuration}s</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50"
                  onClick={stopRecording}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-green-500 hover:bg-green-50"
                  onClick={stopRecording}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-end space-x-2">
              <div className="flex-1 bg-gray-100 rounded-lg flex flex-col">
                <Textarea
                  placeholder="Type a message..."
                  className="min-h-10 max-h-32 border-none bg-transparent resize-none flex-1"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {showControls && (
                  <div className="flex items-center justify-between px-3 py-1">
                    <div className="flex space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50"
                        onClick={handleMentionClick}
                      >
                        <AtSign className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50"
                        onClick={handleFileClick}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50"
                        onClick={handleVoiceClick}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50"
                        onClick={handleImageClick}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-yellow-500 hover:bg-yellow-50"
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="p-0 w-auto border-none shadow-xl">
                        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              
              <Button
                type="button"
                className={cn(
                  "rounded-full h-10 w-10 p-0 flex items-center justify-center transition-all",
                  messageText.trim() ? "bg-gradient-to-r from-hi-purple to-emerald-500" : "bg-gray-200 text-gray-400"
                )}
                onClick={handleSendClick}
                disabled={isSubmitting || (!messageText.trim() && !isAudioUploading && !isFileUploading && !isImageUploading)}
              >
                {isSubmitting ? (
                  <RefreshCw className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Send className="h-5 w-5 text-white" />
                )}
              </Button>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="*/*" 
            onChange={handleFileChange} 
          />
          
          <input 
            type="file" 
            ref={imageInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageChange} 
          />
        </div>
      </div>
    </>
  );
}
