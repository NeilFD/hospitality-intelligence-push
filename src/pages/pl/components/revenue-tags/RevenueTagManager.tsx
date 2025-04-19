import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Tag, Calendar as CalendarIcon, SaveAll, Check, Pencil, Trash2 } from 'lucide-react';
import { RevenueTag, TaggedDate } from '@/types/revenue-tag-types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface RevenueTagManagerProps {
  tags: RevenueTag[];
  taggedDates: TaggedDate[];
  onAddTag: (tag: Partial<RevenueTag>) => void;
  onTagDate: (date: Date, tagId: string, impacts?: { food?: number; beverage?: number }) => void;
}

export function RevenueTagManager({ 
  tags, 
  taggedDates, 
  onAddTag, 
  onTagDate 
}: RevenueTagManagerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [selectedTag, setSelectedTag] = React.useState<string>('');
  const [foodImpact, setFoodImpact] = React.useState<string>('');
  const [beverageImpact, setBeverageImpact] = React.useState<string>('');
  const [isTagging, setIsTagging] = React.useState<boolean>(false);
  const [editingTag, setEditingTag] = useState<RevenueTag | null>(null);
  const [localTags, setLocalTags] = useState<RevenueTag[]>(tags);
  
  useEffect(() => {
    setLocalTags(tags);
  }, [tags]);
  
  const findTagForDate = (date: Date | undefined): TaggedDate | undefined => {
    if (!date) return undefined;
    const dateStr = format(date, 'yyyy-MM-dd');
    return taggedDates.find(td => td.date === dateStr);
  };
  
  const taggedDate = findTagForDate(selectedDate);
  const selectedTagData = localTags.find(t => t.id === selectedTag);
  
  useEffect(() => {
    if (taggedDate) {
      setSelectedTag(taggedDate.tagId);
      setFoodImpact(taggedDate.manualFoodRevenueImpact?.toString() || '');
      setBeverageImpact(taggedDate.manualBeverageRevenueImpact?.toString() || '');
    } else {
      setSelectedTag('');
      setFoodImpact('');
      setBeverageImpact('');
    }
  }, [taggedDate, selectedDate]);
  
  useEffect(() => {
    if (selectedTagData) {
      if (!foodImpact) {
        setFoodImpact(selectedTagData.historicalFoodRevenueImpact?.toString() || '0');
      }
      if (!beverageImpact) {
        setBeverageImpact(selectedTagData.historicalBeverageRevenueImpact?.toString() || '0');
      }
    }
  }, [selectedTagData, foodImpact, beverageImpact]);
  
  useEffect(() => {
    if (selectedTag && selectedTagData) {
      if (taggedDate && taggedDate.tagId === selectedTag) {
        setFoodImpact(taggedDate.manualFoodRevenueImpact?.toString() || selectedTagData.historicalFoodRevenueImpact?.toString() || '0');
        setBeverageImpact(taggedDate.manualBeverageRevenueImpact?.toString() || selectedTagData.historicalBeverageRevenueImpact?.toString() || '0');
      } else {
        setFoodImpact(selectedTagData.historicalFoodRevenueImpact?.toString() || '0');
        setBeverageImpact(selectedTagData.historicalBeverageRevenueImpact?.toString() || '0');
      }
    }
  }, [selectedTag, selectedTagData, taggedDate]);
  
  const handleApplyTag = () => {
    if (!selectedDate || !selectedTag) {
      toast.error('Please select both a date and a tag');
      return;
    }
    
    setIsTagging(true);
    
    onTagDate(
      selectedDate, 
      selectedTag, 
      {
        food: foodImpact ? parseFloat(foodImpact) : undefined,
        beverage: beverageImpact ? parseFloat(beverageImpact) : undefined
      }
    );
    
    toast.success(`Applied tag to ${format(selectedDate, 'MMMM d, yyyy')}`);
    setIsTagging(false);
  };
  
  const handleDeleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('revenue_tags')
        .delete()
        .eq('id', tagId);
        
      if (error) throw error;
      
      setLocalTags(prev => prev.filter(tag => tag.id !== tagId));
      
      toast.success('Tag deleted successfully');
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    }
  };
  
  const handleUpdateTag = async (tag: RevenueTag) => {
    try {
      const foodImpact = parseFloat(tag.historicalFoodRevenueImpact?.toString() || '0');
      const bevImpact = parseFloat(tag.historicalBeverageRevenueImpact?.toString() || '0');
      
      const { error } = await supabase
        .from('revenue_tags')
        .update({
          name: tag.name,
          historical_food_revenue_impact: foodImpact,
          historical_beverage_revenue_impact: bevImpact,
          description: tag.description || null
        })
        .eq('id', tag.id);
        
      if (error) throw error;
      
      setLocalTags(prev => prev.map(t => 
        t.id === tag.id ? {
          ...tag,
          historicalFoodRevenueImpact: foodImpact,
          historicalBeverageRevenueImpact: bevImpact
        } : t
      ));
      
      if (selectedTag === tag.id) {
        setFoodImpact(foodImpact.toString());
        setBeverageImpact(bevImpact.toString());
      }
      
      setEditingTag(null);
      toast.success('Tag updated successfully');
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Failed to update tag');
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Revenue Impact Tags
        </CardTitle>
        <CardDescription>
          Manage special events and their impact on revenue forecasts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold mb-2">Available Tags</h3>
            <div className="space-y-2">
              {localTags.length > 0 ? (
                localTags.map(tag => (
                  <div 
                    key={tag.id} 
                    className={`flex items-center justify-between p-2 border rounded ${selectedTag === tag.id ? 'bg-primary/10 border-primary' : ''}`}
                  >
                    {editingTag?.id === tag.id ? (
                      <div className="w-full space-y-2">
                        <Input
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                          placeholder="Tag name"
                          className="mb-2"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Food Impact %</Label>
                            <Input
                              type="number"
                              value={editingTag.historicalFoodRevenueImpact}
                              onChange={(e) => setEditingTag({ 
                                ...editingTag, 
                                historicalFoodRevenueImpact: parseFloat(e.target.value) 
                              })}
                            />
                          </div>
                          <div>
                            <Label>Beverage Impact %</Label>
                            <Input
                              type="number"
                              value={editingTag.historicalBeverageRevenueImpact}
                              onChange={(e) => setEditingTag({ 
                                ...editingTag, 
                                historicalBeverageRevenueImpact: parseFloat(e.target.value)
                              })}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <Button 
                            variant="ghost" 
                            onClick={() => setEditingTag(null)}
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleUpdateTag(editingTag)}
                            size="sm"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1" onClick={() => setSelectedTag(tag.id)}>
                          <p className="font-medium">{tag.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Food: {tag.historicalFoodRevenueImpact !== undefined ? tag.historicalFoodRevenueImpact : 0}% | 
                            Bev: {tag.historicalBeverageRevenueImpact !== undefined ? tag.historicalBeverageRevenueImpact : 0}%
                          </p>
                          {tag.description && (
                            <p className="text-xs text-muted-foreground mt-1">{tag.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {tag.occurrenceCount} uses
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTag(tag)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTag(tag.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center p-4 border border-dashed rounded">
                  <p className="text-sm text-muted-foreground">No tags yet</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  onAddTag({
                    name: 'New Event',
                    historicalFoodRevenueImpact: 0,
                    historicalBeverageRevenueImpact: 0,
                    occurrenceCount: 0
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Tag
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Apply Tag to Date</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border mb-4"
            />
            
            {selectedDate && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="tag-select">Select Tag</Label>
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger id="tag-select">
                      <SelectValue placeholder="Select a tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {localTags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTag && (
                  <>
                    <div>
                      <Label htmlFor="food-impact">Food Revenue Impact (%)</Label>
                      <Input 
                        id="food-impact" 
                        type="number" 
                        value={foodImpact} 
                        onChange={(e) => setFoodImpact(e.target.value)}
                        placeholder={selectedTagData?.historicalFoodRevenueImpact?.toString() || "0"}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="beverage-impact">Beverage Revenue Impact (%)</Label>
                      <Input 
                        id="beverage-impact" 
                        type="number" 
                        value={beverageImpact} 
                        onChange={(e) => setBeverageImpact(e.target.value)}
                        placeholder={selectedTagData?.historicalBeverageRevenueImpact?.toString() || "0"}
                      />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleApplyTag}
                      disabled={isTagging}
                    >
                      {isTagging ? (
                        <>Applying Tag...</>
                      ) : taggedDate ? (
                        <>
                          <SaveAll className="mr-2 h-4 w-4" />
                          Update Tag for {format(selectedDate, 'MMM d')}
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Apply Tag to {format(selectedDate, 'MMM d')}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
