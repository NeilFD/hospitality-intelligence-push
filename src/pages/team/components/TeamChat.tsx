import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send, Image, Mic, Smile, Paperclip, AtSign, Heart, ThumbsUp, Laugh, Angry, Frown, PartyPopper, ThumbsDown, Bookmark } from 'lucide-react';
import { TeamMessage, getMessages, createMessage, markMessageAsRead, uploadTeamFile, getTeamMembers, getChatRooms, addMessageReaction, MessageReaction } from '@/services/team-service';
import { useAuthStore } from '@/services/auth-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile } from '@/types/supabase-types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import ChatRoomSidebar from './ChatRoomSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface MessageProps {
  message: TeamMessage;
  isOwnMessage: boolean;
  author: UserProfile | undefined;
  onAddReaction: (messageId: string, emoji: string) => void;
  teamMembers: UserProfile[];
  currentUserId: string;
}

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "☺️", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "😵‍💫", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐"]
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴"]
  },
  {
    name: "Love",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "💌", "💋", "👨‍❤️‍💋‍👨", "👩‍❤️‍💋‍👩", "👨‍❤️‍👨", "👩‍❤️‍👩"]
  },
  {
    name: "Celebration",
    emojis: ["🎉", "🎊", "🎂", "🍰", "🧁", "🍾", "🥂", "🥳", "🎈", "🎁", "🎀", "🎐", "🎆", "🎇", "🎃", "🎄", "🎋", "🎍", "🎎", "🎏", "🎑", "🧧", "🎭", "🎪", "🎡", "🎢", "🎨"]
  },
  {
    name: "Activities",
    emojis: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂"]
  }
];

