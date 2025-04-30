
import React from 'react';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandInput, CommandItem } from '@/components/ui/command';
import { SafeCommandGroup } from '@/components/ui/safe-command-group';
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
  
  // Create a safe local copy of the selected roles
  const [localSelectedRoles, setLocalSelectedRoles] = React.useState<string[]>([]);
  
  // Sync local state with props whenever selectedRoles changes
  React.useEffect(() => {
    // Safely handle the incoming selectedRoles
    if (Array.isArray(selectedRoles)) {
      setLocalSelectedRoles(selectedRoles);
    } else {
      setLocalSelectedRoles([]);
    }
  }, [selectedRoles]);
  
  // Filter out the main job title from available options
  const availableJobTitles = React.useMemo(() => {
    if (!JOB_TITLES || JOB_TITLES.length === 0) return [];
    return JOB_TITLES.filter(title => title !== mainJobTitle);
  }, [mainJobTitle]);
  
  const handleSelect = (role: string) => {
    // Use localSelectedRoles for consistent state management
    const updatedRoles = localSelectedRoles.includes(role)
      ? localSelectedRoles.filter(r => r !== role)
      : [...localSelectedRoles, role];
      
    // Update both local state and parent component
    setLocalSelectedRoles(updatedRoles);
    onChange(updatedRoles);
  };

  const handleRemove = (role: string) => {
    const updatedRoles = localSelectedRoles.filter(r => r !== role);
    setLocalSelectedRoles(updatedRoles);
    onChange(updatedRoles);
  };
  
  // Check if we have valid job titles to display - ensure we have an actual array with items
  const hasAvailableJobTitles = Array.isArray(availableJobTitles) && availableJobTitles.length > 0;

  // Force open state for debugging
  const handleOpenPopover = () => {
    setOpen(true);
    console.log('Opening popover, available job titles:', availableJobTitles);
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
        <Popover 
          open={open} 
          onOpenChange={setOpen}
        >
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 border-dashed"
              onClick={handleOpenPopover}
            >
              Add secondary roles
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 z-50 bg-white shadow-md w-56" align="start">
            {hasAvailableJobTitles ? (
              <SafeErrorBoundary>
                <Command>
                  <CommandInput placeholder="Search for roles..." />
                  <CommandEmpty>No roles found.</CommandEmpty>
                  
                  {/* Ensure we only render the command group when there are items */}
                  <div className="max-h-[200px] overflow-y-auto overflow-x-hidden">
                    {availableJobTitles.length > 0 && (
                      <ul className="py-1">
                        {availableJobTitles.map(role => (
                          <CommandItem
                            key={role}
                            value={role}
                            onSelect={() => {
                              handleSelect(role);
                              // Close popover after selection
                              setOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 flex items-center justify-center">
                                {localSelectedRoles.includes(role) && <Check className="h-3 w-3" />}
                              </div>
                              <span>{role}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </ul>
                    )}
                  </div>
                </Command>
              </SafeErrorBoundary>
            ) : (
              <div className="p-2 text-sm text-center">No available roles to select</div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
