
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

  // Calculate size class based on the size prop
  const sizeClass = {
    'sm': 'h-8 w-8',
    'md': 'h-10 w-10',
    'lg': 'h-14 w-14'
  }[size];

  // Fetch high score if not provided as a prop
  useEffect(() => {
    if (propHighScore !== undefined) {
      setHighScore(propHighScore);
      return;
    }

    const fetchHighScore = async () => {
      const score = await getProfileHighScore(profileId);
      setHighScore(score);
    };

    fetchHighScore();
  }, [profileId, propHighScore]);

  const shouldShowStar = highScore !== undefined && highScore >= 85;

  return (
    <div className="relative">
      <Avatar className={`${sizeClass} ${className}`}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt="Profile" />
        ) : null}
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {shouldShowStar && <StarBadge className={size === 'sm' ? 'scale-75' : ''} />}
    </div>
  );
}

export default ProfileAvatar;
