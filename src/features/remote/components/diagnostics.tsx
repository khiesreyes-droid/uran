import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { useThemeColors } from '@/lib/theme';

function AnalyticsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
    </Svg>
  );
}

function GearIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.48.48 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </Svg>
  );
}

function WifiIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4l2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
    </Svg>
  );
}

interface DiagnosticItemProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueColor: string;
}

function DiagnosticItem({ icon, iconBg, label, value, valueColor }: DiagnosticItemProps) {
  const c = useThemeColors();
  return (
    <View
      style={[
        s.item,
        {
          backgroundColor: `${c.surfaceContainer}B3`,
          borderColor: `${c.outlineVariant}1A`,
        },
      ]}
    >
      <View style={[s.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View>
        <Text style={[s.itemLabel, { color: c.onSurfaceVariant }]}>{label}</Text>
        <Text style={[s.itemValue, { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

export function Diagnostics() {
  const c = useThemeColors();
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <AnalyticsIcon color={c.primary} />
        <Text style={[s.sectionLabel, { color: c.onSurfaceVariant }]}>
          DIAGNOSTICS
        </Text>
      </View>

      <View style={s.grid}>
        <DiagnosticItem
          icon={<GearIcon color="#4ade80" />}
          iconBg="rgba(74,222,128,0.15)"
          label="MOTOR HEALTH"
          value="Excellent"
          valueColor="#4ade80"
        />
        <DiagnosticItem
          icon={<WifiIcon color={c.primary} />}
          iconBg={`${c.primary}33`}
          label="SIGNAL"
          value="Strong"
          valueColor={c.primary}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', gap: 10 },
  item: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  itemValue: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 2 },
});
