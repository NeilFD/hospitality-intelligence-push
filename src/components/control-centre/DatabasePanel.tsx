
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from 'sonner';
import { AlertTriangle, Copy, Check } from 'lucide-react';

export function DatabasePanel() {
  const [duplicating, setDuplicating] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);
  const [connectionString, setConnectionString] = useState('');
  
  const initiateDbDuplication = () => {
    setShowConfirmation(true);
  };
  
  const copyConnectionString = () => {
    navigator.clipboard.writeText(connectionString);
    toast.success('Connection string copied to clipboard');
  };
  
  const confirmDuplication = async () => {
    if (confirmText !== 'DUPLICATE DATABASE') {
      toast.error('Please type the confirmation text exactly as shown');
      return;
    }
    
    try {
      setDuplicating(true);
      
      // Here we would call the function to duplicate the database
      // For now, just simulate a delay and show a success message
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setSuccess(true);
      setConnectionString('postgresql://user:password@host:port/new_database');
      toast.success('Database structure duplicated successfully');
    } catch (error) {
      console.error('Error duplicating database:', error);
      toast.error('Failed to duplicate database');
    } finally {
      setDuplicating(false);
    }
  };
  
  const resetForm = () => {
    setShowConfirmation(false);
    setSuccess(false);
    setConfirmText('');
    setConnectionString('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Management</CardTitle>
        <CardDescription>
          Advanced database operations (GOD access only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {!showConfirmation && !success && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This tool allows you to duplicate the entire Supabase database structure (tables, relationships, functions, etc.) without any data. This is useful for creating a new instance of the application with the same structure but without any existing data.
              </p>
              
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important Warning</AlertTitle>
                <AlertDescription>
                  This operation will create a new database with the same structure as the current one. This is an advanced operation that should be used with caution. It does not affect your current database in any way.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end">
                <Button onClick={initiateDbDuplication} variant="destructive">
                  Duplicate Database Structure
                </Button>
              </div>
            </div>
          )}
          
          {showConfirmation && !success && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Confirmation Required</AlertTitle>
                <AlertDescription>
                  You are about to duplicate the database structure. Please type "DUPLICATE DATABASE" below to confirm.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="confirmText">Confirmation Text</Label>
                <Input 
                  id="confirmText"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DUPLICATE DATABASE"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDuplication}
                  disabled={duplicating || confirmText !== 'DUPLICATE DATABASE'}
                >
                  {duplicating ? 'Duplicating...' : 'Confirm Duplication'}
                </Button>
              </div>
            </div>
          )}
          
          {success && (
            <div className="space-y-4">
              <Alert>
                <Check className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  The database structure has been successfully duplicated. You can use the connection string below to connect to the new database.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="connectionString">New Database Connection String</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="connectionString"
                    value={connectionString}
                    readOnly
                  />
                  <Button variant="outline" size="icon" onClick={copyConnectionString}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={resetForm}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
