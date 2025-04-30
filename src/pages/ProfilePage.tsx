
import React from 'react';
import SecondaryJobRolesSelector from '@/components/profile/SecondaryJobRolesSelector';

const ProfilePage = () => {
  const [secondaryRoles, setSecondaryRoles] = React.useState<string[]>([]);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium mb-4">Job Roles</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Job Roles
            </label>
            <SecondaryJobRolesSelector
              selectedRoles={secondaryRoles}
              onChange={setSecondaryRoles}
              mainJobTitle="Bar Supervisor"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
