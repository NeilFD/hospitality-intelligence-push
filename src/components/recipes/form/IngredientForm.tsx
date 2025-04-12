
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Ingredient } from '@/types/recipe-types';
import { Trash2, Plus } from 'lucide-react';

interface IngredientFormProps {
  ingredients: Ingredient[];
  onIngredientsChange: (ingredients: Ingredient[]) => void;
  moduleType: string;
}

const IngredientForm: React.FC<IngredientFormProps> = ({
  ingredients,
  onIngredientsChange,
  moduleType
}) => {
  const addIngredient = () => {
    const newIngredient: Ingredient = {
      id: `temp-${Date.now()}`,
      name: '',
      amount: 0,
      unit: '',
      costPerUnit: 0,
      totalCost: 0
    };
    onIngredientsChange([...ingredients, newIngredient]);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    onIngredientsChange(newIngredients);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const newIngredients = [...ingredients];
    
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value
    };
    
    // Auto-calculate total cost if amount and cost per unit are set
    if (field === 'amount' || field === 'costPerUnit') {
      const amount = field === 'amount' ? value : newIngredients[index].amount;
      const costPerUnit = field === 'costPerUnit' ? value : newIngredients[index].costPerUnit;
      
      if (amount && costPerUnit) {
        newIngredients[index].totalCost = amount * costPerUnit;
      }
    }
    
    onIngredientsChange(newIngredients);
  };

  // Labels based on the module type
  const getLabels = () => {
    if (moduleType === 'hospitality') {
      return {
        title: 'Steps',
        description: 'Add steps required for this hospitality guide',
        name: 'Step Description',
        amount: 'Order',
        unit: 'Duration',
        costPerUnit: 'Importance (1-10)',
        totalCost: 'Score',
        addButton: 'Add Step',
        placeholder: 'Enter step details...'
      };
    } else if (moduleType === 'beverage') {
      return {
        title: 'Ingredients',
        description: 'Add ingredients required for this beverage',
        name: 'Ingredient',
        amount: 'Amount',
        unit: 'Unit',
        costPerUnit: 'Cost per Unit',
        totalCost: 'Total Cost',
        addButton: 'Add Ingredient',
        placeholder: 'Enter ingredient name...'
      };
    } else {
      return {
        title: 'Ingredients',
        description: 'Add ingredients required for this recipe',
        name: 'Ingredient',
        amount: 'Amount',
        unit: 'Unit',
        costPerUnit: 'Cost per Unit',
        totalCost: 'Total Cost',
        addButton: 'Add Ingredient',
        placeholder: 'Enter ingredient name...'
      };
    }
  };

  const labels = getLabels();

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">{labels.title}</h2>
        <p className="text-muted-foreground">{labels.description}</p>
      </div>

      <div className="space-y-4">
        {ingredients.map((ingredient, index) => (
          <Card key={ingredient.id || index} className="relative">
            <CardHeader className="p-4 pb-0">
              <div className="flex justify-between items-center">
                <Label className="font-semibold">
                  {moduleType === 'hospitality' ? `Step ${index + 1}` : `Ingredient ${index + 1}`}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeIngredient(index)}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor={`ingredient-name-${index}`}>{labels.name}</Label>
                  <Input
                    id={`ingredient-name-${index}`}
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    placeholder={labels.placeholder}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`ingredient-amount-${index}`}>{labels.amount}</Label>
                    <Input
                      id={`ingredient-amount-${index}`}
                      type="number"
                      value={ingredient.amount || ''}
                      onChange={(e) => updateIngredient(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`ingredient-unit-${index}`}>{labels.unit}</Label>
                    <Input
                      id={`ingredient-unit-${index}`}
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      placeholder={moduleType === 'hospitality' ? "mins/hours/etc." : "g/ml/pieces/etc."}
                      className="mt-1"
                    />
                  </div>
                </div>
                {moduleType !== 'hospitality' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`ingredient-cost-${index}`}>{labels.costPerUnit}</Label>
                      <Input
                        id={`ingredient-cost-${index}`}
                        type="number"
                        value={ingredient.costPerUnit || ''}
                        onChange={(e) => updateIngredient(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`ingredient-total-${index}`}>{labels.totalCost}</Label>
                      <Input
                        id={`ingredient-total-${index}`}
                        type="number"
                        value={ingredient.totalCost?.toFixed(2) || 0}
                        readOnly
                        className="mt-1 bg-gray-50"
                      />
                    </div>
                  </div>
                )}
                {moduleType === 'hospitality' && (
                  <div>
                    <Label htmlFor={`ingredient-cost-${index}`}>{labels.costPerUnit}</Label>
                    <Input
                      id={`ingredient-cost-${index}`}
                      type="number"
                      value={ingredient.costPerUnit || ''}
                      onChange={(e) => updateIngredient(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
                      min="1"
                      max="10"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Button 
          variant="outline" 
          onClick={addIngredient}
          className="w-full flex items-center justify-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {labels.addButton}
        </Button>
      </div>
    </div>
  );
};

export default IngredientForm;
