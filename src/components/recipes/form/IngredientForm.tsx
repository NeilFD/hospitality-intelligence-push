import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Ingredient } from '@/types/recipe-types';
import { Trash2, Plus } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IngredientFormProps {
  ingredients: Ingredient[];
  onIngredientsChange: (ingredients: Ingredient[]) => void;
  moduleType: string;
}

const commonUnits = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'l', label: 'Liters (l)' },
  { value: 'pcs', label: 'Pieces' },
  { value: 'tbsp', label: 'Tablespoon' },
  { value: 'tsp', label: 'Teaspoon' },
  { value: 'cup', label: 'Cup' },
  { value: 'oz', label: 'Ounce (oz)' },
  { value: 'lb', label: 'Pound (lb)' },
  { value: 'pinch', label: 'Pinch' },
  { value: 'slice', label: 'Slice' },
  { value: 'clove', label: 'Clove' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'sprig', label: 'Sprig' },
];

const IngredientForm: React.FC<IngredientFormProps> = ({
  ingredients,
  onIngredientsChange,
  moduleType
}) => {
  const [actualMenuPrice, setActualMenuPrice] = useState<number>(0);
  
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
    
    if (field === 'amount' || field === 'costPerUnit') {
      const amount = field === 'amount' ? value : newIngredients[index].amount;
      const costPerUnit = field === 'costPerUnit' ? value : newIngredients[index].costPerUnit;
      
      if (amount && costPerUnit) {
        newIngredients[index].totalCost = amount * costPerUnit;
      }
    }
    
    onIngredientsChange(newIngredients);
  };

  const totalRecipeCost = ingredients.reduce((total, ingredient) => {
    return total + (ingredient.totalCost || 0);
  }, 0);

  const recommendedSellingPrice = totalRecipeCost > 0 ? (totalRecipeCost / 0.3) * 1.2 : 0;

  const actualGpPercentage = actualMenuPrice > 0 ? 
    ((actualMenuPrice / 1.2 - totalRecipeCost) / (actualMenuPrice / 1.2)) * 100 : 0;

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%] text-gray-900">{labels.name}</TableHead>
                  <TableHead className="text-gray-900 w-[15%]">{labels.amount}</TableHead>
                  <TableHead className="text-gray-900 w-[15%]">{labels.unit}</TableHead>
                  {moduleType !== 'hospitality' && (
                    <>
                      <TableHead className="text-gray-900 w-[15%]">{labels.costPerUnit}</TableHead>
                      <TableHead className="text-gray-900 w-[15%]">{labels.totalCost}</TableHead>
                    </>
                  )}
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient, index) => (
                  <TableRow key={ingredient.id || index}>
                    <TableCell className="py-2">
                      <Input
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                        placeholder={labels.placeholder}
                        className="border border-gray-300 bg-white text-gray-900"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number"
                        value={ingredient.amount || ''}
                        onChange={(e) => updateIngredient(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="border border-gray-300 bg-white text-gray-900"
                        step="any"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      {moduleType === 'hospitality' ? (
                        <Input
                          value={ingredient.unit}
                          onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                          placeholder="mins/hours/etc."
                          className="border border-gray-300 bg-white text-gray-900"
                        />
                      ) : (
                        <Select 
                          value={ingredient.unit} 
                          onValueChange={(value) => updateIngredient(index, 'unit', value)}
                        >
                          <SelectTrigger className="border border-gray-300 bg-white text-gray-900">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-gray-900">
                            {commonUnits.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Custom...</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    {moduleType !== 'hospitality' && (
                      <>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            value={ingredient.costPerUnit || ''}
                            onChange={(e) => updateIngredient(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            className="border border-gray-300 bg-white text-gray-900 w-full"
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            value={ingredient.totalCost?.toFixed(2) || 0}
                            readOnly
                            className="bg-gray-50 border border-gray-300 text-gray-900"
                          />
                        </TableCell>
                      </>
                    )}
                    {moduleType === 'hospitality' && (
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          value={ingredient.costPerUnit || ''}
                          onChange={(e) => updateIngredient(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
                          min="1"
                          max="10"
                          className="border border-gray-300 bg-white text-gray-900"
                        />
                      </TableCell>
                    )}
                    <TableCell className="py-2">
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
                
                <TableRow>
                  <TableCell colSpan={moduleType !== 'hospitality' ? 6 : 4} className="text-center py-2">
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
          </div>
          
          {moduleType !== 'hospitality' && (
            <div className="mt-6 border-t pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-900 font-medium block mb-2 truncate">Recipe Cost</Label>
                  <Input 
                    value={`£${totalRecipeCost.toFixed(2)}`}
                    readOnly
                    className="bg-gray-50 border border-gray-300 text-gray-900 font-semibold"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-900 font-medium block mb-2 truncate">Selling Price (70% GP)</Label>
                  <Input 
                    value={`£${recommendedSellingPrice.toFixed(2)}`}
                    readOnly
                    className="bg-gray-50 border border-gray-300 text-gray-900 font-semibold"
                  />
                </div>

                <div>
                  <Label className="text-gray-900 font-medium block mb-2 truncate">Menu Price</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">£</span>
                    <Input
                      type="number"
                      value={actualMenuPrice || ''}
                      onChange={(e) => setActualMenuPrice(parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0"
                      className="border border-gray-300 bg-white text-gray-900"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Label className="text-gray-900 font-medium">GP%:</Label>
                    <span className="text-gray-900 font-semibold ml-2">
                      {actualGpPercentage.toFixed(2)}%
                    </span>
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
