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

const canSeeRole = (currentUserRole: string | null | undefined, roleToSee: string): boolean => {
  const roleHierarchy = { 'GOD': 4, 'Super User': 3, 'Manager': 2, 'Team Member': 1 };
  const currentRoleValue = currentUserRole ? roleHierarchy[currentUserRole] || 0 : 0;
  const seeRoleValue = roleHierarchy[roleToSee] || 0;
  
  return currentRoleValue >= seeRoleValue;
};

const TeamDashboard: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { profile } = useAuthStore();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const members = await getTeamMembers();
        
        if (members && Array.isArray(members)) {
          setTeamMembers(members);
          console.log("Fetched team members:", members);
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

  const getAvailableRoleFilters = () => {
    const allRoles = ['GOD', 'Super User', 'Manager', 'Team Member', 'Owner'];
    return allRoles;
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
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 rounded-xl group relative h-[420px]">
          <div className="absolute inset-0 bg-cover bg-center z-0" 
               style={{ backgroundImage: "url('/lovable-uploads/d2abeaa8-da6c-45de-8633-f0da3c4ef2d5.png')" }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black/80 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="relative z-10 h-full flex flex-col">
            <CardHeader className="pt-6 pb-0 px-6">
              <div className="bg-white/20 text-white p-4 rounded-xl inline-flex shadow-md mb-4 backdrop-blur-md border border-white/30 transform group-hover:scale-105 transition-transform">
                <Clipboard className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Team Noticeboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4 px-6 flex-grow">
              <div className="flex items-center gap-3 text-white/90">
                <div className="bg-white/30 backdrop-blur-sm p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-sm">Announcements</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="bg-white/30 backdrop-blur-sm p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-sm">Updates & Events</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="bg-white/30 backdrop-blur-sm p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-sm">Important Information</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0 px-6 pb-6">
              <Button asChild className="w-full justify-between bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white border border-white/30 shadow group-hover:shadow-md transition-all">
                <Link to="/team/noticeboard">
                  Open Noticeboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </div>
        </Card>
        
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 rounded-xl group relative h-[420px]">
          <div className="absolute inset-0 bg-cover bg-center z-0" 
               style={{ backgroundImage: "url('/lovable-uploads/4f5f4d60-b997-4b9d-becf-01d4306193d2.png')" }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black/80 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="relative z-10 h-full flex flex-col">
            <CardHeader className="pt-6 pb-0 px-6">
              <div className="bg-white/20 text-white p-4 rounded-xl inline-flex shadow-md mb-4 backdrop-blur-md border border-white/30 transform group-hover:scale-105 transition-transform">
                <MessageSquare className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Team Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4 px-6 flex-grow">
              <div className="flex items-center gap-3 text-white/90">
                <div className="bg-white/30 backdrop-blur-sm p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-sm">Real-time Messaging</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="bg-white/30 backdrop-blur-sm p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-sm">Collaborate Together</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="bg-white/30 backdrop-blur-sm p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-sm">Share Files & Images</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0 px-6 pb-6">
              <Button asChild className="w-full justify-between bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white border border-white/30 shadow group-hover:shadow-md transition-all">
                <Link to="/team/chat">
                  Open Chat <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </div>
        </Card>
        
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 rounded-xl group relative h-[420px]">
          <div className="absolute inset-0 bg-cover bg-center z-0" 
               style={{ backgroundImage: "url('/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png')" }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black/80 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="relative z-10 h-full flex flex-col">
            <CardHeader className="pt-6 pb-0 px-6">
              <div className="bg-white/20 text-white p-4 rounded-xl inline-flex shadow-md mb-4 backdrop-blur-md border border-white/30 transform group-hover:scale-105 transition-transform">
                <Book className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4 px-6 flex-grow">
              <div className="flex items-center gap-3 text-white/90">
                <div className="bg-white/30 backdrop-blur-sm p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-sm">Recipes & Guides</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="bg-white/30 backdrop-blur-sm p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-sm">Service Standards</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="bg-white/30 backdrop-blur-sm p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-sm">Training Materials</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0 px-6 pb-6">
              <Button asChild className="w-full justify-between bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white border border-white/30 shadow group-hover:shadow-md transition-all">
                <Link to="/team/knowledge">
                  Browse Knowledge <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </div>
        </Card>
      </div>
    </div>;
};

export default TeamDashboard;
