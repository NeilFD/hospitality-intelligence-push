
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/services/auth-service';
import { 
  calculateWeightedScore, 
  FOH_WEIGHTS, 
  KITCHEN_WEIGHTS, 
  getEmptyScores,
  type FohScores,
  type KitchenScores,
  type ScoreType
} from '@/utils/hiScoreCalculations';
import { Heart, Smile, Handshake, Utensils, Book, WorkIcon as Work, Brain } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface HiScoreMatrixProps {
  profileId: string;
  roleType: 'foh' | 'kitchen';
  onRoleTypeChange?: (type: 'foh' | 'kitchen') => void;
  existingEvaluation?: any;
  isReadOnly?: boolean;
}

export function HiScoreMatrix({ 
  profileId, 
  roleType = 'foh',
  onRoleTypeChange,
  existingEvaluation,
  isReadOnly = false
}: HiScoreMatrixProps) {
  const { profile } = useAuthStore();
  const [scores, setScores] = useState<ScoreType>(
    existingEvaluation ? 
    {
      ...(roleType === 'foh' ? 
        {
          hospitality: existingEvaluation.hospitality || 0,
          friendliness: existingEvaluation.friendliness || 0,
          internalTeamSkills: existingEvaluation.internal_team_skills || 0,
          serviceSkills: existingEvaluation.service_skills || 0,
          fohKnowledge: existingEvaluation.foh_knowledge || 0,
        } : 
        {
          workEthic: existingEvaluation.work_ethic || 0,
          teamPlayer: existingEvaluation.team_player || 0,
          adaptability: existingEvaluation.adaptability || 0,
          cookingSkills: existingEvaluation.cooking_skills || 0,
          foodKnowledge: existingEvaluation.food_knowledge || 0,
        })
    } : getEmptyScores(roleType)
  );
  
  const [comments, setComments] = useState(existingEvaluation?.comments || '');
  const [saving, setSaving] = useState(false);
  
  // Reset scores when role type changes
  useEffect(() => {
    setScores(getEmptyScores(roleType));
  }, [roleType]);

  const handleScoreChange = (category: string, value: number[]) => {
    setScores((prevScores) => {
      // Create a new scores object with the updated value
      if (roleType === 'foh' && 'hospitality' in prevScores) {
        return { ...prevScores, [category]: value[0] } as FohScores;
      } else if (roleType === 'kitchen' && 'workEthic' in prevScores) {
        return { ...prevScores, [category]: value[0] } as KitchenScores;
      }
      return prevScores;
    });
  };
  
  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComments(e.target.value);
  };
  
  const handleSave = async () => {
    try {
      if (!profile?.id) {
        toast.error('You must be logged in to submit evaluations');
        return;
      }
      
      setSaving(true);
      
      // Calculate weighted score based on role type
      const weights = roleType === 'foh' ? FOH_WEIGHTS : KITCHEN_WEIGHTS;
      const weightedScore = calculateWeightedScore(scores as any, weights);
      
      // Prepare data based on role type
      let evaluationData;
      
      if (roleType === 'foh' && 'hospitality' in scores) {
        evaluationData = {
          profile_id: profileId,
          evaluator_id: profile.id,
          role_type: roleType,
          hospitality: scores.hospitality,
          friendliness: scores.friendliness,
          internal_team_skills: scores.internalTeamSkills,
          service_skills: scores.serviceSkills,
          foh_knowledge: scores.fohKnowledge,
          weighted_score: weightedScore,
          comments: comments,
          evaluation_date: new Date().toISOString(),
        };
      } else if (roleType === 'kitchen' && 'workEthic' in scores) {
        evaluationData = {
          profile_id: profileId,
          evaluator_id: profile.id,
          role_type: roleType,
          work_ethic: scores.workEthic,
          team_player: scores.teamPlayer,
          adaptability: scores.adaptability,
          cooking_skills: scores.cookingSkills,
          food_knowledge: scores.foodKnowledge,
          weighted_score: weightedScore,
          comments: comments,
          evaluation_date: new Date().toISOString(),
        };
      }
      
      if (existingEvaluation?.id) {
        // Update existing evaluation
        const { error } = await supabase
          .from('hi_score_evaluations')
          .update(evaluationData)
          .eq('id', existingEvaluation.id);
        
        if (error) throw error;
        toast.success('Evaluation updated successfully');
      } else {
        // Create new evaluation
        const { error } = await supabase
          .from('hi_score_evaluations')
          .insert(evaluationData);
        
        if (error) throw error;
        toast.success('Evaluation submitted successfully');
      }
      
      // Reset form if not updating
      if (!existingEvaluation) {
        setScores(getEmptyScores(roleType));
        setComments('');
      }
      
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('An error occurred while saving the evaluation');
    } finally {
      setSaving(false);
    }
  };
  
  const getWeightedScoreDisplay = () => {
    const weights = roleType === 'foh' ? FOH_WEIGHTS : KITCHEN_WEIGHTS;
    let weightedScore = 0;
    
    if ((roleType === 'foh' && 'hospitality' in scores) || (roleType === 'kitchen' && 'workEthic' in scores)) {
      weightedScore = calculateWeightedScore(scores as any, weights);
    }
    
    // Convert to a 0-100 scale
    return (weightedScore * 10).toFixed(1);
  };
  
  const renderMatrixItems = () => {
    if (roleType === 'foh') {
      return (
        <>
          {/* FOH Criteria */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Heart className="h-5 w-5 text-red-500" />
                        <span className="font-medium">Hospitality (40%)</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>How well do they make people feel seen, heard, and valued? Think less 'technical waiter' and more 'warm human napkin'. 10 means guests leave grinning and glowing.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-lg font-bold">{('hospitality' in scores) ? scores.hospitality : 0}</span>
              </div>
              <Slider 
                disabled={isReadOnly}
                value={[('hospitality' in scores) ? scores.hospitality : 0]} 
                min={0} 
                max={10} 
                step={1} 
                onValueChange={(value) => handleScoreChange('hospitality', value)} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Smile className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium">Friendliness (20%)</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Are they a joy to work with and be served by? Would you sit at their section or avoid eye contact? A top score here means a magnetic smile, even on a double.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-lg font-bold">{('friendliness' in scores) ? scores.friendliness : 0}</span>
              </div>
              <Slider 
                disabled={isReadOnly}
                value={[('friendliness' in scores) ? scores.friendliness : 0]} 
                min={0} 
                max={10} 
                step={1} 
                onValueChange={(value) => handleScoreChange('friendliness', value)} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Handshake className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Internal Team Skills (20%)</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Are they a glue or a grenade? Look for communication, calm under pressure, and being the kind of person others want in the trenches.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-lg font-bold">{('internalTeamSkills' in scores) ? scores.internalTeamSkills : 0}</span>
              </div>
              <Slider 
                disabled={isReadOnly}
                value={[('internalTeamSkills' in scores) ? scores.internalTeamSkills : 0]} 
                min={0} 
                max={10} 
                step={1} 
                onValueChange={(value) => handleScoreChange('internalTeamSkills', value)} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Utensils className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Service Skills (10%)</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Can they carry three plates like a ballet dancer and upsell dessert without sounding like a robot? High marks go to those who move like pros and read the room.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-lg font-bold">{('serviceSkills' in scores) ? scores.serviceSkills : 0}</span>
              </div>
              <Slider 
                disabled={isReadOnly}
                value={[('serviceSkills' in scores) ? scores.serviceSkills : 0]} 
                min={0} 
                max={10} 
                step={1} 
                onValueChange={(value) => handleScoreChange('serviceSkills', value)} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Book className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Knowledge (10%)</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Do they know the menu or wing it every shift? Full marks for people who know their barolo from their balsamic — and care enough to learn.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-lg font-bold">{('fohKnowledge' in scores) ? scores.fohKnowledge : 0}</span>
              </div>
              <Slider 
                disabled={isReadOnly}
                value={[('fohKnowledge' in scores) ? scores.fohKnowledge : 0]} 
                min={0} 
                max={10} 
                step={1} 
                onValueChange={(value) => handleScoreChange('fohKnowledge', value)} 
              />
            </div>
          </div>
        </>
      );
    } else {
      return (
        <>
          {/* Kitchen Criteria */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Work className="h-5 w-5 text-amber-600" />
                        <span className="font-medium">Work Ethic & Discipline (35%)</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Do they turn up on time, sharp and clean? No sulking, no slack — just consistent graft. A 10 means you wish everyone worked like them.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-lg font-bold">{('workEthic' in scores) ? scores.workEthic : 0}</span>
              </div>
              <Slider 
                disabled={isReadOnly}
                value={[('workEthic' in scores) ? scores.workEthic : 0]} 
                min={0} 
                max={10} 
                step={1} 
                onValueChange={(value) => handleScoreChange('workEthic', value)} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Handshake className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Team Player Mentality (25%)</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Do they back up others, clean down without being asked, and shout 'yes chef' without sarcasm? You know the score.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-lg font-bold">{('teamPlayer' in scores) ? scores.teamPlayer : 0}</span>
              </div>
              <Slider 
                disabled={isReadOnly}
                value={[('teamPlayer' in scores) ? scores.teamPlayer : 0]} 
                min={0} 
                max={10} 
                step={1} 
                onValueChange={(value) => handleScoreChange('teamPlayer', value)} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Brain className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Adaptability & Attitude (20%)</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>When things go sideways, do they roll with it or lose the plot? A 10 here means unflappable, fast-learning, drama-free operators.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-lg font-bold">{('adaptability' in scores) ? scores.adaptability : 0}</span>
              </div>
              <Slider 
                disabled={isReadOnly}
                value={[('adaptability' in scores) ? scores.adaptability : 0]} 
                min={0} 
                max={10} 
                step={1} 
                onValueChange={(value) => handleScoreChange('adaptability', value)} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Utensils className="h-5 w-5 text-red-600" />
                        <span className="font-medium">Knife & Cooking Skills (10%)</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Julienne like a dream? Sear without stress? A top mark reflects real, dependable kitchen chops. Basic competence starts at 5.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-lg font-bold">{('cookingSkills' in scores) ? scores.cookingSkills : 0}</span>
              </div>
              <Slider 
                disabled={isReadOnly}
                value={[('cookingSkills' in scores) ? scores.cookingSkills : 0]} 
                min={0} 
                max={10} 
                step={1} 
                onValueChange={(value) => handleScoreChange('cookingSkills', value)} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Book className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">Food Knowledge (10%)</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Do they know what they're cooking and why it matters? From allergens to artistry, a high score goes to the curious cook, not just the fast one.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-lg font-bold">{('foodKnowledge' in scores) ? scores.foodKnowledge : 0}</span>
              </div>
              <Slider 
                disabled={isReadOnly}
                value={[('foodKnowledge' in scores) ? scores.foodKnowledge : 0]} 
                min={0} 
                max={10} 
                step={1} 
                onValueChange={(value) => handleScoreChange('foodKnowledge', value)} 
              />
            </div>
          </div>
        </>
      );
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Performance Evaluation</span>
          <span className="text-3xl font-bold text-hi-purple">
            {getWeightedScoreDisplay()}
            <span className="text-sm text-gray-400">/100</span>
          </span>
        </CardTitle>
        
        {!isReadOnly && onRoleTypeChange && (
          <div className="mt-4">
            <RadioGroup 
              defaultValue={roleType} 
              onValueChange={(value) => onRoleTypeChange(value as 'foh' | 'kitchen')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="foh" id="foh" />
                <Label htmlFor="foh">Front of House</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="kitchen" id="kitchen" />
                <Label htmlFor="kitchen">Kitchen</Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {renderMatrixItems()}
        
        <div className="mt-8 space-y-4">
          <div>
            <label htmlFor="comments" className="block text-sm font-medium mb-2">
              Comments
            </label>
            <textarea
              id="comments"
              rows={4}
              className="w-full border rounded-md p-2"
              placeholder="Add any additional comments or observations..."
              value={comments}
              onChange={handleCommentsChange}
              disabled={isReadOnly}
            />
          </div>
          
          {!isReadOnly && (
            <div className="flex justify-end">
              <Button 
                onClick={handleSave} 
                className="bg-hi-purple hover:bg-hi-purple-dark"
                disabled={saving}
              >
                {saving ? 'Saving...' : existingEvaluation ? 'Update Evaluation' : 'Submit Evaluation'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default HiScoreMatrix;
