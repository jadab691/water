import AddCupModal from "@/components/AddCupModal";
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
import { useAppAuth } from "@/utils/auth";
import {
  addLocalCup,
  deleteLocalCup,
  getLocalCups,
  getLocalProfile,
  getLocalWaterLogs,
  updateLocalProfile,
  type LocalCup,
  type LocalProfile,
} from "@/utils/localDatabase";
import { buildStreakAchievements } from "@/utils/offlineLogic";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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

type Cup = LocalCup;

const getAchievementIcon = (title: string) => {
  if (title.includes("15")) {
    return <FifteenDayStreakIcon width={50} height={51} />;
  }
  if (title.includes("7")) {
    return <SevenDayStreakIcon width={50} height={51} />;
  }
  return <ThreeDayStreakIcon width={50} height={51} />;
};

export default function Profile() {
  const { signOut, isLoaded: isUserLoaded, user } = useAppAuth();
  const achievementsCardRef = useRef<View>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const clerkUserId = user?.id || "";
  const clerkFirstName = user?.firstName;
  const clerkFullName = user?.fullName;
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState(
    () => user?.fullName || user?.firstName || "",
  );
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState<number | null>(null);
  const [dailyGoal, setDailyGoal] = useState<number | null>(2000);
  const [showAddCupModal, setShowAddCupModal] = useState(false);

  // Edit profile modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [showGender, setShowGender] = useState(false);
  // removed unit/activity dropdown states (units are fixed)

  // Input modal states
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showDailyGoalModal, setShowDailyGoalModal] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [dailyGoalInput, setDailyGoalInput] = useState("2000");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [cups, setCups] = useState<Cup[]>([]);

  const loadProfileData = useCallback(async () => {
    if (!clerkUserId) {
      setIsLoadingProfile(false);
      return;
    }

    if (loadedUserId !== clerkUserId) {
      setIsLoadingProfile(true);
      setProfileName(clerkFullName || clerkFirstName || "");
      setGender("");
      setWeight(null);
      setWeightInput("");
      setDailyGoal(2000);
      setDailyGoalInput("2000");
      setAchievements([]);
      setCups([]);
    }

    try {
      const [profile, localCups, logs] = await Promise.all([
        getLocalProfile(clerkUserId),
        getLocalCups(clerkUserId),
        getLocalWaterLogs(clerkUserId),
      ]);
      const unlocked = buildStreakAchievements(logs, profile.dailyGoalMl)
        .filter((achievement) => achievement.completed)
        .map((achievement) => ({
          icon: getAchievementIcon(achievement.title),
          title: achievement.title,
          date: achievement.unlockDate
            ? new Date(`${achievement.unlockDate}T12:00:00`).toLocaleDateString()
            : "",
        }));

      setProfileName(clerkFullName || clerkFirstName || "");
      setGender(profile.gender ?? "");
      setWeight(profile.weightKg);
      setWeightInput(profile.weightKg?.toString() ?? "");
      setDailyGoal(profile.dailyGoalMl);
      setDailyGoalInput(profile.dailyGoalMl.toString());
      setAchievements(unlocked);
      setCups(localCups);
      setLoadedUserId(clerkUserId);
    } catch (error) {
      console.error("Error loading local profile data:", error);
      Alert.alert("Error", "Unable to load your profile from this device.");
    } finally {
      setIsLoadingProfile(false);
      setIsRefreshing(false);
    }
  }, [
    clerkUserId,
    clerkFirstName,
    clerkFullName,
    loadedUserId,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (isUserLoaded) void loadProfileData();
    }, [isUserLoaded, loadProfileData]),
  );

  const handleGenderSelect = (value: string) => {
    void saveProfileData({ gender: value }).then((saved) => {
      if (saved) setGender(value);
    });
  };

  const saveProfileData = async (
    overrides?: Partial<LocalProfile>,
  ): Promise<boolean> => {
    if (!clerkUserId) return false;

    setIsSavingProfile(true);
    const updatedProfile: LocalProfile = {
      gender:
        overrides?.gender !== undefined ? overrides.gender : gender || null,
      weightKg:
        overrides?.weightKg !== undefined ? overrides.weightKg : weight,
      dailyGoalMl:
        overrides?.dailyGoalMl !== undefined
          ? overrides.dailyGoalMl
          : dailyGoal ?? 2000,
    };

    try {
      await updateLocalProfile(clerkUserId, updatedProfile);
      return true;
    } catch (error) {
      console.error("Error saving local profile:", error);
      Alert.alert("Error", "Unable to save your profile on this device.");
      return false;
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Dropdown options removed since reminder sound is deleted and schedule uses input modal

  const genderOptions: DropdownOption[] = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ];

  // unit and activity options removed (units fixed)

  const handleWeightSave = async () => {
    const value = Number(weightInput);
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert("Error", "Please enter a valid weight.");
      return;
    }

    if (await saveProfileData({ weightKg: value })) {
      setWeight(value);
      setShowWeightModal(false);
    }
  };

  const handleDailyGoalSave = async () => {
    const value = Number(dailyGoalInput);
    if (!Number.isInteger(value) || value <= 0) {
      Alert.alert("Error", "Please enter a positive whole-number goal.");
      return;
    }

    if (await saveProfileData({ dailyGoalMl: value })) {
      setDailyGoal(value);
      setShowDailyGoalModal(false);
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

  // handleReminderSchedule removed

  const handleEditProfile = () => {
    setEditName(profileName);
    setShowEditProfileModal(true);
  };

  const handleSaveEditProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Profile name cannot be empty.");
      return;
    }

    if (!user?.update) {
      Alert.alert("Error", "Your Clerk profile is not available.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const parts = editName.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
      await user.update({ firstName, lastName });
      setProfileName(editName.trim());
      setShowEditProfileModal(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating Clerk profile name:", error);
      Alert.alert("Error", "Unable to update your name in Clerk.");
    } finally {
      setIsSavingProfile(false);
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
          if (!clerkUserId) return;

          try {
            const deleted = await deleteLocalCup(clerkUserId, cup.id);
            if (!deleted) {
              Alert.alert("Error", "This cup could not be found.");
              return;
            }
            setCups((prev) => prev.filter((item) => item.id !== cup.id));
          } catch (error) {
            console.error("Error deleting local cup:", error);
            Alert.alert("Error", "Unable to delete this cup from your device.");
          }
        },
      },
    ]);
  };

  const handleAddCup = async () => {
    setShowAddCupModal(true);
  };

  const handleCreateCup = async (description: string, amount: string) => {
    if (!clerkUserId) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    const volume = parseInt(amount, 10);
    if (Number.isNaN(volume) || volume <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    const cupName = description.trim() || `Cup ${cups.length + 1}`;

    try {
      const createdCup = await addLocalCup(clerkUserId, cupName, volume);
      setCups((currentCups) => [...currentCups, createdCup]);
      setShowAddCupModal(false);
    } catch (error) {
      console.error("Error adding local cup:", error);
      Alert.alert("Error", "Unable to save this cup on your device.");
    }
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

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadProfileData();
  }, [loadProfileData]);

  if (isLoadingProfile && loadedUserId !== clerkUserId) {
    return (
      <View className="flex-1 bg-[#FAFAFA] justify-center items-center">
        <ActivityIndicator size="large" color="#0090C8" />
      </View>
    );
  }

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

      <AddCupModal
        visible={showAddCupModal}
        onClose={() => setShowAddCupModal(false)}
        onAdd={handleCreateCup}
        unit={"ml"}
        defaultCupNumber={cups.length + 1}
      />

      <ScrollView
        className="flex-1 bg-[#FAFAFA]"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex flex-col flex-1 justify-start px-6 pt-2 pb-6">
          {/* Profile Header */}
          <View className="bg-white border border-[#E4E4E7] rounded-2xl flex-row items-center justify-between pl-4 pr-6 py-4 mb-6">
            <View className="flex-row items-center gap-4 flex-1">
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
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {profileName ? (
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
                      {profileName.trim().charAt(0).toUpperCase()}
                    </Text>
                  ) : (
                    <FontAwesome name="user" size={20} color="white" />
                  )}
                </View>
              </LinearGradient>
              <View className="gap-1 flex-1">
                <Text 
                  className="text-[#27272A] text-2xl" 
                  font="fustat-bold" 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {profileName || ""}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleEditProfile} className="ml-4">
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
        </View>
      </ScrollView>
    </>
  );
}
