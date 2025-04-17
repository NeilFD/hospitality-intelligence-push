
import { useEffect } from 'react';
import { useCurrentModule } from '@/lib/store';
import { Navigate, useLocation } from 'react-router-dom';
import TeamChat from '@/pages/team/components/TeamChat';
import { useQuery } from '@tanstack/react-query';
import { getChatRooms } from '@/services/team-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clipboard } from 'lucide-react';

export default function Dashboard() {
  const currentModule = useCurrentModule();
  const location = useLocation();
  
  // Determine which dashboard to display based on the URL
  const path = location.pathname;
  
  useEffect(() => {
    console.log(`Dashboard: Current path is ${path}, module is ${currentModule}`);
  }, [path, currentModule]);
  
  // Fetch chat rooms for the home dashboard
  const { data: rooms = [] } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: getChatRooms,
    staleTime: 60000, // 1 minute cache
  });
  
  // Find the general room or use the first available room
  const generalRoom = rooms.find(room => room.slug === 'general');
  const roomId = generalRoom ? generalRoom.id : (rooms.length > 0 ? rooms[0].id : null);
  
  // We're on the home dashboard
  if (path.includes('/home/dashboard')) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Updates Card */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Clipboard className="h-6 w-6 text-hi-purple" />
              <CardTitle className="text-xl">Quick Updates</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Stay up to date with the latest hospitality insights and team updates.</p>
          </CardContent>
        </Card>
        
        {/* Team Chat Card */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Chat Rooms</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100vh-280px)]">
            {roomId ? (
              <TeamChat initialRoomId={roomId} compact={true} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Loading chat rooms...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  } else if (path.includes('/beverage/dashboard')) {
    return <Navigate to="/beverage/dashboard" />;
  } else if (path.includes('/food/dashboard')) {
    return <Navigate to="/food/dashboard" />;
  }
  
  // If we're on the generic dashboard, redirect to the appropriate one
  return <Navigate to={`/${currentModule}/dashboard`} replace />;
}
