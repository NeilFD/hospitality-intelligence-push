
import React from 'react';
import { useAuthStore } from '@/services/auth-service';
import TeamChat from '@/pages/team/components/TeamChat';
import { getChatRooms } from '@/services/team-service';
import { useQuery } from '@tanstack/react-query';

const HomeDashboard = () => {
  const { user } = useAuthStore();
  const { data: rooms = [] } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: getChatRooms,
    staleTime: 60000, // 1 minute
  });
  
  // Find the general room or use the first available room
  const generalRoom = rooms.find(room => room.slug === 'general');
  const initialRoomId = generalRoom ? generalRoom.id : (rooms.length > 0 ? rooms[0].id : undefined);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.first_name || 'Guest'}</h1>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-forest-green">Team Chat</span>
            </h2>
            
            <div className="h-[75vh] overflow-hidden">
              {initialRoomId ? (
                <TeamChat initialRoomId={initialRoomId} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading chat rooms...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
