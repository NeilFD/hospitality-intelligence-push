
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Recipe } from "@/types/recipe-types";
import { Button } from "@/components/ui/button";
import { Mail, Share2, FileText, Globe } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { PDFDownloadLink } from "@react-pdf/renderer";
import RecipePDF from "./RecipePDF";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onToggleNoticeboard?: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, onToggleNoticeboard }) => {
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

  const handleToggleNoticeboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleNoticeboard) {
      onToggleNoticeboard();
    }
  };

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer text-gray-900" onClick={onClick}>
      <div className="w-full h-48 overflow-hidden bg-gray-100">
        {recipe.imageUrl ? (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700">
            No image available
          </div>
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl text-gray-900">{recipe.name}</CardTitle>
        <CardDescription className="text-gray-700">{recipe.category}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.isVegetarian && <Badge variant="outline" className="bg-green-50 text-green-900">Vegetarian</Badge>}
          {recipe.isVegan && <Badge variant="outline" className="bg-green-100 text-green-950">Vegan</Badge>}
          {recipe.isGlutenFree && <Badge variant="outline" className="bg-yellow-50 text-yellow-900">Gluten Free</Badge>}
        </div>
        <div className="text-sm text-gray-800 mb-2">
          <p>Cost: {formatCurrency(recipe.costing.totalRecipeCost)}</p>
          <p>Menu Price: {formatCurrency(recipe.costing.actualMenuPrice)}</p>
          <p>GP: {(recipe.costing.grossProfitPercentage * 100).toFixed(1)}%</p>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="p-3 flex justify-between">
        <PDFDownloadLink 
          document={<RecipePDF recipe={recipe} />} 
          fileName={`${recipe.name.toLowerCase().replace(/\s+/g, '-')}.pdf`}
          className="hover:no-underline"
        >
          {({ loading }) => (
            <Button variant="ghost" size="sm" disabled={loading} className="text-gray-800">
              <FileText className="h-4 w-4 mr-1" />
              {loading ? 'Loading...' : 'PDF'}
            </Button>
          )}
        </PDFDownloadLink>
        <div className="flex gap-1 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`text-gray-800 ${recipe.postedToNoticeboard ? 'text-green-600' : ''}`} 
                  onClick={handleToggleNoticeboard}
                >
                  <Globe className={`h-4 w-4 ${recipe.postedToNoticeboard ? 'text-green-600 fill-green-100' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {recipe.postedToNoticeboard ? 'Posted to Noticeboard' : 'Not Posted to Noticeboard'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="text-gray-800" onClick={(e) => {
              e.stopPropagation();
              handleEmailShare();
            }}>
              <Mail className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-800" onClick={(e) => {
              e.stopPropagation();
              handleWhatsAppShare();
            }}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RecipeCard;
