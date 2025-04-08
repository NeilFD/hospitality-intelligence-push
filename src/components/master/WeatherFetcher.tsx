
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  const fetchWeather = async () => {
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
      const avgTemp = (data.daily.temperature_2m_max[0] + data.daily.temperature_2m_min[0]) / 2;
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
      toast.success("Weather data fetched successfully!");
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Failed to fetch weather data. Please try again.');
      toast.error("Failed to fetch weather data");
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
            <p className="text-xs text-muted-foreground">GL50 3DN (Cheltenham)</p>
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
