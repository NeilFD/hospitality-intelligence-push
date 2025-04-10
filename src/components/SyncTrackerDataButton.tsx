
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { syncTrackerPurchasesToPurchases, syncTrackerCreditNotesToCreditNotes } from '@/lib/supabase';

interface SyncTrackerDataButtonProps {
  moduleType: 'food' | 'beverage';
  year: number;
  month: number;
  className?: string;
}

const SyncTrackerDataButton = ({ moduleType, year, month, className }: SyncTrackerDataButtonProps) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      // First sync purchases
      const purchasesResult = await syncTrackerPurchasesToPurchases(year, month, moduleType);
      
      if (!purchasesResult.success) {
        toast.error(`Failed to sync ${moduleType} tracker purchases: ${purchasesResult.error}`);
        return;
      }
      
      // Then sync credit notes
      const creditNotesResult = await syncTrackerCreditNotesToCreditNotes(year, month, moduleType);
      
      if (!creditNotesResult.success) {
        toast.error(`Failed to sync ${moduleType} tracker credit notes: ${creditNotesResult.error}`);
        return;
      }
      
      toast.success(`${moduleType === 'food' ? 'Food' : 'Beverage'} tracker data successfully synchronized to main tables`);
    } catch (error) {
      console.error('Error syncing tracker data:', error);
      toast.error(`Failed to sync ${moduleType} tracker data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button 
      variant="outline"
      onClick={handleSync}
      disabled={isSyncing}
      className={className}
    >
      {isSyncing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        `Sync ${moduleType === 'food' ? 'Food' : 'Beverage'} Tracker Data`
      )}
    </Button>
  );
};

export default SyncTrackerDataButton;
