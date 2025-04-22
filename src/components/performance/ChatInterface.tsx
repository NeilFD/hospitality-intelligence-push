import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal, Sparkles, Bot as BotIcon, UserRound } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { useWagesStore } from '@/components/wages/WagesStore';
import { useAuthStore } from '@/services/auth-service';
import { formatCurrency, calculateGP } from '@/lib/date-utils';
import { sendWebhookRequest } from '@/services/conversation-service';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { fetchTrackerDataByMonth, syncTrackerPurchasesToPurchases, syncTrackerCreditNotesToCreditNotes, fetchTrackerPurchases, fetchPurchases, fetchDailyRecords } from '@/services/kitchen-service';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ExtendedDailyRecord {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  revenue?: number;
  purchases?: Record<string, number>; // supplierId -> amount
  creditNotes?: number[];
  staffFoodAllowance?: number;
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
      return {
        __type: 'Date',
        value: value.toISOString()
      };
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
  if (Array.isArray(response?.data) && response.data.length > 0 && response.data[0]?.response) {
    return response.data[0].response;
  }
  if (Array.isArray(response) && response.length > 0 && response[0]?.response) {
    return response[0].response;
  }
  let responseText = "";
  if (response?.data?.json?.body) {
    responseText = typeof response.data.json.body === 'string' ? response.data.json.body : JSON.stringify(response.data.json.body);
  } else if (response?.rawResponse) {
    try {
      const parsedResponse = JSON.parse(response.rawResponse);
      if (Array.isArray(parsedResponse) && parsedResponse.length > 0 && parsedResponse[0]?.response) {
        return parsedResponse[0].response;
      }
      responseText = response.rawResponse;
    } catch (e) {
      responseText = response.rawResponse;
    }
  } else if (response?.data?.output) {
    responseText = response.data.output;
  } else if (Array.isArray(response?.data) && response.data.length > 0) {
    responseText = typeof response.data[0] === 'string' ? response.data[0] : JSON.stringify(response.data[0]);
  } else if (response) {
    responseText = typeof response === 'string' ? response : JSON.stringify(response);
  } else {
    return "No response data received from webhook.";
  }
  return responseText;
};

