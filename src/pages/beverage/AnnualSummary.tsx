
import React from 'react';
import AnnualSummary from '../AnnualSummary';

export default function BeverageAnnualSummary() {
  // Adjust margins to ensure full x-axis visibility
  const chartMargins = { top: 20, right: 30, left: 20, bottom: 20 };

  return <AnnualSummary 
    modulePrefix="Beverage" 
    moduleType="beverage" 
    chartMargins={chartMargins} 
  />;
}
