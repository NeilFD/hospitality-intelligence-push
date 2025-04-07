
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChatInterface from '@/components/performance/ChatInterface';
import KeyInsights from '@/components/performance/KeyInsights';
import AnalyticsModules from '@/components/performance/AnalyticsModules';

export default function PerformanceDashboard() {
  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-3xl font-bold text-tavern-blue mb-6 text-center">Performance & Analysis Dashboard</h1>
      
      <ChatInterface className="w-full" />
      
      <div className="space-y-8">
        <KeyInsights />
        
        <AnalyticsModules />
      </div>
    </div>
  );
}
