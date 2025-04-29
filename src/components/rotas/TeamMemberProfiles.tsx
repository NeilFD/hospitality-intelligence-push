
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, User, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import TeamMemberForm from './TeamMemberForm';
import TeamMemberDetails from './TeamMemberDetails';

export default function TeamMemberProfiles({ location, jobRoles }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  
  useEffect(() => {
    if (location?.id) {
      fetchTeamMembers();
    }
  }, [location]);
  
  const fetchTeamMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          job_roles (*)
        `)
        .eq('location_id', location.id);
      
      if (error) {
        throw error;
      }
      
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: 'Error loading team members',
        description: 'There was a problem loading the team member data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteMember = async (id) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Team member deleted',
        description: 'The team member has been removed.',
      });
      
      fetchTeamMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast({
        title: 'Error deleting team member',
        description: 'There was a problem deleting the team member.',
        variant: 'destructive',
      });
    }
  };

  const handleEditMember = (member) => {
    setCurrentMember(member);
    setIsEditing(true);
  };
  
  const handleViewMember = (member) => {
    setViewingMember(member);
  };

  // Filter team members based on search term
  const filteredMembers = teamMembers.filter(member => 
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.job_roles?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Team Members
          </CardTitle>
          <Button 
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Add Member</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <p>Loading team members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <User className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No team members found</p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm('')}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map(member => (
                <div 
                  key={member.id}
                  className="p-4 border rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewMember(member)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.photo_url} alt={member.full_name} />
                      <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.full_name}</div>
                      <div className="text-sm text-muted-foreground">{member.job_roles?.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <Badge variant="outline">
                      {member.employment_type}
                    </Badge>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMember(member);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMember(member.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      <TeamMemberForm
        isOpen={isAdding || isEditing}
        onClose={() => {
          setIsAdding(false);
          setIsEditing(false);
          setCurrentMember(null);
        }}
        onSubmitComplete={fetchTeamMembers}
        locationId={location?.id}
        jobRoles={jobRoles}
        teamMember={currentMember}
        isEditing={isEditing}
      />
      
      <TeamMemberDetails
        isOpen={!!viewingMember}
        onClose={() => setViewingMember(null)}
        member={viewingMember}
        onEdit={() => {
          setCurrentMember(viewingMember);
          setViewingMember(null);
          setIsEditing(true);
        }}
        onDelete={() => {
          handleDeleteMember(viewingMember.id);
          setViewingMember(null);
        }}
      />
    </Card>
  );
}
