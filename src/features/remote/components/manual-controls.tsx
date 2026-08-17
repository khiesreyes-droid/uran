import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Pressable, Text } from '@/components/ui';
import { useThemeColors } from '@/lib/theme';

function RemoteIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M15 9H9c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V10c0-.55-.45-1-1-1zm-3 12c-.83 0-1.5-.67-1.5-1.5S11.17 18 12 18s1.5.67 1.5 1.5S12.83 21 12 21zm3-5H9v-5h6v5zM17.56 5.92C16.06 4.72 14.12 4 12 4s-4.06.72-5.56 1.92L5.03 4.49C6.9 3.01 9.35 2 12 2s5.1 1.01 6.97 2.49l-1.41 1.43z" />
    </Svg>
  );
}

function DeployIcon({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 13.17V8h2v7.17l2.29-2.29 1.42 1.42L12 19l-4.71-4.71 1.42-1.42 2.29 2.3z" />
    </Svg>
  );
}

function RetractIcon({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M7.41 18.41L6 17l6-6 6 6-1.41 1.41L12 13.83l-4.59 4.58zm0-6L6 11l6-6 6 6-1.41 1.41L12 7.83 7.41 12.41z" />
    </Svg>
  );
}

interface ManualControlsProps {
  onDeploy: () => void;
  onRetract: () => void;
}

export function ManualControls({ onDeploy, onRetract }: ManualControlsProps) {
  const c = useThemeColors();
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <RemoteIcon color={c.primary} />
        <Text style={[s.sectionLabel, { color: c.onSurfaceVariant }]}>
          MANUAL OVERRIDE
        </Text>
      </View>

      <View style={s.grid}>
        <Pressable
          onPress={onDeploy}
          accessibilityRole="button"
          accessibilityLabel="Deploy cover"
          style={({ pressed }) => [
            s.actionBtn,
            {
              backgroundColor: `${c.surfaceContainer}B3`,
              borderColor: `${c.primary}33`,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={[s.iconWrap, { backgroundColor: `${c.primary}1A` }]}>
            <DeployIcon color={c.primary} />
          </View>
          <Text style={[s.btnLabel, { color: c.onSurface }]}>DEPLOY</Text>
        </Pressable>

        <Pressable
          onPress={onRetract}
          accessibilityRole="button"
          accessibilityLabel="Retract cover"
          style={({ pressed }) => [
            s.actionBtn,
            {
              backgroundColor: `${c.surfaceContainer}B3`,
              borderColor: `${c.outlineVariant}33`,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={[s.iconWrap, { backgroundColor: c.surfaceContainerHigh }]}>
            <RetractIcon color={c.onSurfaceVariant} />
          </View>
          <Text style={[s.btnLabel, { color: c.onSurface }]}>RETRACT</Text>
        </Pressable>
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
  grid: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
