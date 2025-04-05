
import { cn } from '@/lib/utils';

interface StatusBoxProps {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'bad' | 'neutral';
  className?: string;
}

export default function StatusBox({ label, value, status, className }: StatusBoxProps) {
  const statusClasses = {
    good: 'bg-tavern-green/10 backdrop-blur-sm text-tavern-blue-dark border-tavern-green/30',
    warning: 'bg-tavern-amber/10 backdrop-blur-sm text-tavern-blue-dark border-tavern-amber/30',
    bad: 'bg-tavern-blue-light/10 backdrop-blur-sm text-tavern-blue-dark border-tavern-blue/30',
    neutral: 'bg-tavern-blue-light/5 backdrop-blur-sm text-tavern-blue-dark border-tavern-blue-light/20'
  };
  
  // More advanced font size calculation
  const getFontSize = () => {
    const length = value.length;
    if (length <= 4) return 'text-3xl sm:text-4xl';
    if (length <= 6) return 'text-2xl sm:text-3xl';
    if (length <= 8) return 'text-xl sm:text-2xl';
    return 'text-lg sm:text-xl';
  };

  return (
    <div className={cn(
      'rounded-xl p-4 flex flex-col items-center justify-center border shadow-sm glass-morphism h-28 min-w-[150px]',
      statusClasses[status],
      className
    )}>
      <h3 className="text-sm font-medium opacity-80 mb-1">{label}</h3>
      <p className={cn(
        'font-bold truncate w-full text-center',
        getFontSize()
      )}>
        {value}
      </p>
    </div>
  );
}
