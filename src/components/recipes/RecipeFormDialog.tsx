import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Recipe, MenuCategory, AllergenType, Ingredient } from "@/types/recipe-types";
import RecipeBasicInfo from "./form/RecipeBasicInfo";
import RecipeAdditionalInfo from "./form/RecipeAdditionalInfo";
import IngredientForm from "./form/IngredientForm";
import { createEmptyRecipe, emptyIngredient, calculateTotals, normalizeDietaryInfo } from "./form/RecipeFormUtils";
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
  moduleType: 'food' | 'beverage' | 'hospitality';
  categories: MenuCategory[] | string[];
  allergens: AllergenType[] | string[];
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
      const normalizedRecipe = normalizeDietaryInfo(recipe);
      console.log("Setting form data from recipe with dietary info:", 
        "Vegetarian:", normalizedRecipe.isVegetarian, 
        "Vegan:", normalizedRecipe.isVegan, 
        "GlutenFree:", normalizedRecipe.isGlutenFree);
      setFormData(normalizedRecipe);
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
    console.log(`Checkbox ${name} changed to ${checked}`);
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
  
  const computedCostingTotals = moduleType === 'hospitality' 
    ? { 
        totalRecipeCost: 0, 
        suggestedSellingPrice: 0, 
        actualMenuPrice: 0, 
        grossProfitPercentage: 0 
      } 
    : calculateTotals(formData.ingredients, formData.costing.actualMenuPrice);
  
  const validateForm = () => {
    return true;
  };

  const toggleArchived = () => {
    setFormData(prevData => ({
      ...prevData,
      archived: !prevData.archived
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const recipeToSave: Recipe = {
        ...formData,
        isVegetarian: Boolean(formData.isVegetarian),
        isVegan: Boolean(formData.isVegan),
        isGlutenFree: Boolean(formData.isGlutenFree),
        ingredients: moduleType === 'hospitality' 
          ? formData.ingredients.map(ingredient => ({
              ...ingredient,
              id: ingredient.id || uuidv4(),
              name: ingredient.name || '',
              amount: 0,
              costPerUnit: 0,
              totalCost: 0,
              unit: ''
            }))
          : formData.ingredients.map(ingredient => ({
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
      
      if (!recipeToSave.id) {
        recipeToSave.id = uuidv4();
        recipeToSave.createdAt = new Date();
      }
      
      if (imagePreview) {
        recipeToSave.imageUrl = imagePreview;
      }
      
      console.log("Saving recipe with dietary info:", 
        "Vegetarian:", recipeToSave.isVegetarian, 
        "Vegan:", recipeToSave.isVegan, 
        "GlutenFree:", recipeToSave.isGlutenFree);
      
      onSave(recipeToSave);
      
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
            <DialogTitle className="text-gray-900">{recipe ? 'Edit' : 'Add'} {moduleType === 'food' ? 'Food' : moduleType === 'beverage' ? 'Beverage' : 'Hospitality'} Recipe</DialogTitle>
            <DialogDescription className="text-gray-600">
              Fill in the details for this {moduleType === 'food' ? 'dish' : moduleType === 'beverage' ? 'beverage' : 'hospitality guide'}.
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
        
        <div className="mb-4">
          {imagePreview ? (
            <div className="w-full h-48 relative">
              <img 
                src={imagePreview} 
                alt="Recipe preview" 
                className="w-full h-48 object-cover rounded-md"
              />
              <Button 
                variant="destructive" 
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImagePreview(undefined);
                  setImageFile(null);
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md h-48">
              <div className="space-y-1 text-center flex flex-col items-center justify-center">
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Upload an image</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only"
                      accept="image/*" 
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          )}
        </div>
        
        <div className={`grid grid-cols-1 ${moduleType !== 'hospitality' ? 'md:grid-cols-2' : ''} gap-4`}>
          <RecipeBasicInfo 
            name={formData.name}
            category={formData.category}
            isVegan={formData.isVegan}
            isVegetarian={formData.isVegetarian}
            isGlutenFree={formData.isGlutenFree}
            allergens={formData.allergens}
            method={formData.method || ""}
            imagePreview={undefined}
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
          
          {moduleType !== 'hospitality' && (
            <div className="space-y-4">
              <IngredientForm 
                ingredients={formData.ingredients}
                onIngredientsChange={(ingredients) => setFormData(prev => ({ ...prev, ingredients }))}
                moduleType={moduleType}
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          <RecipeAdditionalInfo 
            recommendedUpsell={formData.recommendedUpsell || ""}
            timeToTableMinutes={formData.timeToTableMinutes}
            miseEnPlace={formData.miseEnPlace || ""}
            method={formData.method || ""}
            moduleType={moduleType}
            onRecommendedUpsellChange={(value) => setFormData(prev => ({ ...prev, recommendedUpsell: value }))}
            onTimeToTableMinutesChange={(value) => setFormData(prev => ({ ...prev, timeToTableMinutes: value }))}
            onMiseEnPlaceChange={(value) => setFormData(prev => ({ ...prev, miseEnPlace: value }))}
            onMethodChange={(value) => setFormData(prev => ({ ...prev, method: value }))}
          />
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
            {isSaving ? 'Saving...' : (moduleType === 'hospitality' ? 'Save Guide' : 'Save Recipe')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeFormDialog;
