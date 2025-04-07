
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/performance/ChatInterface';
import KeyInsights from '@/components/performance/KeyInsights';
import AnalyticsModules from '@/components/performance/AnalyticsModules';
import { TavernLogo } from '@/components/TavernLogo';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';

export default function PerformanceDashboard() {
  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-tavern-blue">Performance & Analysis</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="hidden sm:flex items-center gap-2" asChild>
            <Link to="/performance/conversation-history">
              <History className="h-4 w-4" />
              <span>Chat History</span>
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
    </div>
  );
}
