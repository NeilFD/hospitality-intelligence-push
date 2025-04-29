
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  calculateWeightedScore, 
  FOH_WEIGHTS, 
  KITCHEN_WEIGHTS, 
  getEmptyScores,
  FohScores,
  KitchenScores,
  ScoreType
} from '@/utils/hiScoreCalculations';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '@/services/auth-service';
import { CheckCircle, Save } from 'lucide-react';

interface HiScoreMatrixProps {
  profileId: string;
  roleType: 'foh' | 'kitchen';
  onRoleTypeChange?: (roleType: 'foh' | 'kitchen') => void;
  existingEvaluation?: any;
  isReadOnly?: boolean;
}

export default function HiScoreMatrix({ 
  profileId, 
  roleType, 
  onRoleTypeChange, 
  existingEvaluation = null,
  isReadOnly = false
}: HiScoreMatrixProps) {
  const { profile: currentUserProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);
  
  const [scores, setScores] = useState<ScoreType>(() => {
    if (existingEvaluation) {
      if (roleType === 'foh') {
        return {
          hospitality: existingEvaluation.hospitality || 0,
          friendliness: existingEvaluation.friendliness || 0,
          internalTeamSkills: existingEvaluation.internal_team_skills || 0,
          serviceSkills: existingEvaluation.service_skills || 0,
          fohKnowledge: existingEvaluation.foh_knowledge || 0,
        } as FohScores;
      } else {
        return {
          workEthic: existingEvaluation.work_ethic || 0,
          teamPlayer: existingEvaluation.team_player || 0,
          adaptability: existingEvaluation.adaptability || 0,
          cookingSkills: existingEvaluation.cooking_skills || 0,
          foodKnowledge: existingEvaluation.food_knowledge || 0,
        } as KitchenScores;
      }
    }
    return getEmptyScores(roleType);
  });
  
  const [notes, setNotes] = useState(existingEvaluation?.notes || '');
  const [isSignedOff, setIsSignedOff] = useState(existingEvaluation?.is_signed_off || false);
  
  const weights = roleType === 'foh' ? FOH_WEIGHTS : KITCHEN_WEIGHTS;
  const totalScore = calculateWeightedScore(scores, weights) * 10; // Scale to 0-100
  
  const handleScoreChange = (category: string, value: number[]) => {
    setScores({ ...scores, [category]: value[0] });
  };

  const handleSaveEvaluation = async () => {
    try {
      setSaving(true);
      
      const evaluationData: Record<string, any> = {
        profile_id: profileId,
        evaluator_id: currentUserProfile?.id,
        role_type: roleType,
        weighted_score: (totalScore / 10), // Store as 0-10 value
        notes,
        is_signed_off: isSignedOff,
      };
      
      // Add role-specific scores
      if (roleType === 'foh') {
        const fohScores = scores as FohScores;
        Object.assign(evaluationData, {
          hospitality: fohScores.hospitality,
          friendliness: fohScores.friendliness,
          internal_team_skills: fohScores.internalTeamSkills,
          service_skills: fohScores.serviceSkills,
          foh_knowledge: fohScores.fohKnowledge,
        });
      } else {
        const kitchenScores = scores as KitchenScores;
        Object.assign(evaluationData, {
          work_ethic: kitchenScores.workEthic,
          team_player: kitchenScores.teamPlayer,
          adaptability: kitchenScores.adaptability,
          cooking_skills: kitchenScores.cookingSkills,
          food_knowledge: kitchenScores.foodKnowledge,
        });
      }
      
      let result;
      
      if (existingEvaluation) {
        // Update existing evaluation
        result = await supabase
          .from('hi_score_evaluations')
          .update(evaluationData)
          .eq('id', existingEvaluation.id);
      } else {
        // Insert new evaluation
        result = await supabase
          .from('hi_score_evaluations')
          .insert(evaluationData);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success(existingEvaluation ? 'Evaluation updated' : 'Evaluation saved');
      
      // Also update the profile's role_type
      await supabase
        .from('profiles')
        .update({ role_type: roleType })
        .eq('id', profileId);
      
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('Failed to save evaluation');
    } finally {
      setSaving(false);
    }
  };
  
  // Check if the current user has manager permissions
  const hasManagerPermissions = currentUserProfile?.role && 
    ['GOD', 'Super User', 'Manager', 'Owner'].includes(currentUserProfile.role.toString());
  
  const renderMatrixItems = () => {
    if (roleType === 'foh') {
      const fohScores = scores as FohScores;
      return (
        <>
          <MatrixItem 
            label="Hospitality" 
            value={fohScores.hospitality} 
            weight={weights.hospitality}
            onChange={(v) => handleScoreChange('hospitality', v)}
            readOnly={isReadOnly}
          />
          <MatrixItem 
            label="Friendliness" 
            value={fohScores.friendliness} 
            weight={weights.friendliness}
            onChange={(v) => handleScoreChange('friendliness', v)} 
            readOnly={isReadOnly}
          />
          <MatrixItem 
            label="Internal Team Skills" 
            value={fohScores.internalTeamSkills} 
            weight={weights.internalTeamSkills}
            onChange={(v) => handleScoreChange('internalTeamSkills', v)} 
            readOnly={isReadOnly}
          />
          <MatrixItem 
            label="Service Skills" 
            value={fohScores.serviceSkills} 
            weight={weights.serviceSkills}
            onChange={(v) => handleScoreChange('serviceSkills', v)} 
            readOnly={isReadOnly}
          />
          <MatrixItem 
            label="Knowledge" 
            value={fohScores.fohKnowledge} 
            weight={weights.fohKnowledge}
            onChange={(v) => handleScoreChange('fohKnowledge', v)} 
            readOnly={isReadOnly}
          />
        </>
      );
    } else {
      const kitchenScores = scores as KitchenScores;
      return (
        <>
          <MatrixItem 
            label="Work Ethic & Discipline" 
            value={kitchenScores.workEthic} 
            weight={weights.workEthic}
            onChange={(v) => handleScoreChange('workEthic', v)} 
            readOnly={isReadOnly}
          />
          <MatrixItem 
            label="Team Player Mentality" 
            value={kitchenScores.teamPlayer} 
            weight={weights.teamPlayer}
            onChange={(v) => handleScoreChange('teamPlayer', v)} 
            readOnly={isReadOnly}
          />
          <MatrixItem 
            label="Adaptability & Attitude" 
            value={kitchenScores.adaptability} 
            weight={weights.adaptability}
            onChange={(v) => handleScoreChange('adaptability', v)} 
            readOnly={isReadOnly}
          />
          <MatrixItem 
            label="Knife & Cooking Skills" 
            value={kitchenScores.cookingSkills} 
            weight={weights.cookingSkills}
            onChange={(v) => handleScoreChange('cookingSkills', v)} 
            readOnly={isReadOnly}
          />
          <MatrixItem 
            label="Food Knowledge" 
            value={kitchenScores.foodKnowledge} 
            weight={weights.foodKnowledge}
            onChange={(v) => handleScoreChange('foodKnowledge', v)} 
            readOnly={isReadOnly}
          />
        </>
      );
    }
  };
  
  return (
    <Card className="border-hi-purple/20 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-hi-purple">Hi Score Evaluation</CardTitle>
          
          {!isReadOnly && hasManagerPermissions && (
            <Select value={roleType} onValueChange={(value: 'foh' | 'kitchen') => {
              if (onRoleTypeChange) onRoleTypeChange(value);
            }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="foh">FOH</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {renderMatrixItems()}
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Overall Score</h3>
              <div className="flex items-center">
                <span className="font-bold text-2xl text-hi-purple">{totalScore.toFixed(1)}</span>
                <span className="text-gray-500">/100</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="h-2.5 rounded-full bg-hi-purple" 
                style={{ width: `${totalScore}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-6">
            <Label htmlFor="evaluation-notes" className="block mb-2">Notes & Feedback</Label>
            <Textarea 
              id="evaluation-notes"
              placeholder="Add notes or feedback about the team member's performance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
              disabled={isReadOnly || !hasManagerPermissions}
            />
          </div>
          
          {!isReadOnly && hasManagerPermissions && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="sign-off" 
                  checked={isSignedOff}
                  onChange={(e) => setIsSignedOff(e.target.checked)}
                  className="rounded border-gray-300 text-hi-purple focus:ring-hi-purple"
                />
                <Label htmlFor="sign-off" className="text-sm font-medium cursor-pointer">
                  Sign off evaluation
                </Label>
              </div>
              
              <Button 
                onClick={handleSaveEvaluation} 
                disabled={saving}
                className="bg-hi-purple hover:bg-hi-purple-dark"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Evaluation
                  </>
                )}
              </Button>
            </div>
          )}
          
          {isReadOnly && isSignedOff && (
            <div className="flex items-center mt-4 p-2 bg-green-50 text-green-700 rounded-md">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">This evaluation has been signed off</span>
            </div>
          )}
          
          {existingEvaluation && (
            <div className="text-xs text-gray-500 mt-4">
              <p>Last updated: {new Date(existingEvaluation.updated_at).toLocaleString()}</p>
              <p>Evaluated by: {existingEvaluation.evaluator_name || 'Unknown'}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface MatrixItemProps {
  label: string;
  value: number;
  weight: number;
  onChange: (value: number[]) => void;
  readOnly?: boolean;
}

function MatrixItem({ label, value, weight, onChange, readOnly = false }: MatrixItemProps) {
  const percentage = Math.round(weight * 100);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <Label className="flex items-center">
          <span>{label}</span>
          <span className="ml-2 text-xs font-normal text-gray-500">({percentage}%)</span>
        </Label>
        <span className="font-medium">{value}/10</span>
      </div>
      <Slider
        value={[value]} 
        onValueChange={readOnly ? undefined : onChange}
        min={0} 
        max={10} 
        step={1}
        disabled={readOnly}
        className={`${readOnly ? 'opacity-70' : ''}`}
      />
    </div>
  );
}
