import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithCredential,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

import { firebaseAuth } from './index';

export { firebaseAuth, onAuthStateChanged };

GoogleSignin.configure({
  // 'autoDetect' reads default_web_client_id from google-services.json at
  // runtime — no reliance on EXPO_PUBLIC_* being inlined into the release
  // bundle. Falls back to the env var if that ever fails to resolve.
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? 'autoDetect',
});

export async function signUpWithEmail(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await sendEmailVerification(cred.user);
  // Sign out immediately — user must verify email before accessing the app
  await firebaseSignOut(firebaseAuth);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
  if (!cred.user.emailVerified) {
    await firebaseSignOut(firebaseAuth);
    const err = new Error('Email not verified') as any;
    err.code = 'auth/email-not-verified';
    throw err;
  }
  return cred.user;
}

export async function resendVerificationEmail() {
  const user = firebaseAuth.currentUser;
  if (user) {
    await sendEmailVerification(user);
  }
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  // Clear any cached native session first so the account picker always shows —
  // otherwise a second sign-in after logout silently reuses the old account
  // (or fails with no UI) because signOut() below was never called natively.
  await GoogleSignin.signOut().catch(() => {});

  const result = await GoogleSignin.signIn();
  let idToken = result.data?.idToken ?? null;
  console.log('[GSI] signIn result idToken present:', !!idToken);

  if (!idToken) {
    // On repeat sign-ins Google can return the account without a fresh
    // idToken — getTokens() forces one.
    idToken = (await GoogleSignin.getTokens()).idToken ?? null;
    console.log('[GSI] getTokens fallback idToken present:', !!idToken);
  }
  if (!idToken)
    throw new Error('Google Sign-In did not return an ID token');

  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(firebaseAuth, credential);
  console.log('[GSI] firebase signInWithCredential ok, uid:', cred.user.uid);
  return cred.user;
}

export async function signOut() {
  // Drop the native Google session too, not just the Firebase one.
  await GoogleSignin.signOut().catch(() => {});
  await firebaseSignOut(firebaseAuth);
}

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as any)?.code as string | undefined;
  switch (code) {
    // @react-native-google-signin status codes
    case 'SIGN_IN_CANCELLED':
    case '-5':
      return 'Sign-in was cancelled';
    case 'IN_PROGRESS':
      return 'Sign-in is already in progress';
    case 'PLAY_SERVICES_NOT_AVAILABLE':
      return 'Google Play services is missing or outdated on this device';
    case 'DEVELOPER_ERROR':
    case '10':
      return 'Google Sign-In is misconfigured for this build (SHA-1 / client ID)';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/email-not-verified':
      return 'Please verify your email before signing in';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled';
    default:
      return 'Something went wrong. Please try again';
  }
}
