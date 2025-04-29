
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import HiScoreMatrix from './HiScoreMatrix';
import HiScoreHistory from './HiScoreHistory';
import { Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface HiScoreSectionProps {
  profileId: string;
}

export default function HiScoreSection({ profileId }: HiScoreSectionProps) {
  const { profile: currentUserProfile } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('history');
  const [roleType, setRoleType] = useState<'foh' | 'kitchen'>('foh');
  
  // Fetch the profile on mount to get the role_type
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role_type')
          .eq('id', profileId)
          .single();
        
        if (error) throw error;
        
        if (data?.role_type) {
          setRoleType(data.role_type as 'foh' | 'kitchen');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchProfile();
  }, [profileId]);
  
  // Check if the current user has manager permissions
  const hasManagerPermissions = currentUserProfile?.role && 
    ['GOD', 'Super User', 'Manager', 'Owner'].includes(currentUserProfile.role.toString());
  
  const handleCreateNew = () => {
    setSelectedEvaluation(null);
    setIsCreating(true);
    setActiveTab('create');
  };
  
  const handleViewEvaluation = (evaluation: any) => {
    setSelectedEvaluation(evaluation);
    setActiveTab('view');
  };
  
  const handleRoleTypeChange = (type: 'foh' | 'kitchen') => {
    setRoleType(type);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-hi-purple">Performance Evaluation</h2>
        
        {hasManagerPermissions && !isCreating && !selectedEvaluation && (
          <Button onClick={handleCreateNew} className="bg-hi-purple hover:bg-hi-purple-dark">
            <Plus className="h-4 w-4 mr-2" />
            New Evaluation
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {!isCreating && !selectedEvaluation && (
          <TabsList className="mb-4">
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        )}
        
        <TabsContent value="history">
          <HiScoreHistory 
            profileId={profileId} 
            onViewEvaluation={handleViewEvaluation} 
          />
        </TabsContent>
        
        <TabsContent value="view">
          {selectedEvaluation && (
            <div className="space-y-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSelectedEvaluation(null);
                  setActiveTab('history');
                }}
                className="mb-2"
              >
                &larr; Back to History
              </Button>
              
              <HiScoreMatrix 
                profileId={profileId}
                roleType={selectedEvaluation.role_type}
                existingEvaluation={selectedEvaluation}
                isReadOnly={true}
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="create">
          {isCreating && (
            <div className="space-y-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsCreating(false);
                  setActiveTab('history');
                }}
                className="mb-2"
              >
                &larr; Cancel
              </Button>
              
              <HiScoreMatrix 
                profileId={profileId}
                roleType={roleType}
                onRoleTypeChange={handleRoleTypeChange}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
