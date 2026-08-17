import type { LoginFormProps } from './components/login-form';

import { useRouter } from 'expo-router';
import * as React from 'react';
import { showMessage } from 'react-native-flash-message';

import { FocusAwareStatusBar } from '@/components/ui';
import {
  getAuthErrorMessage,
  signInWithEmail,
  signInWithGoogle,
} from '@/lib/firebase/auth';

import { LoginForm } from './components/login-form';

export function LoginScreen() {
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

  const onSubmit: LoginFormProps['onSubmit'] = async (data) => {
    try {
      await signInWithEmail(data.email, data.password);
      router.replace('/');
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
      <LoginForm
        onSubmit={onSubmit}
        onSignUp={() => router.push('/sign-up')}
        onGoogleSignIn={handleGoogleSignIn}
        googleLoading={googleLoading}
      />
    </>
  );
}
