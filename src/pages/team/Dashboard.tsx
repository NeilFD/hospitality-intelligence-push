
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, ArrowRight, Clipboard, Book, Loader2, AlertCircle, Filter, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTeamMembers } from '@/services/team-service';
import { UserProfile } from '@/types/supabase-types';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/services/auth-service';

const TeamDashboard: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { profile } = useAuthStore();

  const canSeeRole = (currentUserRole: string | null | undefined, roleToSee: string): boolean => {
    const roleHierarchy = { 'GOD': 4, 'Super User': 3, 'Manager': 2, 'Team Member': 1 };
    const currentRoleValue = currentUserRole ? roleHierarchy[currentUserRole] || 0 : 0;
    const seeRoleValue = roleHierarchy[roleToSee] || 0;
    
    return currentRoleValue >= seeRoleValue;
  };

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const members = await getTeamMembers();
        
        if (members && Array.isArray(members)) {
          const filteredMembers = profile?.role === 'GOD' 
            ? members 
            : members.filter(member => 
                canSeeRole(profile?.role, member.role || 'Team Member')
              );
          
          setTeamMembers(filteredMembers);
          console.log("Fetched team members:", filteredMembers);
        } else {
          setError('Invalid data format received');
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
        setError("Failed to fetch team members");
        toast.error("Failed to load team members");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeamMembers();
  }, [profile]);

  // Updated to show all available roles based on the user's permission level
  const getAvailableRoleFilters = () => {
    const allRoles = ['GOD', 'Super User', 'Manager', 'Team Member', 'Owner'];
    
    if (!profile || !profile.role) return ['Team Member'];
    
    if (profile.role === 'GOD') return allRoles;
    
    // Filter roles based on what the current user can see
    return allRoles.filter(role => canSeeRole(profile.role, role));
  };

  const filteredMembers = roleFilter === 'all'
    ? teamMembers
    : teamMembers.filter(member => member.role === roleFilter || 
        (roleFilter === 'Team Member' && !member.role));

  const getUserInitials = () => {
    if (!profile) return '?';
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return <div className="container mx-auto p-4">
      <div className="bg-gradient-to-r from-hi-purple-light/20 to-hi-purple/10 rounded-lg p-6 mb-6 shadow-md border border-hi-purple/20">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-2 text-hi-purple flex items-center gap-2">
            <Users className="h-8 w-8 text-hi-purple" /> Team
          </h1>
          
          {profile && (
            <Link to="/profile" className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
              <Avatar className="h-10 w-10 border-2 border-hi-purple-light">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
                ) : (
                  <AvatarFallback className="bg-hi-purple-light/30 text-hi-purple">
                    {getUserInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">
                  {profile.first_name} {profile.last_name}
                </span>
                <span className="text-xs text-gray-500">{profile.role || 'Team Member'}</span>
              </div>
            </Link>
          )}
        </div>
        <p className="text-gray-600">
          Connect with your team, share updates, and stay informed.
        </p>
      </div>
      
      <div className="mb-8 bg-white rounded-lg border border-gray-100 shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-hi-purple" />
            Team Members
          </h2>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {getAvailableRoleFilters().map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {isLoading ? (
            <div className="w-full flex justify-center py-4">
              <Loader2 className="h-8 w-8 text-hi-purple animate-spin" />
            </div>
          ) : error ? (
            <div className="w-full flex items-center justify-center py-4 text-red-500">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : filteredMembers.length === 0 ? (
            <p className="text-gray-500 italic">No team members found</p>
          ) : (
            filteredMembers.map((member) => (
              <Link 
                key={member.id} 
                to={`/profile/${member.id}`}
                className="flex flex-col items-center gap-1 bg-gray-50 hover:bg-gray-100 transition-colors p-3 rounded-lg"
              >
                <Avatar className="h-16 w-16 border-2 border-hi-purple-light/30">
                  {member.avatar_url ? (
                    <AvatarImage src={member.avatar_url} alt={`${member.first_name} ${member.last_name}`} />
                  ) : (
                    <AvatarFallback className="bg-hi-purple-light/20 text-hi-purple text-lg">
                      {member.first_name?.[0] || ''}{member.last_name?.[0] || ''}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm font-medium text-gray-800">
                  {member.first_name} {member.last_name}
                </span>
                <span className="text-xs text-gray-500">{member.role || 'Team Member'}</span>
              </Link>
            ))
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white border-blue-200 hover:border-hi-purple/30 rounded-xl group">
          <CardHeader className="pt-6 pb-0 px-6">
            <div className="bg-gradient-to-br from-hi-purple-light to-hi-purple-dark text-white p-4 rounded-xl inline-flex shadow-md mb-4 transform group-hover:scale-105 transition-transform">
              <Clipboard className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-hi-purple-dark">Team Noticeboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 px-6">
            <div className="flex items-center gap-3 text-hi-purple">
              <div className="bg-hi-purple-light/20 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Announcements</span>
            </div>
            <div className="flex items-center gap-3 text-hi-purple">
              <div className="bg-hi-purple-light/20 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Updates & Events</span>
            </div>
            <div className="flex items-center gap-3 text-hi-purple">
              <div className="bg-hi-purple-light/20 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Important Information</span>
            </div>
          </CardContent>
          <CardFooter className="pt-0 px-6 pb-6">
            <Button asChild className="w-full justify-between bg-gradient-to-r from-hi-purple-light to-hi-purple hover:from-hi-purple hover:to-hi-purple-dark rounded-lg text-white shadow group-hover:shadow-md transition-all">
              <Link to="/team/noticeboard">
                Open Noticeboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white border-emerald-200 hover:border-emerald-300/30 rounded-xl group">
          <CardHeader className="pt-6 pb-0 px-6">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 rounded-xl inline-flex shadow-md mb-4 transform group-hover:scale-105 transition-transform">
              <MessageSquare className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-800">Team Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 px-6">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="bg-emerald-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Real-time Messaging</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="bg-emerald-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Collaborate Together</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="bg-emerald-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Share Files & Images</span>
            </div>
          </CardContent>
          <CardFooter className="pt-0 px-6 pb-6">
            <Button asChild className="w-full justify-between bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-lg text-white shadow group-hover:shadow-md transition-all">
              <Link to="/team/chat">
                Open Chat <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white border-amber-200 hover:border-hi-purple/30 rounded-xl group">
          <CardHeader className="pt-6 pb-0 px-6">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-xl inline-flex shadow-md mb-4 transform group-hover:scale-105 transition-transform">
              <Book className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-amber-800">Knowledge Base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 px-6">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="bg-amber-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Recipes & Guides</span>
            </div>
            <div className="flex items-center gap-3 text-amber-700">
              <div className="bg-amber-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Service Standards</span>
            </div>
            <div className="flex items-center gap-3 text-amber-700">
              <div className="bg-amber-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Training Materials</span>
            </div>
          </CardContent>
          <CardFooter className="pt-0 px-6 pb-6">
            <Button asChild className="w-full justify-between bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg text-white shadow group-hover:shadow-md transition-all">
              <Link to="/team/knowledge">
                Browse Knowledge <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>;
};

export default TeamDashboard;
