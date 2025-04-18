
import React from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

export function ColorPicker({ color, onChange, label, className = '' }: ColorPickerProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 border-0 p-0 cursor-pointer rounded-md"
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-9 px-3 py-1 rounded-md border border-gray-300 text-sm"
        placeholder="#000000"
      />
    </div>
  );
}
