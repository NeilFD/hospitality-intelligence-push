
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, ArrowRight, Clipboard, Book, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTeamMembers } from '@/services/team-service';
import { UserProfile } from '@/types/supabase-types';

const TeamDashboard: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const members = await getTeamMembers();
        setTeamMembers(members);
      } catch (error) {
        console.error("Error fetching team members:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeamMembers();
  }, []);

  return <div className="container mx-auto p-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 flex items-center gap-2">
          <Users className="h-8 w-8 text-indigo-600" /> Team
        </h1>
        <p className="text-gray-600">
          Connect with your team, share updates, and stay informed.
        </p>
      </div>
      
      {/* Team Members Section */}
      <div className="mb-8 bg-white rounded-lg border border-gray-100 shadow p-4">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          Team Members
        </h2>
        
        <div className="flex flex-wrap gap-4 items-center">
          {isLoading ? (
            <div className="w-full flex justify-center py-4">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          ) : teamMembers.length === 0 ? (
            <p className="text-gray-500 italic">No team members found</p>
          ) : (
            teamMembers.map((member) => (
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
                <span className="text-xs text-gray-500">{member.role}</span>
              </Link>
            ))
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Noticeboard Card */}
        <Card className="border border-blue-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <Clipboard className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle className="text-xl">Team Noticeboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <CardDescription className="text-base mb-4">
              Pin important announcements, share updates, and keep track of essential information for the team.
            </CardDescription>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2">
                <div className="bg-blue-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Post important announcements</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-blue-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Share upcoming events</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-blue-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Pin info to keep it visible</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full justify-between bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              <Link to="/team/noticeboard">
                Open Noticeboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Team Chat Card */}
        <Card className="border border-indigo-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg border-b border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <MessageSquare className="h-6 w-6 text-indigo-500" />
              </div>
              <CardTitle className="text-xl">Team Chat</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <CardDescription className="text-base mb-4">
              Real-time messaging with your team members for day-to-day communication and collaboration.
            </CardDescription>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2">
                <div className="bg-indigo-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Chat with the team</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-indigo-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Collaborate with team members</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-indigo-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Send images, files, and more</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full justify-between bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700">
              <Link to="/team/chat">
                Open Chat <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Team Knowledge Card - NEW */}
        <Card className="border border-amber-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg border-b border-amber-100">
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <Book className="h-6 w-6 text-amber-500" />
              </div>
              <CardTitle className="text-xl">Team Knowledge</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <CardDescription className="text-base mb-4">
              Access the shared knowledge base with recipes, service information, and training materials.
            </CardDescription>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2">
                <div className="bg-amber-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Food & beverage recipes</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-amber-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Service standards & procedures</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-amber-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Training materials & guides</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full justify-between bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
              <Link to="/team/knowledge">
                Browse Knowledge Base <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>;
};
export default TeamDashboard;
