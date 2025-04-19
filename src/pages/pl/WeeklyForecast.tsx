import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForecastData } from './hooks/useForecastData';
import { RevenueTagManager } from './components/revenue-tags/RevenueTagManager';
import { Calendar, CloudRain, Cloud, Sun, Thermometer } from 'lucide-react';
import { format } from 'date-fns';
import { RevenueTag, TaggedDate } from '@/types/revenue-tag-types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function WeeklyForecast() {
  const { 
    forecastData, 
    futureWeeks,
    selectedWeekIndex,
    selectWeek, 
    isLoading,
    refreshForecast,
    totalForecastedRevenue,
    totalForecastedFoodRevenue,
    totalForecastedBevRevenue,
    weatherImpactData
  } = useForecastData();
  
  const [tags, setTags] = useState<RevenueTag[]>([]);
  const [taggedDates, setTaggedDates] = useState<TaggedDate[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  useEffect(() => {
    fetchRevenueTags();
    fetchTaggedDates();
  }, []);
  
  const fetchRevenueTags = async () => {
    try {
      setIsLoadingTags(true);
      
      const { data, error } = await supabase
        .from('revenue_tags')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      const mappedTags: RevenueTag[] = data.map(tag => ({
        id: tag.id,
        name: tag.name,
        historicalFoodRevenueImpact: tag.historical_food_revenue_impact,
        historicalBeverageRevenueImpact: tag.historical_beverage_revenue_impact,
        occurrenceCount: tag.occurrence_count,
        description: tag.description
      }));
      
      console.log('Fetched tags:', mappedTags);
      setTags(mappedTags);
    } catch (error) {
      console.error('Error fetching revenue tags:', error);
      toast.error('Failed to load revenue tags');
    } finally {
      setIsLoadingTags(false);
    }
  };
  
  const fetchTaggedDates = async () => {
    try {
      const { data, error } = await supabase
        .from('tagged_dates')
        .select('*')
        .order('date');
        
      if (error) throw error;
      
      const mappedTaggedDates: TaggedDate[] = data.map(td => ({
        id: td.id,
        date: td.date,
        tagId: td.tag_id,
        manualFoodRevenueImpact: td.manual_food_revenue_impact,
        manualBeverageRevenueImpact: td.manual_beverage_revenue_impact
      }));
      
      setTaggedDates(mappedTaggedDates);
    } catch (error) {
      console.error('Error fetching tagged dates:', error);
      toast.error('Failed to load tagged dates');
    }
  };
  
  const handleAddTag = async (tag: Partial<RevenueTag>) => {
    try {
      const foodImpact = parseFloat(tag.historicalFoodRevenueImpact?.toString() || '0');
      const bevImpact = parseFloat(tag.historicalBeverageRevenueImpact?.toString() || '0');
      
      const { data, error } = await supabase
        .from('revenue_tags')
        .insert([
          { 
            name: tag.name,
            historical_food_revenue_impact: foodImpact,
            historical_beverage_revenue_impact: bevImpact,
            occurrence_count: tag.occurrenceCount || 0,
            description: tag.description
          }
        ])
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newTag: RevenueTag = {
          id: data[0].id,
          name: data[0].name,
          historicalFoodRevenueImpact: data[0].historical_food_revenue_impact,
          historicalBeverageRevenueImpact: data[0].historical_beverage_revenue_impact,
          occurrenceCount: data[0].occurrence_count,
          description: data[0].description
        };
        
        setTags(prev => [...prev, newTag]);
        toast.success('Tag added successfully');
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to add tag');
    }
  };
  
  const handleTagDate = async (date: Date, tagId: string, impacts?: { food?: number; beverage?: number }) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const existingTaggedDate = taggedDates.find(td => td.date === dateStr);
      
      if (existingTaggedDate) {
        const { error: updateError } = await supabase
          .from('tagged_dates')
          .update({
            tag_id: tagId,
            manual_food_revenue_impact: impacts?.food,
            manual_beverage_revenue_impact: impacts?.beverage
          })
          .eq('id', existingTaggedDate.id);
          
        if (updateError) throw updateError;
        
        setTaggedDates(prev => prev.map(td => 
          td.id === existingTaggedDate.id 
            ? {
                ...td,
                tagId,
                manualFoodRevenueImpact: impacts?.food,
                manualBeverageRevenueImpact: impacts?.beverage
              } 
            : td
        ));
      } else {
        const { data, error } = await supabase
          .from('tagged_dates')
          .insert([
            {
              date: dateStr,
              tag_id: tagId,
              manual_food_revenue_impact: impacts?.food,
              manual_beverage_revenue_impact: impacts?.beverage
            }
          ])
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const newTaggedDate: TaggedDate = {
            id: data[0].id,
            date: data[0].date,
            tagId: data[0].tag_id,
            manualFoodRevenueImpact: data[0].manual_food_revenue_impact,
            manualBeverageRevenueImpact: data[0].manual_beverage_revenue_impact
          };
          
          setTaggedDates(prev => [...prev, newTaggedDate]);
        }
      }
      
      const tagToUpdate = tags.find(t => t.id === tagId);
      if (tagToUpdate) {
        const newCount = (tagToUpdate.occurrenceCount || 0) + 1;
        
        const { error: tagUpdateError } = await supabase
          .from('revenue_tags')
          .update({ 
            occurrence_count: newCount
          })
          .eq('id', tagId);
          
        if (tagUpdateError) throw tagUpdateError;
        
        setTags(prev => prev.map(t => 
          t.id === tagId 
            ? { ...t, occurrenceCount: newCount } 
            : t
        ));
      }
      
      await fetchRevenueTags();
      await fetchTaggedDates();
      
      refreshForecast();
      toast.success('Date tagged successfully');
    } catch (error) {
      console.error('Error tagging date:', error);
      toast.error('Failed to tag date');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Revenue Forecast</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Weekly Forecast</span>
                <Button onClick={refreshForecast} disabled={isLoading}>
                  Refresh Data
                </Button>
              </CardTitle>
              <CardDescription>
                {isLoading ? 'Loading forecast data...' : 'Projected revenue for the current and upcoming weeks'}
              </CardDescription>
              
              {!isLoading && (
                <Tabs 
                  defaultValue="0" 
                  className="mt-4"
                  value={selectedWeekIndex.toString()}
                  onValueChange={(value) => selectWeek(parseInt(value))}
                >
                  <TabsList className="grid grid-cols-5 mb-4">
                    <TabsTrigger value="0">Current Week</TabsTrigger>
                    <TabsTrigger value="1">Next Week</TabsTrigger>
                    <TabsTrigger value="2">Week 2</TabsTrigger>
                    <TabsTrigger value="3">Week 3</TabsTrigger>
                    <TabsTrigger value="4">Week 4</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={selectedWeekIndex.toString()}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Day</th>
                            <th className="text-right py-2">Food</th>
                            <th className="text-right py-2">Beverage</th>
                            <th className="text-right py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forecastData.map((day, index) => (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="py-2">
                                {format(new Date(day.date), 'EEE, MMM d')}
                              </td>
                              <td className="text-right py-2">
                                {formatCurrency(day.foodRevenue)}
                              </td>
                              <td className="text-right py-2">
                                {formatCurrency(day.beverageRevenue)}
                              </td>
                              <td className="text-right py-2 font-medium">
                                {formatCurrency(day.totalRevenue)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-muted/20 font-semibold">
                            <td className="py-2">Weekly Total</td>
                            <td className="text-right py-2">
                              {formatCurrency(totalForecastedFoodRevenue)}
                            </td>
                            <td className="text-right py-2">
                              {formatCurrency(totalForecastedBevRevenue)}
                            </td>
                            <td className="text-right py-2">
                              {formatCurrency(totalForecastedRevenue)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardHeader>
          </Card>
          
          <RevenueTagManager 
            tags={tags}
            taggedDates={taggedDates}
            onAddTag={handleAddTag}
            onTagDate={handleTagDate}
          />
        </div>
        
        <div>
          <Card className="shadow-md mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-500" />
                Weather Impact Analysis
              </CardTitle>
              <CardDescription>How weather affects your business revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    Hot Weather Impact
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {weatherImpactData.hotWeather.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-2">
                    <Cloud className="h-4 w-4 text-gray-500" />
                    Cold Weather Impact
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {weatherImpactData.coldWeather.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-2">
                    <CloudRain className="h-4 w-4 text-blue-500" />
                    Rainy Days Impact
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {weatherImpactData.rainyDays.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    Sunny Days Impact
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {weatherImpactData.sunnyDays.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
