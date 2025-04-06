
import React from 'react';
import { TableRow, TableHead } from '@/components/ui/table';

export function TrackerTableHeader() {
  return (
    <TableRow className="bg-purple-50">
      <TableHead className="w-[250px]">Line Item</TableHead>
      <TableHead className="text-right">Budget</TableHead>
      <TableHead className="text-right">%</TableHead>
      <TableHead className="text-right">Pro-Rated Budget MTD</TableHead>
      <TableHead className="text-right">Actual MTD</TableHead>
      <TableHead className="text-right">Forecast</TableHead>
      <TableHead className="text-right">Var MTD</TableHead>
    </TableRow>
  );
}
