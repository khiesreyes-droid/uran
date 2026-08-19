import { useForm } from '@tanstack/react-form';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { Modal, useModal } from '@/components/ui/modal';
import { useThemeColors, type ThemeColors } from '@/lib/theme';

import { addDevice, deleteDevice, useDevices } from './api';
import { MapLocationPicker } from './map-location-picker';
import { useDeviceStore } from './use-device-store';

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
      <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </Svg>
  );
}

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
      <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </Svg>
  );
}

function TrashIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <Path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4h-3.5z" />
    </Svg>
  );
}

function LocationIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
    </Svg>
  );
}

// ─── Form schema ──────────────────────────────────────────────────────────────

const normalizeMac = (v: string) => v.replace(/[:\-\s]/g, '').toUpperCase();

const formatMac = (text: string): string => {
  const hex = text.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 12);
  return hex.match(/.{1,2}/g)?.join(':') ?? '';
};

const deviceSchema = z.object({
  macAddress: z
    .string()
    .min(1, 'MAC address is required')
    .refine((v) => /^[0-9A-Fa-f]{12}$/.test(normalizeMac(v)), 'Enter a valid MAC (e.g. A4:CF:12:34:56:78)'),
  name: z.string().min(1, 'Device name is required'),
  address: z.string(),
  latitude: z
    .string()
    .refine((v) => v.trim() !== '' && !isNaN(Number(v)), 'Enter a valid number')
    .refine((v) => Number(v) >= -90 && Number(v) <= 90, 'Must be between -90 and 90'),
  longitude: z
    .string()
    .refine((v) => v.trim() !== '' && !isNaN(Number(v)), 'Enter a valid number')
    .refine((v) => Number(v) >= -180 && Number(v) <= 180, 'Must be between -180 and 180'),
});

// ─── Form input ───────────────────────────────────────────────────────────────

type FormInputProps = {
  label: string;
  error?: string;
  c: ThemeColors;
} & React.ComponentProps<typeof TextInput>;

function FormInput({ label, error, c, ...props }: FormInputProps) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error
    ? c.error
    : focused
      ? c.primaryContainer
      : c.outlineVariant;

  return (
    <View style={fi.wrap}>
      <Text style={[fi.label, { color: c.onSurfaceVariant }]}>{label}</Text>
      <TextInput
        style={[
          fi.input,
          {
            color: c.onSurface,
            backgroundColor: c.surfaceContainerLowest,
            borderColor,
          },
        ]}
        placeholderTextColor={`${c.outline}99`}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {!!error && <Text style={[fi.error, { color: c.error }]}>{error}</Text>}
    </View>
  );
}

const fi = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  error: { fontSize: 12, marginTop: 4 },
});

// ─── Add device sheet ─────────────────────────────────────────────────────────

