import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { useThemeColors } from '@/lib/theme';

import { Toggle } from './toggle';

function VolumeOffIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </Svg>
  );
}

export function QuietHoursCard() {
  const c = useThemeColors();
  const [enabled, setEnabled] = useState(false);

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
      <View style={[s.iconWrap, { backgroundColor: `${c.tertiary}1A` }]}>
        <VolumeOffIcon color={c.tertiary} />
      </View>
      <View style={s.text}>
        <Text style={[s.title, { color: c.onSurface }]}>Quiet Hours</Text>
        <Text style={[s.body, { color: c.onSurfaceVariant }]}>
          Limit motor speed after 10 PM
        </Text>
      </View>
      <Toggle
        value={enabled}
        onToggle={() => setEnabled((v) => !v)}
        c={c}
        accentColor={c.tertiary}
      />
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
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 14, lineHeight: 20, marginTop: 2 },
});
