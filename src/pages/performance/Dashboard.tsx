
import { Card } from '@/components/ui/card';
import ChatInterface from '@/components/performance/ChatInterface';
import KeyInsights from '@/components/performance/KeyInsights';
import AnalyticsModules from '@/components/performance/AnalyticsModules';
import { TavernLogo } from '@/components/TavernLogo';

export default function PerformanceDashboard() {
  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-tavern-blue">Performance & Analysis</h1>
        <TavernLogo size="sm" className="hidden md:block" />
      </div>
      
      <Card className="overflow-hidden border-none shadow-lg rounded-xl bg-gradient-to-br from-white to-gray-50">
        <ChatInterface className="w-full" />
      </Card>
      
      <KeyInsights />
      
      <AnalyticsModules />
    </div>
  );
}
