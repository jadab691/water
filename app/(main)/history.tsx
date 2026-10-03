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
import { captureRef } from "react-native-view-shot";

type WeekEntry = {
  date: string;
  day: string;
  value: number;
};

const buildEmptyWeek = (): WeekEntry[] => {
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
};

const normalizeWeekData = (input: any): WeekEntry[] => {
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
};

const formatBarMetric = (val: number): string => {
  if (!val || val === 0) return "0";
  if (val >= 1000) {
    const inLiters = val / 1000;
    return inLiters % 1 === 0 ? `${inLiters}L` : `${inLiters.toFixed(1)}L`;
  }
  return `${val}`;
};

export default function History() {
  const { user } = useAppAuth();
  const historyContentRef = useRef<View>(null);
  const clerkUserId = user?.id || "";

  // Synchronously peek at cache for instant 0ms mount
  const cachedWeekly = clerkUserId
    ? apiClient.getCachedData<any>(`/api/users/weekly-stats?clerkUserId=${encodeURIComponent(clerkUserId)}`)
    : null;

  const [weekData, setWeekData] = useState<WeekEntry[]>(() =>
    cachedWeekly ? normalizeWeekData(cachedWeekly) : buildEmptyWeek(),
  );
  const [isLoading, setIsLoading] = useState(!cachedWeekly);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const todayDateStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const loadHistoryData = useCallback(async (forceRefresh = false) => {
    if (!clerkUserId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.makeRequest(
        `/api/users/weekly-stats?clerkUserId=${encodeURIComponent(clerkUserId)}`,
        { forceRefresh },
      );

      if (res.success && res.data) {
        setWeekData(normalizeWeekData(res.data));
      }
    } catch (error) {
      console.error("Error loading weekly history:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clerkUserId]);

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

  // Calculate height based on value (max height is 150px)
  const maxHeight = 150;
  const maxValue = useMemo(() => Math.max(bestDay, 2000), [bestDay]);
  const getBarHeight = (value: number) => {
    if (maxValue === 0 || value <= 0) return 6;
    return Math.max(8, (value / maxValue) * maxHeight);
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
      className="flex-1 bg-[#FAFAFA]"
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View className="flex flex-col flex-1 justify-start px-6 pt-2 pb-6">
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
            <View className="bg-white border border-[#E4E4E7] rounded-2xl p-5 gap-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-[#27272A] text-xl" font="fustat-bold">
                  Weekly progress
                </Text>
                {selectedDayIndex !== null && weekData[selectedDayIndex] ? (
                  <View className="bg-[#E0F2FE] px-3 py-1 rounded-full">
                    <Text className="text-[#0090C8] text-xs" font="fustat-bold">
                      {weekData[selectedDayIndex].day}: {weekData[selectedDayIndex].value.toLocaleString()} ml
                    </Text>
                  </View>
                ) : (
                  <Text className="text-[#71717A] text-xs" font="fustat-medium">
                    Goal: 2000 ml
                  </Text>
                )}
              </View>

              <View className="flex-row items-end gap-2 pt-1">
                {weekData.map((item, index) => {
                  const isSelected = selectedDayIndex === index;
                  const isToday = item.date === todayDateStr;
                  const isBest = item.value === bestDay && item.value > 0;
                  const barHeight = getBarHeight(item.value);

                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.7}
                      onPress={() =>
                        setSelectedDayIndex((prev) => (prev === index ? null : index))
                      }
                      className="flex-1 items-center"
                    >
                      {/* Fixed height container for consistent bar alignment */}
                      <View
                        className="w-full items-center justify-end"
                        style={{ height: maxHeight + 26 }}
                      >
                        {/* Metric Count Label above bar */}
                        <Text
                          className={`text-[11px] mb-1.5 text-center ${
                            isSelected
                              ? "text-[#0090C8] font-bold"
                              : isBest
                                ? "text-[#0284C7] font-bold"
                                : item.value > 0
                                  ? "text-[#52525B] font-bold"
                                  : "text-[#A1A1AA] font-medium"
                          }`}
                          font={isSelected || isBest || item.value > 0 ? "fustat-bold" : "fustat-medium"}
                          numberOfLines={1}
                        >
                          {formatBarMetric(item.value)}
                        </Text>

                        {/* Bar Pillar */}
                        <View
                          className={`w-full rounded-lg ${
                            isSelected
                              ? "bg-[#0090C8]"
                              : isBest
                                ? "bg-[#0090C8]"
                                : item.value > 0
                                  ? "bg-[rgba(0,166,218,0.4)]"
                                  : "bg-[#F4F4F5]"
                          }`}
                          style={{
                            height: barHeight,
                            borderWidth: isSelected ? 1.5 : 0,
                            borderColor: "#0284C7",
                          }}
                        />
                      </View>

                      {/* Day Label below bar */}
                      <Text
                        className={`text-sm text-center mt-2 ${
                          isSelected || isToday
                            ? "text-[#0090C8] font-bold"
                            : "text-[#71717A]"
                        }`}
                        font={isSelected || isToday ? "fustat-bold" : "fustat-semibold"}
                      >
                        {item.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
      </View>
    </ScrollView>
  );
}
