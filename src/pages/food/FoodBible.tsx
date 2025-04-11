import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeFilters from "@/components/recipes/RecipeFilters";
import RecipeFormDialog from "@/components/recipes/RecipeFormDialog";
import RecipeDetailDialog from "@/components/recipes/RecipeDetailDialog";
import { Recipe, RecipeFilterOptions, Ingredient } from "@/types/recipe-types";
import { sampleFoodRecipes, menuCategories, allergenTypes } from "@/data/sample-recipe-data";
import { Plus, PanelLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Drawer, 
  DrawerContent, 
  DrawerTrigger 
} from "@/components/ui/drawer";

const FoodBible: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RecipeFilterOptions>({
    searchTerm: "",
    category: "all_categories",
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    fetchRecipes();
  }, []);
  
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .eq('module_type', 'food');
        
      if (recipesError) {
        throw recipesError;
      }
      
      const recipesWithIngredients = await Promise.all(
        recipesData.map(async (recipe) => {
          const { data: ingredientsData, error: ingredientsError } = await supabase
            .from('recipe_ingredients')
            .select('*')
            .eq('recipe_id', recipe.id);
            
          if (ingredientsError) {
            console.error('Error fetching ingredients:', ingredientsError);
            return {
              ...recipe,
              ingredients: [],
              allergens: recipe.allergens || [],
              costing: {
                totalRecipeCost: recipe.total_recipe_cost || 0,
                suggestedSellingPrice: recipe.suggested_selling_price || 0,
                actualMenuPrice: recipe.actual_menu_price || 0,
                grossProfitPercentage: recipe.gross_profit_percentage || 0,
              },
              moduleType: recipe.module_type
            };
          }
          
          const mappedIngredients: Ingredient[] = ingredientsData.map(ingredient => ({
            id: ingredient.id,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            costPerUnit: ingredient.cost_per_unit,
            totalCost: ingredient.total_cost
          }));
          
          return {
            id: recipe.id,
            name: recipe.name,
            category: recipe.category,
            allergens: recipe.allergens || [],
            isVegan: recipe.is_vegan,
            isVegetarian: recipe.is_vegetarian,
            isGlutenFree: recipe.is_gluten_free,
            recommendedUpsell: recipe.recommended_upsell || '',
            timeToTableMinutes: recipe.time_to_table_minutes || 0,
            miseEnPlace: recipe.mise_en_place || '',
            method: recipe.method || '',
            createdAt: new Date(recipe.created_at),
            updatedAt: new Date(recipe.updated_at),
            imageUrl: recipe.image_url,
            ingredients: mappedIngredients,
            costing: {
              totalRecipeCost: recipe.total_recipe_cost || 0,
              suggestedSellingPrice: recipe.suggested_selling_price || 0,
              actualMenuPrice: recipe.actual_menu_price || 0,
              grossProfitPercentage: recipe.gross_profit_percentage || 0,
            },
            moduleType: recipe.module_type
          };
        })
      );
      
      if (recipesWithIngredients.length === 0) {
        setRecipes(sampleFoodRecipes);
        sampleFoodRecipes.forEach(recipe => {
          saveRecipeToSupabase(recipe, false);
        });
      } else {
        setRecipes(recipesWithIngredients);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Failed to load recipes');
      
      setRecipes(sampleFoodRecipes);
    } finally {
      setLoading(false);
    }
  };
  
  const saveRecipeToSupabase = async (recipe: Recipe, showToast: boolean = true) => {
    try {
      const recipeData = {
        id: recipe.id,
        name: recipe.name,
        category: recipe.category,
        allergens: recipe.allergens,
        is_vegan: recipe.isVegan,
        is_vegetarian: recipe.isVegetarian,
        is_gluten_free: recipe.isGlutenFree,
        recommended_upsell: recipe.recommendedUpsell,
        time_to_table_minutes: recipe.timeToTableMinutes,
        mise_en_place: recipe.miseEnPlace,
        method: recipe.method,
        image_url: recipe.imageUrl,
        module_type: recipe.moduleType || 'food',
        total_recipe_cost: recipe.costing.totalRecipeCost,
        suggested_selling_price: recipe.costing.suggestedSellingPrice,
        actual_menu_price: recipe.costing.actualMenuPrice,
        gross_profit_percentage: recipe.costing.grossProfitPercentage,
      };
      
      const { error: recipeError } = await supabase
        .from('recipes')
        .upsert([recipeData]);
        
      if (recipeError) {
        throw recipeError;
      }
      
      for (const ingredient of recipe.ingredients) {
        const ingredientData = {
          id: ingredient.id,
          recipe_id: recipe.id,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          cost_per_unit: ingredient.costPerUnit,
          total_cost: ingredient.totalCost
        };
        
        const { error: ingredientError } = await supabase
          .from('recipe_ingredients')
          .upsert([ingredientData]);
          
        if (ingredientError) {
          console.error('Error saving ingredient:', ingredientError);
        }
      }
      
      if (showToast) {
        toast.success('Recipe saved successfully');
      }
      
    } catch (error) {
      console.error('Error saving recipe:', error);
      if (showToast) {
        toast.error('Failed to save recipe');
      }
      throw error;
    }
  };
  
  const deleteRecipeFromSupabase = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);
        
      if (error) {
        throw error;
      }
      
      toast.success('Recipe deleted successfully');
      
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Failed to delete recipe');
      throw error;
    }
  };
  
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      if (filters.searchTerm && !recipe.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      
      if (filters.category && filters.category !== "all_categories" && recipe.category !== filters.category) {
        return false;
      }
      
      if (selectedLetter && !recipe.name.toUpperCase().startsWith(selectedLetter)) {
        return false;
      }
      
      if (filters.isVegan !== null && recipe.isVegan !== filters.isVegan) {
        return false;
      }
      
      if (filters.isVegetarian !== null && recipe.isVegetarian !== filters.isVegetarian) {
        return false;
      }
      
      if (filters.isGlutenFree !== null && recipe.isGlutenFree !== filters.isGlutenFree) {
        return false;
      }
      
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
  
  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      await saveRecipeToSupabase(recipe);
      
      if (editingRecipe) {
        setRecipes(recipes.map(r => r.id === recipe.id ? recipe : r));
      } else {
        setRecipes([...recipes, recipe]);
      }
      
      setFormOpen(false);
      
    } catch (error) {
      console.error('Error in handleSaveRecipe:', error);
    }
  };
  
  const handleDeleteRecipe = async (recipe: Recipe) => {
    try {
      await deleteRecipeFromSupabase(recipe.id);
      setRecipes(recipes.filter(r => r.id !== recipe.id));
      setViewingRecipe(undefined);
    } catch (error) {
      console.error('Error in handleDeleteRecipe:', error);
    }
  };
  
  const handleViewRecipe = (recipe: Recipe) => {
    setViewingRecipe(recipe);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const DesktopSidebar = () => (
    <div className={`border-r border-gray-200 bg-white transition-all duration-300 h-full overflow-auto ${sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
      <div className={`p-4 ${!sidebarOpen && 'hidden'}`}>
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
    </div>
  );

  const MobileSidebar = () => (
    <>
      <Button 
        variant="outline"
        size="icon"
        className="fixed left-4 top-20 z-40 md:hidden shadow-md bg-white"
        onClick={() => setSidebarOpen(true)}
      >
        <PanelLeft className="h-4 w-4" />
      </Button>

      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="max-h-[90vh]">
          <div className="p-4 max-h-[80vh] overflow-y-auto">
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
        </DrawerContent>
      </Drawer>
    </>
  );

  return (
    <div className="flex w-full min-h-svh bg-background">
      {isMobile ? <MobileSidebar /> : <DesktopSidebar />}
      
      <div className="flex-1 relative">
        {!isMobile && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-16 z-10 h-8 w-8 rounded-r-md rounded-l-none border-l-0 p-0"
            onClick={toggleSidebar}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
        
        <div className="container px-4 py-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Food Bible</h1>
              <p className="text-muted-foreground">Manage and explore food recipes</p>
            </div>
            <Button onClick={() => setFormOpen(true)} className="mt-4 md:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Recipe
            </Button>
          </div>
          
          <div className="w-full">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading recipes...</p>
                </div>
              </div>
            ) : filteredRecipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRecipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => setViewingRecipe(recipe)}
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
                      category: "all_categories",
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
          onDelete={handleDeleteRecipe}
        />
      )}
    </div>
  );
};

export default FoodBible;
