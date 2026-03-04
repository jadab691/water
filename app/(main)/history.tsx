import { ShareIcon, WaterDropIcon } from "@/components/SVGIcons";
import Text from "@/components/Text";
import * as Sharing from "expo-sharing";
import React, { useRef } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

export default function History() {
  const historyContentRef = useRef<View>(null);

  // Sample data for the week
  const weekData = [
    { day: "Sun", value: 2000 },
    { day: "Mon", value: 1520 },
    { day: "Tue", value: 1060 },
    { day: "Wed", value: 1430 },
    { day: "Thu", value: 650 },
    { day: "Fri", value: 1160 },
    { day: "Sat", value: 810 },
  ];

  const totalWeek = weekData.reduce((sum, item) => sum + item.value, 0);
  const average = Math.round(totalWeek / weekData.length);
  const bestDay = Math.max(...weekData.map((item) => item.value));

  // Calculate height based on value (max height is 180px)
  const maxHeight = 180;
  const maxValue = bestDay;
  const getBarHeight = (value: number) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * maxHeight;
  };

  const handleShare = async () => {
    try {
      if (!historyContentRef.current) return;

      const uri = await captureRef(historyContentRef, {
        format: "png",
        quality: 1,
        width: 364,
      });

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Error sharing history:", error);
      Alert.alert("Error", "Failed to share history. Please try again.");
    }
  };

  return (
    <ScrollView
      className="bg-[#FAFAFA]"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <SafeAreaView className="flex flex-col flex-1 justify-start px-6 pt-6">
        {/* Title */}
        <View className="mb-6">
          <Text className="text-[#27272A] text-2xl" font="fustat-bold">
            History
          </Text>
        </View>

        <View className="gap-6">
          <View
            ref={historyContentRef}
            collapsable={false}
            className="bg-[#FAFAFA] gap-6 p-1"
          >
            {/* Total this week card */}
            <View className="bg-white border border-[#E4E4E7] rounded-2xl p-4 h-[84px] items-center justify-center relative overflow-hidden">
              <Text
                className="text-[#71717A] text-sm text-center mb-1"
                font="fustat-semibold"
              >
                Total this week
              </Text>
              <View className="flex-row items-center gap-3">
                <Text
                  className="text-[#27272A] text-xl text-center"
                  font="fustat-bold"
                >
                  {(totalWeek / 1000).toFixed(2)} L
                </Text>
                <View className="h-4 w-0 border-r border-[#E4E4E7]" />
                <Text
                  className="text-[#27272A] text-xl text-center"
                  font="fustat-bold"
                >
                  {totalWeek} ML
                </Text>
              </View>
              {/* Background water drop icons */}
              <View className="absolute left-[-25px] top-0 opacity-20">
                <WaterDropIcon width={63} height={63} />
              </View>
              <View className="absolute right-[20px] bottom-[-20px] opacity-20">
                <WaterDropIcon width={40} height={40} />
              </View>
            </View>

            {/* Average and Best Day cards */}
            <View className="flex-row gap-4">
              <View className="flex-1 bg-white border border-[#E4E4E7] rounded-2xl p-4">
                <Text
                  className="text-[#71717A] text-sm mb-1"
                  font="fustat-semibold"
                >
                  Average
                </Text>
                <Text className="text-[#27272A] text-xl" font="fustat-bold">
                  {average} ml
                </Text>
              </View>
              <View className="flex-1 bg-white border border-[#E4E4E7] rounded-2xl p-4">
                <Text
                  className="text-[#71717A] text-sm mb-1"
                  font="fustat-semibold"
                >
                  Best Day
                </Text>
                <Text className="text-[#27272A] text-xl" font="fustat-bold">
                  {bestDay} ml
                </Text>
              </View>
            </View>

            {/* Weekly progress chart */}
            <View className="bg-white border border-[#E4E4E7] rounded-2xl p-6 gap-8">
              <Text className="text-[#27272A] text-xl" font="fustat-bold">
                Weekly progress
              </Text>
              <View className="flex-row items-end gap-2">
                {weekData.map((item, index) => (
                  <View key={index} className="flex-1 items-center gap-3">
                    <View
                      className="bg-[rgba(0,166,218,0.3)] rounded-lg w-full"
                      style={{ height: getBarHeight(item.value) }}
                    />
                    <Text
                      className="text-[#71717A] text-sm text-center"
                      font="fustat-semibold"
                    >
                      {item.day}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Share button */}
          <TouchableOpacity
            onPress={handleShare}
            className="bg-[#0090C8] rounded-2xl py-4 flex-row items-center justify-center gap-3"
          >
            <ShareIcon color="white" width={24} height={24} />
            <Text className="text-white text-base" font="fustat-semibold">
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
