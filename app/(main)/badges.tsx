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
import { useAppAuth } from "@/utils/auth";
import {
  getLocalProfile,
  getLocalWaterLogs,
} from "@/utils/localDatabase";
import {
  buildStreakAchievements,
  type StreakAchievement,
} from "@/utils/offlineLogic";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type BadgeCardProps = {
  title: string;
  progressText?: string;
  statusText?: string;
  icon: React.ReactNode;
  completed?: boolean;
  badgeId: string;
  unlockDate?: string;
};

type BadgeDefinition = {
  title: string;
  badgeId: string;
  target: number;
  icon: React.ReactNode;
};

type BadgeState = BadgeDefinition & {
  progressText?: string;
  statusText?: string;
  completed: boolean;
  unlockDate?: string;
};

const badgeCatalog: BadgeDefinition[] = [
  {
    title: "3-days Streak",
    badgeId: "3-days",
    target: 3,
    icon: <ThreeDayStreakIcon />,
  },
  {
    title: "7-days Streak",
    badgeId: "7-days",
    target: 7,
    icon: <SevenDayStreakIcon />,
  },
  {
    title: "15-days Streak",
    badgeId: "15-days",
    target: 15,
    icon: <FifteenDayStreakIcon />,
  },
  {
    title: "30-days Streak",
    badgeId: "30-days",
    target: 30,
    icon: <ThirtyDayStreakIcon />,
  },
  {
    title: "60-days Streak",
    badgeId: "60-days",
    target: 60,
    icon: <SixtyDayStreakIcon />,
  },
  {
    title: "90-days Streak",
    badgeId: "90-days",
    target: 90,
    icon: <NinetyDayStreakIcon />,
  },
];

const BadgeCard = ({
  title,
  progressText,
  statusText,
  icon,
  completed = false,
  badgeId,
  unlockDate,
}: BadgeCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    if (!completed) return;

    router.push({
      pathname: "/(main)/badge-detail",
      params: {
        title,
        status: statusText || "",
        badgeId,
        unlockDate: unlockDate || "",
      },
    });
  };

  const CardWrapper = completed ? TouchableOpacity : View;

  const wrapperClass = completed
    ? "flex-1 bg-yellow-50 border border-yellow-300 rounded-xl p-6 items-center gap-4 min-w-[156px]"
    : "flex-1 bg-white border border-[#E4E4E7] rounded-xl p-6 items-center gap-4 min-w-[156px]";

  return (
    <CardWrapper
      {...(completed && { onPress: handlePress })}
      className={wrapperClass}
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
        {!completed && progressText ? (
          <Text
            className="text-[#52525B] text-sm text-center"
            font="fustat-medium"
          >
            {progressText}
          </Text>
        ) : null}
        {statusText ? (
          <Text
            className={
              completed
                ? "text-[#D97706] text-xs text-center"
                : "text-[#71717A] text-xs text-center"
            }
            font="fustat-medium"
          >
            {statusText}
          </Text>
        ) : null}
        {unlockDate ? (
          <Text
            className="text-[#A1A1AA] text-xs text-center"
            font="fustat-medium"
          >
            {unlockDate}
          </Text>
        ) : null}
      </View>
      {completed && (
        <View className="absolute top-[7px] right-[7px]">
          <CheckCircleIcon />
        </View>
      )}
    </CardWrapper>
  );
};

const buildDefaultBadges = (): BadgeState[] => {
  return badgeCatalog.map((badge) => ({
    ...badge,
    completed: false,
    progressText: badge.target ? `0/${badge.target}` : undefined,
    statusText: "In progress",
  }));
};

const buildBadges = (achievements: StreakAchievement[]): BadgeState[] =>
  badgeCatalog.map((badge) => {
    const progress = achievements.find(
      (achievement) => achievement.badgeId === badge.badgeId,
    );
    const completed = progress?.completed ?? false;
    const unlockDate = progress?.unlockDate;

    return {
      ...badge,
      completed,
      progressText: completed
        ? undefined
        : `${progress?.progress ?? 0}/${badge.target}`,
      statusText: completed ? "Completed" : undefined,
      unlockDate: unlockDate
        ? new Date(`${unlockDate}T12:00:00`).toLocaleDateString()
        : undefined,
    };
  });

export default function Badges() {
  const { user } = useAppAuth();
  const clerkUserId = user?.id || "";
  const { width } = useWindowDimensions();

  const [badges, setBadges] = useState<BadgeState[]>(() =>
    buildDefaultBadges(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBadges = useCallback(async () => {
    if (!clerkUserId) {
      setIsLoading(false);
      return;
    }

    try {
      const [profile, logs] = await Promise.all([
        getLocalProfile(clerkUserId),
        getLocalWaterLogs(clerkUserId),
      ]);
      setBadges(
        buildBadges(buildStreakAchievements(logs, profile.dailyGoalMl)),
      );
    } catch (error) {
      console.error("Error loading achievements:", error);
      Alert.alert("Error", "Unable to calculate your local achievements.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clerkUserId]);

  useFocusEffect(
    useCallback(() => {
      loadBadges();
    }, [loadBadges]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadBadges();
  }, [loadBadges]);

  const badgeRows = useMemo(() => {
    // breakpoints: mobile 2, tablet 3, desktop 6
    const cols = width >= 1024 ? 6 : width >= 768 ? 3 : 2;
    const rows: BadgeState[][] = [];
    for (let i = 0; i < badges.length; i += cols) {
      rows.push(badges.slice(i, i + cols));
    }
    return { rows, cols };
  }, [badges, width]);

  return (
    <ScrollView
      className="flex-1 bg-[#FAFAFA]"
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View className="flex flex-col flex-1 justify-start px-6 pt-2 pb-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-[#27272A] text-2xl" font="fustat-bold">
            Achievements
          </Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#0090C8" />
          ) : null}
        </View>

        <View className="gap-4">
          {badgeRows.rows.map((row, rowIndex) => (
            <View key={`badge-row-${rowIndex}`} className="flex-row gap-4">
              {row.map((badge) => (
                <BadgeCard key={badge.badgeId} {...badge} />
              ))}
              {row.length < (badgeRows.cols || 2) &&
                Array.from({ length: (badgeRows.cols || 2) - row.length }).map(
                  (_, i) => (
                    <View key={`spacer-${rowIndex}-${i}`} className="flex-1" />
                  ),
                )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
