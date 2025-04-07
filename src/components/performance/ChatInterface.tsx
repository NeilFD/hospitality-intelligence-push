
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello, I'm Cleo! Ask me anything about your business performance and I'll analyze the data for you.",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {
      text: input,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // TODO: This is a placeholder for the webhook integration
    // We'll work on designing the actual payload format
    try {
      const response = await fetch('https://neilfd.app.n8n.cloud/webhook/8ba16b2c-84dc-4a7c-b1cd-7c018d4042ee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          timestamp: new Date().toISOString(),
          // We'll design this payload structure together
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get a response');
      }
      
      const data = await response.json();
      
      // Add AI response
      setMessages(prev => [...prev, {
        text: data.response || "I'm processing your request. I'll have an answer shortly.",
        isUser: false,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error querying the AI:', error);
      setMessages(prev => [...prev, {
        text: "I'm sorry, I encountered an issue while processing your request. Please try again later.",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col rounded-xl border border-tavern-blue-light/20 overflow-hidden bg-white ${className}`}>
      <div className="flex items-center gap-2 p-3 bg-tavern-blue-light/10 border-b border-tavern-blue-light/20">
        <Bot className="text-tavern-blue" />
        <h3 className="font-semibold text-tavern-blue-dark">Cleo - Performance Assistant</h3>
      </div>
      
      <ScrollArea className="flex-1 h-64 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex gap-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!message.isUser && <Bot className="h-6 w-6 mt-1 text-tavern-blue flex-shrink-0" />}
              
              <div 
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.isUser 
                    ? 'bg-tavern-blue text-white' 
                    : 'bg-gray-100 text-tavern-blue-dark'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              {message.isUser && <User className="h-6 w-6 mt-1 text-tavern-blue flex-shrink-0" />}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start gap-2">
              <Bot className="h-6 w-6 mt-1 text-tavern-blue flex-shrink-0" />
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-tavern-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-tavern-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-tavern-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="p-3 border-t border-tavern-blue-light/20 flex gap-2">
        <Input
          placeholder="Ask about your business performance..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={isLoading || !input.trim()} 
          className="bg-tavern-blue hover:bg-tavern-blue-dark"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
