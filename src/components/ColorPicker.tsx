
import React, { useEffect, useState } from 'react';
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
  const [pickerColor, setPickerColor] = useState(color);
  const [textContrast, setTextContrast] = useState('text-white');
  
  useEffect(() => {
    setPickerColor(color);
    
    // Determine if text should be dark or light based on background color
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    setTextContrast(brightness > 128 ? 'text-gray-900' : 'text-white');
  }, [color]);

  const handleColorChange = (newColor: {
    hex: string;
  }) => {
    setPickerColor(newColor.hex);
    onChange(newColor.hex);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-sm text-gray-600">{label}</span>}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" title="Pick color" 
            className="h-9 w-9 shrink-0"
            style={{backgroundColor: pickerColor}}>
            <Pipette className={`h-4 w-4 ${textContrast}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <ChromePicker color={pickerColor} onChange={handleColorChange} disableAlpha />
        </PopoverContent>
      </Popover>
      
      <input 
        type="color" 
        value={pickerColor} 
        onChange={e => onChange(e.target.value)} 
        className="w-8 h-8 border-0 p-0 cursor-pointer rounded-md" 
      />
      
      <input 
        type="text" 
        value={pickerColor} 
        onChange={e => onChange(e.target.value)} 
        className="flex-1 h-9 px-3 py-1 rounded-md border border-gray-300 text-sm" 
        placeholder="#000000" 
      />
    </div>
  );
}
