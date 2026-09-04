import type { TokenType } from '@/lib/auth/utils';

import { create } from 'zustand';
import { unregisterPushToken } from '@/features/notifications/api';
import {
  signOut as authSignOut,
  firebaseAuth,
  onAuthStateChanged,
} from '@/lib/firebase/auth';
import { createSelectors } from '@/lib/utils';

type AuthState = {
  token: TokenType | null;
  status: 'idle' | 'signOut' | 'signIn';
  signIn: (data: TokenType) => void;
  signOut: () => void;
  hydrate: () => void;
};

const _useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  signIn: (token) => {
    set({ status: 'signIn', token });
  },
  signOut: () => {
    set({ status: 'signOut', token: null });
  },
  hydrate: () => {
    // Firebase fires this immediately with the persisted user (or null)
    onAuthStateChanged(firebaseAuth, async (user) => {
      // Google (and other federated) providers assert the email themselves, so
      // user.emailVerified can be false for them even though the address is
      // trustworthy. Only the email/password path needs the explicit check.
      const viaFederatedProvider = !!user?.providerData.some(
        p => p.providerId !== 'password',
      );
      if (user && (user.emailVerified || viaFederatedProvider)) {
        try {
          const idToken = await user.getIdToken();
          get().signIn({ access: idToken, refresh: user.refreshToken });
        }
        catch (err) {
          console.error('[auth] getIdToken failed, signing out:', err);
          get().signOut();
        }
      }
      else {
        console.log(
          '[auth] signing out — user:',
          !!user,
          'emailVerified:',
          user?.emailVerified,
        );
        get().signOut();
      }
    });
  },
}));

export const useAuthStore = createSelectors(_useAuthStore);

export function signOut() {
  // Drop this device's push token while still authenticated, then sign out of
  // both Google (native) and Firebase.
  unregisterPushToken()
    .catch(() => {})
    .finally(() => {
      authSignOut().catch(console.error);
      _useAuthStore.getState().signOut();
    });
}
export const signIn = (token: TokenType) => _useAuthStore.getState().signIn(token);
export const hydrateAuth = () => _useAuthStore.getState().hydrate();
