
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PlusCircle, Pin, Trash2, Image, Mic, Smile, BarChart2, MessageSquare } from 'lucide-react';
import { TeamNote, getNotes, createNote, updateNote, deleteNote, uploadTeamFile, getTeamMembers, getPolls, createNoteReply, getNoteReplies, deleteNoteReply } from '@/services/team-service';
import { useAuthStore } from '@/services/auth-service';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TeamPollCard from './TeamPoll';
import CreatePollForm from './CreatePollForm';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StickyNoteProps {
  note: TeamNote;
  onUpdate: (id: string, updates: Partial<TeamNote>) => void;
  onDelete: (id: string) => void;
  authorName?: string;
}

const NOTE_COLORS = ['bg-yellow-100/70 hover:bg-yellow-200/80 backdrop-blur-sm border border-yellow-200/50', 'bg-pink-100/70 hover:bg-pink-200/80 backdrop-blur-sm border border-pink-200/50', 'bg-blue-100/70 hover:bg-blue-200/80 backdrop-blur-sm border border-blue-200/50', 'bg-green-100/70 hover:bg-green-200/80 backdrop-blur-sm border border-green-200/50', 'bg-purple-100/70 hover:bg-purple-200/80 backdrop-blur-sm border border-purple-200/50', 'bg-orange-100/70 hover:bg-orange-200/80 backdrop-blur-sm border border-orange-200/50'];

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onUpdate,
  onDelete,
  authorName
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ['noteReplies', note.id],
    queryFn: () => getNoteReplies(note.id),
    enabled: showReplies
  });
  
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getTeamMembers
  });
  
  const userNameMap = Object.fromEntries(teamMembers.map(member => [member.id, `${member.first_name} ${member.last_name || ''}`]));
  
  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Must be logged in to reply');
      return await createNoteReply({
        content,
        note_id: note.id,
        author_id: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['noteReplies', note.id] });
      setReplyContent('');
      toast.success('Reply added');
    },
    onError: (error) => {
      toast.error(`Failed to add reply: ${error.message}`);
    }
  });
  
  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      return await deleteNoteReply(replyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['noteReplies', note.id] });
      toast.success('Reply deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete reply: ${error.message}`);
    }
  });
  
  const handleAddReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    replyMutation.mutate(replyContent);
  };
  
  const handleDeleteReply = (replyId: string) => {
    deleteReplyMutation.mutate(replyId);
  };
  
  const glassStyle = "bg-opacity-60 backdrop-filter backdrop-blur-sm shadow-lg border border-opacity-30";
  
  return (
    <div className={`${note.color || NOTE_COLORS[0]} ${glassStyle} rounded-lg p-4 transform transition-all duration-200 hover:scale-105 hover:shadow-lg relative min-h-[200px] max-w-[250px] flex flex-col`}>
      <div className="flex justify-between items-start mb-2">
        <Button variant="ghost" size="icon" className={`h-6 w-6 ${note.pinned ? 'text-amber-600' : 'text-gray-400'}`} onClick={() => onUpdate(note.id, {
          pinned: !note.pinned
        })}>
          <Pin size={16} />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={() => onDelete(note.id)}>
          <Trash2 size={16} />
        </Button>
      </div>
      
      <div className="flex-grow">
        {note.type === 'text' && <p className="font-['Special_Elite'] text-gray-800 whitespace-pre-wrap">{note.content}</p>}
        {note.type === 'image' && <div className="flex flex-col space-y-2">
            <p className="font-['Special_Elite'] text-gray-800 mb-2">{note.content}</p>
            {note.attachment_url && <img src={note.attachment_url} alt="Note attachment" className="rounded-md w-full h-auto object-cover" onError={e => {
          console.error("Image failed to load:", note.attachment_url);
          (e.target as HTMLImageElement).src = '/placeholder.svg';
        }} />}
          </div>}
        {note.type === 'gif' && <div className="flex flex-col space-y-2">
            <p className="font-['Special_Elite'] text-gray-800 mb-2">{note.content}</p>
            {note.attachment_url && <img src={note.attachment_url} alt="GIF" className="rounded-md w-full h-auto" onError={e => {
          console.error("GIF failed to load:", note.attachment_url);
          (e.target as HTMLImageElement).src = '/placeholder.svg';
        }} />}
          </div>}
        {note.type === 'voice' && <div className="flex flex-col space-y-2">
            <p className="font-['Special_Elite'] text-gray-800 mb-2">{note.content}</p>
            {note.attachment_url && <audio controls className="w-full mt-2">
                <source src={note.attachment_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>}
          </div>}
      </div>
      
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>{new Date(note.created_at).toLocaleDateString()}</span>
        {authorName && <span className="italic">- {authorName}</span>}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-200/30">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs w-full flex items-center justify-center gap-1 text-gray-600"
          onClick={() => setShowReplies(!showReplies)}
        >
          <MessageSquare size={14} />
          {showReplies ? 'Hide Replies' : 'Show Replies'} 
          {replies.length > 0 && !showReplies && <span className="text-xs bg-gray-200/80 px-1.5 rounded-full">{replies.length}</span>}
        </Button>
        
        {showReplies && (
          <div className="mt-2 space-y-2">
            {repliesLoading ? (
              <div className="text-center text-xs text-gray-500">Loading replies...</div>
            ) : replies.length === 0 ? (
              <div className="text-center text-xs text-gray-500">No replies yet</div>
            ) : (
              <ScrollArea className="max-h-32">
                {replies.map(reply => (
                  <div key={reply.id} className="bg-white/40 rounded p-2 mb-2 text-sm">
                    <div className="flex justify-between items-start">
                      <p className="text-gray-800 text-xs">{reply.content}</p>
                      {user && user.id === reply.author_id && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
                          onClick={() => handleDeleteReply(reply.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500">
                      <span>{userNameMap[reply.author_id] || 'Unknown'}</span>
                      <span>{new Date(reply.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            )}
            
            <form onSubmit={handleAddReply} className="mt-2 space-y-2">
              <Textarea 
                placeholder="Add a reply..." 
                value={replyContent} 
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[40px] text-xs resize-none text-gray-900"
              />
              <Button 
                type="submit" 
                size="sm" 
                className="w-full text-xs"
                disabled={replyMutation.isPending}
              >
                {replyMutation.isPending ? 'Adding...' : 'Add Reply'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const CreateNoteForm: React.FC<{
  onClose: () => void;
}> = ({
  onClose
}) => {
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<'text' | 'image' | 'voice' | 'gif'>('text');
  const [file, setFile] = useState<File | null>(null);
  const [colorIndex, setColorIndex] = useState(0);
  const {
    user
  } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const noteMutation = useMutation({
    mutationFn: async (noteData: Omit<TeamNote, 'id' | 'created_at' | 'updated_at'>) => {
      let attachmentUrl = '';
      if (file && noteType !== 'text') {
        attachmentUrl = await uploadTeamFile(file, 'notes');
      }
      return await createNote({
        ...noteData,
        attachment_url: attachmentUrl || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teamNotes']
      });
      toast.success('Note created successfully');
      onClose();
    },
    onError: error => {
      toast.error(`Failed to create note: ${error.message}`);
    }
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please enter note content');
      return;
    }
    if ((noteType === 'image' || noteType === 'voice' || noteType === 'gif') && !file) {
      toast.error('Please select a file');
      return;
    }
    if (user) {
      noteMutation.mutate({
        content,
        author_id: user.id,
        pinned: false,
        type: noteType,
        color: NOTE_COLORS[colorIndex]
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
  return <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-2 mb-4">
        <Button type="button" variant={noteType === 'text' ? 'default' : 'outline'} size="sm" onClick={() => setNoteType('text')}>
          Text
        </Button>
        <Button type="button" variant={noteType === 'image' ? 'default' : 'outline'} size="sm" onClick={() => setNoteType('image')}>
          <Image className="h-4 w-4 mr-1" />
          Image
        </Button>
        <Button type="button" variant={noteType === 'voice' ? 'default' : 'outline'} size="sm" onClick={() => setNoteType('voice')}>
          <Mic className="h-4 w-4 mr-1" />
          Voice
        </Button>
        <Button type="button" variant={noteType === 'gif' ? 'default' : 'outline'} size="sm" onClick={() => setNoteType('gif')}>
          <Smile className="h-4 w-4 mr-1" />
          GIF
        </Button>
      </div>
      
      <Textarea placeholder="What's on your mind?" value={content} onChange={e => setContent(e.target.value)} className="min-h-[100px] font-['Special_Elite']" />
      
      {(noteType === 'image' || noteType === 'voice' || noteType === 'gif') && <>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={noteType === 'image' || noteType === 'gif' ? 'image/*' : 'audio/*'} className="hidden" />
          <div className="flex flex-col space-y-2">
            <Button type="button" onClick={triggerFileInput} variant="outline" className="w-full">
              {file ? file.name : `Select ${noteType === 'voice' ? 'audio' : 'file'}`}
            </Button>
          </div>
        </>}
      
      <div>
        <p className="text-sm mb-2">Note color:</p>
        <div className="flex space-x-2">
          {NOTE_COLORS.map((color, index) => <button key={color} type="button" className={`w-6 h-6 rounded-full ${color} ${index === colorIndex ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} onClick={() => setColorIndex(index)} />)}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={noteMutation.isPending}>
          {noteMutation.isPending ? "Creating..." : "Post Note"}
        </Button>
      </div>
    </form>;
};

const TeamNoticeboard: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');
  const queryClient = useQueryClient();
  const {
    data: notes = [],
    isLoading: notesLoading
  } = useQuery({
    queryKey: ['teamNotes'],
    queryFn: getNotes
  });
  const {
    data: polls = [],
    isLoading: pollsLoading
  } = useQuery({
    queryKey: ['teamPolls'],
    queryFn: getPolls
  });
  const {
    data: teamMembers = []
  } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getTeamMembers
  });
  const userNameMap = Object.fromEntries(teamMembers.map(member => [member.id, member.first_name]));
  const updateNoteMutation = useMutation({
    mutationFn: ({
      id,
      updates
    }: {
      id: string;
      updates: Partial<TeamNote>;
    }) => updateNote(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teamNotes']
      });
      toast.success('Note updated');
    },
    onError: error => {
      toast.error(`Failed to update note: ${error.message}`);
    }
  });
  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teamNotes']
      });
      toast.success('Note deleted');
    },
    onError: error => {
      toast.error(`Failed to delete note: ${error.message}`);
    }
  });
  const handleUpdate = (id: string, updates: Partial<TeamNote>) => {
    updateNoteMutation.mutate({
      id,
      updates
    });
  };
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(id);
    }
  };
  const sortedNotes = [...(notes || [])].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return <ScrollArea className="h-[calc(100vh-200px)] w-full pr-4">
      <div className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Team Noticeboard</h2>
              <TabsList className="mt-2">
                <TabsTrigger value="notes" className="text-slate-900">Notes</TabsTrigger>
                <TabsTrigger value="polls" className="text-slate-900">Polls</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex space-x-2">
              <Popover open={showCreatePoll && activeTab === 'polls'} onOpenChange={open => setShowCreatePoll(open)}>
                <PopoverTrigger asChild>
                  <Button variant={activeTab === 'polls' ? 'default' : 'outline'} onClick={() => {
                  if (activeTab !== 'polls') {
                    setActiveTab('polls');
                    setTimeout(() => setShowCreatePoll(true), 100);
                  } else {
                    setShowCreatePoll(true);
                  }
                }}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    New Poll
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="end">
                  <CreatePollForm onClose={() => setShowCreatePoll(false)} />
                </PopoverContent>
              </Popover>
              
              <Popover open={showCreateForm && activeTab === 'notes'} onOpenChange={open => setShowCreateForm(open)}>
                <PopoverTrigger asChild>
                  <Button variant={activeTab === 'notes' ? 'default' : 'outline'} onClick={() => {
                  if (activeTab !== 'notes') {
                    setActiveTab('notes');
                    setTimeout(() => setShowCreateForm(true), 100);
                  } else {
                    setShowCreateForm(true);
                  }
                }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Note
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="end">
                  <CreateNoteForm onClose={() => setShowCreateForm(false)} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <TabsContent value="notes">
            {notesLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-100/50 backdrop-blur-sm animate-pulse rounded-lg h-[200px] w-full border border-gray-200/50"></div>)}
              </div> : <>
                {sortedNotes.length === 0 ? <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No notes yet. Create the first one!</p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Note
                    </Button>
                  </div> : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {sortedNotes.map(note => <StickyNote key={note.id} note={note} onUpdate={handleUpdate} onDelete={handleDelete} authorName={userNameMap[note.author_id]} />)}
                  </div>}
              </>}
          </TabsContent>
          
          <TabsContent value="polls">
            {pollsLoading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => <div key={i} className="bg-gray-100/50 backdrop-blur-sm animate-pulse rounded-lg h-[250px] w-full border border-gray-200/50"></div>)}
              </div> : <>
                {polls.length === 0 ? <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No polls yet. Create the first one!</p>
                    <Button onClick={() => setShowCreatePoll(true)}>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      New Poll
                    </Button>
                  </div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {polls.map(poll => <TeamPollCard key={poll.id} poll={poll} authorName={userNameMap[poll.author_id]} />)}
                  </div>}
              </>}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>;
};

export default TeamNoticeboard;
