import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  Notifications,
  registerForPushNotificationsAsync,
} from '@/lib/notifications';

import { savePushToken } from './api';

/**
 * Registers this device for push on sign-in, and keeps the RTDB token fresh
 * when the OS rotates it. Mount once inside the authenticated layout.
 */
export function usePushNotifications(): void {
  const status = useAuthStore.use.status();
  const registered = useRef(false);

  useEffect(() => {
    if (status !== 'signIn') {
      registered.current = false;
      return;
    }
    if (registered.current)
      return;
    registered.current = true;

    console.log('[push] signed in — registering for notifications');
    registerForPushNotificationsAsync()
      .then(result => (result ? savePushToken(result) : undefined))
      .catch((err) => {
        console.error('[push] registration failed:', err);
        registered.current = false;
      });
  }, [status]);

  useEffect(() => {
    const sub = Notifications.addPushTokenListener((tokenData) => {
      savePushToken({
        token: tokenData.data,
        platform: tokenData.type === 'ios' ? 'ios' : 'android',
      }).catch(() => {});
    });
    return () => sub.remove();
  }, []);
}
