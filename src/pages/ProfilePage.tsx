import React, { useEffect, useState, useRef } from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import { UserProfile } from '@/types/supabase-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define the structure of the user profile data without extending UserProfile
interface UserProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  avatar_url: string | null;
  banner_url?: string | null;
  banner_position_y?: number | null;
  created_at: string;
  updated_at: string;
  email?: string;
  job_title: string | null;
  birth_date: string | null;
  favourite_dish: string | null;
  favourite_drink: string | null;
  about_me: string | null;
  employment_type?: string;
  min_hours_per_day?: number;
  max_hours_per_day?: number;
  min_hours_per_week?: number;
  max_hours_per_week?: number;
  wage_rate?: number;
  annual_salary?: number;
  contractor_rate?: number;
  available_for_rota?: boolean;
  employment_start_date?: string;
  employment_status?: string;
  in_ft_education?: boolean;
}

// Create an interface for the edit form state
interface EditFormState {
  firstName: string;
  lastName: string;
  jobTitle: string;
  favouriteDish: string;
  favouriteDrink: string;
  aboutMe: string;
  birthDate: string;
  employmentType: string;
  minHoursPerDay: number;
  maxHoursPerDay: number;
  minHoursPerWeek: number;
  maxHoursPerWeek: number;
  wageRate: number;
  annualSalary: number;
  contractorRate: number;
  availableForRota: boolean;
  employmentStartDate: string;
  employmentStatus: string;
  inFtEducation: boolean;
}

// Define job title options
const jobTitleOptions = [
  "Chef", "Sous Chef", "Line Cook", "Dishwasher", "Server", "Bartender",
  "Host/Hostess", "Restaurant Manager", "Assistant Manager", "Busser"
];

// Define employment type options
const employmentTypeOptions = [
  "hourly", "salary", "contractor"
];

