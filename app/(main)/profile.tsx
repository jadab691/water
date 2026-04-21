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
import { profile } from "@/utils/constants";
import { useAuth } from "@clerk/expo";
import * as Sharing from "expo-sharing";
import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
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

export default function Profile() {
  const { signOut } = useAuth();
  const achievementsCardRef = useRef<View>(null);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderSchedule, setReminderSchedule] = useState("30 min");
  const [reminderSound, setReminderSound] = useState("Water drop sound");
  const [gender, setGender] = useState("Male");
  const [weight, setWeight] = useState(84);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [waterUnit, setWaterUnit] = useState("ml");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [activityLevel, setActivityLevel] = useState("Medium");

  // Dropdown visibility states
  const [showReminderSchedule, setShowReminderSchedule] = useState(false);
  const [showReminderSound, setShowReminderSound] = useState(false);
  const [showGender, setShowGender] = useState(false);
  const [showWaterUnit, setShowWaterUnit] = useState(false);
  const [showWeightUnit, setShowWeightUnit] = useState(false);
  const [showActivityLevel, setShowActivityLevel] = useState(false);

  // Input modal states
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showDailyGoalModal, setShowDailyGoalModal] = useState(false);
  const [weightInput, setWeightInput] = useState(weight.toString());
  const [dailyGoalInput, setDailyGoalInput] = useState(dailyGoal.toString());

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

  const waterUnitOptions: DropdownOption[] = [
    { label: "ml", value: "ml" },
    { label: "oz", value: "oz" },
  ];

  const weightUnitOptions: DropdownOption[] = [
    { label: "kg", value: "kg" },
    { label: "lbs", value: "lbs" },
  ];

  const activityLevelOptions: DropdownOption[] = [
    { label: "Low", value: "Low" },
    { label: "Medium", value: "Medium" },
    { label: "High", value: "High" },
    { label: "Very High", value: "Very High" },
  ];

  const handleWeightSave = () => {
    const value = parseInt(weightInput);
    if (!isNaN(value) && value > 0) {
      setWeight(value);
      setShowWeightModal(false);
    }
  };

  const handleDailyGoalSave = () => {
    const value = parseInt(dailyGoalInput);
    if (!isNaN(value) && value > 0) {
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
          className={`px-4 py-3 ${
            index < options.length - 1 ? "border-b border-[#E4E4E7]" : ""
          } ${selectedValue === option.value ? "bg-[#F4F4F5]" : ""}`}
        >
          <Text
            className={`text-base ${
              selectedValue === option.value
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
    setShowWaterUnit(false);
    setShowWeightUnit(false);
    setShowActivityLevel(false);
  };

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Profile editing coming soon!");
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

  const handleDeleteCup = (cupName: string) => {
    Alert.alert("Delete Cup", `Are you sure you want to delete ${cupName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => console.log(`Deleted ${cupName}`),
      },
    ]);
  };

  const handleAddCup = () => {
    Alert.alert("Add Cup", "Add new cup coming soon!");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error("Error logging out:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const achievements = [
    {
      icon: <ThreeDayStreakIcon width={50} height={51} />,
      date: "24 Jan, 2026",
      title: "3-days Streak",
    },
    {
      icon: <SevenDayStreakIcon width={50} height={51} />,
      date: "31 Jan, 2026",
      title: "7-days Streak",
    },
    {
      icon: <FifteenDayStreakIcon width={50} height={51} />,
      date: "01 Feb, 2026",
      title: "15-days Streak",
    },
  ];

  const cups = [
    { name: "Glass", volume: "200ml" },
    { name: "Mug", volume: "300 ml" },
    { name: "Bottle M", volume: "500 ml" },
    { name: "Bottle L", volume: "1000 ml" },
  ];

  return (
    <>
      {/* Weight Input Modal */}
      {renderInputModal(
        showWeightModal,
        "Weight",
        weightInput,
        setWeightInput,
        handleWeightSave,
        () => setShowWeightModal(false),
        weightUnit,
      )}

      {/* Daily Goal Input Modal */}
      {renderInputModal(
        showDailyGoalModal,
        "Daily Goal",
        dailyGoalInput,
        setDailyGoalInput,
        handleDailyGoalSave,
        () => setShowDailyGoalModal(false),
        waterUnit,
      )}

      <ScrollView
        className="bg-[#FAFAFA]"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <SafeAreaView className="flex flex-col flex-1 justify-start px-6 pt-6">
          {/* Profile Header */}
          <View className="bg-white border border-[#E4E4E7] rounded-2xl flex-row items-center justify-between pl-4 pr-6 py-4 mb-6">
            <View className="flex-row items-center gap-4">
              <View className="border-2 border-[rgba(113,113,122,0.08)] rounded-xl overflow-hidden size-[60px]">
                <Image
                  source={profile}
                  className="size-[60px]"
                  resizeMode="cover"
                  style={{ marginLeft: 0.5, marginTop: -3 }}
                />
              </View>
              <View className="gap-1">
                <Text className="text-[#27272A] text-2xl" font="fustat-bold">
                  Ahsan Habib
                </Text>
                <Text className="text-[#52525B] text-base">Level-3</Text>
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
                {achievements.map((achievement, index) => (
                  <View
                    key={index}
                    className={`flex-row items-center gap-4 px-4 ${
                      index < achievements.length - 1
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
                ))}
              </View>
            </View>
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
          </View>

          {/* Reminder Section */}
          <View className="bg-white border border-[#E4E4E7] rounded-2xl p-6 gap-8 mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[#27272A] text-xl" font="fustat-bold">
                Reminder
              </Text>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
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
                      setReminderSchedule,
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
                      setShowWaterUnit(false);
                      setShowWeightUnit(false);
                      setShowActivityLevel(false);
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
                      setReminderSound,
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
                      setShowWaterUnit(false);
                      setShowWeightUnit(false);
                      setShowActivityLevel(false);
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
                    renderDropdown(genderOptions, gender, setGender, () =>
                      setShowGender(false),
                    )}
                </View>
              </View>
              <View className="flex-row items-center justify-between py-4 border-b border-[#E4E4E7]">
                <Text className="text-[#52525B] text-base">Weight</Text>
                <TouchableOpacity
                  onPress={() => {
                    setWeightInput(weight.toString());
                    setShowWeightModal(true);
                  }}
                  className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[130px] justify-between"
                >
                  <Text
                    className="text-[#27272A] text-base"
                    font="fustat-semibold"
                  >
                    {weight}
                  </Text>
                  <Text className="text-[#52525B] text-base">{weightUnit}</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center justify-between pt-4">
                <Text className="text-[#52525B] text-base">Daily Goal</Text>
                <TouchableOpacity
                  onPress={() => {
                    setDailyGoalInput(dailyGoal.toString());
                    setShowDailyGoalModal(true);
                  }}
                  className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[130px] justify-between"
                >
                  <Text
                    className="text-[#27272A] text-base"
                    font="fustat-semibold"
                  >
                    {dailyGoal}
                  </Text>
                  <Text className="text-[#52525B] text-base">{waterUnit}</Text>
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
                    className={`flex-row items-center gap-5 px-4 ${
                      index < cups.length - 1
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
                        {cup.volume}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteCup(cup.name)}>
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

          {/* General Settings Section */}
          <View className="bg-white border border-[#E4E4E7] rounded-2xl p-6 gap-6 mb-4">
            <Text className="text-[#27272A] text-xl" font="fustat-bold">
              General Settings
            </Text>
            <View>
              <View className="flex-row items-center justify-between pb-4 border-b border-[#E4E4E7]">
                <Text className="text-[#52525B] text-base">Unit for Water</Text>
                <View className="relative z-20">
                  <TouchableOpacity
                    onPress={() => {
                      setShowWaterUnit(!showWaterUnit);
                      setShowReminderSchedule(false);
                      setShowReminderSound(false);
                      setShowGender(false);
                      setShowWeightUnit(false);
                      setShowActivityLevel(false);
                    }}
                    className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[140px] justify-between"
                  >
                    <Text
                      className="text-[#3F3F46] text-base"
                      font="fustat-medium"
                    >
                      {waterUnit}
                    </Text>
                    <ArrowDownIcon width={18} height={18} />
                  </TouchableOpacity>
                  {showWaterUnit &&
                    renderDropdown(
                      waterUnitOptions,
                      waterUnit,
                      setWaterUnit,
                      () => setShowWaterUnit(false),
                    )}
                </View>
              </View>
              <View className="flex-row items-center justify-between py-4 border-b border-[#E4E4E7]">
                <Text className="text-[#52525B] text-base">
                  Unit for Weight
                </Text>
                <View className="relative z-10">
                  <TouchableOpacity
                    onPress={() => {
                      setShowWeightUnit(!showWeightUnit);
                      setShowReminderSchedule(false);
                      setShowReminderSound(false);
                      setShowGender(false);
                      setShowWaterUnit(false);
                      setShowActivityLevel(false);
                    }}
                    className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[140px] justify-between"
                  >
                    <Text
                      className="text-[#3F3F46] text-base"
                      font="fustat-medium"
                    >
                      {weightUnit}
                    </Text>
                    <ArrowDownIcon width={18} height={18} />
                  </TouchableOpacity>
                  {showWeightUnit &&
                    renderDropdown(
                      weightUnitOptions,
                      weightUnit,
                      setWeightUnit,
                      () => setShowWeightUnit(false),
                    )}
                </View>
              </View>
              <View className="flex-row items-center justify-between pt-4">
                <Text className="text-[#52525B] text-base">Activity Level</Text>
                <View className="relative">
                  <TouchableOpacity
                    onPress={() => {
                      setShowActivityLevel(!showActivityLevel);
                      setShowReminderSchedule(false);
                      setShowReminderSound(false);
                      setShowGender(false);
                      setShowWaterUnit(false);
                      setShowWeightUnit(false);
                    }}
                    className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[140px] justify-between"
                  >
                    <Text
                      className="text-[#3F3F46] text-base"
                      font="fustat-medium"
                    >
                      {activityLevel}
                    </Text>
                    <ArrowDownIcon width={18} height={18} />
                  </TouchableOpacity>
                  {showActivityLevel &&
                    renderDropdown(
                      activityLevelOptions,
                      activityLevel,
                      setActivityLevel,
                      () => setShowActivityLevel(false),
                    )}
                </View>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="border border-[#D4D4D8] rounded-2xl py-4 flex-row items-center justify-center gap-2"
          >
            <LogoutIcon color="#C20E4D" width={24} height={24} />
            <Text className="text-[#C20E4D] text-base" font="fustat-semibold">
              Logout
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </>
  );
}
