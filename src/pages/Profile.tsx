
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/services/auth-service';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Camera } from 'lucide-react';

const Profile = () => {
  const { user, profile, loadUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Owner' | 'Head Chef' | 'Staff'>('Staff');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setRole((profile.role as 'Owner' | 'Head Chef' | 'Staff') || 'Staff');
      setAvatarUrl(profile.avatar_url);
    }
    
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);
  
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          role: role
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      await loadUser();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(`Error updating profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !user) {
        return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      setUploadingAvatar(true);
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      const avatarUrl = data.publicUrl;
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setAvatarUrl(avatarUrl);
      await loadUser();
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      toast.error(`Error uploading avatar: ${error.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  const getUserInitials = () => {
    if (!profile) return '?';
    
    const first = profile.first_name || '';
    const last = profile.last_name || '';
    
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };
  
  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-tavern-blue mb-6 text-center">User Profile</h1>
      
      <Card className="shadow-lg">
        <CardHeader className="pb-2 border-b border-tavern-blue-light/20 bg-white/40">
          <CardTitle className="text-tavern-blue-dark text-xl">
            Personal Information
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-2 border-tavern-blue">
                  {avatarUrl ? (
                    <AvatarImage 
                      src={avatarUrl} 
                      alt="Profile" 
                      className="object-cover" 
                    />
                  ) : (
                    <AvatarFallback className="bg-tavern-blue text-white text-2xl">
                      {getUserInitials()}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
                  <Label 
                    htmlFor="avatar-upload" 
                    className="bg-tavern-blue text-white p-2 rounded-full cursor-pointer hover:bg-tavern-blue-dark transition-colors shadow-md group-hover:scale-105 duration-300"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </Label>
                  <Input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <p className="font-medium text-tavern-blue-dark">
                  {firstName} {lastName}
                </p>
                <p className="text-sm text-gray-500">{email}</p>
                <p className="mt-1 inline-block bg-tavern-blue text-white text-xs px-2 py-1 rounded-full">
                  {role}
                </p>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  placeholder="Email Address"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value: 'Owner' | 'Head Chef' | 'Staff') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Head Chef">Head Chef</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end pt-4 border-t border-tavern-blue-light/20 mt-6">
          <Button 
            onClick={handleUpdateProfile} 
            disabled={loading}
            className="bg-tavern-blue hover:bg-tavern-blue-dark"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Profile;
