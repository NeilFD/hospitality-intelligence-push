
import React from 'react';
import AnnualSummary from '../AnnualSummary';

export default function FoodAnnualSummary() {
  // Adjust margins to ensure full x-axis visibility
  const chartMargins = { top: 20, right: 30, left: 20, bottom: 20 };

  return <AnnualSummary 
    modulePrefix="Food" 
    moduleType="food" 
    chartMargins={chartMargins} 
  />;
}
