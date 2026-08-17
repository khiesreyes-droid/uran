import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusAwareStatusBar, Pressable, ScrollView, Text } from '@/components/ui';
import { useThemeColors, type ThemeColors } from '@/lib/theme';
import { useRTDBForecast, type WeatherForecast } from '@/features/dashboard/use-rtdb-forecast';
import { weatherLabel } from './api';

// ─── Icons ────────────────────────────────────────────────────────────────────

function BrainIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
      <Path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
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

function UmbrellaIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
      <Path d="M23 12C23 6.24 17.48 1.5 11.99 1.5S1 6.24 1 12h11v8.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V12h8z" />
    </Svg>
  );
}

// ─── Weather icon — Tomorrow.io weather codes ─────────────────────────────────
// 1000/1100 = clear, 1101 = partly cloudy, 1001/1102 = cloudy, 2000+ = fog/rain/storm

function WeatherIcon({ code, color, size = 36 }: { code: number; color: string; size?: number }) {
  // Rain, drizzle, thunderstorm (4000+, 6000+, 8000)
  if (code >= 4000) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <Path d="M17.92 7.02C17.45 4.18 14.97 2 12 2 9.82 2 7.83 3.18 6.72 5.02 4.09 5.32 2 7.5 2 10c0 2.76 2.24 5 5 5h10c2.21 0 4-1.79 4-4 0-2.11-1.63-3.84-3.72-3.98zM14.5 18l-1.5 3h-2l1.5-3h2zm-5 0l-1.5 3h-2l1.5-3h2z" />
      </Svg>
    );
  }
  // Fog (2000–2100)
  if (code >= 2000) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <Path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.61 5.64 5.36 8.04 2.35 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
      </Svg>
    );
  }
  // Overcast / mostly cloudy (1001, 1102)
  if (code === 1001 || code === 1102) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <Path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.61 5.64 5.36 8.04 2.35 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
      </Svg>
    );
  }
  // Partly cloudy (1101)
  if (code === 1101) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <Path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" />
      </Svg>
    );
  }
  // Clear / mostly clear (1000, 1100)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" />
    </Svg>
  );
}

// ─── Current Weather card ─────────────────────────────────────────────────────

const CHART_H = 80;
const CHART_LABELS = ['NOW', '+1H', '+2H', '+3H'];

interface CurrentWeatherCardProps {
  forecast: WeatherForecast | null | undefined;
  loading: boolean;
  c: ThemeColors;
}

