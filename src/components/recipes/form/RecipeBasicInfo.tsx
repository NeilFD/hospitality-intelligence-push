
import React from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Recipe } from '@/types/recipe-types';

interface RecipeBasicInfoProps {
  recipe: Partial<Recipe>;
  categories: string[];
  allergens: string[];
  onNameChange: (name: string) => void;
  onCategoryChange: (category: string) => void;
  onAllergensChange: (allergens: string[]) => void;
  onVeganChange: (isVegan: boolean) => void;
  onVegetarianChange: (isVegetarian: boolean) => void;
  onGlutenFreeChange: (isGlutenFree: boolean) => void;
  moduleType: string;
}

const RecipeBasicInfo: React.FC<RecipeBasicInfoProps> = ({
  recipe,
  categories,
  allergens,
  onNameChange,
  onCategoryChange,
  onAllergensChange,
  onVeganChange,
  onVegetarianChange,
  onGlutenFreeChange,
  moduleType
}) => {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">{moduleType === 'hospitality' ? 'Guide Details' : 'Recipe Details'}</h2>
        <p className="text-muted-foreground">Basic information about {moduleType === 'hospitality' ? 'this service guide' : 'this recipe'}</p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="recipeName">
            {moduleType === 'hospitality' ? 'Guide Name' : 'Recipe Name'}
          </Label>
          <Input 
            id="recipeName" 
            value={recipe.name || ''} 
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={moduleType === 'hospitality' ? "Enter guide name..." : "Enter recipe name..."}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="category">
            {moduleType === 'hospitality' ? 'Service Category' : 'Category'}
          </Label>
          <Select 
            value={recipe.category || 'Uncategorized'} 
            onValueChange={onCategoryChange}
          >
            <SelectTrigger id="category" className="w-full mt-1">
              <SelectValue placeholder={moduleType === 'hospitality' ? 'Select service category' : 'Select a category'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Uncategorized">Uncategorized</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
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
                {allergens.map((allergen) => (
                  <div key={allergen} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`allergen-${allergen}`}
                      checked={recipe.allergens?.includes(allergen) || false}
                      onChange={(e) => {
                        const newAllergens = e.target.checked
                          ? [...(recipe.allergens || []), allergen]
                          : (recipe.allergens || []).filter(a => a !== allergen);
                        onAllergensChange(newAllergens);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Label htmlFor={`allergen-${allergen}`} className="text-sm font-medium">
                      {allergen}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Vegan</Label>
                <RadioGroup
                  value={recipe.isVegan ? 'yes' : 'no'}
                  onValueChange={(value) => onVeganChange(value === 'yes')}
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
                  value={recipe.isVegetarian ? 'yes' : 'no'}
                  onValueChange={(value) => onVegetarianChange(value === 'yes')}
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
                  value={recipe.isGlutenFree ? 'yes' : 'no'}
                  onValueChange={(value) => onGlutenFreeChange(value === 'yes')}
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
      </div>
    </div>
  );
};

export default RecipeBasicInfo;
