import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemeColors } from '@/lib/theme';

export function StatusHeader() {
  const c = useThemeColors();
  return (
    <View
      style={[
        s.container,
        {
          backgroundColor: `${c.surfaceContainer}B3`,
          borderColor: `${c.outlineVariant}1A`,
        },
      ]}
    >
      <View style={[s.overlay, { backgroundColor: `${c.background}E6` }]}>
        <Text style={[s.label, { color: c.primary }]}>STATUS</Text>
        <Text style={[s.headline, { color: c.onSurface }]}>System Idle</Text>
        <Text style={[s.body, { color: c.onSurfaceVariant }]}>
          Monitoring environmental risks
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    height: 176,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 32,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
});
