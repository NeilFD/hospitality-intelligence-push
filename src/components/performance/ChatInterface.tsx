import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal, Sparkles, User, Share2, Bot as BotIcon } from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
import { fetchTrackerDataByMonth } from '@/services/kitchen-service';

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
  console.log('Raw webhook response:', response);
  
  // Check if response is an array with a single object containing a 'response' key
  if (Array.isArray(response) && response.length > 0 && response[0].response) {
    let responseText = response[0].response.trim();
    
    // Remove excess newline characters and replace multiple newlines with a single newline
    responseText = responseText
      .replace(/\n{2,}/g, '\n')  // Replace multiple consecutive newlines with a single newline
      .replace(/^\s+|\s+$/g, '')  // Trim leading and trailing whitespace
      .replace(/\n\s+/g, '\n')  // Remove indentation after newlines
      .replace(/\\n/g, '\n')  // Replace escaped newlines with actual newlines
      .replace(/\\[\[\]\(\)]/g, '')  // Remove escaped brackets/parentheses
      .replace(/\\\[|\\\]/g, '')  // Remove LaTeX-style brackets
      .replace(/\\text\{([^}]+)\}/g, '$1')  // Clean up LaTeX text commands
      .replace(/\\approx/g, '≈')  // Replace LaTeX approx with symbol
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2');  // Convert LaTeX fractions to simple notation
    
    return responseText;
  }
  
  let responseText = "";
  
  if (response?.data?.json?.body) {
    responseText = typeof response.data.json.body === 'string' 
      ? response.data.json.body
      : JSON.stringify(response.data.json.body);
  }
  else if (response?.rawResponse) {
    responseText = response.rawResponse;
  }
  else if (response?.data?.output) {
    responseText = response.data.output;
  }
  else if (Array.isArray(response?.data) && response.data.length > 0) {
    responseText = typeof response.data[0] === 'string' 
      ? response.data[0]
      : JSON.stringify(response.data[0]);
  }
  else if (response) {
    responseText = typeof response === 'string' 
      ? response 
      : JSON.stringify(response);
  }
  else {
    return "No response data received from webhook.";
  }
  
  try {
    const jsonObj = JSON.parse(responseText);
    responseText = JSON.stringify(jsonObj, null, 2);
    return responseText;
  } catch (e) {
    let formattedText = responseText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\.\s+/g, '.\n\n')
      .replace(/([.!?])\s*(?=[A-Z])/g, '$1\n\n')
      .replace(/([.!?])\n{3,}/g, '$1\n\n')
      .trim();
      
    formattedText = formattedText
      .replace(/\s+([,.!?:;])/g, '$1')
      .replace(/,{2,}/g, ',')
      .replace(/\.{2,}/g, '...')
      .replace(/\s{2,}/g, ' ');
      
    return formattedText;
  }
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

  const { data: foodTrackerData } = useQuery({
    queryKey: ['tracker-data', currentYear, currentMonth, 'food'],
    queryFn: () => fetchTrackerDataByMonth(currentYear, currentMonth, 'food'),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  const { data: bevTrackerData } = useQuery({
    queryKey: ['tracker-data', currentYear, currentMonth, 'beverage'],
    queryFn: () => fetchTrackerDataByMonth(currentYear, currentMonth, 'beverage'),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

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
    
    if (foodTrackerData && foodTrackerData.length > 0) {
      console.log("Using food tracker data for month analysis:", foodTrackerData.length, "records");
      
      const trackerRevenue = foodTrackerData.reduce((sum, day) => {
        console.log(`Day ${day.date}: Revenue = ${day.revenue || 0}`);
        return sum + (day.revenue || 0);
      }, 0);
      
      let totalCost = 0;
      
      if (annualRecord && annualRecord.months) {
        const thisMonth = annualRecord.months.find(
          m => m.year === year && m.month === month
        );
        
        if (thisMonth && thisMonth.weeks) {
          thisMonth.weeks.forEach(week => {
            if (week.days) {
              week.days.forEach(day => {
                const dayPurchases = day.purchases ? 
                  Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0) : 0;
                
                const creditNotes = day.creditNotes ? 
                  day.creditNotes.reduce((sum, credit) => sum + Number(credit), 0) : 0;
                
                totalCost += dayPurchases - creditNotes + (day.staffFoodAllowance || 0);
              });
            }
          });
        }
      }
      
      console.log("Food tracker month total revenue:", trackerRevenue);
      console.log("Food cost (from store):", totalCost);
      
      monthData.revenue = trackerRevenue;
      monthData.cost = totalCost;
      monthData.gpPercentage = calculateGP(trackerRevenue, totalCost);
      
      return monthData;
    }
    
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
    
    if (bevTrackerData && bevTrackerData.length > 0) {
      console.log("Using beverage tracker data for analysis:", bevTrackerData.length, "records");
      
      const trackerRevenue = bevTrackerData.reduce((sum, day) => {
        console.log(`Bev day ${day.date}: Revenue = ${day.revenue || 0}`);
        return sum + (day.revenue || 0);
      }, 0);
      
      let totalCost = 0;
      if (window.bevStore) {
        try {
          const bevData = window.bevStore.getState().annualRecord;
          if (bevData && bevData.months) {
            const bevMonth = bevData.months.find(
              m => m.year === year && m.month === month
            );
            
            if (bevMonth && bevMonth.weeks) {
              bevMonth.weeks.forEach(week => {
                if (week.days) {
                  week.days.forEach(day => {
                    if (day.purchases) {
                      const dayPurchases = Object.values(day.purchases).reduce(
                        (sum, amount) => sum + Number(amount), 0
                      );
                      totalCost += dayPurchases;
                    }
                  });
                }
              });
            }
          }
        } catch (error) {
          console.error("Error extracting cost data from bevStore:", error);
        }
      }
      
      console.log("Beverage tracker month total revenue:", trackerRevenue);
      console.log("Beverage cost (from store if available):", totalCost);
      
      monthData.revenue = trackerRevenue;
      monthData.cost = totalCost;
      monthData.gpPercentage = calculateGP(trackerRevenue, totalCost);
      
      annualData = { ...monthData };
      
      return { annual: annualData, monthToDate: monthData };
    }
    
    if (window.bevStore) {
      try {
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
      } catch (error) {
        console.error("Error extracting data from bevStore:", error);
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
    
    const deepCopyFoodData = annualRecord ? JSON.parse(JSON.stringify(annualRecord)) : null;
    
    if (foodTrackerData && foodTrackerData.length > 0 && deepCopyFoodData && deepCopyFoodData.months) {
      console.log("Updating deepCopyFoodData with tracker data");
      
      const currentMonthData = deepCopyFoodData.months.find(
        m => m.year === currentYear && m.month === currentMonth
      );
      
      if (currentMonthData) {
        const trackerDataByDate = {};
        foodTrackerData.forEach(day => {
          trackerDataByDate[day.date] = day;
        });
        
        if (currentMonthData.weeks) {
          currentMonthData.weeks.forEach(week => {
            if (week.days) {
              week.days.forEach(day => {
                const trackerDay = trackerDataByDate[day.date];
                if (trackerDay) {
                  day.revenue = trackerDay.revenue || 0;
                  console.log(`Updated food day ${day.date} revenue to ${day.revenue}`);
                }
              });
            }
          });
        }
      }
    }
    
    let deepCopyBevData = null;
    try {
      if (window.bevStore) {
        deepCopyBevData = JSON.parse(JSON.stringify(window.bevStore.getState().annualRecord));
        
        if (bevTrackerData && bevTrackerData.length > 0 && deepCopyBevData && deepCopyBevData.months) {
          console.log("Updating deepCopyBevData with tracker data");
          
          const currentMonthData = deepCopyBevData.months.find(
            m => m.year === currentYear && m.month === currentMonth
          );
          
          if (currentMonthData) {
            const trackerDataByDate = {};
            bevTrackerData.forEach(day => {
              trackerDataByDate[day.date] = day;
            });
            
            if (currentMonthData.weeks) {
              currentMonthData.weeks.forEach(week => {
                if (week.days) {
                  week.days.forEach(day => {
                    const trackerDay = trackerDataByDate[day.date];
                    if (trackerDay) {
                      day.revenue = trackerDay.revenue || 0;
                      console.log(`Updated beverage day ${day.date} revenue to ${day.revenue}`);
                    }
                  });
                }
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error copying beverage data:", error);
      deepCopyBevData = { error: "Failed to copy beverage data" };
    }
    
    const trackerDataSummary = {
      food: foodTrackerData || [],
      beverage: bevTrackerData || []
    };
    
    console.log("*** WEBHOOK PAYLOAD DEBUG ***");
    console.log("Food Annual Data:", foodAnnualData);
    console.log("Food Month Data:", foodMonthData);
    console.log("Beverage Data:", bevData);
    console.log("Tracker Data Summary:", trackerDataSummary);
    console.log("Raw Food Data:", deepCopyFoodData);
    console.log("Raw Beverage Data:", deepCopyBevData); 
    console.log("Wages Data:", { monthlyWages, weekdayTotals });
    console.log("*** END WEBHOOK PAYLOAD DEBUG ***");
    
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
          rawData: deepCopyFoodData,
          trackerRecords: foodTrackerData || []
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
          rawData: deepCopyBevData,
          trackerRecords: bevTrackerData || []
        },
        wages: {
          year: currentYear,
          month: currentMonth,
          daily: monthlyWages,
          weeklyAnalysis: weekdayTotals,
          allWages: monthlyWages
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
    <div className={`flex flex-col rounded-xl overflow-hidden shadow-glass ${className} animate-fade-in`}>
      <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-pastel-purple/70 to-pastel-blue/70 backdrop-blur-md border-b border-white/30">
        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm animate-float">
          <Sparkles className="text-white h-5 w-5" />
        </div>
        <h3 className="font-semibold text-tavern-blue-dark text-lg">Cleo - Performance Assistant</h3>
      </div>
      
      <ScrollArea ref={scrollAreaRef} className="flex-1 h-64 p-4 overflow-y-auto chat-container">
        <div className="space-y-5">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex gap-2 ${message.isUser ? 'justify-end' : 'justify-start'} animate-scale-in`}
              style={{animationDelay: `${index * 0.05}s`}}
            >
              {!message.isUser && 
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pastel-blue to-pastel-purple flex items-center justify-center mt-1 shadow-sm flex-shrink-0 border border-white/50">
                  <BotIcon className="h-4 w-4 text-white" />
                </div>
              }
              
              <div className="relative max-w-[80%]">
                <div 
                  className={`rounded-2xl p-4 shadow-glass ${
                    message.isUser 
                      ? 'message-bubble-user rounded-tr-sm' 
                      : 'message-bubble-ai rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  <p className="text-xs mt-2 opacity-70 font-medium">
                    {message.timestamp instanceof Date 
                      ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {!message.isUser && (
                  <div className="absolute -top-2 -right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full glass-button">
                          <Share2 className="h-3.5 w-3.5 text-tavern-blue" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="frost-panel">
                        <DropdownMenuLabel>Share via</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => shareViaWhatsApp(message.text)} className="hover:bg-pastel-blue/30">
                          WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareViaEmail(message.text)} className="hover:bg-pastel-blue/30">
                          Email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
              
              {message.isUser && 
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-tavern-blue-light to-tavern-blue flex items-center justify-center mt-1 shadow-sm flex-shrink-0 border border-white/50">
                  <User className="h-4 w-4 text-white" />
                </div>
              }
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start gap-2 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pastel-blue to-pastel-purple flex items-center justify-center mt-1 shadow-sm flex-shrink-0 border border-white/50">
                <BotIcon className="h-4 w-4 text-white" />
              </div>
              <div className="frost-panel rounded-2xl rounded-tl-sm p-4 flex gap-2 min-w-[100px]">
                <span className="w-2 h-2 bg-pastel-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-pastel-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-pastel-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/20 frost-panel flex gap-2 backdrop-blur-md">
        <Input
          placeholder="Ask about your business performance..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 glass-input text-tavern-blue shadow-inner focus:shadow-none"
        />
        <Button 
          type="submit" 
          disabled={isLoading || !input.trim()} 
          className="send-button shadow-glass text-white"
        >
          <SendHorizonal className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
