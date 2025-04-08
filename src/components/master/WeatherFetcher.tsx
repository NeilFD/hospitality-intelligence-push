
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CloudSun, Loader2 } from 'lucide-react';

interface WeatherFetcherProps {
  date: string;
  onWeatherFetched: (weatherData: {
    description: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
  }) => void;
}

const WeatherFetcher: React.FC<WeatherFetcherProps> = ({ date, onWeatherFetched }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This is a mock implementation - in a real app, you would call a weather API
      // Example using Open-Meteo (which is free and doesn't require API key)
      // You would add actual implementation using fetch() here
      
      // For now, we'll just simulate a weather response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock weather data
      const mockWeatherData = {
        description: "Partly Cloudy",
        temperature: 18.5,
        precipitation: 0.2,
        windSpeed: 12.4
      };
      
      onWeatherFetched(mockWeatherData);
    } catch (err) {
      setError('Failed to fetch weather data. Please try again.');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-50">
      <CardContent className="pt-4">
        <div className="flex items-center gap-4">
          <CloudSun className="h-6 w-6 text-blue-500" />
          <div className="flex-grow">
            <h4 className="text-sm font-medium">Weather Data for {date}</h4>
            <p className="text-xs text-muted-foreground">GL50 3DN</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchWeather}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {loading ? "Loading..." : "Fetch Weather"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
};

export default WeatherFetcher;
