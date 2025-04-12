
import React from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Recipe } from '@/types/recipe-types';

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
              <Label className="mb-1 block">Contains Allergens</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {allergenTypes.map((allergen) => (
                  <div key={typeof allergen === 'string' ? allergen : allergen.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`allergen-${typeof allergen === 'string' ? allergen : allergen.name}`}
                      checked={allergens?.includes(typeof allergen === 'string' ? allergen : allergen.name) || false}
                      onChange={(e) => {
                        onAllergenToggle(typeof allergen === 'string' ? allergen : allergen.name);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Label htmlFor={`allergen-${typeof allergen === 'string' ? allergen : allergen.name}`} className="text-sm font-medium">
                      {typeof allergen === 'string' ? allergen : allergen.name}
                    </Label>
                  </div>
                ))}
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
        
        {/* Image upload section */}
        <div>
          <Label className="mb-1 block">Image</Label>
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