function AddDeviceSheet({ sheetRef, dismiss }: {
  sheetRef: React.RefObject<any>;
  dismiss: () => void;
}) {
  const c = useThemeColors();
  const setSelectedDeviceId = useDeviceStore((s) => s.setSelectedDeviceId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  const form = useForm({
    defaultValues: { macAddress: '', name: '', address: '', latitude: '', longitude: '' },
    validators: { onChange: deviceSchema as any },
    onSubmit: async ({ value }) => {
      try {
        setSubmitError(null);
        const id = await addDevice({
          id: normalizeMac(value.macAddress),
          name: value.name.trim(),
          address: value.address.trim(),
          latitude: Number(value.latitude),
          longitude: Number(value.longitude),
        });
        setSelectedDeviceId(id);
        form.reset();
        dismiss();
      } catch (err: any) {
        console.error('[addDevice]', err);
        setSubmitError(err?.message ?? 'Failed to save device. Check your connection.');
      }
    },
  });

  return (
    <>
    <MapLocationPicker
      visible={mapVisible}
      initialLat={form.getFieldValue('latitude') ? Number(form.getFieldValue('latitude')) : undefined}
      initialLon={form.getFieldValue('longitude') ? Number(form.getFieldValue('longitude')) : undefined}
      onConfirm={(lat, lon, address) => {
        form.setFieldValue('latitude', lat.toFixed(6));
        form.setFieldValue('longitude', lon.toFixed(6));
        if (address) form.setFieldValue('address', address);
        setMapVisible(false);
      }}
      onCancel={() => setMapVisible(false)}
    />
    <Modal ref={sheetRef} title="Add Device" snapPoints={['82%']}>
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <form.Field
          name="macAddress"
          children={(field) => (
            <FormInput
              label="ESP32 MAC ADDRESS"
              c={c}
              placeholder="A4:CF:12:34:56:78"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={(text) => field.handleChange(formatMac(text))}
              error={getFieldError(field)}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={17}
            />
          )}
        />

        <form.Field
          name="name"
          children={(field) => (
            <FormInput
              label="DEVICE NAME"
              c={c}
              placeholder="e.g. Front Yard, Rooftop"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
              autoCapitalize="words"
            />
          )}
        />

        <form.Field
          name="address"
          children={(field) => (
            <FormInput
              label="ADDRESS (OPTIONAL)"
              c={c}
              placeholder="e.g. 123 Main St, Quezon City"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
            />
          )}
        />

        {/* Map pin button */}
        <Pressable
          onPress={() => setMapVisible(true)}
          style={({ pressed }) => [
            s.mapPinBtn,
            {
              backgroundColor: `${c.primary}0F`,
              borderColor: `${c.primary}30`,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <LocationIcon color={c.primary} />
          <Text style={[s.mapPinLabel, { color: c.primary }]}>
            Pin Location on Map
          </Text>
        </Pressable>

        <Text style={[s.orDivider, { color: c.onSurfaceVariant }]}>
          — or enter coordinates manually —
        </Text>

        <View style={s.coordsRow}>
          <View style={{ flex: 1 }}>
            <form.Field
              name="latitude"
              children={(field) => (
                <FormInput
                  label="LATITUDE"
                  c={c}
                  placeholder="14.5995"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  error={getFieldError(field)}
                  keyboardType="numbers-and-punctuation"
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <form.Field
              name="longitude"
              children={(field) => (
                <FormInput
                  label="LONGITUDE"
                  c={c}
                  placeholder="120.9842"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  error={getFieldError(field)}
                  keyboardType="numbers-and-punctuation"
                />
              )}
            />
          </View>
        </View>

        <View style={[s.tipCard, { backgroundColor: `${c.primary}0F`, borderColor: `${c.primary}26` }]}>
          <LocationIcon color={c.primary} />
          <Text style={[s.tipText, { color: c.onSurfaceVariant }]}>
            {'Tip: Long-press a location in Google Maps → tap the coordinates at the top to copy them.'}
          </Text>
        </View>

        {submitError && (
          <Text style={[s.submitError, { color: c.error }]}>{submitError}</Text>
        )}

        <form.Subscribe
          selector={(state) => [state.isSubmitting]}
          children={([isSubmitting]) => (
            <Pressable
              onPress={form.handleSubmit}
              disabled={Boolean(isSubmitting)}
              style={({ pressed }) => [
                s.saveBtn,
                { backgroundColor: c.primaryContainer, opacity: pressed || isSubmitting ? 0.8 : 1 },
              ]}
            >
              {isSubmitting
                ? <ActivityIndicator size="small" color={c.onPrimaryContainer} />
                : (
                    <Text style={[s.saveBtnLabel, { color: c.onPrimaryContainer }]}>
                      SAVE DEVICE
                    </Text>
                  )}
            </Pressable>
          )}
        />
      </BottomSheetScrollView>
    </Modal>
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function DevicesScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ref: addSheetRef, present: openAddSheet, dismiss: closeAddSheet } = useModal();
  const { devices, loading } = useDevices();
  const selectedDeviceId = useDeviceStore((s) => s.selectedDeviceId);
  const setSelectedDeviceId = useDeviceStore((s) => s.setSelectedDeviceId);

  const handleDelete = async (deviceId: string) => {
    await deleteDevice(deviceId);
    if (selectedDeviceId === deviceId) {
      const remaining = devices.filter((d) => d.id !== deviceId);
      setSelectedDeviceId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

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
        <Pressable
          onPress={() => router.back()}
          style={s.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeftIcon color={c.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: c.onSurface }]}>DEVICES</Text>
        <Pressable
          onPress={openAddSheet}
          style={[s.addBtn, { backgroundColor: `${c.primary}1A` }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <PlusIcon color={c.primary} />
        </Pressable>
      </View>

      {loading
        ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={c.primary} />
            </View>
          )
        : (
            <ScrollView
              contentContainerStyle={s.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {devices.length === 0
                ? (
                    <View style={s.emptyState}>
                      <LocationIcon color={`${c.onSurfaceVariant}60`} />
                      <Text style={[s.emptyTitle, { color: c.onSurface }]}>
                        No devices yet
                      </Text>
                      <Text style={[s.emptyDesc, { color: c.onSurfaceVariant }]}>
                        {
                          'Tap the + button to register your tarpaulin device with its GPS coordinates.'
                        }
                      </Text>
                      <Pressable
                        onPress={openAddSheet}
                        style={[s.emptyBtn, { backgroundColor: c.primaryContainer }]}
                      >
                        <Text style={[s.emptyBtnLabel, { color: c.onPrimaryContainer }]}>
                          ADD YOUR FIRST DEVICE
                        </Text>
                      </Pressable>
                    </View>
                  )
                : devices.map((device) => {
                    const isSelected = device.id === selectedDeviceId;
                    return (
                      <Pressable
                        key={device.id}
                        onPress={() => setSelectedDeviceId(device.id)}
                        style={[
                          s.deviceCard,
                          {
                            backgroundColor: `${c.surfaceContainer}B3`,
                            borderColor: isSelected ? c.primary : `${c.outlineVariant}1A`,
                            borderLeftColor: isSelected ? c.primary : `${c.outlineVariant}1A`,
                            borderLeftWidth: isSelected ? 4 : 1,
                          },
                        ]}
                      >
                        <View style={s.deviceCardBody}>
                          <View style={s.deviceCardTop}>
                            <Text style={[s.deviceName, { color: c.onSurface }]}>
                              {device.name}
                            </Text>
                            {isSelected && (
                              <View
                                style={[
                                  s.activeBadge,
                                  { backgroundColor: `${c.primary}20` },
                                ]}
                              >
                                <Text style={[s.activeBadgeLabel, { color: c.primary }]}>
                                  ACTIVE
                                </Text>
                              </View>
                            )}
                          </View>
                          {!!device.address && (
                            <Text style={[s.deviceAddress, { color: c.onSurfaceVariant }]}>
                              {device.address}
                            </Text>
                          )}
                          <Text
                            style={[s.deviceCoords, { color: `${c.onSurfaceVariant}80` }]}
                          >
                            {`${device.latitude.toFixed(5)}, ${device.longitude.toFixed(5)}`}
                          </Text>
                          <Text style={[s.deviceCoords, { color: `${c.onSurfaceVariant}60` }]}>
                            {device.id.match(/.{2}/g)?.join(':') ?? device.id}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => handleDelete(device.id)}
                          style={s.deleteBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <TrashIcon color={c.error} />
                        </Pressable>
                      </Pressable>
                    );
                  })}
            </ScrollView>
          )}

      <AddDeviceSheet sheetRef={addSheetRef} dismiss={closeAddSheet} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  addBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8, gap: 12 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 12 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyBtnLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  deviceCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceCardBody: { flex: 1, gap: 4 },
  deviceCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deviceName: { fontSize: 16, fontWeight: '700' },
  deviceAddress: { fontSize: 13 },
  deviceCoords: { fontSize: 11 },
  activeBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  activeBadgeLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  deleteBtn: { padding: 6 },
  mapPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 8,
  },
  mapPinLabel: { fontSize: 14, fontWeight: '600' },
  orDivider: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  coordsRow: { flexDirection: 'row', gap: 12 },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
  submitError: { fontSize: 13, marginBottom: 12 },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveBtnLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});
