import React from 'react';
import AnnualSummary from '../AnnualSummary';

export default function FoodAnnualSummary() {
  // Minimize left margin while keeping y-axis readable
  const chartMargins = { top: 20, right: 30, left: -40, bottom: 20 };

  return <AnnualSummary 
    modulePrefix="Food" 
    moduleType="food" 
    chartMargins={chartMargins} 
  />;
}
