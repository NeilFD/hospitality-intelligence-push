import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Recipe, Ingredient, MenuCategory, AllergenType } from "@/types/recipe-types";
import { v4 as uuidv4 } from "uuid";
import { X, Plus, Trash2, Upload } from "lucide-react";

interface RecipeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
  recipe?: Recipe;
  moduleType: 'food' | 'beverage';
  categories: MenuCategory[];
  allergens: AllergenType[];
}

const emptyIngredient = (): Ingredient => ({
  id: uuidv4(),
  name: "",
  amount: 0,
  unit: "g",
  costPerUnit: 0,
  totalCost: 0
});

const createEmptyRecipe = (moduleType: 'food' | 'beverage'): Recipe => ({
  id: uuidv4(),
  name: "",
  category: "",
  allergens: [],
  isVegan: false,
  isVegetarian: false,
  isGlutenFree: false,
  recommendedUpsell: "",
  timeToTableMinutes: 0,
  miseEnPlace: "",
  createdAt: new Date(),
  updatedAt: new Date(),
  ingredients: [emptyIngredient()],
  method: "",
  costing: {
    totalRecipeCost: 0,
    suggestedSellingPrice: 0,
    actualMenuPrice: 0,
    grossProfitPercentage: 0
  },
  moduleType
});

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
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  const handleIngredientChange = (id: string, field: keyof Ingredient, value: string | number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.map(ingredient => {
        if (ingredient.id === id) {
          const updatedIngredient = {
            ...ingredient,
            [field]: value
          };
          
          if (field === 'amount' || field === 'costPerUnit') {
            updatedIngredient.totalCost = Number(updatedIngredient.amount) * Number(updatedIngredient.costPerUnit);
          }
          
          return updatedIngredient;
        }
        return ingredient;
      })
    });
  };
  
  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, emptyIngredient()]
    });
  };
  
  const removeIngredient = (id: string) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter(ingredient => ingredient.id !== id)
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
    
    setFormData({
      ...formData,
      allergens: updatedAllergens
    });
  };
  
  const calculateTotals = () => {
    const totalRecipeCost = formData.ingredients.reduce((sum, ingredient) => sum + ingredient.totalCost, 0);
    
    const suggestedSellingPrice = (totalRecipeCost / (1 - 0.7)) * 1.2;
    
    const actualMenuPrice = formData.costing.actualMenuPrice || suggestedSellingPrice;
    
    const priceExVat = actualMenuPrice / 1.2;
    
    const grossProfitPercentage = (priceExVat - totalRecipeCost) / priceExVat;
    
    return {
      totalRecipeCost,
      suggestedSellingPrice,
      actualMenuPrice,
      grossProfitPercentage
    };
  };
  
  const handleSave = () => {
    const costing = calculateTotals();
    
    const updatedRecipe: Recipe = {
      ...formData,
      costing,
      updatedAt: new Date()
    };
    
    if (imagePreview) {
      updatedRecipe.imageUrl = imagePreview;
    }
    
    onSave(updatedRecipe);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{recipe ? 'Edit' : 'Add'} {moduleType === 'food' ? 'Food' : 'Beverage'} Recipe</DialogTitle>
          <DialogDescription className="text-gray-700">
            Fill in the details for this {moduleType === 'food' ? 'dish' : 'beverage'} recipe.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-900">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-900">Recipe Name</Label>
              <Input 
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter recipe name"
                className="text-gray-900"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(cat => cat.moduleType === moduleType).map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="mb-2 block text-gray-900">Image</Label>
              <div className="flex items-center space-x-2">
                <div className="w-full">
                  <Label 
                    htmlFor="image-upload"
                    className="flex justify-center items-center border-2 border-dashed border-gray-300 rounded-md h-32 cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="h-full w-full object-cover rounded-md" 
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-500">
                        <Upload className="h-10 w-10 mb-2" />
                        <span>Upload Image</span>
                      </div>
                    )}
                  </Label>
                  <Input 
                    id="image-upload"
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {imagePreview && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setImagePreview(undefined);
                      setImageFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <Label className="mb-2 block text-gray-900">Dietary Options</Label>
              <div className="flex space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isVegetarian" 
                    checked={formData.isVegetarian} 
                    onCheckedChange={(checked) => handleCheckboxChange('isVegetarian', checked === true)}
                  />
                  <Label htmlFor="isVegetarian" className="text-gray-900">Vegetarian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isVegan" 
                    checked={formData.isVegan} 
                    onCheckedChange={(checked) => handleCheckboxChange('isVegan', checked === true)}
                  />
                  <Label htmlFor="isVegan" className="text-gray-900">Vegan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isGlutenFree" 
                    checked={formData.isGlutenFree} 
                    onCheckedChange={(checked) => handleCheckboxChange('isGlutenFree', checked === true)}
                  />
                  <Label htmlFor="isGlutenFree" className="text-gray-900">Gluten Free</Label>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="mb-2 block text-gray-900">Allergens</Label>
              <div className="flex flex-wrap gap-2">
                {allergens.map((allergen) => (
                  <div 
                    key={allergen.id} 
                    className={`px-3 py-1.5 rounded-full text-sm cursor-pointer ${
                      formData.allergens.includes(allergen.name) 
                        ? 'bg-red-100 text-red-800 border border-red-300' 
                        : 'bg-gray-100 text-gray-800 border border-gray-300'
                    }`}
                    onClick={() => handleAllergenToggle(allergen.name)}
                  >
                    {allergen.name}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="method">Method</Label>
              <Textarea 
                id="method"
                name="method"
                value={formData.method}
                onChange={handleInputChange}
                placeholder="Enter cooking instructions"
                rows={6}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-gray-900">Ingredients</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addIngredient}
                  className="text-gray-900"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Ingredient
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 mb-1 px-2">
                  <div className="col-span-4 text-sm text-gray-700">Name</div>
                  <div className="col-span-2 text-sm text-gray-700">Amount</div>
                  <div className="col-span-2 text-sm text-gray-700">Unit</div>
                  <div className="col-span-2 text-sm text-gray-700">£/unit</div>
                  <div className="col-span-1 text-sm text-gray-700 text-right">Total</div>
                  <div className="col-span-1"></div>
                </div>
                
                {formData.ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <Input 
                        placeholder="Name"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(ingredient.id, 'name', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        placeholder="Amount"
                        value={ingredient.amount || ''}
                        onChange={(e) => handleIngredientChange(ingredient.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={ingredient.unit}
                        onValueChange={(value) => handleIngredientChange(ingredient.id, 'unit', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="l">L</SelectItem>
                          <SelectItem value="pcs">pcs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="£/unit"
                        value={ingredient.costPerUnit || ''}
                        onChange={(e) => handleIngredientChange(ingredient.id, 'costPerUnit', parseFloat(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-1 text-right py-2">
                      £{ingredient.totalCost.toFixed(2)}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeIngredient(ingredient.id)}
                        disabled={formData.ingredients.length === 1}
                        className="p-0 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end font-medium border-t border-gray-200 pt-2">
                  Total: £{formData.ingredients.reduce((sum, ing) => sum + ing.totalCost, 0).toFixed(2)}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="actualMenuPrice">Menu Price (£)</Label>
              <Input 
                id="actualMenuPrice"
                type="number"
                step="0.01"
                value={formData.costing.actualMenuPrice || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  costing: {
                    ...formData.costing,
                    actualMenuPrice: parseFloat(e.target.value) || 0
                  }
                })}
                placeholder="Enter menu price"
              />
              <div className="text-sm text-gray-500 mt-1">
                Suggested Price: £{calculateTotals().suggestedSellingPrice.toFixed(2)} (70% GP inc. VAT)
              </div>
              <div className="text-sm text-gray-500">
                Actual GP: {(calculateTotals().grossProfitPercentage * 100).toFixed(1)}%
              </div>
            </div>
            
            <div>
              <Label htmlFor="timeToTableMinutes">Time to Table (mins)</Label>
              <Input 
                id="timeToTableMinutes"
                name="timeToTableMinutes"
                type="number"
                value={formData.timeToTableMinutes || ''}
                onChange={(e) => handleInputChange({
                  ...e,
                  target: {
                    ...e.target,
                    value: e.target.value,
                    name: 'timeToTableMinutes'
                  }
                })}
                placeholder="Enter preparation time"
              />
            </div>
            
            <div>
              <Label htmlFor="recommendedUpsell">Recommended Upsell</Label>
              <Input 
                id="recommendedUpsell"
                name="recommendedUpsell"
                value={formData.recommendedUpsell}
                onChange={handleInputChange}
                placeholder="Enter recommended upsell"
              />
            </div>
            
            <div>
              <Label htmlFor="miseEnPlace">Mise en Place</Label>
              <Textarea 
                id="miseEnPlace"
                name="miseEnPlace"
                value={formData.miseEnPlace}
                onChange={handleInputChange}
                placeholder="Enter mise en place details"
                rows={4}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-gray-900">Cancel</Button>
          <Button onClick={handleSave} className="text-gray-900">Save Recipe</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeFormDialog;
