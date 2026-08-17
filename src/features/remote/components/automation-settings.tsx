import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { useThemeColors, type ThemeColors } from '@/lib/theme';

import { Slider } from './slider';

// ─── Section icon ────────────────────────────────────────────────────────────

function TuneIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
    </Svg>
  );
}

// ─── Label formatters ─────────────────────────────────────────────────────────

function sensitivityLabel(v: number) {
  if (v < 34) return 'Low';
  if (v < 67) return 'Medium';
  return 'High';
}

function deployDelayLabel(v: number) {
  return `${Math.round((v / 100) * 60)}s`;
}

function retractDelayLabel(v: number) {
  const secs = Math.round((v / 100) * 200);
  return secs >= 60 ? `${Math.round(secs / 60)}m` : `${secs}s`;
}

// ─── Slider row ───────────────────────────────────────────────────────────────

interface SliderRowProps {
  label: string;
  valueLabel: string;
  value: number;
  onValueChange: (v: number) => void;
  c: ThemeColors;
}

function SliderRow({ label, valueLabel, value, onValueChange, c }: SliderRowProps) {
  return (
    <View style={s.sliderRow}>
      <View style={s.sliderMeta}>
        <Text style={[s.sliderLabel, { color: c.onSurface }]}>{label}</Text>
        <Text style={[s.sliderValue, { color: c.primary }]}>{valueLabel}</Text>
      </View>
      <Slider value={value} min={0} max={100} step={1} onValueChange={onValueChange} c={c} />
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AutomationSettings() {
  const c = useThemeColors();
  const [sensitivity, setSensitivity] = useState(50);
  const [deployDelay, setDeployDelay] = useState(25);
  const [retractDelay, setRetractDelay] = useState(60);

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <TuneIcon color={c.primary} />
        <Text style={[s.sectionLabel, { color: c.onSurfaceVariant }]}>
          AUTOMATION SETTINGS
        </Text>
      </View>

      <View
        style={[
          s.card,
          {
            backgroundColor: `${c.surfaceContainer}B3`,
            borderColor: `${c.outlineVariant}1A`,
          },
        ]}
      >
        <SliderRow
          label="Rain Sensitivity"
          valueLabel={sensitivityLabel(sensitivity)}
          value={sensitivity}
          onValueChange={setSensitivity}
          c={c}
        />
        <View style={[s.divider, { backgroundColor: `${c.outlineVariant}4D` }]} />
        <SliderRow
          label="Deployment Delay"
          valueLabel={deployDelayLabel(deployDelay)}
          value={deployDelay}
          onValueChange={setDeployDelay}
          c={c}
        />
        <View style={[s.divider, { backgroundColor: `${c.outlineVariant}4D` }]} />
        <SliderRow
          label="Retraction Delay"
          valueLabel={retractDelayLabel(retractDelay)}
          value={retractDelay}
          onValueChange={setRetractDelay}
          c={c}
        />
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  sliderRow: { gap: 10 },
  sliderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  sliderValue: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1 },
});
