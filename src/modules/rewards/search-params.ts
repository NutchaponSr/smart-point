import { createLoader, parseAsFloat, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

export const sortValues = ["curated", "trending", "hot_and_new"] as const;

const params = {
  q: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(sortValues).withDefault("curated"),
  minCost: parseAsFloat.withDefault(0),
  maxCost: parseAsFloat.withDefault(0),
  star: parseAsInteger.withDefault(0),
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(1),
}

export const loadRewardFilters = createLoader(params);