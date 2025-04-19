
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Image, Pencil, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/services/auth-service';
import { toast } from 'sonner';
import { createWelcomeMessage, updateWelcomeMessage, WelcomeMessage as WelcomeMessageType } from '@/services/team-service';

interface WelcomeMessageProps {}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = () => {
  const [message, setMessage] = useState<WelcomeMessageType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const { profile } = useAuthStore();

  // Fix the role check to properly identify users who can edit
  const canEdit = profile?.role && ['GOD', 'Super User', 'Manager'].includes(profile.role);

  useEffect(() => {
    fetchLatestMessage();
  }, []);

  const fetchLatestMessage = async () => {
    try {
      const { data: messageData, error } = await supabase
        .from('team_welcome_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching welcome message:', error);
        return;
      }
      
      if (messageData) {
        const { data: authorData, error: authorError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', messageData.author_id)
          .single();
        
        if (!authorError && authorData) {
          setMessage({
            ...messageData,
            author_first_name: authorData.first_name,
            author_last_name: authorData.last_name
          });
        } else {
          console.error('Error fetching author details:', authorError);
          setMessage(messageData);
        }
      }
    } catch (error) {
      console.error('Error fetching welcome message:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log('Uploading image to team_message_images bucket:', filePath);

    const { error: uploadError, data } = await supabase.storage
      .from('team_message_images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    console.log('Upload successful, getting public URL');

    const { data: urlData } = supabase.storage
      .from('team_message_images')
      .getPublicUrl(filePath);

    console.log('Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!profile?.id) {
      toast.error('You must be logged in to post a message');
      return;
    }

    try {
      let imageUrl = message?.image_url;

      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      if (message?.id) {
        await updateWelcomeMessage(message.id, {
          content: newContent,
          subject: newSubject,
          image_url: imageUrl,
        });
      } else {
        await createWelcomeMessage({
          content: newContent,
          subject: newSubject,
          image_url: imageUrl,
          author_id: profile.id,
        });
      }

      toast.success('Welcome message updated successfully');
      setIsEditing(false);
      fetchLatestMessage();
    } catch (error) {
      console.error('Error updating welcome message:', error);
      toast.error('Failed to update welcome message');
    }
  };

  const handleDelete = async () => {
    if (!message?.id) return;

    try {
      const { error } = await supabase
        .from('team_welcome_messages')
        .delete()
        .eq('id', message.id);

      if (error) throw error;

      toast.success('Welcome message deleted successfully');
      setMessage(null);
    } catch (error) {
      console.error('Error deleting welcome message:', error);
      toast.error('Failed to delete welcome message');
    }
  };

  const startEditing = () => {
    setNewContent(message?.content || '');
    setNewSubject(message?.subject || '');
    setImagePreview(message?.image_url || null);
    setIsEditing(true);
  };

  return (
    <div className="w-full">
      {message ? (
        <div className="relative bg-gradient-to-r from-purple-50 via-white to-purple-50 rounded-lg p-6 mt-6 shadow-lg border border-purple-100 animate-fade-in hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-gradient-to-br from-purple-200/30 to-transparent opacity-50"></div>
          <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-gradient-to-tl from-purple-200/30 to-transparent opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                {message.subject && (
                  <h2 className="text-xl font-bold text-purple-700 mb-2">
                    {message.subject}
                  </h2>
                )}
                <p className="text-sm font-medium text-purple-700 mb-1 flex items-center">
                  Posted by {message.author_first_name} {message.author_last_name}
                </p>
                <p className="text-xs text-purple-500">
                  {format(new Date(message.created_at), 'PPpp')}
                </p>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startEditing}
                    className="text-purple-600 hover:text-purple-900 hover:bg-purple-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-900 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-gray-800 whitespace-pre-wrap text-lg leading-relaxed">{message.content}</p>
            {message.image_url && (
              <div className="mt-4 transform hover:scale-[1.02] transition-transform duration-200">
                <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                  <DialogTrigger asChild>
                    <img
                      src={message.image_url}
                      alt="Welcome message"
                      className="max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <img
                      src={message.image_url}
                      alt="Welcome message"
                      className="w-full rounded-lg"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      ) : canEdit ? (
        <Button
          onClick={() => setIsEditing(true)}
          className="mt-6 gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 shadow-sm animate-fade-in"
          variant="outline"
        >
          <Plus className="h-4 w-4" /> Add Welcome Message
        </Button>
      ) : null}

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {message ? 'Edit Welcome Message' : 'Add Welcome Message'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Subject (optional)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="font-medium"
            />
            <Textarea
              placeholder="Enter your message..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="space-y-2">
              <label className="block">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('imageInput')?.click()}
                  className="gap-2"
                >
                  <Image className="h-4 w-4" />
                  {imagePreview ? 'Change Image' : 'Add Image'}
                </Button>
                <Input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-32 rounded-lg"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!newContent.trim()}>
              {message ? 'Update' : 'Post'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

