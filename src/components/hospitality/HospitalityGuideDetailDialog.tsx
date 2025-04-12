
import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HospitalityGuide } from '@/types/hospitality-types';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ArchiveIcon, Clock, Download, Edit, Trash2, ConciergeBell, Globe } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import RecipePDF from '@/components/recipes/RecipePDF';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HospitalityGuideDetailDialogProps {
  open: boolean;
  onClose: () => void;
  guide: HospitalityGuide;
  onEdit?: (guide: HospitalityGuide) => void;
  onDelete?: (guide: HospitalityGuide) => void;
  onArchive?: (guide: HospitalityGuide) => void;
  onToggleNoticeboard?: (guide: HospitalityGuide) => void;
}

const HospitalityGuideDetailDialog: React.FC<HospitalityGuideDetailDialogProps> = ({
  open,
  onClose,
  guide,
  onEdit,
  onDelete,
  onArchive,
  onToggleNoticeboard,
}) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(guide);
    }
    onClose();
  };
  
  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this guide?')) {
      onDelete(guide);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ConciergeBell className="h-6 w-6 text-blue-600" />
            <DialogTitle className="text-xl font-bold">{guide.name}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guide.imageUrl && (
            <div className="overflow-hidden rounded-md aspect-video">
              <img src={guide.imageUrl} alt={guide.name} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Details</h3>
              <Separator className="my-2" />
              
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Category:</span>
                <span className="text-tavern-blue-dark">{guide.category || 'Uncategorized'}</span>
                
                <span className="text-muted-foreground">Created:</span>
                <span className="text-tavern-blue-dark">{format(new Date(guide.createdAt), 'MMM d, yyyy')}</span>
                
                {guide.department && (
                  <>
                    <span className="text-muted-foreground">Department:</span>
                    <span className="text-tavern-blue-dark">{guide.department}</span>
                  </>
                )}
              </div>
            </div>
            
            {guide.description && (
              <div>
                <h3 className="font-semibold text-lg">Description</h3>
                <Separator className="my-2" />
                <p className="text-tavern-blue-dark">{guide.description}</p>
              </div>
            )}
            
            {guide.timeToCompleteMinutes > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-tavern-blue-dark">Duration: {guide.timeToCompleteMinutes} minutes</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Steps/Procedures</h3>
          <Separator className="my-2" />
          
          {guide.steps && guide.steps.length > 0 ? (
            <div className="space-y-2">
              {guide.steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2">
                  <span className="font-medium text-tavern-blue-dark">{index + 1}.</span>
                  <span className="flex-grow text-tavern-blue-dark">{step.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No steps added.</p>
          )}
        </div>
        
        {guide.detailedProcedure && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Detailed Procedure</h3>
            <Separator className="my-2" />
            <p className="whitespace-pre-line text-tavern-blue-dark">{guide.detailedProcedure}</p>
          </div>
        )}
        
        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            {onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            
            {onArchive && (
              <Button variant="outline" onClick={() => onArchive(guide)}>
                <ArchiveIcon className="h-4 w-4 mr-2" />
                {guide.archived ? 'Unarchive' : 'Archive'}
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {onToggleNoticeboard && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => onToggleNoticeboard(guide)}
                      className={guide.postedToNoticeboard ? "text-green-600" : ""}
                    >
                      <Globe className={`h-4 w-4 mr-2 ${guide.postedToNoticeboard ? "text-green-600 fill-green-100" : ""}`} />
                      {guide.postedToNoticeboard ? "Remove from Noticeboard" : "Post to Noticeboard"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {guide.postedToNoticeboard ? 'Posted to Staff Noticeboard' : 'Not posted to Staff Noticeboard'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <PDFDownloadLink 
              document={
                <RecipePDF recipe={{
                  ...guide,
                  moduleType: 'hospitality',
                  allergens: [],
                  isVegan: false,
                  isVegetarian: false,
                  isGlutenFree: false,
                  timeToTableMinutes: guide.timeToCompleteMinutes,
                  ingredients: guide.steps.map(step => ({
                    id: step.id,
                    name: step.name,
                    amount: 0,
                    unit: '',
                    costPerUnit: 0,
                    totalCost: 0
                  })),
                  method: guide.detailedProcedure,
                  costing: {
                    totalRecipeCost: 0,
                    suggestedSellingPrice: 0,
                    actualMenuPrice: 0,
                    grossProfitPercentage: 0
                  },
                  hideCosting: true
                }} />
              }
              fileName={`${guide.name.toLowerCase().replace(/\s+/g, '-')}-guide.pdf`}
            >
              {({ loading }) => (
                <Button variant="outline" disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? "Generating..." : "Download PDF"}
                </Button>
              )}
            </PDFDownloadLink>
            
            {onEdit && (
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HospitalityGuideDetailDialog;
