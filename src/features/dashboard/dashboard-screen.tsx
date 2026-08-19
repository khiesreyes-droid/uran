import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FocusAwareStatusBar,
  Pressable,
  ScrollView,
  View,
} from '@/components/ui';
import { Text } from '@/components/ui';
import { useThemeColors, type ThemeColors } from '@/lib/theme';
import { DeviceSelector } from '@/features/devices/device-selector';
import { useDeviceStore } from '@/features/devices/use-device-store';
import { useRTDBForecast, getConditionText, getRainTimeDisplay, type WeatherForecast, type DryingCondition } from './use-rtdb-forecast';

// ─── Screen-local icons ─────────────────────────────────────────────────────

function ShieldIcon({ color, size = 48 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </Svg>
  );
}

function GridViewIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
      <Path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
    </Svg>
  );
}

function BellIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </Svg>
  );
}

function BrainIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
    </Svg>
  );
}

function RainIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M17.92 7.02C17.45 4.18 14.97 2 12 2 9.82 2 7.83 3.18 6.72 5.02 4.09 5.32 2 7.5 2 10c0 2.76 2.24 5 5 5h10c2.21 0 4-1.79 4-4 0-2.11-1.63-3.84-3.72-3.98zM14.5 18l-1.5 3h-2l1.5-3h2zm-5 0l-1.5 3h-2l1.5-3h2z" />
    </Svg>
  );
}

function LayersIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
    </Svg>
  );
}

function BatteryIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM13 18h-2v-2H9l3-5v3h2l-3 5v-3z" />
    </Svg>
  );
}

function WifiIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4l2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
    </Svg>
  );
}

function EmergencyIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </Svg>
  );
}

// ─── AI Forecast card ────────────────────────────────────────────────────────

function conditionAccentColor(
  condition: DryingCondition | undefined,
  c: ThemeColors,
): string {
  switch (condition) {
    case 'excellent':
    case 'optimal':
      return c.tertiary;
    case 'poor':
      return c.error;
    default:
      return c.tertiary;
  }
}

interface AiForecastCardProps {
  forecast: WeatherForecast | null | undefined;
  loading: boolean;
  error: boolean;
  c: ThemeColors;
}

