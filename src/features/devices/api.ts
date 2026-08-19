import { useEffect, useState } from 'react';
import { onValue, ref, remove, set } from 'firebase/database';

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
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) {
      setState({ devices: [], loading: false, error: true });
      return;
    }

    const devicesRef = ref(firebaseDatabase, `users/${uid}/devices`);
    const unsubscribe = onValue(
      devicesRef,
      (snapshot) => {
        const val = snapshot.val() as Record<string, Device> | null;
        setState({ devices: val ? Object.values(val) : [], loading: false, error: false });
      },
      () => setState((prev) => ({ ...prev, loading: false, error: true })),
    );
    return () => unsubscribe();
  }, []);

  return state;
}

export async function addDevice(device: Omit<Device, 'createdAt'>): Promise<string> {
  const uid = requireUid();
  const id = device.id.toUpperCase().replace(/[^A-F0-9]/g, '');
  await set(ref(firebaseDatabase, `users/${uid}/devices/${id}`), {
    ...device,
    id,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function deleteDevice(deviceId: string): Promise<void> {
  const uid = requireUid();
  await remove(ref(firebaseDatabase, `users/${uid}/devices/${deviceId}`));
}
