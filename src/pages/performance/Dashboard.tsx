import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/performance/ChatInterface';
import KeyInsights from '@/components/performance/KeyInsights';
import AnalyticsModules from '@/components/performance/AnalyticsModules';
import { TavernLogo } from '@/components/TavernLogo';
import { Link } from 'react-router-dom';
import { History, Bug, AlertTriangle, InfoIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';
export default function PerformanceDashboard() {
  const {
    annualRecord
  } = useStore();
  const [hasFoodData, setHasFoodData] = useState(false);
  const [hasBevData, setHasBevData] = useState(false);

  // Check if we have food and beverage data
  useEffect(() => {
    // Check food data
    if (annualRecord && annualRecord.months && annualRecord.months.length > 0) {
      let hasData = false;
      for (const month of annualRecord.months) {
        if (month.weeks) {
          for (const week of month.weeks) {
            if (week.days) {
              for (const day of week.days) {
                if (day.revenue > 0) {
                  hasData = true;
                  break;
                }
              }
              if (hasData) break;
            }
          }
          if (hasData) break;
        }
      }
      setHasFoodData(hasData);
    }

    // Check beverage data
    if (window.bevStore) {
      try {
        const bevData = window.bevStore.getState().annualRecord;
        if (bevData && bevData.months && bevData.months.length > 0) {
          let hasData = false;
          for (const month of bevData.months) {
            if (month.weeks) {
              for (const week of month.weeks) {
                if (week.days) {
                  for (const day of week.days) {
                    if (day.revenue && Number(day.revenue) > 0) {
                      hasData = true;
                      break;
                    }
                  }
                  if (hasData) break;
                }
              }
              if (hasData) break;
            }
          }
          setHasBevData(hasData);
        }
      } catch (error) {
        console.error("Error checking beverage data:", error);
        setHasBevData(false);
      }
    }
  }, [annualRecord]);
  return <div className="container max-w-7xl py-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-tavern-blue">Performance & Analysis</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="hidden sm:flex items-center gap-2" asChild>
            <Link to="/performance/conversation-history">
              <History className="h-4 w-4" />
              <span>Chat History</span>
            </Link>
          </Button>
          <Button variant="outline" className="hidden sm:flex items-center gap-2" asChild>
            <Link to="/performance/debug">
              <Bug className="h-4 w-4" />
              <span>Debug</span>
            </Link>
          </Button>
          <TavernLogo size="md" className="hidden md:block" />
        </div>
      </div>
      
      
      
      <Card className="overflow-hidden border-none shadow-lg rounded-xl bg-gradient-to-br from-white to-gray-50">
        <ChatInterface className="w-full" />
      </Card>
      
      <KeyInsights />
      
      <AnalyticsModules />
    </div>;
}