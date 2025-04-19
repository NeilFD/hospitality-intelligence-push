
export const generateRevenueForecast = async (
  startDate: string,
  endDate: string,
  useAveragesOnly: boolean = false
): Promise<RevenueForecast[]> => {
  console.log(`Generating revenue forecast from ${startDate} to ${endDate}`);
  
  let weatherForecast: WeatherForecast[] = [];
  try {
    weatherForecast = await fetchWeatherForecast(startDate, endDate);
  } catch (error) {
    console.warn('Unable to fetch weather forecast, using default values');
    // Generate default placeholders if weather fetch fails
    const start = new Date(startDate);
    const end = new Date(endDate);
    weatherForecast = [];
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      weatherForecast.push({
        date: format(day, 'yyyy-MM-dd'),
        description: 'N/A',
        temperature: 15,
        precipitation: 0,
        windSpeed: 0
      });
    }
  }
  
  const currentDate = new Date();
  const dayOfWeekBaselines = await calculateDayOfWeekBaselines(currentDate);
  
  // Only fetch weather impact if we're not using averages only
  const weatherImpact = useAveragesOnly ? null : await analyzeWeatherImpact(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    3
  );
  
  const revenueForecast: RevenueForecast[] = [];
  
  for (const forecast of weatherForecast) {
    const date = forecast.date;
    const dayOfWeek = getDayName(date);
    const baseline = dayOfWeekBaselines[dayOfWeek];
    
    let foodRevenue = baseline.avgFoodRevenue;
    let bevRevenue = baseline.avgBevRevenue;
    let confidence = baseline.count >= 10 ? 85 : 
                    baseline.count >= 5 ? 75 : 
                    baseline.count > 0 ? 65 : 50;
    
    // Only apply weather impacts if we're not using averages only
    if (!useAveragesOnly && weatherImpact) {
      const weatherCondition = forecast.description === 'N/A' ? 'Unknown' : mapToGeneralWeatherCondition(forecast.description);
      
      if (weatherImpact[dayOfWeek]?.[weatherCondition]?.count > 0) {
        const impact = weatherImpact[dayOfWeek][weatherCondition];
        const foodImpactMultiplier = impact.averageFoodRevenue / baseline.avgFoodRevenue;
        const bevImpactMultiplier = impact.averageBevRevenue / baseline.avgBevRevenue;
        
        if (!isNaN(foodImpactMultiplier) && isFinite(foodImpactMultiplier)) {
          foodRevenue *= foodImpactMultiplier;
        }
        if (!isNaN(bevImpactMultiplier) && isFinite(bevImpactMultiplier)) {
          bevRevenue *= bevImpactMultiplier;
        }
        
        if (impact.count >= 5) {
          confidence = Math.min(confidence + 10, 95);
        }
      }
      
      // Reduce confidence if weather data is unavailable
      if (forecast.description === 'N/A') {
        confidence = Math.max(confidence - 20, 30);
      }
    }
    
    revenueForecast.push({
      date,
      dayOfWeek,
      foodRevenue,
      beverageRevenue: bevRevenue,
      totalRevenue: foodRevenue + bevRevenue,
      weatherDescription: forecast.description === 'N/A' ? 'No weather data' : forecast.description,
      temperature: forecast.description === 'N/A' ? 0 : forecast.temperature,
      precipitation: forecast.description === 'N/A' ? 0 : forecast.precipitation,
      windSpeed: forecast.description === 'N/A' ? 0 : forecast.windSpeed,
      confidence: useAveragesOnly ? 60 : confidence
    });
  }
  
  return revenueForecast;
};
