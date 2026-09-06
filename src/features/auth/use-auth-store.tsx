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

/**
 * Explicitly move the store to 'signIn' after a successful sign-in action.
 * We can't rely on onAuthStateChanged alone: re-signing-in with the same
 * account it never cleared does not re-fire the listener, so status would stay
 * 'signOut' and the app would bounce back to /login.
 */
export async function completeSignIn(user: {
  getIdToken: () => Promise<string>;
  refreshToken: string;
}) {
  try {
    const idToken = await user.getIdToken();
    _useAuthStore.getState().signIn({ access: idToken, refresh: user.refreshToken });
  }
  catch (err) {
    console.error('[auth] completeSignIn failed:', err);
    _useAuthStore.getState().signOut();
  }
}

export function signOut() {
  // Update the UI immediately, then tear down Google + Firebase sessions.
  _useAuthStore.getState().signOut();
  unregisterPushToken().catch(() => {});
  authSignOut().catch(err => console.error('[auth] signOut error:', err));
}
export const signIn = (token: TokenType) => _useAuthStore.getState().signIn(token);
export const hydrateAuth = () => _useAuthStore.getState().hydrate();
