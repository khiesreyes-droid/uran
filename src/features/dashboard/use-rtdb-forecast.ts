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
  rainTime: string | null;       // e.g. "3:00 PM" — formatted by the function
  rainInHours: number | null;
  estimatedMinutes: number;
  condition: DryingCondition;
  conditionText: string;
  precipProbability: number[];   // [now, +1h, +2h, +3h]
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

type RTDBForecastState = {
  data: WeatherForecast | null;
  loading: boolean;
  error: boolean;
};

export function useRTDBForecast(): RTDBForecastState {
  const [state, setState] = useState<RTDBForecastState>({
    data: null,
    loading: true,
    error: false,
  });

  useEffect(() => {
    const forecastRef = ref(firebaseDatabase, 'weather/forecast');

    const unsubscribe = onValue(
      forecastRef,
      (snapshot) => {
        setState({ data: snapshot.val() as WeatherForecast | null, loading: false, error: false });
      },
      () => {
        setState(prev => ({ ...prev, loading: false, error: true }));
      },
    );

    return () => unsubscribe();
  }, []);

  return state;
}
