
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HospitalityGuide, HospitalityStep } from "@/types/hospitality-types";
import { MenuCategory } from "@/types/recipe-types";
import { createEmptyHospitalityGuide, emptyHospitalityStep } from "@/components/recipes/form/RecipeFormUtils";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { X, Plus, ArchiveIcon, ImageUp, ConciergeBell } from "lucide-react";

interface HospitalityGuideFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (guide: HospitalityGuide) => void;
  guide?: HospitalityGuide;
  categories: MenuCategory[];
}

const HospitalityGuideFormDialog: React.FC<HospitalityGuideFormDialogProps> = ({
  open,
  onClose,
  onSave,
  guide,
  categories
}) => {
  const [formData, setFormData] = useState<HospitalityGuide>(guide || createEmptyHospitalityGuide());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(guide?.imageUrl);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (guide) {
      setFormData(guide);
      setImagePreview(guide.imageUrl);
    } else {
      setFormData(createEmptyHospitalityGuide());
      setImagePreview(undefined);
    }
  }, [guide]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  const handleStepChange = (index: number, value: string) => {
    setFormData(prevData => {
      const updatedSteps = [...prevData.steps];
      updatedSteps[index] = { 
        ...updatedSteps[index], 
        name: value 
      };
      
      return {
        ...prevData,
        steps: updatedSteps
      };
    });
  };
  
  const addStep = () => {
    setFormData(prevData => ({
      ...prevData,
      steps: [...prevData.steps, emptyHospitalityStep()]
    }));
  };
  
  const removeStep = (index: number) => {
    setFormData(prevData => {
      const updatedSteps = [...prevData.steps];
      updatedSteps.splice(index, 1);
      return {
        ...prevData,
        steps: updatedSteps
      };
    });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const toggleArchived = () => {
    setFormData(prevData => ({
      ...prevData,
      archived: !prevData.archived
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const guideToSave: HospitalityGuide = {
        ...formData,
        steps: formData.steps.filter(step => step.name.trim() !== ''),
        updatedAt: new Date()
      };
      
      if (!guideToSave.id) {
        guideToSave.id = uuidv4();
        guideToSave.createdAt = new Date();
      }
      
      if (imagePreview) {
        guideToSave.imageUrl = imagePreview;
      }
      
      onSave(guideToSave);
      onClose();
    } catch (error) {
      console.error('Error saving guide:', error);
      toast.error('Failed to save guide');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="flex flex-row justify-between items-center">
          <div className="flex items-center gap-3">
            <ConciergeBell className="h-8 w-8 text-blue-600" />
            <div>
              <DialogTitle className="text-gray-900">
                {guide ? 'Edit' : 'Add'} Hospitality Guide
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Fill in the details for this hospitality guide.
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{formData.archived ? 'Archived' : 'Live'}</span>
            <Switch 
              checked={!formData.archived} 
              onCheckedChange={toggleArchived}
              className="data-[state=checked]:bg-green-500"
            />
            <ArchiveIcon className="h-4 w-4 text-gray-500 ml-1" />
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Guide Name</Label>
              <Input 
                id="name" 
                name="name"
                value={formData.name} 
                onChange={handleInputChange}
                placeholder="Enter guide name..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Service Category</Label>
              <Select 
                value={formData.category || 'Uncategorized'} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category" className="w-full mt-1">
                  <SelectValue placeholder="Select service category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                  {Array.isArray(categories) && categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Select 
                value={formData.department || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger id="department" className="w-full mt-1">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="FOH">FOH</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                  <SelectItem value="Kitchen">Kitchen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description and Detailed Procedure</Label>
              <Textarea
                id="description"
                name="description"
                rows={10}
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Describe the hospitality guide, its purpose, and detailed procedure..."
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Label>Steps/Procedures</Label>
                <Button 
                  type="button" 
                  onClick={addStep}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Step
                </Button>
              </div>
              
              <div className="space-y-2 mt-1 flex-grow">
                {formData.steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-2">{index + 1}.</div>
                    <Input 
                      value={step.name}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      placeholder={`Step ${index + 1}...`}
                      className="flex-grow"
                    />
                    <Button 
                      type="button" 
                      onClick={() => removeStep(index)}
                      size="icon"
                      variant="ghost"
                      className="flex-shrink-0 h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {formData.steps.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No steps added yet. Click "Add Step" to start.</p>
                )}
              </div>
            </div>

            <div>
              <Label>Guide Image</Label>
              <div className="mt-2 flex justify-start items-center">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-md" />
                    <button 
                      type="button" 
                      onClick={() => {
                        setImagePreview(undefined);
                        setImageFile(null);
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center"
                      aria-label="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <label 
                    htmlFor="image-upload" 
                    className="cursor-pointer bg-primary text-white rounded-md px-4 py-2 inline-flex items-center gap-2 hover:bg-primary/90 transition-colors"
                  >
                    <ImageUp className="h-5 w-5" /> Upload Image
                  </label>
                )}
                <input 
                  type="file" 
                  id="image-upload" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden" 
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-gray-900"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="text-white"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Guide'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HospitalityGuideFormDialog;

