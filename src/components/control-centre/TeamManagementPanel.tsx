
import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCheck, UserCog, UserPlus, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { UserProfile } from '@/types/supabase-types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/services/auth-service';

interface TeamManagementPanelProps {
  profiles?: UserProfile[];
  loading?: boolean;
}

const TeamManagementPanel: React.FC<TeamManagementPanelProps> = ({ profiles = [], loading = false }) => {
  const { toast } = useToast();
  const { profile: currentUserProfile } = useAuthStore();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(loading);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  
  // Form state for new user
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'Team Member',
    jobTitle: ''
  });
  
  // Form state for editing user
  const [editForm, setEditForm] = useState({
    role: '',
    jobTitle: ''
  });
  
  const isGod = currentUserProfile?.role === 'GOD';
  const isSuperUser = currentUserProfile?.role === 'Super User';
  const canManageUsers = isGod || isSuperUser;
  
  useEffect(() => {
    fetchTeamMembers();
  }, []);
  
  const fetchTeamMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false });
        
      if (error) throw error;
      
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive'
      });
    } finally {
      setLoadingMembers(false);
    }
  };
  
  const handleAddUser = async () => {
    try {
      if (!newUser.email || !newUser.firstName || !newUser.lastName || !newUser.role) {
        toast({
          title: 'Missing information',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }
      
      // Generate a random token for the invitation
      const invitationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);
      
      // Create an invitation record in the database
      const { error: inviteError } = await supabase
        .from('user_invitations')
        .insert({
          email: newUser.email,
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          role: newUser.role,
          job_title: newUser.jobTitle,
          created_by: currentUserProfile?.id,
          invitation_token: invitationToken
        });
        
      if (inviteError) throw inviteError;
      
      // Call the edge function to send the invitation email
      const response = await fetch('https://kfiergoryrnjkewmeriy.supabase.co/functions/v1/send-user-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          email: newUser.email,
          firstName: newUser.firstName,
          invitationToken
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }
      
      setInviteSuccess(true);
      
      // Reset form
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        role: 'Team Member',
        jobTitle: ''
      });
      
      // Show success message
      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${newUser.email}`,
      });
      
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to invite user',
        variant: 'destructive'
      });
    }
  };
  
  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: editForm.role,
          job_title: editForm.jobTitle
        })
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      // Update local state
      setTeamMembers(teamMembers.map(member => 
        member.id === selectedUser.id 
          ? { ...member, role: editForm.role as any, job_title: editForm.jobTitle } 
          : member
      ));
      
      // Close dialog and reset
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      
      toast({
        title: 'Profile updated',
        description: `${selectedUser.first_name}'s profile has been updated`
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user profile',
        variant: 'destructive'
      });
    }
  };
  
  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role || 'Team Member',
      jobTitle: user.job_title || ''
    });
    setIsEditUserDialogOpen(true);
  };
  
  // Get initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };
  
  // Function to get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'GOD':
        return 'bg-red-100 text-red-800';
      case 'Super User':
        return 'bg-purple-100 text-purple-800';
      case 'Manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-hi-purple" /> Team Management
            </CardTitle>
            <CardDescription>
              Manage team members and their permissions
            </CardDescription>
          </div>
          {canManageUsers && (
            <Button onClick={() => setIsAddUserDialogOpen(true)} className="bg-hi-purple hover:bg-hi-purple-dark">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingMembers ? (
            <div className="flex justify-center p-6">
              <p>Loading team members...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Job Title</TableHead>
                    {canManageUsers && <TableHead className="w-[100px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManageUsers ? 5 : 4} className="text-center py-6">
                        No team members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={member.avatar_url || undefined} alt={`${member.first_name} ${member.last_name}`} />
                              <AvatarFallback>{getInitials(member.first_name || '', member.last_name || '')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.first_name} {member.last_name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role || '')}`}>
                            {member.role || 'Team Member'}
                          </span>
                        </TableCell>
                        <TableCell>{member.job_title || '-'}</TableCell>
                        {canManageUsers && (
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditDialog(member)}
                              disabled={member.role === 'GOD' && !isGod} // Only GOD can edit GOD
                            >
                              <UserCog className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-hi-purple" /> Invite New Team Member
            </DialogTitle>
            <DialogDescription>
              Fill out the form below to invite a new team member
            </DialogDescription>
          </DialogHeader>
          
          {inviteSuccess ? (
            <div className="py-6 flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">Invitation Sent!</h3>
              <p className="text-muted-foreground">
                An email has been sent to {newUser.email} with instructions to join the team.
              </p>
              <Button 
                onClick={() => {
                  setInviteSuccess(false);
                  setIsAddUserDialogOpen(false);
                }}
                className="mt-2"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input 
                      id="firstName" 
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName" 
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="Email address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input 
                    id="jobTitle" 
                    value={newUser.jobTitle}
                    onChange={(e) => setNewUser({...newUser, jobTitle: e.target.value})}
                    placeholder="Job title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => setNewUser({...newUser, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {isGod && (
                        <SelectItem value="Super User">Super User</SelectItem>
                      )}
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Team Member">Team Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <p>An invitation email will be sent to the user with a link to set their password</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddUserDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddUser}
                  className="bg-hi-purple hover:bg-hi-purple-dark"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-hi-purple" /> Edit Team Member
            </DialogTitle>
            <DialogDescription>
              Update role and details for {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select 
                value={editForm.role} 
                onValueChange={(value) => setEditForm({...editForm, role: value})}
                disabled={selectedUser?.role === 'GOD' && !isGod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {isGod && (
                    <>
                      <SelectItem value="GOD">GOD</SelectItem>
                      <SelectItem value="Super User">Super User</SelectItem>
                    </>
                  )}
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Team Member">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editJobTitle">Job Title</Label>
              <Input 
                id="editJobTitle" 
                value={editForm.jobTitle || ''}
                onChange={(e) => setEditForm({...editForm, jobTitle: e.target.value})}
                placeholder="Job title"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditUser}
              className="bg-hi-purple hover:bg-hi-purple-dark"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeamManagementPanel;
