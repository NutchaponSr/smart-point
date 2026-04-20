import { parseAsInteger, parseAsStringLiteral, useQueryStates } from "nuqs";

export const periodValues = ["24hr", "7d", "30d", "fullTime"] as const;

const params = {
  period: parseAsStringLiteral(periodValues).withDefault("24hr"),
  limit: parseAsInteger.withDefault(25),
  cursor: parseAsInteger.withDefault(0),
};

export const useLeaderboardFilters = () => {
  return useQueryStates(params);
};
