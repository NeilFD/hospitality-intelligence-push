
import React from 'react';
import { Cloud, CloudRain, CloudSun, Thermometer, Droplets, Wind, Check, AlertTriangle } from 'lucide-react';

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

export const Thermometer = Thermometer;
export const Droplets = Droplets;
export const Wind = Wind;

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
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {icon}
      {confidence}%
    </span>
  );
};
