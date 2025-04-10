import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PlusCircle, Pin, Trash2, Image, Mic, Smile, Tag } from 'lucide-react';
import { TeamNote, getNotes, createNote, updateNote, deleteNote, uploadTeamFile, getTeamMembers } from '@/services/team-service';
import { useAuthStore } from '@/services/auth-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface StickyNoteProps {
  note: TeamNote;
  onUpdate: (id: string, updates: Partial<TeamNote>) => void;
  onDelete: (id: string) => void;
  authorName?: string;
}

const NOTE_COLORS = ['bg-yellow-100 hover:bg-yellow-200', 'bg-pink-100 hover:bg-pink-200', 'bg-blue-100 hover:bg-blue-200', 'bg-green-100 hover:bg-green-200', 'bg-purple-100 hover:bg-purple-200', 'bg-orange-100 hover:bg-orange-200'];

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onUpdate,
  onDelete,
  authorName
}) => {
  return <div className={`${note.color || NOTE_COLORS[0]} rounded-lg p-4 shadow-md transform transition-all duration-200 hover:scale-105 hover:shadow-lg relative min-h-[200px] max-w-[250px] flex flex-col`}>
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
        {note.type === 'image' && <div>
            <p className="font-['Special_Elite'] text-gray-800 mb-2">{note.content}</p>
            <img src={note.attachment_url} alt="Note attachment" className="rounded-md w-full h-auto" />
          </div>}
        {note.type === 'gif' && <div>
            <p className="font-['Special_Elite'] text-gray-800 mb-2">{note.content}</p>
            <img src={note.attachment_url} alt="GIF" className="rounded-md w-full h-auto" />
          </div>}
        {note.type === 'voice' && <div>
            <p className="font-['Special_Elite'] text-gray-800 mb-2">{note.content}</p>
            <audio controls className="w-full mt-2">
              <source src={note.attachment_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>}
      </div>
      
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>{new Date(note.created_at).toLocaleDateString()}</span>
        {authorName && <span className="italic">- {authorName}</span>}
      </div>
    </div>;
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
  const queryClient = useQueryClient();
  
  const {
    data: notes = [],
    isLoading
  } = useQuery({
    queryKey: ['teamNotes'],
    queryFn: getNotes
  });
  
  const {
    data: teamMembers = []
  } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getTeamMembers
  });
  
  const userNameMap = Object.fromEntries(
    teamMembers.map(member => [member.id, member.first_name])
  );
  
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
  
  return <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Team Noticeboard</h2>
          <p className="text-gray-500">Share notes and updates with your team</p>
        </div>
        
        <Popover open={showCreateForm} onOpenChange={setShowCreateForm}>
          <PopoverTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <CreateNoteForm onClose={() => setShowCreateForm(false)} />
          </PopoverContent>
        </Popover>
      </div>
      
      {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-[200px] w-full"></div>)}
        </div> : <>
          {sortedNotes.length === 0 ? <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No notes yet. Create the first one!</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Note
              </Button>
            </div> : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedNotes.map(note => (
                <StickyNote 
                  key={note.id} 
                  note={note} 
                  onUpdate={handleUpdate} 
                  onDelete={handleDelete}
                  authorName={userNameMap[note.author_id]} 
                />
              ))}
            </div>}
        </>}
    </div>;
};

export default TeamNoticeboard;
