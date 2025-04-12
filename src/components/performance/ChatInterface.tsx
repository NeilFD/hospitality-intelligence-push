import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal, Sparkles, User, Share2, Bot as BotIcon, UserRound } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { useWagesStore } from '@/components/wages/WagesStore';
import { useAuthStore } from '@/services/auth-service';
import { formatCurrency, calculateGP } from '@/lib/date-utils';
import { sendWebhookRequest } from '@/services/conversation-service';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchTrackerDataByMonth, 
  syncTrackerPurchasesToPurchases, 
  syncTrackerCreditNotesToCreditNotes,
  fetchTrackerPurchases,
  fetchPurchases,
  fetchDailyRecords
} from '@/services/kitchen-service';

interface ExtendedDailyRecord {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  revenue?: number;
  purchases?: Record<string, number>; // supplierId -> amount
  creditNotes?: number[];
  staffFoodAllowance?: number;
}

interface BevStore {
  getState: () => {
    annualRecord: {
      months: Array<{
        year: number;
        month: number;
        weeks: Array<{
          days: Array<ExtendedDailyRecord>;
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
  
  if (Array.isArray(response?.data) && response.data.length > 0 && response.data[0]?.response) {
    return response.data[0].response;
  }
  
  if (Array.isArray(response) && response.length > 0 && response[0]?.response) {
    return response[0].response;
  }
  
  let responseText = "";
  
  if (response?.data?.json?.body) {
    responseText = typeof response.data.json.body === 'string' 
      ? response.data.json.body
      : JSON.stringify(response.data.json.body);
  }
  else if (response?.rawResponse) {
    try {
      const parsedResponse = JSON.parse(response.rawResponse);
      if (Array.isArray(parsedResponse) && parsedResponse.length > 0 && parsedResponse[0]?.response) {
        return parsedResponse[0].response;
      }
      responseText = response.rawResponse;
    } catch (e) {
      responseText = response.rawResponse;
    }
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
  
  return responseText;
};

export default function ChatInterface({ className }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hey, Im Hi, Ask me anything about your business performance and I'll analyse the data for you.",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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
                  
                  const dayPurchases = day.purchases ? 
                    Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0) : 0;
                  
                  const creditNotes = day.creditNotes ? 
                    day.creditNotes.reduce((sum, credit) => sum + Number(credit), 0) : 0;
                  
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
    
    setIsSyncing(true);
    try {
      await syncTrackerPurchasesToPurchases(currentYear, currentMonth, 'food');
      await syncTrackerCreditNotesToCreditNotes(currentYear, currentMonth, 'food');
      
      await syncTrackerPurchasesToPurchases(currentYear, currentMonth, 'beverage');
      await syncTrackerCreditNotesToCreditNotes(currentYear, currentMonth, 'beverage');
      
      console.log("Successfully synchronized tracker data to purchases and credit notes tables.");
    } catch (error) {
      console.error("Error syncing tracker data:", error);
    } finally {
      setIsSyncing(false);
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
    
    let foodPurchases = [];
    let bevPurchases = [];
    
    try {
      const foodTrackerIds = foodTrackerData?.map(day => day.id) || [];
      if (foodTrackerIds.length > 0) {
        for (const id of foodTrackerIds) {
          try {
            const purchases = await fetchTrackerPurchases(id);
            foodPurchases = [...foodPurchases, ...purchases];
          } catch (e) {
            console.error(`Error fetching purchases for tracker ${id}:`, e);
          }
        }
      }
      
      const bevTrackerIds = bevTrackerData?.map(day => day.id) || [];
      if (bevTrackerIds.length > 0) {
        for (const id of bevTrackerIds) {
          try {
            const purchases = await fetchTrackerPurchases(id);
            bevPurchases = [...bevPurchases, ...purchases];
          } catch (e) {
            console.error(`Error fetching purchases for bev tracker ${id}:`, e);
          }
        }
      }
      
      if (foodPurchases.length === 0 && foodTrackerData && foodTrackerData.length > 0) {
        console.log("No purchases found through tracker, trying direct purchase table query...");
        
        const { data: foodDailyRecords } = await supabase
          .from('daily_records')
          .select('id, date')
          .eq('module_type', 'food')
          .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
          .lte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`);
        
        if (foodDailyRecords && foodDailyRecords.length > 0) {
          console.log(`Found ${foodDailyRecords.length} daily records for food`);
          
          for (const dailyRecord of foodDailyRecords) {
            try {
              const dailyPurchases = await fetchPurchases(dailyRecord.id);
              if (dailyPurchases && dailyPurchases.length > 0) {
                console.log(`Found ${dailyPurchases.length} purchases for ${dailyRecord.date}`);
                const purchasesWithDate = dailyPurchases.map(p => ({
                  ...p, 
                  date: dailyRecord.date
                }));
                foodPurchases = [...foodPurchases, ...purchasesWithDate];
              }
            } catch (e) {
              console.error(`Error fetching purchases for daily record ${dailyRecord.id}:`, e);
            }
          }
        }
      }
      
      if (bevPurchases.length === 0 && bevTrackerData && bevTrackerData.length > 0) {
        console.log("No purchases found through tracker for beverage, trying direct purchase table query...");
        
        const { data: bevDailyRecords } = await supabase
          .from('daily_records')
          .select('id, date')
          .eq('module_type', 'beverage')
          .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
          .lte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`);
        
        if (bevDailyRecords && bevDailyRecords.length > 0) {
          console.log(`Found ${bevDailyRecords.length} daily records for beverage`);
          
          for (const dailyRecord of bevDailyRecords) {
            try {
              const dailyPurchases = await fetchPurchases(dailyRecord.id);
              if (dailyPurchases && dailyPurchases.length > 0) {
                console.log(`Found ${dailyPurchases.length} purchases for ${dailyRecord.date}`);
                const purchasesWithDate = dailyPurchases.map(p => ({
                  ...p, 
                  date: dailyRecord.date
                }));
                bevPurchases = [...bevPurchases, ...purchasesWithDate];
              }
            } catch (e) {
              console.error(`Error fetching purchases for daily record ${dailyRecord.id}:`, e);
            }
          }
        }
      }
      
      console.log(`Final count - Food purchases: ${foodPurchases.length}, Bev purchases: ${bevPurchases.length}`);
    } catch (error) {
      console.error("Error fetching detailed purchase data:", error);
    }
    
    const foodDailyPurchases = {};
    foodPurchases.forEach(purchase => {
      const date = purchase.date || "unknown";
      if (!foodDailyPurchases[date]) {
        foodDailyPurchases[date] = [];
      }
      foodDailyPurchases[date].push(purchase);
    });
    
    const bevDailyPurchases = {};
    bevPurchases.forEach(purchase => {
      const date = purchase.date || "unknown";
      if (!bevDailyPurchases[date]) {
        bevDailyPurchases[date] = [];
      }
      bevDailyPurchases[date].push(purchase);
    });
    
    console.log("*** WEBHOOK PAYLOAD DEBUG ***");
    console.log("Food Annual Data:", foodAnnualData);
    console.log("Food Month Data:", foodMonthData);
    console.log("Beverage Data:", bevData);
    console.log("Tracker Data Summary:", {
      food: {
        records: foodTrackerData || [],
        purchases: foodPurchases,
        dailyPurchases: foodDailyPurchases
      },
      beverage: {
        records: bevTrackerData || [],
        purchases: bevPurchases,
        dailyPurchases: bevDailyPurchases
      }
    });
    console.log("Raw Food Data:", deepCopyFoodData);
    console.log("Raw Beverage Data:", deepCopyBevData); 
    console.log("Wages Data:", { monthlyWages, weekdayTotals });
    console.log("Food Purchases:", foodPurchases);
    console.log("Food Daily Purchases:", foodDailyPurchases);
    console.log("Beverage Purchases:", bevPurchases);
    console.log("Beverage Daily Purchases:", bevDailyPurchases);
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
          trackerRecords: foodTrackerData || [],
          purchaseDetails: foodPurchases,
          dailyPurchases: foodDailyPurchases
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
          trackerRecords: bevTrackerData || [],
          purchaseDetails: bevPurchases,
          dailyPurchases: bevDailyPurchases
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
              style={{animationDelay: `${index * 0.05}s`}}
            >
              {!message.isUser && 
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pastel-blue/80 to-pastel-purple/80 flex items-center justify-center mt-1 shadow-sm flex-shrink-0 border border-white/50">
                  <Sparkles className="h-4 w-4 text-tavern-blue-dark" />
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
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-tavern-blue-light/80 to-tavern-blue/80 flex items-center justify-center mt-1 shadow-sm flex-shrink-0 border border-white/50">
                <Sparkles className="h-4 w-4 text-tavern-blue-dark" />
              </div>
              <div className="frost-panel rounded-2xl rounded-tl-sm p-4 flex gap-2 min-w-[100px]">
                <span className="w-2 h-2 bg-tavern-blue-light rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-tavern-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-tavern-blue-light rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
          disabled={isLoading || isSyncing}
          className="flex-1 glass-input text-tavern-blue-dark shadow-inner focus:shadow-none"
        />
        <Button 
          type="submit" 
          disabled={isLoading || isSyncing || !input.trim()} 
          className="send-button shadow-glass bg-gradient-to-r from-tavern-blue-light/80 to-tavern-blue/90 text-white"
        >
          <SendHorizonal className="h-5 w-5 text-tavern-blue-dark" />
        </Button>
      </form>
    </div>
  );
}
