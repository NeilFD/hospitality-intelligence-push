
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { DollarSign, Clock, Save, Loader } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const DAYS_OF_WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const EMPLOYMENT_TYPES = ['hourly', 'salaried', 'contract'];

export default function ProfileJobDataTab({ profile, setProfile }) {
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    wage_rate: profile.wage_rate || 0,
    employment_type: profile.employment_type || 'hourly',
    min_hours_per_day: profile.min_hours_per_day || 0,
    max_hours_per_day: profile.max_hours_per_day || 12,
    min_hours_per_week: profile.min_hours_per_week || 0,
    max_hours_per_week: profile.max_hours_per_week || 40,
    performance_score: profile.performance_score || 0,
    job_role_id: profile.job_role_id || '',
  });
  
  // Initialize availability data from profile or with default structure
  const [availability, setAvailability] = useState<any[]>(() => {
    if (profile.enhanced_availability && Array.isArray(profile.enhanced_availability) && profile.enhanced_availability.length > 0) {
      return profile.enhanced_availability;
    }
    
    // Create default availability structure for each day of the week
    return DAYS_OF_WEEK.map(day => ({
      day_of_week: day,
      preferred: false,
      cannot_work: false,
      day_availability: true, // 10:00-17:00
      evening_availability: true, // 17:00-00:00
    }));
  });

  useEffect(() => {
    fetchJobRoles();
  }, []);

  const fetchJobRoles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_roles')
        .select('*');
        
      if (error) throw error;
      setJobRoles(data || []);
    } catch (error) {
      console.error('Error fetching job roles:', error);
      toast.error('Failed to load job roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('hours') || name === 'wage_rate' || name === 'performance_score' ? 
        parseFloat(value) : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvailabilityChange = (index, field, value) => {
    setAvailability(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      
      // If marking as "cannot work", set preferred to false
      if (field === 'cannot_work' && value === true) {
        updated[index].preferred = false;
        
        // Also set availability to false if cannot work
        if (value) {
          updated[index].day_availability = false;
          updated[index].evening_availability = false;
        }
      }
      
      // If marking as "preferred", set cannot_work to false
      if (field === 'preferred' && value === true) {
        updated[index].cannot_work = false;
      }
      
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          wage_rate: formData.wage_rate,
          employment_type: formData.employment_type,
          min_hours_per_day: formData.min_hours_per_day,
          max_hours_per_day: formData.max_hours_per_day,
          min_hours_per_week: formData.min_hours_per_week,
          max_hours_per_week: formData.max_hours_per_week,
          performance_score: formData.performance_score,
          job_role_id: formData.job_role_id || null,
          enhanced_availability: availability,
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      // Update the profile state
      setProfile({
        ...profile,
        wage_rate: formData.wage_rate,
        employment_type: formData.employment_type,
        min_hours_per_day: formData.min_hours_per_day,
        max_hours_per_day: formData.max_hours_per_day,
        min_hours_per_week: formData.min_hours_per_week,
        max_hours_per_week: formData.max_hours_per_week,
        performance_score: formData.performance_score,
        job_role_id: formData.job_role_id || null,
        enhanced_availability: availability,
      });
      
      toast.success('Job data saved successfully');
    } catch (error) {
      console.error('Error saving job data:', error);
      toast.error('Failed to save job data');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Job Data</h2>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <><Loader className="h-4 w-4 animate-spin" /> Saving</>
          ) : (
            <><Save className="h-4 w-4" /> Save Changes</>
          )}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            Compensation & Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wage_rate">Wage Rate</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                <Input
                  id="wage_rate"
                  name="wage_rate"
                  type="number"
                  value={formData.wage_rate}
                  onChange={handleInputChange}
                  className="pl-8"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employment_type">Employment Type</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => handleSelectChange('employment_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="job_role_id">Job Role</Label>
            <Select
              value={formData.job_role_id}
              onValueChange={(value) => handleSelectChange('job_role_id', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {jobRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="performance_score">Performance Score</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="performance_score"
                min={0}
                max={100}
                step={1}
                value={[formData.performance_score]}
                onValueChange={(values) => handleSelectChange('performance_score', values[0])}
                className="flex-1"
              />
              <span className="w-12 text-center font-medium">{formData.performance_score}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Working Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-md font-medium mb-4">Hours per Day</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_hours_per_day">Minimum Hours</Label>
                <Input
                  id="min_hours_per_day"
                  name="min_hours_per_day"
                  type="number"
                  value={formData.min_hours_per_day}
                  onChange={handleInputChange}
                  min="0"
                  max="24"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_hours_per_day">Maximum Hours</Label>
                <Input
                  id="max_hours_per_day"
                  name="max_hours_per_day"
                  type="number"
                  value={formData.max_hours_per_day}
                  onChange={handleInputChange}
                  min="0"
                  max="24"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-4">Hours per Week</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_hours_per_week">Minimum Hours</Label>
                <Input
                  id="min_hours_per_week"
                  name="min_hours_per_week"
                  type="number"
                  value={formData.min_hours_per_week}
                  onChange={handleInputChange}
                  min="0"
                  max="168"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_hours_per_week">Maximum Hours</Label>
                <Input
                  id="max_hours_per_week"
                  name="max_hours_per_week"
                  type="number"
                  value={formData.max_hours_per_week}
                  onChange={handleInputChange}
                  min="0"
                  max="168"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="py-2 text-left">Day</th>
                  <th className="py-2 text-center">Preferred</th>
                  <th className="py-2 text-center">Cannot Work</th>
                  <th className="py-2 text-center">Day<br />(10:00-17:00)</th>
                  <th className="py-2 text-center">Evening<br />(17:00-00:00)</th>
                </tr>
              </thead>
              <tbody>
                {availability.map((day, index) => (
                  <tr key={day.day_of_week} className="border-t">
                    <td className="py-3 font-medium">{DAY_LABELS[day.day_of_week]}</td>
                    <td className="py-3 text-center">
                      <Switch
                        checked={day.preferred}
                        onCheckedChange={(checked) => 
                          handleAvailabilityChange(index, 'preferred', checked)
                        }
                        disabled={day.cannot_work}
                      />
                    </td>
                    <td className="py-3 text-center">
                      <Switch
                        checked={day.cannot_work}
                        onCheckedChange={(checked) => 
                          handleAvailabilityChange(index, 'cannot_work', checked)
                        }
                        disabled={day.preferred}
                      />
                    </td>
                    <td className="py-3 text-center">
                      <Switch
                        checked={day.day_availability}
                        onCheckedChange={(checked) => 
                          handleAvailabilityChange(index, 'day_availability', checked)
                        }
                        disabled={day.cannot_work}
                      />
                    </td>
                    <td className="py-3 text-center">
                      <Switch
                        checked={day.evening_availability}
                        onCheckedChange={(checked) => 
                          handleAvailabilityChange(index, 'evening_availability', checked)
                        }
                        disabled={day.cannot_work}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
