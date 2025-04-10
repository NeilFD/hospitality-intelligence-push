
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/services/auth-service';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Camera, UserIcon, BriefcaseIcon, CakeIcon, UtensilsIcon, GlassWater, ScrollTextIcon } from 'lucide-react';
import { UserProfile } from '@/types/supabase-types';
import { Textarea } from '@/components/ui/textarea';

const Profile = () => {
  const { user, profile, loadUser } = useAuthStore();
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Owner' | 'Manager' | 'Team Member'>('Team Member');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // New state variables for additional fields
  const [jobTitle, setJobTitle] = useState('');
  const [birthDateMonth, setBirthDateMonth] = useState('');
  const [favouriteDish, setFavouriteDish] = useState('');
  const [favouriteDrink, setFavouriteDrink] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  
  useEffect(() => {
    const loadProfileData = async () => {
      // If userId is provided in URL and it's not the current user
      if (userId && user && userId !== user.id) {
        setIsOwnProfile(false);
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setViewedProfile(data);
            setFirstName(data.first_name || '');
            setLastName(data.last_name || '');
            // Convert any old role values to new ones
            let updatedRole: 'Owner' | 'Manager' | 'Team Member' = 'Team Member';
            if (data.role === 'Owner') {
              updatedRole = 'Owner';
            } else if (data.role === 'Head Chef') {
              updatedRole = 'Manager';
            } else if (data.role === 'Staff') {
              updatedRole = 'Team Member';
            }
            setRole(updatedRole);
            setAvatarUrl(data.avatar_url);
            
            // Set new fields
            setJobTitle(data.job_title || '');
            setBirthDateMonth(data.birth_date_month || '');
            setFavouriteDish(data.favourite_dish || '');
            setFavouriteDrink(data.favourite_drink || '');
            setAboutMe(data.about_me || '');
          }
        } catch (error: any) {
          toast.error(`Error loading profile: ${error.message}`);
        } finally {
          setLoading(false);
        }
      } else {
        // Use current user's profile
        setIsOwnProfile(true);
        if (profile) {
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
          // Convert any old role values to new ones
          let updatedRole: 'Owner' | 'Manager' | 'Team Member' = 'Team Member';
          if (profile.role === 'Owner') {
            updatedRole = 'Owner';
          } else if (profile.role === 'Head Chef') {
            updatedRole = 'Manager';
          } else if (profile.role === 'Staff') {
            updatedRole = 'Team Member';
          }
          setRole(updatedRole);
          setAvatarUrl(profile.avatar_url);
          
          // Set new fields
          setJobTitle(profile.job_title || '');
          setBirthDateMonth(profile.birth_date_month || '');
          setFavouriteDish(profile.favourite_dish || '');
          setFavouriteDrink(profile.favourite_drink || '');
          setAboutMe(profile.about_me || '');
        }
        
        if (user) {
          setEmail(user.email || '');
        }
      }
    };
    
    loadProfileData();
  }, [userId, user, profile]);
  
  const handleUpdateProfile = async () => {
    if (!user || !isOwnProfile) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          role: role,
          // Add new fields
          job_title: jobTitle,
          birth_date_month: birthDateMonth,
          favourite_dish: favouriteDish,
          favourite_drink: favouriteDrink,
          about_me: aboutMe
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
    if (!isOwnProfile) return;
    
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
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      const avatarUrl = data.publicUrl;
      
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
    const first = firstName || '';
    const last = lastName || '';
    
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };
  
  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-tavern-blue" />
      </div>
    );
  }
  
  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-tavern-blue mb-6 text-center">
        {isOwnProfile ? 'Your Profile' : `${firstName} ${lastName}'s Profile`}
      </h1>
      
      <Card className="shadow-lg">
        <CardHeader className="pb-2 border-b border-tavern-blue-light/20 bg-white/40">
          <CardTitle className="text-tavern-blue-dark text-xl">
            {isOwnProfile ? 'Personal Information' : 'Profile Information'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
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
                
                {isOwnProfile && (
                  <div className="absolute -bottom-2 -right-2">
                    <Label 
                      htmlFor="avatar-upload" 
                      className="bg-tavern-blue text-white p-2 rounded-full cursor-pointer hover:bg-tavern-blue-dark transition-colors shadow-md inline-flex items-center justify-center"
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
                )}
              </div>
              
              <div className="text-center">
                <p className="font-medium text-tavern-blue-dark">
                  {firstName} {lastName}
                </p>
                <p className="text-sm text-gray-500">{isOwnProfile ? email : ''}</p>
                <p className="mt-1 inline-block bg-tavern-blue text-white text-xs px-2 py-1 rounded-full">
                  {role}
                </p>
                {jobTitle && (
                  <p className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                    <BriefcaseIcon className="h-3 w-3" /> {jobTitle}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              {isOwnProfile ? (
                <>
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
                    <Select value={role} onValueChange={(value: 'Owner' | 'Manager' | 'Team Member') => setRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owner">Owner</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Team Member">Team Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* New fields for editable profile */}
                  <div className="space-y-2">
                    <Label htmlFor="job-title">Job Title</Label>
                    <Input
                      id="job-title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Job Title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birth-date">Birth Month & Day</Label>
                    <Input
                      id="birth-date"
                      value={birthDateMonth}
                      onChange={(e) => setBirthDateMonth(e.target.value)}
                      placeholder="e.g., January 15"
                    />
                    <p className="text-xs text-muted-foreground">Only month and day, not year</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="favourite-dish">Favourite Tavern Dish</Label>
                      <Input
                        id="favourite-dish"
                        value={favouriteDish}
                        onChange={(e) => setFavouriteDish(e.target.value)}
                        placeholder="Your favourite dish"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="favourite-drink">Favourite Tavern Drink</Label>
                      <Input
                        id="favourite-drink"
                        value={favouriteDrink}
                        onChange={(e) => setFavouriteDrink(e.target.value)}
                        placeholder="Your favourite drink"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="about-me">About Me</Label>
                    <Textarea
                      id="about-me"
                      value={aboutMe}
                      onChange={(e) => setAboutMe(e.target.value)}
                      placeholder="Tell us about yourself"
                      className="min-h-[100px]"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-tavern-blue" />
                    <span className="font-medium">Team Member Information</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="view-first-name">First Name</Label>
                      <Input
                        id="view-first-name"
                        value={firstName}
                        readOnly
                        disabled
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="view-last-name">Last Name</Label>
                      <Input
                        id="view-last-name"
                        value={lastName}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="view-role">Role</Label>
                    <Input
                      id="view-role"
                      value={role}
                      readOnly
                      disabled
                    />
                  </div>
                  
                  {/* New read-only fields for viewed profiles */}
                  {jobTitle && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <BriefcaseIcon className="h-4 w-4 text-tavern-blue" />
                        <Label>Job Title</Label>
                      </div>
                      <p className="pl-5 text-gray-700">{jobTitle}</p>
                    </div>
                  )}
                  
                  {birthDateMonth && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <CakeIcon className="h-4 w-4 text-tavern-blue" />
                        <Label>Birthday</Label>
                      </div>
                      <p className="pl-5 text-gray-700">{birthDateMonth}</p>
                    </div>
                  )}
                  
                  {(favouriteDish || favouriteDrink) && (
                    <div className="space-y-4">
                      {favouriteDish && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <UtensilsIcon className="h-4 w-4 text-tavern-blue" />
                            <Label>Favourite Tavern Dish</Label>
                          </div>
                          <p className="pl-5 text-gray-700">{favouriteDish}</p>
                        </div>
                      )}
                      
                      {favouriteDrink && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <GlassWater className="h-4 w-4 text-tavern-blue" />
                            <Label>Favourite Tavern Drink</Label>
                          </div>
                          <p className="pl-5 text-gray-700">{favouriteDrink}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {aboutMe && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <ScrollTextIcon className="h-4 w-4 text-tavern-blue" />
                        <Label>About</Label>
                      </div>
                      <p className="pl-5 text-gray-700 whitespace-pre-line">{aboutMe}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        {isOwnProfile && (
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
        )}
      </Card>
    </div>
  );
};

export default Profile;
