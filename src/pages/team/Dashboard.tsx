
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, ArrowRight, Clipboard, Book, Loader2, AlertCircle, Filter } from 'lucide-react';
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

  // Helper function to check if current user can see a specific role
  const canSeeRole = (currentUserRole: string | null | undefined, roleToSee: string): boolean => {
    const roleHierarchy = { 'GOD': 4, 'Super User': 3, 'Manager': 2, 'Team Member': 1 };
    const currentRoleValue = currentUserRole ? roleHierarchy[currentUserRole] || 0 : 0;
    const seeRoleValue = roleHierarchy[roleToSee] || 0;
    
    // Users can see their own role level and below
    return currentRoleValue >= seeRoleValue;
  };

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const members = await getTeamMembers();
        
        if (members && Array.isArray(members)) {
          // Filter members based on user's role - can only see their level and below
          const filteredMembers = members.filter(member => 
            canSeeRole(profile?.role, member.role || 'Team Member')
          );
          setTeamMembers(filteredMembers);
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

  // Get available roles for filtering based on user's role
  const getAvailableRoleFilters = () => {
    const allRoles = ['GOD', 'Super User', 'Manager', 'Team Member'];
    
    if (!profile || !profile.role) return ['Team Member'];
    
    // Return only the roles the user can see based on their own role
    return allRoles.filter(role => canSeeRole(profile.role, role));
  };

  // Filter members based on selected role filter
  const filteredMembers = roleFilter === 'all' 
    ? teamMembers 
    : teamMembers.filter(member => member.role === roleFilter);

  return <div className="container mx-auto p-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 flex items-center gap-2">
          <Users className="h-8 w-8 text-indigo-600" /> Team
        </h1>
        <p className="text-gray-600">
          Connect with your team, share updates, and stay informed.
        </p>
      </div>
      
      <div className="mb-8 bg-white rounded-lg border border-gray-100 shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
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
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
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
                <Avatar className="h-16 w-16 border-2 border-indigo-100">
                  {member.avatar_url ? (
                    <AvatarImage src={member.avatar_url} alt={`${member.first_name} ${member.last_name}`} />
                  ) : (
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg">
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
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-b from-gray-50 to-gray-100 border-none rounded-xl">
          <CardHeader className="pt-6 pb-0 px-6">
            <div className="bg-blue-500 text-white p-4 rounded-xl inline-flex shadow-md mb-4 transform hover:scale-105 transition-transform">
              <Clipboard className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-800">Team Noticeboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 px-6">
            <div className="flex items-center gap-3 text-blue-700">
              <div className="bg-blue-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Announcements</span>
            </div>
            <div className="flex items-center gap-3 text-blue-700">
              <div className="bg-blue-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Updates & Events</span>
            </div>
            <div className="flex items-center gap-3 text-blue-700">
              <div className="bg-blue-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Important Information</span>
            </div>
          </CardContent>
          <CardFooter className="pt-0 px-6 pb-6">
            <Button asChild className="w-full justify-between bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-white shadow">
              <Link to="/team/noticeboard">
                Open Noticeboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-b from-indigo-50 to-indigo-100 border-none rounded-xl">
          <CardHeader className="pt-6 pb-0 px-6">
            <div className="bg-indigo-500 text-white p-4 rounded-xl inline-flex shadow-md mb-4 transform hover:scale-105 transition-transform">
              <MessageSquare className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-indigo-800">Team Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 px-6">
            <div className="flex items-center gap-3 text-indigo-700">
              <div className="bg-indigo-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Real-time Messaging</span>
            </div>
            <div className="flex items-center gap-3 text-indigo-700">
              <div className="bg-indigo-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Collaborate Together</span>
            </div>
            <div className="flex items-center gap-3 text-indigo-700">
              <div className="bg-indigo-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-sm">Share Files & Images</span>
            </div>
          </CardContent>
          <CardFooter className="pt-0 px-6 pb-6">
            <Button asChild className="w-full justify-between bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg text-white shadow">
              <Link to="/team/chat">
                Open Chat <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-b from-amber-50 to-amber-100 border-none rounded-xl">
          <CardHeader className="pt-6 pb-0 px-6">
            <div className="bg-amber-500 text-white p-4 rounded-xl inline-flex shadow-md mb-4 transform hover:scale-105 transition-transform">
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
            <Button asChild className="w-full justify-between bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg text-white shadow">
              <Link to="/team/knowledge">
                Browse Knowledge <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>;
};

export default TeamDashboard;
