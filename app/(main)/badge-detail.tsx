import {
  ArrowLeftIcon,
  FifteenDayStreakIcon,
  NinetyDayStreakIcon,
  SevenDayStreakIcon,
  SixtyDayStreakIcon,
  ThirtyDayStreakIcon,
  ThreeDayStreakIcon,
  TickCircleIcon,
} from "@/components/SVGIcons";
import Text from "@/components/Text";
import { logo } from "@/utils/constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useRef } from "react";
import { Alert, Image, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

const badgeIcons: { [key: string]: React.ReactNode } = {
  "3-days": <ThreeDayStreakIcon width={150} height={150} />,
  "7-days": <SevenDayStreakIcon width={150} height={150} />,
  "15-days": <FifteenDayStreakIcon width={150} height={150} />,
  "30-days": <ThirtyDayStreakIcon width={150} height={150} />,
  "60-days": <SixtyDayStreakIcon width={150} height={150} />,
  "90-days": <NinetyDayStreakIcon width={150} height={150} />,
};

export default function BadgeDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const badgeCardRef = useRef<View>(null);

  const { title, status, badgeId, unlockDate } = params;



  const handleShare = async () => {
    try {
      // Capture the badge card as image
      const uri = await captureRef(badgeCardRef, {
        format: "png",
        quality: 1,
      });

      // Share the image
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Error sharing image:", error);
      Alert.alert("Error", "Failed to share image");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <SafeAreaView className="flex flex-col flex-1 justify-start px-6 pt-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeftIcon />
          </TouchableOpacity>
          <Text className="text-[#27272A] text-2xl" font="fustat-bold">
            Badge Details
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Badge Card */}
        <LinearGradient
          colors={["#4893E5", "#F1639C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 0.5,
            borderRadius: 21.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <View
            ref={badgeCardRef}
            collapsable={false}
            className="bg-white rounded-3xl p-12 items-center gap-12 w-full"
          >
            {/* App Logo */}
            <View className="flex flex-row items-center justify-center">
              <Image source={logo} className="size-14" resizeMode="contain" />

              <View className="flex flex-col text-center justify-center mb-1">
                <Text className="text-center text-sm" font="fredoka">
                  Smarter
                </Text>
                <Text className=" text-cyan-500 text-sm" font="fredoka">
                  Hydrate
                </Text>
              </View>
            </View>

            {/* Badge Content */}
            <View className="items-center gap-4 w-full">
              {/* Badge Icon */}
              <View className="items-center justify-center w-full">
                {badgeIcons[badgeId as string] || badgeIcons["3-days"]}
              </View>

              <View className="items-center gap-1">
                <Text className="text-[#27272A] text-base" font="fustat-bold">
                  {title}
                </Text>
                <Text className="text-[#52525B] text-sm" font="fustat-medium">
                  {status}
                </Text>
              </View>

              {/* Unlock Date */}
              {unlockDate && (
                <View className="bg-[#F4F4F5] border border-[rgba(113,113,122,0.16)] rounded-lg px-3 py-1.5 flex-row items-center gap-2">
                  <TickCircleIcon />
                  <Text className="text-[#52525B] text-xs" font="fustat-medium">
                    Unlocked on {unlockDate}
                  </Text>
                </View>
              )}

              {/* User Info */}
              <View className="flex-row items-center gap-1">
                <Ionicons name="person" size={12} color="#71717A" />
                <Text className="text-[#71717A] text-sm" font="fustat-medium">
                  Ahsan Habib
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Action Buttons */}
        <View className="flex-row gap-4">

          <TouchableOpacity
            onPress={handleShare}
            className="flex-1 bg-[#0090C8] rounded-2xl py-4 items-center"
          >
            <Text className="text-white text-base" font="fustat-semibold">
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
