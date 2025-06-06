
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HiScoreHistoryProps {
  profileId: string;
  onViewEvaluation: (evaluation: any) => void;
}

export default function HiScoreHistory({ profileId, onViewEvaluation }: HiScoreHistoryProps) {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        
        // Fetch evaluations with evaluator info and all feedback fields
        const { data, error } = await supabase
          .from('hi_score_evaluations')
          .select(`
            *,
            evaluator:evaluator_id (
              first_name,
              last_name
            )
          `)
          .eq('profile_id', profileId)
          .order('evaluation_date', { ascending: false });
        
        if (error) throw error;
        
        // Process data to include evaluator name
        const processedData = data.map(evaluation => ({
          ...evaluation,
          evaluator_name: evaluation.evaluator ? 
            `${evaluation.evaluator.first_name || ''} ${evaluation.evaluator.last_name || ''}`.trim() : 
            'Unknown'
        }));
        
        console.log("Fetched evaluations:", processedData);
        setEvaluations(processedData);
      } catch (error) {
        console.error('Error fetching evaluations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (profileId) {
      fetchEvaluations();
    }
  }, [profileId]);

  // Function to export latest high score for profile badge
  const getLatestEvaluationScore = () => {
    if (evaluations.length === 0) return 0;
    return evaluations[0].weighted_score * 10;
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-hi-purple border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (evaluations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluation History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-6 text-gray-500">No evaluations have been recorded yet.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {evaluations.map((evaluation) => {
            const score = +(evaluation.weighted_score * 10).toFixed(1);
            const isHighScorer = score >= 85;
            
            return (
              <div 
                key={evaluation.id} 
                className="border border-gray-200 rounded-lg p-4 hover:border-hi-purple/30 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewEvaluation(evaluation)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium">{new Date(evaluation.evaluation_date).toLocaleDateString()}</span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="uppercase text-xs font-semibold px-2 py-0.5 rounded bg-gray-100">
                        {evaluation.role_type}
                      </span>
                      {evaluation.is_signed_off && (
                        <div className="ml-2 text-green-600 flex items-center">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Signed</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Evaluated by {evaluation.evaluator_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end">
                      {isHighScorer && (
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-500 mr-1" />
                      )}
                      <div className="text-2xl font-bold text-hi-purple">
                        {score}
                        <span className="text-sm text-gray-400">/100</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="text-xs mt-1 h-7 text-hi-purple hover:text-hi-purple-dark hover:bg-hi-purple/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewEvaluation(evaluation);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Export the score function for other components to use
export const getProfileHighScore = async (profileId: string): Promise<number> => {
  try {
    console.log(`Fetching high score for profile ${profileId}`);
    const { data, error } = await supabase
      .from('hi_score_evaluations')
      .select('weighted_score')
      .eq('profile_id', profileId)
      .order('evaluation_date', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error in getProfileHighScore:', error);
      return 0;
    }
    
    if (!data || data.length === 0) {
      console.log(`No evaluation data found for profile ${profileId}`);
      return 0;
    }
    
    const score = +(data[0].weighted_score * 10).toFixed(1);
    console.log(`Retrieved high score for profile ${profileId}: ${score}`);
    return score;
  } catch (error) {
    console.error('Exception in getProfileHighScore:', error);
    return 0;
  }
};
