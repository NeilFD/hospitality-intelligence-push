
import React from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Recipe, MenuCategory } from '@/types/recipe-types';

interface RecipeBasicInfoProps {
  name: string;
  category: string;
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  allergens: string[];
  method: string;
  imagePreview?: string;
  categories: MenuCategory[] | string[];
  allergenTypes: string[] | { id: string; name: string; }[];
  moduleType: 'food' | 'beverage' | 'hospitality';
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCategoryChange: (category: string) => void;
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
        <h2 className="text-xl font-semibold mb-2">{moduleType === 'hospitality' ? 'Guide Details' : 'Recipe Details'}</h2>
        <p className="text-muted-foreground">Basic information about {moduleType === 'hospitality' ? 'this service guide' : 'this recipe'}</p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="name">
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
          <Label htmlFor="category">
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
              {Array.isArray(categories) && categories.map((cat) => {
                const categoryValue = typeof cat === 'string' ? cat : cat.name;
                return (
                  <SelectItem key={categoryValue} value={categoryValue}>
                    {categoryValue}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {moduleType !== 'hospitality' && (
          <>
            <div>
              <Label className="mb-1 block">Contains Allergens</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {Array.isArray(allergenTypes) && allergenTypes.map((allergen) => {
                  const allergenName = typeof allergen === 'string' ? allergen : allergen.name;
                  return (
                    <div key={allergenName} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`allergen-${allergenName}`}
                        checked={allergens.includes(allergenName)}
                        onChange={(e) => onAllergenToggle(allergenName)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label htmlFor={`allergen-${allergenName}`} className="text-sm font-medium">
                        {allergenName}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Vegan</Label>
                <RadioGroup
                  value={isVegan ? 'yes' : 'no'}
                  onValueChange={(value) => onCheckboxChange('isVegan', value === 'yes')}
                  className="flex space-x-4 mt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="vegan-yes" />
                    <Label htmlFor="vegan-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="vegan-no" />
                    <Label htmlFor="vegan-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Vegetarian</Label>
                <RadioGroup
                  value={isVegetarian ? 'yes' : 'no'}
                  onValueChange={(value) => onCheckboxChange('isVegetarian', value === 'yes')}
                  className="flex space-x-4 mt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="vegetarian-yes" />
                    <Label htmlFor="vegetarian-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="vegetarian-no" />
                    <Label htmlFor="vegetarian-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Gluten Free</Label>
                <RadioGroup
                  value={isGlutenFree ? 'yes' : 'no'}
                  onValueChange={(value) => onCheckboxChange('isGlutenFree', value === 'yes')}
                  className="flex space-x-4 mt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="gluten-free-yes" />
                    <Label htmlFor="gluten-free-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="gluten-free-no" />
                    <Label htmlFor="gluten-free-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </>
        )}
        
        {method && (
          <div>
            <Label htmlFor="method">{moduleType === 'hospitality' ? 'Detailed Procedure' : 'Method'}</Label>
            <textarea
              id="method"
              name="method"
              rows={6}
              value={method}
              onChange={onInputChange}
              className="mt-1 w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-900"
              placeholder={moduleType === 'hospitality' ? "Describe detailed procedure and instructions..." : "Describe the recipe method steps..."}
            />
          </div>
        )}

        <div>
          <Label>{moduleType === 'hospitality' ? 'Guide Image' : 'Recipe Image'}</Label>
          <div className="mt-2 flex items-center">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-md" />
                <button 
                  type="button" 
                  onClick={onImageRemove}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center"
                  aria-label="Remove image"
                >
                  &times;
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="image-upload" className="cursor-pointer bg-gray-200 hover:bg-gray-300 rounded-md px-4 py-2 inline-block">
                  Upload Image
                </label>
                <input 
                  type="file" 
                  id="image-upload" 
                  accept="image/*"
                  onChange={onImageUpload}
                  className="hidden" 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeBasicInfo;
