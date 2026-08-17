import { createQuery } from 'react-query-kit';

import Env from 'env';

// Tomorrow.io v4 — hourly forecast endpoint.
// Single call covers current conditions + 4-hour precipitation chart.
// Docs: https://docs.tomorrow.io/reference/weather-forecast
const BASE_URL = 'https://api.tomorrow.io/v4/weather/forecast';

const FIELDS = [
  'temperature',
  'humidity',
  'windSpeed',
  'precipitationProbability',
  'weatherCode',
].join(',');

// ─── Types ────────────────────────────────────────────────────────────────────

export type DryingCondition = 'excellent' | 'optimal' | 'fair' | 'poor';

export type TomorrowForecast = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  rainExpected: boolean;
  rainInHours: number | null;
  estimatedMinutes: number;
  condition: DryingCondition;
  conditionText: string;
  precipProbability: number[]; // [now, +1h, +2h, +3h]
};

// ─── Tomorrow.io weather code → label ────────────────────────────────────────

export function weatherLabel(code: number): string {
  switch (code) {
    case 1000: return 'Clear Sky';
    case 1100: return 'Mostly Clear';
    case 1101: return 'Partly Cloudy';
    case 1102: return 'Mostly Cloudy';
    case 1001: return 'Overcast';
    case 2000:
    case 2100: return 'Foggy';
    case 4000: return 'Drizzle';
    case 4200: return 'Light Rain';
    case 4001: return 'Rain';
    case 4201: return 'Heavy Rain';
    case 5000:
    case 5001: return 'Snow';
    case 6000: return 'Freezing Drizzle';
    case 8000: return 'Thunderstorm';
    default: return 'Variable';
  }
}

// ─── Drying-time algorithm (same logic as dashboard/api.ts) ──────────────────

function deriveDryingForecast(
  temp: number,
  humidity: number,
  wind: number,
  precipProbability: number[],
): Pick<TomorrowForecast, 'rainExpected' | 'rainInHours' | 'estimatedMinutes' | 'condition' | 'conditionText'> {
  // First hour where rain probability > 50 %
  const rainIndex = precipProbability.findIndex(p => p > 50);
  const rainExpected = rainIndex !== -1;
  const rainInHours = rainExpected ? rainIndex + 1 : null;

  // Cotton baseline: 60 min
  let minutes = 60;
  minutes += (humidity - 50) * 0.9;   // +0.9 min per % above 50%
  minutes -= (temp - 20) * 2.5;       // −2.5 min per °C above 20°C
  minutes -= Math.max(0, wind - 10) * 0.6;
  minutes = Math.round(Math.max(20, Math.min(180, minutes)));

  let condition: DryingCondition;
  let conditionText: string;

  if (rainExpected) {
    condition = 'poor';
    conditionText = `Rain likely in ~${rainInHours}h — retract laundry before then.`;
  }
  else if (minutes <= 40) {
    condition = 'excellent';
    conditionText = 'Excellent — hot, breezy, low humidity. Fast drying.';
  }
  else if (minutes <= 65) {
    condition = 'optimal';
    conditionText = 'Optimal conditions detected for cotton garments.';
  }
  else if (minutes <= 100) {
    condition = 'fair';
    conditionText = 'Fair conditions — moderate drying expected.';
  }
  else {
    condition = 'poor';
    conditionText = 'High humidity — consider indoor drying today.';
  }

  return { rainExpected, rainInHours, estimatedMinutes: minutes, condition, conditionText };
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

async function fetchTomorrowForecast(
  latitude: number,
  longitude: number,
): Promise<TomorrowForecast> {
  const apiKey = Env.EXPO_PUBLIC_TOMORROW_API_KEY;
  if (!apiKey) throw new Error('EXPO_PUBLIC_TOMORROW_API_KEY is not set');

  const url = new URL(BASE_URL);
  url.searchParams.set('location', `${latitude},${longitude}`);
  url.searchParams.set('timesteps', '1h');
  url.searchParams.set('units', 'metric');
  url.searchParams.set('fields', FIELDS);
  url.searchParams.set('apikey', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Tomorrow.io ${res.status}: ${body}`);
  }

  const data = await res.json();
  const hourly: Array<{ values: Record<string, number> }> = data.timelines?.hourly ?? [];
  if (hourly.length === 0) throw new Error('Tomorrow.io returned no hourly data');

  const current = hourly[0].values;
  const temp = Math.round(current.temperature ?? 0);
  const humidity = Math.round(current.humidity ?? 0);
  const wind = Math.round(current.windSpeed ?? 0);
  const weatherCode = current.weatherCode ?? 1000;

  const precipProbability = hourly
    .slice(0, 4)
    .map(h => Math.round(h.values.precipitationProbability ?? 0));

  const drying = deriveDryingForecast(temp, humidity, wind, precipProbability);

  return { temperature: temp, humidity, windSpeed: wind, weatherCode, precipProbability, ...drying };
}

// ─── Query hook ───────────────────────────────────────────────────────────────

export type TomorrowForecastVariables = { latitude: number; longitude: number };

export const useTomorrowForecast = createQuery<TomorrowForecast, TomorrowForecastVariables, Error>({
  queryKey: ['tomorrow-forecast'],
  fetcher: ({ latitude, longitude }) => fetchTomorrowForecast(latitude, longitude),
});
