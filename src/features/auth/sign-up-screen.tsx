import type { SignUpFormProps } from './components/sign-up-form';

import { useRouter } from 'expo-router';
import * as React from 'react';
import { showMessage } from 'react-native-flash-message';

import { FocusAwareStatusBar } from '@/components/ui';
import {
  getAuthErrorMessage,
  signUpWithEmail,
  signInWithGoogle,
} from '@/lib/firebase/auth';

import { SignUpForm } from './components/sign-up-form';

export function SignUpScreen() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/');
    } catch (error) {
      console.error('[Google Sign-In]', error);
      const msg = getAuthErrorMessage(error);
      const detail = (error as any)?.message ?? String(error);
      showMessage({ message: msg, description: detail, type: 'danger', duration: 6000 });
    } finally {
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
    } catch (error) {
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
