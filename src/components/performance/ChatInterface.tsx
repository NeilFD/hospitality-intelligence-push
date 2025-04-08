import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Share2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { useWagesStore } from '@/components/wages/WagesStore';
import { useAuthStore } from '@/services/auth-service';
import { formatCurrency, calculateGP } from '@/lib/date-utils';
import { sendWebhookRequest } from '@/services/conversation-service';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BevStore {
  getState: () => {
    annualRecord: {
      months: Array<{
        year: number;
        month: number;
        weeks: Array<{
          days: Array<{
            revenue?: number;
            purchases?: Record<string, number>;
          }>;
        }>;
      }>;
    };
  };
}

declare global {
  interface Window {
    bevStore?: BevStore;
  }
}

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  conversationId?: string;
}

interface ChatInterfaceProps {
  className?: string;
}

const serializeMessages = (messages: Message[]): string => {
  return JSON.stringify(messages, (key, value) => {
    if (key === 'timestamp' && value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  });
};

const deserializeMessages = (serialized: string): Message[] => {
  return JSON.parse(serialized, (key, value) => {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  });
};

const ensureDate = (dateInput: any): Date => {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  
  try {
    return new Date(dateInput);
  } catch (e) {
    return new Date();
  }
};

const extractAIResponse = (response: any): string => {
  if (response?.data?.[0]?.output) {
    return response.data[0].output;
  }
  
  if (response?.data?.output) {
    return response.data.output;
  }
  
  if (Array.isArray(response?.data) && response.data.length > 0) {
    const firstItem = response.data[0];
    if (firstItem.output) return firstItem.output;
    if (firstItem.response) return firstItem.response;
    if (firstItem.message) return firstItem.message;
  }
  
  if (response?.output) {
    return response.output;
  }
  
  if (response?.response) {
    return response.response;
  }
  
  if (response?.message) {
    return response.message;
  }
  
  if (response?.rawResponse) {
    try {
      const parsedResponse = JSON.parse(response.rawResponse);
      if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
        if (parsedResponse[0].output) return parsedResponse[0].output;
      } else if (parsedResponse.output) {
        return parsedResponse.output;
      }
    } catch (e) {
      return response.rawResponse.substring(0, 1000);
    }
  }
  
  return "I've processed your request but couldn't generate a proper response. Please try again.";
};

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const webhookUrl = "https://neilfd.app.n8n.cloud/webhook/74046e2b-f868-43ec-9343-c1e7ca6d803c";

  useEffect(() => {
    const storedMessages = localStorage.getItem('chatMessages');
    if (storedMessages) {
      try {
        const parsedMessages = deserializeMessages(storedMessages);
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error parsing stored messages:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 1 || (messages.length === 1 && messages[0].isUser)) {
      localStorage.setItem('chatMessages', serializeMessages(messages));
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const getCompleteAnnualData = () => {
    let annualData = {
      revenue: 0,
      cost: 0,
      gpPercentage: 0
    };
    
    if (annualRecord && annualRecord.months) {
      annualRecord.months.forEach(month => {
        if (month.weeks) {
          month.weeks.forEach(week => {
            if (week.days) {
              week.days.forEach(day => {
                if (day.revenue !== undefined) {
                  annualData.revenue += Number(day.revenue);
                }
                
                const dayPurchases = day.purchases ? 
                  Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0) : 0;
                annualData.cost += dayPurchases;
              });
            }
          });
        }
      });
      
      annualData.gpPercentage = calculateGP(annualData.revenue, annualData.cost);
    }
    
    return annualData;
  };

  const getCompleteMonthData = (year: number, month: number) => {
    let monthData = {
      revenue: 0,
      cost: 0,
      gpPercentage: 0
    };
    
    if (annualRecord && annualRecord.months) {
      const thisMonth = annualRecord.months.find(
        m => m.year === year && m.month === month
      );
      
      if (thisMonth && thisMonth.weeks) {
        thisMonth.weeks.forEach(week => {
          if (week.days) {
            week.days.forEach(day => {
              if (day.revenue !== undefined) {
                monthData.revenue += Number(day.revenue);
              }
              
              const dayPurchases = day.purchases ? 
                Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0) : 0;
              monthData.cost += dayPurchases;
            });
          }
        });
        
        monthData.gpPercentage = calculateGP(monthData.revenue, monthData.cost);
      }
    }
    
    return monthData;
  };

  const getCompleteBevData = (year: number, month: number) => {
    let annualData = {
      revenue: 0,
      cost: 0,
      gpPercentage: 0
    };
    
    let monthData = {
      revenue: 0,
      cost: 0,
      gpPercentage: 0
    };
    
    if (window.bevStore) {
      const bevData = window.bevStore.getState().annualRecord;
      
      if (bevData && bevData.months) {
        bevData.months.forEach(m => {
          if (m.weeks) {
            m.weeks.forEach(week => {
              if (week.days) {
                week.days.forEach(day => {
                  if (day.revenue !== undefined) {
                    annualData.revenue += Number(day.revenue);
                  }
                  
                  if (day.purchases) {
                    const dayPurchases = Object.values(day.purchases).reduce(
                      (sum, amount) => sum + Number(amount), 0
                    );
                    annualData.cost += dayPurchases;
                  }
                });
              }
            });
          }
        });
        
        annualData.gpPercentage = calculateGP(annualData.revenue, annualData.cost);
        
        const bevMonth = bevData.months.find(
          m => m.year === year && m.month === month
        );
        
        if (bevMonth && bevMonth.weeks) {
          bevMonth.weeks.forEach(week => {
            if (week.days) {
              week.days.forEach(day => {
                if (day.revenue !== undefined) {
                  monthData.revenue += Number(day.revenue);
                }
                
                if (day.purchases) {
                  const dayPurchases = Object.values(day.purchases).reduce(
                    (sum, amount) => sum + Number(amount), 0
                  );
                  monthData.cost += dayPurchases;
                }
              });
            }
          });
          
          monthData.gpPercentage = calculateGP(monthData.revenue, monthData.cost);
        }
      }
    } else {
      console.warn("Beverage store not found in window object");
    }
    
    return { annual: annualData, monthToDate: monthData };
  };

  const preparePayload = async () => {
    let monthlyWages = [];
    let weekdayTotals = {};
    
    try {
      monthlyWages = await getMonthlyWages(currentYear, currentMonth);
      weekdayTotals = await getWeekdayTotals(currentYear, currentMonth);
    } catch (error) {
      console.error("Error fetching wages data:", error);
    }
    
    const foodAnnualData = getCompleteAnnualData();
    const foodMonthData = getCompleteMonthData(currentYear, currentMonth);
    
    const bevData = getCompleteBevData(currentYear, currentMonth);
    
    console.log("Food Annual Data:", foodAnnualData);
    console.log("Food Month Data:", foodMonthData);
    console.log("Beverage Data:", bevData);
    console.log("Wages Data:", { monthlyWages, weekdayTotals });
    
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
            revenue: foodMonthData.revenue,
            purchases: foodMonthData.cost,
            gpPercentage: foodMonthData.gpPercentage,
            costPercentage: 100 - foodMonthData.gpPercentage
          },
          annual: {
            revenue: foodAnnualData.revenue,
            purchases: foodAnnualData.cost,
            gpPercentage: foodAnnualData.gpPercentage,
            costPercentage: 100 - foodAnnualData.gpPercentage
          },
          rawData: annualRecord
        },
        beverage: {
          year: currentYear,
          month: currentMonth,
          monthToDate: {
            revenue: bevData.monthToDate.revenue,
            purchases: bevData.monthToDate.cost,
            gpPercentage: bevData.monthToDate.gpPercentage,
            costPercentage: 100 - bevData.monthToDate.gpPercentage
          },
          annual: {
            revenue: bevData.annual.revenue,
            purchases: bevData.annual.cost,
            gpPercentage: bevData.annual.gpPercentage,
            costPercentage: 100 - bevData.annual.gpPercentage
          },
          rawData: window.bevStore ? window.bevStore.getState().annualRecord : null
        },
        wages: {
          year: currentYear,
          month: currentMonth,
          daily: monthlyWages,
          weeklyAnalysis: weekdayTotals,
          allWages: await getMonthlyWages(currentYear, currentMonth)
        }
      },
      conversationHistory: messages.map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text,
        timestamp: ensureDate(msg.timestamp).toISOString(),
        conversationId: msg.conversationId
      }))
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = {
      text: input,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const payload = await preparePayload();
      console.log('Sending request with payload:', payload);
      
      const response = await sendWebhookRequest(webhookUrl, payload);
      console.log('Got response:', response);
      
      const conversationId = response.conversationId || null;
      
      let aiResponseText = extractAIResponse(response);
      console.log('Extracted AI response:', aiResponseText);
      
      if (!aiResponseText || aiResponseText === "undefined" || aiResponseText === "[object Object]") {
        console.error("Failed to extract valid response text from webhook response");
        aiResponseText = "I'm having trouble processing your request right now. Please try again later.";
      }
      
      const newMessage = {
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
        conversationId: conversationId
      };
      
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error querying the AI:', error);
      
      setMessages(prev => [...prev, {
        text: "I'm having trouble connecting to my analysis engine right now. Please try again later.",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const shareViaEmail = (message: string) => {
    const subject = encodeURIComponent("Insights from Cleo - Tavern Kitchen Assistant");
    const body = encodeURIComponent(message);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    toast.success("Email client opened");
  };
  
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
      
      <ScrollArea ref={scrollAreaRef} className="flex-1 h-64 p-4 overflow-y-auto bg-white/80 backdrop-blur-sm">
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
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp instanceof Date 
                      ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
