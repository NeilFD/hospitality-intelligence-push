
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';

const HiQInsights: React.FC = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Brain className="h-8 w-8 text-purple-500" />
        <span className="bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">
          HiQ Insights
        </span>
      </h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Business Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This feature is coming soon. HiQ will provide AI-powered insights into your business performance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HiQInsights;
