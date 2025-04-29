
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

export default function WagesEmployees() {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'John Doe', position: 'Server', hourlyRate: 12.5, fullTime: true },
    { id: 2, name: 'Jane Smith', position: 'Bartender', hourlyRate: 14.0, fullTime: false },
    { id: 3, name: 'Mike Johnson', position: 'Chef', hourlyRate: 16.5, fullTime: true },
    { id: 4, name: 'Sarah Williams', position: 'Server', hourlyRate: 12.5, fullTime: false },
    { id: 5, name: 'David Brown', position: 'Kitchen Porter', hourlyRate: 11.0, fullTime: false },
  ]);

  return (
    <div className="container py-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-tavern-blue">Employees Management</h1>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(employee => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>£{employee.hourlyRate.toFixed(2)}</TableCell>
                  <TableCell>{employee.fullTime ? 'Full-time' : 'Part-time'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm" className="text-red-500">Remove</Button>
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
