import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { History, AlertTriangle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTrackerDataByMonth } from '@/services/kitchen-service';
import ChatInterface from '@/components/performance/ChatInterface';
import KeyInsights from '@/components/performance/KeyInsights';
import AnalyticsModules from '@/components/performance/AnalyticsModules';
import { TavernLogo } from '@/components/TavernLogo';

export default function PerformanceDashboard() {
  const {
    annualRecord,
    currentYear,
    currentMonth
  } = useStore();
  const [hasFoodData, setHasFoodData] = useState(false);
  const [hasBevData, setHasBevData] = useState(false);

  // Query for food tracker data
  const {
    data: foodTrackerData
  } = useQuery({
    queryKey: ['tracker-data', currentYear, currentMonth, 'food'],
    queryFn: () => fetchTrackerDataByMonth(currentYear, currentMonth, 'food'),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Query for beverage tracker data
  const {
    data: bevTrackerData
  } = useQuery({
    queryKey: ['tracker-data', currentYear, currentMonth, 'beverage'],
    queryFn: () => fetchTrackerDataByMonth(currentYear, currentMonth, 'beverage'),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Check if we have food and beverage data
  useEffect(() => {
    // Check food data from tracker first
    if (foodTrackerData && foodTrackerData.length > 0) {
      let hasData = false;
      for (const day of foodTrackerData) {
        if (day.revenue && Number(day.revenue) > 0) {
          hasData = true;
          break;
        }
      }
      console.log("Food tracker data status:", hasData ? "Available" : "Not available or empty");
      setHasFoodData(hasData);
    }
    // If no tracker data, fall back to store data
    else if (annualRecord && annualRecord.months && annualRecord.months.length > 0) {
      let hasData = false;
      for (const month of annualRecord.months) {
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
      setHasFoodData(hasData);
    }

    // Check beverage data from tracker first
    if (bevTrackerData && bevTrackerData.length > 0) {
      let hasData = false;
      for (const day of bevTrackerData) {
        if (day.revenue && Number(day.revenue) > 0) {
          hasData = true;
          break;
        }
      }
      console.log("Beverage tracker data status:", hasData ? "Available" : "Not available or empty");
      setHasBevData(hasData);
    }
    // If no tracker data, fall back to checking bevStore
    else if (window.bevStore) {
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
          console.log("Beverage store data status:", hasData ? "Available" : "Not available or empty");
        }
      } catch (error) {
        console.error("Error checking beverage data:", error);
        setHasBevData(false);
      }
    } else {
      console.log("Beverage store not found in window object");
      setHasBevData(false);
    }
  }, [annualRecord, foodTrackerData, bevTrackerData]);

  return <div className="container max-w-7xl py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-tavern-blue/60 to-tavern-blue-dark/80 rounded-lg shadow-glass">
            <Sparkles className="h-5 w-5 text-white/90" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-tavern-blue via-tavern-blue-dark to-tavern-blue bg-clip-text text-transparent">Performance & Analysis</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="hidden sm:flex items-center gap-2 glass-button" asChild>
            <Link to="/performance/conversation-history">
              <History className="h-4 w-4 text-tavern-blue-dark" />
              <span>Chat History</span>
            </Link>
          </Button>
          <TavernLogo size="md" className="hidden md:block animate-float" />
        </div>
      </div>
      
      {!hasFoodData && !hasBevData && <Alert variant="default" className="neo-glass">
          <AlertTriangle className="h-4 w-4 text-tavern-amber" />
          <AlertTitle>Data Availability Warning</AlertTitle>
          <AlertDescription>
            No food or beverage data found for analysis. The AI assistant may have limited insights to offer.
            Please ensure you have entered data in the Food Tracker and Beverage Tracker.
          </AlertDescription>
        </Alert>}
      
      <Card className="overflow-hidden border-none shadow-glass rounded-xl bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-md">
        <ChatInterface className="w-full" />
      </Card>
      
      <KeyInsights />
      
      <AnalyticsModules />
    </div>;
}
