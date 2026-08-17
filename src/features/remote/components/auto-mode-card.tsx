import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemeColors } from '@/lib/theme';

import { Toggle } from './toggle';

export function AutoModeCard() {
  const c = useThemeColors();
  const [enabled, setEnabled] = useState(true);

  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: `${c.surfaceContainer}B3`,
          borderColor: `${c.outlineVariant}1A`,
        },
      ]}
    >
      <View style={s.text}>
        <Text style={[s.title, { color: c.onSurface }]}>Automatic Mode</Text>
        <Text style={[s.body, { color: c.onSurfaceVariant }]}>
          Deploy tarpaulin automatically when rain is detected.
        </Text>
      </View>
      <Toggle value={enabled} onToggle={() => setEnabled((v) => !v)} c={c} />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  text: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 14, lineHeight: 20, marginTop: 2 },
});
