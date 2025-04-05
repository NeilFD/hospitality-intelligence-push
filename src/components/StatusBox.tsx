
import { cn } from '@/lib/utils';

interface StatusBoxProps {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'bad' | 'neutral';
  className?: string;
}

export default function StatusBox({ label, value, status, className }: StatusBoxProps) {
  const statusClasses = {
    good: 'bg-tavern-green-light text-tavern-blue-dark border-tavern-green',
    warning: 'bg-tavern-amber bg-opacity-20 text-tavern-blue-dark border-tavern-amber',
    bad: 'bg-tavern-blue-light text-tavern-blue-dark border-tavern-blue',
    neutral: 'bg-tavern-blue-light text-tavern-blue-dark border-tavern-blue-light'
  };
  
  return (
    <div className={cn(
      'rounded-lg p-4 flex flex-col items-center justify-center border',
      statusClasses[status],
      className
    )}>
      <h3 className="text-sm font-medium opacity-80">{label}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
