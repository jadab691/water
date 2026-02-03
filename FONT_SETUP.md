# Font System Setup

A simple and reusable font system for Expo projects.

## Files to Copy

To use this font system in another Expo project, copy these files:

1. `utils/fonts.ts` - Font configuration
2. `components/Text.tsx` - Text wrapper component

## Setup Steps

### 1. Install Required Fonts (in your layout file)

```tsx
import { useFonts } from "expo-font";
// or from specific packages:
import { Bungee_400Regular } from "@expo-google-fonts/bungee";
import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import {
  Fustat_300Light,
  Fustat_400Regular,
  Fustat_500Medium,
  Fustat_600SemiBold,
  Fustat_700Bold,
  Fustat_800ExtraBold,
} from "@expo-google-fonts/fustat";

const [loaded] = useFonts({
  Bungee_400Regular,
  FredokaOne_400Regular,
  Fustat_300Light,
  Fustat_400Regular,
  Fustat_500Medium,
  Fustat_600SemiBold,
  Fustat_700Bold,
  Fustat_800ExtraBold,
});
```

### 2. Update Font Configuration

Edit `utils/fonts.ts` and add your fonts to the `fontFamilyMap`:

```tsx
export const fontFamilyMap: Record<FontType, string> = {
  yourFont: "YourFont_400Regular",
  // ... other fonts
};
```

### 3. Import Text Component

Replace `react-native` Text imports with the custom Text:

```tsx
// ❌ Before
import { Text } from "react-native";

// ✅ After
import Text from "@/components/Text";
```

## Usage

```tsx
// Default font (Fustat)
<Text>Hello World</Text>

// Specific font
<Text font="bungee">Bungee Text</Text>
<Text font="fustat-bold">Bold Text</Text>
<Text font="fredoka">Fredoka Text</Text>

// With Tailwind classes
<Text className="text-xl font-semibold">Styled Text</Text>

// Combine font prop with other styles
<Text font="fustat-bold" className="text-lg" style={{ color: 'red' }}>
  Custom Text
</Text>
```

## TypeScript Support

All available fonts are typed. Your IDE will autocomplete all font options!

```tsx
<Text font=""> {/* autocomplete shows all available fonts */}
```
