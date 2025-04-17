
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  const { data, error } = await supabase
    .from('team_chat_rooms')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) {
    console.error('Error fetching chat rooms:', error);
    throw error;
  }
  
  // Custom ordering logic for chat rooms
  const roomOrder = {
    'General': 1,
    'Team': 2,
    'Announcements': 3,
    'Food': 4,
    'Beverage': 5
  };
  
  // Sort the rooms based on the custom order
  const sortedRooms = data?.sort((a, b) => {
    // Extract the first word from each room name for comparison
    const aFirstWord = a.name.split(' ')[0];
    const bFirstWord = b.name.split(' ')[0];
    
    // Get the order values, defaulting to a high number if not found
    const aOrder = roomOrder[aFirstWord] || 999;
    const bOrder = roomOrder[bFirstWord] || 999;
    
    return aOrder - bOrder;
  }) || [];
  
  return sortedRooms;
};
