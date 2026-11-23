import Activity from "@/components/Activity";
import Btn from "@/components/Btn";
import Confetti from "@/components/Confetti";
import CustomAmountModal from "@/components/CustomAmountModal";
import Quickadd from "@/components/Quickadd";
import Text from "@/components/Text";
import WaterWaveCircle from "@/components/WaterWaveCircle";
import { useAppAuth } from "@/utils/auth";
import {
  addLocalWaterLog,
  deleteLocalWaterLog,
  getLocalCups,
  getLocalProfile,
  getTodayWaterLogs,
  type LocalCup,
} from "@/utils/localDatabase";
import {
  calculateDailyStats,
  type DailyStats,
  type WaterLogRecord,
} from "@/utils/offlineLogic";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

type Cup = LocalCup;
type WaterLog = WaterLogRecord;

const Home = () => {
  const { user } = useAppAuth();
  const router = useRouter();
  const clerkUserId = user?.id || "";

  const [modalVisible, setModalVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevPercentageRef = useRef<number | null>(null);
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
    if (!clerkUserId) {
      setIsLoading(false);
      return;
    }

    try {
      const [profile, localCups, logs] = await Promise.all([
        getLocalProfile(clerkUserId),
        getLocalCups(clerkUserId),
        getTodayWaterLogs(clerkUserId),
      ]);
      setDailyGoal(profile.dailyGoalMl);
      setCups(localCups);
      setWaterLogs(logs);
      setDailyStats(calculateDailyStats(logs, profile.dailyGoalMl));
    } catch (error) {
      console.error("Error loading home data:", error);
      Alert.alert("Error", "Unable to load your local hydration data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clerkUserId]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData]),
  );

  const logWater = async (amount: number, note: string) => {
    if (!clerkUserId) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((error) =>
        console.warn("Water-log haptic feedback failed:", error),
      );
      const previousTotal = dailyStats.total_ml;
      await addLocalWaterLog(clerkUserId, amount, note);
      const logs = await getTodayWaterLogs(clerkUserId);
      const stats = calculateDailyStats(logs, dailyGoal);
      setWaterLogs(logs);
      setDailyStats(stats);
      if (previousTotal < dailyGoal && stats.total_ml >= dailyGoal) {
        setShowConfetti(true);
      }
    } catch (error) {
      console.error("Error logging water:", error);
      Alert.alert("Error", "Unable to save this water log on your device.");
    }
  };

  const handleAddWaterFromCup = (cup: Cup) => {
    void logWater(cup.volume, `Added from ${cup.name}`);
  };

  const handleAddCustomWater = (amount: string, note?: string) => {
    const volume = parseInt(amount, 10);
    if (Number.isNaN(volume) || volume <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }
    setModalVisible(false);
    void logWater(volume, note ?? "");
  };

  const handleDeleteLog = (log: WaterLog) => {
    Alert.alert(
      "Delete Activity",
      `Are you sure you want to delete this ${log.amount_ml} ml log?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteWaterLog(log),
        },
      ],
    );
  };

  const deleteWaterLog = async (log: WaterLog) => {
    if (!clerkUserId) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch((error) =>
        console.warn("Water-log haptic feedback failed:", error),
      );
      const deleted = await deleteLocalWaterLog(clerkUserId, log.id);
      if (!deleted) {
        Alert.alert("Error", "This water log could not be found.");
        return;
      }
      const logs = await getTodayWaterLogs(clerkUserId);
      setWaterLogs(logs);
      setDailyStats(calculateDailyStats(logs, dailyGoal));
    } catch (error) {
      console.error("Error deleting water log:", error);
      Alert.alert("Error", "Unable to delete this water log from your device.");
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadHomeData();
  }, [loadHomeData]);

  const hydrationPercentage = calculateHydrationPercentage();

  // Celebrate completing 100% goal
  useEffect(() => {
    if (hydrationPercentage >= 100) {
      if (prevPercentageRef.current !== null && prevPercentageRef.current < 100) {
        setShowConfetti(true);
      }
    }
    prevPercentageRef.current = hydrationPercentage;
  }, [hydrationPercentage]);

  const displayName = user?.firstName || user?.fullName || "";
  const userInitial = displayName ? displayName.trim().charAt(0).toUpperCase() : "";

  return (
    <View className="flex-1 bg-[#FAFAFA]">
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
                    title={item.name}
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
            Today&apos;s Activity
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
                  onDelete={() => handleDeleteLog(log)}
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

    <Confetti
      trigger={showConfetti}
      onComplete={() => setShowConfetti(false)}
    />
  </View>
  );
};

export default Home;
