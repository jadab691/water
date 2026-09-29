import { ShareIcon, WaterDropIcon } from "@/components/SVGIcons";
import Text from "@/components/Text";
import { apiClient } from "@/utils/api";
import { useAppAuth } from "@/utils/auth";
import { useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

type WeekEntry = {
  date: string;
  day: string;
  value: number;
};

export default function History() {
  const { user } = useAppAuth();
  const historyContentRef = useRef<View>(null);
  const [weekData, setWeekData] = useState<WeekEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const clerkUserId = user?.id || "";

  const buildEmptyWeek = useCallback((): WeekEntry[] => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const dateKey = `${y}-${m}-${d}`;
      const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });

      return { date: dateKey, day: dayLabel, value: 0 };
    });
  }, []);

  const normalizeWeekData = useCallback(
    (input: any): WeekEntry[] => {
      const emptyWeek = buildEmptyWeek();
      const items = Array.isArray(input)
        ? input
        : Array.isArray(input?.week)
          ? input.week
          : Array.isArray(input?.data)
            ? input.data
            : [];

      if (!items.length) return emptyWeek;

      const byDate = new Map(emptyWeek.map((item) => [item.date, item]));

      items.forEach((item: any) => {
        const date = String(item.date || "");
        const dayLabel = String(
          item.day ||
            (date
              ? new Date(date).toLocaleDateString("en-US", {
                  weekday: "short",
                })
              : ""),
        );
        const value = Number(
          item.total_ml ?? item.value ?? item.amount_ml ?? 0,
        );

        if (date && byDate.has(date)) {
          byDate.set(date, {
            date,
            day: dayLabel || byDate.get(date)!.day,
            value,
          });
          return;
        }

        if (dayLabel) {
          const match = emptyWeek.find((entry) => entry.day === dayLabel);
          if (match) {
            byDate.set(match.date, { ...match, value });
          }
        }
      });

      return Array.from(byDate.values());
    },
    [buildEmptyWeek],
  );

  const loadHistoryData = useCallback(async (forceRefresh = false) => {
    if (!clerkUserId) {
      setIsLoading(false);
      setWeekData(buildEmptyWeek());
      return;
    }

    try {
      const res = await apiClient.makeRequest(
        `/api/users/weekly-stats?clerkUserId=${encodeURIComponent(clerkUserId)}`,
        { forceRefresh },
      );

      if (res.success) {
        setWeekData(normalizeWeekData(res.data));
        return;
      }

      setWeekData(buildEmptyWeek());
    } catch (error) {
      console.error("Error loading weekly history:", error);
      setWeekData(buildEmptyWeek());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [buildEmptyWeek, clerkUserId, normalizeWeekData]);

  useFocusEffect(
    useCallback(() => {
      loadHistoryData(false);
    }, [loadHistoryData]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadHistoryData(true);
  }, [loadHistoryData]);

  const totalWeek = useMemo(
    () => weekData.reduce((sum, item) => sum + item.value, 0),
    [weekData],
  );
  const average = useMemo(
    () => (weekData.length ? Math.round(totalWeek / weekData.length) : 0),
    [totalWeek, weekData.length],
  );
  const bestDay = useMemo(
    () =>
      weekData.length ? Math.max(...weekData.map((item) => item.value)) : 0,
    [weekData],
  );

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
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
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
              {isLoading ? (
                <ActivityIndicator size="small" color="#0090C8" />
              ) : (
                <Text
                  className="text-[#27272A] text-xl text-center"
                  font="fustat-bold"
                >
                  {totalWeek} ml
                </Text>
              )}
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
                {isLoading ? (
                  <ActivityIndicator size="small" color="#0090C8" />
                ) : (
                  <Text className="text-[#27272A] text-xl" font="fustat-bold">
                    {average} ml
                  </Text>
                )}
              </View>
              <View className="flex-1 bg-white border border-[#E4E4E7] rounded-2xl p-4">
                <Text
                  className="text-[#71717A] text-sm mb-1"
                  font="fustat-semibold"
                >
                  Best Day
                </Text>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#0090C8" />
                ) : (
                  <Text className="text-[#27272A] text-xl" font="fustat-bold">
                    {bestDay} ml
                  </Text>
                )}
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
