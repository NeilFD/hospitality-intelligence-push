import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RecipeFilterOptions, MenuCategory, AllergenType } from "@/types/recipe-types";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecipeFiltersProps {
  moduleType: 'food' | 'beverage';
  categories: MenuCategory[];
  allergens: AllergenType[];
  filters: RecipeFilterOptions;
  onFilterChange: (filters: RecipeFilterOptions) => void;
  onLetterSelect: (letter: string | null) => void;
  selectedLetter: string | null;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const RecipeFilters: React.FC<RecipeFiltersProps> = ({
  moduleType,
  categories,
  allergens,
  filters,
  onFilterChange,
  onLetterSelect,
  selectedLetter
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      ...filters,
      searchTerm
    });
  };
  
  const handleCategoryChange = (value: string) => {
    onFilterChange({
      ...filters,
      category: value
    });
  };
  
  const handleAllergenToggle = (allergen: string) => {
    const updatedAllergens = filters.allergens.includes(allergen)
      ? filters.allergens.filter(a => a !== allergen)
      : [...filters.allergens, allergen];
    
    onFilterChange({
      ...filters,
      allergens: updatedAllergens
    });
  };
  
  const handleDietaryToggle = (type: 'isVegan' | 'isVegetarian' | 'isGlutenFree') => {
    const currentValue = filters[type];
    onFilterChange({
      ...filters,
      [type]: currentValue === null ? true : (currentValue === true ? false : null)
    });
  };
  
  const getDietaryButtonClass = (value: boolean | null) => {
    if (value === true) return "bg-green-100 border-green-500 text-green-800";
    if (value === false) return "bg-red-100 border-red-500 text-red-800";
    return "bg-gray-100 border-gray-300 text-gray-600";
  };
  
  const getDietaryButtonLabel = (value: boolean | null, positiveText: string) => {
    if (value === true) return positiveText;
    if (value === false) return `Not ${positiveText}`;
    return `All`;
  };
  
  const clearFilters = () => {
    onFilterChange({
      searchTerm: "",
      category: "all_categories",
      allergens: [],
      isVegan: null,
      isVegetarian: null,
      isGlutenFree: null,
      letter: null
    });
    setSearchTerm("");
    onLetterSelect(null);
  };

  return (
    <div className="space-y-4 pb-4 border-b w-full">
      <div className="space-y-4">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-grow">
              <Input 
                type="text" 
                placeholder={`Search ${moduleType === 'food' ? 'dishes' : 'beverages'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            {(filters.searchTerm || filters.category !== "all_categories" || filters.allergens.length > 0 || 
              filters.isVegan !== null || filters.isVegetarian !== null || filters.isGlutenFree !== null) && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters} title="Clear all filters">
                <X className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <Label htmlFor="category" className="text-tavern-blue-dark mb-2 block">Category</Label>
            <Select
              value={filters.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_categories">All Categories</SelectItem>
                {categories.filter(cat => cat.moduleType === moduleType).map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <Label className="mb-2 block text-tavern-blue-dark">Dietary Requirements</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={getDietaryButtonClass(filters.isVegetarian)}
                onClick={() => handleDietaryToggle('isVegetarian')}
              >
                {getDietaryButtonLabel(filters.isVegetarian, 'Vegetarian')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={getDietaryButtonClass(filters.isVegan)}
                onClick={() => handleDietaryToggle('isVegan')}
              >
                {getDietaryButtonLabel(filters.isVegan, 'Vegan')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={getDietaryButtonClass(filters.isGlutenFree)}
                onClick={() => handleDietaryToggle('isGlutenFree')}
              >
                {getDietaryButtonLabel(filters.isGlutenFree, 'Gluten Free')}
              </Button>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <Label className="mb-2 block text-tavern-blue-dark">Allergens</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {allergens.map((allergen) => (
                <Badge 
                  key={allergen.id}
                  variant={filters.allergens.includes(allergen.name) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    filters.allergens.includes(allergen.name) 
                      ? "bg-tavern-blue text-white" 
                      : "bg-gray-100 text-tavern-blue-dark"
                  }`}
                  onClick={() => handleAllergenToggle(allergen.name)}
                >
                  {allergen.name}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <Label className="mb-2 block text-tavern-blue-dark">A-Z</Label>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              <Button 
                size="sm"
                variant={selectedLetter === null ? "default" : "outline"}
                className="w-8 h-8 p-0 text-xs"
                onClick={() => onLetterSelect(null)}
              >
                All
              </Button>
              {alphabet.map((letter) => (
                <Button 
                  key={letter}
                  size="sm"
                  variant={selectedLetter === letter ? "default" : "outline"}
                  className="w-8 h-8 p-0 text-xs"
                  onClick={() => onLetterSelect(letter)}
                >
                  {letter}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeFilters;
