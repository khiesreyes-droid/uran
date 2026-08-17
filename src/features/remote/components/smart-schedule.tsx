import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Modal, Pressable, Text, useModal } from '@/components/ui';
import { useThemeColors, type ThemeColors } from '@/lib/theme';

// ─── Icons ────────────────────────────────────────────────────────────────────

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
    </Svg>
  );
}

function SunIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" />
    </Svg>
  );
}

function MoonIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M11.1 12.08c-2.33-4.51-.5-8.48.53-10.07C6.27 2.2 1.98 6.59 1.98 12c0 .14.02.28.02.42.62-.27 1.29-.42 2-.42 1.66 0 3.18.83 4.1 2.08A5.87 5.87 0 0 1 10 19c0 .34-.04.67-.09 1H10c3.87 0 7-3.13 7-7 0-3.18-2.11-5.88-5-6.7.05.65.09 1.34.1 2.08z" />
    </Svg>
  );
}

function ChevronRightIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </Svg>
  );
}

// ─── Time type & helpers ──────────────────────────────────────────────────────

type Period = 'AM' | 'PM';
type Time = { hour: number; minute: number; period: Period };

function formatTime({ hour, minute, period }: Time): string {
  return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
}

// ─── Drum wheel ───────────────────────────────────────────────────────────────

const ITEM_H = 64;
const VISIBLE = 5;
const WHEEL_H = ITEM_H * VISIBLE;
// offset when item[i] is centred: (2 - i) * ITEM_H
const centreOffset = (i: number) => {
  'worklet';
  return (2 - i) * ITEM_H;
};

interface WheelItemProps {
  label: string;
  index: number;
  offsetY: SharedValue<number>;
  c: ThemeColors;
}

function WheelItem({ label, index, offsetY, c }: WheelItemProps) {
  const style = useAnimatedStyle(() => {
    'worklet';
    const dist = Math.abs(offsetY.value - centreOffset(index));
    const opacity = interpolate(dist, [0, ITEM_H, ITEM_H * 2], [1, 0.4, 0.12], Extrapolation.CLAMP);
    const scale = interpolate(dist, [0, ITEM_H, ITEM_H * 2], [1, 0.78, 0.6], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  });

  return (
    <Animated.View style={[s.wheelItem, style]}>
      <Text style={[s.wheelValue, { color: c.primary }]}>{label}</Text>
    </Animated.View>
  );
}

interface WheelPickerProps {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  c: ThemeColors;
}

function WheelPicker({ items, selectedIndex, onChange, c }: WheelPickerProps) {
  const offsetY = useSharedValue(centreOffset(selectedIndex));
  const startY = useSharedValue(centreOffset(selectedIndex));
  const minOffset = centreOffset(items.length - 1);
  const maxOffset = centreOffset(0);

  // Sync position when the sheet opens with a new time.
  useEffect(() => {
    offsetY.value = centreOffset(selectedIndex);
    startY.value = centreOffset(selectedIndex);
  }, [selectedIndex]);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      startY.value = offsetY.value;
    })
    .onUpdate((e) => {
      'worklet';
      offsetY.value = Math.max(minOffset, Math.min(maxOffset, startY.value + e.translationY));
    })
    .onEnd((e) => {
      'worklet';
      const raw = startY.value + e.translationY;
      const clamped = Math.max(minOffset, Math.min(maxOffset, raw));
      const idx = Math.max(0, Math.min(items.length - 1, Math.round((2 * ITEM_H - clamped) / ITEM_H)));
      offsetY.value = withSpring(centreOffset(idx), { mass: 0.3, damping: 20, stiffness: 300 });
      runOnJS(onChange)(idx);
    });

  const columnStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offsetY.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={s.wheelOuter}>
        <View
          pointerEvents="none"
          style={[s.selectionBar, { borderColor: `${c.primary}33`, backgroundColor: `${c.primary}0D` }]}
        />
        <Animated.View style={[s.wheelColumn, columnStyle]}>
          {items.map((item, idx) => (
            <WheelItem key={item} label={item} index={idx} offsetY={offsetY} c={c} />
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

// ─── Pulsing colon ────────────────────────────────────────────────────────────

function PulsingColon({ c }: { c: ThemeColors }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.2, { duration: 900 }), -1, true);
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[s.colonWrap, style]}>
      <Text style={[s.colon, { color: c.primary }]}>:</Text>
    </Animated.View>
  );
}

// ─── Time picker sheet ────────────────────────────────────────────────────────

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

interface TimePickerSheetProps {
  draft: Time;
  onChange: (t: Time) => void;
  onConfirm: () => void;
  c: ThemeColors;
}

