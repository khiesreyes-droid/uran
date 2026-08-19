import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';

import { firebaseDatabase } from '@/lib/firebase';

export type HistoryEvent = {
  id: string;
  action: 'deploy' | 'retract';
  issuedAt: string;
  source: 'manual' | 'auto';
};

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
    const unsubscribe = onValue(
      ref(firebaseDatabase, `history/${deviceId}`),
      (snapshot) => {
        const val = snapshot.val() as Record<string, Omit<HistoryEvent, 'id'>> | null;
        const events: HistoryEvent[] = val
          ? Object.entries(val)
              .map(([id, data]) => ({ id, ...data }))
              .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
          : [];
        setState({ events, loading: false, error: false });
      },
      () => setState((prev) => ({ ...prev, loading: false, error: true })),
    );
    return () => unsubscribe();
  }, [deviceId]);

  return state;
}
