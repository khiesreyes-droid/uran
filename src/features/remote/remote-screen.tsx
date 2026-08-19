import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import {
  FocusAwareStatusBar,
  Pressable,
  ScrollView,
  View,
} from '@/components/ui';
import { Text } from '@/components/ui';
import { useThemeColors } from '@/lib/theme';

import { DeviceSelector } from '@/features/devices/device-selector';
import { useDeviceStore } from '@/features/devices/use-device-store';
import { sendCommand } from './api';
import { AutomationSettings } from './components/automation-settings';
import { AutoModeCard } from './components/auto-mode-card';
import { Diagnostics } from './components/diagnostics';
import { ManualControls } from './components/manual-controls';
import { QuietHoursCard } from './components/quiet-hours-card';
import { SmartSchedule } from './components/smart-schedule';
import { StatusHeader } from './components/status-header';

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

export function RemoteScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const selectedDeviceId = useDeviceStore((s) => s.selectedDeviceId);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <FocusAwareStatusBar />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: insets.top + 8,
          paddingBottom: 8,
          backgroundColor: c.background,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <GridViewIcon color={c.primary} />
          <DeviceSelector />
        </View>
        <Pressable style={{ padding: 4 }}>
          <BellIcon color={c.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <StatusHeader />
        <ManualControls
          onDeploy={() => { if (selectedDeviceId) sendCommand(selectedDeviceId, 'deploy'); }}
          onRetract={() => { if (selectedDeviceId) sendCommand(selectedDeviceId, 'retract'); }}
        />
        <AutoModeCard />
        <AutomationSettings />
        <SmartSchedule />
        <QuietHoursCard />
        <Diagnostics />
      </ScrollView>
    </View>
  );
}
