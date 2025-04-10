
const highlightMentions = (content: string, teamMembers: UserProfile[]): React.ReactNode => {
  if (!content.includes('@')) return content;
  
  const userMap = new Map();
  const userNameMap = new Map();
  
  teamMembers.forEach(member => {
    const fullName = `${member.first_name} ${member.last_name}`.trim();
    userMap.set(member.id, fullName);
    
    userNameMap.set(fullName.toLowerCase(), member.id);
  });
  
  const parts = content.split('@');
  const result: React.ReactNode[] = [parts[0]];
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    
    if (part.startsWith('all ') || part.startsWith('all\n')) {
      result.push(<span key={`mention-all-${i}`} className="bg-[#86e0b3] text-black rounded px-1">@all</span>);
      result.push(part.substring(3));
      continue;
    }
    
    let found = false;
    
    for (const [userId, name] of userMap.entries()) {
      if (part.startsWith(`${userId} `) || part.startsWith(`${userId}\n`)) {
        result.push(<span key={`mention-${userId}-${i}`} className="bg-[#86e0b3] text-black rounded px-1">@{name}</span>);
        result.push(part.substring(userId.length));
        found = true;
        break;
      }
    }
    
    if (!found) {
      result.push('@' + part);
    }
  }
  
  return result;
};
