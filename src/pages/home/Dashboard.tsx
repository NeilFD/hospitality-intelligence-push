
import { useEffect } from 'react';
import { useCurrentModule } from '@/lib/store';
import FoodDashboard from '@/pages/food/Dashboard';
import BeverageDashboard from '@/pages/beverage/Dashboard';
import HomeDashboard from '@/pages/home/Dashboard';
import { Navigate, useLocation } from 'react-router-dom';
import TeamChat from '@/pages/team/components/TeamChat';
import { useQuery } from '@tanstack/react-query';
import { getChatRooms } from '@/services/team-service';

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
  
  // Route to the specific dashboard component based on the path
  if (path.includes('/home/dashboard')) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <div className="col-span-1 h-[calc(100vh-160px)]">
          {roomId ? (
            <TeamChat initialRoomId={roomId} compact={true} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Loading chat rooms...</p>
            </div>
          )}
        </div>
      </div>
    );
  } else if (path.includes('/beverage/dashboard')) {
    return <BeverageDashboard />;
  } else if (path.includes('/food/dashboard')) {
    return <FoodDashboard />;
  }
  
  // If we're on the generic dashboard, redirect to the appropriate one
  return <Navigate to={`/${currentModule}/dashboard`} replace />;
}
