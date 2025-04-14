
import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserCheck, UserCog, UserPlus, Mail, AlertCircle, Trash2, MoreVertical, CalendarIcon, Image, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { UserProfile } from '@/types/supabase-types';
import { useAuthStore } from '@/services/auth-service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from 'date-fns';
import { cn } from "@/lib/utils";

// Define the response data interface for the invitation API
interface InvitationResponse {
  success?: boolean;
  error?: string;
  message?: string;
  invitationUrl?: string;
  existingInvitation?: boolean;
}

const TeamManagementPanel: React.FC = () => {
  const { profile: currentUserProfile } = useAuthStore();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'Team Member',
    jobTitle: ''
  });
  
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: '',
    jobTitle: '',
    birthDate: undefined as Date | undefined,
    favouriteDish: '',
    favouriteDrink: '',
    aboutMe: ''
  });
  
  const isGod = currentUserProfile?.role === 'GOD';
  const isSuperUser = currentUserProfile?.role === 'Super User';
  const canManageUsers = isGod || isSuperUser;
  
  useEffect(() => {
    fetchTeamMembers();
  }, []);
  
  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false });
        
      if (error) throw error;
      
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddUser = async () => {
    try {
      if (!newUser.email || !newUser.firstName || !newUser.lastName || !newUser.role) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      const invitationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);
      
      console.log("Sending invitation request with data:", {
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        jobTitle: newUser.jobTitle,
        created_by: currentUserProfile?.id,
        invitationToken
      });
      
      // Fix: Use the full URL with the Supabase project reference
      const functionUrl = 'https://kfiergoryrnjkewmeriy.supabase.co/functions/v1/send-user-invitation';
      console.log("Calling edge function at:", functionUrl);
      
      // Get the current session token for authorization
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add the authorization header with the proper token
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          invitationToken,
          role: newUser.role,
          jobTitle: newUser.jobTitle,
          created_by: currentUserProfile?.id
        })
      });
      
      console.log("Received response with status:", response.status);
      
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      // Make sure we have a response before trying to parse it
      let responseData: InvitationResponse = {}; // Use the defined interface
      try {
        if (responseText) {
          responseData = JSON.parse(responseText) as InvitationResponse;
          console.log("Parsed response data:", responseData);
        } else {
          throw new Error("Empty response from server");
        }
      } catch (parseError) {
        console.error("Error parsing response JSON:", parseError);
        toast.error('Invalid response from server');
        return;
      }
      
      if (!response.ok) {
        if (response.status === 409 && responseData.existingInvitation) {
          toast.error('An invitation has already been sent to this email address');
          return;
        }
        
        throw new Error(responseData.error || 'Failed to send invitation');
      }
      
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        role: 'Team Member',
        jobTitle: ''
      });
      
      setIsAddUserDialogOpen(false);
      
      fetchTeamMembers();
      
      toast.success(`An invitation has been sent to ${newUser.email}`);
      
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to invite user');
    }
  };
  
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedUser) return;
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image size should be less than 4MB');
      return;
    }
    
    try {
      setUploadingAvatar(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedUser.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', selectedUser.id);
        
      if (updateError) throw updateError;
      
      setTeamMembers(teamMembers.map(member => 
        member.id === selectedUser.id 
          ? { ...member, avatar_url: publicUrl } 
          : member
      ));
      
      toast.success('Profile picture updated');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      const updateData: any = {
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        role: editForm.role,
        job_title: editForm.jobTitle,
        favourite_dish: editForm.favouriteDish,
        favourite_drink: editForm.favouriteDrink,
        about_me: editForm.aboutMe
      };
      
      if (editForm.birthDate) {
        const formattedBirthDate = format(editForm.birthDate, 'MM-dd');
        const { data: columnInfo, error: columnError } = await supabase
          .from('profiles')
          .select('birth_date')
          .limit(1);
        
        if (!columnError) {
          updateData.birth_date = formattedBirthDate;
        } else {
          console.log('birth_date column not found, skipping this field');
        }
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      setTeamMembers(teamMembers.map(member => 
        member.id === selectedUser.id 
          ? { 
              ...member, 
              first_name: editForm.firstName,
              last_name: editForm.lastName,
              role: editForm.role as any, 
              job_title: editForm.jobTitle,
              birth_date: updateData.birth_date,
              favourite_dish: editForm.favouriteDish,
              favourite_drink: editForm.favouriteDrink,
              about_me: editForm.aboutMe
            } 
          : member
      ));
      
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      
      toast.success(`${editForm.firstName}'s profile has been updated`);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user profile');
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setDeleteLoading(true);
      
      if (selectedUser.id === currentUserProfile?.id) {
        toast.error("You cannot delete your own account");
        return;
      }
      
      if (selectedUser.role === 'GOD' && !isGod) {
        toast.error("Only GOD users can delete other GOD users");
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      setTeamMembers(teamMembers.filter(member => member.id !== selectedUser.id));
      
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      
      toast.success(`${selectedUser.first_name}'s profile has been deleted`);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user profile');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    let birthDate: Date | undefined = undefined;
    
    if (user.birth_date) {
      try {
        const parsedDate = parse(user.birth_date, 'MM-dd', new Date());
        if (!isNaN(parsedDate.getTime())) {
          birthDate = parsedDate;
        }
      } catch (error) {
        console.error('Error parsing birth date:', error);
      }
    }
    
    setEditForm({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      role: user.role || 'Team Member',
      jobTitle: user.job_title || '',
      birthDate: birthDate,
      favouriteDish: user.favourite_dish || '',
      favouriteDrink: user.favourite_drink || '',
      aboutMe: user.about_me || ''
    });
    
    setIsEditUserDialogOpen(true);
  };
  
  const openDeleteDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <UserCheck className="h-6 w-6" /> Team Management
          </CardTitle>
          <CardDescription>
            Manage team members and their permissions
          </CardDescription>
          {canManageUsers && (
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6">
              <p>Loading team members...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Job Title</TableHead>
                  {canManageUsers && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={member.avatar_url || undefined} alt={`${member.first_name} ${member.last_name}`} />
                          <AvatarFallback>{`${member.first_name?.charAt(0) || ''} ${member.last_name?.charAt(0) || ''}`}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.first_name} {member.last_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.role || 'Team Member'}</TableCell>
                    <TableCell>{member.job_title || '-'}</TableCell>
                    {canManageUsers && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => openEditDialog(member)}
                              disabled={member.role === 'GOD' && !isGod}
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(member)}
                              disabled={member.role === 'GOD' && !isGod}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Team Member</DialogTitle>
            <DialogDescription>
              Fill out the form to invite a new team member
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="Email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title (Optional)</Label>
              <Input 
                id="jobTitle" 
                value={newUser.jobTitle}
                onChange={(e) => setNewUser({...newUser, jobTitle: e.target.value})}
                placeholder="Job title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={newUser.role} 
                onValueChange={(value) => setNewUser({...newUser, role: value})}
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
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update profile details for {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={selectedUser?.avatar_url || undefined} alt={`${selectedUser?.first_name} ${selectedUser?.last_name}`} />
                <AvatarFallback className="text-xl">{`${selectedUser?.first_name?.charAt(0) || ''} ${selectedUser?.last_name?.charAt(0) || ''}`}</AvatarFallback>
              </Avatar>
              
              <div className="flex items-center">
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
                    <Upload className="h-4 w-4" />
                    <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                  </div>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input 
                  id="editFirstName" 
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input 
                  id="editLastName" 
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select 
                value={editForm.role} 
                onValueChange={(value) => setEditForm({...editForm, role: value})}
                disabled={(selectedUser?.role === 'GOD' && !isGod)}
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
                value={editForm.jobTitle}
                onChange={(e) => setEditForm({...editForm, jobTitle: e.target.value})}
                placeholder="Job title"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Birthday</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editForm.birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editForm.birthDate ? format(editForm.birthDate, "MMMM dd") : <span>No birthday set</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editForm.birthDate}
                    onSelect={(date) => {
                      if (date) {
                        const currentYear = new Date().getFullYear();
                        date.setFullYear(currentYear);
                        setEditForm({...editForm, birthDate: date});
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    captionLayout="buttons"
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editFavouriteDish">Favourite Dish</Label>
              <Input 
                id="editFavouriteDish" 
                value={editForm.favouriteDish}
                onChange={(e) => setEditForm({...editForm, favouriteDish: e.target.value})}
                placeholder="What's their favourite dish?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editFavouriteDrink">Favourite Drink</Label>
              <Input 
                id="editFavouriteDrink" 
                value={editForm.favouriteDrink}
                onChange={(e) => setEditForm({...editForm, favouriteDrink: e.target.value})}
                placeholder="What's their favourite drink?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editAboutMe">About Me</Label>
              <Textarea 
                id="editAboutMe" 
                value={editForm.aboutMe}
                onChange={(e) => setEditForm({...editForm, aboutMe: e.target.value})}
                placeholder="Tell us a bit about them..."
                className="min-h-[100px]"
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
            <Button onClick={handleEditUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedUser?.first_name} {selectedUser?.last_name}'s
              account and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TeamManagementPanel;
