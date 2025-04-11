
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeFilters from "@/components/recipes/RecipeFilters";
import RecipeFormDialog from "@/components/recipes/RecipeFormDialog";
import RecipeDetailDialog from "@/components/recipes/RecipeDetailDialog";
import { Recipe, RecipeFilterOptions, Ingredient } from "@/types/recipe-types";
import { sampleFoodRecipes, menuCategories, allergenTypes } from "@/data/sample-recipe-data";
import { Plus, PanelLeft, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { v4 as uuidv4 } from 'uuid';

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
    letter: null,
    status: "live"
  });
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMaximized, setSidebarMaximized] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      console.log("Fetching recipes from Supabase...");
      const {
        data: recipesData,
        error: recipesError
      } = await supabase.from('recipes').select('*').eq('module_type', 'food');
      if (recipesError) {
        throw recipesError;
      }
      
      console.log(`Fetched ${recipesData.length} recipes`);
      
      const recipesWithIngredients = await Promise.all(recipesData.map(async recipe => {
        const {
          data: ingredientsData,
          error: ingredientsError
        } = await supabase.from('recipe_ingredients').select('*').eq('recipe_id', recipe.id);
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
              grossProfitPercentage: recipe.gross_profit_percentage || 0
            },
            moduleType: recipe.module_type,
            archived: recipe.archived || false
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
            grossProfitPercentage: recipe.gross_profit_percentage || 0
          },
          moduleType: recipe.module_type,
          archived: recipe.archived || false
        };
      }));
      setRecipes(recipesWithIngredients);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Failed to load recipes');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const saveRecipeToSupabase = async (recipe: Recipe, showToast: boolean = true) => {
    try {
      console.log("Starting saveRecipeToSupabase with recipe:", recipe);
      
      // Make sure recipe has an ID
      if (!recipe.id) {
        recipe.id = uuidv4();
        console.log("Generated new recipe ID:", recipe.id);
      }
      
      const recipeData = {
        id: recipe.id,
        name: recipe.name || 'Unnamed Recipe',
        category: recipe.category || 'Uncategorized',
        allergens: recipe.allergens || [],
        is_vegan: recipe.isVegan || false,
        is_vegetarian: recipe.isVegetarian || false,
        is_gluten_free: recipe.isGlutenFree || false,
        recommended_upsell: recipe.recommendedUpsell || '',
        time_to_table_minutes: recipe.timeToTableMinutes || 0,
        mise_en_place: recipe.miseEnPlace || '',
        method: recipe.method || '',
        image_url: recipe.imageUrl || '',
        module_type: recipe.moduleType || 'food',
        total_recipe_cost: recipe.costing.totalRecipeCost || 0,
        suggested_selling_price: recipe.costing.suggestedSellingPrice || 0,
        actual_menu_price: recipe.costing.actualMenuPrice || 0,
        gross_profit_percentage: recipe.costing.grossProfitPercentage || 0,
        archived: recipe.archived || false
      };
      
      console.log("Recipe data formatted for Supabase:", recipeData);
      
      // Try insert first, if it fails due to conflict then update
      const {
        data: insertedRecipe,
        error: insertError
      } = await supabase.from('recipes').insert([recipeData]).select();
      
      if (insertError) {
        console.log("Insert failed, trying upsert:", insertError);
        // If insert fails (likely due to ID conflict), try upsert
        const { error: upsertError } = await supabase.from('recipes').upsert([recipeData]);
        
        if (upsertError) {
          console.error("Error upserting recipe:", upsertError);
          throw upsertError;
        }
      } else {
        console.log("Recipe inserted successfully:", insertedRecipe);
      }
      
      // Delete existing ingredients to avoid duplicates
      console.log(`Deleting existing ingredients for recipe ${recipe.id}`);
      const { error: deleteError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipe.id);
      
      if (deleteError) {
        console.error('Error deleting existing ingredients:', deleteError);
        // Continue with insert even if delete fails
        console.log('Continuing with ingredient insert despite delete error');
      }
      
      // Insert all ingredients
      console.log(`Inserting ${recipe.ingredients.length} ingredients`);
      for (const ingredient of recipe.ingredients) {
        if (!ingredient.name || ingredient.name.trim() === '') {
          console.log("Skipping ingredient with empty name");
          continue;
        }
        
        const ingredientData = {
          id: ingredient.id || uuidv4(),
          recipe_id: recipe.id,
          name: ingredient.name || '',
          amount: ingredient.amount || 0,
          unit: ingredient.unit || '',
          cost_per_unit: ingredient.costPerUnit || 0,
          total_cost: ingredient.totalCost || 0
        };
        
        console.log("Saving ingredient:", ingredientData);
        
        const {
          data: insertedIngredient,
          error: ingredientError
        } = await supabase.from('recipe_ingredients').insert([ingredientData]).select();
        
        if (ingredientError) {
          console.error('Error saving ingredient:', ingredientError);
          toast.error(`Error saving ingredient ${ingredient.name}`);
        } else {
          console.log("Ingredient inserted successfully:", insertedIngredient);
        }
      }
      
      if (showToast) {
        toast.success('Recipe saved successfully');
      }
      
      console.log("Recipe and all ingredients saved successfully");
      return true;
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
      const {
        error
      } = await supabase.from('recipes').delete().eq('id', recipeId);
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
      if (filters.status === "live" && recipe.archived) {
        return false;
      }
      if (filters.status === "archived" && !recipe.archived) {
        return false;
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
      console.log("handleSaveRecipe called with:", recipe);
      
      // Ensure recipe has a valid ID
      if (!recipe.id) {
        recipe.id = uuidv4();
        console.log("Generated new recipe ID in handleSaveRecipe:", recipe.id);
      }
      
      // Save recipe to Supabase
      await saveRecipeToSupabase(recipe);
      
      // Update local state
      if (editingRecipe) {
        setRecipes(recipes.map(r => r.id === recipe.id ? recipe : r));
      } else {
        setRecipes(prevRecipes => [...prevRecipes, recipe]);
      }
      
      setFormOpen(false);
      setEditingRecipe(undefined);
      
      // Refresh recipes from database to ensure we have the latest data
      console.log("Refreshing recipes from database");
      await fetchRecipes();
      
      console.log("Recipe form closed, state updated");
    } catch (error) {
      console.error('Error in handleSaveRecipe:', error);
      toast.error('Failed to save recipe. Please try again.');
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

  const toggleMaximized = () => {
    setSidebarMaximized(!sidebarMaximized);
  };

  const DesktopSidebar = () => <div className={`border-r border-gray-200 bg-white transition-all duration-300 h-full overflow-auto relative ${sidebarMaximized ? 'w-120' : sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
    {sidebarOpen && (
      <div className="p-4">
        <div className="flex justify-end mb-2">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100 mr-1" onClick={toggleMaximized} title={sidebarMaximized ? "Restore sidebar" : "Maximize sidebar"}>
            {sidebarMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleSidebar} title="Collapse sidebar" className="h-6 w-6 p-0 opacity-60 hover:opacity-100 text-slate-900">
            <ChevronLeft className="h-3 w-3" />
          </Button>
        </div>
        <RecipeFilters moduleType="food" categories={menuCategories} allergens={allergenTypes} filters={filters} onFilterChange={handleFilterChange} onLetterSelect={handleLetterSelect} selectedLetter={selectedLetter} />
      </div>
    )}
  </div>;

  const MobileSidebar = () => <>
    <Button variant="outline" size="icon" className="fixed left-4 top-20 z-40 md:hidden shadow-md bg-white" onClick={() => setSidebarOpen(true)}>
      <PanelLeft className="h-4 w-4" />
    </Button>

    <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <DrawerContent className="max-h-[90vh]">
        <div className="p-4 max-h-[80vh] overflow-y-auto">
          <RecipeFilters moduleType="food" categories={menuCategories} allergens={allergenTypes} filters={filters} onFilterChange={handleFilterChange} onLetterSelect={handleLetterSelect} selectedLetter={selectedLetter} />
        </div>
      </DrawerContent>
    </Drawer>
  </>;

  return <div className="flex w-full min-h-svh bg-background">
    {!sidebarOpen && !isMobile && (
      <div className="fixed left-[288px] top-[86px] z-40 flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="shadow-md bg-white" 
          onClick={() => {
            setSidebarOpen(true);
            setSidebarMaximized(false);
          }}
          title="Open sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="shadow-md bg-white"
          onClick={() => {
            setSidebarOpen(true);
            setSidebarMaximized(!sidebarMaximized);
          }}
          title={sidebarMaximized ? "Restore sidebar" : "Maximize sidebar"}
        >
          {sidebarMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    )}
    
    {isMobile ? <MobileSidebar /> : <DesktopSidebar />}
    
    <div className="flex-1 relative">
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
          {loading ? <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading recipes...</p>
              </div>
            </div> : filteredRecipes.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRecipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setViewingRecipe(recipe)} />)}
            </div> : <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-gray-500">No recipes match your filters</p>
              <Button variant="outline" onClick={() => {
                setFilters({
                  searchTerm: "",
                  category: "all_categories",
                  allergens: [],
                  isVegan: null,
                  isVegetarian: null,
                  isGlutenFree: null,
                  letter: null,
                  status: "live"
                });
                setSelectedLetter(null);
              }} className="mt-4">
                Clear Filters
              </Button>
            </div>}
        </div>
      </div>
      
      {formOpen && <RecipeFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSaveRecipe} recipe={editingRecipe} moduleType="food" categories={menuCategories} allergens={allergenTypes} />}
      
      {viewingRecipe && <RecipeDetailDialog open={!!viewingRecipe} onClose={() => setViewingRecipe(undefined)} recipe={viewingRecipe} onEdit={() => {
        setViewingRecipe(undefined);
        setEditingRecipe(viewingRecipe);
        setFormOpen(true);
      }} onDelete={handleDeleteRecipe} />}
    </div>
  </div>;
};

export default FoodBible;
