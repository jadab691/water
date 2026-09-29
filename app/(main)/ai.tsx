import { DoubleSparkleIcon, SparkleIcon } from "@/components/SVGIcons";
import Text from "@/components/Text";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAppAuth } from "@/utils/auth";

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

const ErrorIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path
      d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
      stroke="#EF4444"
      strokeWidth={1.5}
    />
    <Path
      d="M10 6V11"
      stroke="#EF4444"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Path
      d="M10 14H10.01"
      stroke="#EF4444"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

type AISuggestion = {
  waterIntake: string;
  recommendations: string[];
  additionalTips: string;
};

import { apiClient } from "@/utils/api";

export default function AI() {
  const { user } = useAppAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [dailyGoal, setDailyGoal] = useState("");
  const [weight, setWeight] = useState("64");
  const [activityLevel, setActivityLevel] = useState<
    "low" | "moderate" | "high"
  >("moderate");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSmartGoal = async () => {
    if (!dailyGoal) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setError("Please enter your daily goal");
      return;
    }

    const dailyGoalNum = parseFloat(dailyGoal);
    if (isNaN(dailyGoalNum) || dailyGoalNum <= 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setError("Daily goal must be a positive number");
      return;
    }

    if (!weight) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setError("Please enter your weight");
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setError("Weight must be a positive number");
      return;
    }

    setLoading(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setError(null);
    try {
      const res = await apiClient.makeRequest("/api/ai/generate-goal", {
        method: "POST",
        body: JSON.stringify({
          clerkUserId: user?.id || "",
          weight: weightNum,
          dailyGoal: dailyGoalNum,
          activityLevel,
        }),
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to generate suggestion");
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSuggestion(res.data);
      setShowSuggestion(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (err: any) {
      const errorMessage = err?.message || "Network error. Please try again.";
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setError(errorMessage);
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGoal = () => {
    generateSmartGoal();
  };

  const handleGenerateAnother = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowSuggestion(false);
    setSuggestion(null);
    setError(null);
    setDailyGoal("");
    setWeight("64");
    setActivityLevel("moderate");
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1 bg-[#FAFAFA]"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View className="flex flex-col flex-1 justify-start px-6 pt-2 pb-6">
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
                  onChangeText={(val) => {
                    setDailyGoal(val);
                    if (error) {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setError(null);
                    }
                  }}
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
                  onChangeText={(val) => {
                    setWeight(val);
                    if (error) {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setError(null);
                    }
                  }}
                  keyboardType="numeric"
                  editable={!showSuggestion}
                  className="text-[#71717A] text-base"
                  style={{ fontFamily: "Fustat-Medium" }}
                />
              </View>
            </View>

            {/* Activity Level */}
            <View>
              <Text className="text-[#3F3F46] text-sm mb-1.5">
                Activity Level
              </Text>
              <View className="flex-row gap-2">
                {(["low", "moderate", "high"] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => {
                      setActivityLevel(level);
                      if (error) {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setError(null);
                      }
                    }}
                    disabled={showSuggestion}
                    className={`flex-1 py-2 px-3 rounded-xl border ${
                      activityLevel === level
                        ? "bg-[#4893E5] border-[#4893E5]"
                        : "bg-white border-[#E4E4E7]"
                    }`}
                  >
                    <Text
                      className={`text-center text-xs capitalize ${
                        activityLevel === level
                          ? "text-white"
                          : "text-[#3F3F46]"
                      }`}
                      font="fustat-medium"
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Activity Level removed — not used. */}
          </View>

          {/* Error Banner */}
          {error && (
            <View className="flex-row items-center gap-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-2xl p-4 mb-4">
              <ErrorIcon />
              <Text className="flex-1 text-[#991B1B] text-sm" font="fustat-medium">
                {error}
              </Text>
            </View>
          )}

          {/* Generate Button */}
          <TouchableOpacity
            onPress={handleGenerateGoal}
            disabled={showSuggestion || loading}
          >
            <LinearGradient
              colors={
                showSuggestion || loading
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
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <SparkleIcon width={24} height={24} />
                  <Text className="text-white text-base" font="fustat-semibold">
                    Generate Smart Goal
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* AI Suggestion Card */}
        {showSuggestion && suggestion && (
          <View className="gap-5 mt-6">
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
                      {suggestion.additionalTips}
                    </Text>
                    <View className="gap-2">
                      <Text className="text-[#3F3F46] text-sm font-bold">
                        Recommended Daily Intake: {suggestion.waterIntake}
                      </Text>
                      {suggestion.recommendations.map((rec, idx) => (
                        <Text key={idx} className="text-[#3F3F46] text-sm">
                          {idx + 1}. {rec}
                        </Text>
                      ))}
                    </View>
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
      </View>
    </ScrollView>
  );
}
