
import { cn } from '@/lib/utils';

interface StatusBoxProps {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'bad' | 'neutral';
  className?: string;
}

export default function StatusBox({ label, value, status, className }: StatusBoxProps) {
  const statusClasses = {
    good: 'bg-tavern-green-light text-tavern-blue',
    warning: 'bg-tavern-amber text-tavern-blue',
    bad: 'bg-tavern-red text-white',
    neutral: 'bg-tavern-blue-light text-tavern-blue'
  };
  
  return (
    <div className={cn(
      'rounded-lg p-4 flex flex-col items-center justify-center',
      statusClasses[status],
      className
    )}>
      <h3 className="text-sm font-medium opacity-80">{label}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
