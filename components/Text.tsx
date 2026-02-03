import { Text as RNText, TextProps } from "react-native";

// Add fonts here (must match fonts loaded in _layout.tsx)
type FontType =
  | "fustat"
  | "fustat-light"
  | "fustat-medium"
  | "fustat-semibold"
  | "fustat-bold"
  | "fustat-extrabold"
  | "fredoka";

const fontFamilyMap: Record<FontType, string> = {
  fustat: "Fustat_400Regular",
  "fustat-light": "Fustat_300Light",
  "fustat-medium": "Fustat_500Medium",
  "fustat-semibold": "Fustat_600SemiBold",
  "fustat-bold": "Fustat_700Bold",
  "fustat-extrabold": "Fustat_800ExtraBold",
  fredoka: "FredokaOne_400Regular",
};

const DEFAULT_FONT: FontType = "fustat";

interface CustomTextProps extends TextProps {
  font?: FontType;
}

export default function Text({
  font = DEFAULT_FONT,
  style,
  ...props
}: CustomTextProps) {
  return (
    <RNText {...props} style={[{ fontFamily: fontFamilyMap[font] }, style]}>
      {props.children}
    </RNText>
  );
}
