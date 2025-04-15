
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { UserProfile } from '@/types/supabase-types';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Briefcase, Cake, Utensils, Wine, MessageSquare, Upload, Camera, Edit, Save, X, Move, Check } from 'lucide-react';
import { useAuthStore } from '@/services/auth-service';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { fabric } from 'fabric';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ProfilePage = () => {
  const { id } = useParams();
  const { profile: currentUserProfile } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRepositioningBanner, setIsRepositioningBanner] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    favouriteDish: '',
    favouriteDrink: '',
    aboutMe: '',
    birthDate: ''
  });
  
  // References for canvas and image
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [yPosition, setYPosition] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        let profileToLoad;
        
        if (id) {
          // Load another user's profile
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
            
          if (error) throw error;
          profileToLoad = data;
        } else {
          // Load current user's profile
          profileToLoad = currentUserProfile;
        }
        
        setProfile(profileToLoad);
        
        // Initialize edit form with current values
        if (profileToLoad) {
          setEditForm({
            firstName: profileToLoad.first_name || '',
            lastName: profileToLoad.last_name || '',
            jobTitle: profileToLoad.job_title || '',
            favouriteDish: profileToLoad.favourite_dish || '',
            favouriteDrink: profileToLoad.favourite_drink || '',
            aboutMe: profileToLoad.about_me || '',
            birthDate: profileToLoad.birth_date || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [id, currentUserProfile]);

  useEffect(() => {
    // Clean up the canvas when component unmounts or when repositioning mode ends
    return () => {
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
  }, []);

  // Initialize canvas for image repositioning
  useEffect(() => {
    if (isRepositioningBanner && canvasElRef.current && containerRef.current && profile?.banner_url) {
      // Set canvas dimensions to match container
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Create new canvas and set dimensions
      canvasRef.current = new fabric.Canvas(canvasElRef.current, {
        width: containerWidth,
        height: containerHeight,
        selection: false,
      });
      
      // Load the banner image
      fabric.Image.fromURL(profile.banner_url, (img) => {
        // Scale image to fit width
        const scale = containerWidth / img.width!;
        img.scaleX = scale;
        img.scaleY = scale;
        
        // Allow only vertical movement
        img.lockMovementX = true;
        img.lockRotation = true;
        img.lockScalingX = true;
        img.lockScalingY = true;
        
        // Set initial position
        img.left = 0;
        img.top = yPosition || 0;
        
        // Add image to canvas
        canvasRef.current?.add(img);
        canvasRef.current?.setActiveObject(img);
        
        // Update position state when image is moved
        img.on('moved', function() {
          setYPosition(img.top || 0);
        });
      });
    }
  }, [isRepositioningBanner, profile?.banner_url]);

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) {
      console.log("No file selected or profile not loaded");
      return;
    }

    try {
      setUploadingBanner(true);
      console.log("Uploading banner image:", file.name);
      
      // Upload the file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${profile.id}-${Date.now()}.${fileExt}`;
      
      // Ensure the file is uploaded to the correct path in the 'profiles' bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(`${profile.id}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error('Failed to upload banner image');
        return;
      }
      
      console.log("File uploaded successfully:", uploadData);
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(`${profile.id}/${fileName}`);
      
      console.log("Public URL:", publicUrl);
        
      // Update the profile with the banner URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ banner_url: publicUrl })
        .eq('id', profile.id);
        
      if (updateError) {
        console.error("Profile update error:", updateError);
        toast.error('Failed to update profile with banner');
        return;
      }
      
      console.log("Profile updated with new banner URL");
      
      // Update the local profile state
      setProfile({
        ...profile,
        banner_url: publicUrl
      });
      
      toast.success('Banner image updated successfully');
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Failed to upload banner image');
    } finally {
      setUploadingBanner(false);
      // Clear the input value to allow uploading the same file again
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleStartRepositioning = () => {
    setIsRepositioningBanner(true);
  };

  const handleSaveRepositioning = async () => {
    if (!profile || !canvasRef.current) return;
    
    try {
      // Get the image object
      const objects = canvasRef.current.getObjects();
      if (objects.length === 0) return;
      
      const imageObj = objects[0] as fabric.Image;
      const yPos = imageObj.top || 0;
      
      // Save the position in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ 
          banner_position_y: yPos // Store the Y position
        })
        .eq('id', profile.id);
        
      if (error) {
        console.error("Error saving banner position:", error);
        toast.error('Failed to save banner position');
        return;
      }
      
      // Update local profile state with new position
      setProfile(prevProfile => prevProfile ? {
        ...prevProfile,
        banner_position_y: yPos
      } : null);
      
      setYPosition(yPos);
      setIsRepositioningBanner(false);
      toast.success('Banner position updated');
    } catch (error) {
      console.error('Error saving banner position:', error);
      toast.error('Failed to save banner position');
    }
  };

  const handleCancelRepositioning = () => {
    setIsRepositioningBanner(false);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset form to current profile values
    if (profile) {
      setEditForm({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        jobTitle: profile.job_title || '',
        favouriteDish: profile.favourite_dish || '',
        favouriteDrink: profile.favourite_drink || '',
        aboutMe: profile.about_me || '',
        birthDate: profile.birth_date || ''
      });
    }
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.firstName,
          last_name: editForm.lastName,
          job_title: editForm.jobTitle,
          favourite_dish: editForm.favouriteDish,
          favourite_drink: editForm.favouriteDrink,
          about_me: editForm.aboutMe,
          birth_date: editForm.birthDate
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      // Update local profile state
      setProfile({
        ...profile,
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        job_title: editForm.jobTitle,
        favourite_dish: editForm.favouriteDish,
        favourite_drink: editForm.favouriteDrink,
        about_me: editForm.aboutMe,
        birth_date: editForm.birthDate
      });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
      
      // Update the auth store if this is the current user's profile
      if (!id && currentUserProfile) {
        useAuthStore.setState({
          profile: {
            ...currentUserProfile,
            first_name: editForm.firstName,
            last_name: editForm.lastName,
            job_title: editForm.jobTitle,
            favourite_dish: editForm.favouriteDish,
            favourite_drink: editForm.favouriteDrink,
            about_me: editForm.aboutMe,
            birth_date: editForm.birthDate
          }
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hi-purple"></div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Profile Not Found</h2>
        <p className="text-gray-600 mb-4">The profile you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }
  
  const isCurrentUser = !id || id === currentUserProfile?.id;

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <div ref={containerRef} className="relative h-32">
            {isRepositioningBanner ? (
              <div className="h-full w-full">
                <canvas ref={canvasElRef} className="w-full h-full"></canvas>
                
                {/* Improved repositioning controls - floating toolbar */}
                <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/50 to-transparent px-4 py-2 flex items-center justify-between">
                  <div className="text-white text-sm font-medium">
                    Drag image up or down to reposition
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-white text-hi-purple hover:bg-gray-100"
                      onClick={handleCancelRepositioning}
                    >
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    
                    <Button 
                      size="sm" 
                      className="bg-hi-purple text-white hover:bg-hi-purple-dark"
                      onClick={handleSaveRepositioning}
                    >
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {profile?.banner_url ? (
                  <img 
                    src={profile.banner_url} 
                    alt="Profile banner" 
                    className="h-full w-full object-cover"
                    style={{ objectPosition: `center ${profile.banner_position_y || yPosition}px` }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-hi-purple-light to-hi-purple"></div>
                )}
                {isCurrentUser && (
                  <div className="absolute bottom-2 right-2 flex space-x-2 z-10">
                    {profile?.banner_url && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-white bg-opacity-80 hover:bg-opacity-100 text-hi-purple"
                              onClick={handleStartRepositioning}
                            >
                              <Move className="h-4 w-4 mr-1" /> Reposition
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Adjust the banner image position</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label htmlFor="banner-upload" className="bg-white bg-opacity-80 rounded-md p-2 cursor-pointer hover:bg-opacity-100 transition-colors">
                            <Camera className="h-5 w-5 text-hi-purple" />
                            <input 
                              type="file" 
                              id="banner-upload" 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleBannerUpload}
                              disabled={uploadingBanner}
                            />
                          </label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Upload a new banner image</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="relative px-6">
            <div className="-mt-16">
              <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
                ) : (
                  <AvatarFallback className="bg-hi-purple-light/30 text-hi-purple text-4xl">
                    {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            
            <div className="mt-4">
              <h1 className="text-3xl font-bold">
                {profile.first_name} {profile.last_name}
              </h1>
              <div className="flex items-center mt-1 mb-4">
                <Badge variant="outline" className="mr-2 border-hi-purple-light/50 text-hi-purple">
                  {profile.role || 'Team Member'}
                </Badge>
                {profile.job_title && (
                  <div className="flex items-center text-gray-500">
                    <Briefcase className="h-4 w-4 mr-1" /> {profile.job_title}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <CardContent className="px-6 pb-6">
            <Tabs defaultValue="about" className="mt-2">
              <TabsList className="mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                {isCurrentUser && <TabsTrigger value="settings">Edit Profile</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="about">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Profile Details</h3>
                    
                    {profile.birth_date && (
                      <div className="flex items-center mb-3 text-gray-700">
                        <Cake className="h-5 w-5 mr-3 text-hi-purple-light" />
                        <span>Birthday: {profile.birth_date}</span>
                      </div>
                    )}
                    
                    {profile.favourite_dish && (
                      <div className="flex items-center mb-3 text-gray-700">
                        <Utensils className="h-5 w-5 mr-3 text-hi-purple-light" />
                        <span>Favourite Dish: {profile.favourite_dish}</span>
                      </div>
                    )}
                    
                    {profile.favourite_drink && (
                      <div className="flex items-center mb-3 text-gray-700">
                        <Wine className="h-5 w-5 mr-3 text-hi-purple-light" />
                        <span>Favourite Drink: {profile.favourite_drink}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center mb-3 text-gray-700">
                      <CalendarDays className="h-5 w-5 mr-3 text-hi-purple-light" />
                      <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">About Me</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {profile.about_me ? (
                        <p className="whitespace-pre-line">{profile.about_me}</p>
                      ) : (
                        <p className="text-gray-500 italic">No bio provided</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {isCurrentUser && (
                <TabsContent value="settings">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input 
                        id="jobTitle" 
                        value={editForm.jobTitle}
                        onChange={(e) => setEditForm({...editForm, jobTitle: e.target.value})}
                        placeholder="e.g. Head Chef, Server, Manager"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Birthday (MM-DD)</Label>
                      <Input 
                        id="birthDate" 
                        value={editForm.birthDate}
                        onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
                        placeholder="MM-DD (e.g. 05-15)"
                      />
                      <p className="text-sm text-muted-foreground">Format: MM-DD (e.g. 05-15)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="favouriteDish">Favourite Dish</Label>
                      <Input 
                        id="favouriteDish" 
                        value={editForm.favouriteDish}
                        onChange={(e) => setEditForm({...editForm, favouriteDish: e.target.value})}
                        placeholder="What's your favourite dish?"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="favouriteDrink">Favourite Drink</Label>
                      <Input 
                        id="favouriteDrink" 
                        value={editForm.favouriteDrink}
                        onChange={(e) => setEditForm({...editForm, favouriteDrink: e.target.value})}
                        placeholder="What's your favourite drink?"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="aboutMe">About Me</Label>
                      <Textarea 
                        id="aboutMe" 
                        value={editForm.aboutMe}
                        onChange={(e) => setEditForm({...editForm, aboutMe: e.target.value})}
                        placeholder="Tell us a bit about yourself..."
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
