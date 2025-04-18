
import React from 'react';
import { Pipette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

export function ColorPicker({ color, onChange, label, className = '' }: ColorPickerProps) {
  const handlePipetteClick = async () => {
    try {
      // Check if the EyeDropper API is available
      if ('EyeDropper' in window) {
        // @ts-ignore - TypeScript doesn't know about EyeDropper yet
        const eyeDropper = new window.EyeDropper();
        console.log('EyeDropper initialized:', eyeDropper);
        
        toast.info('Click anywhere on screen to pick a color');
        
        const result = await eyeDropper.open();
        console.log('EyeDropper result:', result);
        onChange(result.sRGBHex);
        toast.success('Color picked successfully');
      } else {
        console.log('EyeDropper API not available in this browser');
        toast.error('Color picker not supported in this browser');
      }
    } catch (e) {
      console.error('EyeDropper error:', e);
      toast.error('Color picker cancelled or failed');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button 
        variant="outline" 
        size="icon"
        onClick={handlePipetteClick}
        title="Pick color from screen"
        className="h-9 w-9 shrink-0"
      >
        <Pipette className="h-4 w-4" />
      </Button>
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
