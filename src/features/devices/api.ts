import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { onValue, ref, remove, set, update } from 'firebase/database';

import { firebaseAuth, firebaseDatabase } from '@/lib/firebase';

import type { Device } from './types';

function requireUid(): string {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

type DevicesState = {
  devices: Device[];
  loading: boolean;
  error: boolean;
};

export function useDevices(): DevicesState {
  const [state, setState] = useState<DevicesState>({
    devices: [],
    loading: true,
    error: false,
  });

  useEffect(() => {
    // Re-run whenever auth state settles — currentUser is often still null on
    // first mount (before Firebase rehydrates the persisted session).
    let unsubscribeDevices: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeDevices?.();
      unsubscribeDevices = undefined;

      if (!user) {
        setState({ devices: [], loading: false, error: false });
        return;
      }

      setState((prev) => ({ ...prev, loading: true }));
      const devicesRef = ref(firebaseDatabase, `users/${user.uid}/devices`);
      unsubscribeDevices = onValue(
        devicesRef,
        (snapshot) => {
          const val = snapshot.val() as Record<string, Device> | null;
          setState({ devices: val ? Object.values(val) : [], loading: false, error: false });
        },
        () => setState((prev) => ({ ...prev, loading: false, error: true })),
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDevices?.();
    };
  }, []);

  return state;
}

export async function addDevice(device: Omit<Device, 'createdAt'>): Promise<string> {
  const uid = requireUid();
  // Firebase RTDB keys may not contain '.', '#', '$', '[', ']' or '/'.
  const id = device.id.trim().replace(/[.#$[\]/]/g, '-');
  await set(ref(firebaseDatabase, `users/${uid}/devices/${id}`), {
    ...device,
    id,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export type DeviceUpdate = Partial<Pick<Device, 'name' | 'address' | 'latitude' | 'longitude'>>;

export async function updateDevice(deviceId: string, patch: DeviceUpdate): Promise<void> {
  const uid = requireUid();
  await update(ref(firebaseDatabase, `users/${uid}/devices/${deviceId}`), patch);
}

export async function deleteDevice(deviceId: string): Promise<void> {
  const uid = requireUid();
  await remove(ref(firebaseDatabase, `users/${uid}/devices/${deviceId}`));
}
