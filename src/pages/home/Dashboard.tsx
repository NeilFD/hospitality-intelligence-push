
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMasterDailyRecord } from '@/services/master-record-service';
import { useAuthStore } from '@/services/auth-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleIcon } from '@/components/ModuleIcons';
import { toast } from 'sonner';
import { 
  CalendarDays, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Clipboard, 
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import TeamNoticeboard from '@/pages/team/components/TeamNoticeboard';
import TeamChat from '@/pages/team/components/TeamChat';
import { getHasAccessToModule } from '@/services/permissions-service';
import { ModuleType } from '@/types/kitchen-ledger';

const HomeDashboard: React.FC = () => {
  const [yesterdayData, setYesterdayData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableModules, setAvailableModules] = useState<{type: ModuleType, name: string}[]>([]);
  const { profile } = useAuthStore();
  
  // Get yesterday's date in YYYY-MM-DD format
  const yesterday = subDays(new Date(), 1);
  const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');
  
  useEffect(() => {
    const fetchYesterdayData = async () => {
      try {
        setLoading(true);
        const data = await fetchMasterDailyRecord(yesterdayFormatted);
        setYesterdayData(data);
      } catch (err) {
        console.error('Error fetching yesterday data:', err);
        setError('Failed to load yesterday\'s trading data');
        toast.error('Failed to load yesterday\'s trading data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchYesterdayData();
  }, [yesterdayFormatted]);
  
  useEffect(() => {
    const checkModuleAccess = async () => {
      if (!profile) return;
      
      const moduleTypes: ModuleType[] = ['food', 'beverage', 'pl', 'wages', 'performance', 'team', 'master'];
      const moduleNames = {
        food: 'Food Hub',
        beverage: 'Beverage Hub',
        pl: 'P&L',
        wages: 'Wages',
        performance: 'Performance',
        team: 'Team',
        master: 'Master Records'
      };
      
      const accessible = [];
      
      for (const type of moduleTypes) {
        const hasAccess = await getHasAccessToModule(profile.role || 'Team Member', type);
        if (hasAccess) {
          accessible.push({
            type,
            name: moduleNames[type]
          });
        }
      }
      
      setAvailableModules(accessible);
    };
    
    checkModuleAccess();
  }, [profile]);

  return (
    <div className="container mx-auto p-4">
      {/* Welcome Header Section */}
      <div className="bg-gradient-to-r from-hi-purple-light/20 to-hi-purple/10 rounded-lg p-6 mb-6 shadow-md border border-hi-purple/20">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-hi-purple">
            Welcome, {profile?.first_name || 'Team Member'}
          </h1>
          <div className="bg-white rounded-lg px-3 py-1 text-sm text-gray-600 shadow">
            <CalendarDays className="inline-block mr-1 h-4 w-4 text-hi-purple" />
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Your daily hospitality intelligence hub
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yesterday's Trading Data */}
        <div className="lg:col-span-2">
          <Card className="shadow-md rounded-lg overflow-hidden bg-white border border-gray-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Yesterday's Performance
                </CardTitle>
                <Badge variant="outline" className="bg-white">
                  {yesterday && format(yesterday, 'EEEE, MMM d')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-hi-purple-light border-t-hi-purple rounded-full"></div>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-500">{error}</p>
                </div>
              ) : !yesterdayData ? (
                <div className="p-6 text-center">
                  <Info className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-gray-600">No data available for yesterday</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <div className="grid grid-cols-3 gap-2 p-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-xl font-bold text-blue-700">£{yesterdayData.totalRevenue?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">Food Revenue</p>
                      <p className="text-xl font-bold text-green-700">£{yesterdayData.foodRevenue?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">Beverage Revenue</p>
                      <p className="text-xl font-bold text-purple-700">£{yesterdayData.beverageRevenue?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 p-4">
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">Total Covers</p>
                      <p className="text-xl font-bold text-amber-700">{yesterdayData.totalCovers || '0'}</p>
                    </div>
                    <div className="bg-amber-50/50 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">Lunch Covers</p>
                      <p className="text-xl font-bold text-amber-600">{yesterdayData.lunchCovers || '0'}</p>
                    </div>
                    <div className="bg-amber-50/50 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">Dinner Covers</p>
                      <p className="text-xl font-bold text-amber-600">{yesterdayData.dinnerCovers || '0'}</p>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Operational Notes</h3>
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Local Events:</p>
                      <p className="text-gray-600">{yesterdayData.localEvents || 'No events recorded'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Operations Notes:</p>
                      <p className="text-gray-600">{yesterdayData.operationsNotes || 'No notes recorded'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Pinned Noticeboard */}
        <div className="lg:col-span-1">
          <Card className="shadow-md rounded-lg overflow-hidden h-full border border-gray-100">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 pb-3">
              <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                <Clipboard className="h-5 w-5 mr-2 text-amber-600" />
                Pinned Notices
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[calc(100%-4rem)] overflow-y-auto">
              <div className="p-3">
                <TeamNoticeboard pinnedOnly={true} compact={true} />
              </div>
              <div className="px-4 py-3 bg-amber-50/50 border-t border-amber-100/50 text-center">
                <Button asChild variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-100">
                  <Link to="/team/noticeboard">
                    View Full Noticeboard <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Team Chat */}
        <div className="lg:col-span-2">
          <Card className="shadow-md rounded-lg overflow-hidden border border-gray-100">
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 pb-3">
              <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                Team Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[400px]">
              <TeamChat roomSlug="general" compact={true} />
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Navigation */}
        <div className="lg:col-span-1">
          <Card className="shadow-md rounded-lg overflow-hidden border border-gray-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 pb-3">
              <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Quick Navigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {availableModules.map((module) => (
                  <Button
                    key={module.type}
                    asChild
                    variant="outline"
                    className="flex flex-col items-center justify-center h-20 bg-white hover:bg-gray-50 p-1 gap-1 border-gray-200"
                  >
                    <Link to={`/${module.type}/dashboard`}>
                      <div className="bg-purple-100 rounded-full p-2">
                        <ModuleIcon type={module.type} className="h-5 w-5 text-purple-700" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 mt-1">{module.name}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
