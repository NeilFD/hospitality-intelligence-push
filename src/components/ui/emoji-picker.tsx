
import React from 'react';
import { Button } from '@/components/ui/button';

// Common emoji sets
const EMOJI_GROUPS = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'],
  reactions: ['👍', '👎', '❤️', '🔥', '🎉', '😢', '😡', '👏', '🤔', '🙏', '💯', '💪', '🤝'],
  objects: ['📝', '📌', '🔍', '🔔', '📷', '💻', '📱', '⏰', '📚', '🎵', '🎮', '🍕', '☕'],
  symbols: ['✅', '❌', '❓', '❗', '⭐', '🔴', '🟢', '🔵', '⚫', '⚪', '🟤', '🟣', '🟡']
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  return (
    <div className="p-2 max-h-[300px] overflow-y-auto">
      {Object.entries(EMOJI_GROUPS).map(([groupName, emojis]) => (
        <div key={groupName} className="mb-3">
          <h3 className="text-xs font-medium text-gray-500 mb-1 px-2 capitalize">{groupName}</h3>
          <div className="flex flex-wrap gap-1">
            {emojis.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-100"
                onClick={() => onEmojiSelect(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
