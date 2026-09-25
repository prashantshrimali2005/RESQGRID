import { useEffect, useState } from 'react';
import { Cloud, CloudLightning, CloudRain, Sun, Wind, AlertTriangle, Loader2 } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
  windSpeed: number;
  isSevere: boolean;
  alertMsg?: string;
}

export function WeatherWidget({ lat = 31.25471, lng = 75.70434 }: { lat?: number, lng?: number }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        // Open-Meteo API for current weather
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`);
        const data = await res.json();
        
        if (data.current) {
          const code = data.current.weather_code;
          let condition = 'Clear';
          let isSevere = false;
          let alertMsg = '';
          
          if (code >= 1 && code <= 3) condition = 'Partly Cloudy';
          else if (code >= 45 && code <= 48) condition = 'Foggy';
          else if (code >= 51 && code <= 65) condition = 'Rainy';
          else if (code > 65 && code <= 67) {
            condition = 'Heavy Rain';
            isSevere = true;
            alertMsg = 'Heavy Rain Warning: Potential for localized flooding and reduced visibility. Drive safely.';
          }
          else if (code >= 71 && code <= 75) condition = 'Snowy';
          else if (code > 75 && code <= 82) {
            condition = 'Heavy Snow';
            isSevere = true;
            alertMsg = 'Heavy Snow Warning: Dangerous travel conditions expected. Stay indoors if possible.';
          }
          else if (code >= 95 && code <= 99) {
            condition = 'Thunderstorm';
            isSevere = true;
            alertMsg = 'Severe Thunderstorm Warning: Seek shelter immediately. Potential for lightning and strong winds.';
          }

          setWeather({
            temp: Math.round(data.current.temperature_2m),
            windSpeed: data.current.wind_speed_10m,
            condition,
            isSevere,
            alertMsg
          });
        }
      } catch (err) {
        console.error("Failed to fetch weather:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-card border border-border-light flex items-center justify-center min-h-[100px]">
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!weather) return null;

  const WeatherIcon = () => {
    if (weather.condition.includes('Thunderstorm')) return <CloudLightning className="w-8 h-8 text-critical" />;
    if (weather.condition.includes('Rain')) return <CloudRain className="w-8 h-8 text-info" />;
    if (weather.condition === 'Partly Cloudy' || weather.condition === 'Foggy') return <Cloud className="w-8 h-8 text-text-muted" />;
    return <Sun className="w-8 h-8 text-warning" />;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-card border border-border-light flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${weather.isSevere ? 'bg-critical/10' : 'bg-brand-50'}`}>
            <WeatherIcon />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-secondary">Current Weather</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-text-primary">{weather.temp}°C</span>
              <span className="text-sm font-bold text-text-primary">{weather.condition}</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs font-medium text-text-secondary">
              <Wind className="w-3 h-3" /> {weather.windSpeed} km/h wind
            </div>
          </div>
        </div>
      </div>
      
      {weather.isSevere && weather.alertMsg && (
        <div className="bg-critical/10 border border-critical/20 rounded-xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-critical/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-critical" />
          </div>
          <div>
            <h3 className="font-bold text-critical">WEATHER ALERT</h3>
            <p className="text-sm text-text-primary mt-1 font-medium">{weather.alertMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
