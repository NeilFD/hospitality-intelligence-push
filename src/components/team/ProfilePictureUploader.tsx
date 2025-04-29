
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { UserProfile } from '@/types/supabase-types';
import { useAuthStore } from '@/services/auth-service';

interface ProfilePictureUploaderProps {
  profile: UserProfile;
  onAvatarUpdate: (url: string) => void;
}

export const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({ 
  profile, 
  onAvatarUpdate 
}) => {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { updateProfile } = useAuthStore();

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) {
      console.log("No file selected or profile not loaded");
      return;
    }

    try {
      setUploadingAvatar(true);
      console.log("Uploading profile image:", file.name);
      
      // Upload the file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${profile.id}-${Date.now()}.${fileExt}`;
      
      // Check if bucket exists first and log detailed information
      const { data: buckets } = await supabase.storage.listBuckets();
      console.log("Available buckets:", buckets?.map(b => b.name));
      
      // Ensure the file is uploaded to the correct path
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(`${profile.id}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error("Upload error details:", uploadError);
        toast.error('Failed to upload profile picture');
        return;
      }
      
      console.log("File uploaded successfully:", uploadData);
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(`${profile.id}/${fileName}`);
      
      console.log("Public URL:", publicUrl);
        
      // Update the profile with the avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);
        
      if (updateError) {
        console.error("Profile update error:", updateError);
        toast.error('Failed to update profile with avatar');
        return;
      }
      
      console.log("Profile updated with new avatar URL");
      
      // Update the local profile state in the auth store if this is the current user
      if (profile.id === useAuthStore.getState().user?.id) {
        await updateProfile({ avatar_url: publicUrl });
      }
      
      // Call the callback to update parent component state
      onAvatarUpdate(publicUrl);
      
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
      // Clear the input value to allow uploading the same file again
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="relative group">
      <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
        {profile.avatar_url ? (
          <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
        ) : (
          <AvatarFallback className="bg-hi-purple-light/30 text-hi-purple text-4xl">
            {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
          </AvatarFallback>
        )}
      </Avatar>
      
      <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100 hover:scale-110 duration-200">
        {uploadingAvatar ? (
          <Loader2 className="h-5 w-5 text-hi-purple animate-spin" />
        ) : (
          <Camera className="h-5 w-5 text-hi-purple" />
        )}
        <input 
          type="file" 
          id="avatar-upload" 
          className="hidden" 
          accept="image/*"
          onChange={handleAvatarUpload}
          disabled={uploadingAvatar}
        />
      </label>
    </div>
  );
};
