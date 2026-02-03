import { Text as RNText, TextProps } from "react-native";

type FontType =
  | "bungee"
  | "fustat"
  | "fustat-light"
  | "fustat-medium"
  | "fustat-semibold"
  | "fustat-bold"
  | "fustat-extrabold"
  | "fredoka";

interface CustomTextProps extends TextProps {
  font?: FontType;
}

const fontFamilyMap: Record<FontType, string> = {
  bungee: "Bungee_400Regular",
  fustat: "Fustat_400Regular",
  "fustat-light": "Fustat_300Light",
  "fustat-medium": "Fustat_500Medium",
  "fustat-semibold": "Fustat_600SemiBold",
  "fustat-bold": "Fustat_700Bold",
  "fustat-extrabold": "Fustat_800ExtraBold",
  fredoka: "FredokaOne_400Regular",
};

/**
 * Global Text wrapper that applies fonts globally.
 * Defaults to Fustat (400Regular), but can be overridden with the `font` prop.
 * Supports: bungee, fustat, fustat-light, fustat-medium, fustat-semibold, fustat-bold, fustat-extrabold, fredoka
 */
export default function Text({
  font = "fustat",
  style,
  ...props
}: CustomTextProps) {
  return (
    <RNText {...props} style={[{ fontFamily: fontFamilyMap[font] }, style]}>
      {props.children}
    </RNText>
  );
}
