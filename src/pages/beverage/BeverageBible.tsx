
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Recipe } from '@/types/recipe-types';
import { supabase } from '@/lib/supabase';
import RecipeDetailDialog from '@/components/recipes/RecipeDetailDialog';
import RecipeFormDialog from '@/components/recipes/RecipeFormDialog';
import { toast } from 'sonner';

const BeverageBible: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();
  const isAdmin = userRole === 'GOD' || userRole === 'Super User';
  
  const handleOpen = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    setSelectedRecipe(null);
  };
  
  const handleEdit = () => {
    // Implement edit functionality here
    console.log('Edit recipe:', selectedRecipe);
  };
  
  const handleDelete = async (recipe: Recipe) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipe.id);
        
      if (error) {
        console.error('Error deleting recipe:', error);
        toast.error('Failed to delete recipe');
        return;
      }
      
      // Optimistically update the UI
      setRecipes(recipes.filter(r => r.id !== recipe.id));
      toast.success('Recipe deleted successfully');
      handleClose();
    } catch (error) {
      console.error('Unexpected error deleting recipe:', error);
      toast.error('Failed to delete recipe');
    }
  };

  // Fix the setRecipes assignment with proper type casting
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('module_type', 'beverage')
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
          moduleType: item.module_type || 'beverage',
          // Add the missing required properties
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
    recipe.name.toLowerCase().includes(search.toLowerCase()) ||
    recipe.category?.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Beverage Recipes</h1>
        <div className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:w-64"
          />
          {isAdmin && (
            <RecipeFormDialog 
              moduleType="beverage"
              onSave={(newRecipe: Recipe) => setRecipes([...recipes, newRecipe])}
              open={false}
              onClose={() => {}}
            />
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center">Loading recipes...</div>
      ) : filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <AlertCircle className="h-10 w-10 mb-2" />
          No recipes found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecipes.map(recipe => (
                <TableRow key={recipe.id}>
                  <TableCell>{recipe.name}</TableCell>
                  <TableCell>{recipe.category}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleOpen(recipe)}>
                      View
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
        open={open}
        onClose={handleClose}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default BeverageBible;
