import { cn } from '@/lib/utils';

interface StatusBoxProps {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'bad' | 'neutral';
  className?: string;
  gpMode?: boolean;
}

export default function StatusBox({ 
  label, 
  value, 
  status, 
  className, 
  gpMode = false 
}: StatusBoxProps) {
  const statusClasses = {
    good: 'bg-white border-tavern-green/30',
    warning: 'bg-white border-tavern-amber/30',
    bad: 'bg-white border-tavern-red/30',
    neutral: 'bg-white border-tavern-blue-light/20'
  };
  
  const getFontSize = () => {
    const length = value.length;
    if (length <= 4) return 'text-3xl sm:text-4xl';
    if (length <= 6) return 'text-2xl sm:text-3xl';
    if (length <= 8) return 'text-xl sm:text-2xl';
    return 'text-lg sm:text-xl';
  };

  const getGPStatus = () => {
    if (!gpMode) return status;
    
    const numValue = parseFloat(value.replace('%', ''));
    
    if (label === 'Weekly GP %') {
      return numValue < 70 ? 'bad' : 'good';
    }
    
    if (label === 'Variance') {
      return numValue < 0 ? 'bad' : 'good';
    }
    
    return status;
  };

  const getTextColor = () => {
    const calculatedStatus = gpMode ? getGPStatus() : status;
    switch (calculatedStatus) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-amber-600'; 
      case 'bad': return 'text-red-600';
      default: return 'text-[#48495E]';
    }
  };

  return (
    <div className={cn(
      'rounded-xl p-4 flex flex-col items-center justify-center border shadow-sm glass-morphism h-28 min-w-[150px]',
      statusClasses[gpMode ? getGPStatus() : status],
      className
    )}>
      <h3 className="text-sm font-medium opacity-80 mb-1">{label}</h3>
      <p className={cn(
        'font-bold truncate w-full text-center',
        getFontSize(),
        getTextColor()
      )}>
        {value}
      </p>
    </div>
  );
}
