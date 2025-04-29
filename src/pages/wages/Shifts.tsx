
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';

export default function WagesShifts() {
  const [shifts, setShifts] = useState([
    { id: 1, employee: 'John Doe', date: '2025-04-25', startTime: '09:00', endTime: '17:00', hours: 8, position: 'Server' },
    { id: 2, employee: 'Jane Smith', date: '2025-04-25', startTime: '12:00', endTime: '20:00', hours: 8, position: 'Bartender' },
    { id: 3, employee: 'Mike Johnson', date: '2025-04-26', startTime: '08:00', endTime: '16:00', hours: 8, position: 'Chef' },
    { id: 4, employee: 'Sarah Williams', date: '2025-04-26', startTime: '16:00', endTime: '22:00', hours: 6, position: 'Server' },
    { id: 5, employee: 'David Brown', date: '2025-04-27', startTime: '10:00', endTime: '18:00', hours: 8, position: 'Kitchen Porter' },
  ]);

  return (
    <div className="container py-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-tavern-blue">Shifts Management</h1>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Schedule
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Shift
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shifts Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map(shift => (
                <TableRow key={shift.id}>
                  <TableCell>{shift.employee}</TableCell>
                  <TableCell>{shift.date}</TableCell>
                  <TableCell>{shift.startTime}</TableCell>
                  <TableCell>{shift.endTime}</TableCell>
                  <TableCell>{shift.hours}</TableCell>
                  <TableCell>{shift.position}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm" className="text-red-500">Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
