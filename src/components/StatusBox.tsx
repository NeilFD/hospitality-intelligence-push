
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
  
  return (
    <div className={cn(
      'rounded-xl p-4 flex flex-col items-center justify-center border shadow-sm',
      statusClasses[status],
      className
    )}>
      <h3 className="text-sm font-medium opacity-80">{label}</h3>
      <p className="text-xl sm:text-2xl font-bold mt-1 truncate w-full text-center">{value}</p>
    </div>
  );
}