function CurrentWeatherCard({ forecast, loading, c }: CurrentWeatherCardProps) {
  const code = forecast?.weatherCode ?? 1000;
  const prob = forecast?.precipProbability ?? [0, 0, 0, 0];
  const maxProb = Math.max(...prob, 10);

  return (
    <View style={[s.card, { backgroundColor: `${c.surfaceContainer}B3`, borderColor: `${c.outlineVariant}1A` }]}>
      {/* Top row */}
      <View style={s.weatherTop}>
        <View>
          <Text style={[s.labelCaps, { color: c.onSurfaceVariant }]}>CURRENT WEATHER</Text>
          <View style={s.tempRow}>
            {loading
              ? <ActivityIndicator size="small" color={c.primary} style={{ marginTop: 8 }} />
              : (
                <>
                  <WeatherIcon code={code} color={c.primary} size={36} />
                  <Text style={[s.tempValue, { color: c.onSurface }]}>
                    {forecast ? `${forecast.temperature}°C` : '—'}
                  </Text>
                </>
              )}
          </View>
          <Text style={[s.bodySm, { color: c.onSurfaceVariant, marginTop: 2 }]}>
            {loading ? 'Loading…' : weatherLabel(code)}
          </Text>
        </View>
        <View style={[s.umbrellaWrap, { backgroundColor: `${c.tertiary}26` }]}>
          <UmbrellaIcon color={c.tertiary} />
        </View>
      </View>

      <View style={[s.divider, { backgroundColor: `${c.outlineVariant}33` }]} />

      {/* 4H chart */}
      <Text style={[s.labelCaps, { color: c.onSurfaceVariant, marginBottom: 12 }]}>
        RAIN FORECAST (4H)
      </Text>
      <View style={[s.chartWrap, { height: CHART_H + 24 }]}>
        {CHART_LABELS.map((label, i) => {
          const p = prob[i] ?? 0;
          const barH = Math.max(4, (p / maxProb) * CHART_H);
          const isHigh = p > 50;
          return (
            <View key={label} style={s.chartCol}>
              <View style={[s.chartBarBg, { height: CHART_H, backgroundColor: `${c.primary}12` }]}>
                <View
                  style={[
                    s.chartBarFill,
                    {
                      height: barH,
                      backgroundColor: isHigh ? c.error : c.primary,
                      opacity: 0.35 + (p / 100) * 0.65,
                    },
                  ]}
                />
              </View>
              <Text style={[s.chartLabel, { color: c.onSurfaceVariant }]}>{label}</Text>
              {p > 0 && (
                <Text style={[s.chartPct, { color: isHigh ? c.error : c.primary }]}>
                  {`${p}%`}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      <Text style={[s.sourceLabel, { color: `${c.onSurfaceVariant}80` }]}>
        Via Tomorrow.io · Firebase RTDB
      </Text>
    </View>
  );
}

// ─── AI Insight card ──────────────────────────────────────────────────────────

interface AiInsightCardProps {
  forecast: WeatherForecast | null | undefined;
  loading: boolean;
  c: ThemeColors;
}

function AiInsightCard({ forecast, loading, c }: AiInsightCardProps) {
  return (
    <View style={[s.aiCard, { backgroundColor: `${c.primary}12`, borderColor: `${c.primary}30` }]}>
      <View style={[s.aiIconWrap, { backgroundColor: `${c.primary}26` }]}>
        <BrainIcon color={c.primary} />
      </View>
      <View style={s.aiBody}>
        <Text style={[s.bodySm, { color: c.onSurface, lineHeight: 20 }]}>
          <Text style={{ fontWeight: '700', color: c.primary }}>AI Insight: </Text>
          {loading
            ? 'Analyzing Tomorrow.io forecast data…'
            : (forecast?.conditionText ?? 'No forecast available.')}
        </Text>
        {forecast?.rainExpected && !loading && (
          <Pressable
            style={({ pressed }) => [
              s.autoModeBtn,
              { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[s.autoModeBtnLabel, { color: c.onPrimary }]}>
              ENABLE AUTO MODE
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Dryness card ─────────────────────────────────────────────────────────────

const RING_R = 36;
const RING_CX = 46;
const RING_CY = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

function drynessPercent(f: WeatherForecast): number {
  if (f.rainExpected) return 20;
  return Math.round(100 - ((f.estimatedMinutes - 20) / 160) * 85);
}

function drynessLabel(pct: number): string {
  if (pct >= 85) return 'Excellent';
  if (pct >= 65) return 'Almost Dry';
  if (pct >= 45) return 'Drying Well';
  if (pct >= 25) return 'Slow Drying';
  return 'Poor Conditions';
}

interface DrynessCardProps {
  forecast: WeatherForecast | null | undefined;
  loading: boolean;
  c: ThemeColors;
}

function DrynessCard({ forecast, loading, c }: DrynessCardProps) {
  const pct = forecast ? drynessPercent(forecast) : 0;
  const dash = (pct / 100) * RING_CIRCUMFERENCE;
  const gap = RING_CIRCUMFERENCE - dash;
  const ringColor = pct >= 65 ? c.tertiary : pct >= 40 ? c.primary : c.error;

  return (
    <View style={[s.card, { backgroundColor: `${c.surfaceContainer}B3`, borderColor: `${c.outlineVariant}1A`, alignItems: 'center' }]}>
      <Text style={[s.labelCaps, { color: c.onSurfaceVariant, marginBottom: 16 }]}>
        DRYNESS ESTIMATION
      </Text>

      {loading
        ? <ActivityIndicator size="large" color={c.primary} style={{ marginVertical: 24 }} />
        : (
          <View style={s.ringWrap}>
            <Svg width={92} height={92} viewBox="0 0 92 92">
              <Circle
                cx={RING_CX} cy={RING_CY} r={RING_R}
                fill="none"
                stroke={`${ringColor}22`}
                strokeWidth={8}
              />
              <Circle
                cx={RING_CX} cy={RING_CY} r={RING_R}
                fill="none"
                stroke={ringColor}
                strokeWidth={8}
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="round"
                transform={`rotate(-90, ${RING_CX}, ${RING_CY})`}
              />
            </Svg>
            <View style={s.ringLabel}>
              <Text style={[s.ringPct, { color: ringColor }]}>{`${pct}%`}</Text>
            </View>
          </View>
        )}

      <Text style={[s.bodyLgBold, { color: c.onSurface, marginTop: 8 }]}>
        {loading ? '…' : drynessLabel(pct)}
      </Text>
      {forecast && !loading && (
        <Text style={[s.bodySm, { color: c.onSurfaceVariant, marginTop: 4, textAlign: 'center' }]}>
          {`Est. drying time: ${forecast.estimatedMinutes} min`}
        </Text>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function InsightsScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { data: forecast, loading, error: isError } = useRTDBForecast();

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <FocusAwareStatusBar />

      <View style={[s.header, { paddingTop: insets.top + 8, backgroundColor: c.background }]}>
        <View style={s.headerLeft}>
          <BrainIcon color={c.primary} />
          <Text style={[s.headerTitle, { color: c.onSurface }]}>INSIGHTS</Text>
        </View>
        <View style={s.headerBell}>
          <BellIcon color={c.primary} />
          <View style={[s.bellBadge, { backgroundColor: c.error, borderColor: c.background }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isError && !loading && (
          <View style={[s.errorBanner, { backgroundColor: `${c.error}1A`, borderColor: `${c.error}33` }]}>
            <Text style={[s.bodySm, { color: c.error }]}>
              Unable to reach Tomorrow.io — check your API key or connection.
            </Text>
          </View>
        )}

        <CurrentWeatherCard forecast={forecast} loading={loading} c={c} />
        <AiInsightCard forecast={forecast} loading={loading} c={c} />
        <DrynessCard forecast={forecast} loading={loading} c={c} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  weatherTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tempRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  tempValue: { fontSize: 36, fontWeight: '700', letterSpacing: -1 },
  umbrellaWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, marginBottom: 16 },
  chartWrap: { flexDirection: 'row', gap: 8 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartBarBg: { width: '100%', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBarFill: { width: '100%', borderRadius: 6 },
  chartLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  chartPct: { fontSize: 10, fontWeight: '700' },
  sourceLabel: { fontSize: 10, marginTop: 12, textAlign: 'center' },
  aiCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  aiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBody: { flex: 1, gap: 12 },
  autoModeBtn: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  autoModeBtnLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  ringWrap: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: 20, fontWeight: '800' },
  labelCaps: { fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  bodySm: { fontSize: 14, lineHeight: 20 },
  bodyLgBold: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
});
