
import React, { useEffect, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getProfileHighScore } from './HiScoreHistory';
import { StarBadge } from './StarBadge';

interface ProfileAvatarProps {
  profileId: string;
  avatarUrl?: string | null;
  fallback?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  highScore?: number;
}

export function ProfileAvatar({ 
  profileId, 
  avatarUrl, 
  fallback = 'U', 
  className = '', 
  size = 'md',
  highScore: propHighScore 
}: ProfileAvatarProps) {
  const [highScore, setHighScore] = useState<number | undefined>(propHighScore);
  const [isLoading, setIsLoading] = useState<boolean>(propHighScore === undefined);

  // Calculate size class based on the size prop
  const sizeClass = {
    'sm': 'h-8 w-8',
    'md': 'h-10 w-10',
    'lg': 'h-14 w-14'
  }[size];

  // Get star badge position and size based on avatar size
  const getStarPosition = () => {
    switch(size) {
      case 'sm':
        return 'scale-75 -top-1.5 -right-1.5';
      case 'lg':
        return '-top-2 -right-2 scale-110';
      case 'md':
      default:
        return '-top-1 -right-1';
    }
  };

  // Fetch high score if not provided as a prop
  useEffect(() => {
    if (propHighScore !== undefined) {
      setHighScore(propHighScore);
      setIsLoading(false);
      return;
    }

    const fetchHighScore = async () => {
      try {
        setIsLoading(true);
        const score = await getProfileHighScore(profileId);
        console.log(`Fetched high score for ${profileId}:`, score);
        setHighScore(score);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching high score:', error);
        setIsLoading(false);
      }
    };

    if (profileId) {
      fetchHighScore();
    }
  }, [profileId, propHighScore]);

  const shouldShowStar = !isLoading && highScore !== undefined && highScore >= 85;
  
  console.log(`Avatar for ${profileId}:`, { highScore, shouldShowStar, isLoading });

  return (
    <div className="relative">
      <Avatar className={`${sizeClass} ${className}`}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt="Profile" />
        ) : null}
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {shouldShowStar && <StarBadge className={getStarPosition()} />}
    </div>
  );
}

export default ProfileAvatar;
