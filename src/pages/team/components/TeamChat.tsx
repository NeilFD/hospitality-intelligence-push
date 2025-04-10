
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
