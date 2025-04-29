
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, User, Pencil, Trash2, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import TeamMemberForm from './TeamMemberForm';
import TeamMemberDetails from './TeamMemberDetails';
import NewUserProfileForm from './NewUserProfileForm';
import { useAuthStore } from '@/services/auth-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TeamMemberProfiles({ location, jobRoles }) {
  const [isLoading, setIsLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [isCreatingNewProfile, setIsCreatingNewProfile] = useState(false);
  const { profile } = useAuthStore();
  const [jobTitleFilter, setJobTitleFilter] = useState('');
  const [uniqueJobTitles, setUniqueJobTitles] = useState([]);
  
  const userRole = profile?.role;
  
  // Check if user has permission to create profiles
  const canCreateProfiles = userRole === 'GOD' || userRole === 'Super User' || userRole === 'Owner';
  
  useEffect(() => {
    if (location?.id) {
      console.log("Location ID received in TeamMemberProfiles:", location.id);
      fetchTeamMembers();
    }
  }, [location]);
  
  const fetchTeamMembers = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching team members from profiles table");
      // Use the profiles table instead of team_members
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
      }
      
      console.log("Profiles fetched:", data?.length || 0, "profiles");
      setTeamMembers(data || []);
      
      // Extract unique job titles for the filter
      if (data && data.length > 0) {
        const titles = data
          .map(member => member.job_title)
          .filter(title => title) // Remove null/undefined
          .filter((value, index, self) => self.indexOf(value) === index) // Unique values
          .sort();
        setUniqueJobTitles(titles);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast("Error loading profiles", {
        description: "There was a problem loading the profile data.",
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteMember = async (id) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast("Team member deleted", {
        description: "The team member has been removed.",
      });
      
      fetchTeamMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast("Error deleting team member", {
        description: "There was a problem deleting the team member.",
        style: { backgroundColor: "#f44336", color: "#fff" },
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

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setJobTitleFilter('');
  };

  // Filter team members based on search term and job title filter
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = 
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJobTitle = jobTitleFilter ? 
      member.job_title === jobTitleFilter : true;
    
    return matchesSearch && matchesJobTitle;
  });
  
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '??';
    return (firstName?.[0] || '') + (lastName?.[0] || '');
  };
  
  const getFullName = (member) => {
    return `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unnamed User';
  };
  
  return (
    <Card className="shadow-lg rounded-xl border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Team Members
          </CardTitle>
          <div className="flex gap-2">
            {canCreateProfiles && (
              <Button 
                variant="default"
                className="flex items-center gap-1 hover:bg-blue-600"
                onClick={() => setIsCreatingNewProfile(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Create New Profile</span>
              </Button>
            )}
            <Button 
              variant="outline"
              className="flex items-center gap-1 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Add Member</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-full sm:w-64">
              <Select
                value={jobTitleFilter}
                onValueChange={setJobTitleFilter}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by job title" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All job titles</SelectItem>
                  {uniqueJobTitles.map(title => (
                    <SelectItem key={title} value={title}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || jobTitleFilter) && (
              <Button 
                variant="ghost" 
                onClick={clearFilters}
                className="w-full sm:w-auto"
              >
                Clear filters
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <p>Loading team members...</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <User className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No team members found</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <User className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No team members match your search</p>
              <Button variant="link" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map(member => (
                <div 
                  key={member.id}
                  className="p-4 border rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleViewMember(member)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-10 w-10 border border-gray-200">
                      <AvatarImage src={member.avatar_url} alt={getFullName(member)} />
                      <AvatarFallback>{getInitials(member.first_name, member.last_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{getFullName(member)}</div>
                      <div className="text-sm text-muted-foreground">{member.job_title || 'No job title'}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <Badge variant="secondary" className="bg-gray-100">
                      {member.role || 'No role'}
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

      <NewUserProfileForm
        isOpen={isCreatingNewProfile}
        onClose={() => setIsCreatingNewProfile(false)}
        onComplete={fetchTeamMembers}
        jobRoles={jobRoles}
        locationId={location?.id}
      />
    </Card>
  );
}
