import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RecipeFilterOptions, MenuCategory, AllergenType } from "@/types/recipe-types";
import { Search, X, ChevronDown, ChevronUp, Filter, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  const [openCategory, setOpenCategory] = useState(true);
  const [openDietary, setOpenDietary] = useState(true);
  const [openAllergens, setOpenAllergens] = useState(true);
  const [openAlphabet, setOpenAlphabet] = useState(true);
  const [openStatus, setOpenStatus] = useState(true);
  
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
    if (currentValue === null) {
      onFilterChange({
        ...filters,
        [type]: true
      });
    } else if (currentValue === true) {
      onFilterChange({
        ...filters,
        [type]: false
      });
    } else {
      onFilterChange({
        ...filters,
        [type]: null
      });
    }
  };
  
  const handleStatusChange = (value: string) => {
    if (value === 'live' || value === 'archived') {
      onFilterChange({
        ...filters,
        status: value
      });
    }
  };
  
  const getDietaryButtonClass = (value: boolean | null) => {
    if (value === true) return "bg-green-100 border-green-500 text-green-800";
    if (value === false) return "bg-red-100 border-red-500 text-red-800";
    return "bg-gray-100 border-gray-300 text-gray-600";
  };
  
  const getDietaryButtonLabel = (value: boolean | null, type: 'isVegetarian' | 'isVegan' | 'isGlutenFree') => {
    switch(type) {
      case 'isVegetarian':
        if (value === null) return "Vegetarian";
        if (value === true) return "Vegetarian Only";
        return "Non-Vegetarian";
      case 'isVegan':
        if (value === null) return "Vegan";
        if (value === true) return "Vegan Only";
        return "Non-Vegan";
      case 'isGlutenFree':
        if (value === null) return "Gluten Free";
        if (value === true) return "Gluten-Free Only";
        return "Contains Gluten";
    }
  };
  
  const clearFilters = () => {
    onFilterChange({
      searchTerm: "",
      category: "all_categories",
      allergens: [],
      isVegan: null,
      isVegetarian: null,
      isGlutenFree: null,
      letter: null,
      status: "live"
    });
    setSearchTerm("");
    onLetterSelect(null);
  };

  const CollapsibleHeader = ({ 
    title, 
    isOpen, 
    onClick 
  }: { 
    title: string; 
    isOpen: boolean; 
    onClick: () => void 
  }) => (
    <div className="flex justify-between items-center mb-2">
      <Label className="text-tavern-blue-dark font-medium text-base">{title}</Label>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClick} 
          className="p-0 h-8 w-8 hover:bg-gray-100 rounded-full"
          title={isOpen ? "Minimize" : "Expand"}
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
    </div>
  );

  const activeFiltersCount = 
    (filters.category !== "all_categories" ? 1 : 0) + 
    (filters.allergens.length) + 
    (filters.isVegan !== null ? 1 : 0) + 
    (filters.isVegetarian !== null ? 1 : 0) + 
    (filters.isGlutenFree !== null ? 1 : 0) + 
    (filters.letter !== null ? 1 : 0) +
    (filters.status !== "live" ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Filter className="mr-2 h-4 w-4" /> Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </h2>
        
        {(filters.searchTerm || filters.category !== "all_categories" || filters.allergens.length > 0 || 
           filters.isVegan !== null || filters.isVegetarian !== null || filters.isGlutenFree !== null || 
           selectedLetter || filters.status !== "live") && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters} title="Clear all filters">
            <X className="h-4 w-4" />
            <span className="ml-1">Clear</span>
          </Button>
        )}
      </div>
      
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
      </form>
      
      <Collapsible open={openStatus} onOpenChange={setOpenStatus}>
        <CollapsibleHeader title="Status" isOpen={openStatus} onClick={() => setOpenStatus(!openStatus)} />
        <CollapsibleContent>
          <ToggleGroup 
            type="single" 
            value={filters.status || "live"}
            onValueChange={(value) => {
              if (value === 'live' || value === 'archived') {
                handleStatusChange(value);
              }
            }}
            className="justify-start"
          >
            <ToggleGroupItem 
              value="live" 
              className="flex items-center gap-1 text-sm"
            >
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Live
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="archived" 
              className="flex items-center gap-1 text-sm bg-gray-600 text-white hover:bg-gray-700"
            >
              <Archive className="h-3 w-3 mr-1" />
              Archived
            </ToggleGroupItem>
          </ToggleGroup>
        </CollapsibleContent>
      </Collapsible>
      
      <Collapsible open={openCategory} onOpenChange={setOpenCategory}>
        <CollapsibleHeader title="Category" isOpen={openCategory} onClick={() => setOpenCategory(!openCategory)} />
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Collapsible>
      
      <Collapsible open={openDietary} onOpenChange={setOpenDietary}>
        <CollapsibleHeader title="Dietary Requirements" isOpen={openDietary} onClick={() => setOpenDietary(!openDietary)} />
        <CollapsibleContent>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={getDietaryButtonClass(filters.isVegetarian)}
              onClick={() => handleDietaryToggle('isVegetarian')}
            >
              {getDietaryButtonLabel(filters.isVegetarian, 'isVegetarian')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={getDietaryButtonClass(filters.isVegan)}
              onClick={() => handleDietaryToggle('isVegan')}
            >
              {getDietaryButtonLabel(filters.isVegan, 'isVegan')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={getDietaryButtonClass(filters.isGlutenFree)}
              onClick={() => handleDietaryToggle('isGlutenFree')}
            >
              {getDietaryButtonLabel(filters.isGlutenFree, 'isGlutenFree')}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <Collapsible open={openAllergens} onOpenChange={setOpenAllergens}>
        <CollapsibleHeader title="Allergens" isOpen={openAllergens} onClick={() => setOpenAllergens(!openAllergens)} />
        <CollapsibleContent>
          <div className="flex flex-wrap gap-2">
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
        </CollapsibleContent>
      </Collapsible>
      
      <Collapsible open={openAlphabet} onOpenChange={setOpenAlphabet}>
        <CollapsibleHeader title="A-Z" isOpen={openAlphabet} onClick={() => setOpenAlphabet(!openAlphabet)} />
        <CollapsibleContent>
          <div className="flex flex-wrap gap-1">
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default RecipeFilters;
