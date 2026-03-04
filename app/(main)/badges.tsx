import {
  CheckCircleIcon,
  FifteenDayStreakIcon,
  NinetyDayStreakIcon,
  SevenDayStreakIcon,
  SixtyDayStreakIcon,
  ThirtyDayStreakIcon,
  ThreeDayStreakIcon,
} from "@/components/SVGIcons";
import Text from "@/components/Text";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type BadgeCardProps = {
  title: string;
  status: string;
  icon: React.ReactNode;
  completed?: boolean;
  badgeId: string;
  unlockDate?: string;
};

const BadgeCard = ({
  title,
  status,
  icon,
  completed,
  badgeId,
  unlockDate,
}: BadgeCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/(main)/badge-detail",
      params: {
        title,
        status,
        badgeId,
        unlockDate: unlockDate || "",
      },
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-1 bg-white border border-[#E4E4E7] rounded-xl p-6 items-center gap-4 min-w-[156px]"
    >
      <View
        className="w-[50px] h-[51px] items-center justify-center"
        style={{ opacity: completed ? 1 : 0.4 }}
      >
        {icon}
      </View>
      <View className="items-center gap-1">
        <Text
          className="text-[#27272A] text-base text-center"
          font="fustat-bold"
        >
          {title}
        </Text>
        <Text
          className="text-[#52525B] text-sm text-center"
          font="fustat-medium"
        >
          {status}
        </Text>
      </View>
      {completed && (
        <View className="absolute top-[7px] right-[7px]">
          <CheckCircleIcon />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function Badges() {
  const badges = [
    {
      title: "3-days Streak",
      status: "Completed",
      icon: <ThreeDayStreakIcon />,
      completed: true,
      badgeId: "3-days",
      unlockDate: "20 Jan, 2026",
    },
    {
      title: "7-days Streak",
      status: "Completed",
      icon: <SevenDayStreakIcon />,
      completed: true,
      badgeId: "7-days",
      unlockDate: "25 Jan, 2026",
    },
    {
      title: "15-days Streak",
      status: "Completed",
      icon: <FifteenDayStreakIcon />,
      completed: true,
      badgeId: "15-days",
      unlockDate: "2 Feb, 2026",
    },
    {
      title: "30-days Streak",
      status: "16/30",
      icon: <ThirtyDayStreakIcon />,
      completed: false,
      badgeId: "30-days",
    },
    {
      title: "60-days Streak",
      status: "16/60",
      icon: <SixtyDayStreakIcon />,
      completed: false,
      badgeId: "60-days",
    },
    {
      title: "90-days Streak",
      status: "16/90",
      icon: <NinetyDayStreakIcon />,
      completed: false,
      badgeId: "90-days",
    },
  ];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <SafeAreaView className="flex flex-col flex-1 justify-start bg-[#FAFAFA] px-6 pt-6">
        <Text className="text-[#27272A] text-2xl mb-6" font="fustat-bold">
          Achievements
        </Text>

        <View className="gap-4">
          {/* Row 1 */}
          <View className="flex-row gap-4">
            <BadgeCard {...badges[0]} />
            <BadgeCard {...badges[1]} />
          </View>

          {/* Row 2 */}
          <View className="flex-row gap-4">
            <BadgeCard {...badges[2]} />
            <BadgeCard {...badges[3]} />
          </View>

          {/* Row 3 */}
          <View className="flex-row gap-4">
            <BadgeCard {...badges[4]} />
            <BadgeCard {...badges[5]} />
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
