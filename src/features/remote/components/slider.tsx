import { useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';

import type { ThemeColors } from '@/lib/theme';

const THUMB = 22;

// Pure helper — called inside the stable PanResponder closure via refs.
function snapToStep(pct: number, min: number, max: number, step: number): number {
  const raw = min + (pct / 100) * (max - min);
  const snapped = Math.round((raw - min) / step) * step + min;
  return Math.max(min, Math.min(max, snapped));
}

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (v: number) => void;
  c: ThemeColors;
  trackHeight?: number;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  c,
  trackHeight = 6,
}: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  // Refs keep the stable PanResponder closure up-to-date without recreation.
  const trackWidthRef = useRef(0);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const stepRef = useRef(step);
  const startValueRef = useRef(value);
  const latestOnChange = useRef(onValueChange);
  minRef.current = min;
  maxRef.current = max;
  stepRef.current = step;
  latestOnChange.current = onValueChange;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const pct = Math.max(
          0,
          Math.min(100, (e.nativeEvent.locationX / trackWidthRef.current) * 100),
        );
        const v = snapToStep(pct, minRef.current, maxRef.current, stepRef.current);
        startValueRef.current = v;
        latestOnChange.current(v);
      },
      onPanResponderMove: (_, gs) => {
        if (trackWidthRef.current === 0) return;
        const range = maxRef.current - minRef.current;
        const startPct = range > 0
          ? ((startValueRef.current - minRef.current) / range) * 100
          : 0;
        const deltaPct = (gs.dx / trackWidthRef.current) * 100;
        const newPct = Math.max(0, Math.min(100, startPct + deltaPct));
        const v = snapToStep(newPct, minRef.current, maxRef.current, stepRef.current);
        latestOnChange.current(v);
      },
    }),
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  };

  const range = max - min;
  const fillPct = range > 0 ? ((value - min) / range) * 100 : 0;
  const thumbLeft = trackWidth > 0 ? (fillPct / 100) * (trackWidth - THUMB) : 0;

  return (
    <View
      style={[s.root, { height: THUMB + 8 }]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <View style={[s.track, { height: trackHeight, borderRadius: trackHeight / 2, backgroundColor: c.surfaceContainerHighest }]}>
        <View style={[s.fill, { width: `${fillPct}%`, height: trackHeight, borderRadius: trackHeight / 2, backgroundColor: c.primary }]} />
      </View>
      <View
        style={[
          s.thumb,
          { left: thumbLeft, backgroundColor: c.primary, shadowColor: c.primary },
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { justifyContent: 'center' },
  track: { overflow: 'hidden' },
  fill: {},
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    position: 'absolute',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 4,
  },
});
