import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, StyleSheet, Text, View } from 'react-native';

const BG_IMAGE = require('../../../assets/splash-bg.png');

const PRIMARY = '#adc6ff';
const DOT_DELAYS = [0, 200, 400];

function LoadingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
          transform: [
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] }) },
          ],
        },
      ]}
    />
  );
}

type Props = {
  isReady: boolean;
  onFinish: () => void;
};

export function CustomSplashScreen({ isReady, onFinish }: Props) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start(() => setAnimDone(true));
  }, [progressWidth]);

  useEffect(() => {
    if (!animDone || !isReady) return;
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(onFinish);
  }, [animDone, isReady, containerOpacity, onFinish]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: containerOpacity }]}>
      <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
        <View style={styles.bottom}>
          <View style={styles.row}>
            <Text style={styles.label}>INITIALIZING</Text>
            <View style={styles.dotsRow}>
              {DOT_DELAYS.map((d) => (
                <LoadingDot key={d} delay={d} />
              ))}
            </View>
          </View>
          <View style={styles.track}>
            <Animated.View
              style={[
                styles.bar,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottom: {
    marginBottom: 48,
    alignItems: 'center',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: PRIMARY,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 4,
    textShadowColor: 'rgba(173, 198, 255, 0.6)',
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 16,
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: PRIMARY,
    borderRadius: 2,
  },
  track: {
    width: 128,
    height: 2,
    backgroundColor: 'rgba(66, 71, 84, 0.2)',
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: 16,
  },
  bar: {
    height: '100%',
    backgroundColor: PRIMARY,
  },
});
