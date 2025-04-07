
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTrackerDataByMonth } from '@/services/kitchen-service';
import { supabase } from '@/lib/supabase';
import AnnualSummary from '../AnnualSummary';

export default function FoodAnnualSummary() {
  // Minimize left margin while keeping y-axis readable
  // Increase right margin to prevent overflow
  const chartMargins = { top: 20, right: 50, left: -30, bottom: 20 };

  // This component will fetch data for all months in the current year
  // and pass it to the AnnualSummary component
  const currentYear = new Date().getFullYear();

  // Pre-fetch data for all months of the current year
  // This data will be available in the shared React Query cache
  // and will be used by the AnnualSummary component
  for (let month = 1; month <= 12; month++) {
    useQuery({
      queryKey: ['tracker-data', currentYear, month, 'food'],
      queryFn: async () => {
        try {
          return await fetchTrackerDataByMonth(currentYear, month, 'food');
        } catch (error) {
          console.error(`Error fetching tracker data for month ${month}:`, error);
          return [];
        }
      },
      // Don't refetch unnecessarily
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }

  return <AnnualSummary 
    modulePrefix="Food" 
    moduleType="food" 
    chartMargins={chartMargins} 
  />;
}
