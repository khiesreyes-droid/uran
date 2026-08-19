import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { Modal, useModal } from '@/components/ui/modal';
import { useThemeColors } from '@/lib/theme';

import { useDevices } from './api';
import { useDeviceStore } from './use-device-store';

function ChevronDownIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={color}>
      <Path d="M7 10l5 5 5-5H7z" />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={color}>
      <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </Svg>
  );
}

export function DeviceSelector() {
  const c = useThemeColors();
  const router = useRouter();
  const { ref, present, dismiss } = useModal();
  const { devices } = useDevices();
  const selectedDeviceId = useDeviceStore((s) => s.selectedDeviceId);
  const setSelectedDeviceId = useDeviceStore((s) => s.setSelectedDeviceId);

  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId, setSelectedDeviceId]);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
  const label = selectedDevice?.name ?? (devices.length > 0 ? 'Select Device' : 'No Device');

  return (
    <>
      <Pressable
        onPress={present}
        style={s.trigger}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[s.triggerLabel, { color: c.onSurface }]}>{label}</Text>
        <ChevronDownIcon color={c.onSurfaceVariant} />
      </Pressable>

      <Modal ref={ref} title="Select Device" snapPoints={['55%']}>
        <BottomSheetScrollView contentContainerStyle={s.listContent}>
          {devices.length === 0
            ? (
                <Text style={[s.emptyText, { color: c.onSurfaceVariant }]}>
                  No devices registered yet.
                </Text>
              )
            : devices.map((item) => {
                const isSelected = item.id === selectedDeviceId;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedDeviceId(item.id);
                      dismiss();
                    }}
                    style={[s.deviceRow, { borderBottomColor: `${c.outlineVariant}33` }]}
                  >
                    <View style={s.deviceInfo}>
                      <Text style={[s.deviceName, { color: c.onSurface }]}>{item.name}</Text>
                      {!!item.address && (
                        <Text style={[s.deviceAddress, { color: c.onSurfaceVariant }]}>
                          {item.address}
                        </Text>
                      )}
                      <Text style={[s.deviceCoords, { color: `${c.onSurfaceVariant}80` }]}>
                        {`${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
                      </Text>
                    </View>
                    {isSelected && <CheckIcon color={c.primary} />}
                  </Pressable>
                );
              })}

          <Pressable
            onPress={() => {
              dismiss();
              router.push('/devices');
            }}
            style={[
              s.manageBtn,
              { backgroundColor: `${c.primary}14`, borderColor: `${c.primary}30` },
            ]}
          >
            <Text style={[s.manageBtnLabel, { color: c.primary }]}>
              MANAGE DEVICES
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  triggerLabel: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 24, marginBottom: 16 },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  deviceInfo: { flex: 1, gap: 2 },
  deviceName: { fontSize: 16, fontWeight: '600' },
  deviceAddress: { fontSize: 13 },
  deviceCoords: { fontSize: 11 },
  manageBtn: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  manageBtnLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
});
