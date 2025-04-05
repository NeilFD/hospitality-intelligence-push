
import React from 'react';
import AnnualSummary from '../AnnualSummary';

export default function BeverageAnnualSummary() {
  // Reuse the same margins from the main AnnualSummary component
  const chartMargins = { top: 20, right: 10, left: 0, bottom: 20 };

  return <AnnualSummary 
    modulePrefix="Beverage" 
    moduleType="beverage" 
    chartMargins={chartMargins} 
  />;
}
