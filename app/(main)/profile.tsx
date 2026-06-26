import CustomAmountModal from "@/components/CustomAmountModal";
import {
  AddIcon,
  ArrowDownIcon,
  EditIcon,
  FifteenDayStreakIcon,
  GlassIcon,
  LogoutIcon,
  SevenDayStreakIcon,
  ShareIcon,
  ThreeDayStreakIcon,
  TrashIcon,
} from "@/components/SVGIcons";
import Text from "@/components/Text";
import { apiClient } from "@/utils/api";
import { useAuth, useUser } from "@clerk/expo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

type DropdownOption = {
  label: string;
  value: string;
};

type Achievement = {
  icon: React.ReactNode;
  title: string;
  date: string;
};

type Cup = {
  id: number;
  name: string;
  volume: number;
  unit: string;
};

export default function Profile() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const achievementsCardRef = useRef<View>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderSchedule, setReminderSchedule] = useState("");
  const [reminderSound, setReminderSound] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState<number | null>(null);
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);
  // Units fixed: water in ml, weight in kg
  const [showAddCupModal, setShowAddCupModal] = useState(false);

  // Edit profile modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [showReminderSchedule, setShowReminderSchedule] = useState(false);
  const [showReminderSound, setShowReminderSound] = useState(false);
  const [showGender, setShowGender] = useState(false);
  // removed unit/activity dropdown states (units are fixed)

  // Input modal states
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showDailyGoalModal, setShowDailyGoalModal] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [dailyGoalInput, setDailyGoalInput] = useState("");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [cups, setCups] = useState<Cup[]>([]);

  const getClerkUserId = () => user?.id || "";

  const pickValue = <T,>(...values: Array<T | null | undefined>) =>
    values.find((value) => value !== null && value !== undefined);

  const loadProfileData = async () => {
    const clerkUserId = getClerkUserId();
    if (!clerkUserId) {
      setIsLoadingProfile(false);
      return;
    }

    setIsLoadingProfile(true);
    try {
      const [profileRes, achievementsRes, cupsRes] = await Promise.all([
        apiClient.makeRequest(
          `/api/users/profile?clerkUserId=${encodeURIComponent(clerkUserId)}`,
        ),
        apiClient.makeRequest(
          `/api/users/achievements?clerkUserId=${encodeURIComponent(clerkUserId)}`,
        ),
        apiClient.makeRequest(
          `/api/users/cups?clerkUserId=${encodeURIComponent(clerkUserId)}`,
        ),
      ]);

      if (profileRes.success && profileRes.data) {
        const data = profileRes.data as any;
        const profileData = data.profile || data;
        const settingsData = data.settings || data;
        const generalData = data.general || data;

        const loadedName = pickValue(
          profileData.name,
          generalData.name,
          data.name,
        );
        if (loadedName) setProfileName(loadedName);

        const loadedReminderEnabled = pickValue(
          settingsData.reminderEnabled,
          settingsData.reminder_enabled,
        );
        if (typeof loadedReminderEnabled === "boolean") {
          setReminderEnabled(loadedReminderEnabled);
        }
        const loadedReminderSchedule = pickValue(
          settingsData.reminderSchedule,
          settingsData.reminder_schedule,
        );
        if (loadedReminderSchedule) {
          setReminderSchedule(String(loadedReminderSchedule));
        }
        const loadedReminderSound = pickValue(
          settingsData.reminderSound,
          settingsData.reminder_sound,
        );
        if (loadedReminderSound) {
          setReminderSound(String(loadedReminderSound));
        }

        const loadedGender = pickValue(
          profileData.gender,
          generalData.gender,
          data.gender,
        );
        if (loadedGender) setGender(String(loadedGender));

        const parseNumber = (v: any): number | null => {
          if (typeof v === "number") return v;
          if (typeof v === "string") {
            const n = parseFloat(v);
            return Number.isFinite(n) ? n : null;
          }
          return null;
        };

        const loadedWeight =
          parseNumber(profileData.weight) ??
          parseNumber(generalData.weight) ??
          parseNumber(data.weight);
        if (loadedWeight !== null) {
          setWeight(loadedWeight);
          setWeightInput(loadedWeight.toString());
        }

        const loadedDailyGoal =
          parseNumber(profileData.dailyGoal) ??
          parseNumber(profileData.daily_goal_ml) ??
          parseNumber(generalData.dailyGoal) ??
          parseNumber(generalData.daily_goal_ml) ??
          parseNumber(data.dailyGoal) ??
          parseNumber(data.daily_goal_ml);
        if (loadedDailyGoal !== null) {
          setDailyGoal(loadedDailyGoal);
          setDailyGoalInput(loadedDailyGoal.toString());
        }

        // Units are fixed on client state — use ml for water and kg for weight
      }

      if (achievementsRes.success) {
        const achievementData = (achievementsRes.data as any) || [];
        const normalizedAchievements = Array.isArray(achievementData)
          ? achievementData
          : Array.isArray(achievementData.achievements)
            ? achievementData.achievements
            : Array.isArray(achievementData.data)
              ? achievementData.data
              : [];

        // Show only unlocked / completed achievements in profile
        const unlocked = normalizedAchievements.filter((item: any) =>
          Boolean(
            item.completed ?? item.is_completed ?? item.unlocked ?? false,
          ),
        );

        setAchievements(
          unlocked.map((item: any) => {
            // prefer unlock timestamps from backend
            const rawUnlock =
              item.unlock_date ||
              item.unlocked_at ||
              item.unlockDate ||
              item.date ||
              item.createdAt ||
              "";
            const formatted = rawUnlock
              ? new Date(rawUnlock).toLocaleDateString()
              : "";

            return {
              icon: getAchievementIcon(item.title || item.name || ""),
              title: item.title || item.name || "Achievement",
              date: formatted,
            };
          }),
        );
      }

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
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleReminderToggle = (value: boolean) => {
    setReminderEnabled(value);
    saveReminderData({ reminderEnabled: value });
  };

  const handleReminderScheduleSelect = (value: string) => {
    setReminderSchedule(value);
    saveReminderData({ reminderSchedule: value });
  };

  const handleReminderSoundSelect = (value: string) => {
    setReminderSound(value);
    saveReminderData({ reminderSound: value });
  };

  // unit selection removed (units are fixed)

  const handleGenderSelect = (value: string) => {
    setGender(value);
    saveProfileData({ gender: value });
  };

  useEffect(() => {
    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const saveProfileData = async (overrides?: Partial<Record<string, any>>) => {
    const clerkUserId = getClerkUserId();
    if (!clerkUserId) return;

    setIsSavingProfile(true);
    const payload = {
      clerkUserId,
      name: profileName,
      gender,
      weight,
      dailyGoal,
      ...(overrides || {}),
    };

    const res = await apiClient.makeRequest("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    setIsSavingProfile(false);
    if (!res.success) {
      Alert.alert("Error", res.message || "Failed to save profile.");
    }
  };

  const saveReminderData = async (overrides?: Partial<Record<string, any>>) => {
    const clerkUserId = getClerkUserId();
    if (!clerkUserId) return;

    const payload = {
      clerkUserId,
      reminderEnabled,
      reminderSchedule: reminderSchedule || "30 min",
      reminderSound: reminderSound || "Water drop sound",
      ...(overrides || {}),
    };

    const res = await apiClient.makeRequest("/api/users/reminder-settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (!res.success) {
      Alert.alert("Error", res.message || "Failed to save reminder settings.");
    }
  };

  // Dropdown options
  const reminderScheduleOptions: DropdownOption[] = [
    { label: "15 min", value: "15 min" },
    { label: "30 min", value: "30 min" },
    { label: "1 hour", value: "1 hour" },
    { label: "2 hours", value: "2 hours" },
  ];

  const reminderSoundOptions: DropdownOption[] = [
    { label: "Water drop sound", value: "Water drop sound" },
    { label: "Bell sound", value: "Bell sound" },
    { label: "Chime sound", value: "Chime sound" },
  ];

  const genderOptions: DropdownOption[] = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ];

  // unit and activity options removed (units fixed)

  const handleWeightSave = () => {
    const value = parseInt(weightInput);
    if (!isNaN(value) && value > 0) {
      setWeight(value);
      setShowWeightModal(false);
      saveProfileData({ weight: value });
    }
  };

  const handleDailyGoalSave = () => {
    const value = parseInt(dailyGoalInput);
    if (!isNaN(value) && value > 0) {
      setDailyGoal(value);
      setShowDailyGoalModal(false);
      saveProfileData({ dailyGoal: value });
    }
  };

  const renderDropdown = (
    options: DropdownOption[],
    selectedValue: string,
    onSelect: (value: string) => void,
    onClose: () => void,
  ) => (
    <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E4E4E7] rounded-lg shadow-lg z-50 overflow-hidden">
      {options.map((option, index) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => {
            onSelect(option.value);
            onClose();
          }}
          className={`px-4 py-3 ${index < options.length - 1 ? "border-b border-[#E4E4E7]" : ""
            } ${selectedValue === option.value ? "bg-[#F4F4F5]" : ""}`}
        >
          <Text
            className={`text-base ${selectedValue === option.value
              ? "text-[#0090C8]"
              : "text-[#27272A]"
              }`}
            font={
              selectedValue === option.value
                ? "fustat-semibold"
                : "fustat-medium"
            }
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderInputModal = (
    visible: boolean,
    title: string,
    value: string,
    onChangeText: (text: string) => void,
    onSave: () => void,
    onClose: () => void,
    unit: string,
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/60 justify-center items-center"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="bg-white rounded-2xl p-6 mx-6 w-[320px]"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-[#27272A] text-xl mb-6" font="fustat-bold">
            {title}
          </Text>
          <View className="flex-row items-center gap-3 mb-6">
            <TextInput
              className="flex-1 bg-[#F4F4F5] rounded-lg px-4 py-3 text-base text-[#27272A]"
              style={{ fontFamily: "Fustat-Medium" }}
              value={value}
              onChangeText={onChangeText}
              keyboardType="numeric"
              placeholder="Enter value"
              placeholderTextColor="#A1A1AA"
            />
            <Text className="text-[#52525B] text-base" font="fustat-medium">
              {unit}
            </Text>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 border border-[#D4D4D8] rounded-xl py-3 items-center"
            >
              <Text className="text-[#52525B] text-base" font="fustat-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              className="flex-1 bg-[#0090C8] rounded-xl py-3 items-center"
            >
              <Text className="text-white text-base" font="fustat-semibold">
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const handleReminderSchedule = () => {
    setShowReminderSchedule(!showReminderSchedule);
    setShowReminderSound(false);
    setShowGender(false);
  };

  const handleEditProfile = () => {
    setEditName(profileName);
    setShowEditProfileModal(true);
  };

  const handleSaveEditProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Profile name cannot be empty.");
      return;
    }

    const clerkUserId = getClerkUserId();
    if (!clerkUserId) return;

    setIsSavingProfile(true);
    const payload = {
      clerkUserId,
      name: editName,
    };

    const res = await apiClient.makeRequest("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    setIsSavingProfile(false);
    if (res.success) {
      setProfileName(editName);
      setShowEditProfileModal(false);
      Alert.alert("Success", "Profile updated successfully!");
    } else {
      Alert.alert("Error", res.message || "Failed to update profile.");
    }
  };

  const handleShareAll = async () => {
    try {
      if (!achievementsCardRef.current) return;

      const uri = await captureRef(achievementsCardRef, {
        format: "png",
        quality: 1,
      });

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Error sharing achievements:", error);
      Alert.alert("Error", "Failed to share achievements. Please try again.");
    }
  };

  const handleDeleteCup = (cup: Cup) => {
    Alert.alert("Delete Cup", `Are you sure you want to delete ${cup.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const clerkUserId = getClerkUserId();
          if (!clerkUserId) return;

          const res = await apiClient.makeRequest(`/api/users/cups/${cup.id}`, {
            method: "DELETE",
            body: JSON.stringify({ clerkUserId }),
          });

          if (res.success) {
            setCups((prev) => prev.filter((item) => item.id !== cup.id));
            return;
          }

          Alert.alert("Error", res.message || "Failed to delete cup.");
        },
      },
    ]);
  };

  const handleAddCup = async () => {
    setShowAddCupModal(true);
  };

  const handleCreateCup = async (amount: string) => {
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

    const newCupPayload = {
      clerkUserId,
      name: `Cup ${cups.length + 1}`,
      volume,
      unit: "ml",
    };

    const res = await apiClient.makeRequest("/api/users/cups", {
      method: "POST",
      body: JSON.stringify(newCupPayload),
    });

    if (res.success && res.data) {
      setCups((prev) => [...prev, res.data as Cup]);
      setShowAddCupModal(false);
      return;
    }

    Alert.alert("Error", res.message || "Failed to add cup.");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoggingOut(true);
            await signOut();
            router.replace("/login");
          } catch (error) {
            console.error("Error logging out:", error);
            setIsLoggingOut(false);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const getAchievementIcon = (title: string) => {
    if (title.includes("15")) {
      return <FifteenDayStreakIcon width={50} height={51} />;
    }
    if (title.includes("7")) {
      return <SevenDayStreakIcon width={50} height={51} />;
    }
    return <ThreeDayStreakIcon width={50} height={51} />;
  };

  return (
    <>
      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/60 justify-center items-center"
          activeOpacity={1}
          onPress={() => setShowEditProfileModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-2xl p-6 mx-6 w-[320px]"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-[#27272A] text-xl mb-6" font="fustat-bold">
              Edit Profile
            </Text>
            <View className="gap-4 mb-6">
              <View>
                <Text className="text-[#3F3F46] text-sm mb-1.5">Name</Text>
                <TextInput
                  className="bg-[#F4F4F5] rounded-lg px-4 py-3 text-base text-[#27272A]"
                  style={{ fontFamily: "Fustat-Medium" }}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter name"
                  placeholderTextColor="#A1A1AA"
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowEditProfileModal(false)}
                className="flex-1 border border-[#D4D4D8] rounded-xl py-3 items-center"
              >
                <Text
                  className="text-[#52525B] text-base"
                  font="fustat-semibold"
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEditProfile}
                disabled={isSavingProfile}
                className="flex-1 bg-[#0090C8] rounded-xl py-3 items-center"
              >
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-base" font="fustat-semibold">
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Weight Input Modal */}
      {renderInputModal(
        showWeightModal,
        "Weight",
        weightInput,
        setWeightInput,
        handleWeightSave,
        () => setShowWeightModal(false),
        "kg",
      )}

      {/* Daily Goal Input Modal */}
      {renderInputModal(
        showDailyGoalModal,
        "Daily Goal",
        dailyGoalInput,
        setDailyGoalInput,
        handleDailyGoalSave,
        () => setShowDailyGoalModal(false),
        "ml",
      )}

      <CustomAmountModal
        visible={showAddCupModal}
        onClose={() => setShowAddCupModal(false)}
        onAdd={handleCreateCup}
        unit={"ml"}
        showNote={false}
      />

      <ScrollView
        className="bg-[#FAFAFA]"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <SafeAreaView className="flex flex-col flex-1 justify-start px-6 pt-6">
          {/* Profile Header */}
          <View className="bg-white border border-[#E4E4E7] rounded-2xl flex-row items-center justify-between pl-4 pr-6 py-4 mb-6">
            <View className="flex-row items-center gap-4">
              <LinearGradient
                colors={["#00D2FF", "#0090C8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 8 }}
                className="size-16 items-center justify-center border-2 border-white shadow-md"
              >
                {profileName ? (
                  <Text className="text-white text-3xl font-normal" font="fredoka">
                    {profileName.trim().charAt(0).toUpperCase()}
                  </Text>
                ) : (
                  <FontAwesome name="user" size={30} color="white" />
                )}
              </LinearGradient>
              <View className="gap-1">
                <Text className="text-[#27272A] text-2xl" font="fustat-bold">
                  {profileName || ""}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleEditProfile}>
              <EditIcon />
            </TouchableOpacity>
          </View>

          {/* Achievements Section */}
          <View className="bg-white border border-[#E4E4E7] rounded-2xl mb-4">
            <View
              ref={achievementsCardRef}
              collapsable={false}
              className="bg-white p-6 gap-6"
            >
              <Text className="text-[#27272A] text-xl" font="fustat-bold">
                Achievements
              </Text>
              <View className="gap-0">
                {achievements.length === 0 ? (
                  <View className="px-4 py-6 items-center">
                    <Text
                      className="text-[#71717A] text-base text-center"
                      font="fustat-medium"
                    >
                      No achievements yet. Keep logging your water to unlock
                      streak badges!
                    </Text>
                  </View>
                ) : (
                  achievements.map((achievement, index) => (
                    <View
                      key={index}
                      className={`flex-row items-center gap-4 px-4 ${index < achievements.length - 1
                        ? "pb-4 border-b border-[#E4E4E7]"
                        : "pt-4"
                        } ${index > 0 ? "pt-4" : ""}`}
                    >
                      <View className="size-[50px]">{achievement.icon}</View>
                      <View className="flex-1 gap-0.5">
                        <Text
                          className="text-[#52525B] text-xs"
                          font="fustat-medium"
                        >
                          {achievement.date}
                        </Text>
                        <Text
                          className="text-[#27272A] text-base"
                          font="fustat-bold"
                        >
                          {achievement.title}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
            {achievements.length > 0 && (
              <View className="px-6 pb-6">
                <TouchableOpacity
                  onPress={handleShareAll}
                  className="bg-[#0090C8] rounded-2xl py-4 flex-row items-center justify-center gap-3"
                >
                  <ShareIcon color="white" width={24} height={24} />
                  <Text className="text-white text-base" font="fustat-semibold">
                    Share All
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Reminder Section */}
          <View className="bg-white border border-[#E4E4E7] rounded-2xl p-6 gap-8 mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[#27272A] text-xl" font="fustat-bold">
                Reminder
              </Text>
              <Switch
                value={reminderEnabled}
                onValueChange={handleReminderToggle}
                trackColor={{ false: "#D4D4D8", true: "#0090C8" }}
                thumbColor="white"
              />
            </View>
            <View>
              <View className="flex-row items-center justify-between pb-4 border-b border-[#E4E4E7]">
                <Text className="text-[#52525B] text-base">
                  Reminder Schedule
                </Text>
                <View className="relative z-50">
                  <TouchableOpacity
                    onPress={handleReminderSchedule}
                    className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[118px] justify-between"
                  >
                    <Text
                      className="text-[#3F3F46] text-base"
                      font="fustat-medium"
                    >
                      {reminderSchedule}
                    </Text>
                    <ArrowDownIcon width={18} height={18} />
                  </TouchableOpacity>
                  {showReminderSchedule &&
                    renderDropdown(
                      reminderScheduleOptions,
                      reminderSchedule,
                      handleReminderScheduleSelect,
                      () => setShowReminderSchedule(false),
                    )}
                </View>
              </View>
              <View className="flex-row items-center justify-between pt-4">
                <Text className="text-[#52525B] text-base">Reminder Sound</Text>
                <View className="relative z-40">
                  <TouchableOpacity
                    onPress={() => {
                      setShowReminderSound(!showReminderSound);
                      setShowReminderSchedule(false);
                      setShowGender(false);
                    }}
                    className="flex-row items-center gap-2 w-[147px] justify-between"
                  >
                    <Text
                      className="text-[#3F3F46] text-base flex-1"
                      font="fustat-medium"
                      numberOfLines={1}
                    >
                      {reminderSound}
                    </Text>
                    <View style={{ transform: [{ rotate: "-90deg" }] }}>
                      <ArrowDownIcon width={18} height={18} />
                    </View>
                  </TouchableOpacity>
                  {showReminderSound &&
                    renderDropdown(
                      reminderSoundOptions,
                      reminderSound,
                      handleReminderSoundSelect,
                      () => setShowReminderSound(false),
                    )}
                </View>
              </View>
            </View>
          </View>

          {/* Personal Information Section */}
          <View className="bg-white border border-[#E4E4E7] rounded-2xl p-6 gap-6 mb-4">
            <Text className="text-[#27272A] text-xl" font="fustat-bold">
              Personal Information
            </Text>
            <View>
              <View className="flex-row items-center justify-between pb-4 border-b border-[#E4E4E7]">
                <Text className="text-[#52525B] text-base">Gender</Text>
                <View className="relative z-30">
                  <TouchableOpacity
                    onPress={() => {
                      setShowGender(!showGender);
                      setShowReminderSchedule(false);
                      setShowReminderSound(false);
                    }}
                    className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[130px] justify-between"
                  >
                    <Text
                      className="text-[#3F3F46] text-base"
                      font="fustat-medium"
                    >
                      {gender}
                    </Text>
                    <ArrowDownIcon width={18} height={18} />
                  </TouchableOpacity>
                  {showGender &&
                    renderDropdown(
                      genderOptions,
                      gender,
                      handleGenderSelect,
                      () => setShowGender(false),
                    )}
                </View>
              </View>
              <View className="flex-row items-center justify-between py-4 border-b border-[#E4E4E7]">
                <Text className="text-[#52525B] text-base">Weight</Text>
                <TouchableOpacity
                  onPress={() => {
                    setWeightInput(weight?.toString() || "");
                    setShowWeightModal(true);
                  }}
                  className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[130px] justify-between"
                >
                  <Text
                    className="text-[#27272A] text-base"
                    font="fustat-semibold"
                  >
                    {weight ?? ""}
                  </Text>
                  <Text className="text-[#52525B] text-base">kg</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center justify-between pt-4">
                <Text className="text-[#52525B] text-base">Daily Goal</Text>
                <TouchableOpacity
                  onPress={() => {
                    setDailyGoalInput(dailyGoal?.toString() || "");
                    setShowDailyGoalModal(true);
                  }}
                  className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[130px] justify-between"
                >
                  <Text
                    className="text-[#27272A] text-base"
                    font="fustat-semibold"
                  >
                    {dailyGoal ?? ""}
                  </Text>
                  <Text className="text-[#52525B] text-base">ml</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* My Cups Section */}
          <View className="bg-white border border-[#E4E4E7] rounded-2xl p-6 gap-6 mb-4">
            <Text className="text-[#27272A] text-xl" font="fustat-bold">
              My Cups
            </Text>
            <View className="gap-3">
              <View>
                {cups.map((cup, index) => (
                  <View
                    key={index}
                    className={`flex-row items-center gap-5 px-4 ${index < cups.length - 1
                      ? "pb-4 border-b border-[#E4E4E7]"
                      : "pt-4"
                      } ${index > 0 ? "pt-4" : ""}`}
                  >
                    <GlassIcon width={17} height={24} />
                    <View className="flex-1 flex-row items-center gap-2.5">
                      <Text
                        className="text-[#27272A] text-base"
                        font="fustat-bold"
                      >
                        {cup.name}
                      </Text>
                      <View
                        className="h-0 border-t border-[#E4E4E7]"
                        style={{
                          width: 10,
                          transform: [{ rotate: "90deg" }],
                        }}
                      />
                      <Text
                        className="text-[#52525B] text-xs"
                        font="fustat-medium"
                      >
                        {cup.volume} ml
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteCup(cup)}>
                      <TrashIcon width={18} height={18} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={handleAddCup}
                className="border border-[#D4D4D8] rounded-2xl py-4 flex-row items-center justify-center gap-2"
              >
                <AddIcon color="#0090C8" width={24} height={24} />
                <Text
                  className="text-[#0090C8] text-base"
                  font="fustat-semibold"
                >
                  Add Another
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* General Settings removed: units and activity level are fixed (ml/kg) */}

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            disabled={isLoggingOut}
            className={`border rounded-2xl py-4 flex-row items-center justify-center gap-2 ${isLoggingOut ? "border-[#D4D4D8] opacity-50" : "border-[#D4D4D8]"
              }`}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#C20E4D" />
            ) : (
              <>
                <LogoutIcon color="#C20E4D" width={24} height={24} />
                <Text
                  className="text-[#C20E4D] text-base"
                  font="fustat-semibold"
                >
                  Logout
                </Text>
              </>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </>
  );
}
