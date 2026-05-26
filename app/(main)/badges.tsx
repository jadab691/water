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
import { apiClient } from "@/utils/api";
import { useUser } from "@clerk/expo";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

type BadgeApiItem = {
  badgeId?: string;
  badge_id?: string;
  id?: string;
  code?: string;
  title?: string;
  name?: string;
  status?: string;
  completed?: boolean;
  is_completed?: boolean;
  unlocked?: boolean;
  progress?: number;
  current?: number;
  streak?: number;
  value?: number;
  total?: number;
  target?: number;
  goal?: number;
  requirement?: number;
  unlockDate?: string;
  unlock_date?: string;
  unlocked_at?: string;
  date?: string;
  // numeric id if backend returns number-based badge id
  badgeNum?: number;
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

// Map numeric badge IDs (1-6) to their specific icons for quick lookup
const badgeIconMap: Record<number, React.ReactNode> = {
  1: <ThreeDayStreakIcon />,
  2: <SevenDayStreakIcon />,
  3: <FifteenDayStreakIcon />,
  4: <ThirtyDayStreakIcon />,
  5: <SixtyDayStreakIcon />,
  6: <NinetyDayStreakIcon />,
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getBadgeIcon = (badgeId: string, title: string): React.ReactNode => {
  // prefer numeric mapping when the backend provides a numeric id
  const parsed = Number(badgeId);
  if (Number.isFinite(parsed) && badgeIconMap[parsed])
    return badgeIconMap[parsed];

  const normalizedId = String(badgeId || title).toLowerCase();
  if (normalizedId.includes("3")) return <ThreeDayStreakIcon />;
  if (normalizedId.includes("7")) return <SevenDayStreakIcon />;
  if (normalizedId.includes("15")) return <FifteenDayStreakIcon />;
  if (normalizedId.includes("30")) return <ThirtyDayStreakIcon />;
  if (normalizedId.includes("60")) return <SixtyDayStreakIcon />;
  if (normalizedId.includes("90")) return <NinetyDayStreakIcon />;

  return <ThreeDayStreakIcon />;
};

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
        {progressText ? (
          <Text
            className="text-[#52525B] text-sm text-center"
            font="fustat-medium"
          >
            {progressText}
          </Text>
        ) : null}
        {statusText ? (
          <Text
            className="text-[#71717A] text-xs text-center"
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

export default function Badges() {
  const { user } = useUser();
  const [badges, setBadges] = useState<BadgeState[]>(() =>
    badgeCatalog.map((badge) => ({
      ...badge,
      completed: false,
      progressText: badge.target ? `0/${badge.target}` : undefined,
      statusText: "In progress",
    })),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const clerkUserId = user?.id || "";
  const { width } = useWindowDimensions();

  const buildDefaultBadges = useCallback((): BadgeState[] => {
    return badgeCatalog.map((badge) => ({
      ...badge,
      completed: false,
      progressText: badge.target ? `0/${badge.target}` : undefined,
      statusText: "In progress",
    }));
  }, []);

  const normalizeAchievements = useCallback((data: any): BadgeApiItem[] => {
    const items = Array.isArray(data?.achievements) ? data.achievements : [];

    return items.map((item: BadgeApiItem) => ({
      badgeId: String(
        item.badgeId || item.badge_id || item.id || item.code || "",
      ),
      // keep numeric id when available for direct mapping
      badgeNum: toNumber(
        item.badge_id ?? item.badgeId ?? item.id ?? item.code ?? 0,
      ),
      title: String(item.title || item.name || "Achievement"),
      status: item.status ? String(item.status) : "",
      completed: Boolean(
        item.completed ?? item.is_completed ?? item.unlocked ?? false,
      ),
      progress: toNumber(
        item.progress ??
          item.current ??
          item.streak ??
          item.value ??
          item.total ??
          0,
      ),
      target: toNumber(item.target ?? item.goal ?? item.requirement ?? 0),
      unlockDate: String(
        item.unlockDate ||
          item.unlock_date ||
          item.unlocked_at ||
          item.date ||
          "",
      ),
    }));
  }, []);

  const buildBadgesFromApi = useCallback(
    (data: any): BadgeState[] => {
      const normalized = normalizeAchievements(data);
      if (!normalized.length) return buildDefaultBadges();

      return normalized.map((item) => {
        const title = item.title || "Achievement";
        const completed = Boolean(item.completed);
        const target = item.target || 0;
        const progress = item.progress || 0;
        const progressText = target ? `${progress}/${target}` : undefined;
        const rawStatus = item.status
          ? item.status
          : completed
            ? "Completed"
            : "In progress";
        // avoid duplicating progress (e.g., "0/3") or showing the generic "In progress"
        const statusText =
          rawStatus === progressText || rawStatus === "In progress"
            ? undefined
            : rawStatus;
        const badgeNumber = item.badgeNum || toNumber(item.badgeId || "0");
        const badgeId = item.badgeId || title.toLowerCase();
        const rawUnlock = item.unlockDate || undefined;
        const unlockDate = rawUnlock
          ? new Date(rawUnlock).toLocaleDateString()
          : undefined;
        const icon = badgeIconMap[badgeNumber] ?? getBadgeIcon(badgeId, title);

        return {
          title,
          badgeId,
          target,
          icon,
          completed,
          progressText,
          statusText,
          unlockDate,
        };
      });
    },
    [buildDefaultBadges, normalizeAchievements],
  );

  const loadBadges = useCallback(async () => {
    if (!clerkUserId) {
      setBadges(buildDefaultBadges());
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.makeRequest(
        `/api/users/achievements?clerkUserId=${encodeURIComponent(clerkUserId)}`,
      );

      if (res.success) {
        setBadges(buildBadgesFromApi(res.data));
        console.log("Loaded achievements:", res.data);
        return;
      }

      setBadges(buildDefaultBadges());
    } catch (error) {
      console.error("Error loading achievements:", error);
      setBadges(buildDefaultBadges());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [buildBadgesFromApi, buildDefaultBadges, clerkUserId]);

  useFocusEffect(
    useCallback(() => {
      loadBadges();
    }, [loadBadges]),
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadBadges();
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
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <SafeAreaView className="flex flex-col flex-1 justify-start px-6 pt-6">
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
      </SafeAreaView>
    </ScrollView>
  );
}
