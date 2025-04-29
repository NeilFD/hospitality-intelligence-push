
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Clock, CalendarRange, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AvailabilityViewer from './AvailabilityViewer';

export default function TeamMemberDetails({ isOpen, onClose, member, onEdit, onDelete }) {
  if (!member) return null;
  
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const handleEdit = () => {
    // Ensure we're passing the complete member object to the edit function
    console.log("Passing member data to edit:", member);
    onEdit(member);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] md:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={member.photo_url || member.avatar_url} alt={member.first_name && member.last_name ? `${member.first_name} ${member.last_name}` : 'Profile'} />
              <AvatarFallback className="text-xl">{getInitials(`${member.first_name || ''} ${member.last_name || ''}`)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{`${member.first_name || ''} ${member.last_name || ''}`}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{member.job_title || 'No job title'}</Badge>
                <Badge variant="outline">{member.employment_type || 'Not specified'}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Wage Rate</div>
                <div className="font-medium">£{member.wage_rate?.toFixed(2) || '0.00'}/hour</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Performance</div>
                <div className="font-medium">{member.performance_score?.toFixed(0) || '0'}%</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Daily Hours</div>
                <div className="font-medium">{member.min_hours_per_day || 0} - {member.max_hours_per_day || 0} hours</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                <CalendarRange className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Weekly Hours</div>
                <div className="font-medium">{member.min_hours_per_week || 0} - {member.max_hours_per_week || 0} hours</div>
              </div>
            </div>
          </div>
          
          {(member.availability || member.enhanced_availability) && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-medium mb-3">Weekly Availability</h3>
                <AvailabilityViewer availability={member.availability || member.enhanced_availability} />
              </CardContent>
            </Card>
          )}
          
          {member.about_me && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-medium mb-3">About</h3>
                <p className="text-sm text-muted-foreground">{member.about_me}</p>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {member.favourite_dish && (
              <div className="flex items-center gap-2">
                <div className="text-sm">
                  <div className="font-medium">Favourite Dish</div>
                  <div className="text-muted-foreground">{member.favourite_dish}</div>
                </div>
              </div>
            )}
            
            {member.favourite_drink && (
              <div className="flex items-center gap-2">
                <div className="text-sm">
                  <div className="font-medium">Favourite Drink</div>
                  <div className="text-muted-foreground">{member.favourite_drink}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleEdit} className="flex items-center gap-1">
            <Pencil className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          <Button variant="destructive" onClick={() => onDelete(member.id)} className="flex items-center gap-1">
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
