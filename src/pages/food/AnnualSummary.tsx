import React from 'react';
import AnnualSummary from '../AnnualSummary';

export default function FoodAnnualSummary() {
  // Minimize left margin while keeping y-axis readable
  // Increase right margin to prevent overflow
  const chartMargins = { top: 20, right: 50, left: -30, bottom: 20 };

  return <AnnualSummary 
    modulePrefix="Food" 
    moduleType="food" 
    chartMargins={chartMargins} 
  />;
}
