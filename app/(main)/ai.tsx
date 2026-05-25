import { DoubleSparkleIcon, SparkleIcon } from "@/components/SVGIcons";
import Text from "@/components/Text";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const ArrowDownIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path
      d="M14.9401 6.71252L10.0501 11.6025C9.47256 12.18 8.52756 12.18 7.95006 11.6025L3.06006 6.71252"
      stroke="#52525B"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function AI() {
  const [dailyGoal, setDailyGoal] = useState("");
  const [weight, setWeight] = useState("64");
  const [showSuggestion, setShowSuggestion] = useState(false);

  const handleGenerateGoal = () => {
    console.log({ dailyGoal, weight });
    setShowSuggestion(true);
  };

  const handleGenerateAnother = () => {
    setShowSuggestion(false);
    setDailyGoal("");
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <SafeAreaView className="flex flex-col flex-1 justify-start px-6 pt-6">
        <View className="bg-white rounded-2xl border border-[#E4E4E7] p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-[#27272A] text-xl mb-1" font="fustat-bold">
              Get Smart Goal
            </Text>
            <Text className="text-[#52525B] text-sm" font="fustat-medium">
              Customize your daily intake target
            </Text>
          </View>

          {/* Form Fields */}
          <View className="gap-4 mb-6">
            {/* Daily Goal */}
            <View>
              <Text className="text-[#3F3F46] text-sm mb-1.5">Daily Goal</Text>
              <View
                className={`${showSuggestion ? "bg-[#F4F4F5]" : "bg-white"} border border-[#E4E4E7] rounded-2xl px-6 py-1 flex-row items-center justify-between`}
              >
                <TextInput
                  value={dailyGoal}
                  onChangeText={setDailyGoal}
                  placeholder="Enter amount"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                  editable={!showSuggestion}
                  className="flex-1 text-[#3F3F46] text-base"
                  style={{ fontFamily: "Fustat-Regular" }}
                />
                <Text className="text-[#52525B] text-base">ml</Text>
              </View>
            </View>

            {/* Weight */}
            <View>
              <Text className="text-[#3F3F46] text-sm mb-1.5">Weight (kg)</Text>
              <View
                className={`${showSuggestion ? "bg-[#F4F4F5]" : "bg-white"} border border-[#E4E4E7] rounded-2xl px-6 py-1`}
              >
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  editable={!showSuggestion}
                  className="text-[#71717A] text-base"
                  style={{ fontFamily: "Fustat-Medium" }}
                />
              </View>
            </View>

            {/* Activity Level removed — not used. */}
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            onPress={handleGenerateGoal}
            disabled={showSuggestion}
          >
            <LinearGradient
              colors={
                showSuggestion
                  ? ["rgba(72, 147, 229, 0.4)", "rgba(241, 99, 156, 0.4)"]
                  : ["#4893E5", "#F1639C"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 24,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <SparkleIcon width={24} height={24} />
              <Text className="text-white text-base" font="fustat-semibold">
                Generate Smart Goal
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* AI Suggestion Card */}
        {showSuggestion && (
          <View className="gap-5">
            <View className="bg-white border border-[#4893E5] rounded-2xl p-6">
              <View className="flex-row gap-3">
                <View className="w-8 h-8 items-center justify-center">
                  <DoubleSparkleIcon width={32} height={32} />
                </View>
                <View className="flex-1 gap-1.5">
                  <Text className="text-[#27272A] text-base" font="fustat-bold">
                    AI Suggestion Ready
                  </Text>
                  <View className="gap-3.5">
                    <Text className="text-[#3F3F46] text-sm">
                      Aim to drink regular throughout the day, adjusting upward
                      if you sweat more than usual from exercise or heat.
                    </Text>
                    <View className="gap-2">
                      <Text className="text-[#3F3F46] text-sm">
                        1. Drink minimum 2500 ml water everyday.
                      </Text>
                      <Text className="text-[#3F3F46] text-sm">
                        2. At least exercise 30 min everyday.
                      </Text>
                      <Text className="text-[#3F3F46] text-sm">
                        3. Maintain regular workout
                      </Text>
                    </View>
                    <Text className="text-[#3F3F46] text-sm">
                      Upward if you sweat more than usual from exercise or heat.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Generate Another Button */}
            <TouchableOpacity onPress={handleGenerateAnother}>
              <LinearGradient
                colors={["#4893E5", "#F1639C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <SparkleIcon width={24} height={24} />
                <Text className="text-white text-base" font="fustat-semibold">
                  Generate Another
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </ScrollView>
  );
}
