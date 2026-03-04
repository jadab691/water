import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { AwardIcon, CalenderIcon, HomeIcon, SparkleIcon } from "./SVGIcons";

export default function BottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="backdrop-blur-3xl absolute bottom-0 left-0 right-0">
      <View
        className="gap-8 bg-white flex-row justify-around items-center p-6 mt-0 m-4 rounded-full"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push("/home")}
          className="items-center"
        >
          <HomeIcon
            style={{
              width: 32,
              height: 32,
            }}
            color={pathname === "/home" ? "#4893E5" : "#A1A1AA"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/history")}
          className="items-center"
        >
          <CalenderIcon
            style={{
              width: 32,
              height: 32,
            }}
            color={pathname === "/history" ? "#4893E5" : "#A1A1AA"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/ai")} className="-mt-4">
          <LinearGradient
            colors={["#4893E5", "#F1639C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 8,
              borderRadius: 48,
            }}
          >
            <SparkleIcon
              style={{
                width: 35,
                height: 35,
              }}
            />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/badges")}
          className="items-center"
        >
          <AwardIcon
            style={{
              width: 32,
              height: 32,
            }}
            color={pathname === "/badges" ? "#4893E5" : "#A1A1AA"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/profile")}
          className="items-center"
        >
          <Ionicons
            name="person"
            size={24}
            color={pathname === "/profile" ? "#4893E5" : "#A1A1AA"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
