
import React, { useState, useEffect } from 'react';
import { Pipette, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

export function ColorPicker({ color, onChange, label, className = '' }: ColorPickerProps) {
  const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false);
  
  useEffect(() => {
    // Check if the EyeDropper API is available
    setIsEyeDropperSupported('EyeDropper' in window);
  }, []);

  const handlePipetteClick = async () => {
    try {
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handlePipetteClick}
              title="Pick color from screen"
              className={`h-9 w-9 shrink-0 ${!isEyeDropperSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!isEyeDropperSupported}
            >
              {isEyeDropperSupported ? (
                <Pipette className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isEyeDropperSupported 
              ? "Pick color from screen" 
              : "Color picker not supported in this browser"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
