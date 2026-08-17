import type { TokenType } from '@/lib/auth/utils';

import { create } from 'zustand';

import { firebaseAuth, onAuthStateChanged } from '@/lib/firebase/auth';
import { signOut as firebaseSignOut } from 'firebase/auth';
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
      if (user && user.emailVerified) {
        try {
          const idToken = await user.getIdToken();
          get().signIn({ access: idToken, refresh: user.refreshToken });
        } catch {
          get().signOut();
        }
      } else {
        get().signOut();
      }
    });
  },
}));

export const useAuthStore = createSelectors(_useAuthStore);

export const signOut = () => {
  firebaseSignOut(firebaseAuth).catch(console.error);
  _useAuthStore.getState().signOut();
};
export const signIn = (token: TokenType) => _useAuthStore.getState().signIn(token);
export const hydrateAuth = () => _useAuthStore.getState().hydrate();
