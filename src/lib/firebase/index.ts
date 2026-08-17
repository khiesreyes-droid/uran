import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

import { storage } from '@/lib/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

// Firebase Auth v12 _getInstance() requires persistence to be a class (typeof === 'function'),
// not a plain object. It calls new cls() internally to create the singleton instance.
class MMKVPersistence {
  readonly type = 'LOCAL' as const;
  readonly _shouldAllowMigration = true;

  _isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
  }
  _set(key: string, value: unknown): Promise<void> {
    storage.set(key, JSON.stringify(value));
    return Promise.resolve();
  }
  _get(key: string): Promise<unknown> {
    const raw = storage.getString(key);
    return Promise.resolve(raw ? JSON.parse(raw) : null);
  }
  _remove(key: string): Promise<void> {
    storage.remove(key);
    return Promise.resolve();
  }
  _addListener(_key: string, _listener: unknown): void {}
  _removeListener(_key: string, _listener: unknown): void {}
}

const existingApps = getApps();
const app = existingApps[0] ?? initializeApp(firebaseConfig);

// initializeAuth can only be called once per app; use getAuth on subsequent evals
export const firebaseAuth =
  existingApps.length === 0
    ? initializeAuth(app, { persistence: MMKVPersistence })
    : getAuth(app);

export const firebaseDatabase = getDatabase(app);
