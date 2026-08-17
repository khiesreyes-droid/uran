import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import Env from 'env';

export type DeviceLocation = {
  latitude: number;
  longitude: number;
};

type LocationState = {
  location: DeviceLocation | null;
  loading: boolean;
  permissionDenied: boolean;
};

export function useDeviceLocation(): LocationState {
  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (status !== 'granted') {
          setPermissionDenied(true);
          setLocation({
            latitude: Env.EXPO_PUBLIC_WEATHER_LAT,
            longitude: Env.EXPO_PUBLIC_WEATHER_LNG,
          });
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
      catch (err) {
        if (cancelled) return;
        console.error('[useDeviceLocation]', err);
        setLocation({
          latitude: Env.EXPO_PUBLIC_WEATHER_LAT,
          longitude: Env.EXPO_PUBLIC_WEATHER_LNG,
        });
      }
      finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { location, loading, permissionDenied };
}
