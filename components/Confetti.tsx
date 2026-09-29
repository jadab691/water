import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from "react-native";

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
  count?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#00D2FF",
  "#0090C8",
  "#4893E5",
  "#F1639C",
  "#FBBF24",
  "#34D399",
  "#A78BFA",
  "#F43F5E",
  "#38BDF8",
  "#EC4899",
  "#F59E0B",
];

type Particle = {
  id: number;
  color: string;
  size: { width: number; height: number };
  borderRadius: number;
  startX: number;
  startY: number;
  anim: Animated.Value;
  targetX: number;
  peakY: number;
  endY: number;
  rotateZ: string;
  rotateX: string;
  delay: number;
  duration: number;
};

export default function Confetti({
  trigger,
  onComplete,
  count = 65,
}: ConfettiProps) {
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    // Trigger celebratory haptics
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    // Generate confetti particles
    const originX = SCREEN_WIDTH / 2;
    const originY = SCREEN_HEIGHT * 0.38; // Originates around the hydration circle

    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * Math.random());
      const distance = 80 + Math.random() * (SCREEN_WIDTH * 0.55);
      const isCircle = Math.random() > 0.65;
      const isRibbon = !isCircle && Math.random() > 0.4;
      const width = isRibbon ? 6 + Math.random() * 4 : 8 + Math.random() * 8;
      const height = isRibbon ? 14 + Math.random() * 10 : width;

      const targetX = originX + Math.cos(angle) * distance + (Math.random() - 0.5) * 60;
      const peakY = originY - 120 - Math.random() * 260; // Shoots upward first
      const endY = SCREEN_HEIGHT + 20 + Math.random() * 100; // Falls to bottom

      const rotationsZ = 3 + Math.floor(Math.random() * 5);
      const rotationsX = 2 + Math.floor(Math.random() * 4);

      return {
        id: i,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: { width, height },
        borderRadius: isCircle ? width / 2 : 2,
        startX: originX + (Math.random() - 0.5) * 40,
        startY: originY,
        anim: new Animated.Value(0),
        targetX,
        peakY,
        endY,
        rotateZ: `${(Math.random() > 0.5 ? 1 : -1) * rotationsZ * 360}deg`,
        rotateX: `${rotationsX * 360}deg`,
        delay: Math.random() * 200,
        duration: 2200 + Math.random() * 900,
      };
    });

    particlesRef.current = newParticles;

    // Run parallel particle animations
    const animations = newParticles.map((p) =>
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.anim, {
          toValue: 1,
          duration: p.duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.parallel(animations).start(() => {
      if (onComplete) onComplete();
    });
  }, [trigger, count, onComplete]);

  if (!trigger || particlesRef.current.length === 0) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particlesRef.current.map((p) => {
        // Interpolate horizontal position with gentle sway
        const translateX = p.anim.interpolate({
          inputRange: [0, 0.25, 0.6, 1],
          outputRange: [
            p.startX,
            p.targetX,
            p.targetX + (p.id % 2 === 0 ? 25 : -25),
            p.targetX + (p.id % 2 === 0 ? -15 : 15),
          ],
        });

        // Interpolate vertical: shoots up to peakY, then accelerates down to endY
        const translateY = p.anim.interpolate({
          inputRange: [0, 0.28, 1],
          outputRange: [p.startY, p.peakY, p.endY],
        });

        // Spin and flip in 3D space
        const rotate = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", p.rotateZ],
        });

        const rotateX = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", p.rotateX],
        });

        // Fade out toward the end of fall
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.08, 0.75, 1],
          outputRange: [0, 1, 0.9, 0],
        });

        // Scale pop effect on launch
        const scale = p.anim.interpolate({
          inputRange: [0, 0.15, 0.85, 1],
          outputRange: [0.2, 1.15, 1, 0.6],
        });

        return (
          <Animated.View
            key={`confetti-${p.id}`}
            style={{
              position: "absolute",
              width: p.size.width,
              height: p.size.height,
              backgroundColor: p.color,
              borderRadius: p.borderRadius,
              transform: [
                { translateX },
                { translateY },
                { rotate },
                { rotateX },
                { scale },
              ],
              opacity,
            }}
          />
        );
      })}
    </View>
  );
}
