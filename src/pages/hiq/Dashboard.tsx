
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, ChevronRight, Brain, MessageSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useSetCurrentModule } from '@/lib/store';

const HiQDashboard: React.FC = () => {
  const setCurrentModule = useSetCurrentModule();
  
  // Force set current module to 'hiq' when component mounts
  useEffect(() => {
    console.log('HiQDashboard: Setting current module to hiq');
    setCurrentModule('hiq');
    
    // Also update localStorage directly
    try {
      // Update tavern-kitchen-ledger store
      const storeData = localStorage.getItem('tavern-kitchen-ledger');
      if (storeData) {
        const parsedData = JSON.parse(storeData);
        if (parsedData.state) {
          parsedData.state.currentModule = 'hiq';
          localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
        }
      }
      
      // Update hospitality-intelligence store
      const hiData = localStorage.getItem('hospitality-intelligence');
      if (hiData) {
        const parsedData = JSON.parse(hiData);
        if (parsedData.state) {
          parsedData.state.currentModule = 'hiq';
          localStorage.setItem('hospitality-intelligence', JSON.stringify(parsedData));
        }
      }
    } catch (e) {
      console.error('HiQDashboard: Error updating localStorage:', e);
    }
    
    // Add a class to help with debugging
    document.body.classList.add('hiq-dashboard-page');
    
    return () => {
      document.body.classList.remove('hiq-dashboard-page');
    };
  }, [setCurrentModule]);

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            <span className="bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">
              HiQ Dashboard
            </span>
          </h2>
          <p className="text-muted-foreground">
            Business intelligence and AI-powered insights for your hospitality operation.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-purple-200 bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="border-b border-purple-100 bg-purple-50/50">
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-purple-600" />
              <span className="text-purple-900">Performance & Analysis</span>
            </CardTitle>
            <CardDescription>
              Deep dive into your business performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <BarChart className="h-5 w-5 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Data Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    Advanced analytics and AI-powered insights
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button asChild variant="outline" className="border-purple-200 hover:bg-purple-100 hover:text-purple-900">
                  <Link to="/hiq/performance">
                    View Analytics
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-purple-200 bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="border-b border-purple-100 bg-purple-50/50">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <span className="text-purple-900">Chat Assistant</span>
            </CardTitle>
            <CardDescription>
              AI-powered chat assistant for your business queries
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">AI Chat</p>
                  <p className="text-sm text-muted-foreground">
                    Get answers to your business questions
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button asChild variant="outline" className="border-purple-200 hover:bg-purple-100 hover:text-purple-900">
                  <Link to="/hiq/chat">
                    Open Chat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-blue-200 bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="border-b border-blue-100 bg-blue-50/50">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-blue-900">Staff Rotas</span>
            </CardTitle>
            <CardDescription>
              Intelligent staff scheduling and management
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Rota Manager</p>
                  <p className="text-sm text-muted-foreground">
                    Configure and optimize staff schedules 
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button asChild variant="outline" className="border-blue-200 hover:bg-blue-100 hover:text-blue-900">
                  <Link to="/hiq/rotas">
                    Manage Rotas
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HiQDashboard;
