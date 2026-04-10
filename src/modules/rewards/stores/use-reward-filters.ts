import { parseAsFloat, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

const sortValues = ["curated", "trending", "hot_and_new"] as const;

const params = {
  q: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(sortValues).withDefault("curated"),
  minCost: parseAsFloat.withDefault(0),
  maxCost: parseAsFloat.withDefault(0),
  star: parseAsInteger.withDefault(0),
}

export const useRewardFilters = () => {
  return useQueryStates(params);
}