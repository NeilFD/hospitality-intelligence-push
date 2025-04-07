
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Share2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { useWagesStore } from '@/components/wages/WagesStore';
import { useAuthStore } from '@/services/auth-service';
import { formatCurrency, calculateGP } from '@/lib/date-utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const { annualRecord, currentYear, currentMonth } = useStore();
  const { getMonthlyWages, getWeekdayTotals } = useWagesStore();
  const { user } = useAuthStore();
  const location = useLocation();

  // Function to get annual summary data
  const getAnnualSummaryData = () => {
    let revenue = 0;
    let cost = 0;
    
    if (annualRecord && annualRecord.months) {
      annualRecord.months.forEach(month => {
        if (month.weeks) {
          month.weeks.forEach(week => {
            if (week.days) {
              week.days.forEach(day => {
                if (day.revenue) {
                  revenue += day.revenue;
                }
                const dayPurchases = day.purchases ? 
                  Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0) : 0;
                cost += dayPurchases;
              });
            }
          });
        }
      });
    }
    
    return {
      totalRevenue: revenue,
      totalCost: cost,
      gpPercentage: calculateGP(revenue, cost)
    };
  };

  // Function to prepare the full payload
  const preparePayload = async () => {
    // Get the current month wages data
    let monthlyWages = [];
    let weekdayTotals = {};
    
    try {
      monthlyWages = await getMonthlyWages(currentYear, currentMonth);
      weekdayTotals = await getWeekdayTotals(currentYear, currentMonth);
    } catch (error) {
      console.error("Error fetching wages data:", error);
    }
    
    // Get annual data
    const annualData = getAnnualSummaryData();
    
    // Get current month data
    const currentMonthData = {
      revenue: 0,
      cost: 0,
      gpPercentage: 0
    };
    
    if (annualRecord && annualRecord.months) {
      const thisMonth = annualRecord.months.find(
        m => m.year === currentYear && m.month === currentMonth
      );
      
      if (thisMonth && thisMonth.weeks) {
        thisMonth.weeks.forEach(week => {
          if (week.days) {
            week.days.forEach(day => {
              if (day.revenue) {
                currentMonthData.revenue += day.revenue;
              }
              
              const dayPurchases = day.purchases ? 
                Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0) : 0;
              currentMonthData.cost += dayPurchases;
            });
          }
        });
        
        currentMonthData.gpPercentage = calculateGP(
          currentMonthData.revenue, 
          currentMonthData.cost
        );
      }
    }
    
    return {
      query: input,
      timestamp: new Date().toISOString(),
      userData: {
        userRole: user?.email || "Guest",
        currentRoute: location.pathname
      },
      trackerData: {
        food: {
          year: currentYear,
          month: currentMonth,
          monthToDate: {
            revenue: currentMonthData.revenue,
            purchases: currentMonthData.cost,
            gpPercentage: currentMonthData.gpPercentage,
            costPercentage: 100 - currentMonthData.gpPercentage
          },
          annual: {
            revenue: annualData.totalRevenue,
            purchases: annualData.totalCost,
            gpPercentage: annualData.gpPercentage,
            costPercentage: 100 - annualData.gpPercentage
          }
        },
        wages: {
          year: currentYear,
          month: currentMonth,
          daily: monthlyWages,
          weeklyAnalysis: weekdayTotals
        }
      },
      conversationHistory: messages.map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text,
        timestamp: msg.timestamp.toISOString()
      }))
    };
  };

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
    
    try {
      // Prepare the full payload with all tracker data
      const payload = await preparePayload();
      
      // Send to webhook
      const response = await fetch('https://neilfd.app.n8n.cloud/webhook/8ba16b2c-84dc-4a7c-b1cd-7c018d4042ee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get a response');
      }
      
      const data = await response.json();
      
      // Add AI response
      const aiResponse = data.response || "I'm processing your request. I'll have an answer shortly.";
      
      const newMessage = {
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Store conversation in Supabase if user is logged in
      if (user) {
        await supabase.from('ai_conversations').insert({
          user_id: user.id,
          query: input,
          response: aiResponse,
          payload: payload,
          timestamp: new Date().toISOString()
        });
      }
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

  // Function to share message via email
  const shareViaEmail = (message: string) => {
    const subject = encodeURIComponent("Insights from Cleo - Tavern Kitchen Assistant");
    const body = encodeURIComponent(message);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    toast.success("Email client opened");
  };
  
  // Function to share message via WhatsApp
  const shareViaWhatsApp = (message: string) => {
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${text}`);
    toast.success("WhatsApp sharing initiated");
  };

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden shadow-inner ${className}`}>
      <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-tavern-blue to-tavern-blue-dark">
        <Bot className="text-white" />
        <h3 className="font-semibold text-white">Cleo - Performance Assistant</h3>
      </div>
      
      <ScrollArea className="flex-1 h-64 p-4 overflow-y-auto bg-white/80 backdrop-blur-sm">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex gap-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!message.isUser && <Bot className="h-6 w-6 mt-1 text-tavern-blue flex-shrink-0" />}
              
              <div className="relative">
                <div 
                  className={`rounded-lg p-3 max-w-[80%] shadow-sm ${
                    message.isUser 
                      ? 'bg-gradient-to-r from-tavern-blue to-tavern-blue-dark text-white' 
                      : 'bg-gradient-to-r from-gray-50 to-white border border-gray-100 text-tavern-blue-dark'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {!message.isUser && (
                  <div className="absolute -top-2 -right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-white shadow-sm hover:bg-gray-100">
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Share via</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => shareViaWhatsApp(message.text)}>
                          WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareViaEmail(message.text)}>
                          Email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
              
              {message.isUser && <User className="h-6 w-6 mt-1 text-tavern-blue flex-shrink-0" />}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start gap-2">
              <Bot className="h-6 w-6 mt-1 text-tavern-blue flex-shrink-0" />
              <div className="bg-gray-50 rounded-lg p-3 shadow-sm border border-gray-100">
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
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white flex gap-2">
        <Input
          placeholder="Ask about your business performance..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-gray-50 border-gray-200 focus:border-tavern-blue focus:ring-tavern-blue"
        />
        <Button 
          type="submit" 
          disabled={isLoading || !input.trim()} 
          className="bg-tavern-blue hover:bg-tavern-blue-dark shadow-sm"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
