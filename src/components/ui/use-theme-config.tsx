import type { Theme } from '@react-navigation/native';
import {
  DarkTheme as _DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { useUniwind } from 'uniwind';

import { dark as shieldDark, light as shieldLight } from '@/lib/theme';

const DarkTheme: Theme = {
  ..._DarkTheme,
  colors: {
    ..._DarkTheme.colors,
    primary: shieldDark.primaryContainer,      // #4d8eff
    background: shieldDark.background,          // #10131a
    text: shieldDark.onSurface,                 // #e1e2ec
    border: shieldDark.outlineVariant,          // #424754
    card: shieldDark.surfaceContainer,          // #1d2027
    notification: shieldDark.error,             // #ffb4ab
  },
};

const LightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: shieldLight.primary,               // #004cca
    background: shieldLight.background,         // #f7f9fb
    text: shieldLight.onSurface,                // #191c1e
    border: shieldLight.outlineVariant,         // #c2c6d9
    card: shieldLight.surfaceContainer,         // #eceef0
    notification: shieldLight.error,            // #ba1a1a
  },
};

export function useThemeConfig() {
  const { theme } = useUniwind();

  if (theme === 'dark')
    return DarkTheme;

  return LightTheme;
}
