import { useEffect, useState } from 'react';
import { limitToLast, onValue, orderByKey, query, ref } from 'firebase/database';

import { firebaseDatabase } from '@/lib/firebase';

// One row per sensor snapshot logged under devices/{deviceId}/readings/{epoch}.
// We only surface the cover state + when it was recorded.
export type HistoryEvent = {
  id: string;              // the reading key (epoch seconds)
  deviceStatus: string;    // e.g. "OPENING", "OPEN", "CLOSING", "RETRACTED"
  timestamp: string;       // ISO-8601 timestamp
};

type RawReading = {
  device_status?: string;
  timestamp?: string;
};

// Cap how many readings we pull — the node grows unbounded on the device side.
const MAX_READINGS = 500;

type HistoryState = {
  events: HistoryEvent[];
  loading: boolean;
  error: boolean;
};

export function useHistory(deviceId: string | null): HistoryState {
  const [state, setState] = useState<HistoryState>({
    events: [],
    loading: deviceId !== null,
    error: false,
  });

  useEffect(() => {
    if (!deviceId) {
      setState({ events: [], loading: false, error: false });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    const readingsQuery = query(
      ref(firebaseDatabase, `devices/${deviceId}/readings`),
      orderByKey(),
      limitToLast(MAX_READINGS),
    );
    const unsubscribe = onValue(
      readingsQuery,
      (snapshot) => {
        // A query snapshot can come back as an object or (with numeric keys) an
        // array — normalise both, dropping the array's empty holes.
        const raw = snapshot.val() as
          | Record<string, RawReading>
          | (RawReading | null)[]
          | null;
        const entries: [string, RawReading][] = Array.isArray(raw)
          ? raw.flatMap((v, i) => (v ? [[String(i), v] as [string, RawReading]] : []))
          : raw
            ? Object.entries(raw)
            : [];

        const events: HistoryEvent[] = entries
          .map(([id, data]) => ({
            id,
            deviceStatus: data?.device_status ?? '—',
            timestamp: data?.timestamp ?? new Date(Number(id) * 1000).toISOString(),
          }))
          .sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );

        setState({ events, loading: false, error: false });
      },
      () => setState((prev) => ({ ...prev, loading: false, error: true })),
    );
    return () => unsubscribe();
  }, [deviceId]);

  return state;
}
