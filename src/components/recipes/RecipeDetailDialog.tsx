
import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Recipe } from '@/types/recipe-types';
import { Separator } from '../ui/separator';
import { format } from 'date-fns';
import { ArchiveIcon, ChefHat, Clock, Download, Edit, Star, Trash2, ConciergeBell, BookOpen } from 'lucide-react';
import RecipePDF from './RecipePDF';

interface RecipeDetailDialogProps {
  open: boolean;
  onClose: () => void;
  recipe: Recipe;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
  onArchive?: (recipe: Recipe) => void;
}

const RecipeDetailDialog: React.FC<RecipeDetailDialogProps> = ({
  open,
  onClose,
  recipe,
  onEdit,
  onDelete,
  onArchive,
}) => {
  const totalCost = recipe.ingredients.reduce((sum, ing) => sum + (ing.totalCost || 0), 0);
  const isHospitality = recipe.moduleType === 'hospitality';
  
  const handleEdit = () => {
    if (onEdit) {
      onEdit(recipe);
    }
    onClose();
  };
  
  const handleDelete = () => {
    if (onDelete && window.confirm(`Are you sure you want to delete this ${isHospitality ? 'guide' : 'recipe'}?`)) {
      onDelete(recipe);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isHospitality ? 
              <ConciergeBell className="h-6 w-6 text-blue-600" /> : 
              recipe.moduleType === 'beverage' ? 
              <BookOpen className="h-6 w-6 text-purple-600" /> : 
              <ChefHat className="h-6 w-6 text-green-600" />
            }
            <DialogTitle className="text-xl font-bold">{recipe.name}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          {recipe.imageUrl && (
            <div className="overflow-hidden rounded-md aspect-video">
              <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
            </div>
          )}
          
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Details</h3>
              <Separator className="my-2" />
              
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Category:</span>
                <span>{recipe.category || 'Uncategorized'}</span>
                
                {!isHospitality && (
                  <>
                    <span className="text-muted-foreground">Vegan:</span>
                    <span>{recipe.isVegan ? 'Yes' : 'No'}</span>
                    
                    <span className="text-muted-foreground">Vegetarian:</span>
                    <span>{recipe.isVegetarian ? 'Yes' : 'No'}</span>
                    
                    <span className="text-muted-foreground">Gluten Free:</span>
                    <span>{recipe.isGlutenFree ? 'Yes' : 'No'}</span>
                  </>
                )}
                
                <span className="text-muted-foreground">Created:</span>
                <span>{format(new Date(recipe.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
            
            {!isHospitality && recipe.allergens && recipe.allergens.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg">Allergens</h3>
                <Separator className="my-2" />
                <div className="flex flex-wrap gap-2">
                  {recipe.allergens.map(allergen => (
                    <span key={allergen} className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm">
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {recipe.timeToTableMinutes > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{isHospitality ? 'Duration' : 'Time to table'}: {recipe.timeToTableMinutes} minutes</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Ingredients */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">{isHospitality ? 'Steps/Procedures' : 'Ingredients'}</h3>
          <Separator className="my-2" />
          
          {recipe.ingredients.length > 0 ? (
            <div className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="flex items-center gap-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span className="flex-grow">{ingredient.name}</span>
                  
                  {!isHospitality && (
                    <span className="text-sm text-gray-600">
                      {ingredient.amount} {ingredient.unit} (£{ingredient.totalCost.toFixed(2)})
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No {isHospitality ? 'steps' : 'ingredients'} added.</p>
          )}
        </div>
        
        {/* Method */}
        {recipe.method && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{isHospitality ? 'Detailed Procedure' : 'Method'}</h3>
            <Separator className="my-2" />
            <p className="whitespace-pre-line">{recipe.method}</p>
          </div>
        )}
        
        {/* Costing */}
        {!isHospitality && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Costing</h3>
            <Separator className="my-2" />
            
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Total Cost:</span>
              <span className="font-medium">£{totalCost.toFixed(2)}</span>
              
              <span className="text-muted-foreground">Suggested Price:</span>
              <span className="font-medium">£{recipe.costing.suggestedSellingPrice.toFixed(2)}</span>
              
              <span className="text-muted-foreground">Menu Price:</span>
              <span className="font-medium">£{recipe.costing.actualMenuPrice.toFixed(2)}</span>
              
              <span className="text-muted-foreground">Gross Profit:</span>
              <span className="font-medium">{(recipe.costing.grossProfitPercentage * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            {onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            
            {onArchive && (
              <Button variant="outline" onClick={() => onArchive(recipe)}>
                <ArchiveIcon className="h-4 w-4 mr-2" />
                {recipe.archived ? 'Unarchive' : 'Archive'}
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <RecipePDF recipe={recipe}>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </RecipePDF>
            
            {onEdit && (
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeDetailDialog;
