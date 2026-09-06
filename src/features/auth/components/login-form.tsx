import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Svg, { Path } from 'react-native-svg';
import { useUniwind } from 'uniwind';
import * as z from 'zod';

import { getFieldError } from '@/components/ui/form-utils';
import { dark, light, type ThemeColors } from '@/lib/theme';

const schema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string({ message: 'Password is required' })
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type FormType = z.infer<typeof schema>;
export type LoginFormProps = {
  onSubmit?: (data: FormType) => void;
  onSignUp?: () => void;
  onGoogleSignIn?: () => void;
  googleLoading?: boolean;
};

function MailIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m22 6-10 7L2 6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GridIcon({ color }: { color: string }) {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" fill={color} />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

type AuthInputProps = {
  icon: React.ReactNode;
  error?: string;
  testID?: string;
  c: ThemeColors;
} & React.ComponentProps<typeof TextInput>;

function AuthInput({ icon, error, testID, c, ...props }: AuthInputProps) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error
    ? c.error
    : focused
      ? c.primaryContainer
      : c.outlineVariant;

  return (
    <View>
      <View
        style={[
          s.inputRow,
          {
            backgroundColor: c.surfaceContainerLowest,
            borderColor,
            shadowColor: focused ? c.primaryContainer : 'transparent',
          },
        ]}
      >
        <View style={s.inputIcon}>{icon}</View>
        <TextInput
          testID={testID}
          style={[s.input, { color: c.onSurface }]}
          placeholderTextColor={c.outline + '99'}
          onFocus={() => setFocused(true)}
          onBlur={e => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {!!error && <Text style={[s.errorText, { color: c.error }]}>{error}</Text>}
    </View>
  );
}

export function LoginForm({ onSubmit = () => {}, onSignUp, onGoogleSignIn, googleLoading = false }: LoginFormProps) {
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const c: ThemeColors = isDark ? dark : light;

  const cardBg = isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)';
  const cardBorder = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(194, 198, 217, 0.4)';
  const orbPrimary = isDark ? 'rgba(173, 198, 255, 0.08)' : 'rgba(0, 76, 202, 0.07)';
  const orbTertiary = isDark ? 'rgba(255, 185, 95, 0.04)' : 'rgba(72, 88, 109, 0.05)';
  const blobPrimary = isDark ? 'rgba(173, 198, 255, 0.12)' : 'rgba(0, 76, 202, 0.08)';
  const blobSecondary = isDark ? 'rgba(185, 200, 222, 0.06)' : 'rgba(0, 103, 127, 0.05)';

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onChange: schema as any },
    onSubmit: async ({ value }) => onSubmit(value),
  });

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      {/* Decorative background orbs */}
      <View style={[s.orbTopRight, { backgroundColor: orbPrimary }]} />
      <View style={[s.orbBottomLeft, { backgroundColor: orbTertiary }]} />
      <View style={[s.blobTopLeft, { backgroundColor: blobPrimary }]} />
      <View style={[s.blobBottomRight, { backgroundColor: blobSecondary }]} />

      <KeyboardAvoidingView style={s.kav} behavior="padding" keyboardVerticalOffset={10}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.header}>
            <View
              style={[
                s.logoCircle,
                {
                  backgroundColor: c.surfaceContainerHigh,
                  shadowColor: c.primaryContainer,
                },
              ]}
            >
              <GridIcon color={c.primary} />
            </View>
            <Text testID="form-title" style={[s.logoTitle, { color: c.onSurface }]}>
              Frandify
            </Text>
            <Text style={[s.logoSubtitle, { color: c.onSurfaceVariant }]}>
              
            </Text>
          </View>

          {/* Glass card */}
          <View
            style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <Text style={[s.welcomeTitle, { color: c.onSurface }]}>Welcome Back</Text>
            <Text style={[s.welcomeSub, { color: c.onSurfaceVariant }]}>
              Secure access to your smart protection system
            </Text>

            {/* Email */}
            <View style={s.fieldGroup}>
              <Text style={[s.fieldLabel, { color: c.onSurfaceVariant }]}>
                EMAIL ADDRESS
              </Text>
              <form.Field
                name="email"
                children={field => (
                  <AuthInput
                    testID="email-input"
                    icon={<MailIcon color={c.outline} />}
                    c={c}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                    error={getFieldError(field)}
                  />
                )}
              />
            </View>

            {/* Password */}
            <View style={s.fieldGroup}>
              <Text style={[s.fieldLabel, { color: c.onSurfaceVariant }]}>
                PASSWORD
              </Text>
              <form.Field
                name="password"
                children={field => (
                  <AuthInput
                    testID="password-input"
                    icon={<LockIcon color={c.outline} />}
                    c={c}
                    placeholder="••••••••"
                    secureTextEntry
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                    error={getFieldError(field)}
                  />
                )}
              />
            </View>

            {/* Log In */}
            <form.Subscribe
              selector={state => [state.isSubmitting]}
              children={([isSubmitting]) => (
                <Pressable
                  testID="login-button"
                  style={({ pressed }) => [
                    s.loginBtn,
                    {
                      backgroundColor: c.primaryContainer,
                      shadowColor: c.primaryContainer,
                    },
                    pressed && s.loginBtnPressed,
                  ]}
                  onPress={form.handleSubmit}
                  disabled={Boolean(isSubmitting)}
                >
                  <Text style={[s.loginBtnText, { color: c.onPrimaryContainer }]}>
                    {isSubmitting ? 'Signing in…' : 'Log In'}
                  </Text>
                </Pressable>
              )}
            />

            {/* Divider */}
            <View style={s.divider}>
              <View style={[s.dividerLine, { backgroundColor: c.outlineVariant }]} />
              <Text style={[s.dividerLabel, { color: c.onSurfaceVariant }]}>
                Or continue with
              </Text>
              <View style={[s.dividerLine, { backgroundColor: c.outlineVariant }]} />
            </View>

            {/* Google */}
            <Pressable
              onPress={onGoogleSignIn}
              disabled={googleLoading}
              style={({ pressed }) => [
                s.googleBtn,
                {
                  backgroundColor: c.surfaceContainerHigh,
                  borderColor: c.outlineVariant,
                },
                pressed && !googleLoading && s.googleBtnPressed,
                googleLoading && s.googleBtnDisabled,
              ]}
            >
              <GoogleIcon />
              <Text style={[s.googleBtnText, { color: c.onSurface }]}>
                {googleLoading ? 'Connecting…' : 'Sign in with Google'}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            {/* <Pressable>
              <Text style={[s.linkText, { color: c.primary }]}>Forgot Password?</Text>
            </Pressable> */}
            <View style={s.signupRow}>
              <Text style={[s.footerMuted, { color: c.onSurfaceVariant }]}>
                {"Don't have an account? "}
              </Text>
              <Pressable onPress={onSignUp}>
                <Text style={[s.linkBold, { color: c.primary }]}>Create an Account</Text>
              </Pressable>
            </View>
            <View style={s.badge}>
              <Text style={[s.badgeText, { color: c.onSurface }]}>
                POWERED BY FIREBASE INFRASTRUCTURE
              </Text>
              <Text style={[s.badgeText, { color: c.onSurface }]}>
                Secured by Atmospheric Shield v2.4
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Static layout styles — colors applied via inline overrides above
const s = StyleSheet.create({
  root: { flex: 1 },

  orbTopRight: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: '60%',
    aspectRatio: 1,
    borderRadius: 9999,
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: '-10%',
    left: '-10%',
    width: '50%',
    aspectRatio: 1,
    borderRadius: 9999,
  },
  blobTopLeft: {
    position: 'absolute',
    top: 80,
    left: '25%',
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: 160,
    right: '25%',
    width: 192,
    height: 192,
    borderRadius: 96,
  },

  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },

  header: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  logoSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
  },

  card: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  inputIcon: { paddingLeft: 16, paddingRight: 4 },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    paddingRight: 16,
  },
  errorText: { fontSize: 12, marginTop: 4, marginLeft: 2 },

  loginBtn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  loginBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  loginBtnText: { fontSize: 16, fontWeight: '700' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 12,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
  },
  googleBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  googleBtnDisabled: { opacity: 0.5 },
  googleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  footer: { marginTop: 24, alignItems: 'center', gap: 12 },
  linkText: { fontSize: 14 },
  linkBold: { fontSize: 14, fontWeight: '600' },
  signupRow: { flexDirection: 'row', alignItems: 'center' },
  footerMuted: { fontSize: 14 },
  badge: { marginTop: 8, alignItems: 'center', gap: 4, opacity: 0.4 },
  badgeText: { fontSize: 10, letterSpacing: 2 },
});
