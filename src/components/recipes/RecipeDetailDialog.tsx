import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Recipe } from '@/types/recipe-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Clock, Utensils, BarChart4, Trash2, FileEdit, AlertCircle, Check } from 'lucide-react';
import RecipePDF from './RecipePDF';

interface RecipeDetailDialogProps {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (recipe: Recipe) => void;
}

const RecipeDetailDialog: React.FC<RecipeDetailDialogProps> = ({
  recipe,
  open,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!recipe) return null;
  const isHospitality = recipe.moduleType === 'hospitality';
  const isBeverage = recipe.moduleType === 'beverage';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  return <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">{recipe.name}</DialogTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="bg-green-500">{recipe.category || 'Uncategorized'}</Badge>
            {recipe.timeToTableMinutes > 0 && <Badge variant="outline" className="flex items-center gap-1 bg-green-500 text-white">
                <Clock className="h-3 w-3" />
                {recipe.timeToTableMinutes} min
              </Badge>}
            {!isHospitality && <>
                {recipe.isVegan && <Badge className="bg-green-600 text-white">Vegan</Badge>}
                {recipe.isVegetarian && <Badge className="bg-green-500 text-white">Vegetarian</Badge>}
                {recipe.isGlutenFree && <Badge className="bg-amber-600 text-white">Gluten Free</Badge>}
              </>}
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Image at the top */}
            {recipe.imageUrl && <div className="aspect-video w-full overflow-hidden rounded-md">
                <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
              </div>}
            
            {/* Ingredients section */}
            {recipe.ingredients && recipe.ingredients.length > 0 && <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{isHospitality ? 'Steps' : 'Ingredients'}</h3>
                <div className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => <div key={ingredient.id || index} className="flex justify-between py-2 border-b border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900">{ingredient.name}</span>
                        {ingredient.amount && ingredient.unit && <span className="text-gray-600 ml-2">
                            {ingredient.amount} {ingredient.unit}
                          </span>}
                      </div>
                      {!isHospitality && ingredient.totalCost > 0 && <div className="text-gray-600">
                          {formatCurrency(ingredient.totalCost)}
                        </div>}
                      {isHospitality && ingredient.costPerUnit > 0 && <div className="text-gray-600">
                          Importance: {ingredient.costPerUnit}/10
                        </div>}
                    </div>)}
                </div>
              </div>}
            
            {/* Costing section */}
            {!isHospitality && <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Costing</h3>
                <Card className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Total Recipe Cost</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(recipe.costing.totalRecipeCost)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Suggested Selling Price</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(recipe.costing.suggestedSellingPrice)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Actual Menu Price</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(recipe.costing.actualMenuPrice)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Gross Profit %</div>
                      <div className="font-semibold text-gray-900">{recipe.costing.grossProfitPercentage}%</div>
                    </div>
                  </div>
                </Card>
              </div>}
            
            {/* Method section */}
            {recipe.method && <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{isHospitality ? 'Detailed Procedure' : 'Method'}</h3>
                <div className="whitespace-pre-line text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-200">
                  {recipe.method}
                </div>
              </div>}
            
            {/* Mise En Place section */}
            {recipe.miseEnPlace && <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  {isHospitality ? 'Required Tools/Resources' : isBeverage ? 'Garnish' : 'Mise en Place'}
                </h3>
                <div className="whitespace-pre-line text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-200">
                  {recipe.miseEnPlace}
                </div>
              </div>}
            
            {/* Allergens section */}
            {!isHospitality && recipe.allergens && recipe.allergens.length > 0 && <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Allergens</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.allergens.map(allergen => <Badge key={allergen} variant="outline" className="bg-red-50 text-red-800 border-red-200">
                      {allergen}
                    </Badge>)}
                </div>
              </div>}
            
            {/* Recommended Upsell section */}
            {recipe.recommendedUpsell && <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{isHospitality ? 'Related Services' : 'Recommended Upsell'}</h3>
                <div className="text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-200">{recipe.recommendedUpsell}</div>
              </div>}
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <div className="flex flex-wrap gap-2 justify-end w-full">
            <RecipePDF recipe={recipe} />
            <Button variant="outline" onClick={onEdit} className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Edit {isHospitality ? 'Guide' : 'Recipe'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-900">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this {isHospitality ? 'hospitality guide' : 'recipe'}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(recipe)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};

export default RecipeDetailDialog;
