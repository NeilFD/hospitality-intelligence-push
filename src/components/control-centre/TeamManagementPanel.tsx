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
import { UserCheck, UserCog, UserPlus, Share2, Copy, AlertCircle, Trash2, MoreVertical, CalendarIcon, Image, Upload, Mail, MessageSquare, Link2 } from 'lucide-react';
import { supabase, checkProfilesCount, directSignUp, adminUpdateUserPassword } from '@/lib/supabase';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserRoleType = 'GOD' | 'Super User' | 'Manager' | 'Team Member' | 'Owner';

const TeamManagementPanel: React.FC = () => {
  const { profile: currentUserProfile } = useAuthStore();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isAddProfileDialogOpen, setIsAddProfileDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: '' as UserRoleType,
    jobTitle: '',
    birthDate: undefined as Date | undefined,
    favouriteDish: '',
    favouriteDrink: '',
    aboutMe: '',
    password: ''
  });
  
  const [newProfileForm, setNewProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Team Member' as UserRoleType,
    jobTitle: '',
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
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false });
        
      if (error) throw error;
      
      setTeamMembers(data as UserProfile[] || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
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
        updateData.birth_date = formattedBirthDate;
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedUser.id);
        
      if (profileError) {
        console.error('Error updating profile:', profileError);
        toast.error('Failed to update profile: ' + profileError.message);
        return;
      }
      
      let passwordUpdateSuccess = true;
      let passwordMessage = '';
      
      if (editForm.password && editForm.password.trim() !== '' && canManageUsers) {
        if (editForm.password.length < 8) {
          toast.error('Password must be at least 8 characters long');
          return;
        }
        
        try {
          console.log('Attempting password update for user:', selectedUser.id);
          
          console.log('User ID type:', typeof selectedUser.id);
          
          toast.loading('Updating password...', { id: 'password-update' });
          
          const result = await adminUpdateUserPassword(selectedUser.id, editForm.password);
          
          toast.dismiss('password-update');
          
          console.log('Password update result:', result);
          
          if (result === false) {
            toast.error('Password update failed - please contact your system administrator');
            passwordUpdateSuccess = false;
            passwordMessage = ' but password update failed';
          } else {
            toast.success('Password has been updated successfully');
          }
        } catch (err) {
          console.error('Exception during password update:', err);
          toast.error('Error updating password: ' + (err instanceof Error ? err.message : String(err)));
          passwordUpdateSuccess = false;
          passwordMessage = ' but password update failed';
        }
      }
      
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
      
      toast.success(`${editForm.firstName}'s profile has been updated${passwordMessage}`);
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
      role: (user.role || 'Team Member') as UserRoleType,
      jobTitle: user.job_title || '',
      birthDate: birthDate,
      favouriteDish: user.favourite_dish || '',
      favouriteDrink: user.favourite_drink || '',
      aboutMe: user.about_me || '',
      password: ''
    });
    
    setIsEditUserDialogOpen(true);
  };
  
  const openDeleteDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCreateProfile = async () => {
    if (!newProfileForm.firstName || !newProfileForm.lastName || !newProfileForm.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      toast.loading('Creating profile...', { id: 'create-profile' });
      
      const result = await directSignUp(
        newProfileForm.email,
        newProfileForm.firstName,
        newProfileForm.lastName,
        newProfileForm.role,
        newProfileForm.jobTitle
      );
      
      toast.dismiss('create-profile');
      
      if (result && (result.profile || result.user)) {
        console.log('User creation successful:', result);
        
        setNewProfileForm({
          firstName: '',
          lastName: '',
          email: '',
          role: 'Team Member',
          jobTitle: '',
        });
        
        setIsAddProfileDialogOpen(false);
        
        if (result.user && result.user.id) {
          toast.success('Profile created successfully');
          await fetchTeamMembers();
        } else {
          toast.error('Profile creation may have failed - please check the list');
          await fetchTeamMembers();
        }
      } else {
        toast.error('Failed to create profile - no data returned');
        console.error('Failed to create profile, result:', result);
      }
    } catch (error: any) {
      toast.dismiss('create-profile');
      
      console.error('Error creating profile:', error);
      
      if (error.message?.includes('User already registered')) {
        toast.error('A user with this email already exists');
      } else if (error.message?.includes('permission denied') || error.message?.includes('not allowed')) {
        toast.error('Permission denied. You may not have admin privileges to create users.');
      } else {
        toast.error('Failed to create profile: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  
  const openEmailDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setIsEmailDialogOpen(true);
  };
  
  const getSignupInstructions = (user: UserProfile | null) => {
    if (!user) return '';
    
    return `Hello ${user.first_name},
    
We've created an account for you in our team management system.

To get started:
1. Go to: ${window.location.origin}/login
2. Enter your email: ${user.email}
3. [ADD PASSWORD] - Please add a password for this user
4. After logging in, they should update their password in profile settings

Looking forward to having you on the team!

Best regards,
${currentUserProfile?.first_name || 'The Management Team'}`;
  };
  
  const handleOpenEmail = (user: UserProfile | null) => {
    if (!user || !user.email) return;
    
    const subject = 'Your New Account Details';
    const body = encodeURIComponent(getSignupInstructions(user));
    window.open(`mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${body}`);
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
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.role || 'Team Member'}</TableCell>
                    <TableCell>{member.job_title || '-'}</TableCell>
                    {canManageUsers && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          
                          
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
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select 
                  value={editForm.role} 
                  onValueChange={(value: UserRoleType) => setEditForm({...editForm, role: value})}
                  disabled={selectedUser?.role === 'GOD' && !isGod}
                >
                  <SelectTrigger id="editRole">
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
                    <SelectItem value="Owner">Owner</SelectItem>
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birthday (Month-Day)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id="birthDate"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editForm.birthDate ? (
                      format(editForm.birthDate, "MMMM d")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editForm.birthDate}
                    onSelect={(date) => setEditForm({...editForm, birthDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Only month and day will be stored (not the year)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="favouriteDish">Favourite Dish</Label>
              <Input 
                id="favouriteDish" 
                value={editForm.favouriteDish}
                onChange={(e) => setEditForm({...editForm, favouriteDish: e.target.value})}
                placeholder="Favourite dish"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="favouriteDrink">Favourite Drink</Label>
              <Input 
                id="favouriteDrink" 
                value={editForm.favouriteDrink}
                onChange={(e) => setEditForm({...editForm, favouriteDrink: e.target.value})}
                placeholder="Favourite drink"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="aboutMe">About Me</Label>
              <Textarea 
                id="aboutMe" 
                value={editForm.aboutMe}
                onChange={(e) => setEditForm({...editForm, aboutMe: e.target.value})}
                placeholder="Share something about yourself"
                className="min-h-[100px]"
              />
            </div>
            
            {canManageUsers && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  Set Password
                  {selectedUser?.id && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Leave blank to keep unchanged)
                    </span>
                  )}
                </Label>
                <Input 
                  id="password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                  placeholder="Enter new password"
                />
                <p className="text-xs text-muted-foreground">
                  Must contain at least 8 characters
                </p>
              </div>
            )}
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
            >
              <UserCog className="mr-2 h-4 w-4" />
              Update Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedUser?.first_name} {selectedUser?.last_name}'s profile
              and remove their access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isAddProfileDialogOpen} onOpenChange={setIsAddProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Team Member</DialogTitle>
            <DialogDescription>
              Create a new team member profile directly in the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="required">First Name</Label>
                <Input 
                  id="firstName" 
                  value={newProfileForm.firstName}
                  onChange={(e) => setNewProfileForm({...newProfileForm, firstName: e.target.value})}
                  placeholder="First name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="required">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={newProfileForm.lastName}
                  onChange={(e) => setNewProfileForm({...newProfileForm, lastName: e.target.value})}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="required">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={newProfileForm.email}
                onChange={(e) => setNewProfileForm({...newProfileForm, email: e.target.value})}
                placeholder="Email address"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={newProfileForm.role} 
                  onValueChange={(value: UserRoleType) => setNewProfileForm({...newProfileForm, role: value})}
                >
                  <SelectTrigger id="role">
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
                    <SelectItem value="Owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input 
                  id="jobTitle" 
                  value={newProfileForm.jobTitle}
                  onChange={(e) => setNewProfileForm({...newProfileForm, jobTitle: e.target.value})}
                  placeholder="Job title"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddProfileDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProfile}
              disabled={loading}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Account Instructions</DialogTitle>
            <DialogDescription>
              Instructions for {selectedUser?.first_name} {selectedUser?.last_name} to set up their account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md relative">
              <pre className="text-xs whitespace-pre-wrap">{getSignupInstructions(selectedUser)}</pre>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2" 
                onClick={() => handleCopyToClipboard(getSignupInstructions(selectedUser))}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => handleOpenEmail(selectedUser)}>
              <Mail className="mr-2 h-4 w-4" />
              Open Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeamManagementPanel;
