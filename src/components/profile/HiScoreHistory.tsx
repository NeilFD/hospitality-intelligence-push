
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { CheckCircle } from 'lucide-react';
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
        
        // Fetch evaluations with evaluator info
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
          {evaluations.map((evaluation) => (
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
                  <div className="text-2xl font-bold text-hi-purple">
                    {(evaluation.weighted_score * 10).toFixed(1)}
                    <span className="text-sm text-gray-400">/100</span>
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
