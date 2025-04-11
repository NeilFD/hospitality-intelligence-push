
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RecipeAdditionalInfoProps {
  timeToTableMinutes: number;
  recommendedUpsell: string;
  miseEnPlace: string;
  actualMenuPrice: number;
  suggestedPrice: number;
  grossProfitPercentage: number;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCostingChange: (field: string, value: string) => void;
}

export const RecipeAdditionalInfo: React.FC<RecipeAdditionalInfoProps> = ({
  timeToTableMinutes,
  recommendedUpsell,
  miseEnPlace,
  actualMenuPrice,
  suggestedPrice,
  grossProfitPercentage,
  onInputChange,
  onCostingChange
}) => {
  // Handle input changes individually to prevent propagation issues
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.stopPropagation();
    onInputChange(e);
  };
  
  const handleCostingChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onCostingChange(field, e.target.value);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="actualMenuPrice" className="text-gray-900">Menu Price (£)</Label>
        <Input 
          id="actualMenuPrice"
          type="number"
          step="0.01"
          value={actualMenuPrice || ''}
          onChange={(e) => handleCostingChange('actualMenuPrice', e)}
          placeholder="Enter menu price"
          className="text-gray-900 bg-white border border-gray-300"
        />
        <div className="text-sm text-gray-500 mt-1">
          Suggested Price: £{suggestedPrice.toFixed(2)} (70% GP inc. VAT)
        </div>
        <div className="text-sm text-gray-500">
          Actual GP: {(grossProfitPercentage * 100).toFixed(1)}%
        </div>
      </div>
      
      <div>
        <Label htmlFor="timeToTableMinutes" className="text-gray-900">Time to Table (mins)</Label>
        <Input 
          id="timeToTableMinutes"
          name="timeToTableMinutes"
          type="number"
          value={timeToTableMinutes || ''}
          onChange={handleInputChange}
          placeholder="Enter preparation time"
          className="text-gray-900 bg-white border border-gray-300"
        />
      </div>
      
      <div>
        <Label htmlFor="recommendedUpsell" className="text-gray-900">Recommended Upsell</Label>
        <Input 
          id="recommendedUpsell"
          name="recommendedUpsell"
          value={recommendedUpsell || ''}
          onChange={handleInputChange}
          placeholder="Enter recommended upsell"
          className="text-gray-900 bg-white border border-gray-300"
        />
      </div>
      
      <div>
        <Label htmlFor="miseEnPlace" className="text-gray-900">Mise en Place</Label>
        <Textarea 
          id="miseEnPlace"
          name="miseEnPlace"
          value={miseEnPlace || ''}
          onChange={handleInputChange}
          placeholder="Enter mise en place details"
          rows={4}
          className="text-gray-900 bg-white border border-gray-300"
        />
      </div>
    </div>
  );
};
