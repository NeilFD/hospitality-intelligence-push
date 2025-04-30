
// Utility functions for the StaffRankingPanel component

export const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const formatHiScore = (score: number) => {
  if (score === 0 || !score) return 'N/A';
  return score.toFixed(1);
};

export const getRoleColor = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'owner':
      return 'bg-purple-100 text-purple-800';
    case 'manager':
      return 'bg-blue-100 text-blue-800';
    case 'team member':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
