import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { AwardIcon, CalenderIcon, HomeIcon, SparkleIcon } from "./SVGIcons";

export default function BottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive SVG height maintaining the 412:128 aspect ratio
  const svgHeight = (width * 128) / 412;
  const buttonSize = 60;

  const navigateTo = (target: string) => {
    if (pathname === target) return;
    router.replace(target as any);
  };

  return (
    <View
      className="absolute left-0 right-0 items-center"
      pointerEvents="box-none"
      style={{
        bottom: Math.max(8, insets.bottom),
        height: svgHeight,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Exact custom arched pill SVG background shape */}
      <Svg
        width={width}
        height={svgHeight}
        viewBox="0 0 412 128"
        preserveAspectRatio="none"
        style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
      >
        <Path
          d="M205.005 14C224.854 14 243.615 32 263.465 32H356C378.091 32 396 49.9086 396 72C396 94.0914 378.091 112 356 112H56C33.9086 112 16 94.0914 16 72C16 49.9086 33.9086 32 56 32H146.547C166.396 32 185.156 14.0003 205.005 14Z"
          fill="#FFFFFF"
          stroke="#E4E4E7"
          strokeWidth={1}
        />
      </Svg>

      {/* Left items container (Home & Calendar) - centered in the left flat segment */}
      <View
        style={{
          position: "absolute",
          left: (width * 20) / 412,
          width: (width * 126) / 412,
          top: svgHeight * (32 / 128),
          height: svgHeight * (80 / 128),
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => navigateTo("/home")}
          className="items-center justify-center p-2"
        >
          <HomeIcon
            style={{ width: 28, height: 28 }}
            color={pathname === "/home" ? "#4893E5" : "#A1A1AA"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateTo("/history")}
          className="items-center justify-center p-2"
        >
          <CalenderIcon
            style={{ width: 28, height: 28 }}
            color={pathname === "/history" ? "#4893E5" : "#A1A1AA"}
          />
        </TouchableOpacity>
      </View>

      {/* Right items container (Badges & Profile) - centered in the right flat segment */}
      <View
        style={{
          position: "absolute",
          right: (width * 20) / 412,
          width: (width * 126) / 412,
          top: svgHeight * (32 / 128),
          height: svgHeight * (80 / 128),
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => navigateTo("/badges")}
          className="items-center justify-center p-2"
        >
          <AwardIcon
            style={{ width: 28, height: 28 }}
            color={pathname === "/badges" ? "#4893E5" : "#A1A1AA"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateTo("/profile")}
          className={`items-center justify-center size-8 rounded-full border-2 ${
            pathname === "/profile" ? "border-[#4893E5]" : "border-[#A1A1AA]"
          }`}
        >
          <FontAwesome
            name="user"
            size={16}
            color={pathname === "/profile" ? "#4893E5" : "#A1A1AA"}
          />
        </TouchableOpacity>
      </View>

      {/* Center Special AI button - mathematically centered horizontally & vertically in the crest */}
      <TouchableOpacity
        onPress={() => navigateTo("/ai")}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          left: (width - buttonSize) / 2,
          top: svgHeight * (60 / 128) - buttonSize / 2,
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          shadowColor: "#4893E5",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={["#4893E5", "#F1639C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SparkleIcon
            style={{
              width: 30,
              height: 30,
            }}
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
