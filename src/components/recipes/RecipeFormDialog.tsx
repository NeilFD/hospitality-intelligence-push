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
  
  const calculateTotals = () => {
    const totalRecipeCost = formData.ingredients.reduce((sum, ingredient) => sum + ingredient.totalCost, 0);
    
    const suggestedSellingPrice = (totalRecipeCost / (1 - 0.7)) * 1.2;
    
    const actualMenuPrice = formData.costing.actualMenuPrice || suggestedSellingPrice;
    
    const priceExVat = actualMenuPrice / 1.2;
    
    const grossProfitPercentage = priceExVat > 0 ? ((priceExVat - totalRecipeCost) / priceExVat) : 0;
    
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto text-dark-text-DEFAULT">
        <DialogHeader>
          <DialogTitle className="text-dark-text-DEFAULT">{recipe ? 'Edit' : 'Add'} {moduleType === 'food' ? 'Food' : 'Beverage'} Recipe</DialogTitle>
          <DialogDescription className="text-dark-text-muted">
            Fill in the details for this {moduleType === 'food' ? 'dish' : 'beverage'} recipe.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-dark-text-DEFAULT">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-dark-text-DEFAULT">Recipe Name</Label>
              <Input 
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter recipe name"
                className="text-dark-text-DEFAULT"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prevData => ({...prevData, category: value}))}
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
              <Label className="mb-2 block text-dark-text-DEFAULT">Image</Label>
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
              <Label className="mb-2 block text-dark-text-DEFAULT">Dietary Options</Label>
              <div className="flex space-x-4 mt-2 text-dark-text-DEFAULT">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isVegetarian" 
                    checked={formData.isVegetarian} 
                    onCheckedChange={(checked) => handleCheckboxChange('isVegetarian', checked === true)}
                  />
                  <Label htmlFor="isVegetarian" className="text-dark-text-DEFAULT">Vegetarian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isVegan" 
                    checked={formData.isVegan} 
                    onCheckedChange={(checked) => handleCheckboxChange('isVegan', checked === true)}
                  />
                  <Label htmlFor="isVegan" className="text-dark-text-DEFAULT">Vegan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isGlutenFree" 
                    checked={formData.isGlutenFree} 
                    onCheckedChange={(checked) => handleCheckboxChange('isGlutenFree', checked === true)}
                  />
                  <Label htmlFor="isGlutenFree" className="text-dark-text-DEFAULT">Gluten Free</Label>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="mb-2 block text-dark-text-DEFAULT">Allergens</Label>
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
                value={formData.method || ''}
                onChange={handleInputChange}
                placeholder="Enter cooking instructions"
                rows={6}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-dark-text-DEFAULT">Ingredients</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addIngredient}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Ingredient
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 mb-1 px-2 text-dark-text-muted">
                  <div className="col-span-4 text-sm">Name</div>
                  <div className="col-span-2 text-sm">Amount</div>
                  <div className="col-span-2 text-sm">Unit</div>
                  <div className="col-span-2 text-sm">£/unit</div>
                  <div className="col-span-1 text-sm text-right">Total</div>
                  <div className="col-span-1"></div>
                </div>
                
                {formData.ingredients.map((ingredient, index) => (
                  <div key={ingredient.id || index} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <Input 
                        placeholder="Name"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        placeholder="Amount"
                        value={ingredient.amount || ''}
                        onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={ingredient.unit}
                        onValueChange={(value) => handleIngredientChange(index, 'unit', value)}
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
                        onChange={(e) => handleIngredientChange(index, 'costPerUnit', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1 text-right py-2">
                      £{(ingredient.totalCost || 0).toFixed(2)}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeIngredient(index)}
                        disabled={formData.ingredients.length === 1}
                        className="p-0 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end font-medium border-t border-gray-200 pt-2">
                  Total: £{formData.ingredients.reduce((sum, ing) => sum + (ing.totalCost || 0), 0).toFixed(2)}
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
                onChange={(e) => handleCostingInputChange('actualMenuPrice', e.target.value)}
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
                onChange={handleInputChange}
                placeholder="Enter preparation time"
              />
            </div>
            
            <div>
              <Label htmlFor="recommendedUpsell">Recommended Upsell</Label>
              <Input 
                id="recommendedUpsell"
                name="recommendedUpsell"
                value={formData.recommendedUpsell || ''}
                onChange={handleInputChange}
                placeholder="Enter recommended upsell"
              />
            </div>
            
            <div>
              <Label htmlFor="miseEnPlace">Mise en Place</Label>
              <Textarea 
                id="miseEnPlace"
                name="miseEnPlace"
                value={formData.miseEnPlace || ''}
                onChange={handleInputChange}
                placeholder="Enter mise en place details"
                rows={4}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-dark-text-DEFAULT">Cancel</Button>
          <Button onClick={handleSave} className="text-white">Save Recipe</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeFormDialog;
