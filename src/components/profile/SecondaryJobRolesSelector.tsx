
import React from 'react';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
    // Safely handle the incoming selectedRoles
    if (Array.isArray(selectedRoles)) {
      setLocalSelectedRoles(selectedRoles);
    } else {
      setLocalSelectedRoles([]);
    }
  }, [selectedRoles]);
  
  // Filter out the main job title from available options
  const availableJobTitles = React.useMemo(() => {
    // Make sure JOB_TITLES exists and is an array
    return JOB_TITLES.filter(title => title !== mainJobTitle);
  }, [mainJobTitle]);

  // Filter job titles based on search term
  const filteredJobTitles = React.useMemo(() => {
    return availableJobTitles.filter(title => 
      title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableJobTitles, searchTerm]);
  
  const handleSelect = (role: string) => {
    // Use localSelectedRoles for consistent state management
    const updatedRoles = localSelectedRoles.includes(role)
      ? localSelectedRoles.filter(r => r !== role)
      : [...localSelectedRoles, role];
      
    // Update both local state and parent component
    setLocalSelectedRoles(updatedRoles);
    onChange(updatedRoles);
    // We no longer close the dropdown here
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
          
          <PopoverContent 
            className="p-0 w-[200px] bg-white shadow-lg border border-gray-200 rounded-md z-[100]" 
            align="start"
            sideOffset={5}
          >
            <div className="max-h-[200px] overflow-y-auto">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search for roles..."
                  className="w-full p-2 border border-gray-200 rounded-md text-sm mb-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="p-1">
                {filteredJobTitles.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">No roles found.</div>
                ) : (
                  filteredJobTitles.map(role => (
                    <div
                      key={role}
                      onClick={() => handleSelect(role)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer text-sm"
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        {localSelectedRoles.includes(role) && <Check className="h-3 w-3" />}
                      </div>
                      <span>{role}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
