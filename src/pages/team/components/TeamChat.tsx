
import React, { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AtSign, Send } from 'lucide-react';
import { getTeamMembers } from '@/services/team-service';
import { UserProfile } from '@/types/supabase-types';

const TeamChat = () => {
  const [showMentionSelector, setShowMentionSelector] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [message, setMessage] = useState('');
  
  // Sample messages for demonstration
  const [messages] = useState([
    { id: 1, author: 'Neil Fincham-Dukes', content: 'Morning team! Hope everyone is well today.', timestamp: '09:15', avatar: 'https://kfiergoryrnjkewmeriy.supabase.co/storage/v1/object/public/avatars/4ca54c3c-78ad-4d74-9fd4-f1f487d365de/v364e0ltlk.JPG' },
    { id: 2, author: 'Roman Ivanov', content: 'Hi Neil! All good here, preparing for the weekend rush.', timestamp: '09:17', avatar: null },
    { id: 3, author: 'Shane Turner-Hill', content: 'Just a reminder that we need to check stock levels before the weekend.', timestamp: '09:20', avatar: null }
  ]);
  
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
  
  const handleSendMessage = () => {
    if (message.trim()) {
      // Here we would normally send the message to the server
      console.log('Sending message:', message);
      setMessage('');
    }
  };
  
  const insertMention = (userId: string, displayName: string) => {
    console.log(`Inserting mention for ${displayName} (${userId})`);
    setMessage(prev => `${prev}@${displayName} `);
    setShowMentionSelector(false);
  };
  
  const insertAllMention = () => {
    console.log('Inserting mention for everyone');
    setMessage(prev => `${prev}@everyone `);
    setShowMentionSelector(false);
  };
  
  const handleAtKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '@') {
      setShowMentionSelector(true);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {/* Chat messages */}
        {messages.map(msg => (
          <div key={msg.id} className="mb-4 flex items-start">
            <Avatar className="mr-2 h-8 w-8">
              {msg.avatar ? (
                <AvatarImage src={msg.avatar} alt={msg.author} />
              ) : (
                <AvatarFallback>
                  {msg.author.split(' ').map(name => name[0]).join('')}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="font-medium text-gray-800">{msg.author}</span>
                <span className="ml-2 text-xs text-gray-500">{msg.timestamp}</span>
              </div>
              <div className="bg-white p-2 rounded-lg shadow-sm mt-1 text-gray-800">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4 relative bg-white">
        {renderMentionSelector()}
        <div className="flex">
          <input 
            type="text"
            className="flex-1 border rounded-md px-3 py-2"
            placeholder="Type your message..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyUp={handleAtKey}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md flex items-center"
            onClick={handleSendMessage}
          >
            <Send className="h-4 w-4 mr-1" /> Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
