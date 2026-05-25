import Activity from "@/components/Activity";
import Btn from "@/components/Btn";
import CustomAmountModal from "@/components/CustomAmountModal";
import Quickadd from "@/components/Quickadd";
import { BellIcon } from "@/components/SVGIcons";
import Text from "@/components/Text";
import { apiClient } from "@/utils/api";
import { useUser } from "@clerk/expo";
import Entypo from "@expo/vector-icons/Entypo";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

const Home = () => {
  const { user } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cups, setCups] = useState<Cup[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    total_ml: 0,
    goal_met: false,
    log_count: 0,
  });
  const [dailyGoal, setDailyGoal] = useState(2000);
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

  const loadHomeData = useCallback(async () => {
    const clerkUserId = getClerkUserId();
    if (!clerkUserId) {
      setIsLoading(false);
      return;
    }

    try {
      // Load profile to get daily goal and units
      const profileRes = await apiClient.makeRequest(
        `/api/users/profile?clerkUserId=${encodeURIComponent(clerkUserId)}`,
      );

      if (profileRes.success && profileRes.data) {
        const data = profileRes.data as any;
        const profileData = data.profile || data;
        const settingsData = data.settings || data;

        // Parse daily goal
        const goal =
          profileData.daily_goal_ml ?? settingsData.daily_goal_ml ?? 2000;
        if (typeof goal === "string") {
          setDailyGoal(parseInt(goal, 10));
        } else {
          setDailyGoal(goal);
        }

        // Units are fixed to ml; ignore unit from profile/settings
      }

      // Load cups, daily stats, and water logs in parallel
      const [cupsRes, statsRes, logsRes] = await Promise.all([
        apiClient.makeRequest(
          `/api/users/cups?clerkUserId=${encodeURIComponent(clerkUserId)}`,
        ),
        apiClient.makeRequest(
          `/api/users/daily-stats?clerkUserId=${encodeURIComponent(clerkUserId)}`,
        ),
        apiClient.makeRequest(
          `/api/users/water-logs?clerkUserId=${encodeURIComponent(clerkUserId)}`,
        ),
      ]);

      // Process cups
      if (cupsRes.success) {
        const cupData = (cupsRes.data as any) || [];
        const normalizedCups = Array.isArray(cupData)
          ? cupData
          : Array.isArray(cupData.cups)
            ? cupData.cups
            : Array.isArray(cupData.data)
              ? cupData.data
              : [];

        setCups(
          normalizedCups.map((item: any) => ({
            id: Number(item.id),
            name: item.name,
            volume: Number(item.volume ?? item.amount ?? 0),
            unit: item.unit || "ml",
          })),
        );
      }

      // Process daily stats
      if (statsRes.success) {
        const data = statsRes.data as any;
        setDailyStats({
          total_ml: Number(data.total_ml ?? 0),
          goal_met: Boolean(data.goal_met ?? false),
          log_count: Number(data.log_count ?? 0),
        });
      }

      // Process water logs
      if (logsRes.success) {
        const logData = (logsRes.data as any) || [];
        const normalizedLogs = Array.isArray(logData)
          ? logData
          : Array.isArray(logData.logs)
            ? logData.logs
            : Array.isArray(logData.data)
              ? logData.data
              : [];

        // Sort logs by logged_at in descending order (newest first)
        const sortedLogs = normalizedLogs
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

        setWaterLogs(sortedLogs);
      }
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getClerkUserId()]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData]),
  );

  const handleAddWaterFromCup = async (cup: Cup) => {
    const clerkUserId = getClerkUserId();
    if (!clerkUserId) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    try {
      const payload = {
        clerkUserId,
        amount_ml: cup.volume,
        notes: `Added from ${cup.name}`,
      };

      const res = await apiClient.makeRequest("/api/users/water-logs", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        // Reload data to reflect the new log
        await loadHomeData();
        return;
      }

      Alert.alert("Error", res.message || "Failed to log water intake.");
    } catch (error) {
      console.error("Error logging water:", error);
      Alert.alert("Error", "Failed to log water intake. Please try again.");
    }
  };

  const handleAddCustomWater = async (amount: string, note: string) => {
    const clerkUserId = getClerkUserId();
    if (!clerkUserId) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    const volume = parseInt(amount, 10);
    if (Number.isNaN(volume) || volume <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    try {
      const payload = {
        clerkUserId,
        amount_ml: volume,
        notes: note,
      };

      const res = await apiClient.makeRequest("/api/users/water-logs", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setModalVisible(false);
        // Reload data to reflect the new log
        await loadHomeData();
        Alert.alert("Success", "Water intake logged!");
        return;
      }

      Alert.alert("Error", res.message || "Failed to log water intake.");
    } catch (error) {
      console.error("Error logging water:", error);
      Alert.alert("Error", "Failed to log water intake. Please try again.");
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadHomeData();
  }, [loadHomeData]);

  const hydrationPercentage = calculateHydrationPercentage();

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <SafeAreaView className="flex flex-col flex-1 justify-start bg-[#FAFAFA] p-6">
        <View className="flex flex-row w-full items-center justify-between mb-12">
          <View>
            <Text className="justify-center text-[#27272A]" font="fustat-bold">
              Hi {user?.firstName || "User"}!
            </Text>
            <Text className="justify-center text-[#3F3F46] text-sm">
              {formatDate()}
            </Text>
          </View>
          <View className="bg-[#E6F6FA] flex p-4 size-140 items-center justify-center aspect-square rounded-2xl">
            <BellIcon style={{ width: 24, height: 24 }} />
          </View>
        </View>

        <View className="flex flex-col align-middle w-full">
          <View className="bg-[#EEFAFF] flex justify-center items-center rounded-full size-60 shadow-2xl border-4 border-white overflow-hidden self-center">
            {isLoading ? (
              <ActivityIndicator size="large" color="#0090C8" />
            ) : (
              <>
                <Text className="text-center justify-center text-Color-Solid-Color-Default-default-800 text-4xl font-extrabold">
                  {hydrationPercentage}%
                </Text>
                <Text className="self-stretch text-center justify-center text-Color-Solid-Color-Default-default-700 text-lg font-normal uppercase">
                  HYDRATED
                </Text>
              </>
            )}
          </View>
          <Text className="text-[#71717A] text-2xl font-normal my-8 self-center">
            <Text className="text-[#3F3F46] text-2xl font-extrabold">
              {dailyStats.total_ml}
            </Text>{" "}
            / {dailyGoal} ml
          </Text>

          {isLoading ? (
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
                  <TouchableOpacity
                    onPress={() => handleAddWaterFromCup(item)}
                    activeOpacity={0.8}
                  >
                    <Quickadd amount={`${item.volume}${item.unit}`} />
                  </TouchableOpacity>
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

          {isLoading ? (
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
        />
      </SafeAreaView>
    </ScrollView>
  );
};

export default Home;
