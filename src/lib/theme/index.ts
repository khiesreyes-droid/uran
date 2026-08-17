import { useUniwind } from 'uniwind';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  error: string;
  onError: string;
  errorContainer: string;
  onBackground: string;
  surfaceVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
}

export const dark: ThemeColors = {
  background: '#10131a',
  surface: '#10131a',
  surfaceContainerLowest: '#0b0e15',
  surfaceContainerLow: '#191b23',
  surfaceContainer: '#1d2027',
  surfaceContainerHigh: '#272a31',
  surfaceContainerHighest: '#32353c',
  onSurface: '#e1e2ec',
  onSurfaceVariant: '#c2c6d6',
  outline: '#8c909f',
  outlineVariant: '#424754',
  primary: '#adc6ff',
  onPrimary: '#002e6a',
  primaryContainer: '#4d8eff',
  onPrimaryContainer: '#00285d',
  secondary: '#b9c8de',
  onSecondary: '#233143',
  secondaryContainer: '#39485a',
  tertiary: '#ffb95f',
  onTertiary: '#472a00',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onBackground: '#e1e2ec',
  surfaceVariant: '#32353c',
  inverseSurface: '#e1e2ec',
  inverseOnSurface: '#2e3038',
};

export const light: ThemeColors = {
  background: '#f7f9fb',
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerHighest: '#e0e3e5',
  onSurface: '#191c1e',
  onSurfaceVariant: '#424656',
  outline: '#737687',
  outlineVariant: '#c2c6d9',
  primary: '#004cca',
  onPrimary: '#ffffff',
  primaryContainer: '#0062ff',
  onPrimaryContainer: '#f3f3ff',
  secondary: '#00677f',
  onSecondary: '#ffffff',
  secondaryContainer: '#00ccf9',
  tertiary: '#48586d',
  onTertiary: '#ffffff',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onBackground: '#191c1e',
  surfaceVariant: '#e0e3e5',
  inverseSurface: '#2d3133',
  inverseOnSurface: '#eff1f3',
};

export function useThemeColors(): ThemeColors {
  const { theme } = useUniwind();
  return theme === 'dark' ? dark : light;
}
