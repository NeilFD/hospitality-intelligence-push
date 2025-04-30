import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, User, Pencil, Trash2, Filter, ArrowUpAZ, ArrowDownAZ, Calendar } from 'lucide-react';
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
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all', 'available', 'unavailable'
  
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

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setJobTitleFilter('');
    setAvailabilityFilter('all');
  };

  // Filter team members based on search term, job title filter and availability filter
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = 
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJobTitle = jobTitleFilter ? 
      member.job_title === jobTitleFilter : true;
    
    const matchesAvailability = availabilityFilter === 'all' ? true :
      availabilityFilter === 'available' ? 
        member.available_for_rota === true : 
        member.available_for_rota === false;
    
    return matchesSearch && matchesJobTitle && matchesAvailability;
  });

  // Sort the filtered members by last name (then first name) in the specified direction
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const lastNameA = (a.last_name || '').toLowerCase();
    const lastNameB = (b.last_name || '').toLowerCase();
    
    // First sort by last name
    if (lastNameA !== lastNameB) {
      return sortDirection === 'asc' ? 
        lastNameA.localeCompare(lastNameB) : 
        lastNameB.localeCompare(lastNameA);
    }
    
    // If last names are the same, sort by first name
    const firstNameA = (a.first_name || '').toLowerCase();
    const firstNameB = (b.first_name || '').toLowerCase();
    
    return sortDirection === 'asc' ? 
      firstNameA.localeCompare(firstNameB) : 
      firstNameB.localeCompare(firstNameA);
  });
  
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '??';
    return (firstName?.[0] || '') + (lastName?.[0] || '');
  };
  
  const getFullName = (member) => {
    return `${member.last_name || ''}, ${member.first_name || ''}`.trim() || 'Unnamed User';
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
            <div className="flex gap-2">
              <div className="w-full sm:w-[150px]">
                <Select
                  value={jobTitleFilter}
                  onValueChange={setJobTitleFilter}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Job title" />
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
              <div className="w-full sm:w-[150px]">
                <Select
                  value={availabilityFilter}
                  onValueChange={setAvailabilityFilter}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <SelectValue placeholder="Availability" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All availability</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline"
                size="icon"
                onClick={toggleSortDirection}
                title={sortDirection === 'asc' ? 'Sort A-Z' : 'Sort Z-A'}
              >
                {sortDirection === 'asc' ? (
                  <ArrowUpAZ className="h-4 w-4" />
                ) : (
                  <ArrowDownAZ className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {(searchTerm || jobTitleFilter || availabilityFilter !== 'all') && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Found {sortedMembers.length} team members matching your filters
              </div>
              <Button 
                variant="ghost" 
                onClick={clearFilters}
                className="text-xs h-8"
              >
                Clear filters
              </Button>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <p>Loading team members...</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <User className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No team members found</p>
            </div>
          ) : sortedMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <User className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No team members match your search</p>
              <Button variant="link" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedMembers.map(member => (
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
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="bg-gray-100">
                        {member.role || 'No role'}
                      </Badge>
                      {member.available_for_rota !== undefined && (
                        <Badge variant={member.available_for_rota ? "success" : "destructive"} className={member.available_for_rota ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {member.available_for_rota ? 'Available' : 'Unavailable'}
                        </Badge>
                      )}
                    </div>
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
