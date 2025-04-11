
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Recipe } from "@/types/recipe-types";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface RecipeCardExpandedProps {
  recipe: any;
  isOpen: boolean;
  onClose: () => void;
}

const RecipeCardExpanded: React.FC<RecipeCardExpandedProps> = ({ 
  recipe, 
  isOpen, 
  onClose 
}) => {
  if (!recipe) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900">{recipe.name}</DialogTitle>
          <p className="text-gray-600">{recipe.category}</p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            {recipe.image_url ? (
              <img 
                src={recipe.image_url} 
                alt={recipe.name} 
                className="w-full h-48 object-cover rounded-md"
                onError={(e) => {
                  console.error("Recipe image failed to load:", recipe.image_url);
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
                {recipe.is_vegetarian && <Badge variant="outline" className="bg-green-50 text-green-800">Vegetarian</Badge>}
                {recipe.is_vegan && <Badge variant="outline" className="bg-green-100 text-green-900">Vegan</Badge>}
                {recipe.is_gluten_free && <Badge variant="outline" className="bg-yellow-50 text-yellow-800">Gluten Free</Badge>}
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Allergens</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.allergens && recipe.allergens.length > 0 ? (
                  recipe.allergens.map((allergen: string, index: number) => (
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
                <div className="flex">
                  <dt className="w-1/2 text-gray-600">Time to Table:</dt>
                  <dd className="text-gray-900">~{recipe.time_to_table_minutes} minutes</dd>
                </div>
                <div className="flex">
                  <dt className="w-1/2 text-gray-600">Recipe Cost:</dt>
                  <dd className="text-gray-900">{formatCurrency(recipe.total_recipe_cost || 0)}</dd>
                </div>
                <div className="flex">
                  <dt className="w-1/2 text-gray-600">Menu Price:</dt>
                  <dd className="text-gray-900">{formatCurrency(recipe.actual_menu_price || 0)}</dd>
                </div>
                <div className="flex">
                  <dt className="w-1/2 text-gray-600">GP:</dt>
                  <dd className="text-gray-900">{(recipe.gross_profit_percentage * 100).toFixed(1)}%</dd>
                </div>
              </dl>
            </div>
            
            {recipe.method && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Method</h3>
                <p className="text-gray-800 text-sm whitespace-pre-line">{recipe.method}</p>
              </div>
            )}
            
            {recipe.mise_en_place && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Mise en Place</h3>
                <p className="text-gray-800 text-sm whitespace-pre-line">{recipe.mise_en_place}</p>
              </div>
            )}
          </div>
        </div>
        
        {recipe.recommendedUpsell && (
          <div className="mt-4">
            <Separator />
            <div className="pt-2">
              <span className="text-sm font-medium text-gray-900">Recommended Upsell: </span>
              <span className="text-sm text-gray-800">{recipe.recommendedUpsell}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RecipeCardExpanded;
