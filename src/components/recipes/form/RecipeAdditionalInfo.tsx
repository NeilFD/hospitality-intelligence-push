
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface RecipeAdditionalInfoProps {
  timeToTableMinutes: number;
  recommendedUpsell?: string;
  miseEnPlace?: string;
  actualMenuPrice: number;
  suggestedPrice: number;
  grossProfitPercentage: number;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCostingChange: (field: string, value: string) => void;
  moduleType: 'food' | 'beverage' | 'hospitality';
}

const RecipeAdditionalInfo: React.FC<RecipeAdditionalInfoProps> = ({
  timeToTableMinutes,
  recommendedUpsell,
  miseEnPlace,
  actualMenuPrice,
  suggestedPrice,
  grossProfitPercentage,
  onInputChange,
  onCostingChange,
  moduleType
}) => {
  const isHospitality = moduleType === 'hospitality';
  const isBeverage = moduleType === 'beverage';

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Additional Information</h2>
        <p className="text-muted-foreground">
          {isHospitality ? 'Extra details about this service guide' : 'Extra details about this recipe'}
        </p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="timeToTableMinutes">
            {isHospitality ? 'Time Required (Minutes)' : 'Time to Table (Minutes)'}
          </Label>
          <Input
            id="timeToTableMinutes"
            name="timeToTableMinutes"
            type="number"
            min="0"
            value={timeToTableMinutes || ''}
            onChange={onInputChange}
            placeholder="Enter time in minutes"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="miseEnPlace">
            {isHospitality ? 'Required Tools/Resources' : 
             isBeverage ? 'Garnish' : 
             'Mise en Place'}
          </Label>
          <textarea
            id="miseEnPlace"
            name="miseEnPlace"
            rows={3}
            value={miseEnPlace}
            onChange={onInputChange}
            className="mt-1 w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-900"
            placeholder={isHospitality ? "List equipment, tools or resources needed..." : 
                         isBeverage ? "Describe garnish preparation..." : 
                         "List preparation tasks and setup requirements..."}
          />
        </div>

        <div>
          <Label htmlFor="recommendedUpsell">
            {isHospitality ? 'Related Services' : 'Recommended Upsell'}
          </Label>
          <Input
            id="recommendedUpsell"
            name="recommendedUpsell"
            value={recommendedUpsell}
            onChange={onInputChange}
            placeholder={isHospitality ? "Other related service guides..." : "Recommended upsell items"}
            className="mt-1"
          />
        </div>

        {!isHospitality && (
          <div>
            <Label>Costing Information</Label>
            <Card className="p-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="actualMenuPrice" className="text-sm">Menu Price (£)</Label>
                  <Input
                    id="actualMenuPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={actualMenuPrice || ''}
                    onChange={(e) => onCostingChange('actualMenuPrice', e.target.value)}
                    placeholder="£0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Suggested Price</Label>
                  <div className="bg-gray-100 border mt-1 px-3 py-2 rounded-md text-right text-gray-700">
                    £{suggestedPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Gross Profit %</Label>
                  <div className="bg-gray-100 border mt-1 px-3 py-2 rounded-md text-right text-gray-700">
                    {grossProfitPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeAdditionalInfo;