const Message: React.FC<MessageProps> = ({ 
  message, 
  isOwnMessage, 
  author, 
  onAddReaction,
  teamMembers,
  currentUserId
}) => {
  const messageContainerClass = isOwnMessage 
    ? "flex justify-end mb-4" 
    : "flex justify-start mb-4";
    
  const messageBubbleClass = isOwnMessage
    ? "bg-blue-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg p-3 max-w-xs lg:max-w-md"
    : "bg-gray-200 text-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg p-3 max-w-xs lg:max-w-md";
  
  const getInitials = () => {
    if (!author) return '?';
    return `${(author.first_name?.[0] || '').toUpperCase()}${(author.last_name?.[0] || '').toUpperCase()}`;
  };

  const [selectedCategory, setSelectedCategory] = useState(0);

  const commonEmojis = [
    { icon: <Heart className="h-4 w-4" />, emoji: "❤️" },
    { icon: <ThumbsUp className="h-4 w-4" />, emoji: "👍" },
    { icon: <Laugh className="h-4 w-4" />, emoji: "😂" },
    { icon: <PartyPopper className="h-4 w-4" />, emoji: "🎉" },
    { icon: <ThumbsDown className="h-4 w-4" />, emoji: "👎" },
    { icon: <Frown className="h-4 w-4" />, emoji: "😢" },
    { icon: <Angry className="h-4 w-4" />, emoji: "😡" },
    { icon: <Bookmark className="h-4 w-4" />, emoji: "🔖" }
  ];

  const getUserNames = (userIds: string[]) => {
    return userIds.map(userId => {
      const user = teamMembers.find(member => member.id === userId);
      return user ? `${user.first_name} ${user.last_name}` : 'Unknown user';
    }).join(', ');
  };

  return (
    <div className={messageContainerClass}>
      {!isOwnMessage && (
        <div className="flex-shrink-0 mr-2">
          <Avatar className="h-8 w-8">
            {author?.avatar_url ? (
              <AvatarImage src={author.avatar_url} alt={`${author.first_name} ${author.last_name}`} />
            ) : (
              <AvatarFallback>{getInitials()}</AvatarFallback>
            )}
          </Avatar>
        </div>
      )}
      
      <div className="flex flex-col relative">
        <div className={`${messageBubbleClass} shadow-sm hover:shadow-md transition-shadow duration-200`}>
          {!isOwnMessage && author && (
            <p className="font-semibold text-xs mb-1">
              {author.first_name} {author.last_name}
            </p>
          )}
          
          {message.type === 'text' && <p className="whitespace-pre-wrap">{message.content}</p>}
          
          {message.type === 'image' && (
            <div>
              {message.content && <p className="mb-2 whitespace-pre-wrap">{message.content}</p>}
              <img 
                src={message.attachment_url}
                alt="Image" 
                className="rounded-md max-h-60 w-auto" 
                loading="lazy"
              />
            </div>
          )}
          
          {message.type === 'gif' && (
            <div>
              {message.content && <p className="mb-2 whitespace-pre-wrap">{message.content}</p>}
              <img 
                src={message.attachment_url}
                alt="GIF" 
                className="rounded-md max-h-60 w-auto" 
                loading="lazy"
              />
            </div>
          )}
          
          {message.type === 'voice' && (
            <div>
              {message.content && <p className="mb-2 whitespace-pre-wrap">{message.content}</p>}
              <audio controls className="w-full">
                <source src={message.attachment_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          
          {message.type === 'file' && (
            <div>
              {message.content && <p className="mb-2 whitespace-pre-wrap">{message.content}</p>}
              <div className="flex items-center space-x-2">
                <Paperclip className="h-4 w-4" />
                <a 
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-blue-600 underline"
                >
                  Download File
                </a>
              </div>
            </div>
          )}
          
          <div className="text-xs mt-1 opacity-70">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-white shadow-sm hover:bg-gray-50 opacity-70 hover:opacity-100"
              >
                <Smile className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-72 p-3"
              align={isOwnMessage ? "end" : "start"}
              side="top"
              sideOffset={5}
              alignOffset={isOwnMessage ? -40 : 40}
            >
              <div className="flex mb-2 gap-1 justify-between border-b pb-2 overflow-x-auto scrollbar-hide">
                {EMOJI_CATEGORIES.map((category, index) => (
                  <Button
                    key={index}
                    variant={selectedCategory === index ? "secondary" : "ghost"}
                    className="h-7 px-2 text-xs min-w-max flex-shrink-0"
                    onClick={() => setSelectedCategory(index)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
              
              <div className="grid grid-cols-8 gap-1.5 max-h-[150px] overflow-y-auto py-1">
                {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-lg"
                    onClick={() => onAddReaction(message.id, emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
              
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1.5">Frequently Used</p>
                <div className="flex gap-1 flex-wrap">
                  {commonEmojis.map((item, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onAddReaction(message.id, item.emoji)}
                    >
                      {item.emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex mt-1 ml-1 flex-wrap gap-1">
            {message.reactions.map((reaction, index) => (
              <HoverCard key={`${reaction.emoji}-${index}`}>
                <HoverCardTrigger asChild>
                  <button 
                    className={`flex items-center rounded-full px-2 text-xs ${
                      reaction.user_ids.includes(currentUserId) 
                        ? 'bg-blue-100 border border-blue-300' 
                        : 'bg-gray-100 border border-gray-200'
                    }`}
                    onClick={() => onAddReaction(message.id, reaction.emoji)}
                  >
                    <span className="mr-1">{reaction.emoji}</span>
                    <span>{reaction.user_ids.length}</span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="p-2 w-48">
                  <p className="text-xs font-medium">Reacted with {reaction.emoji}:</p>
                  <p className="text-xs mt-1">{getUserNames(reaction.user_ids)}</p>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        )}
      </div>
      
      {isOwnMessage && (
        <div className="flex-shrink-0 ml-2">
          <Avatar className="h-8 w-8">
            {author?.avatar_url ? (
              <AvatarImage src={author.avatar_url} alt={`${author.first_name} ${author.last_name}`} />
            ) : (
              <AvatarFallback>{getInitials()}</AvatarFallback>
            )}
          </Avatar>
        </div>
      )}
    </div>
  );
};

const TeamChat: React.FC = () => {
  // ... keep existing code
};

export default TeamChat;
