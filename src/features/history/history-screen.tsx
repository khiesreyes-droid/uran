import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusAwareStatusBar, ScrollView } from '@/components/ui';
import { Text } from '@/components/ui';
import { History as HistoryIcon } from '@/components/ui/icons';
import { DeviceSelector } from '@/features/devices/device-selector';
import { useDeviceStore } from '@/features/devices/use-device-store';
import { useThemeColors } from '@/lib/theme';

import { useHistory, type HistoryEvent } from './api';

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <Path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </Svg>
  );
}

function DeployIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 13.17V8h2v7.17l2.29-2.29 1.42 1.42L12 19l-4.71-4.71 1.42-1.42 2.29 2.3z" />
    </Svg>
  );
}

function RetractIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M7.41 18.41L6 17l6-6 6 6-1.41 1.41L12 13.83l-4.59 4.58zm0-6L6 11l6-6 6 6-1.41 1.41L12 7.83 7.41 12.41z" />
    </Svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TZ = 'Asia/Manila';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ,
  });
}

function localDateStr(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: TZ, year: 'numeric', month: 'short', day: 'numeric',
  });
}

function todayStr(): string {
  return localDateStr(new Date().toISOString());
}

function yesterdayStr(): string {
  return localDateStr(new Date(Date.now() - 86400000).toISOString());
}

function dateLabel(dateStr: string): string {
  if (dateStr === todayStr()) return 'Today';
  if (dateStr === yesterdayStr()) return 'Yesterday';
  return dateStr;
}

type FilterPeriod = 'today' | 'yesterday' | '7days';

function filterByPeriod(events: HistoryEvent[], period: FilterPeriod): HistoryEvent[] {
  const now = Date.now();
  return events.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    if (period === 'today') return localDateStr(e.timestamp) === todayStr();
    if (period === 'yesterday') return localDateStr(e.timestamp) === yesterdayStr();
    return t >= now - 7 * 86400000;
  });
}

// ─── Event card ───────────────────────────────────────────────────────────────

// "opening" / "open" read as the cover deploying; everything else as retracting.
function isDeployStatus(status: string): boolean {
  return /open/i.test(status);
}

function formatStatus(status: string): string {
  if (!status || status === '—') return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function EventCard({ event, c }: { event: HistoryEvent; c: ReturnType<typeof useThemeColors> }) {
  const isDeploy = isDeployStatus(event.deviceStatus);
  const iconColor = isDeploy ? c.primary : c.tertiary;
  const iconBg = isDeploy ? `${c.primary}1A` : `${c.tertiary}1A`;

  return (
    <View
      style={[
        s.card,
        { backgroundColor: `${c.surfaceContainer}B3`, borderColor: `${c.outlineVariant}26` },
      ]}
    >
      <View style={[s.iconWrap, { backgroundColor: iconBg }]}>
        {isDeploy
          ? <DeployIcon color={iconColor} />
          : <RetractIcon color={iconColor} />}
      </View>
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={[s.cardTitle, { color: c.onSurface }]}>{formatStatus(event.deviceStatus)}</Text>
          <Text style={[s.cardTime, { color: c.onSurfaceVariant }]}>{formatTime(event.timestamp)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function HistoryScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const selectedDeviceId = useDeviceStore((s) => s.selectedDeviceId);
  const { events, loading } = useHistory(selectedDeviceId);

  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<FilterPeriod>('7days');

  const filtered = useMemo(() => {
    let result = filterByPeriod(events, period);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.deviceStatus.toLowerCase().includes(q));
    }
    return result;
  }, [events, period, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; items: HistoryEvent[] }[] = [];
    for (const event of filtered) {
      const label = dateLabel(localDateStr(event.timestamp));
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.items.push(event);
      } else {
        groups.push({ label, items: [event] });
      }
    }
    return groups;
  }, [filtered]);

  const PERIODS: { key: FilterPeriod; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: '7days', label: 'Last 7 Days' },
  ];

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
          <HistoryIcon color={c.primary} />
          <DeviceSelector />
        </View>
      </View>

      {/* Search + filter */}
      <View style={[s.searchSection, { backgroundColor: c.background }]}>
        <View
          style={[
            s.searchWrap,
            { backgroundColor: c.surfaceContainerHigh, borderColor: `${c.outlineVariant}66` },
          ]}
        >
          <SearchIcon color={c.outline} />
          <TextInput
            style={[s.searchInput, { color: c.onSurface }]}
            placeholder="Search events…"
            placeholderTextColor={c.outline}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* Filter tabs */}
        <View style={[s.filterRow, { borderBottomColor: `${c.outlineVariant}40` }]}>
          <View style={s.filterTabs}>
            {PERIODS.map((p) => {
              const active = period === p.key;
              return (
                <Pressable key={p.key} onPress={() => setPeriod(p.key)} style={s.filterTab}>
                  <Text
                    style={[
                      s.filterLabel,
                      { color: active ? c.primary : c.onSurfaceVariant },
                    ]}
                  >
                    {p.label}
                  </Text>
                  {active && (
                    <View style={[s.filterIndicator, { backgroundColor: c.primary }]} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Content */}
      {loading
        ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={c.primary} />
            </View>
          )
        : grouped.length === 0
          ? (
              <View style={s.center}>
                <HistoryIcon color={`${c.onSurfaceVariant}40`} width={48} height={48} />
                <Text style={[s.emptyTitle, { color: c.onSurface }]}>No events</Text>
                <Text style={[s.emptyDesc, { color: c.onSurfaceVariant }]}>
                  {search
                    ? 'No results match your search.'
                    : events.length > 0
                      ? 'No state changes in this period — try “Last 7 Days”.'
                      : 'Cover state changes will appear here once the device reports in.'}
                </Text>
              </View>
            )
          : (
              <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8, gap: 12 }}
                showsVerticalScrollIndicator={false}
              >
                {grouped.map((group) => (
                  <View key={group.label} style={{ gap: 10 }}>
                    {group.label !== 'Today' && (
                      <View style={s.dateSeparator}>
                        <Text style={[s.dateSeparatorText, { color: c.outline }]}>
                          {group.label.toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {group.items.map((event) => (
                      <EventCard key={event.id} event={event} c={c} />
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchSection: { paddingHorizontal: 20, paddingBottom: 0, gap: 8 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    marginTop: 4,
  },
  filterTabs: { flexDirection: 'row', gap: 24 },
  filterTab: { paddingVertical: 10, position: 'relative' },
  filterLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  filterIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  dateSeparator: { alignItems: 'center', paddingVertical: 4 },
  dateSeparatorText: { fontSize: 11, fontWeight: '600', letterSpacing: 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  cardTime: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginLeft: 8 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
});
