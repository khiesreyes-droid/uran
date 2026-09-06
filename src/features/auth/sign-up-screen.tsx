import type { SignUpFormProps } from './components/sign-up-form';

import { Redirect, useRouter } from 'expo-router';
import * as React from 'react';
import { showMessage } from 'react-native-flash-message';

import { FocusAwareStatusBar } from '@/components/ui';
import { completeSignIn, useAuthStore } from '@/features/auth/use-auth-store';
import {
  getAuthErrorMessage,
  signInWithGoogle,
  signUpWithEmail,
} from '@/lib/firebase/auth';

import { SignUpForm } from './components/sign-up-form';

export function SignUpScreen() {
  const router = useRouter();
  const status = useAuthStore.use.status();
  const [googleLoading, setGoogleLoading] = React.useState(false);

  // Google sign-up ends with status → 'signIn'; redirect rather than racing
  // router.replace against the async onAuthStateChanged callback.
  if (status === 'signIn') {
    return <Redirect href="/" />;
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      await completeSignIn(user);
      router.replace('/');
    }
    catch (error) {
      console.error('[Google Sign-In]', error);
      const msg = getAuthErrorMessage(error);
      const detail = (error as any)?.message ?? String(error);
      showMessage({ message: msg, description: detail, type: 'danger', duration: 6000 });
    }
    finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit: SignUpFormProps['onSubmit'] = async (data) => {
    try {
      await signUpWithEmail(data.name, data.email, data.password);
      showMessage({
        message: 'Account created!',
        description:
          'A verification email has been sent. Click the link to verify, then log in.',
        type: 'success',
        duration: 7000,
      });
      router.replace('/login');
    }
    catch (error) {
      showMessage({
        message: getAuthErrorMessage(error),
        type: 'danger',
      });
    }
  };

  return (
    <>
      <FocusAwareStatusBar />
      <SignUpForm
        onSubmit={onSubmit}
        onLogin={() => router.replace('/login')}
        onGoogleSignIn={handleGoogleSignIn}
        googleLoading={googleLoading}
      />
    </>
  );
}
