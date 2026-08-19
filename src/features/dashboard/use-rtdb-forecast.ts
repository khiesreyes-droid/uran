import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';

import { firebaseDatabase } from '@/lib/firebase';

// ─── Type ─────────────────────────────────────────────────────────────────────
// Mirrors the shape written by the Cloud Function at weather/forecast.

export type DryingCondition = 'excellent' | 'optimal' | 'fair' | 'poor';

export type WeatherForecast = {
  updatedAt: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  rainExpected: boolean;
  rainAt: string | null;         // ISO timestamp of expected rain from Tomorrow.io
  rainInHours: number | null;
  estimatedMinutes: number;
  condition: DryingCondition;
  precipProbability: number[];   // [now, +1h, +2h, +3h]
};

const TZ = 'Asia/Manila';

export function getRainTimeDisplay(forecast: WeatherForecast): string {
  if (!forecast.rainAt) return `${forecast.rainInHours}h`;
  const rainDate = new Date(forecast.rainAt);
  if (rainDate <= new Date()) return 'now';
  return rainDate.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ,
  });
}

export function getConditionText(forecast: WeatherForecast): string {
  if (forecast.rainExpected) {
    if (!forecast.rainAt || new Date(forecast.rainAt) <= new Date()) {
      return 'Rain may be arriving now. Consider covering laundry.';
    }
    return `Rain expected around ${getRainTimeDisplay(forecast)}. Consider covering laundry now.`;
  }
  const { condition } = forecast;
  if (condition === 'excellent') return 'Excellent drying weather. Leave laundry out.';
  if (condition === 'optimal') return 'Good conditions. Clothes should dry well.';
  if (condition === 'fair') return 'Moderate conditions. May take longer than usual.';
  return 'Poor drying weather. Consider drying indoors.';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

type RTDBForecastState = {
  data: WeatherForecast | null;
  loading: boolean;
  error: boolean;
};

export function useRTDBForecast(deviceId: string | null): RTDBForecastState {
  const [state, setState] = useState<RTDBForecastState>({
    data: null,
    loading: deviceId !== null,
    error: false,
  });

  useEffect(() => {
    if (!deviceId) {
      setState({ data: null, loading: false, error: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, data: null }));
    const forecastRef = ref(firebaseDatabase, `weather/${deviceId}/forecast`);

    const unsubscribe = onValue(
      forecastRef,
      (snapshot) => {
        setState({ data: snapshot.val() as WeatherForecast | null, loading: false, error: false });
      },
      () => {
        setState((prev) => ({ ...prev, loading: false, error: true }));
      },
    );

    return () => unsubscribe();
  }, [deviceId]);

  return state;
}
