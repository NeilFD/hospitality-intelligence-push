
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Tag } from 'lucide-react';
import { RevenueTag, TaggedDate } from '@/types/revenue-tag-types';

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
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{tag.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Food: {tag.historicalFoodRevenueImpact}% | 
                      Bev: {tag.historicalBeverageRevenueImpact}%
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {tag.occurrenceCount} uses
                  </Badge>
                </div>
              ))}
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
              className="rounded-md border"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
