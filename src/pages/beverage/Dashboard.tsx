
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Calendar, Settings, BarChart3 } from 'lucide-react';
import MonthSelector from '@/components/MonthSelector';
import StatusBox from '@/components/StatusBox';
import { getTrackerSummaryByMonth } from '@/services/kitchen-service';
import SyncTrackerDataButton from '@/components/SyncTrackerDataButton';

const BeverageDashboard = () => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [summary, setSummary] = useState({ revenue: 0, cost: 0, gpPercentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getTrackerSummaryByMonth(year, month, 'beverage');
        setSummary(data);
      } catch (error) {
        console.error('Error fetching beverage tracker summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month]);

  const handleMonthChange = (newMonth: number, newYear: number) => {
    setMonth(newMonth);
    setYear(newYear);
  };

  const statusColor = summary.gpPercentage >= 0.68 ? 'green' : 'red';
  const formattedGP = (summary.gpPercentage * 100).toFixed(1);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Beverage Controller Dashboard</h1>
        <MonthSelector 
          initialYear={year} 
          initialMonth={month} 
          onChange={handleMonthChange} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatusBox 
          label="Beverage Revenue" 
          value={`£${summary.revenue.toLocaleString()}`} 
          status="neutral" 
          icon={<BarChart3 />}
          loading={loading}
        />
        <StatusBox 
          label="Beverage Cost" 
          value={`£${summary.cost.toLocaleString()}`} 
          status="neutral" 
          icon={<BarChart3 />}
          loading={loading}
        />
        <StatusBox 
          label="Beverage GP %" 
          value={`${formattedGP}%`} 
          status={statusColor === 'green' ? 'good' : 'bad'} 
          icon={<BarChart3 />}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Weekly Beverage Tracker</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-gray-600 mb-4">Track your beverage purchases, revenue, and keep an eye on your GP %.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate('/beverage/weekly-tracker')} className="w-full sm:w-auto">
                <FileText className="mr-2 h-5 w-5" /> Open Weekly Tracker
              </Button>
              <SyncTrackerDataButton moduleType="beverage" year={year} month={month} className="w-full sm:w-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-gray-600 mb-4">View your monthly beverage control summary and analytics.</p>
            <Button onClick={() => navigate('/beverage/month-summary')} className="w-full sm:w-auto">
              <Calendar className="mr-2 h-5 w-5" /> View Monthly Summary
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Annual Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-gray-600 mb-4">View annual beverage control trends and yearly performance.</p>
            <Button onClick={() => navigate('/beverage/annual-summary')} className="w-full sm:w-auto">
              <BarChart3 className="mr-2 h-5 w-5" /> View Annual Summary
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Beverage Control Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-gray-600 mb-4">Manage your beverage suppliers, GP targets and other settings.</p>
            <Button onClick={() => navigate('/beverage/settings')} className="w-full sm:w-auto">
              <Settings className="mr-2 h-5 w-5" /> Manage Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BeverageDashboard;
