
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RecipeAdditionalInfoProps {
  recommendedUpsell: string;
  onRecommendedUpsellChange: (value: string) => void;
  timeToTableMinutes: number;
  onTimeToTableMinutesChange: (value: number) => void;
  miseEnPlace: string;
  onMiseEnPlaceChange: (value: string) => void;
  method: string;
  onMethodChange: (value: string) => void;
  moduleType: string;
}

const RecipeAdditionalInfo: React.FC<RecipeAdditionalInfoProps> = ({
  recommendedUpsell,
  onRecommendedUpsellChange,
  timeToTableMinutes,
  onTimeToTableMinutesChange,
  miseEnPlace,
  onMiseEnPlaceChange,
  method,
  onMethodChange,
  moduleType
}) => {
  // Get appropriate labels for the fields based on module type
  const getLabels = () => {
    if (moduleType === 'hospitality') {
      return {
        title: 'Additional Guide Information',
        description: 'Add more details to your hospitality guide',
        upsellLabel: 'Related Services',
        upsellPlaceholder: 'Suggest related services or experiences',
        timeLabel: 'Time Required (minutes)',
        miseLabel: 'Required Tools/Resources',
        misePlaceholder: 'List any tools or resources needed',
        methodLabel: 'Detailed Procedure',
        methodPlaceholder: 'Describe the procedure in detail'
      };
    } else if (moduleType === 'beverage') {
      return {
        title: 'Additional Recipe Information',
        description: 'Add more details to your beverage recipe',
        upsellLabel: 'Recommended Upsell',
        upsellPlaceholder: 'Suggest pairings or add-ons',
        timeLabel: 'Time to Table (minutes)',
        miseLabel: 'Garnish',
        misePlaceholder: 'Describe the garnish for this beverage',
        methodLabel: 'Method',
        methodPlaceholder: 'Describe the preparation method in detail'
      };
    } else {
      return {
        title: 'Additional Recipe Information',
        description: 'Add more details to your food recipe',
        upsellLabel: 'Recommended Upsell',
        upsellPlaceholder: 'Suggest pairings or add-ons',
        timeLabel: 'Time to Table (minutes)',
        miseLabel: 'Mise en Place',
        misePlaceholder: 'Describe the preparation before cooking',
        methodLabel: 'Method',
        methodPlaceholder: 'Describe the cooking method in detail'
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

      <div>
        <Label htmlFor="recommendedUpsell">{labels.upsellLabel}</Label>
        <Input
          id="recommendedUpsell"
          value={recommendedUpsell}
          onChange={(e) => onRecommendedUpsellChange(e.target.value)}
          placeholder={labels.upsellPlaceholder}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="timeToTable">{labels.timeLabel}</Label>
        <Input
          id="timeToTable"
          type="number"
          value={timeToTableMinutes || ''}
          onChange={(e) => onTimeToTableMinutesChange(Number(e.target.value))}
          min="0"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="miseEnPlace">{labels.miseLabel}</Label>
        <Textarea
          id="miseEnPlace"
          value={miseEnPlace}
          onChange={(e) => onMiseEnPlaceChange(e.target.value)}
          placeholder={labels.misePlaceholder}
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="method">{labels.methodLabel}</Label>
        <Textarea
          id="method"
          value={method}
          onChange={(e) => onMethodChange(e.target.value)}
          placeholder={labels.methodPlaceholder}
          className="mt-1"
          rows={6}
        />
      </div>
    </div>
  );
};

export default RecipeAdditionalInfo;
