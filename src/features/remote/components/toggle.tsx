import { MotiView } from 'moti';
import { Pressable, StyleSheet } from 'react-native';

import type { ThemeColors } from '@/lib/theme';

interface ToggleProps {
  value: boolean;
  onToggle: () => void;
  c: ThemeColors;
  accentColor?: string;
}

export function Toggle({ value, onToggle, c, accentColor }: ToggleProps) {
  const trackColor = value ? (accentColor ?? c.primary) : c.surfaceContainerHighest;
  const thumbColor = value ? c.onPrimary : c.onSurfaceVariant;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[s.track, { backgroundColor: trackColor }]}
    >
      <MotiView
        animate={{ left: value ? 26 : 4 }}
        transition={{ type: 'timing', duration: 150 }}
        style={[s.thumb, { backgroundColor: thumbColor }]}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  track: {
    width: 52,
    height: 30,
    borderRadius: 15,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: 'absolute',
    top: 4,
  },
});
