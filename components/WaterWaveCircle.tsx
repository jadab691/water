import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

interface WaterWaveCircleProps {
  percentage: number;
  size?: number;
  children?: React.ReactNode;
}

export default function WaterWaveCircle({
  percentage,
  size = 240,
  children,
}: WaterWaveCircleProps) {
  const wave1TranslateX = useSharedValue(0);
  const wave2TranslateX = useSharedValue(-size);
  const translateY = useSharedValue(size);

  useEffect(() => {
    // Animate wave 1 (moves from 0 to -size, repeating infinitely)
    wave1TranslateX.value = withRepeat(
      withTiming(-size, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Animate wave 2 (moves from -size to 0, repeating infinitely)
    wave2TranslateX.value = withRepeat(
      withTiming(0, {
        duration: 2500,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [size]);

  useEffect(() => {
    // Map percentage to vertical position
    // At 0%, translateY = size (completely empty)
    // At 100%, translateY = -15 (completely full, covering the wave peak/trough)
    const targetY = size - (percentage / 100) * (size + 15);
    translateY.value = withTiming(targetY, {
      duration: 1000,
      easing: Easing.out(Easing.ease),
    });
  }, [percentage, size]);

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: wave1TranslateX.value }],
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: wave2TranslateX.value }],
  }));

  const verticalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Build the wave path based on size
  // Wavelength = size, amplitude = 10, total width = 2 * size
  const amplitude = 10;
  const hExtra = size + 40;

  // Wave path commands
  const wavePath = `M 0 ${amplitude} ` +
    `C ${size * 0.166} ${amplitude * 2}, ${size * 0.333} ${amplitude * 2}, ${size * 0.5} ${amplitude} ` +
    `C ${size * 0.666} 0, ${size * 0.833} 0, ${size} ${amplitude} ` +
    `C ${size * 1.166} ${amplitude * 2}, ${size * 1.333} ${amplitude * 2}, ${size * 1.5} ${amplitude} ` +
    `C ${size * 1.666} 0, ${size * 1.833} 0, ${size * 2} ${amplitude} ` +
    `L ${size * 2} ${hExtra} L 0 ${hExtra} Z`;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      className="bg-[#EEFAFF] border-4 border-white shadow-2xl overflow-hidden self-center justify-center items-center"
    >
      {/* Wave container that moves vertically */}
      <Animated.View
        style={[
          styles.wavesContainer,
          { width: size * 2, height: hExtra },
          verticalStyle,
        ]}
      >
        {/* Back Wave (slower, lighter blue, moves left-to-right) */}
        <Animated.View style={[styles.waveWrapper, wave2Style]}>
          <Svg width={size * 2} height={hExtra} viewBox={`0 0 ${size * 2} ${hExtra}`}>
            <Defs>
              <LinearGradient id="backWaveGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#00B0FF" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#0090C8" stopOpacity="0.45" />
              </LinearGradient>
            </Defs>
            <Path d={wavePath} fill="url(#backWaveGrad)" />
          </Svg>
        </Animated.View>

        {/* Front Wave (faster, richer blue, moves right-to-left) */}
        <Animated.View style={[styles.waveWrapper, wave1Style]}>
          <Svg width={size * 2} height={hExtra} viewBox={`0 0 ${size * 2} ${hExtra}`}>
            <Defs>
              <LinearGradient id="frontWaveGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#00D2FF" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#0090C8" stopOpacity="0.8" />
              </LinearGradient>
            </Defs>
            <Path d={wavePath} fill="url(#frontWaveGrad)" />
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* Text overlay contents */}
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  wavesContainer: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  waveWrapper: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  contentContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    zIndex: 10,
  },
});
