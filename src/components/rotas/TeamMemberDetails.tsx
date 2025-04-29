
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Clock, CalendarRange, DollarSign, BarChart3, GraduationCap, BriefcaseIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import AvailabilityViewer from './AvailabilityViewer';

export default function TeamMemberDetails({ isOpen, onClose, member, onEdit, onDelete }) {
  if (!member) return null;
  
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  // Get the appropriate payment field based on employment type
  const getPaymentDetails = () => {
    switch (member.employment_type) {
      case 'hourly':
        return {
          label: 'Hourly Rate',
          value: `£${member.wage_rate?.toFixed(2)}/hour`
        };
      case 'salary':
        return {
          label: 'Annual Salary',
          value: `£${member.annual_salary?.toFixed(2)}`
        };
      case 'contractor':
        return {
          label: 'Contractor Rate',
          value: `£${member.contractor_rate?.toFixed(2)}`
        };
      default:
        return {
          label: 'Rate',
          value: `£${member.wage_rate?.toFixed(2)}/hour`
        };
    }
  };

  const paymentDetails = getPaymentDetails();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={member.photo_url} alt={member.full_name} />
              <AvatarFallback className="text-xl">{getInitials(member.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{member.full_name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{member.job_roles?.title}</Badge>
                <Badge variant="outline">{member.employment_type}</Badge>
                {member.employment_status && (
                  <Badge variant="outline">{member.employment_status}</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{paymentDetails.label}</div>
                <div className="font-medium">{paymentDetails.value}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Performance</div>
                <div className="font-medium">{member.performance_score?.toFixed(0) || 0}%</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Daily Hours</div>
                <div className="font-medium">{member.min_hours_per_day} - {member.max_hours_per_day} hours</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                <CalendarRange className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Weekly Hours</div>
                <div className="font-medium">{member.min_hours_per_week} - {member.max_hours_per_week} hours</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {member.employment_start_date && (
              <div className="flex items-center gap-2">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                  <BriefcaseIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Start Date</div>
                  <div className="font-medium">{formatDate(member.employment_start_date)}</div>
                </div>
              </div>
            )}
            
            {member.in_ft_education !== undefined && (
              <div className="flex items-center gap-2">
                <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full">
                  <GraduationCap className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Education</div>
                  <div className="font-medium">{member.in_ft_education ? 'Full-time student' : 'Not in education'}</div>
                </div>
              </div>
            )}
          </div>
          
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-3">Weekly Availability</h3>
              <AvailabilityViewer availability={member.availability} />
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onEdit} className="flex items-center gap-1">
            <Pencil className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          <Button variant="destructive" onClick={onDelete} className="flex items-center gap-1">
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
