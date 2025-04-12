
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Recipe } from "@/types/recipe-types";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface RecipeCardExpandedProps {
  recipe: Recipe | any;
  isOpen: boolean;
  onClose: () => void;
}

const RecipeCardExpanded: React.FC<RecipeCardExpandedProps> = ({ 
  recipe, 
  isOpen, 
  onClose 
}) => {
  if (!recipe) return null;

  // Handle both the data structure from recipe card and from noticeboard
  const isVegetarian = recipe.isVegetarian || recipe.is_vegetarian;
  const isVegan = recipe.isVegan || recipe.is_vegan;
  const isGlutenFree = recipe.isGlutenFree || recipe.is_gluten_free;
  const timeToTableMinutes = recipe.timeToTableMinutes || recipe.time_to_table_minutes;
  const totalRecipeCost = recipe.costing?.totalRecipeCost || recipe.total_recipe_cost;
  const actualMenuPrice = recipe.costing?.actualMenuPrice || recipe.actual_menu_price;
  const grossProfitPercentage = recipe.costing?.grossProfitPercentage || recipe.gross_profit_percentage;
  const imageUrl = recipe.imageUrl || recipe.image_url;
  const allergens = recipe.allergens || [];
  const recommendedUpsell = recipe.recommendedUpsell || recipe.recommended_upsell;
  const miseEnPlace = recipe.miseEnPlace || recipe.mise_en_place;
  const method = recipe.method || '';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900">{recipe.name}</DialogTitle>
          <p className="text-gray-600">{recipe.category}</p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={recipe.name} 
                className="w-full h-48 object-cover rounded-md"
                onError={(e) => {
                  console.error("Recipe image failed to load:", imageUrl);
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md text-gray-700">
                No image available
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Dietary Information</h3>
              <div className="flex flex-wrap gap-2">
                {isVegetarian && <Badge variant="outline" className="bg-green-50 text-green-800">Vegetarian</Badge>}
                {isVegan && <Badge variant="outline" className="bg-green-100 text-green-900">Vegan</Badge>}
                {isGlutenFree && <Badge variant="outline" className="bg-yellow-50 text-yellow-800">Gluten Free</Badge>}
                {!isVegetarian && !isVegan && !isGlutenFree && (
                  <span className="text-gray-600">No dietary information available</span>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Allergens</h3>
              <div className="flex flex-wrap gap-2">
                {allergens && allergens.length > 0 ? (
                  allergens.map((allergen: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-red-50 text-red-800">{allergen}</Badge>
                  ))
                ) : (
                  <span className="text-gray-600">No allergens listed</span>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Recipe Information</h3>
              <dl className="space-y-1">
                {timeToTableMinutes > 0 && (
                  <div className="flex">
                    <dt className="w-1/2 text-gray-600">Time to Table:</dt>
                    <dd className="text-gray-900">~{timeToTableMinutes} minutes</dd>
                  </div>
                )}
                {totalRecipeCost !== undefined && (
                  <div className="flex">
                    <dt className="w-1/2 text-gray-600">Recipe Cost:</dt>
                    <dd className="text-gray-900">{formatCurrency(totalRecipeCost || 0)}</dd>
                  </div>
                )}
                {actualMenuPrice !== undefined && (
                  <div className="flex">
                    <dt className="w-1/2 text-gray-600">Menu Price:</dt>
                    <dd className="text-gray-900">{formatCurrency(actualMenuPrice || 0)}</dd>
                  </div>
                )}
                {grossProfitPercentage !== undefined && (
                  <div className="flex">
                    <dt className="w-1/2 text-gray-600">GP:</dt>
                    <dd className="text-gray-900">{typeof grossProfitPercentage === 'number' ? (grossProfitPercentage * 100).toFixed(1) : '0'}%</dd>
                  </div>
                )}
              </dl>
            </div>
            
            {method && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Method</h3>
                <p className="text-gray-800 text-sm whitespace-pre-line">{method}</p>
              </div>
            )}
            
            {miseEnPlace && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Mise en Place</h3>
                <p className="text-gray-800 text-sm whitespace-pre-line">{miseEnPlace}</p>
              </div>
            )}
          </div>
        </div>
        
        {recommendedUpsell && (
          <div className="mt-4">
            <Separator />
            <div className="pt-2">
              <span className="text-sm font-medium text-gray-900">Recommended Upsell: </span>
              <span className="text-sm text-gray-800">{recommendedUpsell}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RecipeCardExpanded;
