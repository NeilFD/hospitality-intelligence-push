import React, { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { CloudSun, Loader2 } from 'lucide-react';
import { WeatherData } from '@/types/master-record-types';
import { toast } from 'sonner';

interface WeatherFetcherProps {
  date: string;
  onWeatherFetched: (weatherData: WeatherData) => void;
}

const WeatherFetcher: React.FC<WeatherFetcherProps> = ({ date, onWeatherFetched }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (loading) return; // Prevent multiple concurrent requests
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert date to format required by the weather API
      const dateObj = new Date(date);
      
      // Open-Meteo API for historical weather data for Cheltenham (GL50 3DN)
      // Coordinates for GL50 3DN: 51.9002, -2.0731
      const latitude = 51.9002;
      const longitude = -2.0731;
      
      // Fetch historical weather data for the specific date
      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?` +
        `latitude=${latitude}&longitude=${longitude}` +
        `&start_date=${date}&end_date=${date}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
        `&timezone=Europe/London`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the weather data
      const avgTemp = Math.round((data.daily.temperature_2m_max[0] + data.daily.temperature_2m_min[0]) / 2);
      const precipitation = data.daily.precipitation_sum[0] || 0;
      const windSpeed = data.daily.wind_speed_10m_max[0] || 0;
      
      // Determine weather description based on conditions
      let description = "Clear";
      if (precipitation > 5) {
        description = "Heavy Rain";
      } else if (precipitation > 1) {
        description = "Light Rain";
      } else if (precipitation > 0) {
        description = "Drizzle";
      } else if (windSpeed > 30) {
        description = "Windy";
      } else if (avgTemp > 25) {
        description = "Hot";
      } else if (avgTemp < 5) {
        description = "Cold";
      } else {
        description = "Mild";
      }
      
      const weatherData: WeatherData = {
        description: description,
        temperature: avgTemp,
        precipitation: precipitation,
        windSpeed: windSpeed
      };
      
      onWeatherFetched(weatherData);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Failed to fetch weather data. Please try again.');
      toast.error("Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  }, [date, onWeatherFetched, loading]);

  return (
    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
      <div className="flex items-center gap-2">
        <CloudSun className="h-4 w-4 text-blue-500" />
        <div>
          <p className="text-xs font-medium">Weather for {date}</p>
          <p className="text-xs text-muted-foreground">GL50 3DN</p>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={fetchWeather}
        disabled={loading}
        className="h-7 text-xs px-2"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
        {loading ? "Loading..." : "Fetch"}
      </Button>
    </div>
  );
};

export default memo(WeatherFetcher);
