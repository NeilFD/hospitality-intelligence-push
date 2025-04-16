
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Recipe } from '@/types/recipe-types';
import { supabase } from '@/lib/supabase';
import RecipeDetailDialog from '@/components/recipes/RecipeDetailDialog';
import RecipeFormDialog from '@/components/recipes/RecipeFormDialog';
import { toast } from 'sonner';

const FoodBible: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  
  const handleOpenDetailDialog = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setDetailDialogOpen(true);
  };
  
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedRecipe(null);
  };
  
  const handleOpenFormDialog = (recipe?: Recipe) => {
    setSelectedRecipe(recipe || null);
    setFormDialogOpen(true);
  };
  
  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedRecipe(null);
  };
  
  const handleRecipeUpdated = (updatedRecipe: Recipe) => {
    setRecipes(prevRecipes =>
      prevRecipes.map(recipe =>
        recipe.id === updatedRecipe.id ? updatedRecipe : recipe
      )
    );
    handleCloseFormDialog();
  };
  
  const handleRecipeCreated = (newRecipe: Recipe) => {
    setRecipes(prevRecipes => [...prevRecipes, newRecipe]);
    handleCloseFormDialog();
  };
  
  const handleRecipeDeleted = async (recipeToDelete: Recipe) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeToDelete.id);
        
      if (error) {
        console.error('Error deleting recipe:', error);
        toast.error('Failed to delete recipe');
        return;
      }
      
      setRecipes(prevRecipes =>
        prevRecipes.filter(recipe => recipe.id !== recipeToDelete.id)
      );
      handleCloseDetailDialog();
      toast.success('Recipe deleted successfully');
    } catch (error) {
      console.error('Unexpected error deleting recipe:', error);
      toast.error('Failed to delete recipe');
    }
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('module_type', 'food')
          .order('name');

        if (error) {
          console.error('Error fetching recipes:', error);
          return;
        }

        // Process the recipe data to match the Recipe type
        const processedRecipes: Recipe[] = data.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          ingredients: item.ingredients || [],
          allergens: item.allergens || [],
          isVegan: item.is_vegan || false,
          isVegetarian: item.is_vegetarian || false,
          isGlutenFree: item.is_gluten_free || false,
          timeToTableMinutes: item.time_to_table_minutes || 0,
          method: item.method || '',
          miseEnPlace: item.mise_en_place || '',
          imageUrl: item.image_url || '',
          costing: {
            totalRecipeCost: item.total_recipe_cost || 0,
            suggestedSellingPrice: item.suggested_selling_price || 0,
            actualMenuPrice: item.actual_menu_price || 0,
            grossProfitPercentage: item.gross_profit_percentage || 0
          },
          archived: item.archived || false,
          postedToNoticeboard: item.posted_to_noticeboard || false,
          moduleType: 'food' as const,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at)
        }));

        setRecipes(processedRecipes);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Food Recipes</h1>
        <div className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:w-64"
          />
          <Button variant="outline" asChild>
            <Link to="/food/categories">Manage Categories</Link>
          </Button>
          <Button onClick={() => handleOpenFormDialog()} className="bg-green-500 text-white hover:bg-green-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Loading recipes...</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell>{recipe.name}</TableCell>
                  <TableCell>{recipe.category}</TableCell>
                  <TableCell>
                    <Button variant="secondary" size="sm" onClick={() => handleOpenDetailDialog(recipe)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <RecipeDetailDialog
        recipe={selectedRecipe!}
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        onEdit={() => handleOpenFormDialog(selectedRecipe!)}
        onDelete={handleRecipeDeleted}
      />
      
      <RecipeFormDialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        recipe={selectedRecipe || undefined}
        onSave={(recipe: Recipe) => {
          if (selectedRecipe) {
            // Handle update
            setRecipes(prevRecipes =>
              prevRecipes.map(r =>
                r.id === recipe.id ? recipe : r
              )
            );
          } else {
            // Handle create
            setRecipes(prevRecipes => [...prevRecipes, recipe]);
          }
          handleCloseFormDialog();
        }}
        moduleType="food"
      />
    </div>
  );
};

export default FoodBible;
