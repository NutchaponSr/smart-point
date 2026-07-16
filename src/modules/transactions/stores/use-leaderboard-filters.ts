import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

export const periodValues = ["30d", "fullTime"] as const;

const params = {
  q: parseAsString.withDefault(""),
  period: parseAsStringLiteral(periodValues).withDefault("fullTime"),
  division: parseAsArrayOf(parseAsString).withDefault([]),
  limit: parseAsInteger.withDefault(25),
  cursor: parseAsInteger.withDefault(0),
  page: parseAsInteger.withDefault(0),
};

export const useLeaderboardFilters = () => {
  return useQueryStates(params);
};
