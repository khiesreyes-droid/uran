import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage } from '@/lib/storage';

type DeviceStore = {
  selectedDeviceId: string | null;
  setSelectedDeviceId: (id: string | null) => void;
};

const mmkvStorage = {
  getItem: (name: string): string | null => storage.getString(name) ?? null,
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.remove(name);
  },
};

export const useDeviceStore = create<DeviceStore>()(
  persist(
    (set) => ({
      selectedDeviceId: null,
      setSelectedDeviceId: (id) => set({ selectedDeviceId: id }),
    }),
    {
      name: 'device-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
