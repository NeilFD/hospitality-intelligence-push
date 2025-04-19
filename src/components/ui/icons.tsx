import React from 'react';
import { 
  Cloud, 
  CloudRain, 
  CloudSun, 
  Thermometer as ThermometerIcon, 
  Droplets as DropletsIcon, 
  Wind as WindIcon, 
  Check, 
  AlertTriangle,
  Info 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export const WeatherIcon = ({ description }: { description: string }) => {
  const desc = description.toLowerCase();
  
  if (desc.includes('rain') || desc.includes('shower') || desc.includes('drizzle')) {
    return <CloudRain className="h-5 w-5 text-blue-500" />;
  } else if (desc.includes('cloud') || desc.includes('overcast')) {
    return <Cloud className="h-5 w-5 text-gray-500" />;
  } else {
    return <CloudSun className="h-5 w-5 text-yellow-500" />;
  }
};

// Re-export the icons with their original names
export const Thermometer = ThermometerIcon;
export const Droplets = DropletsIcon;
export const Wind = WindIcon;

export const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
  let color = "bg-red-100 text-red-800";
  let icon = <AlertTriangle size={12} className="mr-1" />;
  
  if (confidence >= 80) {
    color = "bg-green-100 text-green-800";
    icon = <Check size={12} className="mr-1" />;
  } else if (confidence >= 60) {
    color = "bg-yellow-100 text-yellow-800";
    icon = <AlertTriangle size={12} className="mr-1" />;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
            {icon}
            {confidence}%
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px] text-sm">
          <div className="flex items-center gap-2">
            <Info size={16} />
            <p>
              Confidence is based on historical data availability and weather conditions. 
              More historical data and stable weather increase confidence. 
              Unpredictable factors like heavy precipitation can reduce forecast reliability.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
