import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';

import { firebaseDatabase } from '@/lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────
// Mirrors the shapes written under devices/{deviceId}/*.

export type DeviceStatus = {
  device_id: string;
  device_status: string;   // e.g. "OPENING", "OPEN", "CLOSING", "RETRACTED"
  humidity: number;
  rain_avg: number;
  temperature: number;
  timestamp: string;       // ISO timestamp
};

export type DeviceConnection = {
  lastSeen: number;        // epoch milliseconds
  online: boolean;
};

// Consider a device offline once its last heartbeat is this old.
const OFFLINE_AFTER_MS = 60_000;

type DeviceStatusState = {
  data: DeviceStatus | null;
  loading: boolean;
  error: boolean;
};

export function useDeviceStatus(deviceId: string | null): DeviceStatusState {
  const [state, setState] = useState<DeviceStatusState>({
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
    const latestRef = ref(firebaseDatabase, `devices/${deviceId}/latest`);

    const unsubscribe = onValue(
      latestRef,
      (snapshot) => {
        setState({ data: snapshot.val() as DeviceStatus | null, loading: false, error: false });
      },
      () => {
        setState((prev) => ({ ...prev, loading: false, error: true }));
      },
    );

    return () => unsubscribe();
  }, [deviceId]);

  return state;
}

// ─── Connection status ────────────────────────────────────────────────────────

type DeviceConnectionState = {
  online: boolean;
  lastSeen: number | null;
  loading: boolean;
};

/**
 * Reads devices/{deviceId}/status and derives an online flag: the device is
 * OFFLINE when its last heartbeat is at least a minute old, regardless of the
 * stored `online` value. Re-evaluates on a timer so the card flips to OFFLINE
 * even while no new data arrives.
 */
export function useDeviceConnection(deviceId: string | null): DeviceConnectionState {
  const [status, setStatus] = useState<DeviceConnection | null>(null);
  const [loading, setLoading] = useState(deviceId !== null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deviceId) {
      setStatus(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setStatus(null);
    const statusRef = ref(firebaseDatabase, `devices/${deviceId}/status`);

    const unsubscribe = onValue(
      statusRef,
      (snapshot) => {
        setStatus(snapshot.val() as DeviceConnection | null);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsubscribe();
  }, [deviceId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const lastSeen = typeof status?.lastSeen === 'number' ? status.lastSeen : null;
  const online =
    lastSeen !== null && now - lastSeen < OFFLINE_AFTER_MS && status?.online !== false;

  return { online, lastSeen, loading };
}

/** Formats an epoch-ms timestamp in the viewer's current timezone. */
export function formatLastSeen(lastSeen: number | null): string {
  if (lastSeen === null) return '—';
  return new Date(lastSeen).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
