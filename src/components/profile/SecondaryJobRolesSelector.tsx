
import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SafeErrorBoundary } from '@/components/ui/safe-error-boundary';

// Job title options from the main profile
const FOH_JOB_TITLES = [
  "Owner",
  "General Manager",
  "Assistant Manager",
  "Bar Supervisor",
  "FOH Supervisor",
  "FOH Team",
  "Bar Team",
  "Runner"
];

const BOH_JOB_TITLES = [
  "Head Chef",
  "Sous Chef",
  "Chef de Partie",
  "Commis Chef",
  "KP"
];

// All job titles combined
const JOB_TITLES = [...FOH_JOB_TITLES, ...BOH_JOB_TITLES];

interface SecondaryJobRolesSelectorProps {
  selectedRoles: string[] | null | undefined;
  onChange: (roles: string[]) => void;
  mainJobTitle?: string;
  disabled?: boolean;
}

export default function SecondaryJobRolesSelector({ 
  selectedRoles, 
  onChange, 
  mainJobTitle, 
  disabled = false 
}: SecondaryJobRolesSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Create a safe local copy of the selected roles
  const [localSelectedRoles, setLocalSelectedRoles] = React.useState<string[]>([]);
  
  // Sync local state with props whenever selectedRoles changes
  React.useEffect(() => {
    if (Array.isArray(selectedRoles)) {
      setLocalSelectedRoles(selectedRoles);
    } else {
      setLocalSelectedRoles([]);
    }
  }, [selectedRoles]);
  
  // Filter out the main job title from available options
  const availableJobTitles = React.useMemo(() => {
    return JOB_TITLES.filter(title => title !== mainJobTitle);
  }, [mainJobTitle]);

  // Further filter by search term
  const filteredJobTitles = React.useMemo(() => {
    return availableJobTitles.filter(title => 
      title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableJobTitles, searchTerm]);
  
  const handleSelect = (role: string) => {
    if (localSelectedRoles.includes(role)) {
      // If already selected, remove it
      const updatedRoles = localSelectedRoles.filter(r => r !== role);
      setLocalSelectedRoles(updatedRoles);
      onChange(updatedRoles);
    } else {
      // If not selected, add it
      const updatedRoles = [...localSelectedRoles, role];
      setLocalSelectedRoles(updatedRoles);
      onChange(updatedRoles);
    }
    // Don't close the popover to allow multiple selections
  };

  const handleRemove = (role: string) => {
    const updatedRoles = localSelectedRoles.filter(r => r !== role);
    setLocalSelectedRoles(updatedRoles);
    onChange(updatedRoles);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {localSelectedRoles.map(role => (
          <Badge 
            key={role} 
            variant="secondary" 
            className="flex items-center gap-1 pl-2 pr-1 py-1"
          >
            {role}
            {!disabled && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 rounded-full" 
                onClick={() => handleRemove(role)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {role}</span>
              </Button>
            )}
          </Badge>
        ))}
      </div>
      
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 border-dashed"
            >
              Add secondary roles
            </Button>
          </PopoverTrigger>
          
          <SafeErrorBoundary>
            <PopoverContent className="p-4 w-56 bg-white shadow-md z-50" align="start">
              <div className="space-y-4">
                {/* Search input */}
                <div>
                  <input
                    type="text"
                    placeholder="Search for roles"
                    className="w-full px-3 py-1 text-sm border rounded"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Role list */}
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {filteredJobTitles.length > 0 ? (
                    filteredJobTitles.map(role => (
                      <div 
                        key={role} 
                        className={`
                          flex items-center gap-2 px-2 py-1 text-sm rounded cursor-pointer
                          ${localSelectedRoles.includes(role) ? 'bg-green-50' : 'hover:bg-gray-100'}
                        `}
                        onClick={() => handleSelect(role)}
                      >
                        <div className={`
                          w-4 h-4 border rounded flex items-center justify-center
                          ${localSelectedRoles.includes(role) ? 'bg-green-500 border-green-500' : 'border-gray-300'}
                        `}>
                          {localSelectedRoles.includes(role) && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.5 2.5L3.5 7.5L1.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span>{role}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-sm text-gray-500">No roles found</div>
                  )}
                </div>
                
                {/* Done button */}
                <Button 
                  variant="default"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setOpen(false)}
                >
                  Done
                </Button>
              </div>
            </PopoverContent>
          </SafeErrorBoundary>
        </Popover>
      )}
    </div>
  );
}
