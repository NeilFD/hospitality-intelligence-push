
import React, { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AtSign } from 'lucide-react';
import { getTeamMembers } from '@/services/team-service';
import { UserProfile } from '@/types/supabase-types';

export interface TeamChatProps {
  // Add any props if needed
}

const TeamChat: React.FC<TeamChatProps> = () => {
  const [showMentionSelector, setShowMentionSelector] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const members = await getTeamMembers();
        setTeamMembers(members);
      } catch (error) {
        console.error('Failed to load team members:', error);
      }
    };
    
    loadTeamMembers();
  }, []);
  
  const insertMention = (userId: string, displayName: string) => {
    console.log(`Inserting mention for ${displayName} (${userId})`);
    // Implement mention insertion logic
    setShowMentionSelector(false);
  };
  
  const insertAllMention = () => {
    console.log('Inserting mention for everyone');
    // Implement mention all logic
    setShowMentionSelector(false);
  };
  
  const renderMentionSelector = () => {
    if (!showMentionSelector) return null;
    
    const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];
    
    const filteredMembers = safeTeamMembers
      .filter(member => {
        if (!member || typeof member !== 'object') return false;
        const firstName = member.first_name || '';
        const lastName = member.last_name || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
        return mentionQuery === '' || fullName.includes(mentionQuery.toLowerCase());
      });
    
    return (
      <div className="absolute bottom-[calc(100%)] left-3 w-64 bg-white shadow-lg rounded-lg z-10 border overflow-hidden">
        <Command className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="Search people..." 
            value={mentionQuery} 
            onValueChange={setMentionQuery} 
            className="text-gray-800" // Added text color
          />
          <CommandList>
            <CommandEmpty className="text-gray-600 p-2">No users found</CommandEmpty>
            <CommandGroup>
              <CommandItem 
                key="mention-all"
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-100 text-gray-800" 
                onSelect={insertAllMention}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800">
                  <AtSign className="w-4 h-4" />
                </div>
                <span className="font-medium">everyone</span>
              </CommandItem>
              
              {filteredMembers.map(member => (
                <CommandItem 
                  key={member.id} 
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-100 text-gray-800" 
                  onSelect={() => insertMention(
                    member.id,
                    `${member.first_name || ''} ${member.last_name || ''}`
                  )}
                >
                  <Avatar className="h-8 w-8">
                    {member.avatar_url ? (
                      <AvatarImage src={member.avatar_url} alt={member.first_name || 'User'} />
                    ) : (
                      <AvatarFallback>
                        {(member.first_name?.[0] || '')}{(member.last_name?.[0] || '')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-gray-800">{member.first_name || ''} {member.last_name || ''}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Chat messages will go here */}
        <p>Team chat content will appear here</p>
      </div>
      <div className="border-t p-4 relative">
        {renderMentionSelector()}
        <div className="flex">
          <input 
            type="text"
            className="flex-1 border rounded-md px-3 py-2"
            placeholder="Type your message..." 
            onFocus={() => setShowMentionSelector(true)}
            onClick={() => setShowMentionSelector(true)}
          />
          <button className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md">Send</button>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
