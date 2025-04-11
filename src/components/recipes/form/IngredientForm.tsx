
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ingredient } from "@/types/recipe-types";
import { Trash2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";

interface IngredientFormProps {
  ingredients: Ingredient[];
  onIngredientChange: (index: number, field: keyof Ingredient, value: string | number) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
}

export const IngredientForm: React.FC<IngredientFormProps> = ({
  ingredients,
  onIngredientChange,
  onAddIngredient,
  onRemoveIngredient
}) => {
  const totalCost = ingredients.reduce((sum, ing) => sum + (ing.totalCost || 0), 0);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label className="text-gray-900">Ingredients</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={onAddIngredient}
          className="text-gray-900"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Ingredient
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-4 mb-1 px-2 text-gray-600">
          <div className="col-span-4 text-sm">Name</div>
          <div className="col-span-2 text-sm">Amount</div>
          <div className="col-span-2 text-sm">Unit</div>
          <div className="col-span-2 text-sm">£/unit</div>
          <div className="col-span-1 text-sm text-right">Total</div>
          <div className="col-span-1"></div>
        </div>
        
        {ingredients.map((ingredient, index) => (
          <div key={ingredient.id || index} className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <Input 
                placeholder="Name"
                value={ingredient.name}
                onChange={(e) => onIngredientChange(index, 'name', e.target.value)}
                className="text-gray-900 bg-white border border-gray-300"
              />
            </div>
            <div className="col-span-2">
              <Input 
                type="number"
                placeholder="Amount"
                value={ingredient.amount || ''}
                onChange={(e) => onIngredientChange(index, 'amount', e.target.value)}
                className="text-gray-900 bg-white border border-gray-300"
              />
            </div>
            <div className="col-span-2">
              <Select
                value={ingredient.unit}
                onValueChange={(value) => onIngredientChange(index, 'unit', value)}
              >
                <SelectTrigger className="w-full text-gray-900 bg-white">
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
                onChange={(e) => onIngredientChange(index, 'costPerUnit', e.target.value)}
                className="text-gray-900 bg-white border border-gray-300"
              />
            </div>
            <div className="col-span-1 text-right pr-2 text-gray-900">
              £{(ingredient.totalCost || 0).toFixed(2)}
            </div>
            <div className="col-span-1 flex justify-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onRemoveIngredient(index)}
                disabled={ingredients.length === 1}
                className="p-0 h-8 w-8"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
        
        <div className="flex justify-end font-medium border-t border-gray-200 pt-2 text-gray-900">
          Total: £{totalCost.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
