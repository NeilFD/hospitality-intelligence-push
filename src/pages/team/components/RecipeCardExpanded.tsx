
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Recipe } from "@/types/recipe-types";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Utensils } from "lucide-react";

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
  
  // Check if this is a hospitality guide based on either module_type or moduleType
  const isHospitality = recipe.module_type === 'hospitality' || recipe.moduleType === 'hospitality';
  
  // For hospitality guides, we ONLY use image_url property as that's what's in the hospitality_guides table
  // For recipes, we use the imageUrl property
  const imageUrl = isHospitality ? recipe.image_url : recipe.imageUrl;
  
  // If no image URL is specified, use one of our images based on module type
  const getFallbackImage = () => {
    if (isHospitality) {
      return '/lovable-uploads/d0fa3279-2855-4f82-b009-47d725cad839.png';
    } else if (recipe.module_type === 'food' || recipe.moduleType === 'food') {
      return '/lovable-uploads/d7e475f7-c18d-4312-91d6-2bf24f07af7a.png';
    } else if (recipe.module_type === 'beverage' || recipe.moduleType === 'beverage') {
      return '/lovable-uploads/bfd620b2-f0d0-4190-9cf3-87808593f9d0.png';
    }
    return '';
  };
  
  const displayImageUrl = imageUrl || getFallbackImage();
  
  console.log("RecipeCardExpanded for:", recipe.name, "isHospitality:", isHospitality, "imageUrl:", displayImageUrl);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900">{recipe.name}</DialogTitle>
          <p className="text-gray-600">{recipe.category}</p>
        </DialogHeader>
        
        <ScrollArea className="pr-4 max-h-[calc(80vh-12rem)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <div className="w-full h-48 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                {displayImageUrl ? (
                  <img 
                    src={displayImageUrl} 
                    alt={recipe.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Image failed to load:", displayImageUrl);
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.classList.add('bg-gray-200');
                        const errorMsg = document.createElement('div');
                        errorMsg.textContent = 'Image unavailable';
                        errorMsg.className = 'text-gray-700 text-sm';
                        parent.appendChild(errorMsg);
                      }
                    }}
                  />
                ) : (
                  <div className="text-gray-700 text-sm">No image available</div>
                )}
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Dietary Information</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.is_vegetarian && <Badge variant="outline" className="bg-green-50 text-green-800">Vegetarian</Badge>}
                  {recipe.is_vegan && <Badge variant="outline" className="bg-green-100 text-green-900">Vegan</Badge>}
                  {recipe.is_gluten_free && <Badge variant="outline" className="bg-yellow-50 text-yellow-800">Gluten Free</Badge>}
                  {!recipe.is_vegetarian && !recipe.is_vegan && !recipe.is_gluten_free && (
                    <span className="text-gray-600">No dietary information available</span>
                  )}
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
                    <dd className="text-gray-900">~{recipe.time_to_table_minutes || recipe.timeToTableMinutes} minutes</dd>
                  </div>
                  {/* Only show financial info if it's NOT a hospitality guide */}
                  {!isHospitality && (
                    <>
                      <div className="flex">
                        <dt className="w-1/2 text-gray-600">Recipe Cost:</dt>
                        <dd className="text-gray-900">{formatCurrency(recipe.total_recipe_cost || (recipe.costing?.totalRecipeCost || 0))}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-1/2 text-gray-600">Menu Price:</dt>
                        <dd className="text-gray-900">{formatCurrency(recipe.actual_menu_price || (recipe.costing?.actualMenuPrice || 0))}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-1/2 text-gray-600">GP:</dt>
                        <dd className="text-gray-900">{(((recipe.gross_profit_percentage || recipe.costing?.grossProfitPercentage) || 0) * 100).toFixed(1)}%</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
              
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Ingredients</h3>
                  <ul className="space-y-1 text-sm">
                    {recipe.ingredients.map((ingredient: any, index: number) => (
                      <li key={index} className="flex justify-between py-1 border-b border-gray-100">
                        <span>{ingredient.name}</span>
                        {ingredient.amount && ingredient.unit && (
                          <span className="text-gray-600">
                            {ingredient.amount} {ingredient.unit}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {(recipe.method || recipe.detailed_procedure) && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-2">Method</h3>
              <p className="text-gray-800 text-sm whitespace-pre-line bg-gray-50 p-4 rounded-md border border-gray-200">{recipe.method || recipe.detailed_procedure}</p>
            </div>
          )}
          
          {(recipe.mise_en_place || recipe.required_resources) && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Mise en Place</h3>
              <p className="text-gray-800 text-sm whitespace-pre-line bg-gray-50 p-4 rounded-md border border-gray-200">{recipe.mise_en_place || recipe.required_resources}</p>
            </div>
          )}
          
          {recipe.recommended_upsell && (
            <div className="mt-4">
              <Separator className="my-2" />
              <div className="pt-2">
                <span className="text-sm font-medium text-gray-900">Recommended Upsell: </span>
                <span className="text-sm text-gray-800">{recipe.recommended_upsell}</span>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeCardExpanded;
