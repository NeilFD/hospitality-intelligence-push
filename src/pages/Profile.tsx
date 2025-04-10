import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Edit, Check, User } from 'lucide-react';
import { toast } from "sonner";
import { useAuthStore } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils"

type Role = 'Owner' | 'Manager' | 'Team Member';
type AuthServiceRole = 'Owner' | 'Head Chef' | 'Staff';

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  role: Role | AuthServiceRole;
  avatar_url: string;
  job_title?: string;
  birth_date: string | null;
  favourite_dish?: string;
  favourite_drink?: string;
  about_me?: string;
}

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const { user, profile, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<Role>('Team Member');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [jobTitle, setJobTitle] = useState('');
  const [favouriteDish, setFavouriteDish] = useState('');
  const [favouriteDrink, setFavouriteDrink] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewedProfile, setViewedProfile] = useState<ProfileData | null>(null);
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);

  // Convert new role format to auth service format
  const convertRoleToAuthServiceRole = (newRole: Role): AuthServiceRole => {
    switch (newRole) {
      case 'Owner': return 'Owner';
      case 'Manager': return 'Head Chef';
      case 'Team Member': return 'Staff';
      default: return 'Staff';
    }
  };

  // Convert auth service role format to new role format
  const convertAuthServiceRoleToRole = (authRole: AuthServiceRole | string | null): Role => {
    if (authRole === 'Owner') return 'Owner';
    if (authRole === 'Head Chef' || authRole === 'Manager') return 'Manager';
    return 'Team Member';
  };

  // Convert stored birthday to Date
  useEffect(() => {
    if (profile?.birth_date) {
      const parsedDate = parse(profile.birth_date, 'yyyy-MM-dd', new Date());
      setBirthDate(parsedDate);
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      
      // Convert the role to the format expected by the auth service
      const authServiceRole = convertRoleToAuthServiceRole(role);
      
      // Convert the birth date to string in 'YYYY-MM-DD' format
      const formattedBirthDate = birthDate ? format(birthDate, 'yyyy-MM-dd') : null;
      
      await updateProfile({
        firstName,
        lastName,
        role: authServiceRole,
        avatarUrl,
        jobTitle,
        birthDate: formattedBirthDate,
        favouriteDish,
        favouriteDrink,
        aboutMe
      });
      
      toast.success("Profile updated successfully.");
      setIsEditing(false);
    } catch (error: any) {
      toast.error("Error updating profile: " + error.message);
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
          
          // Convert database role to new role format
          setRole(convertAuthServiceRoleToRole(data.role));
          setAvatarUrl(data.avatar_url);
          setJobTitle(data.job_title || '');
          setFavouriteDish(data.favourite_dish || '');
          setFavouriteDrink(data.favourite_drink || '');
          setAboutMe(data.about_me || '');
          if (data.birth_date) {
            const parsedDate = parse(data.birth_date, 'yyyy-MM-dd', new Date());
            setBirthDate(parsedDate);
          }
        }
      } catch (error) {
        toast.error("Error fetching profile: " + (error as Error).message);
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
        
        // Convert database role to new role format
        setRole(convertAuthServiceRoleToRole(profile.role));
        setAvatarUrl(profile.avatar_url);
        setJobTitle(profile.job_title || '');
        setFavouriteDish(profile.favourite_dish || '');
        setFavouriteDrink(profile.favourite_drink || '');
        setAboutMe(profile.about_me || '');
        if (profile.birth_date) {
          const parsedDate = parse(profile.birth_date, 'yyyy-MM-dd', new Date());
          setBirthDate(parsedDate);
        }
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
          <div className="grid gap-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              type="text"
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={!isEditing && !userId}
              placeholder="e.g. Chef de Partie, Server, etc."
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Birthday</Label>
            {isEditing && !userId ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <Input 
                type="text" 
                value={birthDate ? format(birthDate, "PP") : ''} 
                disabled 
              />
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="favouriteDish">Favourite Tavern Dish</Label>
            <Input
              type="text"
              id="favouriteDish"
              value={favouriteDish}
              onChange={(e) => setFavouriteDish(e.target.value)}
              disabled={!isEditing && !userId}
              placeholder="What's your favourite dish from the menu?"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="favouriteDrink">Favourite Tavern Drink</Label>
            <Input
              type="text"
              id="favouriteDrink"
              value={favouriteDrink}
              onChange={(e) => setFavouriteDrink(e.target.value)}
              disabled={!isEditing && !userId}
              placeholder="What's your favourite drink from the bar?"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="aboutMe">About Me</Label>
            <Textarea
              id="aboutMe"
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              disabled={!isEditing && !userId}
              placeholder="Tell us a bit about yourself..."
              className="min-h-[100px]"
            />
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
