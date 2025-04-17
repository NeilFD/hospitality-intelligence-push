
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
  Info,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import TeamNoticeboardCompact from '@/pages/team/components/TeamNoticeboardCompact';
import TeamChat from '@/pages/team/components/TeamChat';
import { getHasAccessToModule } from '@/services/permissions-service';
import { ModuleType } from '@/types/kitchen-ledger';
import { formatCurrency } from '@/lib/utils';

const HomeDashboard: React.FC = () => {
  const [yesterdayData, setYesterdayData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableModules, setAvailableModules] = useState<{type: ModuleType, name: string}[]>([]);
  const { profile } = useAuthStore();
  
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

      {/* Noticeboard Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-medium text-amber-800 flex items-center">
            <Clipboard className="h-4 w-4 mr-2" /> Pinned Notices
          </h2>
          <Button asChild variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-100">
            <Link to="/team/noticeboard">
              View Full Noticeboard <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="w-full overflow-x-auto pb-2">
          <TeamNoticeboardCompact pinnedOnly={true} compact={true} />
        </div>
      </div>
      
      {/* Yesterday's Performance - Now Full Width */}
      <Card className="shadow-md rounded-lg overflow-hidden bg-white border border-gray-100 mb-6">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(yesterdayData.totalRevenue)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Food Revenue</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(yesterdayData.foodRevenue)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Beverage Revenue</p>
                  <p className="text-xl font-bold text-purple-700">{formatCurrency(yesterdayData.beverageRevenue)}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Total Covers</p>
                  <p className="text-xl font-bold text-amber-700">{yesterdayData.totalCovers || '0'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                <div className="bg-amber-50/50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Lunch Covers</p>
                  <p className="text-xl font-bold text-amber-600">{yesterdayData.lunchCovers || '0'}</p>
                </div>
                <div className="bg-amber-50/50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Dinner Covers</p>
                  <p className="text-xl font-bold text-amber-600">{yesterdayData.dinnerCovers || '0'}</p>
                </div>
                <div className="bg-blue-50/50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Average Spend</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(yesterdayData.averageCoverSpend)}</p>
                  <p className="text-xs text-gray-500">Per cover</p>
                </div>
                <div className="bg-green-50/50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Food/Bev Ratio</p>
                  <p className="text-xl font-bold text-green-700">
                    {yesterdayData.totalRevenue ? 
                      `${Math.round((yesterdayData.foodRevenue / yesterdayData.totalRevenue) * 100)}/${Math.round((yesterdayData.beverageRevenue / yesterdayData.totalRevenue) * 100)}` : 
                      '0/0'}
                  </p>
                  <p className="text-xs text-gray-500">Food/Beverage %</p>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Operational Notes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Local Events:</p>
                    <p className="text-gray-600">{yesterdayData.localEvents || 'No events recorded'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Operations Notes:</p>
                    <p className="text-gray-600">{yesterdayData.operationsNotes || 'No notes recorded'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Chat - Left Column */}
        <div className="lg:col-span-2">
          <Card className="shadow-md rounded-lg overflow-hidden border border-gray-100">
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 pb-3">
              <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                Team Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[400px]">
              <TeamChat initialRoomId="general" compact={true} />
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Navigation Section - Right Column */}
        <div className="lg:col-span-1">
          <Card className="shadow-md rounded-lg overflow-hidden h-full border border-gray-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 pb-3">
              <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Quick Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {availableModules.map((module) => {
                  // Custom styling based on module type
                  let bgGradient, iconBg, hoverBg, borderColor, shadowColor;
                  
                  switch(module.type) {
                    case 'food':
                      bgGradient = "from-emerald-50 to-green-50";
                      iconBg = "bg-emerald-100";
                      hoverBg = "group-hover:bg-emerald-200";
                      borderColor = "border-emerald-200";
                      shadowColor = "shadow-emerald-200/40";
                      break;
                    case 'beverage':
                      bgGradient = "from-purple-50 to-indigo-50";
                      iconBg = "bg-purple-100";
                      hoverBg = "group-hover:bg-purple-200";
                      borderColor = "border-purple-200";
                      shadowColor = "shadow-purple-200/40";
                      break;
                    case 'pl':
                      bgGradient = "from-amber-50 to-yellow-50";
                      iconBg = "bg-amber-100";
                      hoverBg = "group-hover:bg-amber-200";
                      borderColor = "border-amber-200";
                      shadowColor = "shadow-amber-200/40";
                      break;
                    case 'wages':
                      bgGradient = "from-blue-50 to-sky-50";
                      iconBg = "bg-blue-100";
                      hoverBg = "group-hover:bg-blue-200";
                      borderColor = "border-blue-200";
                      shadowColor = "shadow-blue-200/40";
                      break;
                    case 'performance':
                      bgGradient = "from-rose-50 to-red-50";
                      iconBg = "bg-rose-100";
                      hoverBg = "group-hover:bg-rose-200";
                      borderColor = "border-rose-200";
                      shadowColor = "shadow-rose-200/40";
                      break;
                    case 'team':
                      bgGradient = "from-teal-50 to-cyan-50";
                      iconBg = "bg-teal-100";
                      hoverBg = "group-hover:bg-teal-200";
                      borderColor = "border-teal-200";
                      shadowColor = "shadow-teal-200/40";
                      break;
                    default:
                      bgGradient = "from-gray-50 to-slate-50";
                      iconBg = "bg-gray-100";
                      hoverBg = "group-hover:bg-gray-200";
                      borderColor = "border-gray-200";
                      shadowColor = "shadow-gray-200/40";
                  }
                  
                  return (
                    <Link
                      key={module.type}
                      to={`/${module.type}/dashboard`}
                      className={`bg-gradient-to-br ${bgGradient} rounded-xl border ${borderColor} p-3 flex flex-col items-center justify-center h-28 shadow-sm ${shadowColor} transition-all duration-300 hover:shadow-md hover:-translate-y-1 group overflow-hidden relative`}
                    >
                      {/* Background animated accent */}
                      <div className="absolute -right-8 -top-8 w-16 h-16 rounded-full bg-white/30 opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
                      
                      <div className={`${iconBg} ${hoverBg} rounded-full p-3 mb-2 transition-colors duration-300 relative z-10`}>
                        <ModuleIcon type={module.type} className="h-5 w-5 text-gray-700" />
                      </div>
                      
                      <span className="font-medium text-gray-800 relative z-10 text-center leading-tight">
                        {module.name}
                      </span>
                      
                      {/* Hover indicator */}
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
