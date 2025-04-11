
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeFilters from "@/components/recipes/RecipeFilters";
import RecipeFormDialog from "@/components/recipes/RecipeFormDialog";
import RecipeDetailDialog from "@/components/recipes/RecipeDetailDialog";
import { Recipe, RecipeFilterOptions } from "@/types/recipe-types";
import { sampleFoodRecipes, menuCategories, allergenTypes } from "@/data/sample-recipe-data";
import { Plus } from "lucide-react";

const FoodBible: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(sampleFoodRecipes);
  const [filters, setFilters] = useState<RecipeFilterOptions>({
    searchTerm: "",
    category: "",
    allergens: [],
    isVegan: null,
    isVegetarian: null,
    isGlutenFree: null,
    letter: null
  });
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | undefined>(undefined);
  
  // Filter recipes based on selected filters
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      // Filter by search term
      if (filters.searchTerm && !recipe.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by category
      if (filters.category && filters.category !== "all_categories" && recipe.category !== filters.category) {
        return false;
      }
      
      // Filter by starting letter
      if (selectedLetter && !recipe.name.toUpperCase().startsWith(selectedLetter)) {
        return false;
      }
      
      // Filter by dietary requirements
      if (filters.isVegan !== null && recipe.isVegan !== filters.isVegan) {
        return false;
      }
      
      if (filters.isVegetarian !== null && recipe.isVegetarian !== filters.isVegetarian) {
        return false;
      }
      
      if (filters.isGlutenFree !== null && recipe.isGlutenFree !== filters.isGlutenFree) {
        return false;
      }
      
      // Filter by allergens (if selected, only show recipes WITHOUT those allergens)
      if (filters.allergens.length > 0) {
        for (const allergen of filters.allergens) {
          if (recipe.allergens.includes(allergen)) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [recipes, filters, selectedLetter]);
  
  const handleFilterChange = (newFilters: RecipeFilterOptions) => {
    setFilters(newFilters);
  };
  
  const handleLetterSelect = (letter: string | null) => {
    setSelectedLetter(letter);
    setFilters({
      ...filters,
      letter
    });
  };
  
  const handleAddRecipe = () => {
    setEditingRecipe(undefined);
    setFormOpen(true);
  };
  
  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormOpen(true);
  };
  
  const handleSaveRecipe = (recipe: Recipe) => {
    if (editingRecipe) {
      // Update existing recipe
      setRecipes(recipes.map(r => r.id === recipe.id ? recipe : r));
    } else {
      // Add new recipe
      setRecipes([...recipes, recipe]);
    }
    setFormOpen(false);
  };
  
  const handleViewRecipe = (recipe: Recipe) => {
    setViewingRecipe(recipe);
  };

  return (
    <div className="container px-4 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Food Bible</h1>
          <p className="text-muted-foreground">Manage and explore food recipes</p>
        </div>
        <Button onClick={handleAddRecipe} className="mt-4 md:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Recipe
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <RecipeFilters
            moduleType="food"
            categories={menuCategories}
            allergens={allergenTypes}
            filters={filters}
            onFilterChange={handleFilterChange}
            onLetterSelect={handleLetterSelect}
            selectedLetter={selectedLetter}
          />
        </div>
        
        <div className="lg:col-span-3">
          {filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => handleViewRecipe(recipe)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-gray-500">No recipes match your filters</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({
                    searchTerm: "",
                    category: "",
                    allergens: [],
                    isVegan: null,
                    isVegetarian: null,
                    isGlutenFree: null,
                    letter: null
                  });
                  setSelectedLetter(null);
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {formOpen && (
        <RecipeFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={handleSaveRecipe}
          recipe={editingRecipe}
          moduleType="food"
          categories={menuCategories}
          allergens={allergenTypes}
        />
      )}
      
      {viewingRecipe && (
        <RecipeDetailDialog
          open={!!viewingRecipe}
          onClose={() => setViewingRecipe(undefined)}
          recipe={viewingRecipe}
          onEdit={() => {
            setViewingRecipe(undefined);
            setEditingRecipe(viewingRecipe);
            setFormOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default FoodBible;
