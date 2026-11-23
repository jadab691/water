export type WaterLogRecord = {
  id: number;
  amount_ml: number;
  logged_at: string;
  notes: string;
};

export type DailyStats = {
  total_ml: number;
  goal_met: boolean;
  log_count: number;
};

export type WeeklyEntry = {
  date: string;
  day: string;
  value: number;
};

export type StreakAchievement = {
  badgeId: string;
  title: string;
  target: number;
  progress: number;
  completed: boolean;
  unlockDate?: string;
};

const streakTargets = [
  { badgeId: "3-days", title: "3-days Streak", target: 3 },
  { badgeId: "7-days", title: "7-days Streak", target: 7 },
  { badgeId: "15-days", title: "15-days Streak", target: 15 },
  { badgeId: "30-days", title: "30-days Streak", target: 30 },
  { badgeId: "60-days", title: "60-days Streak", target: 60 },
  { badgeId: "90-days", title: "90-days Streak", target: 90 },
];

export const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getLocalDayBounds = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export const getCurrentWeekBounds = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
};

export const calculateDailyStats = (
  logs: WaterLogRecord[],
  dailyGoalMl: number,
): DailyStats => {
  const total_ml = logs.reduce((total, log) => total + log.amount_ml, 0);
  return {
    total_ml,
    goal_met: total_ml >= dailyGoalMl,
    log_count: logs.length,
  };
};

export const buildWeeklyStats = (
  logs: WaterLogRecord[],
  date = new Date(),
): WeeklyEntry[] => {
  const { start } = getCurrentWeekBounds(date);
  const entries = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return {
      date: getLocalDateKey(day),
      day: day.toLocaleDateString("en-US", { weekday: "short" }),
      value: 0,
    };
  });
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));

  logs.forEach((log) => {
    const dateKey = getLocalDateKey(new Date(log.logged_at));
    const entry = byDate.get(dateKey);
    if (entry) entry.value += log.amount_ml;
  });

  return entries;
};

const dateOrdinal = (dateKey: string): number => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
};

export const buildStreakAchievements = (
  logs: WaterLogRecord[],
  dailyGoalMl: number,
  today = new Date(),
): StreakAchievement[] => {
  const todayKey = getLocalDateKey(today);
  const totalsByDate = new Map<string, number>();
  logs.forEach((log) => {
    const dateKey = getLocalDateKey(new Date(log.logged_at));
    totalsByDate.set(
      dateKey,
      (totalsByDate.get(dateKey) ?? 0) + log.amount_ml,
    );
  });

  const goalDates = [...totalsByDate.entries()]
    .filter(([dateKey, total]) => dateKey <= todayKey && total >= dailyGoalMl)
    .map(([dateKey]) => dateKey)
    .sort();
  const unlockDates = new Map<number, string>();
  let streak = 0;
  let previousOrdinal: number | null = null;

  for (const dateKey of goalDates) {
    const ordinal = dateOrdinal(dateKey);
    streak = previousOrdinal !== null && ordinal === previousOrdinal + 1
      ? streak + 1
      : 1;
    for (const badge of streakTargets) {
      if (streak >= badge.target && !unlockDates.has(badge.target)) {
        unlockDates.set(badge.target, dateKey);
      }
    }

    previousOrdinal = ordinal;
  }

  let currentStreak = 0;
  const latestGoalDate = goalDates[goalDates.length - 1];
  if (
    latestGoalDate &&
    dateOrdinal(todayKey) - dateOrdinal(latestGoalDate) <= 1
  ) {
    let expectedOrdinal = dateOrdinal(latestGoalDate);
    for (let index = goalDates.length - 1; index >= 0; index -= 1) {
      const ordinal = dateOrdinal(goalDates[index]);
      if (ordinal !== expectedOrdinal) break;
      currentStreak += 1;
      expectedOrdinal -= 1;
    }
  }

  return streakTargets.map((badge) => {
    const unlockDate = unlockDates.get(badge.target);
    return {
      ...badge,
      progress: Math.min(currentStreak, badge.target),
      completed: Boolean(unlockDate),
      ...(unlockDate ? { unlockDate } : {}),
    };
  });
};

export const generateOfflineGoalSuggestion = ({
  dailyGoalMl,
  weightKg,
  activityLevel,
}: {
  dailyGoalMl: number;
  weightKg: number;
  activityLevel: "low" | "moderate" | "high";
}) => {
  const activityAdjustment = {
    low: 0,
    moderate: 250,
    high: 500,
  }[activityLevel];
  const weightEstimate = weightKg * 30 + activityAdjustment;
  const recommendedMl = Math.round(
    Math.max(dailyGoalMl, weightEstimate) / 100,
  ) * 100;

  return {
    waterIntake: `${recommendedMl.toLocaleString()} ml`,
    recommendations: [
      "Drink regularly throughout the day instead of trying to catch up all at once.",
      `Your current goal is ${dailyGoalMl.toLocaleString()} ml; adjust it gradually based on your needs.`,
      "Reassess your plan on hotter days or when your activity level changes.",
    ],
    additionalTips:
      "This offline estimate uses your entered weight and activity level. It is general information, not medical advice; follow a clinician's guidance if you have a fluid restriction.",
  };
};
