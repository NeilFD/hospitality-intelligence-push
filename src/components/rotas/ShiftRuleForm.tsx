
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

const days = [
  { id: 'mon', name: 'Monday' },
  { id: 'tue', name: 'Tuesday' },
  { id: 'wed', name: 'Wednesday' },
  { id: 'thu', name: 'Thursday' },
  { id: 'fri', name: 'Friday' },
  { id: 'sat', name: 'Saturday' },
  { id: 'sun', name: 'Sunday' }
];

export default function ShiftRuleForm({ isOpen, onClose, onSubmitComplete, locationId, jobRoles, day, editingShift }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedDays, setSelectedDays] = useState({});
  const [isArchived, setIsArchived] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    job_role_id: '',
    start_time: '09:00',
    end_time: '17:00',
    min_staff: 1,
    max_staff: 1,
    revenue_to_staff_ratio: null,
    priority: 3,
    required_skill_level: null,
    archived: false
  });

  useEffect(() => {
    // Initialize selected days based on the provided day parameter
    if (isOpen) {
      const initialDays = {};
      days.forEach(d => {
        initialDays[d.id] = day ? d.id === day : false;
      });
      setSelectedDays(initialDays);
      
      // Initialize form with editingShift data if provided
      if (editingShift) {
        setFormData({
          name: editingShift.name || '',
          job_role_id: editingShift.job_role_id || '',
          start_time: editingShift.start_time || '09:00',
          end_time: editingShift.end_time || '17:00',
          min_staff: editingShift.min_staff || 1,
          max_staff: editingShift.max_staff || 1,
          revenue_to_staff_ratio: editingShift.revenue_to_staff_ratio || null,
          priority: editingShift.priority || 3,
          required_skill_level: editingShift.required_skill_level || null,
          archived: editingShift.archived || false
        });
        
        setIsArchived(!!editingShift.archived);
        
        // When editing, select the day of the shift
        if (editingShift.day_of_week) {
          const editDays = {};
          days.forEach(d => {
            editDays[d.id] = d.id === editingShift.day_of_week;
          });
          setSelectedDays(editDays);
        }
      } else {
        // Reset form for new shift creation
        setFormData({
          name: '',
          job_role_id: '',
          start_time: '09:00',
          end_time: '17:00',
          min_staff: 1,
          max_staff: 1,
          revenue_to_staff_ratio: null,
          priority: 3,
          required_skill_level: null,
          archived: false
        });
        setIsArchived(false);
      }
      
      // Fetch available shift templates
      fetchTemplates();
    }
  }, [isOpen, day, editingShift]);

  const fetchTemplates = async () => {
    if (locationId) {
      try {
        const { data, error } = await supabase
          .from('shift_templates')
          .select('*')
          .eq('location_id', locationId);
          
        if (error) throw error;
        setShiftTemplates(data || []);
      } catch (error) {
        console.error('Error fetching shift templates:', error);
      }
    }
  };

  const handleDayChange = (dayId, checked) => {
    setSelectedDays(prev => ({
      ...prev,
      [dayId]: checked
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateSelect = (templateId) => {
    if (!templateId) {
      setSelectedTemplate(null);
      return;
    }
    
    const template = shiftTemplates.find(t => t.id === templateId);
    if (template && template.shift_blocks && template.shift_blocks.length > 0) {
      // Use the first shift block as the template
      const shiftBlock = template.shift_blocks[0];
      setFormData(prev => ({
        ...prev,
        name: shiftBlock.name || template.name,
        job_role_id: shiftBlock.job_role_id || '',
        start_time: shiftBlock.start_time || '09:00',
        end_time: shiftBlock.end_time || '17:00',
        min_staff: shiftBlock.min_staff || 1,
        max_staff: shiftBlock.max_staff || 1,
        priority: shiftBlock.priority || 3,
        revenue_to_staff_ratio: shiftBlock.revenue_to_staff_ratio || null,
        required_skill_level: shiftBlock.required_skill_level || null,
        archived: false
      }));
      setSelectedTemplate(template);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.job_role_id) {
      toast("Please select a job role", {
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
      return;
    }
    
    // Check if at least one day is selected
    const selectedDaysList = Object.keys(selectedDays).filter(dayId => selectedDays[dayId]);
    if (selectedDaysList.length === 0) {
      toast("Please select at least one day", {
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editingShift) {
        // Update existing shift rule
        const { error: shiftRuleError } = await supabase
          .from('shift_rules')
          .update({
            name: formData.name,
            job_role_id: formData.job_role_id,
            start_time: formData.start_time,
            end_time: formData.end_time,
            min_staff: formData.min_staff,
            max_staff: formData.max_staff,
            priority: formData.priority,
            revenue_to_staff_ratio: formData.revenue_to_staff_ratio,
            required_skill_level: formData.required_skill_level,
            archived: isArchived
          })
          .eq('id', editingShift.id);
          
        if (shiftRuleError) throw shiftRuleError;
        
        toast.success("Shift rule updated", {
          description: "The shift rule has been updated successfully.",
        });
      } else {
        // Create shift rules for each selected day
        const shiftRules = selectedDaysList.map(dayId => ({
          location_id: locationId,
          day_of_week: dayId,
          name: formData.name,
          job_role_id: formData.job_role_id,
          start_time: formData.start_time,
          end_time: formData.end_time,
          min_staff: formData.min_staff,
          max_staff: formData.max_staff,
          priority: formData.priority,
          revenue_to_staff_ratio: formData.revenue_to_staff_ratio,
          required_skill_level: formData.required_skill_level,
          archived: isArchived
        }));
        
        const { data: shiftRuleData, error: shiftRuleError } = await supabase
          .from('shift_rules')
          .insert(shiftRules);
          
        if (shiftRuleError) throw shiftRuleError;
        
        // If this is a new template name that doesn't exist yet, save it as a template
        if (formData.name && !selectedTemplate) {
          const templateExists = shiftTemplates.some(t => t.name.toLowerCase() === formData.name.toLowerCase());
          
          if (!templateExists) {
            const shiftBlock = {
              name: formData.name,
              job_role_id: formData.job_role_id,
              start_time: formData.start_time,
              end_time: formData.end_time,
              min_staff: formData.min_staff,
              max_staff: formData.max_staff,
              priority: formData.priority,
              revenue_to_staff_ratio: formData.revenue_to_staff_ratio,
              required_skill_level: formData.required_skill_level
            };
            
            const { error: templateError } = await supabase
              .from('shift_templates')
              .insert({
                location_id: locationId,
                day_of_week: selectedDaysList[0], // Use the first selected day for the template
                name: formData.name,
                shift_blocks: [shiftBlock]
              });
              
            if (templateError) {
              console.error('Error saving shift template:', templateError);
            }
          }
        }
        
        toast.success("Shift rule(s) created", {
          description: `Added shift rules for ${selectedDaysList.length} day(s).`,
        });
      }
      
      onSubmitComplete();
      onClose();
    } catch (error) {
      console.error('Error creating/updating shift rules:', error);
      toast.error("Error with shift rules", {
        description: error.message || "There was a problem with the shift rules.",
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingShift ? 'Edit Shift Rule' : 'Add Shift Rule'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Shift Name</Label>
            <Input
              id="name"
              placeholder="e.g. Manager Weekday - Day"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          {shiftTemplates.length > 0 && !editingShift && (
            <div className="space-y-2">
              <Label htmlFor="template">Use Template</Label>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {shiftTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Apply to Days</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {days.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`day-${day.id}`} 
                    checked={selectedDays[day.id]}
                    disabled={editingShift} // Disable day selection when editing
                    onCheckedChange={(checked) => handleDayChange(day.id, checked)}
                  />
                  <Label htmlFor={`day-${day.id}`} className="text-sm">{day.name}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Job Role</Label>
            <Select 
              value={formData.job_role_id} 
              onValueChange={(value) => handleChange('job_role_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {jobRoles?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_staff">Minimum Staff</Label>
              <Input
                id="min_staff"
                type="number"
                min="1"
                value={formData.min_staff}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  handleChange('min_staff', value);
                  if (value > formData.max_staff) {
                    handleChange('max_staff', value);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_staff">Maximum Staff</Label>
              <Input
                id="max_staff"
                type="number"
                min={formData.min_staff}
                value={formData.max_staff}
                onChange={(e) => handleChange('max_staff', parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="priority">Priority (1-5)</Label>
              <span className="text-sm text-muted-foreground">{formData.priority}/5</span>
            </div>
            <Slider
              id="priority"
              min={1}
              max={5}
              step={1}
              value={[formData.priority]}
              onValueChange={(value) => handleChange('priority', value[0])}
              className="pt-2"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="revenue_ratio">
              Revenue to Staff Ratio (£ per staff member, optional)
            </Label>
            <Input
              id="revenue_ratio"
              type="number"
              placeholder="Optional"
              min="0"
              step="0.01"
              value={formData.revenue_to_staff_ratio || ''}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : null;
                handleChange('revenue_to_staff_ratio', value);
              }}
            />
          </div>

          {editingShift && (
            <div className="flex items-center space-x-2">
              <Switch 
                id="archived"
                checked={isArchived}
                onCheckedChange={setIsArchived}
              />
              <Label htmlFor="archived">Archive this shift</Label>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingShift ? 'Update Shift Rule' : 'Save Shift Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
