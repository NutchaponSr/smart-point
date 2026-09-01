import { thaiDateKey } from "./program-rules";

export const FIRST_LOGIN_POINTS = 5;
export const LOGIN_STREAK_DAYS = 15;
export const LOGIN_STREAK_POINTS = 5;
export const MONTHLY_ACTIVE_POINTS = 5;
export const PRAISE_STREAK_MONTHS = 3;
export const PRAISE_STREAK_POINTS = 20;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function nextLoginStreak(input: {
  lastDailyBonus: number | null | undefined;
  currentStreak: number | null | undefined;
  nowMs: number;
}): {
  today: string;
  alreadyCheckedIn: boolean;
  isFirstLogin: boolean;
  loginStreak: number;
} {
  const today = thaiDateKey(input.nowMs);
  const lastKey =
    input.lastDailyBonus != null ? thaiDateKey(input.lastDailyBonus) : null;

  if (lastKey === today) {
    return {
      today,
      alreadyCheckedIn: true,
      isFirstLogin: false,
      loginStreak: input.currentStreak ?? 0,
    };
  }

  const yesterday = thaiDateKey(input.nowMs - MS_PER_DAY);
  const isFirstLogin = input.lastDailyBonus == null;
  const loginStreak =
    lastKey === yesterday ? (input.currentStreak ?? 0) + 1 : 1;

  return {
    today,
    alreadyCheckedIn: false,
    isFirstLogin,
    loginStreak,
  };
}

export function nextPraiseStreakMonths(
  filled: boolean,
  previous: number | null | undefined,
): number {
  return filled ? (previous ?? 0) + 1 : 0;
}

export function shouldAwardLoginStreak(loginStreak: number): boolean {
  return loginStreak > 0 && loginStreak % LOGIN_STREAK_DAYS === 0;
}

export function shouldAwardPraiseStreak(months: number): boolean {
  return months > 0 && months % PRAISE_STREAK_MONTHS === 0;
}
