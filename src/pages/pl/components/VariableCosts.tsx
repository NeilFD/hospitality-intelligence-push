
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function VariableCosts() {
  return (
    <Card className="shadow-md rounded-xl overflow-hidden">
      <CardHeader className="bg-white/40 border-b">
        <CardTitle>Variable Overhead Costs</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-sm text-gray-600 mb-4">Track and update variable overhead costs for the current month.</p>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Maintenance & Repairs</label>
            <Input type="number" placeholder="0.00" />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Marketing & Promotions</label>
            <Input type="number" placeholder="0.00" />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Miscellaneous</label>
            <Input type="number" placeholder="0.00" />
          </div>
          
          <Button className="mt-2 bg-purple-600 hover:bg-purple-700">
            Update Overheads
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
