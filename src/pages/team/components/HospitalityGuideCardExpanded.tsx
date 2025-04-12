
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, ConciergeBell } from "lucide-react";
import { HospitalityGuide } from "@/types/hospitality-types";
import { format } from "date-fns";

interface HospitalityGuideCardExpandedProps {
  guide: HospitalityGuide | any;
  isOpen: boolean;
  onClose: () => void;
}

const HospitalityGuideCardExpanded: React.FC<HospitalityGuideCardExpandedProps> = ({ 
  guide, 
  isOpen, 
  onClose 
}) => {
  if (!guide) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ConciergeBell className="h-6 w-6 text-blue-600" />
            <DialogTitle className="text-2xl text-gray-900">{guide.name}</DialogTitle>
          </div>
          <p className="text-gray-600">{guide.category || 'Uncategorized'}</p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            {guide.imageUrl || guide.image_url ? (
              <img 
                src={guide.imageUrl || guide.image_url} 
                alt={guide.name} 
                className="w-full h-48 object-cover rounded-md"
                onError={(e) => {
                  console.error("Guide image failed to load:", guide.imageUrl || guide.image_url);
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md text-gray-700">
                No image available
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Details</h3>
              <Separator className="my-2" />
              
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-600">Category:</span>
                <span className="text-gray-900">{guide.category || 'Uncategorized'}</span>
                
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">
                  {format(new Date(guide.createdAt || guide.created_at), 'MMM d, yyyy')}
                </span>
                
                {(guide.department || guide.department) && (
                  <>
                    <span className="text-gray-600">Department:</span>
                    <span className="text-gray-900">{guide.department}</span>
                  </>
                )}
              </div>
            </div>
            
            {(guide.timeToCompleteMinutes || guide.time_to_complete_minutes) > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-gray-900">
                  Duration: {guide.timeToCompleteMinutes || guide.time_to_complete_minutes} minutes
                </span>
              </div>
            )}
          </div>
          
          <div>
            {(guide.description) && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <Separator className="my-2" />
                <p className="text-gray-800 whitespace-pre-line">{guide.description}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4 mt-4">
          <h3 className="font-medium text-gray-900">Steps/Procedures</h3>
          <Separator className="my-2" />
          
          {(guide.steps && guide.steps.length > 0) ? (
            <div className="space-y-2">
              {guide.steps.map((step: any, index: number) => (
                <div key={step.id || index} className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{index + 1}.</span>
                  <span className="flex-grow text-gray-800">{step.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No steps added.</p>
          )}
        </div>
        
        {(guide.detailedProcedure || guide.detailed_procedure) && (
          <div className="space-y-4 mt-4">
            <h3 className="font-medium text-gray-900">Detailed Procedure</h3>
            <Separator className="my-2" />
            <p className="whitespace-pre-line text-gray-800">{guide.detailedProcedure || guide.detailed_procedure}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HospitalityGuideCardExpanded;
