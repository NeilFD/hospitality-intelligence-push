
import React from 'react';
import { Link } from 'react-router-dom';
import { User, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type UserProfilesTableProps = {
  profiles: any[];
  isLoading: boolean;
  searchTerm: string;
  onClearSearch: () => void;
};

export default function UserProfilesTable({ profiles, isLoading, searchTerm, onClearSearch }: UserProfilesTableProps) {
  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'GOD':
        return 'destructive';
      case 'Super User':
      case 'OWNER':
        return 'secondary'; // Changed from 'purple' to 'secondary'
      case 'Manager':
        return 'secondary'; // Changed from 'blue' to 'secondary'
      case 'Team Member':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '??';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading user profiles...</p>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <User className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No user profiles found</p>
        {searchTerm && (
          <Button variant="link" onClick={onClearSearch}>
            Clear search
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell className="py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
                    <AvatarFallback>{getInitials(profile.first_name, profile.last_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {profile.first_name} {profile.last_name}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(profile.role)}>
                  {profile.role || 'Team Member'}
                </Badge>
              </TableCell>
              <TableCell>{profile.job_title || '-'}</TableCell>
              <TableCell className="text-right">
                <Link to={`/profile/${profile.id}`}>
                  <Button size="sm" variant="ghost" className="flex items-center gap-1">
                    <span>View Profile</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
