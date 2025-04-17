
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clipboard, AlertCircle, Utensils, Beer, ChefHat, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import RecipeCardExpanded from './RecipeCardExpanded';

interface NoticeboardProps {
  pinnedOnly?: boolean;
  compact?: boolean;
}

const TeamNoticeboardCompact: React.FC<NoticeboardProps> = ({ pinnedOnly = false, compact = false }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);

  const fetchNotesAndRecipes = async () => {
    try {
      setLoading(true);
      console.log('Fetching notes and recipes with pinnedOnly:', pinnedOnly);
      
      // Build the query for team notes
      let noteQuery = supabase
        .from('team_notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter for pinned notes only if requested
      if (pinnedOnly) {
        noteQuery = noteQuery.eq('pinned', true);
        console.log('Filtering for pinned notes only');
      }
      
      // Limit the number of notes if in compact mode
      if (compact) {
        // If we're showing pinned only, let's get more to ensure we have enough
        const limit = pinnedOnly ? 10 : 5;
        noteQuery = noteQuery.limit(limit);
        console.log('Using compact mode with limit for notes:', limit);
      }
      
      const { data: notesData, error: notesFetchError } = await noteQuery;
      
      if (notesFetchError) throw notesFetchError;
      
      console.log('Raw notes data fetched:', notesData?.length || 0, 'notes');
      
      // Array to collect all our notices (notes and recipes)
      let allNotices = [];
      
      // Process team notes if we have any
      if (notesData && notesData.length > 0) {
        const notesWithProfiles = await Promise.all(
          notesData.map(async (note) => {
            // Fetch author profile for each note
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', note.author_id)
              .single();
              
            if (profileError) {
              console.error('Error fetching profile for note:', note.id, profileError);
            }
              
            return {
              ...note,
              profiles: profileData || null,
              type: 'team_note'
            };
          })
        );
        
        console.log('Fetched notes with profiles:', notesWithProfiles.length, 'notes');
        allNotices = [...notesWithProfiles];
      }
      
      // Only fetch recipes if we're showing pinned items
      if (pinnedOnly) {
        // Fetch pinned food recipes
        const { data: foodRecipes, error: foodError } = await supabase
          .from('recipes')
          .select('*')
          .eq('posted_to_noticeboard', true)
          .eq('archived', false)
          .eq('module_type', 'food')
          .order('created_at', { ascending: false });
          
        if (foodError) {
          console.error('Error fetching food recipes:', foodError);
        } else if (foodRecipes && foodRecipes.length > 0) {
          console.log('Fetched pinned food recipes:', foodRecipes.length);
          const foodRecipesWithType = foodRecipes.map(recipe => ({
            ...recipe,
            type: 'food_recipe',
            pinned: true
          }));
          allNotices = [...allNotices, ...foodRecipesWithType];
        }
        
        // Fetch pinned beverage recipes
        const { data: bevRecipes, error: bevError } = await supabase
          .from('recipes')
          .select('*')
          .eq('posted_to_noticeboard', true)
          .eq('archived', false)
          .eq('module_type', 'beverage')
          .order('created_at', { ascending: false });
          
        if (bevError) {
          console.error('Error fetching beverage recipes:', bevError);
        } else if (bevRecipes && bevRecipes.length > 0) {
          console.log('Fetched pinned beverage recipes:', bevRecipes.length);
          const bevRecipesWithType = bevRecipes.map(recipe => ({
            ...recipe,
            type: 'beverage_recipe',
            pinned: true
          }));
          allNotices = [...allNotices, ...bevRecipesWithType];
        }
        
        // Fetch pinned hospitality guides
        const { data: guides, error: guidesError } = await supabase
          .from('hospitality_guides')
          .select('*')
          .eq('posted_to_noticeboard', true)
          .eq('archived', false)
          .order('created_at', { ascending: false });
          
        if (guidesError) {
          console.error('Error fetching hospitality guides:', guidesError);
        } else if (guides && guides.length > 0) {
          console.log('Fetched pinned hospitality guides:', guides.length);
          const guidesWithType = guides.map(guide => ({
            ...guide,
            type: 'hospitality_guide',
            pinned: true
          }));
          allNotices = [...allNotices, ...guidesWithType];
        }
      }
      
      // Sort all notices by created_at date (newest first)
      allNotices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Apply limit if needed (after sorting)
      if (compact) {
        allNotices = allNotices.slice(0, pinnedOnly ? 10 : 5);
      }
      
      console.log('Total notices to display:', allNotices.length);
      setNotes(allNotices);
    } catch (err: any) {
      console.error('Error fetching notes and recipes:', err);
      setError(err.message || 'Failed to load noticeboard');
      toast.error('Failed to load noticeboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotesAndRecipes();
    
    // Set up real-time subscription for notes and recipes
    const notesSubscription = supabase
      .channel('team_notes_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'team_notes' 
      }, (payload) => {
        console.log('Realtime event received for team_notes:', payload.eventType);
        fetchNotesAndRecipes();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'recipes' 
      }, (payload) => {
        console.log('Realtime event received for recipes:', payload.eventType);
        fetchNotesAndRecipes();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'hospitality_guides' 
      }, (payload) => {
        console.log('Realtime event received for hospitality_guides:', payload.eventType);
        fetchNotesAndRecipes();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(notesSubscription);
    };
  }, [pinnedOnly, compact]);

  const handleNoteClick = (item: any) => {
    if (item.type === 'team_note') {
      setSelectedNote(item);
      setIsNoteDialogOpen(true);
    } else {
      setSelectedRecipe(item);
      setIsRecipeDialogOpen(true);
    }
  };

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
          ? "No pinned items found" 
          : "No noticeboard items yet. Be the first to post something!"}
      </div>
    );
  }

  // Make sure we're only showing pinned notes if pinnedOnly is true
  const displayNotes = pinnedOnly 
    ? notes.filter(note => note.pinned === true)
    : notes;

  const renderNoticeCard = (item: any) => {
    // For team notes
    if (item.type === 'team_note') {
      return (
        <Card 
          key={item.id} 
          className="mb-3 border border-gray-100 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
          onClick={() => handleNoteClick(item)}
        >
          <CardContent className={compact ? "p-3" : "p-4"}>
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 mt-0.5">
                {item.profiles?.avatar_url ? (
                  <AvatarImage src={item.profiles.avatar_url} alt={item.profiles?.first_name} />
                ) : (
                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {item.profiles?.first_name?.[0] || ''}{item.profiles?.last_name?.[0] || ''}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-gray-900">
                    {item.profiles?.first_name || 'Unknown'} {item.profiles?.last_name || ''}
                  </p>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-1">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                    {item.pinned && (
                      <span className="text-gray-400 ml-1 opacity-60">
                        <span className="text-xs">📌</span>
                      </span>
                    )}
                  </div>
                </div>
                <p className={`${compact ? 'text-sm' : 'text-base'} text-gray-700 mt-1`}>
                  {item.content}
                </p>
                <div className="text-xs text-blue-500 mt-2 flex items-center">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View full note
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // For food or beverage recipes or hospitality guides
    let moduleIcon = null;
    let moduleLabel = '';
    let moduleType = '';
    let avatarBg = '';
    
    if (item.type === 'food_recipe') {
      moduleIcon = <Utensils className="h-4 w-4 text-emerald-600" />;
      moduleLabel = 'Food Recipe';
      moduleType = 'F';
      avatarBg = 'bg-emerald-100 text-emerald-800';
    } else if (item.type === 'beverage_recipe') {
      moduleIcon = <Beer className="h-4 w-4 text-purple-600" />;
      moduleLabel = 'Beverage Recipe';
      moduleType = 'B';
      avatarBg = 'bg-purple-100 text-purple-800';
    } else {
      moduleIcon = <ChefHat className="h-4 w-4 text-blue-600" />;
      moduleLabel = 'Hospitality Guide';
      moduleType = 'H';
      avatarBg = 'bg-blue-100 text-blue-800';
    }
    
    return (
      <Card 
        key={item.id} 
        className="mb-3 border border-gray-100 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
        onClick={() => handleNoteClick(item)}
      >
        <CardContent className={compact ? "p-3" : "p-4"}>
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 mt-0.5">
              <AvatarFallback className={avatarBg}>
                {moduleType}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="font-medium text-gray-900">
                  {item.name}
                </p>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-1">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                  {item.pinned && (
                    <span className="text-gray-400 ml-1 opacity-60">
                      <span className="text-xs">📌</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex mt-1 items-center">
                <span className="inline-flex items-center mr-2">
                  {moduleIcon}
                </span>
                <p className={`${compact ? 'text-sm' : 'text-base'} text-gray-600`}>
                  {moduleLabel}
                </p>
                {item.category && (
                  <p className="text-xs text-gray-500 ml-2 bg-gray-100 px-2 py-0.5 rounded">
                    {item.category}
                  </p>
                )}
              </div>
              <div className="text-xs text-blue-500 mt-2 flex items-center">
                <ExternalLink className="h-3 w-3 mr-1" />
                View details
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      {/* Horizontal scrolling container */}
      <div className="overflow-x-auto">
        <div className="flex space-x-4 py-2" style={{ minWidth: 'max-content' }}>
          {displayNotes.map(renderNoticeCard)}
        </div>
      </div>

      {/* Dialog for note details */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedNote && selectedNote.type === 'team_note' && (
            <div className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  {selectedNote.profiles?.avatar_url ? (
                    <AvatarImage src={selectedNote.profiles.avatar_url} alt={selectedNote.profiles?.first_name} />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-800">
                      {selectedNote.profiles?.first_name?.[0] || ''}{selectedNote.profiles?.last_name?.[0] || ''}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">
                    {selectedNote.profiles?.first_name || 'Unknown'} {selectedNote.profiles?.last_name || ''}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedNote.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{selectedNote.content}</p>
              </div>
              {selectedNote.attachment_url && (
                <div className="mt-4">
                  {selectedNote.type === 'image' || selectedNote.type === 'gif' ? (
                    <img src={selectedNote.attachment_url} alt="Attachment" className="rounded-md max-w-full h-auto" />
                  ) : selectedNote.type === 'voice' ? (
                    <audio controls className="w-full">
                      <source src={selectedNote.attachment_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  ) : null}
                </div>
              )}
              {/* Link to the full note in the Team Noticeboard */}
              <div className="mt-4 text-sm text-center">
                <a href="/team/noticeboard" className="text-blue-600 hover:underline">
                  View in Team Noticeboard to add replies
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for recipe details */}
      {selectedRecipe && (
        <RecipeCardExpanded 
          recipe={selectedRecipe}
          isOpen={isRecipeDialogOpen}
          onClose={() => setIsRecipeDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default TeamNoticeboardCompact;