function AiForecastCard({ forecast, loading, error, c }: AiForecastCardProps) {
  const accent = conditionAccentColor(forecast?.condition, c);

  return (
    <View
      style={[
        s.aiForecastCard,
        {
          backgroundColor: `${c.surfaceContainer}B3`,
          borderColor: `${c.outlineVariant}1A`,
          borderLeftColor: accent,
          marginBottom: 24,
        },
      ]}
    >
      {loading
        ? (
            <ActivityIndicator size="small" color={c.primary} />
          )
        : (
            <BrainIcon color={accent} size={28} />
          )}
      <View style={{ flex: 1 }}>
        <Text style={[s.labelCaps, { color: c.onSurfaceVariant }]}>
          RAIN FORECAST · WEATHER
        </Text>
        {loading && (
          <Text style={[s.bodyLg, { color: c.onSurfaceVariant, marginTop: 4 }]}>
            Fetching Rain Forecast…
          </Text>
        )}
        {error && !loading && (
          <Text style={[s.bodySm, { color: c.error, marginTop: 4 }]}>
            Unable to reach tomorrow.io — check your connection.
          </Text>
        )}
        {forecast && !loading && (
          <>
            <Text style={[s.bodyLg, { color: c.onSurface, marginTop: 2 }]}>
              {forecast.rainExpected
                ? (
                    <>
                      {'Rain likely around '}
                      <Text style={{ color: c.error, fontWeight: '700' }}>
                        {getRainTimeDisplay(forecast)}
                      </Text>
                    </>
                  )
                : (
                    <>
                      {'Estimated Drying Time: '}
                      <Text style={{ color: c.primary, fontWeight: '700' }}>
                        {`${forecast.estimatedMinutes} mins`}
                      </Text>
                    </>
                  )}
            </Text>
            <Text
              style={[
                s.bodySm,
                { color: c.onSurfaceVariant, fontStyle: 'italic', marginTop: 2 },
              ]}
            >
              {getConditionText(forecast)}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

// ─── Sensor card ─────────────────────────────────────────────────────────────

interface SensorCardProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  sub?: React.ReactNode;
  c: ThemeColors;
}

function SensorCard({ label, icon, value, sub, c }: SensorCardProps) {
  return (
    <View
      style={[
        s.sensorCard,
        {
          backgroundColor: `${c.surfaceContainer}B3`,
          borderColor: `${c.outlineVariant}1A`,
        },
      ]}
    >
      <View style={s.sensorCardHeader}>
        {icon}
        <Text style={[s.labelCaps, { color: c.onSurfaceVariant }]}>{label}</Text>
      </View>
      <View style={s.sensorCardFooter}>
        <Text style={[s.headlineMobile, { color: c.onSurface }]}>{value}</Text>
        {typeof sub === 'string'
          ? (
              <Text style={[s.bodySm, { color: c.onSurfaceVariant }]}>{sub}</Text>
            )
          : (
              sub
            )}
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

const RING_SIZE = 216;

export function DashboardScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [coverOpen, setCoverOpen] = useState(false);
  const selectedDeviceId = useDeviceStore((s) => s.selectedDeviceId);
  const { data: forecast, loading: forecastLoading, error: forecastError } = useRTDBForecast(selectedDeviceId);
  const isLoading = forecastLoading;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [spinAnim, pulseAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <FocusAwareStatusBar />

      {/* Header */}
      <View
        style={[
          s.header,
          { paddingTop: insets.top + 8, backgroundColor: c.background },
        ]}
      >
        <View style={s.headerLeft}>
          <GridViewIcon color={c.primary} />
          <DeviceSelector />
        </View>
        <View style={s.headerBell}>
          <BellIcon color={c.primary} />
          <View
            style={[
              s.bellBadge,
              { backgroundColor: c.error, borderColor: c.background },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Central status ring */}
        <View style={s.statusSection}>
          <View style={[s.ringContainer, { width: RING_SIZE, height: RING_SIZE }]}>
            <View
              style={[
                s.ringStatic,
                {
                  width: RING_SIZE,
                  height: RING_SIZE,
                  borderRadius: RING_SIZE / 2,
                  borderColor: `${c.primary}33`,
                },
              ]}
            />
            <View
              style={[
                s.ringGlow,
                {
                  width: RING_SIZE,
                  height: RING_SIZE,
                  borderRadius: RING_SIZE / 2,
                  backgroundColor: `${c.primary}0D`,
                },
              ]}
            />
            <Animated.View
              style={[
                s.ringSpinner,
                {
                  width: RING_SIZE,
                  height: RING_SIZE,
                  borderRadius: RING_SIZE / 2,
                  borderTopColor: c.primary,
                  transform: [{ rotate: spin }],
                },
              ]}
            />
            <View style={s.ringCenter}>
              <ShieldIcon color={c.primary} size={52} />
              <Text
                style={[
                  s.headlineMobile,
                  { color: c.onSurface, textAlign: 'center', marginTop: 8 },
                ]}
              >
                {'CLOTHES\nPROTECTED'}
              </Text>
            </View>
          </View>

          <View style={[s.modeBadge, { backgroundColor: c.secondaryContainer }]}>
            <Animated.View
              style={[
                s.pulseDot,
                { backgroundColor: c.primary, opacity: pulseAnim },
              ]}
            />
            <Text style={[s.labelCaps, { color: c.onSurface }]}>
              MANUAL MODE
            </Text>
          </View>
        </View>

        {/* AI Forecast card — powered by Google WeatherNext2 */}
        <AiForecastCard
          forecast={forecast}
          loading={isLoading}
          error={forecastError}
          c={c}
        />

        {/* Sensor bento grid */}
        <View style={s.bentoRow}>
          <SensorCard
            label="RAIN"
            icon={<RainIcon color={c.primary} />}
            value={forecast?.rainExpected ? 'Soon' : 'None'}
            sub={forecast?.rainExpected ? 'Rain incoming' : 'Sky is clear'}
            c={c}
          />
          <SensorCard
            label="COVER"
            icon={<LayersIcon color={c.primary} />}
            value="Retracted"
            sub={
              <View
                style={[
                  s.progressBg,
                  { backgroundColor: c.surfaceContainerHigh },
                ]}
              >
                <View style={[s.progressFill, { backgroundColor: c.primary }]} />
              </View>
            }
            c={c}
          />
        </View>
        <View style={[s.bentoRow, { marginBottom: 16 }]}>
          <SensorCard
            label="POWER"
            icon={<BatteryIcon color={c.primary} />}
            value="92%"
            sub="Charging via solar"
            c={c}
          />
          <SensorCard
            label="LINK"
            icon={<WifiIcon color={c.primary} />}
            value="Strong"
            sub="-42 dBm"
            c={c}
          />
        </View>

        {/* Ambient sensors row — values from WeatherNext2 */}
        <View
          style={[
            s.sensorsRow,
            {
              backgroundColor: `${c.surfaceContainer}B3`,
              borderColor: `${c.outlineVariant}1A`,
              marginBottom: 24,
            },
          ]}
        >
          <View
            style={[s.sensorCell, { borderRightColor: `${c.outlineVariant}4D` }]}
          >
            <Text style={[s.labelCaps, { color: c.onSurfaceVariant }]}>TEMP</Text>
            <Text style={[s.bodyLgBold, { color: c.onSurface }]}>
              {isLoading ? '—' : `${forecast?.temperature ?? '—'}°C`}
            </Text>
          </View>
          <View
            style={[s.sensorCell, { borderRightColor: `${c.outlineVariant}4D` }]}
          >
            <Text style={[s.labelCaps, { color: c.onSurfaceVariant }]}>HUMID</Text>
            <Text style={[s.bodyLgBold, { color: c.onSurface }]}>
              {isLoading ? '—' : `${forecast?.humidity ?? '—'}%`}
            </Text>
          </View>
          <View style={s.sensorCellLast}>
            <Text style={[s.labelCaps, { color: c.onSurfaceVariant }]}>WIND</Text>
            <Text style={[s.bodyLgBold, { color: c.onSurface }]}>
              {isLoading ? '—' : `${forecast?.windSpeed ?? '—'} km/h`}
            </Text>
          </View>
        </View>

        {/* Quick actions */}
        <Text style={[s.sectionLabel, { color: c.onSurfaceVariant }]}>
          QUICK ACTIONS
        </Text>
        <View style={[s.actionsRow, { marginTop: 12, marginBottom: 24 }]}>
          <Pressable
            onPress={() => setCoverOpen((v) => !v)}
            style={[
              s.toggleBtn,
              {
                backgroundColor: `${c.surfaceContainer}B3`,
                borderColor: `${c.outlineVariant}1A`,
              },
            ]}
          >
            <View style={s.toggleLeft}>
              <View
                style={[s.toggleIconWrap, { backgroundColor: `${c.primary}1A` }]}
              >
                <LayersIcon color={c.primary} size={24} />
              </View>
              <View>
                <Text style={[s.bodyLgBold, { color: c.onSurface }]}>
                  {coverOpen ? 'Open' : 'Closed'}
                </Text>
                <Text style={[s.bodySm, { color: c.onSurfaceVariant }]}>
                  {`Status: ${coverOpen ? 'Open' : 'Retracted'}`}
                </Text>
              </View>
            </View>
            <View
              style={[
                s.switchTrack,
                {
                  backgroundColor: coverOpen
                    ? c.primaryContainer
                    : c.surfaceContainerHighest,
                },
              ]}
            >
              <View
                style={[
                  s.switchThumb,
                  {
                    backgroundColor: coverOpen
                      ? c.onPrimaryContainer
                      : c.onSurfaceVariant,
                    transform: [{ translateX: coverOpen ? 24 : 0 }],
                  },
                ]}
              />
            </View>
          </Pressable>

          <Pressable
            style={[
              s.stopBtn,
              {
                backgroundColor: `${c.surfaceContainer}B3`,
                borderColor: `${c.error}33`,
              },
            ]}
          >
            <EmergencyIcon color={c.error} size={24} />
            <Text style={[s.stopLabel, { color: c.error }]}>STOP</Text>
          </Pressable>
        </View>

        {/* Atmospheric visual layer */}
        <View
          style={[
            s.atmosphericLayer,
            {
              backgroundColor: c.surfaceContainerLowest,
              borderColor: `${c.primary}1A`,
            },
          ]}
        >
          <View style={[s.liveViewBadge, { backgroundColor: `${c.primary}33` }]}>
            <Text style={[s.labelCaps, { color: c.primary }]}>LIVE VIEW</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  headerBell: { position: 'relative', padding: 4 },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  statusSection: { alignItems: 'center', paddingVertical: 32 },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringStatic: { position: 'absolute', borderWidth: 4 },
  ringGlow: { position: 'absolute' },
  ringSpinner: {
    position: 'absolute',
    borderWidth: 4,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  ringCenter: { alignItems: 'center' },
  modeBadge: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  aiForecastCard: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  bentoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  sensorCard: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'space-between',
  },
  sensorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sensorCardFooter: { gap: 4 },
  sensorsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sensorCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRightWidth: 1,
  },
  sensorCellLast: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  actionsRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  switchThumb: { width: 24, height: 24, borderRadius: 12 },
  stopBtn: {
    width: 80,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 16,
  },
  stopLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  atmosphericLayer: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 16,
  },
  liveViewBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  progressBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { width: '0%', height: 4, borderRadius: 2 },
  headlineMobile: { fontSize: 22, fontWeight: '700', lineHeight: 30 },
  bodyLg: { fontSize: 16, lineHeight: 24 },
  bodyLgBold: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  bodySm: { fontSize: 14, lineHeight: 20 },
  labelCaps: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
