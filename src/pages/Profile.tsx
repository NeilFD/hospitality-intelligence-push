import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Edit, Check, User } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast"
import { useAuthStore } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';

type Role = 'Owner' | 'Manager' | 'Team Member';

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  role: Role;
  avatar_url: string;
}

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const { user, profile, updateProfile } = useAuthStore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<Role>('Team Member');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [viewedProfile, setViewedProfile] = useState<ProfileData | null>(null);

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      await updateProfile({
        firstName,
        lastName,
        role,
        avatarUrl
      });
      toast({
        title: "Profile updated successfully.",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile.",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getUserInitials = () => {
    if (!firstName && !lastName) return '?';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setViewedProfile(data);
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          
          // Convert any old role values to new ones
          let updatedRole: 'Owner' | 'Manager' | 'Team Member' = 'Team Member';
          if (data.role === 'Owner') {
            updatedRole = 'Owner';
          } else if (data.role === 'Manager' || data.role === 'Head Chef') {
            updatedRole = 'Manager';
          } else {
            updatedRole = 'Team Member';
          }
          setRole(updatedRole);
          setAvatarUrl(data.avatar_url);
          
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching profile.",
          description: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        
        // Convert any old role values to new ones
        let updatedRole: 'Owner' | 'Manager' | 'Team Member' = 'Team Member';
        if (profile.role === 'Owner') {
          updatedRole = 'Owner';
        } else if (profile.role === 'Manager' || profile.role === 'Head Chef') {
          updatedRole = 'Manager';
        } else {
          updatedRole = 'Team Member';
        }
        setRole(updatedRole);
        setAvatarUrl(profile.avatar_url);
        
      }
    }
  }, [userId, user, profile]);

  if (isLoading) {
    return (
      <div className="container py-6 max-w-[1400px] mx-auto">
        <div className="flex justify-center items-center py-20">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-[1400px] mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{userId ? 'View Profile' : 'Edit Profile'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
              ) : (
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              )}
            </Avatar>
            {isEditing && !userId && (
              <div className="flex flex-col">
                <Label htmlFor="avatar">Change Avatar</Label>
                <Input type="file" id="avatar" accept="image/*" onChange={handleAvatarChange} />
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!isEditing && !userId}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={!isEditing && !userId}
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            {isEditing && !userId ? (
              <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Team Member">Team Member</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input type="text" value={role} disabled />
            )}
          </div>
          <div className="flex justify-end">
            {userId ? (
              <Button variant="outline" onClick={() => window.history.back()}>
                Back
              </Button>
            ) : isEditing ? (
              <div className="space-x-2">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProfile} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      Updating <span className="animate-spin">...</span>
                    </>
                  ) : (
                    <>
                      Update <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile <Edit className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
