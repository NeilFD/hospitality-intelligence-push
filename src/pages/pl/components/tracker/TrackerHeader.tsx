import React from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Cog } from 'lucide-react';

interface TrackerHeaderProps {
  currentMonthName: string;
  currentYear: number;
  yesterdayDate: Date;
  dayOfMonth: number;
  daysInMonth: number;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onOpenSettings: () => void;
  onSaveChanges: () => void;
  onClose: () => void;
}

export function TrackerHeader({
  currentMonthName,
  currentYear,
  yesterdayDate,
  dayOfMonth,
  daysInMonth,
  hasUnsavedChanges,
  isSaving,
  onOpenSettings,
  onSaveChanges,
  onClose
}: TrackerHeaderProps) {
  return (
    <CardHeader className="bg-white/40 border-b flex flex-row items-center justify-between">
      <CardTitle>P&L Tracker - {currentMonthName} {currentYear}</CardTitle>
      <div className="flex items-center gap-2">
        <div className="text-sm">Data through: {yesterdayDate.toLocaleDateString()} (Day {dayOfMonth} of {daysInMonth})</div>
        <Button 
          onClick={onOpenSettings} 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <Cog size={16} />
          P&L Cost Management
        </Button>
        <Button 
          onClick={onSaveChanges} 
          variant="outline" 
          disabled={!hasUnsavedChanges || isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? "Saving..." : "Save Forecasts"}
        </Button>
        <Button onClick={onClose} variant="outline">Close Tracker</Button>
      </div>
    </CardHeader>
  );
}
