
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore, AuthServiceRole } from '@/services/auth-service';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProfilePage() {
  const { profile, user, updateProfile } = useAuthStore();
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [jobTitle, setJobTitle] = useState(profile?.job_title || '');
  const [about, setAbout] = useState(profile?.about_me || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [favoriteDish, setFavoriteDish] = useState(profile?.favourite_dish || '');
  const [favoriteDrink, setFavoriteDrink] = useState(profile?.favourite_drink || '');
  const [role, setRole] = useState<AuthServiceRole>(profile?.role as AuthServiceRole || 'Team Member');
  const [isSaving, setIsSaving] = useState(false);
  
  // Update state when profile data changes
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setJobTitle(profile.job_title || '');
      setAbout(profile.about_me || '');
      setAvatarUrl(profile.avatar_url || '');
      setFavoriteDish(profile.favourite_dish || '');
      setFavoriteDrink(profile.favourite_drink || '');
      setRole(profile.role as AuthServiceRole || 'Team Member');
    }
  }, [profile]);
  
  const getUserInitials = () => {
    if (!firstName && !lastName) return 'U';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        job_title: jobTitle,
        about_me: about,
        avatar_url: avatarUrl,
        favourite_dish: favoriteDish,
        favourite_drink: favoriteDrink,
        role
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Check if the current user has GOD role to show role selector
  const isGodUser = profile?.role === 'GOD';
  
  return (
    <div className="container py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Upload a profile picture or update your information
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Avatar className="w-32 h-32 mb-4">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Profile" />
                ) : (
                  <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
                )}
              </Avatar>
              
              <div className="space-y-2 w-full">
                <Label htmlFor="avatarUrl">Profile Image URL</Label>
                <Input
                  id="avatarUrl"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Paste a URL to your profile image
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Email"
                  value={user?.email || ''}
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  Your email address cannot be changed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Head Chef, Manager, Server"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              
              {isGodUser && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={role}
                    onValueChange={(value) => setRole(value as AuthServiceRole)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOD">GOD (System Admin)</SelectItem>
                      <SelectItem value="Super User">Super User</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Team Member">Team Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Only GOD users can change roles
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  placeholder="Tell us about yourself"
                  rows={4}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="favoriteDish">Favorite Dish</Label>
                  <Input
                    id="favoriteDish"
                    placeholder="e.g. Spaghetti Carbonara"
                    value={favoriteDish}
                    onChange={(e) => setFavoriteDish(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="favoriteDrink">Favorite Drink</Label>
                  <Input
                    id="favoriteDrink"
                    placeholder="e.g. Old Fashioned"
                    value={favoriteDrink}
                    onChange={(e) => setFavoriteDrink(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
