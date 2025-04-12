import React from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Recipe } from '@/types/recipe-types';
import { Button } from '@/components/ui/button';
import { Check, Circle } from 'lucide-react';

interface RecipeBasicInfoProps {
  name: string;
  category: string;
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  allergens: string[];
  method: string;
  imagePreview?: string;
  categories: any[];
  allergenTypes: any[];
  moduleType: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCategoryChange: (value: string) => void;
  onCheckboxChange: (name: string, checked: boolean) => void;
  onAllergenToggle: (allergen: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
}

const RecipeBasicInfo: React.FC<RecipeBasicInfoProps> = ({
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
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2 text-gray-900">{moduleType === 'hospitality' ? 'Guide Details' : 'Recipe Details'}</h2>
        <p className="text-gray-700">Basic information about {moduleType === 'hospitality' ? 'this service guide' : 'this recipe'}</p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="name" className="text-gray-900">
            {moduleType === 'hospitality' ? 'Guide Name' : 'Recipe Name'}
          </Label>
          <Input 
            id="name" 
            name="name"
            value={name} 
            onChange={onInputChange}
            placeholder={moduleType === 'hospitality' ? "Enter guide name..." : "Enter recipe name..."}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="category" className="text-gray-900">
            {moduleType === 'hospitality' ? 'Service Category' : 'Category'}
          </Label>
          <Select 
            value={category || 'Uncategorized'} 
            onValueChange={onCategoryChange}
          >
            <SelectTrigger id="category" className="w-full mt-1">
              <SelectValue placeholder={moduleType === 'hospitality' ? 'Select service category' : 'Select a category'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Uncategorized">Uncategorized</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={typeof cat === 'string' ? cat : cat.id} value={typeof cat === 'string' ? cat : cat.name}>
                  {typeof cat === 'string' ? cat : cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {moduleType !== 'hospitality' && (
          <>
            <div>
              <Label className="mb-2 block text-gray-900">Contains Allergens</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {allergenTypes.map((allergen) => {
                  const allergenName = typeof allergen === 'string' ? allergen : allergen.name;
                  const isSelected = allergens?.includes(allergenName) || false;
                  
                  return (
                    <div 
                      key={allergenName}
                      onClick={() => onAllergenToggle(allergenName)}
                      className={`
                        flex items-center gap-2 p-2 rounded-md cursor-pointer border transition-colors
                        ${isSelected 
                          ? 'bg-blue-100 border-blue-500 text-blue-800' 
                          : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'}
                      `}
                    >
                      <div className={`
                        h-5 w-5 rounded flex items-center justify-center border
                        ${isSelected 
                          ? 'bg-blue-500 border-blue-600' 
                          : 'bg-white border-gray-300'}
                      `}>
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{allergenName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <Label className="mb-2 block text-gray-900">Vegan</Label>
                <div className="flex gap-4 mt-1">
                  <div 
                    onClick={() => onCheckboxChange('isVegan', true)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className={`
                      h-5 w-5 rounded-full flex items-center justify-center border
                      ${isVegan 
                        ? 'bg-green-500 border-green-600' 
                        : 'bg-white border-gray-300'}
                    `}>
                      {isVegan && <Circle className="h-2.5 w-2.5 fill-white text-white" />}
                    </div>
                    <span>Yes</span>
                  </div>
                  <div 
                    onClick={() => onCheckboxChange('isVegan', false)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className={`
                      h-5 w-5 rounded-full flex items-center justify-center border
                      ${!isVegan 
                        ? 'bg-green-500 border-green-600' 
                        : 'bg-white border-gray-300'}
                    `}>
                      {!isVegan && <Circle className="h-2.5 w-2.5 fill-white text-white" />}
                    </div>
                    <span>No</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-gray-900">Vegetarian</Label>
                <div className="flex gap-4 mt-1">
                  <div 
                    onClick={() => onCheckboxChange('isVegetarian', true)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className={`
                      h-5 w-5 rounded-full flex items-center justify-center border
                      ${isVegetarian 
                        ? 'bg-green-500 border-green-600' 
                        : 'bg-white border-gray-300'}
                    `}>
                      {isVegetarian && <Circle className="h-2.5 w-2.5 fill-white text-white" />}
                    </div>
                    <span>Yes</span>
                  </div>
                  <div 
                    onClick={() => onCheckboxChange('isVegetarian', false)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className={`
                      h-5 w-5 rounded-full flex items-center justify-center border
                      ${!isVegetarian 
                        ? 'bg-green-500 border-green-600' 
                        : 'bg-white border-gray-300'}
                    `}>
                      {!isVegetarian && <Circle className="h-2.5 w-2.5 fill-white text-white" />}
                    </div>
                    <span>No</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-gray-900">Gluten Free</Label>
                <div className="flex gap-4 mt-1">
                  <div 
                    onClick={() => onCheckboxChange('isGlutenFree', true)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className={`
                      h-5 w-5 rounded-full flex items-center justify-center border
                      ${isGlutenFree 
                        ? 'bg-green-500 border-green-600' 
                        : 'bg-white border-gray-300'}
                    `}>
                      {isGlutenFree && <Circle className="h-2.5 w-2.5 fill-white text-white" />}
                    </div>
                    <span>Yes</span>
                  </div>
                  <div 
                    onClick={() => onCheckboxChange('isGlutenFree', false)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className={`
                      h-5 w-5 rounded-full flex items-center justify-center border
                      ${!isGlutenFree 
                        ? 'bg-green-500 border-green-600' 
                        : 'bg-white border-gray-300'}
                    `}>
                      {!isGlutenFree && <Circle className="h-2.5 w-2.5 fill-white text-white" />}
                    </div>
                    <span>No</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        <div>
          <Label className="mb-1 block text-gray-900">Image</Label>
          <div className="mt-1">
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Recipe preview" 
                  className="w-full h-48 object-cover rounded-md"
                />
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={onImageRemove}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Upload an image</span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only"
                        accept="image/*" 
                        onChange={onImageUpload}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeBasicInfo;
