
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [localColor, setLocalColor] = useState(color);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setLocalColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="flex items-center space-x-2">
      <Input 
        type="color" 
        value={localColor} 
        onChange={handleColorChange} 
        className="w-full h-10 p-1 rounded-md"
      />
      <span className="text-sm text-gray-600">{localColor}</span>
    </div>
  );
};
