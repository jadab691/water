import Activity from "@/components/Activity";
import Btn from "@/components/Btn";
import CustomAmountModal from "@/components/CustomAmountModal";
import Quickadd from "@/components/Quickadd";
import Text from "@/components/Text";
import WaterWaveCircle from "@/components/WaterWaveCircle";
import { apiClient } from "@/utils/api";
import { useAppAuth } from "@/utils/auth";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

type Cup = {
  id: number;
  name: string;
  volume: number;
  unit: string;
};

type WaterLog = {
  id: number;
  amount_ml: number;
  logged_at: string;
  notes: string;
};

type DailyStats = {
  total_ml: number;
  goal_met: boolean;
  log_count: number;
};

const normalizeCups = (cupData: any): Cup[] => {
  const list = Array.isArray(cupData)
    ? cupData
    : Array.isArray(cupData?.cups)
      ? cupData.cups
      : Array.isArray(cupData?.data)
        ? cupData.data
        : [];
  return list.map((item: any) => ({
    id: Number(item.id),
    name: item.name,
    volume: Number(item.volume ?? item.amount ?? 0),
    unit: item.unit || "ml",
  }));
};

const normalizeDailyStats = (data: any): DailyStats => {
  if (!data) return { total_ml: 0, goal_met: false, log_count: 0 };
  const d = data.data || data;
  return {
    total_ml: Number(d.total_ml ?? 0),
    goal_met: Boolean(d.goal_met ?? false),
    log_count: Number(d.log_count ?? 0),
  };
};

const normalizeWaterLogs = (logData: any): WaterLog[] => {
  const list = Array.isArray(logData)
    ? logData
    : Array.isArray(logData?.logs)
      ? logData.logs
      : Array.isArray(logData?.data)
        ? logData.data
        : [];
  return list
    .map((item: any) => ({
      id: Number(item.id),
      amount_ml: Number(item.amount_ml ?? item.amount ?? 0),
      logged_at: item.logged_at ?? new Date().toISOString(),
      notes: item.notes ?? "",
    }))
    .sort(
      (a: WaterLog, b: WaterLog) =>
        new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime(),
    );
};

const parseDailyGoal = (pData: any): number => {
  if (!pData) return 2000;
  const profileData = pData.profile || pData;
  const settingsData = pData.settings || pData;
  const goal = profileData.daily_goal_ml ?? settingsData.daily_goal_ml ?? 2000;
  return typeof goal === "string" ? parseInt(goal, 10) : Number(goal) || 2000;
};

