
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Star, AlertCircle, ArrowUp, ArrowDown, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type StaffRankingPanelProps = {
  location: any;
};

export default function StaffRankingPanel({ location }: StaffRankingPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('hi_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  useEffect(() => {
    if (location) {
      fetchStaffData();
    }
  }, [location]);

  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      // First get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name')
        .order('last_name');
        
      if (profilesError) throw profilesError;
      
      // Get all hi score evaluations to calculate average scores
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('hi_score_evaluations')
        .select('*');
        
      if (evaluationsError) throw evaluationsError;
      
      // Process and combine the data
      const processedStaff = profilesData?.map(profile => {
        // Changed "eval" to "evaluation" to avoid using the reserved word
        const profileEvaluations = evaluationsData?.filter(evaluation => evaluation.profile_id === profile.id) || [];
        
        // Calculate average hi score from evaluations
        let avgHiScore = 0;
        if (profileEvaluations.length > 0) {
          const sum = profileEvaluations.reduce((acc, evaluation) => {
            return acc + (evaluation.weighted_score || 0);
          }, 0);
          avgHiScore = sum / profileEvaluations.length;
        }
        
        // Calculate cost per hour with employer contributions
        const basicRate = profile.wage_rate || 0;
        const niContribution = basicRate > 175/40 ? (basicRate - 175/40) * 0.138 : 0; // Simplified NI calculation
        const pensionContribution = basicRate * 0.03; // 3% employer pension
        const totalCostPerHour = basicRate + niContribution + pensionContribution;
        
        return {
          ...profile,
          hi_score: avgHiScore,
          total_cost_per_hour: totalCostPerHour,
          evaluations_count: profileEvaluations.length
        };
      }) || [];
      
      setStaff(processedStaff);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast.error('Failed to load staff data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const sortedStaff = [...staff].sort((a, b) => {
    let compareA = a[sortBy];
    let compareB = b[sortBy];
    
    // Handle special case for names
    if (sortBy === 'name') {
      compareA = `${a.first_name} ${a.last_name}`;
      compareB = `${b.first_name} ${b.last_name}`;
    }
    
    if (sortDirection === 'asc') {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });

  const filteredStaff = sortedStaff.filter(person => {
    const matchesSearch = 
      (person.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (person.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (person.job_title?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
    const matchesAvailability = !showOnlyAvailable || person.available_for_rota;
    
    return matchesSearch && matchesAvailability;
  });

  const renderSortIcon = (column: string) => {
    if (sortBy === column) {
      return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />;
    }
    return null;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatHiScore = (score: number) => {
    if (score === 0) return 'N/A';
    return score.toFixed(1);
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'team member':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Team Ranking</CardTitle>
            <CardDescription>Staff ranked by Hi Score and other metrics</CardDescription>
          </div>
          <Button variant="outline" onClick={fetchStaffData} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              <Users className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-available"
                checked={showOnlyAvailable}
                onCheckedChange={setShowOnlyAvailable}
              />
              <Label htmlFor="show-available">Show only available staff</Label>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No staff members found</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className="w-[250px]">
                      <div 
                        className="flex items-center cursor-pointer" 
                        onClick={() => handleSort('name')}
                      >
                        Name {renderSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer" 
                        onClick={() => handleSort('hi_score')}
                      >
                        Hi Score {renderSortIcon('hi_score')}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer" 
                        onClick={() => handleSort('wage_rate')}
                      >
                        Hourly Rate {renderSortIcon('wage_rate')}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer" 
                        onClick={() => handleSort('total_cost_per_hour')}
                      >
                        Total Cost/hr {renderSortIcon('total_cost_per_hour')}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((person, idx) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar>
                            <AvatarImage src={person.avatar_url} />
                            <AvatarFallback>{getInitials(person.first_name, person.last_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{person.first_name} {person.last_name}</p>
                            <p className="text-xs text-muted-foreground">{person.job_title || 'No job title'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getRoleColor(person.role)}
                        >
                          {person.role || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center">
                                {formatHiScore(person.hi_score)}
                                {person.evaluations_count > 0 && (
                                  <Star className="ml-1 h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Based on {person.evaluations_count || 0} evaluation(s)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>£{person.wage_rate?.toFixed(2) || 0}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>£{person.total_cost_per_hour?.toFixed(2) || 0}</div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Includes employer NI and pension contributions</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {person.available_for_rota ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            Unavailable
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