function TimePickerSheet({ draft, onChange, onConfirm, c }: TimePickerSheetProps) {
  const onHourChange = useCallback(
    (i: number) => onChange({ ...draft, hour: i + 1 }),
    [draft, onChange],
  );

  const onMinuteChange = useCallback(
    (i: number) => onChange({ ...draft, minute: i * 5 }),
    [draft, onChange],
  );

  return (
    <View style={s.pickerContainer}>
      <View style={s.wheelRow}>
        <WheelPicker
          items={HOURS}
          selectedIndex={draft.hour - 1}
          onChange={onHourChange}
          c={c}
        />

        <PulsingColon c={c} />

        <WheelPicker
          items={MINUTES}
          selectedIndex={draft.minute / 5}
          onChange={onMinuteChange}
          c={c}
        />

        {/* AM / PM */}
        <View style={[s.periodGroup, { backgroundColor: c.surfaceContainerHigh }]}>
          {(['AM', 'PM'] as Period[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => onChange({ ...draft, period: p })}
              style={[
                s.periodBtn,
                { backgroundColor: draft.period === p ? c.primary : 'transparent' },
              ]}
            >
              <Text style={[s.periodLabel, { color: draft.period === p ? c.onPrimary : c.onSurfaceVariant }]}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        onPress={onConfirm}
        style={({ pressed }) => [s.saveBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={[s.saveBtnLabel, { color: c.onPrimary }]}>SAVE TIME</Text>
      </Pressable>
    </View>
  );
}

// ─── Schedule item ────────────────────────────────────────────────────────────

interface ScheduleItemProps {
  icon: React.ReactNode;
  sub: string;
  time: string;
  active?: boolean;
  onPress: () => void;
}

function ScheduleItem({ icon, sub, time, active = false, onPress }: ScheduleItemProps) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.item,
        {
          backgroundColor: `${c.surfaceContainer}B3`,
          borderColor: `${c.outlineVariant}1A`,
          borderLeftColor: active ? c.primary : c.outlineVariant,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {icon}
      <View style={s.itemText}>
        <Text style={[s.itemSub, { color: c.onSurfaceVariant }]}>{sub}</Text>
        <Text style={[s.itemTime, { color: c.onSurface }]}>{time}</Text>
      </View>
      <ChevronRightIcon color={c.onSurfaceVariant} />
    </Pressable>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SmartSchedule() {
  const c = useThemeColors();

  const [openTime, setOpenTime] = useState<Time>({ hour: 8, minute: 0, period: 'AM' });
  const [closeTime, setCloseTime] = useState<Time>({ hour: 6, minute: 30, period: 'PM' });
  const [editing, setEditing] = useState<'open' | 'close'>('open');
  const [draft, setDraft] = useState<Time>(openTime);

  const { ref: sheetRef, present, dismiss } = useModal();

  const handleOpenPress = useCallback(() => {
    setEditing('open');
    setDraft(openTime);
    present();
  }, [openTime, present]);

  const handleClosePress = useCallback(() => {
    setEditing('close');
    setDraft(closeTime);
    present();
  }, [closeTime, present]);

  const handleConfirm = useCallback(() => {
    if (editing === 'open') setOpenTime(draft);
    else setCloseTime(draft);
    dismiss();
  }, [editing, draft, dismiss]);

  return (
    <>
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <CalendarIcon color={c.primary} />
          <Text style={[s.sectionLabel, { color: c.onSurfaceVariant }]}>
            SMART SCHEDULE
          </Text>
        </View>

        <View style={s.list}>
          <ScheduleItem
            icon={<SunIcon color={c.primary} />}
            sub="Open daily"
            time={formatTime(openTime)}
            active
            onPress={handleOpenPress}
          />
          <ScheduleItem
            icon={<MoonIcon color={c.onSurfaceVariant} />}
            sub="Close daily"
            time={formatTime(closeTime)}
            onPress={handleClosePress}
          />
        </View>
      </View>

      <Modal
        ref={sheetRef}
        snapPoints={['60%']}
        title={editing === 'open' ? 'Open Daily' : 'Close Daily'}
      >
        <TimePickerSheet
          draft={draft}
          onChange={setDraft}
          onConfirm={handleConfirm}
          c={c}
        />
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Schedule list
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  list: { gap: 8 },
  item: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  itemText: { flex: 1 },
  itemSub: { fontSize: 14, lineHeight: 20 },
  itemTime: { fontSize: 18, fontWeight: '700', lineHeight: 28 },

  // Drum wheel
  wheelOuter: {
    height: WHEEL_H,
    flex: 1,
    overflow: 'hidden',
  },
  selectionBar: {
    position: 'absolute',
    top: ITEM_H * 2,
    left: 0,
    right: 0,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  wheelColumn: {
    // items stack vertically; translateY drives position
  },
  wheelItem: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelValue: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Picker sheet
  pickerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 24,
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  colonWrap: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  colon: {
    fontSize: 40,
    fontWeight: '700',
  },
  periodGroup: {
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 8,
    alignSelf: 'center',
  },
  periodBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