// Define employment status options
const employmentStatusOptions = [
  "full-time", "part-time", "casual"
];

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    firstName: '',
    lastName: '',
    jobTitle: '',
    favouriteDish: '',
    favouriteDrink: '',
    aboutMe: '',
    birthDate: '',
    employmentType: 'hourly',
    minHoursPerDay: 0,
    maxHoursPerDay: 8,
    minHoursPerWeek: 0,
    maxHoursPerWeek: 40,
    wageRate: 0,
    annualSalary: 0,
    contractorRate: 0,
    availableForRota: true,
    employmentStartDate: '',
    employmentStatus: '',
    inFtEducation: false,
  });
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const birthDateInputRef = useRef<HTMLInputElement>(null);
  const employmentStartDateInputRef = useRef<HTMLInputElement>(null);
  const { isSupported, isSubscribed, subscribeUser, unsubscribeUser } = usePushNotifications();
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        jobTitle: profile.job_title || '',
        favouriteDish: profile.favourite_dish || '',
        favouriteDrink: profile.favourite_drink || '',
        aboutMe: profile.about_me || '',
        birthDate: profile.birth_date || '',
        employmentType: profile.employment_type || 'hourly',
        minHoursPerDay: profile.min_hours_per_day || 0,
        maxHoursPerDay: profile.max_hours_per_day || 8,
        minHoursPerWeek: profile.min_hours_per_week || 0,
        maxHoursPerWeek: profile.max_hours_per_week || 40,
        wageRate: profile.wage_rate || 0,
        annualSalary: profile.annual_salary || 0,
        contractorRate: profile.contractor_rate || 0,
        availableForRota: profile.available_for_rota !== false,
        employmentStartDate: profile.employment_start_date || '',
        employmentStatus: profile.employment_status || '',
        inFtEducation: profile.in_ft_education || false,
      });

      if (profile.birth_date) {
        setDate(new Date(profile.birth_date));
      }

      if (profile.employment_start_date) {
        setEmploymentStartDate(new Date(profile.employment_start_date));
      }
    }
  }, [profile]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        console.warn('No user found, cannot fetch profile.');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error(`Error fetching profile: ${error.message}`);
      } else {
        setProfile(data as UserProfileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(`Failed to fetch profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (newDate?: Date) => {
    setDate(newDate);
    if (newDate) {
      setEditForm(prevForm => ({ ...prevForm, birthDate: format(newDate, 'yyyy-MM-dd') }));
    }
  };

  const handleEmploymentStartDateChange = (newDate?: Date) => {
    setEmploymentStartDate(newDate);
    if (newDate) {
      setEditForm(prevForm => ({ ...prevForm, employmentStartDate: format(newDate, 'yyyy-MM-dd') }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const target = e.target as HTMLInputElement; // Type assertion

    setEditForm(prevForm => {
      const newValue = target.type === 'checkbox' ? target.checked : value;
      
      // Handle numeric inputs correctly
      if (target.type === 'number') {
        return {
          ...prevForm,
          [name]: Number(newValue),
        };
      }
      
      return {
        ...prevForm,
        [name]: newValue,
      };
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      console.log('Saving profile with data:', editForm);
      
      const updateData: any = {
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        favourite_dish: editForm.favouriteDish,
        favourite_drink: editForm.favouriteDrink,
        about_me: editForm.aboutMe,
        birth_date: editForm.birthDate,
        job_title: editForm.jobTitle,
        employment_type: editForm.employmentType,
        min_hours_per_day: parseFloat(String(editForm.minHoursPerDay)) || 0,
        max_hours_per_day: parseFloat(String(editForm.maxHoursPerDay)) || 8,
        min_hours_per_week: parseFloat(String(editForm.minHoursPerWeek)) || 0,
        max_hours_per_week: parseFloat(String(editForm.maxHoursPerWeek)) || 40,
        available_for_rota: editForm.availableForRota,
        employment_start_date: editForm.employmentStartDate,
        employment_status: editForm.employmentStatus,
        in_ft_education: editForm.inFtEducation,
        wage_rate: 0,
        annual_salary: 0,
        contractor_rate: 0
      };
      
      // Add the appropriate wage field based on employment type
      if (editForm.employmentType === 'hourly') {
        updateData.wage_rate = parseFloat(String(editForm.wageRate)) || 0;
      } else if (editForm.employmentType === 'salary') {
        updateData.annual_salary = parseFloat(String(editForm.annualSalary)) || 0;
      } else if (editForm.employmentType === 'contractor') {
        updateData.contractor_rate = parseFloat(String(editForm.contractorRate)) || 0;
      }
      
      console.log('Updating profile with data:', updateData);

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update profile:', error);
        toast.error(`Failed to update profile: ${error.message}`);
        return;
      }

      setIsEditing(false);
      toast.success('Profile updated successfully!');
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushToggle = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser.');
      return;
    }

    if (isSubscribed) {
      await unsubscribeUser();
      setIsPushEnabled(false);
      toast.success('Push notifications disabled.');
    } else {
      await subscribeUser();
      setIsPushEnabled(true);
      toast.success('Push notifications enabled.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ReloadIcon className="mr-2 h-8 w-8 animate-spin" /> Loading profile...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

      {profile ? (
        <div className="space-y-6">
          {/* Profile Information Display */}
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">First Name:</p>
                  <p className="font-medium">{profile.first_name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Name:</p>
                  <p className="font-medium">{profile.last_name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Job Title:</p>
                  <p className="font-medium">{profile.job_title || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Birth Date:</p>
                  <p className="font-medium">{profile.birth_date || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Favourite Dish:</p>
                  <p className="font-medium">{profile.favourite_dish || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Favourite Drink:</p>
                  <p className="font-medium">{profile.favourite_drink || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Employment Type:</p>
                  <p className="font-medium">{profile.employment_type || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Available for Rota:</p>
                  <p className="font-medium">{profile.available_for_rota ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-500">About Me:</p>
                <p className="font-medium">{profile.about_me || 'Not set'}</p>
              </div>
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            </div>
          ) : (
            /* Profile Edit Form */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                {/* Last Name */}
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleInputChange}
                  />
                </div>
                {/* Job Title */}
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Select onValueChange={(value) => setEditForm(prevForm => ({ ...prevForm, jobTitle: value }))}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select job title" defaultValue={editForm.jobTitle} />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTitleOptions.map((title) => (
                        <SelectItem key={title} value={title}>{title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Birth Date */}
                <div>
                  <Label>Birth Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[180px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "yyyy-MM-dd") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center" side="bottom">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateChange}
                        disabled={(date) =>
                          date > new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Favourite Dish */}
                <div>
                  <Label htmlFor="favouriteDish">Favourite Dish</Label>
                  <Input
                    type="text"
                    id="favouriteDish"
                    name="favouriteDish"
                    value={editForm.favouriteDish}
                    onChange={handleInputChange}
                  />
                </div>
                {/* Favourite Drink */}
                <div>
                  <Label htmlFor="favouriteDrink">Favourite Drink</Label>
                  <Input
                    type="text"
                    id="favouriteDrink"
                    name="favouriteDrink"
                    value={editForm.favouriteDrink}
                    onChange={handleInputChange}
                  />
                </div>
                {/* Employment Type */}
                <div>
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select onValueChange={(value) => setEditForm(prevForm => ({ ...prevForm, employmentType: value }))}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select employment type" defaultValue={editForm.employmentType} />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypeOptions.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Available for Rota */}
                <div className="flex items-center space-x-2">
                  <Label htmlFor="availableForRota">Available for Rota</Label>
                  <Switch
                    id="availableForRota"
                    name="availableForRota"
                    checked={editForm.availableForRota}
                    onCheckedChange={(checked) => setEditForm(prevForm => ({ ...prevForm, availableForRota: checked }))}
                  />
                </div>
                {/* Employment Start Date */}
                <div>
                  <Label>Employment Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[180px] justify-start text-left font-normal",
                          !employmentStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {employmentStartDate ? format(employmentStartDate, "yyyy-MM-dd") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center" side="bottom">
                      <Calendar
                        mode="single"
                        selected={employmentStartDate}
                        onSelect={handleEmploymentStartDateChange}
                        disabled={(date) =>
                          date > new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Employment Status */}
                <div>
                  <Label htmlFor="employmentStatus">Employment Status</Label>
                  <Input
                    type="text"
                    id="employmentStatus"
                    name="employmentStatus"
                    value={editForm.employmentStatus}
                    onChange={handleInputChange}
                  />
                </div>
                {/* In FT Education */}
                <div className="flex items-center space-x-2">
                  <Label htmlFor="inFtEducation">In FT Education</Label>
                  <Switch
                    id="inFtEducation"
                    name="inFtEducation"
                    checked={editForm.inFtEducation}
                    onCheckedChange={(checked) => setEditForm(prevForm => ({ ...prevForm, inFtEducation: checked }))}
                  />
                </div>
              </div>
              {/* About Me */}
              <div>
                <Label htmlFor="aboutMe">About Me</Label>
                <Textarea
                  id="aboutMe"
                  name="aboutMe"
                  value={editForm.aboutMe}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Profile'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>No profile data found.</p>
      )}

      {/* Push Notifications Section */}
      <div className="mt-8 border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Push Notifications</h2>
        {isSupported ? (
          <div className="flex items-center justify-between">
            <p>Enable push notifications to stay updated.</p>
            <Switch checked={isSubscribed} onCheckedChange={handlePushToggle} />
          </div>
        ) : (
          <p>Push notifications are not supported in this browser.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
