
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { AlertTriangle, Copy, Check, Clock } from 'lucide-react';

export function DatabasePanel() {
  const [duplicating, setDuplicating] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);
  const [connectionString, setConnectionString] = useState('');
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [versionHistory, setVersionHistory] = useState<{date: Date, connectionString: string}[]>([]);
  
  const initiateDbDuplication = () => {
    setAlertDialogOpen(true);
  };
  
  const copyConnectionString = () => {
    navigator.clipboard.writeText(connectionString);
    toast.success('Connection string copied to clipboard');
  };
  
  const proceedToConfirmationStep = () => {
    setAlertDialogOpen(false);
    setShowConfirmation(true);
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
      
      const newConnectionString = 'postgresql://user:password@host:port/new_database';
      
      // Add the new version to the history
      setVersionHistory(prev => [
        { date: new Date(), connectionString: newConnectionString },
        ...prev
      ]);
      
      setSuccess(true);
      setConnectionString(newConnectionString);
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

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
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
              
              <Alert variant="destructive">
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

          {/* Version History Section */}
          {versionHistory.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <div className="flex items-center mb-4">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <h3 className="text-lg font-medium">Version History</h3>
              </div>
              <div className="space-y-3">
                {versionHistory.map((version, index) => (
                  <div key={index} className="bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{formatDate(version.date)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigator.clipboard.writeText(version.connectionString)}
                        className="h-7 px-2"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Copy</span>
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {version.connectionString}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent className="max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive font-bold">
              Duplicate Database Structure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Are you absolutely sure you want to proceed with duplicating the database structure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">This action:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Will create a new database with the current structure</li>
                  <li>Does not copy any existing data</li>
                  <li>Cannot be automatically reversed</li>
                  <li>Requires GOD level access</li>
                </ul>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={proceedToConfirmationStep}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium"
            >
              Yes, I'm sure
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
