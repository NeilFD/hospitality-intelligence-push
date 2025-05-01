
import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TimePickerInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function TimePickerInput({
  className,
  value,
  onChange,
  ...props
}: TimePickerInputProps) {
  // Ensure value is in proper HH:MM format
  const formattedValue = value ? value.substring(0, 5) : '';
  
  return (
    <Input
      type="time"
      value={formattedValue}
      onChange={(e) => onChange(e.target.value)}
      className={cn("w-full", className)}
      {...props}
    />
  );
}
