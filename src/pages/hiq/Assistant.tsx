
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

const HiQAssistant: React.FC = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Brain className="h-8 w-8 text-purple-500" />
        <span className="bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">
          HiQ Assistant
        </span>
      </h1>
      
      <Card className="mb-6 h-[60vh] flex flex-col">
        <CardHeader>
          <CardTitle>Chat with your AI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto p-4 flex flex-col">
          <div className="flex-grow">
            <div className="bg-purple-100 p-4 rounded-lg mb-4 max-w-[80%]">
              <p className="text-purple-800">
                Hello! I'm your HiQ Assistant. This feature is coming soon, but when it's ready, 
                I'll be able to answer questions about your business performance and provide insights.
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4 flex gap-4">
            <Textarea 
              placeholder="Type your message here..." 
              className="flex-grow resize-none" 
              disabled
            />
            <Button className="bg-purple-600 hover:bg-purple-700" disabled>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HiQAssistant;
