
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MenuCategory, AllergenType } from "@/types/recipe-types";
import { X, Upload } from "lucide-react";

interface RecipeBasicInfoProps {
  name: string;
  category: string;
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  allergens: string[];
  method: string;
  imagePreview?: string;
  categories: MenuCategory[];
  allergenTypes: AllergenType[];
  moduleType: 'food' | 'beverage';
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCategoryChange: (value: string) => void;
  onCheckboxChange: (name: string, checked: boolean) => void;
  onAllergenToggle: (allergen: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
}

export const RecipeBasicInfo: React.FC<RecipeBasicInfoProps> = ({
  name,
  category,
  isVegan,
  isVegetarian,
  isGlutenFree,
  allergens,
  method,
  imagePreview,
  categories,
  allergenTypes,
  moduleType,
  onInputChange,
  onCategoryChange,
  onCheckboxChange,
  onAllergenToggle,
  onImageUpload,
  onImageRemove
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name" className="text-dark-text-DEFAULT">Recipe Name</Label>
        <Input 
          id="name"
          name="name"
          value={name}
          onChange={onInputChange}
          placeholder="Enter recipe name"
          className="text-dark-text-DEFAULT bg-white"
        />
      </div>
      
      <div>
        <Label htmlFor="category" className="text-dark-text-DEFAULT">Category</Label>
        <Select
          value={category}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger id="category" className="text-dark-text-DEFAULT bg-white">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.filter(cat => cat.moduleType === moduleType).map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="mb-2 block text-dark-text-DEFAULT">Image</Label>
        <div className="flex items-center space-x-2">
          <div className="w-full">
            <Label 
              htmlFor="image-upload"
              className="flex justify-center items-center border-2 border-dashed border-gray-300 rounded-md h-32 cursor-pointer hover:border-gray-400 transition-colors"
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-full w-full object-cover rounded-md" 
                />
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <Upload className="h-10 w-10 mb-2" />
                  <span>Upload Image</span>
                </div>
              )}
            </Label>
            <Input 
              id="image-upload"
              type="file" 
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
          </div>
          {imagePreview && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onImageRemove}
              className="text-dark-text-DEFAULT"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div>
        <Label className="mb-2 block text-dark-text-DEFAULT">Dietary Options</Label>
        <div className="flex space-x-4 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isVegetarian" 
              checked={isVegetarian} 
              onCheckedChange={(checked) => onCheckboxChange('isVegetarian', checked === true)}
            />
            <Label 
              htmlFor="isVegetarian" 
              className="text-dark-text-DEFAULT cursor-pointer"
            >
              Vegetarian
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isVegan" 
              checked={isVegan} 
              onCheckedChange={(checked) => onCheckboxChange('isVegan', checked === true)}
            />
            <Label 
              htmlFor="isVegan" 
              className="text-dark-text-DEFAULT cursor-pointer"
            >
              Vegan
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isGlutenFree" 
              checked={isGlutenFree} 
              onCheckedChange={(checked) => onCheckboxChange('isGlutenFree', checked === true)}
            />
            <Label 
              htmlFor="isGlutenFree" 
              className="text-dark-text-DEFAULT cursor-pointer"
            >
              Gluten Free
            </Label>
          </div>
        </div>
      </div>
      
      <div>
        <Label className="mb-2 block text-dark-text-DEFAULT">Allergens</Label>
        <div className="flex flex-wrap gap-2">
          {allergenTypes.map((allergen) => (
            <div 
              key={allergen.id} 
              className={`px-3 py-1.5 rounded-full text-sm cursor-pointer ${
                allergens.includes(allergen.name) 
                  ? 'bg-red-100 text-red-800 border border-red-300' 
                  : 'bg-gray-100 text-gray-800 border border-gray-300'
              }`}
              onClick={() => onAllergenToggle(allergen.name)}
            >
              {allergen.name}
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <Label htmlFor="method" className="text-dark-text-DEFAULT">Method</Label>
        <Textarea 
          id="method"
          name="method"
          value={method || ''}
          onChange={onInputChange}
          placeholder="Enter cooking instructions"
          rows={6}
          className="text-dark-text-DEFAULT bg-white border border-gray-300"
        />
      </div>
    </div>
  );
};
