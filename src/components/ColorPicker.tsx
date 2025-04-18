import React from 'react';
import { ChromePicker } from 'react-color';
import { Pipette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}
export function ColorPicker({
  color,
  onChange,
  label,
  className = ''
}: ColorPickerProps) {
  const handleColorChange = (newColor: {
    hex: string;
  }) => {
    onChange(newColor.hex);
  };
  return <div className={`flex items-center gap-2 ${className}`}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" title="Pick color" className="h-9 w-9 shrink-0 bg-purple-900 hover:bg-purple-800">
            <Pipette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <ChromePicker color={color} onChange={handleColorChange} disableAlpha />
        </PopoverContent>
      </Popover>
      <input type="color" value={color} onChange={e => onChange(e.target.value)} className="w-8 h-8 border-0 p-0 cursor-pointer rounded-md" />
      <input type="text" value={color} onChange={e => onChange(e.target.value)} className="flex-1 h-9 px-3 py-1 rounded-md border border-gray-300 text-sm" placeholder="#000000" />
    </div>;
}