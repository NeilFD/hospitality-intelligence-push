
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Ingredient } from '@/types/recipe-types';
import { Trash2, Plus } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

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

  // Calculate total recipe cost
  const totalRecipeCost = ingredients.reduce((total, ingredient) => {
    return total + (ingredient.totalCost || 0);
  }, 0);

  // Calculate recommended selling price at 70% GP inc VAT
  // Formula: Cost / (1 - 0.7) = Selling price before VAT
  // Then add 20% VAT: Selling price before VAT * 1.2
  const recommendedSellingPrice = totalRecipeCost > 0 ? (totalRecipeCost / 0.3) * 1.2 : 0;

  // Calculate GP% based on actual menu price
  const actualMenuPrice = 0; // This would come from the recipe data
  const actualGpPercentage = actualMenuPrice > 0 ? 
    ((actualMenuPrice / 1.2 - totalRecipeCost) / (actualMenuPrice / 1.2)) * 100 : 0;

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
        <h2 className="text-xl font-semibold mb-2 text-gray-900">{labels.title}</h2>
        <p className="text-muted-foreground">{labels.description}</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%] text-gray-900">{labels.name}</TableHead>
                <TableHead className="text-gray-900">{labels.amount}</TableHead>
                <TableHead className="text-gray-900">{labels.unit}</TableHead>
                {moduleType !== 'hospitality' && (
                  <>
                    <TableHead className="text-gray-900">{labels.costPerUnit}</TableHead>
                    <TableHead className="text-gray-900">{labels.totalCost}</TableHead>
                  </>
                )}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ingredient, index) => (
                <TableRow key={ingredient.id || index}>
                  <TableCell>
                    <Input
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      placeholder={labels.placeholder}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={ingredient.amount || ''}
                      onChange={(e) => updateIngredient(index, 'amount', parseFloat(e.target.value) || 0)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      placeholder={moduleType === 'hospitality' ? "mins/hours/etc." : "g/ml/pieces/etc."}
                    />
                  </TableCell>
                  {moduleType !== 'hospitality' && (
                    <>
                      <TableCell>
                        <Input
                          type="number"
                          value={ingredient.costPerUnit || ''}
                          onChange={(e) => updateIngredient(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ingredient.totalCost?.toFixed(2) || 0}
                          readOnly
                          className="bg-gray-50"
                        />
                      </TableCell>
                    </>
                  )}
                  {moduleType === 'hospitality' && (
                    <TableCell>
                      <Input
                        type="number"
                        value={ingredient.costPerUnit || ''}
                        onChange={(e) => updateIngredient(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
                        min="1"
                        max="10"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Add ingredient button row */}
              <TableRow>
                <TableCell colSpan={moduleType !== 'hospitality' ? 6 : 4} className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={addIngredient}
                    className="w-full flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {labels.addButton}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          {moduleType !== 'hospitality' && (
            <div className="mt-6 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900 font-medium">Total Recipe Cost</Label>
                  <div className="mt-1 bg-gray-50 border border-gray-200 rounded p-2 text-gray-900 font-semibold">
                    £{totalRecipeCost.toFixed(2)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-900 font-medium">Recommended Selling Price (70% GP)</Label>
                  <div className="mt-1 bg-gray-50 border border-gray-200 rounded p-2 text-gray-900 font-semibold">
                    £{recommendedSellingPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IngredientForm;