const cleanResponseText = (text: string) => {
  let cleaned = text?.trim?.() || "";

  cleaned = cleaned
    .replace(/^["']?{\s*"response"\s*:\s*["']?/, '') // Remove leading {"response":
    .replace(/["']?\s*}["']?$/, '')                  // Remove trailing }
    .replace(/^"/, '')                               // Remove leading lone quote
    .replace(/"$/, '')                               // Remove trailing lone quote
    .replace(/\\n/g, '\n')                           // Convert escaped newlines
    .replace(/\\"/g, '"')                            // Unescape quotes
    .trim();

  if (cleaned === "undefined" || cleaned === "[object Object]") {
    return "Sorry, there was a problem understanding the AI's response.";
  }

  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const obj = JSON.parse(cleaned);
      if (typeof obj.response === 'string') return obj.response;
      return JSON.stringify(obj, null, 2);
    } catch (e) { /* ignore */ }
  }

  const paragraphs = cleaned
    .split(/\n\n+/)
    .filter(p => p.trim().length > 0)
    .map(p => p.trim());

  return paragraphs.join('\n\n');
};

export default function ChatInterface({
  className
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{
    text: "Hey, I'm Hi, Ask me anything about your business performance and I'll analyze the data for you.",
    isUser: false,
    timestamp: new Date()
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const {
    annualRecord,
    currentYear,
    currentMonth
  } = useStore();
  const {
    getMonthlyWages,
    getWeekdayTotals
  } = useWagesStore();
  const {
    user
  } = useAuthStore();
  const location = useLocation();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const webhookUrl = "https://neilfd.app.n8n.cloud/webhook/80c0a1b3-3700-416f-8549-3f421234d930";
  const {
    data: foodTrackerData
  } = useQuery({
    queryKey: ['tracker-data', currentYear, currentMonth, 'food'],
    queryFn: () => fetchTrackerDataByMonth(currentYear, currentMonth, 'food'),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
  const {
    data: bevTrackerData
  } = useQuery({
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
    if (messages.length > 1 || messages.length === 1 && messages[0].isUser) {
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
                const dayPurchases = day.purchases ? Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0) : 0;
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
        const thisMonth = annualRecord.months.find(m => m.year === year && m.month === month);
        if (thisMonth && thisMonth.weeks) {
          thisMonth.weeks.forEach(week => {
            if (week.days) {
              week.days.forEach(day => {
                const dayPurchases = day.purchases ? Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0) : 0;
                const creditNotes = day.creditNotes ? day.creditNotes.reduce((sum, credit) => sum + Number(credit), 0) : 0;
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
      const thisMonth = annualRecord.months.find(m => m.year === year && m.month === month);
      if (thisMonth && thisMonth.weeks) {
        thisMonth.weeks.forEach(week => {
          if (week.days) {
            week.days.forEach(day => {
              if (day.revenue !== undefined) {
                monthData.revenue += Number(day.revenue);
              }
              const dayPurchases = day.purchases ? Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0) : 0;
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
            const bevMonth = bevData.months.find(m => m.year === year && m.month === month);
            if (bevMonth && bevMonth.weeks) {
              bevMonth.weeks.forEach(week => {
                if (week.days) {
                  week.days.forEach(day => {
                    const dayPurchases = day.purchases ? Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0) : 0;
                    const creditNotes = day.creditNotes ? day.creditNotes.reduce((sum, credit) => sum + Number(credit), 0) : 0;
                    totalCost += dayPurchases - creditNotes + (day.staffFoodAllowance || 0);
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
      annualData = {
        ...monthData
      };
      return {
        annual: annualData,
        monthToDate: monthData
      };
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
                      const dayPurchases = Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0);
                      annualData.cost += dayPurchases;
                    }
                  });
                }
              });
            }
          });
          annualData.gpPercentage = calculateGP(annualData.revenue, annualData.cost);
          const bevMonth = bevData.months.find(m => m.year === year && m.month === month);
          if (bevMonth && bevMonth.weeks) {
            bevMonth.weeks.forEach(week => {
              if (week.days) {
                week.days.forEach(day => {
                  if (day.revenue !== undefined) {
                    monthData.revenue += Number(day.revenue);
                  }
                  const dayPurchases = day.purchases ? Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0) : 0;
                  const creditNotes = day.creditNotes ? day.creditNotes.reduce((sum, credit) => sum + Number(credit), 0) : 0;
                  const staffFoodAmount = day.staffFoodAllowance || 0;
                  monthData.cost += dayPurchases - creditNotes + staffFoodAmount;
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
    return {
      annual: annualData,
      monthToDate: monthData
    };
  };

  const preparePayload = async () => {
    return {
      Query: input,
      UserID: user?.id || null,
      Timestamp: new Date().toISOString()
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

  function UserAvatar() {
    return (
      <Avatar className="w-8 h-8">
        <AvatarImage 
          src={user?.avatar_url || undefined} 
          alt={user?.first_name || "User"} 
        />
        <AvatarFallback className="bg-[#6a1b9a] text-white">
          {user?.first_name
            ? user.first_name.charAt(0).toUpperCase()
            : <UserRound className="h-4 w-4 text-white" />}
        </AvatarFallback>
      </Avatar>
    );
  }

  function BotAvatar() {
    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#6a1b9a] flex items-center justify-center">
        <BotIcon className="h-4 w-4 text-white" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden shadow-glass ${className} animate-fade-in`}>
      <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-pastel-purple/70 to-pastel-blue/70 backdrop-blur-md border-b border-white/30">
        <div className="p-2 bg-tavern-blue/20 rounded-full backdrop-blur-sm animate-float">
          <Sparkles className="text-tavern-blue-dark h-5 w-5" />
        </div>
        <h3 className="font-semibold text-tavern-blue-dark text-lg">Hi, your performance assistant</h3>
        {isSyncing && <span className="text-xs text-tavern-blue-dark ml-auto animate-pulse">Syncing data...</span>}
      </div>
      
      <ScrollArea ref={scrollAreaRef} className="flex-1 h-64 p-4 overflow-y-auto chat-container">
        <div className="space-y-5">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex gap-2 ${message.isUser ? 'justify-end' : 'justify-start'} animate-scale-in`} 
              style={{
                animationDelay: `${index * 0.05}s`
              }}
            >
              {!message.isUser && <BotAvatar />}
              <div 
                className={`relative group max-w-[80%] ${
                  message.isUser 
                    ? 'bg-[#6a1b9a] text-white rounded-tl-xl rounded-tr-none rounded-bl-xl rounded-br-xl ml-auto' 
                    : 'bg-white text-gray-800 rounded-tl-none rounded-tr-xl rounded-bl-xl rounded-br-xl'
                } p-3 shadow-sm`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {message.isUser 
                    ? message.text 
                    : cleanResponseText(message.text)
                  }
                </p>
                <span className="block text-xs opacity-70 mt-1">
                  {message.timestamp instanceof Date 
                    ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                </span>
                
                {!message.isUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Share response</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => shareViaEmail(message.text)}>
                        Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => shareViaWhatsApp(message.text)}>
                        WhatsApp
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {message.isUser && <UserAvatar />}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/30 flex gap-2 items-center bg-white/80 backdrop-blur-md">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your business performance..."
          className="rounded-full bg-white/50 border-white/30 focus-visible:ring-tavern-blue"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-full bg-tavern-blue hover:bg-tavern-blue-dark transition-colors"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
          ) : (
            <SendHorizonal className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}
