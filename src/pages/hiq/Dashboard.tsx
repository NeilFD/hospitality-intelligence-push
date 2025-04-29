
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, ChevronRight, DatabaseZap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HiQDashboard: React.FC = () => {
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-purple-200 bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="border-b border-purple-100 bg-purple-50/50">
            <CardTitle className="flex items-center gap-2">
              <DatabaseZap className="h-5 w-5 text-purple-600" />
              <span className="text-purple-900">Intelligence Hub</span>
            </CardTitle>
            <CardDescription>
              Analyze your business data with AI-powered insights
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Performance Insights</p>
                  <p className="text-sm text-muted-foreground">
                    AI analysis of your business performance
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button asChild variant="outline" className="border-purple-200 hover:bg-purple-100 hover:text-purple-900">
                  <Link to="/hiq/insights">
                    View Insights
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
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="text-purple-900">AI Assistant</span>
            </CardTitle>
            <CardDescription>
              Chat with your AI assistant about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <DatabaseZap className="h-5 w-5 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Business Chat</p>
                  <p className="text-sm text-muted-foreground">
                    Ask questions about your business performance
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button asChild variant="outline" className="border-purple-200 hover:bg-purple-100 hover:text-purple-900">
                  <Link to="/hiq/assistant">
                    Open Assistant
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