const Home = () => {
  const { user } = useAppAuth();
  const router = useRouter();
  const clerkUserId = user?.id || "";

  // Synchronously peek at cache so state can render immediately on mount (0ms)
  const cachedProfile = clerkUserId
    ? apiClient.getCachedData<any>(`/api/users/profile?clerkUserId=${encodeURIComponent(clerkUserId)}`)
    : null;
  const cachedCups = clerkUserId
    ? apiClient.getCachedData<any>(`/api/users/cups?clerkUserId=${encodeURIComponent(clerkUserId)}`)
    : null;
  const cachedStats = clerkUserId
    ? apiClient.getCachedData<any>(`/api/users/daily-stats?clerkUserId=${encodeURIComponent(clerkUserId)}`)
    : null;
  const cachedLogs = clerkUserId
    ? apiClient.getCachedData<any>(`/api/users/water-logs?clerkUserId=${encodeURIComponent(clerkUserId)}`)
    : null;

  const hasCachedData = Boolean(cachedCups || cachedStats || cachedLogs || cachedProfile);

  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(!hasCachedData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cups, setCups] = useState<Cup[]>(() => (cachedCups ? normalizeCups(cachedCups) : []));
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>(() => (cachedLogs ? normalizeWaterLogs(cachedLogs) : []));
  const [dailyStats, setDailyStats] = useState<DailyStats>(() =>
    cachedStats
      ? normalizeDailyStats(cachedStats)
      : {
          total_ml: 0,
          goal_met: false,
          log_count: 0,
        },
  );
  const [dailyGoal, setDailyGoal] = useState<number>(() =>
    cachedProfile ? parseDailyGoal(cachedProfile) : 2000,
  );
  // Unit fixed to ml

  const getClerkUserId = () => user?.id || "";

  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const formatDate = (): string => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      weekday: "short",
    });
  };

  const calculateHydrationPercentage = (): number => {
    if (dailyGoal <= 0) return 0;
    return Math.min(Math.round((dailyStats.total_ml / dailyGoal) * 100), 100);
  };

  const loadHomeData = useCallback(async (forceRefresh = false) => {
    const uid = getClerkUserId();
    if (!uid) {
      setIsLoading(false);
      return;
    }

    try {
      // Load profile to get daily goal and units
      const profileRes = await apiClient.makeRequest(
        `/api/users/profile?clerkUserId=${encodeURIComponent(uid)}`,
        { forceRefresh },
      );

      let pData = profileRes.data as any;

      if (!profileRes.success || !pData) {
        const initRes = await apiClient.makeRequest(
          "/api/users/initialize-profile",
          {
            method: "POST",
            body: JSON.stringify({
              clerkUserId: uid,
              email: user?.primaryEmailAddress?.emailAddress || "",
              firstName: user?.firstName || "User",
              lastName: user?.lastName || "",
            }),
          },
        );
        if (initRes.success && initRes.data) {
          pData = initRes.data;
        }
      }

      if (pData) {
        setDailyGoal(parseDailyGoal(pData));
      }

      // Load cups, daily stats, and water logs in parallel
      const [cupsRes, statsRes, logsRes] = await Promise.all([
        apiClient.makeRequest(
          `/api/users/cups?clerkUserId=${encodeURIComponent(uid)}`,
          { forceRefresh },
        ),
        apiClient.makeRequest(
          `/api/users/daily-stats?clerkUserId=${encodeURIComponent(uid)}`,
          { forceRefresh },
        ),
        apiClient.makeRequest(
          `/api/users/water-logs?clerkUserId=${encodeURIComponent(uid)}`,
          { forceRefresh },
        ),
      ]);

      // Process cups
      if (cupsRes.success) {
        setCups(normalizeCups(cupsRes.data));
      }

      // Process daily stats
      if (statsRes.success) {
        setDailyStats(normalizeDailyStats(statsRes.data));
      }

      // Process water logs
      if (logsRes.success) {
        setWaterLogs(normalizeWaterLogs(logsRes.data));
      }
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData]),
  );

  const logWaterOptimistically = async (amount: number, note: string) => {
    const clerkUserId = getClerkUserId();
    if (!clerkUserId) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    // 1. Snapshot previous state for rollback if network fails
    const prevStats = dailyStats;
    const prevLogs = waterLogs;

    // 2. Trigger instant haptic feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    // 3. Immediately update UI state (0ms latency!)
    const tempId = Date.now();
    const optimisticLog: WaterLog = {
      id: tempId,
      amount_ml: amount,
      logged_at: new Date().toISOString(),
      notes: note,
    };

    const newStats: DailyStats = {
      total_ml: prevStats.total_ml + amount,
      goal_met: (prevStats.total_ml + amount) >= dailyGoal,
      log_count: prevStats.log_count + 1,
    };
    const newLogs = [optimisticLog, ...prevLogs];

    setDailyStats(newStats);
    setWaterLogs(newLogs);

    // Keep cache instantly synchronized across tab navigations
    apiClient.setCachedData(
      `/api/users/daily-stats?clerkUserId=${encodeURIComponent(clerkUserId)}`,
      newStats,
    );
    apiClient.setCachedData(
      `/api/users/water-logs?clerkUserId=${encodeURIComponent(clerkUserId)}`,
      newLogs,
    );

    // 4. Send network request in the background
    try {
      const payload = {
        clerkUserId,
        amount_ml: amount,
        notes: note,
      };

      const res = await apiClient.makeRequest("/api/users/water-logs", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.success) {
        // Rollback on failure
        setDailyStats(prevStats);
        setWaterLogs(prevLogs);
        apiClient.setCachedData(
          `/api/users/daily-stats?clerkUserId=${encodeURIComponent(clerkUserId)}`,
          prevStats,
        );
        apiClient.setCachedData(
          `/api/users/water-logs?clerkUserId=${encodeURIComponent(clerkUserId)}`,
          prevLogs,
        );
        Alert.alert("Error", res.message || "Failed to log water intake.");
        return;
      }

      // If backend returned the created log with real ID, update the temp log ID
      if (res.data && (res.data as any).id) {
        const realId = Number((res.data as any).id);
        setWaterLogs((prev) => {
          const updated = prev.map((l) => (l.id === tempId ? { ...l, id: realId } : l));
          apiClient.setCachedData(
            `/api/users/water-logs?clerkUserId=${encodeURIComponent(clerkUserId)}`,
            updated,
          );
          return updated;
        });
      }
    } catch (error) {
      console.error("Error logging water:", error);
      // Rollback on error
      setDailyStats(prevStats);
      setWaterLogs(prevLogs);
      Alert.alert("Error", "Failed to log water intake. Please check your connection.");
    }
  };

  const handleAddWaterFromCup = (cup: Cup) => {
    logWaterOptimistically(cup.volume, `Added from ${cup.name}`);
  };

  const handleAddCustomWater = (amount: string, note?: string) => {
    const volume = parseInt(amount, 10);
    if (Number.isNaN(volume) || volume <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }
    setModalVisible(false);
    logWaterOptimistically(volume, note ?? "");
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadHomeData(true);
  }, [loadHomeData]);

  const hydrationPercentage = calculateHydrationPercentage();

  const displayName = user?.firstName || user?.fullName || "";
  const userInitial = displayName ? displayName.trim().charAt(0).toUpperCase() : "";

  return (
    <ScrollView
      className="flex-1 bg-[#FAFAFA]"
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View className="flex flex-col flex-1 justify-start px-6 pt-2 pb-6">
        <View className="flex flex-row w-full items-center justify-between mb-8">
          <View className="flex-1 pr-4">
            <Text
              className="text-[#27272A] text-2xl"
              font="fustat-bold"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Hi {user?.firstName || "User"}!
            </Text>
            <Text className="text-[#71717A] text-sm mt-0.5">
              {formatDate()}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/profile")}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              shadowColor: "#0090C8",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <LinearGradient
              colors={["#00D2FF", "#0090C8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {user?.hasImage && user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
              ) : (
                <View
                  style={{
                    width: 48,
                    height: 48,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {userInitial ? (
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 22,
                        textAlign: "center",
                        textAlignVertical: "center",
                        includeFontPadding: false,
                      }}
                      font="fredoka"
                    >
                      {userInitial}
                    </Text>
                  ) : (
                    <FontAwesome name="user" size={20} color="white" />
                  )}
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View className="flex flex-col align-middle w-full">
          {isLoading && cups.length === 0 && dailyStats.total_ml === 0 ? (
            <View className="bg-[#EEFAFF] flex justify-center items-center rounded-full size-60 shadow-2xl border-4 border-white overflow-hidden self-center">
              <ActivityIndicator size="large" color="#0090C8" />
            </View>
          ) : (
            <WaterWaveCircle percentage={hydrationPercentage} size={240}>
              <Text className="text-center justify-center text-Color-Solid-Color-Default-default-800 text-4xl font-extrabold">
                {hydrationPercentage}%
              </Text>
              <Text className="self-stretch text-center justify-center text-Color-Solid-Color-Default-default-700 text-lg font-normal uppercase">
                HYDRATED
              </Text>
            </WaterWaveCircle>
          )}
          <Text className="text-[#71717A] text-2xl font-normal my-8 self-center">
            <Text className="text-[#3F3F46] text-2xl font-extrabold">
              {dailyStats.total_ml}
            </Text>{" "}
            / {dailyGoal} ml
          </Text>

          {isLoading && cups.length === 0 ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color="#0090C8" />
            </View>
          ) : (
            <>
              <FlatList
                data={cups}
                numColumns={2}
                columnWrapperStyle={{ gap: 16 }}
                contentContainerStyle={{ gap: 16 }}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Quickadd
                    amount={`${item.volume} ml`}
                    onPress={() => handleAddWaterFromCup(item)}
                  />
                )}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                  <View className="w-full py-4 items-center">
                    <Text className="text-[#A1A1AA] text-base">
                      No cups added yet. Add one in the profile!
                    </Text>
                  </View>
                }
              />

              <Btn
                label="Custom Amount"
                leftIcon={<Entypo name="plus" size={24} color="white" />}
                textStyles="text-white"
                styles="bg-[#0090C8] w-full mt-6 mb-8"
                action={() => setModalVisible(true)}
              />
            </>
          )}
        </View>

        <View className="self-stretch p-6 bg-white rounded-2xl border border-[#E4E4E7] inline-flex flex-col justify-start items-start gap-6">
          <Text className="self-stretch justify-center text-Color-Solid-Color-Default-default-800 text-xl font-bold font-['Fustat']">
            Today's Activity
          </Text>

          {isLoading && waterLogs.length === 0 ? (
            <View className="w-full py-4 items-center">
              <ActivityIndicator size="small" color="#0090C8" />
            </View>
          ) : waterLogs.length > 0 ? (
            <View className="flex flex-col gap-2 w-full">
              {waterLogs.map((log) => (
                <Activity
                  key={log.id}
                  amount={`${log.amount_ml} ml`}
                  time={formatTime(log.logged_at)}
                />
              ))}
            </View>
          ) : (
            <Text className="text-[#A1A1AA] text-base">
              No water logged yet. Start hydrating!
            </Text>
          )}
        </View>

        <CustomAmountModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAdd={handleAddCustomWater}
          unit={"ml"}
          showNote={false}
        />
      </View>
    </ScrollView>
  );
};

export default Home;
