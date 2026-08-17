import { createQuery } from 'react-query-kit';

// https://ensemble-api.open-meteo.com/v1/ensemble  (WeatherNext2 lives here)
const BASE_URL = 'https://ensemble-api.open-meteo.com/v1/ensemble';

const VARIABLES = [
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation',
  'wind_speed_10m',
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

// The ensemble API returns per-member keys, e.g. temperature_2m_member00…member63
type WeatherHourly = Record<string, number[]>;

type WeatherResponse = {
  hourly: WeatherHourly;
};

export type DryingCondition = 'excellent' | 'optimal' | 'fair' | 'poor';

export type DryingForecast = {
  estimatedMinutes: number;
  rainExpected: boolean;
  rainInHours: number | null;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: DryingCondition;
  conditionText: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Averages a variable across all ensemble members at a given time slot.
 * Handles both direct keys (e.g. "temperature_2m") and member keys
 * (e.g. "temperature_2m_member00" … "member63").
 */
function ensembleMean(
  hourly: WeatherHourly,
  variable: string,
  slot: number,
): number {
  // Some endpoints return the variable directly
  if (Array.isArray(hourly[variable]) && hourly[variable][slot] != null) {
    return hourly[variable][slot]!;
  }
  // WeatherNext2 ensemble: average all 64 members
  const values: number[] = [];
  for (let i = 0; i < 64; i++) {
    const key = `${variable}_member${String(i).padStart(2, '0')}`;
    const val = hourly[key]?.[slot];
    if (val != null) values.push(val);
  }
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ─── Drying-time algorithm ───────────────────────────────────────────────────

function deriveDryingForecast(hourly: WeatherHourly): DryingForecast {
  // native temporal_resolution = 6h slots. Take nearest slot for ambient values.
  const temp = ensembleMean(hourly, 'temperature_2m', 0);
  const humidity = ensembleMean(hourly, 'relative_humidity_2m', 0);
  const wind = ensembleMean(hourly, 'wind_speed_10m', 0);

  // Scan next 4 slots (~24 h) for rain across the ensemble mean
  let rainSlotIndex = -1;
  for (let slot = 0; slot < 4; slot++) {
    if (ensembleMean(hourly, 'precipitation', slot) > 0.1) {
      rainSlotIndex = slot;
      break;
    }
  }
  const rainExpected = rainSlotIndex !== -1;
  const rainInHours = rainExpected ? (rainSlotIndex + 1) * 6 : null;

  // Cotton baseline: 60 min. Adjust for ambient conditions.
  let minutes = 60;
  minutes += (humidity - 50) * 0.9; // +0.9 min per % above 50%
  minutes -= (temp - 20) * 2.5; // −2.5 min per °C above 20°C
  minutes -= Math.max(0, wind - 10) * 0.6; // −0.6 min per km/h above 10
  minutes = Math.round(Math.max(20, Math.min(180, minutes)));

  let condition: DryingCondition;
  let conditionText: string;

  if (rainExpected) {
    condition = 'poor';
    conditionText = `Rain expected in ~${rainInHours}h — retract laundry before then.`;
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

  return {
    estimatedMinutes: minutes,
    rainExpected,
    rainInHours,
    temperature: Math.round(temp),
    humidity: Math.round(humidity),
    windSpeed: Math.round(wind),
    condition,
    conditionText,
  };
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

async function fetchDryingForecast(
  latitude: number,
  longitude: number,
): Promise<DryingForecast> {
  const url = new URL(BASE_URL);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('hourly', VARIABLES.join(','));
  url.searchParams.set('models', 'google_weathernext2_ensemble');
  url.searchParams.set('forecast_days', '2');
  url.searchParams.set('temporal_resolution', 'native');
  url.searchParams.set('timezone', 'auto');

  let res: Response;
  try {
    res = await fetch(url.toString());
  }
  catch (networkErr) {
    console.error('[WeatherNext2] network error:', networkErr);
    throw networkErr;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[WeatherNext2] HTTP ${res.status}:`, body);
    throw new Error(`WeatherNext2 fetch failed: ${res.status}`);
  }

  const data: WeatherResponse = await res.json();
  return deriveDryingForecast(data.hourly);
}

// ─── Query hook ──────────────────────────────────────────────────────────────

export type ForecastVariables = { latitude: number; longitude: number };

export const useDryingForecast = createQuery<DryingForecast, ForecastVariables, Error>({
  queryKey: ['drying-forecast'],
  fetcher: ({ latitude, longitude }) => fetchDryingForecast(latitude, longitude),
});
