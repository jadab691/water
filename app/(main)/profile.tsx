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
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const [reminderEnabled, setReminderEnabled] = useState(true);

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
    <ScrollView
      className="bg-[#FAFAFA]"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <SafeAreaView className="flex flex-col flex-1 justify-start px-6 pt-6">
        {/* Profile Header */}
        <View className="bg-white border border-[#E4E4E7] rounded-2xl flex-row items-center justify-between pl-4 pr-6 py-4 mb-6">
          <View className="flex-row items-center gap-4">
            <View className="bg-[#F8E150] border-2 border-[rgba(113,113,122,0.08)] rounded-xl overflow-hidden size-[60px]">
              <Image
                source={profile}
                className="size-[60px]"
                resizeMode="cover"
                style={{ marginLeft: 0.5, marginTop: -3 }}
              />
            </View>
            <View className="gap-1">
              <Text className="text-[#27272A] text-2xl" font="fustat-bold">
                Smith Rachel
              </Text>
              <Text className="text-[#52525B] text-base">Level-3</Text>
            </View>
          </View>
          <TouchableOpacity>
            <EditIcon />
          </TouchableOpacity>
        </View>

        {/* Achievements Section */}
        <View className="bg-white border border-[#E4E4E7] rounded-2xl p-6 gap-8 mb-4">
          <View className="gap-6">
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
          <TouchableOpacity className="bg-[#0090C8] rounded-2xl py-4 flex-row items-center justify-center gap-3">
            <ShareIcon color="white" width={24} height={24} />
            <Text className="text-white text-base" font="fustat-semibold">
              Share All
            </Text>
          </TouchableOpacity>
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
              <View className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[118px] justify-between">
                <Text className="text-[#3F3F46] text-base" font="fustat-medium">
                  30 min
                </Text>
                <ArrowDownIcon width={18} height={18} />
              </View>
            </View>
            <View className="flex-row items-center justify-between pt-4">
              <Text className="text-[#52525B] text-base">Reminder Sound</Text>
              <View className="flex-row items-center gap-2 w-[147px] justify-between">
                <Text
                  className="text-[#3F3F46] text-base flex-1"
                  font="fustat-medium"
                  numberOfLines={1}
                >
                  Water drop sound
                </Text>
                <View style={{ transform: [{ rotate: "-90deg" }] }}>
                  <ArrowDownIcon width={18} height={18} />
                </View>
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
              <View className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[130px] justify-between">
                <Text className="text-[#3F3F46] text-base" font="fustat-medium">
                  Male
                </Text>
                <ArrowDownIcon width={18} height={18} />
              </View>
            </View>
            <View className="flex-row items-center justify-between py-4 border-b border-[#E4E4E7]">
              <Text className="text-[#52525B] text-base">Weight</Text>
              <View className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[130px] justify-between">
                <Text
                  className="text-[#27272A] text-base"
                  font="fustat-semibold"
                >
                  84
                </Text>
                <Text className="text-[#52525B] text-base">kg</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between pt-4">
              <Text className="text-[#52525B] text-base">Daily Goal</Text>
              <View className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[130px] justify-between">
                <Text
                  className="text-[#27272A] text-base"
                  font="fustat-semibold"
                >
                  2000
                </Text>
                <Text className="text-[#52525B] text-base">ml</Text>
              </View>
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
                  <TouchableOpacity>
                    <TrashIcon width={18} height={18} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity className="border border-[#D4D4D8] rounded-2xl py-4 flex-row items-center justify-center gap-2">
              <AddIcon color="#0090C8" width={24} height={24} />
              <Text className="text-[#0090C8] text-base" font="fustat-semibold">
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
              <View className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[140px] justify-between">
                <Text className="text-[#3F3F46] text-base" font="fustat-medium">
                  ml
                </Text>
                <ArrowDownIcon width={18} height={18} />
              </View>
            </View>
            <View className="flex-row items-center justify-between py-4 border-b border-[#E4E4E7]">
              <Text className="text-[#52525B] text-base">Unit for Weight</Text>
              <View className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[140px] justify-between">
                <Text className="text-[#3F3F46] text-base" font="fustat-medium">
                  kg
                </Text>
                <ArrowDownIcon width={18} height={18} />
              </View>
            </View>
            <View className="flex-row items-center justify-between pt-4">
              <Text className="text-[#52525B] text-base">Activity Level</Text>
              <View className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-2 flex-row items-center gap-2 w-[140px] justify-between">
                <Text className="text-[#3F3F46] text-base" font="fustat-medium">
                  Medium
                </Text>
                <ArrowDownIcon width={18} height={18} />
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity className="border border-[#D4D4D8] rounded-2xl py-4 flex-row items-center justify-center gap-2">
          <LogoutIcon color="#C20E4D" width={24} height={24} />
          <Text className="text-[#C20E4D] text-base" font="fustat-semibold">
            Logout
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}
