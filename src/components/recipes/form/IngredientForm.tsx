
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrashIcon, PlusCircleIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ingredient } from '@/types/recipe-types';

interface IngredientFormProps {
  ingredients: Ingredient[];
  onIngredientChange: (index: number, field: keyof Ingredient, value: string | number) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
  moduleType: 'food' | 'beverage' | 'hospitality';
}

const IngredientForm: React.FC<IngredientFormProps> = ({
  ingredients,
  onIngredientChange,
  onAddIngredient,
  onRemoveIngredient,
  moduleType
}) => {
  const isHospitality = moduleType === 'hospitality';
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{isHospitality ? 'Steps/Procedures' : 'Ingredients'}</h2>
        <p className="text-muted-foreground">{isHospitality ? 'Add steps or procedures for this service guide' : 'Add ingredients and their costs'}</p>
      </div>

      {ingredients.map((ingredient, index) => (
        <div key={ingredient.id || index} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-12 md:col-span-5">
            <Label htmlFor={`ingredient-name-${index}`} className="sr-only">
              {isHospitality ? 'Step Description' : 'Ingredient Name'}
            </Label>
            <Input
              id={`ingredient-name-${index}`}
              value={ingredient.name}
              onChange={(e) => onIngredientChange(index, 'name', e.target.value)}
              placeholder={isHospitality ? "Step description" : "Ingredient name"}
            />
          </div>
          
          {!isHospitality && (
            <>
              <div className="col-span-3 md:col-span-2">
                <Label htmlFor={`ingredient-amount-${index}`} className="sr-only">
                  Amount
                </Label>
                <Input
                  id={`ingredient-amount-${index}`}
                  type="number"
                  value={ingredient.amount || ''}
                  onChange={(e) => onIngredientChange(index, 'amount', e.target.value)}
                  placeholder="Amount"
                />
              </div>
              
              <div className="col-span-4 md:col-span-2">
                <Label htmlFor={`ingredient-unit-${index}`} className="sr-only">
                  Unit
                </Label>
                <Select
                  value={ingredient.unit}
                  onValueChange={(value) => onIngredientChange(index, 'unit', value)}
                >
                  <SelectTrigger id={`ingredient-unit-${index}`}>
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">grams (g)</SelectItem>
                    <SelectItem value="kg">kilograms (kg)</SelectItem>
                    <SelectItem value="ml">milliliters (ml)</SelectItem>
                    <SelectItem value="l">liters (l)</SelectItem>
                    <SelectItem value="pcs">pieces (pcs)</SelectItem>
                    <SelectItem value="tbsp">tablespoon (tbsp)</SelectItem>
                    <SelectItem value="tsp">teaspoon (tsp)</SelectItem>
                    <SelectItem value="oz">ounce (oz)</SelectItem>
                    <SelectItem value="lb">pound (lb)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-5 md:col-span-2">
                <Label htmlFor={`ingredient-cost-${index}`} className="sr-only">
                  Cost Per Unit
                </Label>
                <Input
                  id={`ingredient-cost-${index}`}
                  type="number"
                  value={ingredient.costPerUnit || ''}
                  onChange={(e) => onIngredientChange(index, 'costPerUnit', e.target.value)}
                  placeholder="Cost/unit"
                />
              </div>
              
              <div className="hidden md:block md:col-span-1 text-right">
                {Number(ingredient.amount || 0) * Number(ingredient.costPerUnit || 0)}
              </div>
            </>
          )}

          <div className={`col-span-12 md:col-span-1 flex ${isHospitality ? 'justify-end' : ''}`}>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => onRemoveIngredient(index)}
              className="text-red-500 hover:text-red-700 hover:bg-red-100"
            >
              <TrashIcon className="h-4 w-4" />
              <span className="sr-only">Remove {isHospitality ? 'step' : 'ingredient'}</span>
            </Button>
          </div>
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddIngredient}
        className="flex items-center gap-1"
      >
        <PlusCircleIcon className="h-4 w-4" />
        <span>{isHospitality ? 'Add Step' : 'Add Ingredient'}</span>
      </Button>
    </div>
  );
};

export default IngredientForm;
