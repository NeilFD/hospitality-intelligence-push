
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Recipe } from "@/types/recipe-types";
import { Mail, Share2, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PDFDownloadLink } from "@react-pdf/renderer";
import RecipePDF from "./RecipePDF";

interface RecipeDetailDialogProps {
  open: boolean;
  onClose: () => void;
  recipe: Recipe;
  onEdit: () => void;
}

const RecipeDetailDialog: React.FC<RecipeDetailDialogProps> = ({
  open,
  onClose,
  recipe,
  onEdit
}) => {
  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Recipe: ${recipe.name}`);
    const body = encodeURIComponent(
      `Check out this recipe for ${recipe.name}!\n\n` +
      `Category: ${recipe.category}\n` +
      `Allergens: ${recipe.allergens.join(', ')}\n` +
      `Vegetarian: ${recipe.isVegetarian ? 'Yes' : 'No'}\n` +
      `Vegan: ${recipe.isVegan ? 'Yes' : 'No'}\n` +
      `Gluten Free: ${recipe.isGlutenFree ? 'Yes' : 'No'}\n\n` +
      `Recipe cost: ${formatCurrency(recipe.costing.totalRecipeCost)}\n` +
      `Menu price: ${formatCurrency(recipe.costing.actualMenuPrice)}\n\n` +
      `Method: ${recipe.method}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*Recipe: ${recipe.name}*\n\n` +
      `Category: ${recipe.category}\n` +
      `Allergens: ${recipe.allergens.join(', ')}\n` +
      `Vegetarian: ${recipe.isVegetarian ? 'Yes' : 'No'}\n` +
      `Vegan: ${recipe.isVegan ? 'Yes' : 'No'}\n` +
      `Gluten Free: ${recipe.isGlutenFree ? 'Yes' : 'No'}\n\n` +
      `Recipe cost: ${formatCurrency(recipe.costing.totalRecipeCost)}\n` +
      `Menu price: ${formatCurrency(recipe.costing.actualMenuPrice)}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{recipe.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {recipe.category}
            <div className="flex gap-1 ml-auto">
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit Recipe
              </Button>
              <PDFDownloadLink 
                document={<RecipePDF recipe={recipe} />} 
                fileName={`${recipe.name.toLowerCase().replace(/\s+/g, '-')}.pdf`}
              >
                {({ loading }) => (
                  <Button variant="outline" size="sm" disabled={loading}>
                    <FileText className="h-4 w-4 mr-1" />
                    {loading ? 'Loading...' : 'Download PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
              <Button variant="outline" size="sm" onClick={handleEmailShare}>
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
              <Button variant="outline" size="sm" onClick={handleWhatsAppShare}>
                <Share2 className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {recipe.imageUrl ? (
              <img 
                src={recipe.imageUrl} 
                alt={recipe.name} 
                className="w-full h-64 object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-md">
                <span className="text-gray-500">No image available</span>
              </div>
            )}
            
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-lg font-medium">Dietary Information</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {recipe.isVegetarian && <Badge variant="outline" className="bg-green-50">Vegetarian</Badge>}
                  {recipe.isVegan && <Badge variant="outline" className="bg-green-100">Vegan</Badge>}
                  {recipe.isGlutenFree && <Badge variant="outline" className="bg-yellow-50">Gluten Free</Badge>}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Allergens</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {recipe.allergens.map((allergen, index) => (
                    <Badge key={index} variant="outline" className="bg-red-50">{allergen}</Badge>
                  ))}
                  {recipe.allergens.length === 0 && <span className="text-gray-500">No allergens listed</span>}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Recipe Information</h3>
                <dl className="mt-2 space-y-1">
                  <div className="flex">
                    <dt className="w-1/2 text-gray-600">Time to Table:</dt>
                    <dd>~{recipe.timeToTableMinutes} minutes</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-1/2 text-gray-600">Recommended Upsell:</dt>
                    <dd>{recipe.recommendedUpsell || 'None'}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Method</h3>
                <p className="mt-2 whitespace-pre-line">{recipe.method}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Costing</h3>
              <dl className="mt-2 space-y-1">
                <div className="flex">
                  <dt className="w-1/2 text-gray-600">Total Recipe Cost:</dt>
                  <dd>{formatCurrency(recipe.costing.totalRecipeCost)}</dd>
                </div>
                <div className="flex">
                  <dt className="w-1/2 text-gray-600">Suggested Selling Price:</dt>
                  <dd>{formatCurrency(recipe.costing.suggestedSellingPrice)}</dd>
                </div>
                <div className="flex">
                  <dt className="w-1/2 text-gray-600">Actual Menu Price:</dt>
                  <dd>{formatCurrency(recipe.costing.actualMenuPrice)}</dd>
                </div>
                <div className="flex">
                  <dt className="w-1/2 text-gray-600">Gross Profit Percentage:</dt>
                  <dd>{(recipe.costing.grossProfitPercentage * 100).toFixed(1)}%</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Ingredients</h3>
              <div className="mt-2 border rounded-md">
                <div className="grid grid-cols-12 px-3 py-2 bg-gray-50 text-sm font-medium border-b">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-3 text-right">Cost</div>
                </div>
                {recipe.ingredients.map((ingredient, index) => (
                  <div 
                    key={ingredient.id} 
                    className={`grid grid-cols-12 px-3 py-2 text-sm ${
                      index < recipe.ingredients.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div className="col-span-5">{ingredient.name}</div>
                    <div className="col-span-2 text-right">{ingredient.amount}</div>
                    <div className="col-span-2">{ingredient.unit}</div>
                    <div className="col-span-3 text-right">{formatCurrency(ingredient.totalCost)}</div>
                  </div>
                ))}
                <div className="grid grid-cols-12 px-3 py-2 bg-gray-50 text-sm font-medium">
                  <div className="col-span-9 text-right">Total:</div>
                  <div className="col-span-3 text-right">
                    {formatCurrency(recipe.ingredients.reduce((sum, i) => sum + i.totalCost, 0))}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Mise en Place</h3>
              <p className="mt-2 whitespace-pre-line">{recipe.miseEnPlace}</p>
            </div>
          </div>
        </div>
        
      </DialogContent>
    </Dialog>
  );
};

export default RecipeDetailDialog;
