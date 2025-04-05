
import { cn } from '@/lib/utils';

interface StatusBoxProps {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'bad' | 'neutral';
  className?: string;
}

export default function StatusBox({ label, value, status, className }: StatusBoxProps) {
  const statusClasses = {
    good: 'bg-gradient-to-br from-tavern-green-light to-tavern-green/30 text-tavern-blue-dark border-tavern-green/30',
    warning: 'bg-gradient-to-br from-tavern-amber/70 to-tavern-amber/30 text-tavern-blue-dark border-tavern-amber/30',
    bad: 'bg-gradient-to-br from-tavern-blue-light to-tavern-blue-light/50 text-tavern-blue-dark border-tavern-blue/30',
    neutral: 'bg-gradient-to-br from-tavern-blue-light/60 to-tavern-blue-light/20 text-tavern-blue-dark border-tavern-blue-light/30'
  };
  
  return (
    <div className={cn(
      'rounded-xl p-4 flex flex-col items-center justify-center border shadow-sm',
      statusClasses[status],
      className
    )}>
      <h3 className="text-sm font-medium opacity-80">{label}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
