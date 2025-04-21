import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PaperclipIcon, SendIcon, SmileIcon, UserPlusIcon, ImageIcon, ChevronLeftIcon, ChevronRightIcon, XIcon, AtSign } from 'lucide-react';
import { useAuthStore } from '@/services/auth-service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatRooms, getChatMessages, sendChatMessage, uploadChatAttachment } from '@/services/team-service';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn, formatDistance } from '@/lib/utils';
import ChatRoomSidebar from './ChatRoomSidebar';
import TeamPoll from './TeamPoll';
import { createChatPoll } from '@/services/team-service';
import CreatePollForm from './CreatePollForm';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserProfile } from '@/types/supabase-types';
import { v4 as uuidv4 } from 'uuid';
import { EmojiPicker } from '@/components/ui/emoji-picker';

interface TeamChatProps {
  initialRoomId?: string;
  compact?: boolean;
  className?: string;
  initialSidebarMinimized?: boolean;
}

const TeamChat: React.FC<TeamChatProps> = ({ 
  initialRoomId, 
  compact = false, 
  className,
  initialSidebarMinimized = false
}) => {
  const [sidebarMinimized, setSidebarMinimized] = useState(initialSidebarMinimized);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId || null);
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [isCreatePollDialogOpen, setIsCreatePollDialogOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [mentions, setMentions] = useState<UserProfile[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [isMentionPopoverOpen, setIsMentionPopoverOpen] = useState(false);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isSmall = useMediaQuery('(max-width: 640px)');

  const { data: rooms = [], isLoading: isLoadingRooms, error: roomsError } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: getChatRooms,
    staleTime: 60000, // 1 minute
    retry: false,
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

  const { data: messages = [], isLoading: isLoadingMessages, error: messagesError, refetch: refetchMessages } = useQuery({
    queryKey: ['teamMessages', selectedRoomId],
    queryFn: () => getChatMessages(selectedRoomId || ''),
    enabled: !!selectedRoomId,
    staleTime: 10000, // 10 seconds
    retry: false,
    meta: {
      onSuccess: (data: any) => {
        console.log('Successfully fetched messages:', data);
      },
      onError: (error: Error) => {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      }
    }
  });

  const { mutate: sendMessage, isLoading: isSendingMessage } = useMutation(sendChatMessage, {
    onSuccess: () => {
      setMessageText('');
      setAttachment(null);
      queryClient.invalidateQueries({ queryKey: ['teamMessages', selectedRoomId] });
      refetchMessages();
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  });

  const { mutate: uploadAttachment, isLoading: isUploadingAttachment } = useMutation(uploadChatAttachment, {
    onSuccess: () => {
      setAttachment(null);
      queryClient.invalidateQueries({ queryKey: ['teamMessages', selectedRoomId] });
      refetchMessages();
    },
    onError: (error: any) => {
      console.error('Error uploading attachment:', error);
      toast.error('Failed to upload attachment');
    }
  });

  const { mutate: createPoll, isLoading: isCreatingPoll } = useMutation(createChatPoll, {
    onSuccess: () => {
      setPollQuestion('');
      setPollOptions(['', '']);
      setIsCreatePollDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['teamMessages', selectedRoomId] });
      refetchMessages();
    },
    onError: (error: any) => {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
    }
  });

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (compact) {
      setSidebarMinimized(true);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRoomId) {
      toast.error('Please select a chat room');
      return;
    }

    if (attachment) {
      const attachmentId = uuidv4();
      const formData = new FormData();
      formData.append('file', attachment);
      formData.append('roomId', selectedRoomId);
      formData.append('attachmentId', attachmentId);

      uploadAttachment(formData);
    } else if (messageText.trim()) {
      sendMessage({
        roomId: selectedRoomId,
        text: messageText,
        mentionedUsers: mentions.map(m => m.id)
      });
      setMentions([]);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prevText => prevText + emoji);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setAttachment(file);
      setIsAttachmentDialogOpen(false);
    }
  };

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleRemovePollOption = (index: number) => {
    const newOptions = [...pollOptions];
    newOptions.splice(index, 1);
    setPollOptions(newOptions);
  };

  const handleCreatePoll = () => {
    if (!selectedRoomId) {
      toast.error('Please select a chat room');
      return;
    }

    if (!pollQuestion.trim()) {
      toast.error('Please enter a poll question');
      return;
    }

    if (pollOptions.some(option => !option.trim())) {
      toast.error('Please fill in all poll options');
      return;
    }

    createPoll({
      roomId: selectedRoomId,
      question: pollQuestion,
      options: pollOptions
    });
  };

  const handleMentionSearch = async (query: string) => {
    setMentionQuery(query);
    if (query.length > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('first_name', `%${query}%`)
        .limit(5);

      if (error) {
        console.error('Error fetching mentions:', error);
        toast.error('Failed to load mentions');
      } else {
        setMentions(data || []);
      }
    } else {
      setMentions([]);
    }
  };

  const handleMentionSelect = (user: UserProfile) => {
    setMessageText(prevText => prevText + `@${user.first_name}`);
    setMentions([]);
    setIsMentionPopoverOpen(false);
  };

  useEffect(() => {
    if (selectedRoomId && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, selectedRoomId]);

  useEffect(() => {
    if (initialRoomId) {
      setSelectedRoomId(initialRoomId);
    }
  }, [initialRoomId]);

  return (
    <div className={cn("flex h-full border-t", className)}>
      <div 
        className={cn(
          "border-r transition-all duration-300 bg-white",
          sidebarMinimized 
            ? "w-0 overflow-hidden" 
            : compact 
              ? "w-full absolute z-10 h-full left-0 top-0 shadow-lg" 
              : "w-64"
        )}
      >
        <ChatRoomSidebar
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onRoomSelect={handleRoomSelect}
          isLoading={isLoadingRooms}
          error={roomsError}
          compact={compact}
          sidebarMinimized={sidebarMinimized}
          setSidebarMinimized={setSidebarMinimized}
        />
      </div>

      <div className="flex-1 flex flex-col h-full">
        {selectedRoomId ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {rooms.find(room => room.id === selectedRoomId)?.name || 'Chat Room'}
              </h2>
              {compact && (
                <Button variant="ghost" size="icon" onClick={() => setSidebarMinimized(false)}>
                  <ChevronLeftIcon className="h-5 w-5" />
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {isLoadingMessages ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messagesError ? (
                  <div className="text-center text-red-500">Error loading messages</div>
                ) : (
                  messages.map((message, index) => (
                    <div key={message.id} className="flex items-start gap-2">
                      <Avatar className="h-8 w-8">
                        {message.author?.avatar_url ? (
                          <AvatarImage src={message.author.avatar_url} alt={message.author.first_name || 'User'} />
                        ) : (
                          <AvatarFallback>{message.author?.first_name?.[0] || '?'}{message.author?.last_name?.[0] || ''}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="flex items-baseline space-x-2">
                          <span className="font-semibold">{message.author?.first_name || 'Unknown'}</span>
                          <span className="text-xs text-gray-500">{formatDistance(new Date(message.created_at), new Date(), { addSuffix: true })}</span>
                        </div>
                        {message.attachment_url ? (
                          <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                            View Attachment
                          </a>
                        ) : (
                          <p className="break-words">{message.text}</p>
                        )}
                        {message.poll && (
                          <TeamPoll poll={message.poll} messageId={message.id} />
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={lastMessageRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}>
                        <SmileIcon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Add Emoji
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsAttachmentDialogOpen(true)}>
                        <PaperclipIcon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Add Attachment
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsCreatePollDialogOpen(true)}>
                        <UserPlusIcon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Create Poll
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Popover open={isMentionPopoverOpen} onOpenChange={setIsMentionPopoverOpen}>
                  <PopoverTrigger asChild>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <AtSign className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Mention User
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <Input
                      placeholder="Search users..."
                      value={mentionQuery}
                      onChange={(e) => handleMentionSearch(e.target.value)}
                    />
                    <ScrollArea className="max-h-40 mt-2">
                      {mentions.length > 0 ? (
                        mentions.map((user) => (
                          <Button
                            key={user.id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => handleMentionSelect(user)}
                          >
                            {user.first_name} {user.last_name}
                          </Button>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No users found.</p>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="relative mt-2">
                <Input
                  as="textarea"
                  rows={1}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="pr-10 resize-none"
                  onFocus={() => setIsMentionPopoverOpen(false)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 bottom-1"
                  onClick={handleSendMessage}
                  disabled={isSendingMessage}
                >
                  {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat room to start messaging
          </div>
        )}
      </div>

      <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="hidden">
            <SmileIcon className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </PopoverContent>
      </Popover>

      <Dialog open={isAttachmentDialogOpen} onOpenChange={setIsAttachmentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Attachment</DialogTitle>
          </DialogHeader>
          <input
            type="file"
            accept="image/*, application/pdf, application/msword, application/vnd.ms-excel, application/vnd.ms-powerpoint, text/plain"
            onChange={handleFileSelect}
            className="hidden"
            ref={fileInputRef}
            id="attachment-input"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Select File
          </Button>
          {attachment && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">{attachment.name}</p>
              <Button variant="ghost" size="icon" onClick={() => setAttachment(null)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatePollDialogOpen} onOpenChange={setIsCreatePollDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Poll</DialogTitle>
          </DialogHeader>
          <CreatePollForm
            pollQuestion={pollQuestion}
            setPollQuestion={setPollQuestion}
            pollOptions={pollOptions}
            handlePollOptionChange={handlePollOptionChange}
            handleRemovePollOption={handleRemovePollOption}
            handleAddPollOption={handleAddPollOption}
            handleCreatePoll={handleCreatePoll}
            isCreatingPoll={isCreatingPoll}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamChat;
