import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/services/auth-service';
import { 
  fetchTeamRoom, 
  fetchTeamMessages, 
  createTeamMessage, 
  updateTeamMessage, 
  deleteTeamMessage,
  TeamMessage
} from '@/services/team-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Loader2, Edit, Trash2, X } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { MentionsInput, Mention } from 'react-mentions';
import { 
  Popover, 
  PopoverTrigger, 
  PopoverContent 
} from "@/components/ui/popover"
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const TeamChat = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const { user, profile } = useAuthStore();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const { data: room, refetch: refetchRoom } = useQuery({
    queryKey: ['teamRoom', roomId],
    queryFn: () => fetchTeamRoom(roomId),
    enabled: !!roomId,
  });
  
  const { data: initialMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['teamMessages', roomId],
    queryFn: () => fetchTeamMessages(roomId),
    enabled: !!roomId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);
  
  useEffect(() => {
    if (roomId) {
      const channel = supabase
        .channel(`public:team_messages:room_id=eq.${roomId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'team_messages' },
          (payload) => {
            if (payload.errors) {
              console.error('Error in Realtime channel:', payload.errors);
            } else {
              console.log('Realtime payload:', payload);
              
              if (payload.new) {
                if (payload.new.room_id === roomId) {
                  if (payload.event === 'INSERT') {
                    setMessages((prevMessages) => [...prevMessages, payload.new as TeamMessage]);
                  } else if (payload.event === 'UPDATE') {
                    setMessages((prevMessages) =>
                      prevMessages.map((msg) =>
                        msg.id === payload.new.id ? (payload.new as TeamMessage) : msg
                      )
                    );
                  } else if (payload.event === 'DELETE') {
                    setMessages((prevMessages) =>
                      prevMessages.filter((msg) => msg.id !== payload.old?.id)
                    );
                  }
                }
              }
              
              refetchMessages();
            }
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [roomId, refetchMessages]);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages]);
  
  const { mutate: addMessage } = useMutation(createTeamMessage, {
    onSuccess: () => {
      setInput('');
      setFile(null);
      setUploading(false);
      setMentionedUsers([]);
      queryClient.invalidateQueries({ queryKey: ['teamMessages', roomId] });
      refetchMessages();
    },
    onError: (error) => {
      console.error("Error creating message:", error);
      toast.error("Failed to send message");
      setUploading(false);
    },
  });
  
  const { mutate: changeMessage } = useMutation(updateTeamMessage, {
    onSuccess: () => {
      setIsEditMode(false);
      setEditMessageId(null);
      setEditMessageContent('');
      queryClient.invalidateQueries({ queryKey: ['teamMessages', roomId] });
      refetchMessages();
    },
    onError: (error) => {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    },
  });
  
  const { mutate: removeMessage } = useMutation(deleteTeamMessage, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMessages', roomId] });
      refetchMessages();
    },
    onError: (error) => {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
  };
  
  const handleSend = async () => {
    if (!input.trim() && !file) return;
    if (!roomId || !user || !profile) return;
    
    let fileUrl: string | null = null;
    
    if (file) {
      try {
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const filePath = `${roomId}/${user.id}-${uuidv4()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('team-chat-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          console.error('Error uploading file:', error);
          toast.error('Failed to upload file');
          setUploading(false);
          return;
        }
        
        fileUrl = supabase.storage
          .from('team-chat-files')
          .getPublicUrl(filePath).data.publicUrl;
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Failed to upload file');
        setUploading(false);
        return;
      }
    }
    
    const messageData = {
      room_id: roomId,
      author_id: user.id,
      content: input.trim(),
      file_url: fileUrl,
      mentioned_users: mentionedUsers,
    };
    
    addMessage(messageData);
  };
  
  const handleEdit = (message: TeamMessage) => {
    setIsEditMode(true);
    setEditMessageId(message.id);
    setEditMessageContent(message.content);
  };
  
  const handleUpdate = () => {
    if (!editMessageId) return;
    
    changeMessage({
      id: editMessageId,
      content: editMessageContent,
    });
  };
  
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditMessageId(null);
    setEditMessageContent('');
  };
  
  const handleDelete = (messageId: string) => {
    removeMessage(messageId);
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };
  
  const handleMention = (id: string) => {
    if (!mentionedUsers.includes(id)) {
      setMentionedUsers([...mentionedUsers, id]);
    }
  };
  
  const renderSuggestion = (
    suggestion: any,
    search: string,
    highlightedDisplay: React.ReactNode,
    index: number,
    focused: boolean
  ) => (
    <div className={`suggestion ${focused ? 'focused' : ''}`} key={`${suggestion.__id}-${index}`}>
      {highlightedDisplay}
    </div>
  );
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="border-b px-4 py-2 bg-gray-50">
        <h2 className="text-lg font-semibold">{room?.name || 'Team Chat'}</h2>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start gap-2">
              <Avatar className="h-8 w-8">
                {message.author?.avatar_url ? (
                  <AvatarImage src={message.author.avatar_url} alt={message.author.first_name} />
                ) : (
                  <AvatarFallback>{message.author?.first_name?.[0]}{message.author?.last_name?.[0]}</AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{message.author?.first_name} {message.author?.last_name}</span>
                  <span className="text-xs text-gray-500">{new Date(message.created_at).toLocaleString()}</span>
                </div>
                
                <div className="relative">
                  {isEditMode && editMessageId === message.id ? (
                    <Textarea
                      value={editMessageContent}
                      onChange={(e) => setEditMessageContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdate();
                        }
                      }}
                      className="w-full rounded-md border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm break-words whitespace-pre-line">{message.content}</p>
                  )}
                  
                  {message.file_url && (
                    <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                      View Attachment
                    </a>
                  )}
                  
                  {user?.id === message.author_id && (
                    <div className="absolute top-0 right-0 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      {isEditMode && editMessageId === message.id ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={handleUpdate}>
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(message)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(message.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" disabled={uploading}>
                <Paperclip className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <Label htmlFor="picture">Add an attachment</Label>
              <Input type="file" id="picture" accept="image/*, application/pdf" onChange={handleFileChange} disabled={uploading} />
              {uploading && (
                <div className="flex items-center justify-center mt-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </PopoverContent>
          </Popover>
          <MentionsInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 rounded-md border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            style={{
              control: {
                fontSize: '14px',
                fontWeight: '400',
              },
              input: {
                padding: '0.75rem',
              },
              suggestions: {
                list: {
                  backgroundColor: 'white',
                  border: '1px solid rgba(0,0,0,0.15)',
                  fontSize: '14px',
                },
                item: {
                  padding: '5px 15px',
                  borderBottom: '1px solid rgba(0,0,0,0.15)',
                  '&:hover': {
                    backgroundColor: '#EEE',
                  },
                },
              },
            }}
          >
            <Mention
              trigger="@"
              data={(search: string) => {
                return new Promise((resolve) => {
                  supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .ilike('first_name', `%${search}%`)
                    .limit(5)
                    .then((res) => {
                      if (res.data) {
                        const profiles = res.data.map((profile) => ({
                          id: profile.id,
                          display: `${profile.first_name} ${profile.last_name}`,
                        }));
                        resolve(profiles);
                      } else {
                        resolve([]);
                      }
                    });
                });
              }}
              onAdd={(id: string) => handleMention(id)}
              renderSuggestion={renderSuggestion}
              style={{
                backgroundColor: '#edf5ff',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            />
          </MentionsInput>
          <Button onClick={handleSend} disabled={uploading}>
            <Send className="h-4 w-4 mr-2" /> Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
