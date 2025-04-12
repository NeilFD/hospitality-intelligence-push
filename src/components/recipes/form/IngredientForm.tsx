
import React from 'react';
import { Button } from '@/components/ui/button';
import { Ingredient } from '@/types/recipe-types';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IngredientFormProps {
  ingredients: Ingredient[];
  onIngredientChange: (index: number, field: keyof Ingredient, value: string | number) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
  moduleType?: 'food' | 'beverage' | 'hospitality';
}

const IngredientForm: React.FC<IngredientFormProps> = ({
  ingredients,
  onIngredientChange,
  onAddIngredient,
  onRemoveIngredient,
  moduleType = 'food'
}) => {
  const isHospitality = moduleType === 'hospitality';

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isHospitality ? 'Service Steps' : 'Ingredients'}
          </h2>
          <Button 
            type="button" 
            size="sm"
            onClick={onAddIngredient} 
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> 
            {isHospitality ? 'Add Step' : 'Add Ingredient'}
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          {isHospitality 
            ? 'List the steps required to deliver this service standard' 
            : 'List all ingredients needed for this recipe'}
        </p>
      </div>

      <div className="space-y-3">
        {ingredients.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-md">
            <p className="text-gray-500">
              {isHospitality 
                ? 'No steps added yet. Click "Add Step" to begin.' 
                : 'No ingredients added yet. Click "Add Ingredient" to begin.'}
            </p>
          </div>
        ) : (
          ingredients.map((ingredient, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end border-b pb-2">
              <div className="col-span-4">
                <Label htmlFor={`ingredient-name-${index}`} className="text-xs">
                  {isHospitality ? 'Step Description' : 'Ingredient Name'}
                </Label>
                <Input
                  id={`ingredient-name-${index}`}
                  value={ingredient.name}
                  onChange={(e) => onIngredientChange(index, 'name', e.target.value)}
                  placeholder={isHospitality ? "Describe this step" : "Ingredient name"}
                />
              </div>
              
              {isHospitality ? (
                <div className="col-span-3">
                  <Label htmlFor={`ingredient-importance-${index}`} className="text-xs">Importance (1-10)</Label>
                  <Input
                    id={`ingredient-importance-${index}`}
                    type="number"
                    min="1"
                    max="10"
                    value={ingredient.costPerUnit || ''}
                    onChange={(e) => onIngredientChange(index, 'costPerUnit', e.target.value)}
                    placeholder="Rate importance"
                  />
                </div>
              ) : (
                <>
                  <div className="col-span-2">
                    <Label htmlFor={`ingredient-amount-${index}`} className="text-xs">Amount</Label>
                    <Input
                      id={`ingredient-amount-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={ingredient.amount || ''}
                      onChange={(e) => onIngredientChange(index, 'amount', e.target.value)}
                      placeholder="Qty"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`ingredient-unit-${index}`} className="text-xs">Unit</Label>
                    <Input
                      id={`ingredient-unit-${index}`}
                      value={ingredient.unit || ''}
                      onChange={(e) => onIngredientChange(index, 'unit', e.target.value)}
                      placeholder="Unit"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`ingredient-cost-${index}`} className="text-xs">Cost/Unit</Label>
                    <Input
                      id={`ingredient-cost-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={ingredient.costPerUnit || ''}
                      onChange={(e) => onIngredientChange(index, 'costPerUnit', e.target.value)}
                      placeholder="£0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Total Cost</Label>
                    <div className="bg-gray-100 border px-3 py-2 rounded-md text-right text-gray-700">
                      £{(ingredient.totalCost || 0).toFixed(2)}
                    </div>
                  </div>
                </>
              )}
              
              <div className="col-span-1 flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveIngredient(index)}
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IngredientForm;
