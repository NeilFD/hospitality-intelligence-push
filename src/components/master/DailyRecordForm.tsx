import React, { useMemo, useCallback, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { MasterDailyRecord } from '@/types/master-record-types';
import WeatherFetcher from './WeatherFetcher';
import { toast } from 'sonner';
import { CheckCircle2, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
// Remove the problematic usePDF import
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface DailyRecordFormProps {
  date: string;
  dayOfWeek: string;
  initialData?: Partial<MasterDailyRecord>;
  onSave: (data: Partial<MasterDailyRecord>) => Promise<void>;
}

// Create PDF document component
const PDFDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Daily Record Report</Text>
        <Text style={styles.subtitle}>{format(new Date(data.date), 'MMMM d, yyyy')} ({data.dayOfWeek})</Text>
        
        <View style={styles.group}>
          <Text style={styles.heading}>Revenue & Covers</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Food Revenue:</Text>
              <Text>£{data.foodRevenue?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Beverage Revenue:</Text>
              <Text>£{data.beverageRevenue?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Lunch Covers:</Text>
              <Text>{data.lunchCovers || '0'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Dinner Covers:</Text>
              <Text>{data.dinnerCovers || '0'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Total Revenue:</Text>
              <Text>£{((data.foodRevenue || 0) + (data.beverageRevenue || 0)).toFixed(2)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Total Covers:</Text>
              <Text>{(data.lunchCovers || 0) + (data.dinnerCovers || 0)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.group}>
          <Text style={styles.heading}>Weather Conditions</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Description:</Text>
              <Text>{data.weatherDescription || 'Not recorded'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Temperature:</Text>
              <Text>{data.temperature || 0}°C</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.group}>
          <Text style={styles.heading}>Additional Information</Text>
          <Text style={styles.label}>Local Events:</Text>
          <Text style={styles.note}>{data.localEvents || 'None recorded'}</Text>
          <Text style={styles.label}>Operations Notes:</Text>
          <Text style={styles.note}>{data.operationsNotes || 'None recorded'}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  section: {
    margin: 10,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  group: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  col: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  note: {
    backgroundColor: '#f5f5f5',
    padding: 5,
    marginBottom: 10,
  }
});

const DailyRecordForm: React.FC<DailyRecordFormProps> = React.memo(({ 
  date, 
  dayOfWeek, 
  initialData = {}, 
  onSave 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  
  const defaultValues = useMemo(() => ({
    date,
    dayOfWeek,
    foodRevenue: initialData.foodRevenue || 0,
    beverageRevenue: initialData.beverageRevenue || 0,
    lunchCovers: initialData.lunchCovers || 0,
    dinnerCovers: initialData.dinnerCovers || 0,
    weatherDescription: initialData.weatherDescription || '',
    temperature: Math.round(initialData.temperature || 0),
    precipitation: initialData.precipitation || 0,
    windSpeed: initialData.windSpeed || 0,
    localEvents: initialData.localEvents || '',
    operationsNotes: initialData.operationsNotes || '',
    dayFohTeam: initialData.dayFohTeam || '',
    dayFohManager: initialData.dayFohManager || '',
    dayKitchenTeam: initialData.dayKitchenTeam || '',
    dayKitchenManager: initialData.dayKitchenManager || '',
    eveningFohTeam: initialData.eveningFohTeam || '',
    eveningFohManager: initialData.eveningFohManager || '',
    eveningKitchenTeam: initialData.eveningKitchenTeam || '',
    eveningKitchenManager: initialData.eveningKitchenManager || '',
  }), [date, dayOfWeek, initialData]);

  const form = useForm<Partial<MasterDailyRecord>>({
    defaultValues
  });

  const totalRevenue = useMemo(() => {
    const foodRev = form.watch('foodRevenue') || 0;
    const bevRev = form.watch('beverageRevenue') || 0;
    return foodRev + bevRev;
  }, [form.watch('foodRevenue'), form.watch('beverageRevenue')]);

  const totalCovers = useMemo(() => {
    const lunch = form.watch('lunchCovers') || 0;
    const dinner = form.watch('dinnerCovers') || 0;
    return lunch + dinner;
  }, [form.watch('lunchCovers'), form.watch('dinnerCovers')]);

  const averageCoverSpend = useMemo(() => {
    return totalCovers > 0 ? totalRevenue / totalCovers : 0;
  }, [totalRevenue, totalCovers]);

  const handleWeatherFetched = useCallback((weatherData: {
    description: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
  }) => {
    form.setValue('weatherDescription', weatherData.description);
    form.setValue('temperature', Math.round(weatherData.temperature));
    form.setValue('precipitation', weatherData.precipitation);
    form.setValue('windSpeed', weatherData.windSpeed);
    toast.success('Weather data fetched successfully');
  }, [form]);

  const handleSubmit = useCallback(async (data: Partial<MasterDailyRecord>) => {
    setIsSaving(true);
    try {
      await onSave(data);
      toast.success('Daily record saved successfully', {
        description: `Record for ${date} has been updated`,
        icon: <CheckCircle2 className="text-green-500" />
      });
    } catch (error) {
      console.error('Error saving daily record:', error);
      toast.error('Failed to save daily record');
    } finally {
      setIsSaving(false);
    }
  }, [onSave, date]);
  
  const handleEmailClick = useCallback(async () => {
    setIsPdfDialogOpen(true);
    setIsGeneratingPdf(true);
    
    try {
      // Generate PDF using @react-pdf/renderer
      const formData = form.getValues();
      const pdfDoc = <PDFDocument data={formData} />;
      const blob = await pdf(pdfDoc).toBlob();
      const dataUrl = URL.createObjectURL(blob);
      setPdfUrl(dataUrl);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Could not generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [form]);
  
  const handleSendEmail = useCallback(() => {
    if (pdfUrl) {
      const formattedDate = format(new Date(date), 'MMMM d, yyyy');
      const subject = `Daily Record Report - ${formattedDate}`;
      const body = `Please find attached the daily record report for ${formattedDate}.`;
      
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      window.open(mailtoLink, '_blank');
      
      setIsPdfDialogOpen(false);
      setPdfUrl(null);
      
      toast.success('Email prepared successfully', {
        description: 'The report has been attached to a new email'
      });
    }
  }, [pdfUrl, date]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card className="border-0 shadow-none">
            <CardHeader className="pt-3 pb-2 px-4">
              <CardTitle className="text-base font-medium">{date} ({dayOfWeek})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <FormField
                  control={form.control}
                  name="foodRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Food Revenue (£)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01" 
                          placeholder="0.00"
                          className="h-8 text-sm"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="beverageRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Beverage Revenue (£)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          className="h-8 text-sm"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lunchCovers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Lunch Covers</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          className="h-8 text-sm"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dinnerCovers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Dinner Covers</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          className="h-8 text-sm"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-md">
                <div>
                  <span className="text-xs font-medium block text-gray-600">Total Revenue (£)</span>
                  <span className="text-base font-semibold">{totalRevenue.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-xs font-medium block text-gray-600">Total Covers</span>
                  <span className="text-base font-semibold">{totalCovers}</span>
                </div>
                <div>
                  <span className="text-xs font-medium block text-gray-600">Average Spend/Cover (£)</span>
                  <span className="text-base font-semibold">{averageCoverSpend.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-3">Team on Duty</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                  <div className="border rounded-md p-3">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Day FOH</h4>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="dayFohManager"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Manager</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Manager name"
                                className="h-8 text-sm"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dayFohTeam"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Team members</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Team members and their roles"
                                className="min-h-[60px] text-sm"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Day Kitchen</h4>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="dayKitchenManager"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Manager</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Manager name"
                                className="h-8 text-sm"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dayKitchenTeam"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Team members</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Team members and their roles"
                                className="min-h-[60px] text-sm"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Evening FOH</h4>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="eveningFohManager"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Manager</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Manager name"
                                className="h-8 text-sm"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="eveningFohTeam"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Team members</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Team members and their roles"
                                className="min-h-[60px] text-sm"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Evening Kitchen</h4>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="eveningKitchenManager"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Manager</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Manager name"
                                className="h-8 text-sm"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="eveningKitchenTeam"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Team members</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Team members and their roles"
                                className="min-h-[60px] text-sm"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <WeatherFetcher 
                date={date}
                onWeatherFetched={handleWeatherFetched}
              />
              
              <div className="grid grid-cols-3 gap-3 mt-2">
                <FormField
                  control={form.control}
                  name="weatherDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Weather</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Description"
                          className="h-8 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Temperature (°C)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          className="h-8 text-sm"
                          {...field}
                          onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value) || 0))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="windSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Wind Speed (km/h)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="0.0"
                          className="h-8 text-sm"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="localEvents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Local Events</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Local events info"
                          className="min-h-[60px] text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="operationsNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Operations Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Operations notes"
                          className="min-h-[60px] text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="py-2 px-4 flex justify-end gap-2">
              <Button 
                type="button" 
                size="sm" 
                variant="outline"
                onClick={handleEmailClick}
                className="flex gap-2 items-center"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                disabled={isSaving}
                className="min-w-[100px]"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
      
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Daily Record Report</DialogTitle>
            <DialogDescription>
              Review the report before sending it via email
            </DialogDescription>
          </DialogHeader>
          
          {isGeneratingPdf ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-tavern-blue" />
              <span className="ml-2 text-tavern-blue">Generating PDF...</span>
            </div>
          ) : (
            <>
              <div className="mt-4 border rounded-md p-2 bg-white">
                <div ref={pdfRef} className="p-8 bg-white">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold">Daily Record Report</h1>
                    <p className="text-gray-500">{format(new Date(date), 'MMMM d, yyyy')} ({dayOfWeek})</p>
                  </div>
                  
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">Revenue & Covers</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Food Revenue:</p>
                        <p className="text-lg">£{form.getValues('foodRevenue')?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Beverage Revenue:</p>
                        <p className="text-lg">£{form.getValues('beverageRevenue')?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Lunch Covers:</p>
                        <p className="text-lg">{form.getValues('lunchCovers') || '0'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Dinner Covers:</p>
                        <p className="text-lg">{form.getValues('dinnerCovers') || '0'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Total Revenue:</p>
                        <p className="text-lg font-semibold">£{totalRevenue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Total Covers:</p>
                        <p className="text-lg font-semibold">{totalCovers}</p>
                      </div>
                      <div>
                        <p className="font-medium">Average Spend/Cover:</p>
                        <p className="text-lg font-semibold">£{averageCoverSpend.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">Team on Duty</h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">Day FOH</h3>
                        <p className="mb-1"><span className="font-medium">Manager:</span> {form.getValues('dayFohManager') || 'Not specified'}</p>
                        <p><span className="font-medium">Team:</span> {form.getValues('dayFohTeam') || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Day Kitchen</h3>
                        <p className="mb-1"><span className="font-medium">Manager:</span> {form.getValues('dayKitchenManager') || 'Not specified'}</p>
                        <p><span className="font-medium">Team:</span> {form.getValues('dayKitchenTeam') || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Evening FOH</h3>
                        <p className="mb-1"><span className="font-medium">Manager:</span> {form.getValues('eveningFohManager') || 'Not specified'}</p>
                        <p><span className="font-medium">Team:</span> {form.getValues('eveningFohTeam') || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Evening Kitchen</h3>
                        <p className="mb-1"><span className="font-medium">Manager:</span> {form.getValues('eveningKitchenManager') || 'Not specified'}</p>
                        <p><span className="font-medium">Team:</span> {form.getValues('eveningKitchenTeam') || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">Weather Conditions</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Description:</p>
                        <p>{form.getValues('weatherDescription') || 'Not recorded'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Temperature:</p>
                        <p>{form.getValues('temperature')}°C</p>
                      </div>
                      <div>
                        <p className="font-medium">Wind Speed:</p>
                        <p>{form.getValues('windSpeed')} km/h</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">Additional Information</h2>
                    <div className="mb-4">
                      <p className="font-medium mb-1">Local Events:</p>
                      <p className="bg-gray-50 p-3 rounded">{form.getValues('localEvents') || 'None recorded'}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Operations Notes:</p>
                      <p className="bg-gray-50 p-3 rounded">{form.getValues('operationsNotes') || 'None recorded'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {pdfUrl && (
                <iframe 
                  src={pdfUrl} 
                  className="w-full h-[500px] border rounded mt-4" 
                  title="PDF Preview"
                />
              )}
            </>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPdfDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSendEmail}
              disabled={!pdfUrl || isGeneratingPdf}
            >
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

DailyRecordForm.displayName = 'DailyRecordForm';

export default DailyRecordForm;
