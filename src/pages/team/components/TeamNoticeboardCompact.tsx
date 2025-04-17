
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clipboard, AlertCircle, Pin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface NoticeboardProps {
  pinnedOnly?: boolean;
  compact?: boolean;
}

const TeamNoticeboardCompact: React.FC<NoticeboardProps> = ({ pinnedOnly = false, compact = false }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        
        // Build the query
        let query = supabase
          .from('team_notes')
          .select(`
            *,
            profiles:author_id(id, first_name, last_name, avatar_url, role)
          `)
          .order('created_at', { ascending: false });
        
        // Filter for pinned notes only if requested
        if (pinnedOnly) {
          query = query.eq('pinned', true);
        }
        
        // Limit the number of notes if in compact mode
        if (compact) {
          query = query.limit(5);
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        console.log('Fetched notes data:', data);
        setNotes(data || []);
      } catch (err: any) {
        console.error('Error fetching notes:', err);
        setError(err.message || 'Failed to load noticeboard');
        toast.error('Failed to load noticeboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
    
    // Set up real-time subscription for notes
    const notesSubscription = supabase
      .channel('team_notes_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'team_notes' 
      }, payload => {
        console.log('Real-time update received:', payload);
        fetchNotes();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(notesSubscription);
    };
  }, [pinnedOnly, compact]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-amber-300 border-t-amber-600 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-800 flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <p>{error}</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 italic">
        {pinnedOnly 
          ? "No pinned notes found" 
          : "No noticeboard items yet. Be the first to post something!"}
      </div>
    );
  }

  return (
    <div className={`space-y-${compact ? '2' : '4'}`}>
      {notes.map((note) => (
        <Card 
          key={note.id} 
          className={`relative border ${note.color ? `border-${note.color}-200` : 'border-amber-100'} bg-white shadow-sm hover:shadow-md transition-shadow`}
        >
          {note.pinned && (
            <div className="absolute top-2 right-2">
              <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />
            </div>
          )}
          <CardContent className={compact ? "p-3" : "p-4"}>
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                {note.profiles?.avatar_url ? (
                  <AvatarImage src={note.profiles.avatar_url} alt={note.profiles.first_name} />
                ) : (
                  <AvatarFallback className="bg-amber-100 text-amber-800">
                    {note.profiles?.first_name?.[0] || ''}{note.profiles?.last_name?.[0] || ''}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-gray-900 truncate">
                    {note.profiles?.first_name} {note.profiles?.last_name}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className={`${compact ? 'text-sm' : 'text-base'} text-gray-700 mt-1`}>
                  {note.content}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TeamNoticeboardCompact;
