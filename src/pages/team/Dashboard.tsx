import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TeamNoticeboard from './components/TeamNoticeboard';
import TeamChat from './components/TeamChat';
import { useAuthStore } from '@/services/auth-service';
import { useQuery } from '@tanstack/react-query';
import { getTeamMembers } from '@/services/team-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clipboard, MessageSquare } from 'lucide-react';
const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('noticeboard');
  const {
    user,
    profile
  } = useAuthStore();
  const {
    data: teamMembers = [],
    isLoading
  } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getTeamMembers
  });
  const sortedMembers = [...teamMembers].sort((a, b) => {
    // Sort by online status first (future feature)
    // Then by name
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
  });
  return <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:space-x-6">
        <div className="md:w-2/3">
          <Tabs defaultValue="noticeboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="noticeboard" className="text-base font-medium text-slate-900">
                <Clipboard className="w-4 h-4 mr-2" /> Noticeboard
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-base font-medium">
                <MessageSquare className="w-4 h-4 mr-2" /> Team Chat
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="noticeboard">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                <h1 className="text-3xl font-bold mb-2 text-slate-900">Team Noticeboard</h1>
                <p className="text-gray-600">
                  Pin important notes, share updates, and stay connected with the team.
                </p>
              </div>
              <TeamNoticeboard />
            </TabsContent>
            
            <TabsContent value="chat">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                <h1 className="text-3xl font-bold mb-2 text-slate-900">Team Chat</h1>
                <p className="text-gray-600">
                  Real-time messaging with your team members.
                </p>
              </div>
              <TeamChat />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="md:w-1/3 mt-6 md:mt-0">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Currently {teamMembers.length} members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="flex items-center">
                      <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                      </div>
                    </div>)}
                </div> : <div className="space-y-4">
                  {sortedMembers.map(member => <div key={member.id} className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        {member.avatar_url ? <AvatarImage src={member.avatar_url} alt={`${member.first_name} ${member.last_name}`} /> : <AvatarFallback>{`${(member.first_name?.[0] || '').toUpperCase()}${(member.last_name?.[0] || '').toUpperCase()}`}</AvatarFallback>}
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.first_name} {member.last_name}
                          {member.id === user?.id && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              You
                            </span>}
                        </p>
                        <p className="text-sm text-gray-500">{member.role}</p>
                      </div>
                    </div>)}
                </div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Dashboard;