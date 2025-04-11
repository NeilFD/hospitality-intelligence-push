import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Recipe, MenuCategory, AllergenType, Ingredient } from "@/types/recipe-types";
import { RecipeBasicInfo } from "./form/RecipeBasicInfo";
import { RecipeAdditionalInfo } from "./form/RecipeAdditionalInfo";
import { IngredientForm } from "./form/IngredientForm";
import { createEmptyRecipe, emptyIngredient, calculateTotals } from "./form/RecipeFormUtils";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import { ArchiveIcon } from "lucide-react";

interface RecipeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
  recipe?: Recipe;
  moduleType: 'food' | 'beverage';
  categories: MenuCategory[];
  allergens: AllergenType[];
}

const RecipeFormDialog: React.FC<RecipeFormDialogProps> = ({
  open,
  onClose,
  onSave,
  recipe,
  moduleType,
  categories,
  allergens
}) => {
  const [formData, setFormData] = useState<Recipe>(recipe || createEmptyRecipe(moduleType));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(recipe?.imageUrl);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (recipe) {
      setFormData(recipe);
      setImagePreview(recipe.imageUrl);
    } else {
      setFormData(createEmptyRecipe(moduleType));
      setImagePreview(undefined);
    }
  }, [recipe, moduleType]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  const handleCostingInputChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prevData => ({
      ...prevData,
      costing: {
        ...prevData.costing,
        [field]: numValue
      }
    }));
  };
  
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: checked
    }));
  };
  
  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    const numValue = ['name', 'unit'].includes(field as string) ? value : parseFloat(value as string) || 0;

    setFormData(prevData => {
      const updatedIngredients = [...prevData.ingredients];
      const ingredient = { ...updatedIngredients[index], [field]: numValue };

      if (field === 'amount' || field === 'costPerUnit') {
        ingredient.totalCost = Number(ingredient.amount) * Number(ingredient.costPerUnit);
      }

      updatedIngredients[index] = ingredient;

      return {
        ...prevData,
        ingredients: updatedIngredients
      };
    });
  };
  
  const addIngredient = () => {
    setFormData(prevData => ({
      ...prevData,
      ingredients: [...prevData.ingredients, emptyIngredient()]
    }));
  };
  
  const removeIngredient = (index: number) => {
    setFormData(prevData => {
      const updatedIngredients = [...prevData.ingredients];
      updatedIngredients.splice(index, 1);
      return {
        ...prevData,
        ingredients: updatedIngredients
      };
    });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAllergenToggle = (allergen: string) => {
    const updatedAllergens = formData.allergens.includes(allergen)
      ? formData.allergens.filter(a => a !== allergen)
      : [...formData.allergens, allergen];
    
    setFormData(prevData => ({
      ...prevData,
      allergens: updatedAllergens
    }));
  };
  
  const computedCostingTotals = calculateTotals(formData.ingredients, formData.costing.actualMenuPrice);
  
  const validateForm = () => {
    if (!formData.name) {
      toast.error('Please enter a recipe name');
      return false;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return false;
    }
    if (formData.ingredients.some(i => !i.name)) {
      toast.error('All ingredients must have a name');
      return false;
    }
    return true;
  };

  const toggleArchived = () => {
    setFormData(prevData => ({
      ...prevData,
      archived: !prevData.archived
    }));
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      
      // Ensure all ingredients have IDs and valid data
      const recipeToSave: Recipe = {
        ...formData,
        ingredients: formData.ingredients.map(ingredient => ({
          ...ingredient,
          id: ingredient.id || uuidv4(),
          amount: Number(ingredient.amount) || 0,
          costPerUnit: Number(ingredient.costPerUnit) || 0,
          totalCost: Number(ingredient.totalCost) || 0
        })),
        costing: computedCostingTotals,
        updatedAt: new Date(),
        archived: formData.archived || false
      };
      
      // For new recipes, generate an ID
      if (!recipeToSave.id) {
        recipeToSave.id = uuidv4();
        recipeToSave.createdAt = new Date();
      }
      
      // If image was updated, use the new preview 
      if (imagePreview) {
        recipeToSave.imageUrl = imagePreview;
      }
      
      console.log("Saving recipe to Supabase:", recipeToSave);
      
      // Save recipe
      onSave(recipeToSave);
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Failed to save recipe');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="flex flex-row justify-between items-center">
          <div>
            <DialogTitle className="text-gray-900">{recipe ? 'Edit' : 'Add'} {moduleType === 'food' ? 'Food' : 'Beverage'} Recipe</DialogTitle>
            <DialogDescription className="text-gray-600">
              Fill in the details for this {moduleType === 'food' ? 'dish' : 'beverage'} recipe.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{formData.archived ? 'Archived' : 'Live'}</span>
            <Switch 
              checked={!formData.archived} 
              onCheckedChange={() => toggleArchived()}
              className="data-[state=checked]:bg-green-500"
            />
            <ArchiveIcon className="h-4 w-4 text-gray-500 ml-1" />
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RecipeBasicInfo 
            name={formData.name}
            category={formData.category}
            isVegan={formData.isVegan}
            isVegetarian={formData.isVegetarian}
            isGlutenFree={formData.isGlutenFree}
            allergens={formData.allergens}
            method={formData.method || ""}
            imagePreview={imagePreview}
            categories={categories}
            allergenTypes={allergens}
            moduleType={moduleType}
            onInputChange={handleInputChange}
            onCategoryChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            onCheckboxChange={handleCheckboxChange}
            onAllergenToggle={handleAllergenToggle}
            onImageUpload={handleImageChange}
            onImageRemove={() => {
              setImagePreview(undefined);
              setImageFile(null);
            }}
          />
          
          <div className="space-y-4">
            <IngredientForm 
              ingredients={formData.ingredients}
              onIngredientChange={handleIngredientChange}
              onAddIngredient={addIngredient}
              onRemoveIngredient={removeIngredient}
            />
            
            <RecipeAdditionalInfo 
              timeToTableMinutes={formData.timeToTableMinutes}
              recommendedUpsell={formData.recommendedUpsell || ""}
              miseEnPlace={formData.miseEnPlace || ""}
              actualMenuPrice={formData.costing.actualMenuPrice}
              suggestedPrice={computedCostingTotals.suggestedSellingPrice}
              grossProfitPercentage={computedCostingTotals.grossProfitPercentage}
              onInputChange={handleInputChange}
              onCostingChange={handleCostingInputChange}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-gray-900"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="text-white"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeFormDialog;
