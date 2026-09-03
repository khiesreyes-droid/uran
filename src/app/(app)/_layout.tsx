import { Redirect, Tabs } from 'expo-router';
import * as React from 'react';

import {
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Insights as InsightsIcon,
  Settings as SettingsIcon,
} from '@/components/ui/icons';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';
import { useIsFirstTime } from '@/lib/hooks/use-is-first-time';

export default function TabLayout() {
  const status = useAuth.use.status();
  const [isFirstTime] = useIsFirstTime();

  if (isFirstTime) {
    return <Redirect href="/onboarding" />;
  }
  if (status === 'signOut') {
    return <Redirect href="/login" />;
  }
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color }) => <DashboardIcon color={color} />,
          tabBarButtonTestID: 'dashboard-tab',
        }}
      />
      {/* Remote tab hidden for now — route still reachable directly */}
      <Tabs.Screen name="remote" options={{ href: null }} />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          headerShown: false,
          tabBarIcon: ({ color }) => <InsightsIcon color={color} />,
          tabBarButtonTestID: 'insights-tab',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerShown: false,
          tabBarIcon: ({ color }) => <HistoryIcon color={color} />,
          tabBarButtonTestID: 'history-tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
          tabBarButtonTestID: 'settings-tab',
        }}
      />
      <Tabs.Screen name="style" options={{ href: null }} />
      <Tabs.Screen name="devices" options={{ href: null }} />
    </Tabs>
  );
}
