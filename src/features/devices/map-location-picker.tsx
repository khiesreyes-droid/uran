import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useThemeColors } from '@/lib/theme';

// ─── Icons ────────────────────────────────────────────────────────────────────

function CrosshairIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </Svg>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={color}>
      <Path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </Svg>
  );
}

function ClearIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={color}>
      <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </Svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Coords = { latitude: number; longitude: number };

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

const DEFAULT_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// ─── Component ────────────────────────────────────────────────────────────────

type MapLocationPickerProps = {
  visible: boolean;
  initialLat?: number;
  initialLon?: number;
  onConfirm: (lat: number, lon: number, address?: string) => void;
  onCancel: () => void;
};

export function MapLocationPicker({
  visible,
  initialLat,
  initialLon,
  onConfirm,
  onCancel,
}: MapLocationPickerProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [pin, setPin] = useState<Coords | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>(undefined);
  const [locating, setLocating] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region>(
    initialLat !== undefined && initialLon !== undefined
      ? { latitude: initialLat, longitude: initialLon, latitudeDelta: 0.02, longitudeDelta: 0.02 }
      : DEFAULT_REGION,
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      const hasInitial = initialLat !== undefined && initialLon !== undefined;
      setPin(hasInitial ? { latitude: initialLat!, longitude: initialLon! } : null);
      setSelectedAddress(undefined);
      setSearchQuery('');
      setSearchResults([]);
      setCurrentRegion(
        hasInitial
          ? { latitude: initialLat!, longitude: initialLon!, latitudeDelta: 0.02, longitudeDelta: 0.02 }
          : DEFAULT_REGION,
      );
    }
  }, [visible, initialLat, initialLon]);

  const runSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&format=json&limit=5`;
      const res = await fetch(url, { headers: { 'User-Agent': 'UranApp/1.0' } });
      const data: NominatimResult[] = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(() => runSearch(text), 600);
  };

  const handleSelectResult = (result: NominatimResult) => {
    const coords: Coords = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
    const nextRegion: Region = { ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    setPin(coords);
    setSelectedAddress(result.display_name);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentRegion(nextRegion);
    Keyboard.dismiss();
    mapRef.current?.animateToRegion(nextRegion);
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords: Coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      const nextRegion: Region = { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setPin(coords);
      setSelectedAddress(undefined);
      setCurrentRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion);
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = () => {
    if (pin) onConfirm(pin.latitude, pin.longitude, selectedAddress);
  };

  const zoomBy = (factor: number) => {
    const next: Region = {
      ...currentRegion,
      latitudeDelta: Math.min(Math.max(currentRegion.latitudeDelta * factor, 0.001), 170),
      longitudeDelta: Math.min(Math.max(currentRegion.longitudeDelta * factor, 0.001), 350),
    };
    setCurrentRegion(next);
    mapRef.current?.animateToRegion(next, 200);
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onCancel}>
      <View style={[s.container, { backgroundColor: c.background }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

        {/* Header */}
        <View
          style={[
            s.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: c.surface,
              borderBottomColor: `${c.outlineVariant}33`,
            },
          ]}
        >
          <Pressable
            onPress={onCancel}
            style={s.headerSideBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[s.headerAction, { color: c.onSurfaceVariant }]}>Cancel</Text>
          </Pressable>

          <Text style={[s.headerTitle, { color: c.onSurface }]}>Pin Location</Text>

          <Pressable
            onPress={handleConfirm}
            disabled={!pin}
            style={s.headerSideBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text
              style={[
                s.headerAction,
                s.headerConfirm,
                { color: pin ? c.primary : `${c.primary}44` },
              ]}
            >
              Confirm
            </Text>
          </Pressable>
        </View>

        {/* Search bar */}
        <View
          style={[
            s.searchSection,
            { backgroundColor: c.surface, borderBottomColor: `${c.outlineVariant}33` },
          ]}
        >
          <View
            style={[
              s.searchInputWrap,
              { backgroundColor: c.surfaceContainerLowest, borderColor: `${c.outlineVariant}66` },
            ]}
          >
            <SearchIcon color={`${c.onSurfaceVariant}99`} />
            <TextInput
              style={[s.searchInput, { color: c.onSurface }]}
              placeholder="Search address…"
              placeholderTextColor={`${c.onSurfaceVariant}66`}
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              onSubmitEditing={() => runSearch(searchQuery)}
              clearButtonMode="never"
            />
            {searching
              ? <ActivityIndicator size="small" color={c.primary} />
              : searchQuery.length > 0
                ? (
                    <Pressable
                      onPress={() => { setSearchQuery(''); setSearchResults([]); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <ClearIcon color={`${c.onSurfaceVariant}99`} />
                    </Pressable>
                  )
                : null}
          </View>

          {/* Search results */}
          {searchResults.length > 0 && (
            <ScrollView
              style={s.resultsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {searchResults.map((result, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleSelectResult(result)}
                  style={({ pressed }) => [
                    s.resultItem,
                    {
                      borderBottomColor: `${c.outlineVariant}33`,
                      backgroundColor: pressed ? `${c.primary}0A` : 'transparent',
                    },
                  ]}
                >
                  <Text style={[s.resultText, { color: c.onSurface }]} numberOfLines={2}>
                    {result.display_name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Map + overlays */}
        <View style={s.mapContainer}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={
              initialLat !== undefined && initialLon !== undefined
                ? { latitude: initialLat, longitude: initialLon, latitudeDelta: 0.02, longitudeDelta: 0.02 }
                : DEFAULT_REGION
            }
            onPress={(e) => {
              setPin(e.nativeEvent.coordinate);
              setSelectedAddress(undefined);
            }}
            onRegionChangeComplete={setCurrentRegion}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {pin && <Marker coordinate={pin} />}
          </MapView>

          {/* Hint overlay (no pin yet) */}
          {!pin && (
            <View style={s.hintOverlay} pointerEvents="none">
              <View
                style={[
                  s.hintBubble,
                  { backgroundColor: `${c.surface}EE`, borderColor: `${c.outlineVariant}44` },
                ]}
              >
                <Text style={[s.hintText, { color: c.onSurface }]}>
                  Search an address above or tap anywhere on the map
                </Text>
              </View>
            </View>
          )}

          {/* Zoom controls */}
          <View
            style={[
              s.zoomControls,
              { backgroundColor: c.surface, borderColor: `${c.outlineVariant}66` },
            ]}
          >
            <Pressable
              onPress={() => zoomBy(0.5)}
              style={({ pressed }) => [s.zoomBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[s.zoomBtnText, { color: c.onSurface }]}>+</Text>
            </Pressable>
            <View style={[s.zoomDivider, { backgroundColor: `${c.outlineVariant}66` }]} />
            <Pressable
              onPress={() => zoomBy(2)}
              style={({ pressed }) => [s.zoomBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[s.zoomBtnText, { color: c.onSurface }]}>−</Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom bar */}
        <View
          style={[
            s.bottomBar,
            {
              paddingBottom: insets.bottom + 16,
              backgroundColor: c.surface,
              borderTopColor: `${c.outlineVariant}33`,
            },
          ]}
        >
          {pin
            ? (
                <View style={s.coordsDisplay}>
                  <View style={s.coordItem}>
                    <Text style={[s.coordLabel, { color: c.onSurfaceVariant }]}>LATITUDE</Text>
                    <Text style={[s.coordValue, { color: c.onSurface }]}>
                      {pin.latitude.toFixed(6)}
                    </Text>
                  </View>
                  <View style={[s.coordDivider, { backgroundColor: `${c.outlineVariant}44` }]} />
                  <View style={s.coordItem}>
                    <Text style={[s.coordLabel, { color: c.onSurfaceVariant }]}>LONGITUDE</Text>
                    <Text style={[s.coordValue, { color: c.onSurface }]}>
                      {pin.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              )
            : <View style={s.coordsDisplay} />}

          <Pressable
            onPress={handleUseCurrentLocation}
            disabled={locating}
            style={({ pressed }) => [
              s.myLocBtn,
              {
                backgroundColor: `${c.primary}14`,
                borderColor: `${c.primary}30`,
                opacity: pressed || locating ? 0.7 : 1,
              },
            ]}
          >
            {locating
              ? <ActivityIndicator size="small" color={c.primary} />
              : <CrosshairIcon color={c.primary} />}
            <Text style={[s.myLocLabel, { color: c.primary }]}>
              {locating ? 'Locating…' : 'Use My Location'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerSideBtn: { minWidth: 64 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerAction: { fontSize: 15 },
  headerConfirm: { fontWeight: '700' },
  searchSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  resultsList: {
    maxHeight: 220,
    marginTop: 4,
  },
  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultText: { fontSize: 13, lineHeight: 18 },
  mapContainer: { flex: 1 },
  hintOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBubble: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 280,
  },
  hintText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  zoomControls: {
    position: 'absolute',
    right: 12,
    bottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 26,
    includeFontPadding: false,
  },
  zoomDivider: { height: StyleSheet.hairlineWidth },
  bottomBar: {
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  coordsDisplay: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  coordItem: { flex: 1, alignItems: 'center', gap: 2 },
  coordLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  coordValue: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  coordDivider: { width: 1, height: 28, marginHorizontal: 8 },
  myLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
  myLocLabel: { fontSize: 14, fontWeight: '600' },
});
